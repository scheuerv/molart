import { SealedEvent } from "ts-typed-events";
import { Output, TrackFragment } from "uniprot-nightingale/src/types/accession";
import { Highlight } from "uniprot-nightingale/src/types/highlight";
import { Residue } from "./types/residue";

export default interface StructureViewer<StructureConfig> {
    onLoaded: SealedEvent<void>;
    onHover: SealedEvent<Residue | null>;
    onHighlightChange: SealedEvent<Highlight[]>;
    handleResize(): void;
    load(
        output: Output,
        structure: StructureConfig,
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
