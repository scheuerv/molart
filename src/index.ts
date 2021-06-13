import { createPlugin } from "Molstar/mol-plugin-ui";
import { DefaultPluginUISpec } from "Molstar/mol-plugin-ui/spec";
import { PluginContext } from "Molstar/mol-plugin/context";
import { TrackManager } from "uniprot-nightingale/src/index";
import { MolScriptBuilder as MS } from "Molstar/mol-script/language/builder";
import { BuiltInTrajectoryFormat } from "Molstar/mol-plugin-state/formats/trajectory";
import { Asset } from "Molstar/mol-util/assets";
import {
    ChainIndex,
    EntityIndex,
    ResidueIndex,
    Structure,
    StructureElement,
    StructureSelection
} from "Molstar/mol-model/structure";
import { Script } from "Molstar/mol-script/script";
import { Color } from "Molstar/mol-util/color";
import { Bundle } from "Molstar/mol-model/structure/structure/element/bundle";
import { Config as SequenceConfig, Highlight } from "uniprot-nightingale/src/manager/track-manager";
import { mixFragmentColors } from "./fragment-color-mixer";
import $ from "jquery";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-multiselect";
import "bootstrap-multiselect/dist/css/bootstrap-multiselect.css";
import HighlightFinderMolstarEvent, {
    MolstarAuthSeqIdExtractor
} from "./highlight-finder-molstar-event";
import { Canvas3D } from "Molstar/mol-canvas3d/canvas3d";
import HighlightFinderNightingaleEvent from "./highlight-finder-nightingale-event";
import { StateTransforms } from "Molstar/mol-plugin-state/transforms";
import { StateObjectSelector } from "Molstar/mol-state";
import { StructureRepresentationBuiltInProps } from "Molstar/mol-plugin-state/helpers/structure-representation-params";
import { Expression } from "Molstar/mol-script/language/expression";
import { Loci } from "Molstar/mol-model/loci";
import { Loci as StructureLoci } from "Molstar/mol-model/structure/structure/element/loci";
import { createEmitter } from "ts-typed-events";
import { StructureProperties } from "Molstar/mol-model/structure";
import { getStructureElementLoci } from "./molstar-utils";
require("Molstar/mol-plugin-ui/skin/light.scss");
require("./main.scss");
import * as d3 from "d3";
import { Mapping } from "uniprot-nightingale/src/types/mapping";
import { TrackFragment } from "uniprot-nightingale/src/types/accession";

type LoadParams = {
    url?: string;
    format?: BuiltInTrajectoryFormat;
    isBinary?: boolean;
    assemblyId?: string;
    data?: any;
};

export class TypedMolArt {
    private plugin: PluginContext;
    private protvistaWrapper: HTMLElement;
    private target: HTMLElement;
    private trackManager?: TrackManager;
    private molecularSurfaceRepr?: StateObjectSelector;
    private cartoonRepr?: StateObjectSelector;
    private previousWindowWidth: number | undefined = undefined;
    private readonly minWindowWidth = 1500;
    private structureMapping: Mapping;
    private readonly highlightFinderMolstarEvent: HighlightFinderMolstarEvent =
        new HighlightFinderMolstarEvent(new MolstarAuthSeqIdExtractor());
    private readonly highlightFinderNightingaleEvent: HighlightFinderNightingaleEvent =
        new HighlightFinderNightingaleEvent();
    private structure: StateObjectSelector;
    private highlightedResidueInStructure?: Loci;
    private mouseOverHighlightedResidueInStructure?: StructureElement.Loci;
    private highligtedInSequence?: Highlight;
    private mouseOverHighlightedResidueInSequence?: number;
    private readonly emitSequenceMouseOn = createEmitter<number>();
    public readonly sequenceMouseOn = this.emitSequenceMouseOn.event;
    private readonly emitSequenceMouseOff = createEmitter<void>();
    public readonly sequenceMouseOff = this.emitSequenceMouseOff.event;
    private readonly emitStructureMouseOff = createEmitter<void>();
    public readonly structureMouseOff = this.emitStructureMouseOff.event;
    private readonly emitStructureMouseOn = createEmitter<Residue>();
    public readonly structureMouseOn = this.emitStructureMouseOn.event;
    private readonly emitStructureLoaded = createEmitter<void>();
    public readonly structureLoaded = this.emitStructureLoaded.event;
    private readonly slider: HTMLInputElement = d3
        .create("div")
        .attr("class", "transparency-slider")
        .append("input")
        .attr("type", "range")
        .attr("min", 1)
        .attr("max", 100)
        .attr("value", 50)
        .node()!;

    init(target: HTMLElement, targetProtvista: HTMLElement, config: Config = DefaultConfig): void {
        this.target = target;
        this.protvistaWrapper = targetProtvista;
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.contentBoxSize[0]) {
                    if (
                        this.previousWindowWidth &&
                        this.previousWindowWidth <= this.minWindowWidth
                    ) {
                        d3.select(this.target)
                            .style("top", entry.contentBoxSize[0].blockSize + "px")
                            .style("position", "absolute");
                    }
                }
            }
        });
        resizeObserver.observe(this.protvistaWrapper);
        this.plugin = createPlugin(
            d3.select(this.target).append("div").attr("class", "structure-viewer-wrapper").node()!,
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
        d3.select(this.target)
            .insert("div", ":first-child")
            .attr("class", "structure-viewer-header")
            .append("i")
            .attr("class", "fas fa-download fa-2x");
        this.target.append(this.slider.parentNode!);
        this.slider.addEventListener("change", () => {
            this.setTransparency(this.slider.value);
        });
        this.loadConfig(config);
        this.plugin.canvas3d?.interaction.hover.subscribe((e: Canvas3D.HoverEvent) => {
            const structureElementLoci = getStructureElementLoci(e.current.loci);
            if (this.mouseOverHighlightedResidueInStructure && !structureElementLoci) {
                this.emitStructureMouseOff.emit();
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
                this.emitStructureMouseOn.emit(residue);
                this.mouseOverHighlightedResidueInStructure = structureElementLoci;
            }

            const highlights = this.highlightFinderMolstarEvent.calculate(e, this.structureMapping);
            this.mouseOverHighlightedResidueInSequence =
                highlights && highlights.length > 0 ? highlights[0].start : undefined;
            if (this.highligtedInSequence) {
                highlights.push(this.highligtedInSequence);
            }
            this.trackManager?.setHighlights(highlights);
            if (this.highlightedResidueInStructure) {
                this.plugin.managers.interactivity.lociHighlights.highlight({
                    loci: this.highlightedResidueInStructure
                });
            }
        });
        window.addEventListener("resize", this.windowResize.bind(this));
    }
    private windowResize() {
        const windowWidth = window.innerWidth;
        if (
            windowWidth <= this.minWindowWidth &&
            (!this.previousWindowWidth || this.previousWindowWidth > this.minWindowWidth)
        ) {
            d3.select(this.target)
                .style("left", "0")
                .style("top", this.protvistaWrapper.offsetHeight + "px")
                .style("width", "100%")
                .style("position", "absolute");
            d3.select(this.protvistaWrapper).style("width", "100%");
        } else if (
            windowWidth > this.minWindowWidth &&
            (!this.previousWindowWidth || this.previousWindowWidth <= this.minWindowWidth)
        ) {
            d3.select(this.target)
                .style("left", "50%")
                .style("top", "0")
                .style("width", "calc(50% - 2px)")
                .style("position", "fixed");
            d3.select(this.protvistaWrapper).style("width", "calc(50% - 2px)");
        }
        this.previousWindowWidth = windowWidth;
        this.plugin.handleResize();
    }

    public loadConfig(config: Config): void {
        this.trackManager?.onHighlightChange.offAll();
        this.trackManager?.onResidueMouseOver.offAll();
        this.trackManager?.onFragmentMouseOut.offAll();
        this.trackManager?.onRendered.offAll();
        this.trackManager = TrackManager.createDefault(config.sequence);
        this.trackManager.onSelectedStructure.on((output) => {
            this.structureMapping = output.mapping;
            this.load(
                {
                    url: output.url,
                    format: output.format,
                    data: output.data
                },
                config
            );
        });

        this.trackManager.onHighlightChange.on((fragments) => {
            this.overpaintFragments(fragments);
        });
        this.trackManager.onResidueMouseOver.on(async (resNum) => {
            this.emitSequenceMouseOn.emit(resNum);
            this.mouseOverHighlightedResidueInStructure = this.findLociFromResidueNumber(resNum);
            this.mouseOverHighlightedResidueInSequence = resNum;
            this.highlightStructureResidues();
        });

        this.trackManager.onFragmentMouseOut.on(() => {
            this.emitSequenceMouseOff.emit();
            this.mouseOverHighlightedResidueInStructure = undefined;
            this.mouseOverHighlightedResidueInSequence = undefined;
            this.plugin.managers.interactivity.lociHighlights.clearHighlights();
            if (this.highlightedResidueInStructure) {
                this.plugin.managers.interactivity.lociHighlights.highlight({
                    loci: this.highlightedResidueInStructure
                });
            }
        });
        this.trackManager.onRendered.on(this.windowResize.bind(this)); //TODO tady emitSequenceViewerReady?
        const previousProtvistaManagers =
            this.protvistaWrapper.getElementsByTagName("protvista-manager");
        for (let i = 0; i < previousProtvistaManagers.length; i++) {
            previousProtvistaManagers[i].remove();
        }
        this.trackManager.render(this.protvistaWrapper);
    }

    private selectFragment(from: number, to: number, data: Structure, chain?: string) {
        const filter: Record<string, Expression> = {
            "residue-test": MS.core.rel.inRange([
                MS.struct.atomProperty.macromolecular.auth_seq_id(),
                from,
                to
            ])
        };
        if (chain) {
            filter["chain-test"] = MS.core.rel.eq([
                MS.struct.atomProperty.macromolecular.auth_asym_id(),
                chain
            ]);
        }
        return Script.getStructureSelection(MS.struct.generator.atomGroups(filter), data);
    }

    private overpaintFragments(fragments: TrackFragment[]) {
        if (!this.molecularSurfaceRepr || !this.cartoonRepr) return;
        const data = this.plugin.managers.structure.hierarchy.current.structures[0]?.cell.obj?.data;
        if (!data) return;
        const params: { bundle: StructureElement.Bundle; color: Color; clear: boolean }[] = [];
        mixFragmentColors(fragments).forEach((fragment) => {
            let fragmentStart = fragment.start;
            let fragmentEnd = fragment.end;
            if (
                this.structureMapping.uniprotStart > fragmentStart &&
                this.structureMapping.uniprotEnd < fragmentEnd
            ) {
                fragmentStart = this.structureMapping.uniprotStart;
                fragmentEnd = this.structureMapping.uniprotEnd;
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
        d3.select(this.slider).attr("title", `Surface transparency:  ${parsedValue * 100}%`);
    }

    private async load(
        { url, format = "mmcif", isBinary = false, assemblyId = "", data }: LoadParams,
        config: Config
    ) {
        this.molecularSurfaceRepr = undefined;
        this.cartoonRepr = undefined;
        await this.plugin.clear();
        let loadedData: StateObjectSelector;
        if (url) {
            loadedData = await this.plugin.builders.data.download(
                {
                    url: Asset.Url(url),
                    isBinary
                },
                { state: { isGhost: true } }
            );
        } else if (data) {
            loadedData = await this.plugin.builders.data.rawData(
                {
                    data: data
                },
                { state: { isGhost: true } }
            );
        } else {
            throw new Error("Structure url or data were not provided!");
        }
        const trajectory = await this.plugin.builders.structure.parseTrajectory(loadedData, format);
        const model = await this.plugin.builders.structure.createModel(trajectory);
        this.structure = await this.plugin.builders.structure.createStructure(
            model,
            assemblyId
                ? { name: "assembly", params: { id: assemblyId } }
                : { name: "model", params: {} }
        );
        let select: d3.Selection<HTMLSelectElement, unknown, null, undefined> | undefined;
        const extraHiglights = config.structure?.extrahighlights;
        const extraHiglightsSelectors: ExtraHiglight[] = [];
        if (extraHiglights && extraHiglights.length > 0) {
            const previousSelect = d3
                .select(this.target)
                .select(".structure-viewer-header")
                .select("select")
                .node();
            if (previousSelect) {
                ((previousSelect as Element).parentNode as Element).remove();
            }
            select = d3
                .select(this.target)
                .select(".structure-viewer-header")
                .insert("div", ":first-child")
                .style("display", "inline-block")
                .append("select")
                .attr("name", "highlights")
                .attr("multiple", "multiple");
        }
        for (const key in extraHiglights) {
            const extraHighlight = extraHiglights[parseInt(key)];
            select!
                .append("option")
                .attr("value", key)
                .attr("selected", "selected")
                .text(extraHighlight.label);
            const filter: Record<string, Expression> = {};
            if (extraHighlight.residue) {
                filter["residue-test"] = MS.core.rel.inRange([
                    MS.struct.atomProperty.macromolecular.auth_seq_id(),
                    extraHighlight.residue.authResidueNumFrom,
                    extraHighlight.residue.authResidueNumTo
                ]);
            }
            if (extraHighlight.authChain) {
                filter["chain-test"] = MS.core.set.has([
                    MS.core.type.set(extraHighlight.authChain),
                    MS.ammp("auth_asym_id")
                ]);
            }
            if (extraHighlight.authAtom) {
                filter["atom-test"] = MS.core.set.has([
                    MS.core.type.set(extraHighlight.authAtom),
                    MS.ammp("auth_atom_id")
                ]);
            }
            const expression = MS.struct.generator.atomGroups(filter);
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
                $(select.node()!).multiselect({
                    buttonClass: "custom-select"
                });
                $(select.node()!).multiselect("setOptions", {
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
            this.overpaintFragments(this.trackManager?.getMarkedFragments() ?? []);
            const data =
                this.plugin.managers.structure.hierarchy.current.structures[0]?.cell.obj?.data;
            if (data) {
                const filter: Record<string, Expression> = {
                    "residue-test": MS.core.logic.not([
                        MS.core.rel.inRange([
                            MS.struct.atomProperty.macromolecular.auth_seq_id(),
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
                    MS.struct.generator.atomGroups(filter),
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
            this.emitStructureLoaded.emit();
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
    public isStructureLoaded(): boolean {
        return !!this.cartoonRepr;
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
    public unhighlightInSequence(): void {
        this.highligtedInSequence = undefined;
        this.trackManager?.clearHighlights();
        if (this.mouseOverHighlightedResidueInSequence) {
            this.trackManager?.setHighlights([
                {
                    start: this.mouseOverHighlightedResidueInSequence,
                    end: this.mouseOverHighlightedResidueInSequence
                }
            ]);
        }
    }

    public highlightInSequence(higlight: Highlight): void {
        this.highligtedInSequence = higlight;
        this.trackManager?.setHighlights(
            this.mouseOverHighlightedResidueInSequence
                ? [
                      higlight,
                      {
                          start: this.mouseOverHighlightedResidueInSequence,
                          end: this.mouseOverHighlightedResidueInSequence
                      }
                  ]
                : [higlight]
        );
    }
    public focusInStructure(resNum: number, radius = 0, chain?: string): void {
        const loci = this.findLociFromResidueNumber(resNum, chain);
        if (loci) {
            this.plugin.managers.structure.focus.setFromLoci(loci);
            this.plugin.managers.camera.focusLoci(loci, { extraRadius: radius });
        }
    }
    public getStructureController(): PluginContext {
        return this.plugin;
    }
    public getSequenceController(): TrackManager | undefined {
        return this.trackManager;
    }
    public getSequenceStructureRange(): number[][] {
        return this.structureMapping.fragmentMappings.map((fragmentMapping) => {
            return [fragmentMapping.from, fragmentMapping.to];
        });
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
}
(window as any).TypedMolArt = new TypedMolArt();

export type Config = {
    structure?: {
        extrahighlights: {
            label: string;
            props: StructureRepresentationBuiltInProps;
            residue?: {
                authResidueNumFrom: number;
                authResidueNumTo: number;
            };
            authChain?: string[];
            authAtom?: string[];
        }[];
    };
    sequence: SequenceConfig;
};

type Residue = {
    authName: string;
    authSeqNumber: number;
    chain: {
        asymId: string;
        authAsymId: string;
        entity: {
            entityId: string;
            index: EntityIndex;
        };
        index: ChainIndex;
    };
    index: ResidueIndex;
    insCode: string;
    isHet: boolean;
    name: string;
    seqNumber: number;
};

type ExtraHiglight = {
    isVisible: boolean;
    selector: StateObjectSelector;
    readonly props: StructureRepresentationBuiltInProps;
    readonly expression: Expression;
    readonly key: string;
};

const DefaultConfig: Config = {
    structure: {
        extrahighlights: []
    },
    sequence: {
        uniprotId: "P37840"
    }
};
