import { Canvas3D } from "molstar/lib/mol-canvas3d/canvas3d";
import { StructureElement } from "molstar/lib/mol-model/structure/structure/element";
import { StructureProperties } from "molstar/lib/mol-model/structure/structure/properties";
import { PluginContext } from "molstar/lib/mol-plugin/context";
import { createPlugin } from "Molstar/mol-plugin-ui";
import { DefaultPluginUISpec } from "Molstar/mol-plugin-ui/spec";
import { createEmitter } from "ts-typed-events";
import HighlightFinderMolstarEvent, {
    MolstarAuthSeqIdExtractor
} from "./highlight-finder-molstar-event";
import { getStructureElementLoci } from "./molstar-utils";
import { StateObjectSelector } from "Molstar/mol-state";
import { Asset } from "molstar/lib/mol-util/assets";
import { Expression } from "molstar/lib/mol-script/language/expression";
import { StructureRepresentationBuiltInProps } from "molstar/lib/mol-plugin-state/helpers/structure-representation-params";
import { MolScriptBuilder } from "Molstar/mol-script/language/builder";
import { Loci as StructureLoci } from "Molstar/mol-model/structure/structure/element/loci";
import { Output, TrackFragment } from "uniprot-nightingale/src/types/accession";
import { Color } from "Molstar/mol-util/color";
import { Structure, StructureSelection } from "Molstar/mol-model/structure";
import { StateTransforms } from "molstar/lib/mol-plugin-state/transforms";
import { Script } from "molstar/lib/mol-script/script";
import { Bundle } from "molstar/lib/mol-model/structure/structure/element/bundle";
import { Loci } from "Molstar/mol-model/loci";
import { Highlight } from "uniprot-nightingale/src/manager/track-manager";
import { StructureConfig } from "../src/index";
import { mixFragmentColors } from "./fragment-color-mixer";
import { Mapping } from "uniprot-nightingale/src/types/mapping";
import HighlightFinderNightingaleEvent from "./highlight-finder-nightingale-event";
import $ from "jquery";
import { Residue } from "./types/residue";

type ExtraHiglight = {
    isVisible: boolean;
    selector: StateObjectSelector;
    readonly props: StructureRepresentationBuiltInProps;
    readonly expression: Expression;
    readonly key: string;
};

export default class MolstarPlugin {
    private readonly highlightFinderMolstarEvent: HighlightFinderMolstarEvent =
        new HighlightFinderMolstarEvent(new MolstarAuthSeqIdExtractor());
    private plugin: PluginContext;
    private readonly emitOnHover = createEmitter<Residue | null>();
    public readonly onHover = this.emitOnHover.event;
    private readonly emitOnHighlightChange = createEmitter<Highlight[]>();
    public readonly onHighlightChange = this.emitOnHighlightChange.event;
    private mouseOverHighlightedResidueInStructure?: StructureElement.Loci;
    private highlightedResidueInStructure?: Loci;
    private molecularSurfaceRepr?: StateObjectSelector;
    private cartoonRepr?: StateObjectSelector;
    private structureMapping: Mapping;
    private readonly emitOnStructureLoaded = createEmitter<void>();
    public readonly onStructureLoaded = this.emitOnStructureLoaded.event;

    private readonly highlightFinderNightingaleEvent: HighlightFinderNightingaleEvent =
        new HighlightFinderNightingaleEvent();
    private readonly slider: HTMLInputElement = $("<input/>").attr("type", "range")
        .attr("min", 1)
        .attr("max", 100)
        .attr("value", 50)[0] as HTMLInputElement;


    private structure: StateObjectSelector;

    constructor(private readonly target: HTMLElement) {
        this.plugin = createPlugin(
            $("<div/>").addClass("structure-viewer-wrapper").appendTo(target)[0],
            {
                ...DefaultPluginUISpec(),
                layout: {
                    initial: {
                        isExpanded: false,
                        showControls: false
                    }
                }
            }
        );
        this.target.append($("<div/>")
            .addClass("transparency-slider")
            .append(this.slider)[0]);
        this.slider.addEventListener("change", () => {
            this.setTransparency(this.slider.value);
        });

        $("<div/>").addClass("structure-viewer-header").append($("<i/>").addClass("fas fa-download fa-2x")).prependTo(this.target)


        this.plugin.canvas3d?.interaction.hover.subscribe((e: Canvas3D.HoverEvent) => {
            const structureElementLoci = getStructureElementLoci(e.current.loci);
            if (this.mouseOverHighlightedResidueInStructure && !structureElementLoci) {
                this.emitOnHover.emit(null);
                this.mouseOverHighlightedResidueInStructure = undefined;
            } else if (
                structureElementLoci &&
                (!this.mouseOverHighlightedResidueInStructure ||
                    !StructureElement.Loci.areEqual(
                        this.mouseOverHighlightedResidueInStructure,
                        structureElementLoci
                    ))
            ) {
                const structureElement = StructureElement.Stats.ofLoci(structureElementLoci);
                const location = structureElement.firstElementLoc;
                const residue: Residue = {
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
                this.emitOnHover.emit(residue);
            }
            const highlights = this.highlightFinderMolstarEvent.calculate(e, this.structureMapping);
            if (this.highlightedResidueInStructure) {
                this.plugin.managers.interactivity.lociHighlights.highlight({
                    loci: this.highlightedResidueInStructure
                });
            }
            this.emitOnHighlightChange(highlights);
        });
    }

    public async load(
        output: Output,
        config: StructureConfig,
        markedFragments: TrackFragment[],
        isBinary = false,
        assemblyId = ""
    ): Promise<void> {
        this.structureMapping = output.mapping;
        this.molecularSurfaceRepr = undefined;
        this.cartoonRepr = undefined;
        await this.plugin.clear();
        const loadedData: StateObjectSelector = await this.loadData(output, isBinary);
        const trajectory = await this.plugin.builders.structure.parseTrajectory(
            loadedData,
            output.format
        );
        const model = await this.plugin.builders.structure.createModel(trajectory);
        this.structure = await this.plugin.builders.structure.createStructure(
            model,
            assemblyId
                ? { name: "assembly", params: { id: assemblyId } }
                : { name: "model", params: {} }
        );
        let select: HTMLSelectElement | undefined;
        const extraHiglights = config.extrahighlights;
        const extraHiglightsSelectors: ExtraHiglight[] = [];
        if (extraHiglights && extraHiglights.length > 0) {
            const previousSelect = $(this.target)
                .find(".structure-viewer-header select")[0];
            console.log("prev sel " + previousSelect);
            console.log("target " + this.target);

            if (previousSelect) {
                $(previousSelect.parentNode!).remove();
            }
            select = $("<select/>").attr("name", "highlights")
                .attr("multiple", "multiple")[0] as HTMLSelectElement

            $(this.target)
                .find(".structure-viewer-header")
                .prepend($("<div/>").css("display", "inline-block").append(select))
                ;
            console.log("sel " + select);
            console.log("target " + this.target);
            console.log("$target " + $(this.target)[0]);
            console.log("$target.find " + $(this.target).find(".structure-viewer-header")[0]);
        }
        for (const key in extraHiglights) {
            const extraHighlight = extraHiglights[parseInt(key)];
            $(select!)
                .append($("<option/>").attr("value", key)
                    .attr("selected", "selected")
                    .text(extraHighlight.label))
                ;
            const filter: Record<string, Expression> = {};
            if (extraHighlight.residue) {
                filter["residue-test"] = MolScriptBuilder.core.rel.inRange([
                    MolScriptBuilder.struct.atomProperty.macromolecular.auth_seq_id(),
                    extraHighlight.residue.authResidueNumFrom,
                    extraHighlight.residue.authResidueNumTo
                ]);
            }
            if (extraHighlight.authChain) {
                filter["chain-test"] = MolScriptBuilder.core.set.has([
                    MolScriptBuilder.core.type.set(extraHighlight.authChain),
                    MolScriptBuilder.ammp("auth_asym_id")
                ]);
            }
            if (extraHighlight.authAtom) {
                filter["atom-test"] = MolScriptBuilder.core.set.has([
                    MolScriptBuilder.core.type.set(extraHighlight.authAtom),
                    MolScriptBuilder.ammp("auth_atom_id")
                ]);
            }
            const expression = MolScriptBuilder.struct.generator.atomGroups(filter);
            const highlightComponent =
                await this.plugin.builders.structure.tryCreateComponentFromExpression(
                    this.structure,
                    expression,
                    `extra-highlight-${key}`
                );
            extraHiglightsSelectors.push({
                selector: highlightComponent!,
                isVisible: true,
                props: extraHighlight.props,
                expression: expression,
                key: `extra-highlight-${key}`
            });
            await this.plugin.builders.structure.representation.addRepresentation(
                highlightComponent!,
                extraHighlight.props
            );
        }
        if (extraHiglights && extraHiglights.length > 0) {
            if (select) {
                $(select).multiselect({
                    buttonClass: "custom-select"
                });
                $(select).multiselect("setOptions", {
                    onChange: async (option: JQuery, checked: boolean) => {
                        const extraHighlight =
                            extraHiglightsSelectors[parseInt($(option).val() as string)];
                        if (!extraHighlight.isVisible && checked) {
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
                            const update = this.plugin.build();
                            update.delete(extraHighlight.selector);
                            update.commit();
                            extraHighlight.isVisible = false;
                        }
                    }
                });
            }
        }
        const polymer = await this.plugin.builders.structure.tryCreateComponentStatic(
            this.structure,
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
        if (polymer) {
            this.cartoonRepr =
                await this.plugin.builders.structure.representation.addRepresentation(polymer, {
                    type: "cartoon",
                    color: "chain-id"
                });
            this.molecularSurfaceRepr =
                await this.plugin.builders.structure.representation.addRepresentation(polymer, {
                    type: "molecular-surface",
                    typeParams: { alpha: 1 },
                    color: "uniform"
                });
            this.setTransparency(this.slider?.value);
            this.overpaintFragments(markedFragments);
            const data =
                this.plugin.managers.structure.hierarchy.current.structures[0]?.cell.obj?.data;
            if (data) {
                const filter: Record<string, Expression> = {
                    "residue-test": MolScriptBuilder.core.logic.not([
                        MolScriptBuilder.core.rel.inRange([
                            MolScriptBuilder.struct.atomProperty.macromolecular.auth_seq_id(),
                            Math.min(
                                ...this.structureMapping.fragmentMappings.map((fragment) => {
                                    return fragment.pdbStart;
                                })
                            ),
                            Math.max(
                                ...this.structureMapping.fragmentMappings.map((fragment) => {
                                    return fragment.pdbEnd;
                                })
                            )
                        ])
                    ])
                };
                const selection = Script.getStructureSelection(
                    MolScriptBuilder.struct.generator.atomGroups(filter),
                    data
                );
                const bundle = Bundle.fromSelection(selection);
                const update = this.plugin.build();
                update
                    .to(this.cartoonRepr)
                    .apply(
                        StateTransforms.Representation.OverpaintStructureRepresentation3DFromBundle,
                        {
                            layers: [
                                {
                                    bundle: bundle,
                                    color: Color(0x555555),
                                    clear: false
                                }
                            ]
                        }
                    );
                update.commit();
            }
            this.emitOnStructureLoaded.emit();
        }
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
    }

    private async loadData(output: Output, isBinary: boolean): Promise<StateObjectSelector> {
        let loadedData: StateObjectSelector;
        if (output.url) {
            loadedData = await this.plugin.builders.data.download(
                {
                    url: Asset.Url(output.url),
                    isBinary
                },
                { state: { isGhost: true } }
            );
        } else if (output.data) {
            loadedData = await this.plugin.builders.data.rawData(
                {
                    data: output.data
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
            this.mouseOverHighlightedResidueInStructure = this.findLociFromResidueNumber(resNum);
        } else {
            this.mouseOverHighlightedResidueInStructure = undefined;
        }
        this.highlightStructureResidues();
    }

    public handleResize(): void {
        this.plugin.handleResize();
    }

    public isStructureLoaded(): boolean {
        return !!this.cartoonRepr;
    }

    public focusInStructure(resNum: number, radius = 0, chain?: string): void {
        const loci = this.findLociFromResidueNumber(resNum, chain);
        if (loci) {
            this.plugin.managers.structure.focus.setFromLoci(loci);
            this.plugin.managers.camera.focusLoci(loci, { extraRadius: radius });
        }
    }

    public highlightInStructure(resNum: number): void {
        this.highlightedResidueInStructure = this.findLociFromResidueNumber(resNum);
        this.highlightStructureResidues();
    }

    public unhighlightInStructure(): void {
        this.highlightedResidueInStructure = undefined;
        this.plugin.managers.interactivity.lociHighlights.clearHighlights();
        if (this.mouseOverHighlightedResidueInStructure) {
            this.plugin.managers.interactivity.lociHighlights.highlightOnly({
                loci: this.mouseOverHighlightedResidueInStructure
            });
        }
    }

    public overpaintFragments(fragments: TrackFragment[]): void {
        if (!this.molecularSurfaceRepr || !this.cartoonRepr) return;
        const data = this.plugin.managers.structure.hierarchy.current.structures[0]?.cell.obj?.data;
        if (!data) return;
        const params: { bundle: StructureElement.Bundle; color: Color; clear: boolean }[] = [];
        mixFragmentColors(fragments).forEach((fragment) => {
            let fragmentStart = fragment.start;
            let fragmentEnd = fragment.end;
            const minMappedResidue = Math.min(
                ...this.structureMapping.fragmentMappings.map((mapping) => {
                    return mapping.from;
                })
            );
            const maxMappedResidue = Math.min(
                ...this.structureMapping.fragmentMappings.map((mapping) => {
                    return mapping.to;
                })
            );
            if (fragmentStart < minMappedResidue && fragmentEnd > maxMappedResidue) {
                fragmentStart = minMappedResidue;
                fragmentEnd = maxMappedResidue;
            }
            let startMapped = this.highlightFinderNightingaleEvent.calculate(
                fragmentStart,
                this.structureMapping
            );
            let endMapped = this.highlightFinderNightingaleEvent.calculate(
                fragmentEnd,
                this.structureMapping
            );
            if (!startMapped && endMapped) {
                startMapped =
                    this.highlightFinderNightingaleEvent.getStructurePositionOfFirstResidueInFragment(
                        fragmentEnd,
                        this.structureMapping
                    );
            } else if (!endMapped) {
                endMapped =
                    this.highlightFinderNightingaleEvent.getStructurePositionOfLastResidueInFragment(
                        fragmentStart,
                        this.structureMapping
                    );
            }
            if (startMapped && endMapped) {
                const sel = this.selectFragment(startMapped, endMapped, data);
                const bundle = Bundle.fromSelection(sel);
                params.push({
                    bundle: bundle,
                    color: Color(parseInt(fragment.color.slice(1), 16)),
                    clear: false
                });
            }
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
        if (this.highlightedResidueInStructure) {
            this.plugin.managers.interactivity.lociHighlights.highlight({
                loci: this.highlightedResidueInStructure
            });
        }
        if (this.mouseOverHighlightedResidueInStructure) {
            this.plugin.managers.interactivity.lociHighlights.highlight({
                loci: this.mouseOverHighlightedResidueInStructure
            });
        }
    }

    private selectFragment(from: number, to: number, data: Structure, chain?: string) {
        const filter: Record<string, Expression> = {
            "residue-test": MolScriptBuilder.core.rel.inRange([
                MolScriptBuilder.struct.atomProperty.macromolecular.auth_seq_id(),
                from,
                to
            ])
        };
        if (chain) {
            filter["chain-test"] = MolScriptBuilder.core.rel.eq([
                MolScriptBuilder.struct.atomProperty.macromolecular.auth_asym_id(),
                chain
            ]);
        }
        return Script.getStructureSelection(
            MolScriptBuilder.struct.generator.atomGroups(filter),
            data
        );
    }

    private findLociFromResidueNumber(
        resNum: number,
        chain?: string
    ): StructureElement.Loci | undefined {
        const data = this.plugin.managers.structure.hierarchy.current.structures[0]?.cell.obj?.data;
        if (data) {
            const position = this.highlightFinderNightingaleEvent.calculate(
                resNum,
                this.structureMapping
            );
            if (position) {
                const sel = this.selectFragment(position, position, data, chain);
                return StructureSelection.toLociWithSourceUnits(sel);
            }
        }
    }

    private setTransparency(value?: string) {
        if (!this.molecularSurfaceRepr || !this.molecularSurfaceRepr.obj || value === undefined)
            return;
        const parsedValue = parseFloat(value) / 100;
        const update = this.plugin.build();

        const structure = this.molecularSurfaceRepr.obj.data.sourceData;

        const loci = StructureLoci.all(structure.root);
        if (StructureLoci.isEmpty(loci)) {
            return;
        }

        const layer = {
            bundle: StructureElement.Bundle.fromLoci(loci),
            value: 1 - parsedValue
        };

        update
            .to(this.molecularSurfaceRepr)
            .apply(StateTransforms.Representation.TransparencyStructureRepresentation3DFromBundle, {
                layers: [layer]
            });

        update.commit();
        $(this.slider).attr("title", `Surface transparency:  ${parsedValue * 100}%`);
    }
}
