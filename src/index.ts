import { TrackManager } from "uniprot-nightingale/src/index";
import { Config as SequenceConfig, Highlight } from "uniprot-nightingale/src/manager/track-manager";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap";
import "bootstrap-multiselect";
import "bootstrap-multiselect/dist/css/bootstrap-multiselect.css";
import { StructureRepresentationBuiltInProps } from "Molstar/mol-plugin-state/helpers/structure-representation-params";
import { createEmitter } from "ts-typed-events";
require("Molstar/mol-plugin-ui/skin/light.scss");
require("./main.scss");
import { Mapping } from "uniprot-nightingale/src/types/mapping";
import MolstarPlugin from "./molstar-plugin";
import { Residue } from "./types/residue";
import $ from "jquery";

export class TypedMolArt {
    private plugin: MolstarPlugin;
    private protvistaWrapper: HTMLElement;
    private target: HTMLElement;
    private trackManager?: TrackManager;
    private previousWindowWidth: number | undefined = undefined;
    private readonly minWindowWidth = 1500;
    private structureMapping: Mapping;
    private highligtedInSequence?: Highlight;
    private mouseOverHighlightedResidueInSequence?: number;
    private readonly emitOnSequenceMouseOn = createEmitter<number>();
    public readonly onSequenceMouseOn = this.emitOnSequenceMouseOn.event;
    private readonly emitOnSequenceMouseOff = createEmitter<void>();
    public readonly onSequenceMouseOff = this.emitOnSequenceMouseOff.event;
    private readonly emitOnStructureMouseOff = createEmitter<void>();
    public readonly onStructureMouseOff = this.emitOnStructureMouseOff.event;
    private readonly emitOnStructureMouseOn = createEmitter<Residue>();
    public readonly onStructureMouseOn = this.emitOnStructureMouseOn.event;
    private readonly emitOnStructureLoaded = createEmitter<void>();
    public readonly onStructureLoaded = this.emitOnStructureLoaded.event;
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
                        $(this.target).css
                            ("top", entry.contentBoxSize[0].blockSize + "px")
                            .css("position", "absolute");
                    }
                }
            }
        });
        resizeObserver.observe(this.protvistaWrapper);
        this.plugin = new MolstarPlugin(target);


        this.loadConfig(config);
        this.plugin.onStructureLoaded.on(() => {
            this.emitOnStructureLoaded.emit();
        });
        this.plugin.onHover.on((residue: Residue | null) => {
            if (residue) {
                this.emitOnStructureMouseOn.emit(residue);
            } else {
                this.emitOnStructureMouseOff();
            }
        });
        this.plugin.onHighlightChange.on((highlights: Highlight[]) => {
            this.mouseOverHighlightedResidueInSequence =
                highlights && highlights.length > 0 ? highlights[0].start : undefined;
            if (this.highligtedInSequence) {
                highlights.push(this.highligtedInSequence);
            }
            this.trackManager?.setHighlights(highlights);
        });
        window.addEventListener("resize", this.windowResize.bind(this));
    }
    private windowResize() {
        const windowWidth = window.innerWidth;
        if (
            windowWidth <= this.minWindowWidth &&
            (!this.previousWindowWidth || this.previousWindowWidth > this.minWindowWidth)
        ) {
            $(this.target)
                .css("left", "0")
                .css("top", this.protvistaWrapper.offsetHeight + "px")
                .css("width", "100%")
                .css("position", "absolute");
            $(this.protvistaWrapper).css("width", "100%");
        } else if (
            windowWidth > this.minWindowWidth &&
            (!this.previousWindowWidth || this.previousWindowWidth <= this.minWindowWidth)
        ) {
            $(this.target)
                .css("left", "50%")
                .css("top", "0")
                .css("width", "calc(50% - 2px)")
                .css("position", "fixed");
            $(this.protvistaWrapper).css("width", "calc(50% - 2px)");
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
            this.plugin.load(
                output,
                config.structure,
                this.trackManager?.getMarkedFragments() ?? []
            );
        });

        this.trackManager.onHighlightChange.on((fragments) => {
            this.plugin.overpaintFragments(fragments);
        });
        this.trackManager.onResidueMouseOver.on(async (resNum) => {
            this.emitOnSequenceMouseOn.emit(resNum);
            this.plugin.highlightMouseOverResidue(resNum);
            this.mouseOverHighlightedResidueInSequence = resNum;
        });

        this.trackManager.onFragmentMouseOut.on(() => {
            this.emitOnSequenceMouseOff.emit();
            this.plugin.highlightMouseOverResidue(undefined);
        });
        this.trackManager.onRendered.on(this.windowResize.bind(this)); //TODO tady emitSequenceViewerReady?
        const previousProtvistaManagers =
            this.protvistaWrapper.getElementsByTagName("protvista-manager");
        for (let i = 0; i < previousProtvistaManagers.length; i++) {
            previousProtvistaManagers[i].remove();
        }
        this.trackManager.render(this.protvistaWrapper);
    }

    public isStructureLoaded(): boolean {
        return this.plugin.isStructureLoaded();
    }

    public highlightInStructure(resNum: number): void {
        this.plugin.highlightInStructure(resNum);
    }

    public unhighlightInStructure(): void {
        this.plugin.unhighlightInStructure();
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
        this.plugin.focusInStructure(resNum, radius, chain);
    }
    public getStructureController(): MolstarPlugin {
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
}
(window as any).TypedMolArt = new TypedMolArt();

export type Config = {
    structure: StructureConfig;
    sequence: SequenceConfig;
};

export type StructureConfig = {
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

const DefaultConfig: Config = {
    structure: {
        extrahighlights: []
    },
    sequence: {
        uniprotId: "P37840"
    }
};
