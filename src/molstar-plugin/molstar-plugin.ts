import { Canvas3D } from "molstar/lib/mol-canvas3d/canvas3d";
import { StructureElement } from "molstar/lib/mol-model/structure/structure/element";
import { StructureProperties } from "molstar/lib/mol-model/structure/structure/properties";
import { PluginContext } from "molstar/lib/mol-plugin/context";
import { createPlugin } from "Molstar/mol-plugin-ui";
import { DefaultPluginUISpec } from "Molstar/mol-plugin-ui/spec";
import { createEmitter } from "ts-typed-events";
import HighlightFinderMolstarEvent, {
    MolstarAuthIdExtractor,
    MolstarLabelIdExtractor
} from "./highlight-finder-molstar-event";
import { getStructureElementLoci } from "./molstar-utils";
import { StateObjectSelector } from "Molstar/mol-state";
import { Asset } from "molstar/lib/mol-util/assets";
import { Expression } from "molstar/lib/mol-script/language/expression";
import { StructureRepresentationBuiltInProps } from "molstar/lib/mol-plugin-state/helpers/structure-representation-params";
import { MolScriptBuilder } from "Molstar/mol-script/language/builder";
import { Loci as StructureLoci } from "Molstar/mol-model/structure/structure/element/loci";
import { StructureInfo, TrackFragment } from "uniprot-nightingale/lib/types/accession";
import { Color } from "Molstar/mol-util/color";
import { Structure, StructureSelection } from "Molstar/mol-model/structure";
import { StateTransforms } from "molstar/lib/mol-plugin-state/transforms";
import { Script } from "molstar/lib/mol-script/script";
import { Bundle } from "molstar/lib/mol-model/structure/structure/element/bundle";
import { Loci } from "Molstar/mol-model/loci";
import { mixFragmentColors } from "./fragment-color-mixer";
import { FragmentMapping } from "uniprot-nightingale/lib/types/mapping";
import HighlightFinderNightingaleEvent from "./highlight-finder-nightingale-event";
import $ from "jquery";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap";
import "bootstrap-multiselect";
import "bootstrap-multiselect/dist/css/bootstrap-multiselect.css";
import { MolstarResidue } from "../types/molstar-residue";
import { Highlight } from "uniprot-nightingale/lib/types/highlight";
import StructureViewer from "../structure-viewer";
import { PluginConfig } from "molstar/lib/mol-plugin/config";
require("Molstar/mol-plugin-ui/skin/light.scss");

type ExtraHiglight = {
    isVisible: boolean;
    selector: StateObjectSelector;
    readonly props: StructureRepresentationBuiltInProps;
    readonly expression: Expression;
    readonly key: string;
};

/**
 * Implementation of StructureViewer that is wrapping Mol* plugin.
 */
export default class MolstarPlugin implements StructureViewer<MolstarPluginConfig, MolstarResidue> {
    private highlightFinderMolstarEvent: Record<string, HighlightFinderMolstarEvent> = {
        auth: new HighlightFinderMolstarEvent(new MolstarAuthIdExtractor()),
        label: new HighlightFinderMolstarEvent(new MolstarLabelIdExtractor())
    };
    private readonly selectedHighlights: Set<string> = new Set();
    private plugin: PluginContext;
    private readonly emitOnHover = createEmitter<MolstarResidue | undefined>();
    public readonly onHover = this.emitOnHover.event;
    private readonly emitOnHighlightChange = createEmitter<Highlight[]>();
    public readonly onHighlightChange = this.emitOnHighlightChange.event;
    private mouseOverHighlightedResiduesInStructure: StructureElement.Loci[] = [];
    private highlightedResiduesInStructure: Loci[] = [];
    private structureInfo?: StructureInfo;
    private molecularSurfaceRepr?: StateObjectSelector;
    private cartoonRepr?: StateObjectSelector;
    private activeChainStructureMapping: FragmentMapping[];
    private readonly emitOnLoaded = createEmitter<void>();
    public readonly onLoaded = this.emitOnLoaded.event;

    private readonly highlightFinderNightingaleEvent: HighlightFinderNightingaleEvent =
        new HighlightFinderNightingaleEvent();
    private readonly slider: HTMLInputElement = $("<input/>")
        .attr("type", "range")
        .attr("min", 1)
        .attr("max", 100)
        .attr("value", 50)[0] as HTMLInputElement;

    private structure: StateObjectSelector;
    private notMappedMolecularSurfaceRepresentation?: StateObjectSelector;

    constructor(private readonly target: HTMLElement) {
        this.plugin = createPlugin(
            $("<div/>").addClass("ma-structure-viewer-wrapper").appendTo(target)[0],
            {
                ...DefaultPluginUISpec(),
                layout: {
                    initial: {
                        isExpanded: false,
                        showControls: false
                    }
                },
                config: [[PluginConfig.Viewport.ShowControls, false]]
            }
        );

        //transparency slider to adjust molecular surface transparency
        this.target.append($("<div/>").addClass("ma-transparency-slider").append(this.slider)[0]);
        this.slider.addEventListener("change", () => {
            this.setTransparency(this.slider.value);
        });

        $("<div/>").addClass("ma-structure-viewer-header").prependTo(this.target);

        //listens for hover event over anything on Mol* plugin and then it determines
        //if it is loci of type StructureElement. If it is StructureElement then it
        //propagates this event from MolstarPlugin transformed as MolstarResidue.
        this.plugin.canvas3d?.interaction.hover.subscribe((event: Canvas3D.HoverEvent) => {
            const structureElementLoci = getStructureElementLoci(event.current.loci);
            if (this.mouseOverHighlightedResiduesInStructure.length > 0 && !structureElementLoci) {
                this.emitOnHover.emit(undefined);
                this.mouseOverHighlightedResiduesInStructure = [];
                this.updateHighlight(event);
            } else if (
                structureElementLoci &&
                (this.mouseOverHighlightedResiduesInStructure.length == 0 ||
                    (this.mouseOverHighlightedResiduesInStructure.length == 1 &&
                        !StructureElement.Loci.areEqual(
                            this.mouseOverHighlightedResiduesInStructure[0],
                            structureElementLoci
                        )))
            ) {
                const structureElement = StructureElement.Stats.ofLoci(structureElementLoci);
                const location = structureElement.firstElementLoc;
                const residue: MolstarResidue = {
                    authName: StructureProperties.atom.auth_comp_id(location),
                    name: StructureProperties.atom.label_comp_id(location),
                    isHet: StructureProperties.residue.hasMicroheterogeneity(location),
                    insCode: StructureProperties.residue.pdbx_PDB_ins_code(location),
                    index: StructureProperties.residue.key(location),
                    seqNumber: StructureProperties.residue.label_seq_id(location),
                    authSeqNumber: StructureProperties.residue.auth_seq_id(location),
                    chain: {
                        asymId: StructureProperties.chain.label_asym_id(location),
                        authAsymId: StructureProperties.chain.auth_asym_id(location),
                        entity: {
                            entityId: StructureProperties.entity.id(location),
                            index: StructureProperties.entity.key(location)
                        },
                        index: StructureProperties.chain.key(location)
                    }
                };
                this.mouseOverHighlightedResiduesInStructure = [structureElementLoci];
                this.emitOnHover.emit(residue);
                this.updateHighlight(event);
            }
        });
    }
    /**
     * Maps structure index from event to sequence index and emits it as
     * highlight event.
     */
    private updateHighlight(event: Canvas3D.HoverEvent) {
        if (this.structureInfo) {
            const highlights = this.highlightFinderMolstarEvent[
                this.structureInfo.idType
            ].calculate(event, this.structureInfo.mapping);
            this.highlightedResiduesInStructure.forEach((loci) => {
                this.plugin.managers.interactivity.lociHighlights.highlight({
                    loci: loci
                });
            });
            this.emitOnHighlightChange(highlights);
        }
    }

    public getOuterElement(): HTMLElement {
        return this.target;
    }

    /**
     * Creates visualization based on the Structure info and config. Config
     * is specific for MolstarPlugin and can contain user defined highlights
     */
    public async load(structureInfo: StructureInfo, config: MolstarPluginConfig): Promise<void> {
        const chainMapping = structureInfo.mapping[structureInfo.chain];
        if (!chainMapping) {
            throw Error(`No mapping for ${structureInfo.pdbId} ${structureInfo.chain}`);
        }
        this.activeChainStructureMapping = chainMapping.fragmentMappings;
        this.structureInfo = structureInfo;
        this.molecularSurfaceRepr = undefined;
        this.cartoonRepr = undefined;
        await this.plugin.clear();
        const loadedData: StateObjectSelector = await this.loadData(structureInfo);
        const trajectory = await this.plugin.builders.structure.parseTrajectory(
            loadedData,
            structureInfo.format
        );
        const model = await this.plugin.builders.structure.createModel(trajectory);
        this.structure = await this.plugin.builders.structure.createStructure(model);
        let select: HTMLSelectElement | undefined;
        const extraHighlights = config.extraHighlights;
        const extraHiglightsSelectors: ExtraHiglight[] = [];

        //Creates multiselect component if there are any user highlights
        if (extraHighlights && extraHighlights.length > 0) {
            const previousSelect = $(this.target).find(".ma-structure-viewer-header select")[0];

            if (previousSelect) {
                $(previousSelect.parentNode!).remove();
            }
            select = $("<select/>")
                .attr("name", "highlights")
                .attr("multiple", "multiple")[0] as HTMLSelectElement;

            $(this.target)
                .find(".ma-structure-viewer-header")
                .prepend($("<div/>").css("display", "inline-block").append(select));
        }
        for (const key in extraHighlights) {
            const highlightKey = `extra-highlight-${key}`;
            const extraHighlight = extraHighlights[parseInt(key)];
            $(select!).append(
                $("<option/>")
                    .attr("value", key)
                    .prop("selected", this.selectedHighlights.has(highlightKey))
                    .text(extraHighlight.label)
            );

            const filter: Record<string, Expression> = {};
            if (extraHighlight.residue) {
                filter["residue-test"] = MolScriptBuilder.core.rel.inRange([
                    this.getFilterTypeSeq(),
                    extraHighlight.residue.residueNumFrom,
                    extraHighlight.residue.residueNumTo
                ]);
            }
            if (extraHighlight.chain) {
                filter["chain-test"] = MolScriptBuilder.core.set.has([
                    MolScriptBuilder.core.type.set(extraHighlight.chain),
                    this.getFilterTypeAsym()
                ]);
            }
            if (extraHighlight.atom) {
                filter["atom-test"] = MolScriptBuilder.core.set.has([
                    MolScriptBuilder.core.type.set(extraHighlight.atom),
                    this.getFilterTypeAtom()
                ]);
            }
            const expression = MolScriptBuilder.struct.generator.atomGroups(filter);
            const highlightComponent =
                await this.plugin.builders.structure.tryCreateComponentFromExpression(
                    this.structure,
                    expression,
                    highlightKey
                );
            extraHiglightsSelectors.push({
                selector: highlightComponent!,
                isVisible: this.selectedHighlights.has(highlightKey),
                props: extraHighlight.props,
                expression: expression,
                key: highlightKey
            });
            if (this.selectedHighlights.has(highlightKey)) {
                //if there are selected highlights in select component from previously
                //loaded structure
                await this.plugin.builders.structure.representation.addRepresentation(
                    highlightComponent!,
                    extraHighlight.props
                );
            }
        }
        if (extraHighlights && extraHighlights.length > 0) {
            if (select) {
                $(select).multiselect({
                    buttonClass: "custom-select"
                });
                $(select).multiselect("setOptions", {
                    //when selected different extra highlights from our multiselect
                    //component it updates 3D visualization
                    onChange: async (option: JQuery, checked: boolean) => {
                        const extraHighlight =
                            extraHiglightsSelectors[parseInt($(option).val() as string)];
                        if (!extraHighlight.isVisible && checked) {
                            this.selectedHighlights.add(extraHighlight.key);
                            const highlightComponent =
                                await this.plugin.builders.structure.tryCreateComponentFromExpression(
                                    this.structure,
                                    extraHighlight.expression,
                                    extraHighlight.key
                                );
                            extraHighlight.selector = highlightComponent!;
                            await this.plugin.builders.structure.representation.addRepresentation(
                                highlightComponent!,
                                extraHighlight.props
                            );
                            extraHighlight.isVisible = true;
                        } else if (extraHighlight.isVisible && !checked) {
                            this.selectedHighlights.delete(extraHighlight.key);
                            const update = this.plugin.build();
                            update.delete(extraHighlight.selector);
                            update.commit();
                            extraHighlight.isVisible = false;
                        }
                    }
                });
            }
        }
        const loaded = await this.createRepresentations();
        this.setTransparency(this.slider?.value);
        if (loaded) {
            this.emitOnLoaded.emit();
        }
    }

    /**
     * It creates Mol* representations (3D objects) based on our StructureInfo object
     * Unmapped parts are colored gray and rest has default color.
     */
    private async createRepresentations() {
        let expressions: Expression[] = [];
        if (this.structureInfo) {
            Object.entries(this.structureInfo!.mapping).forEach(([chainId, chainMapping]) => {
                const chainExpressions = chainMapping.fragmentMappings.map((fragment) => {
                    return MolScriptBuilder.core.logic.and([
                        MolScriptBuilder.core.rel.inRange([
                            this.getFilterTypeSeq(),
                            fragment.structureStart,
                            fragment.structureEnd
                        ]),
                        MolScriptBuilder.core.rel.eq([
                            this.getFilterTypeAsym(),
                            this.structureInfo?.format == "mmcif"
                                ? chainMapping.structAsymId
                                : chainId
                        ])
                    ]);
                });
                expressions = expressions.concat(chainExpressions);
            });
        }
        const mappedExpression = MolScriptBuilder.core.logic.or(expressions);
        const polymerSelector = await this.plugin.builders.structure.tryCreateComponentStatic(
            this.structure,
            "polymer"
        );
        if (polymerSelector) {
            const mappedPolymer =
                await this.plugin.builders.structure.tryCreateComponentFromExpression(
                    polymerSelector.ref,
                    MolScriptBuilder.struct.generator.atomGroups({
                        "residue-test": mappedExpression
                    }),
                    "polymer"
                );
            const ligand = await this.plugin.builders.structure.tryCreateComponentStatic(
                this.structure,
                "ligand"
            );
            const lipid = await this.plugin.builders.structure.tryCreateComponentStatic(
                this.structure,
                "lipid"
            );
            const water = await this.plugin.builders.structure.tryCreateComponentStatic(
                this.structure,
                "water"
            );
            if (ligand) {
                await this.plugin.builders.structure.representation.addRepresentation(ligand, {
                    type: "ball-and-stick",
                    color: "element-symbol"
                });
            }
            if (lipid) {
                await this.plugin.builders.structure.representation.addRepresentation(lipid, {
                    type: "ball-and-stick",
                    color: "element-symbol"
                });
            }
            if (water) {
                await this.plugin.builders.structure.representation.addRepresentation(water, {
                    type: "ball-and-stick",
                    color: "element-symbol"
                });
            }
            const notMappedComponent =
                await this.plugin.builders.structure.tryCreateComponentFromExpression(
                    polymerSelector.ref,
                    MolScriptBuilder.struct.generator.atomGroups({
                        "residue-test": MolScriptBuilder.core.logic.not([mappedExpression])
                    }),
                    "not mapped"
                );
            if (notMappedComponent) {
                await this.plugin.builders.structure.representation.addRepresentation(
                    notMappedComponent,
                    {
                        type: "cartoon",
                        typeParams: { alpha: 1 },
                        color: "uniform",
                        colorParams: { value: 0x666666 },
                        size: "uniform"
                    }
                );
                this.notMappedMolecularSurfaceRepresentation =
                    await this.plugin.builders.structure.representation.addRepresentation(
                        notMappedComponent!,
                        {
                            type: "molecular-surface",
                            typeParams: { alpha: 1 },
                            color: "uniform"
                        }
                    );
            }
            if (mappedPolymer) {
                this.cartoonRepr =
                    await this.plugin.builders.structure.representation.addRepresentation(
                        mappedPolymer,
                        {
                            type: "cartoon",
                            color: "chain-id"
                        }
                    );
                this.molecularSurfaceRepr =
                    await this.plugin.builders.structure.representation.addRepresentation(
                        mappedPolymer,
                        {
                            type: "molecular-surface",
                            typeParams: { alpha: 1 },
                            color: "uniform"
                        }
                    );
                return true;
            }
        }
    }

    private async loadData(structureInfo: StructureInfo): Promise<StateObjectSelector> {
        let loadedData: StateObjectSelector;
        if (structureInfo.url) {
            loadedData = await this.plugin.builders.data.download(
                {
                    url: Asset.Url(structureInfo.url)
                },
                { state: { isGhost: true } }
            );
        } else if (structureInfo.data) {
            loadedData = await this.plugin.builders.data.rawData(
                {
                    data: structureInfo.data
                },
                { state: { isGhost: true } }
            );
        } else {
            throw new Error("Structure url or data were not provided!");
        }
        return loadedData;
    }

    public highlightMouseOverResidue(resNum?: number): void {
        if (resNum) {
            this.mouseOverHighlightedResiduesInStructure = this.findLocisFromResidueNumber(resNum);
        } else {
            this.mouseOverHighlightedResiduesInStructure = [];
        }
        this.highlightStructureResidues();
    }

    public handleResize(): void {
        this.plugin.handleResize();
    }

    public isLoaded(): boolean {
        return !!this.cartoonRepr;
    }

    public focus(resNum: number, chain?: string, radius = 0): void {
        const locis = this.findLocisFromResidueNumber(resNum, chain);
        if (locis[0]) {
            this.plugin.managers.structure.focus.setFromLoci(locis[0]);
            this.plugin.managers.camera.focusLoci(locis[0], { extraRadius: radius });
        }
    }

    public highlight(resNum: number, chain?: string): void {
        this.highlightedResiduesInStructure = this.findLocisFromResidueNumber(resNum, chain);
        this.highlightStructureResidues();
    }

    /**
     * Unhighlights all highlights except mouse over highlights and user extra highlights
     */
    public unhighlight(): void {
        this.highlightedResiduesInStructure = [];
        this.plugin.managers.interactivity.lociHighlights.clearHighlights();
        this.mouseOverHighlightedResiduesInStructure.forEach((loci) => {
            this.plugin.managers.interactivity.lociHighlights.highlight({
                loci: loci
            });
        });
    }

    /**
     * Highlights given ranges using mixed colors if they overlap.
     */
    public overpaintFragments(fragments: TrackFragment[]): void {
        if (!this.molecularSurfaceRepr || !this.cartoonRepr) return;
        const data = this.plugin.managers.structure.hierarchy.current.structures[0]?.cell.obj?.data;
        if (!data) return;
        const params: { bundle: StructureElement.Bundle; color: Color; clear: boolean }[] = [];
        mixFragmentColors(fragments).forEach((fragment) => {
            let fragmentStart = fragment.sequenceStart;
            let fragmentEnd = fragment.sequenceEnd;
            const minMappedResidue = Math.min(
                ...this.activeChainStructureMapping.map((mapping) => {
                    return mapping.sequenceStart;
                })
            );
            const maxMappedResidue = Math.min(
                ...this.activeChainStructureMapping.map((mapping) => {
                    return mapping.sequenceEnd;
                })
            );
            if (fragmentStart < minMappedResidue && fragmentEnd > maxMappedResidue) {
                fragmentStart = minMappedResidue;
                fragmentEnd = maxMappedResidue;
            }
            const rangesForChains: Map<string, [number, number][]> =
                this.highlightFinderNightingaleEvent.calculateFromRange(
                    fragmentStart,
                    fragmentEnd,
                    this.structureInfo?.mapping
                );
            rangesForChains.forEach((ranges, chain) => {
                ranges.forEach((range) => {
                    const sel = this.selectFragment(range[0], range[1], data, chain);
                    const bundle = Bundle.fromSelection(sel);
                    params.push({
                        bundle: bundle,
                        color: Color(parseInt(fragment.color.slice(1), 16)),
                        clear: false
                    });
                });
            });
        });
        const update = this.plugin.build();
        update
            .to(this.molecularSurfaceRepr)
            .apply(StateTransforms.Representation.OverpaintStructureRepresentation3DFromBundle, {
                layers: params
            });
        update
            .to(this.cartoonRepr)
            .apply(StateTransforms.Representation.OverpaintStructureRepresentation3DFromBundle, {
                layers: params
            });
        update.commit();
    }

    private highlightStructureResidues(): void {
        this.plugin.managers.interactivity.lociHighlights.clearHighlights();
        this.highlightedResiduesInStructure.forEach((loci) => {
            this.plugin.managers.interactivity.lociHighlights.highlight({
                loci: loci
            });
        });
        this.mouseOverHighlightedResiduesInStructure.forEach((loci) => {
            this.plugin.managers.interactivity.lociHighlights.highlight({
                loci: loci
            });
        });
    }

    /**
     * Create selection for given range in (optionally) given chain from structure.
     */
    private selectFragment(
        from: number,
        to: number,
        structure: Structure,
        chain?: string
    ): StructureSelection {
        const filter: Record<string, Expression> = {
            "residue-test": MolScriptBuilder.core.rel.inRange([this.getFilterTypeSeq(), from, to])
        };
        if (chain) {
            filter["chain-test"] = MolScriptBuilder.core.rel.eq([this.getFilterTypeAsym(), chain]);
        }
        return Script.getStructureSelection(
            MolScriptBuilder.struct.generator.atomGroups(filter),
            structure
        );
    }

    private getFilterTypeSeq() {
        if (this.structureInfo) {
            switch (this.structureInfo.idType) {
                case "label":
                    return MolScriptBuilder.struct.atomProperty.macromolecular.label_seq_id();
                case "auth":
                    return MolScriptBuilder.struct.atomProperty.macromolecular.auth_seq_id();
            }
        }
        throw new Error("No structureInfo or unknown id type");
    }
    private getFilterTypeAsym() {
        if (this.structureInfo) {
            switch (this.structureInfo.idType) {
                case "label":
                    return MolScriptBuilder.struct.atomProperty.macromolecular.label_asym_id();
                case "auth":
                    return MolScriptBuilder.struct.atomProperty.macromolecular.auth_asym_id();
            }
        }
        throw new Error("No structureInfo or unknown id type");
    }
    private getFilterTypeAtom() {
        if (this.structureInfo) {
            switch (this.structureInfo.idType) {
                case "label":
                    return MolScriptBuilder.struct.atomProperty.macromolecular.label_atom_id();
                case "auth":
                    return MolScriptBuilder.struct.atomProperty.macromolecular.auth_atom_id();
            }
        }
        throw new Error("No structureInfo or unknown id type");
    }

    private findLocisFromResidueNumber(resNum: number, chain?: string): StructureElement.Loci[] {
        const data = this.plugin.managers.structure.hierarchy.current.structures[0]?.cell.obj?.data;
        if (data) {
            const positionForChain = this.highlightFinderNightingaleEvent.calculate(
                resNum,
                this.structureInfo?.mapping,
                this.structureInfo?.format
            );
            const locis: StructureElement.Loci[] = [];
            positionForChain.forEach((position, chainId) => {
                if (!chain || chain == chainId) {
                    locis.push(
                        StructureSelection.toLociWithSourceUnits(
                            this.selectFragment(position, position, data, chainId)
                        )
                    );
                }
            });
            return locis;
        }
        return [];
    }

    /**
     * Adjust transparency of molecular surface using molstar api
     */
    private setTransparency(value?: string) {
        if (value === undefined) return;
        const parsedValue = parseFloat(value) / 100;
        this.updateRepresentationTransparency(parsedValue, this.molecularSurfaceRepr);
        this.updateRepresentationTransparency(
            parsedValue,
            this.notMappedMolecularSurfaceRepresentation
        );
        $(this.slider).attr("title", `Surface transparency:  ${parsedValue * 100}%`);
    }
    private updateRepresentationTransparency(
        transparencyValue: number,
        representation?: StateObjectSelector
    ) {
        if (!representation || !representation.obj) return;
        const update = this.plugin.build();

        const structure = representation.obj.data.sourceData;

        const loci = StructureLoci.all(structure.root);
        if (StructureLoci.isEmpty(loci)) {
            return;
        }

        const layer = {
            bundle: StructureElement.Bundle.fromLoci(loci),
            value: 1 - transparencyValue
        };

        update
            .to(representation)
            .apply(StateTransforms.Representation.TransparencyStructureRepresentation3DFromBundle, {
                layers: [layer]
            });

        update.commit();
    }
}

export type MolstarPluginConfig = {
    extraHighlights: {
        label: string;
        props: StructureRepresentationBuiltInProps;
        residue?: {
            residueNumFrom: number;
            residueNumTo: number;
        };
        chain?: string[];
        atom?: string[];
    }[];
};
