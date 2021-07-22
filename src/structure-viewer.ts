import { SealedEvent } from "ts-typed-events";
import { StructureInfo, TrackFragment } from "uniprot-nightingale/lib/types/accession";
import { Highlight } from "uniprot-nightingale/lib/types/highlight";

export default interface StructureViewer<StructureConfig, Residue> {
    onLoaded: SealedEvent<void>;
    onHover: SealedEvent<Residue | undefined>;
    onHighlightChange: SealedEvent<Highlight[]>;
    handleResize(): void;
    load(
        structureInfo: StructureInfo,
        config: StructureConfig,
        markedFragments: TrackFragment[]
    ): Promise<void>;
    overpaintFragments(fragments: TrackFragment[]): void;
    highlightMouseOverResidue(resNum?: number): void;
    isLoaded(): boolean;
    highlight(resNum: number, chain?: string): void;
    unhighlight(): void;
    focus(resNum: number, chain?: string, radius?: number): void;
    getOuterElement(): HTMLElement;
}
