import $ from "jquery";
import { Highlight } from "uniprot-nightingale/lib/types/highlight";
import { TrackManagerBuilder } from "uniprot-nightingale/lib/index";
import { createEmitter } from "ts-typed-events";
import StructureViewer from "./structure-viewer";
import { SequenceConfig } from "uniprot-nightingale/lib/types/config";
import TrackManager from "uniprot-nightingale/lib/manager/track-manager";
import { StructureInfo } from "uniprot-nightingale/lib/types/accession";
import { Interval } from "uniprot-nightingale/lib/types/interval";

require("./main.css");
/**
 * Main class of molart module. It manages and creates TrackManager which is object
 * from uniprot-nightingale module. It also manages given StructureViewer (e.g. MolstarPlugin).
 * It synchronizes highlighting of corresponding parts in both mentioned components.
 * It handles window resizing.
 */
export class MolArt<StructureConfig, Residue> {
    private trackManager?: TrackManager;
    private previousWindowWidth: number | undefined = undefined;
    private readonly minWindowWidth = 1500;
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
    private readonly emitOnSequenceViewerReady = createEmitter<void>();
    public readonly onSequenceViewerReady = this.emitOnSequenceViewerReady.event;
    constructor(
        private readonly structureViewer: StructureViewer<StructureConfig, Residue>,
        private readonly nightingaleWrapper: HTMLElement
    ) {
        //If the structure viewer is below sequence viewer and sequence wiever
        //changes its height we need to move structure viewer
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.contentBoxSize[0]) {
                    if (
                        this.previousWindowWidth &&
                        this.previousWindowWidth <= this.minWindowWidth
                    ) {
                        $(this.structureViewer.getOuterElement())
                            .css("top", entry.contentBoxSize[0].blockSize + "px")
                            .css("position", "absolute");
                    }
                }
            }
        });
        resizeObserver.observe(this.nightingaleWrapper);
        this.structureViewer.onLoaded.on(() => {
            this.emitOnStructureLoaded.emit();
        });
        this.structureViewer.onHover.on((residue: Residue | undefined) => {
            if (residue) {
                this.emitOnStructureMouseOn.emit(residue);
            } else {
                this.emitOnStructureMouseOff();
            }
        });
        this.structureViewer.onHighlightChange.on((highlights: Highlight[]) => {
            this.mouseOverHighlightedResidueInSequence =
                highlights && highlights.length > 0 ? highlights[0].sequenceStart : undefined;
            if (this.highligtedInSequence) {
                highlights.push(this.highligtedInSequence);
            }
            this.trackManager?.setHighlights(highlights);
        });
        window.addEventListener("resize", this.windowResize.bind(this));
    }

    /**
     * Creates a new TrackManager from the given config and loads new structure.
     * @param config
     */
    public async loadConfig(config: Config<StructureConfig>): Promise<void> {
        const trackManagerBuilder: TrackManagerBuilder = TrackManagerBuilder.createDefault(
            config.sequence
        );
        this.trackManager?.onMarkChange.offAll();
        this.trackManager?.onResidueMouseOver.offAll();
        this.trackManager?.onFragmentMouseOut.offAll();
        const previousProtvistaManagers =
            this.nightingaleWrapper.getElementsByTagName("protvista-manager");
        for (let i = 0; i < previousProtvistaManagers.length; i++) {
            previousProtvistaManagers[i].remove();
        }
        trackManagerBuilder.onRendered.once(() => {
            this.windowResize.bind(this)();
            this.emitOnSequenceViewerReady.emit();
        });
        this.trackManager = await trackManagerBuilder.load(this.nightingaleWrapper);
        this.loadStructureFromStructureInfo(this.trackManager.getActiveStructureInfo(), config);
        this.trackManager.onSelectedStructure.on(async (structureInfo) =>
            this.loadStructureFromStructureInfo(structureInfo, config)
        );

        this.trackManager.onMarkChange.on((fragments) => {
            this.structureViewer.overpaintFragments(fragments);
        });
        this.trackManager.onResidueMouseOver.on(async (resNum) => {
            this.emitOnSequenceMouseOn.emit(resNum);
            this.structureViewer.highlightMouseOverResidue(resNum);
            this.mouseOverHighlightedResidueInSequence = resNum;
        });

        this.trackManager.onFragmentMouseOut.on(() => {
            this.emitOnSequenceMouseOff.emit();
            this.structureViewer.highlightMouseOverResidue(undefined);
        });
    }

    public isStructureLoaded(): boolean {
        return this.structureViewer.isLoaded();
    }

    public highlightInStructure(resNum: number, chain?: string): void {
        this.structureViewer.highlight(resNum, chain);
    }

    public unhighlightInStructure(): void {
        this.structureViewer.unhighlight();
    }

    public unhighlightInSequence(): void {
        this.highligtedInSequence = undefined;
        if (this.mouseOverHighlightedResidueInSequence) {
            //keep mouseover highlights
            this.trackManager?.setHighlights([
                {
                    sequenceStart: this.mouseOverHighlightedResidueInSequence,
                    sequenceEnd: this.mouseOverHighlightedResidueInSequence
                }
            ]);
        } else {
            this.trackManager?.clearHighlights();
        }
    }

    public highlightInSequence(higlight: Highlight): void {
        this.highligtedInSequence = higlight;
        this.trackManager?.setHighlights(
            this.mouseOverHighlightedResidueInSequence
                ? [
                      higlight,
                      {
                          sequenceStart: this.mouseOverHighlightedResidueInSequence,
                          sequenceEnd: this.mouseOverHighlightedResidueInSequence
                      }
                  ]
                : [higlight]
        );
    }
    public focusInStructure(resNum: number, radius = 0, chain?: string): void {
        this.structureViewer.focus(resNum, chain, radius);
    }
    public getStructureController(): StructureViewer<StructureConfig, Residue> {
        return this.structureViewer;
    }
    public getSequenceController(): TrackManager | undefined {
        return this.trackManager;
    }

    /**
     * Returns ranges of observed fragments in active structure.
     * @returns Intervals of observed fragments in active structure.
     */
    public getSequenceStructureRange(): Interval[] {
        return this.trackManager?.getActiveStructureInfo()?.observedIntervals ?? [];
    }

    /**
     * Calls load on structureViewer with given parameters
     * @param structureInfo Information about structure necessary for loading it.
     * @param config Structure viewer configuration.
     */
    private async loadStructureFromStructureInfo(
        structureInfo: StructureInfo | undefined,
        config: Config<StructureConfig>
    ) {
        if (structureInfo) {
            await this.structureViewer.load(structureInfo, config.structure).then(() => {
                this.structureViewer.overpaintFragments(
                    this.trackManager?.getMarkedFragments() ?? []
                );
            });
        }
    }
    private windowResize() {
        const windowWidth = window.innerWidth;
        if (
            windowWidth <= this.minWindowWidth &&
            (!this.previousWindowWidth || this.previousWindowWidth > this.minWindowWidth)
        ) {
            //put sequence viewer and structure viewer next to each other
            $(this.structureViewer.getOuterElement())
                .css("left", "0")
                .css("top", this.nightingaleWrapper.offsetHeight + "px")
                .css("width", "100%")
                .css("position", "absolute");
            $(this.nightingaleWrapper).css("width", "100%");
        } else if (
            windowWidth > this.minWindowWidth &&
            (!this.previousWindowWidth || this.previousWindowWidth <= this.minWindowWidth)
        ) {
            //put sequence viewer and structure viewer below each other
            $(this.structureViewer.getOuterElement())
                .css("left", "50%")
                .css("top", "0")
                .css("width", "calc(50% - 2px)")
                .css("position", "fixed");
            $(this.nightingaleWrapper).css("width", "calc(50% - 2px)");
        }
        this.previousWindowWidth = windowWidth;
        this.structureViewer.handleResize();
    }
}

export type Config<StructureConfig> = {
    structure: StructureConfig;
    sequence: SequenceConfig;
};
