import { SealedEvent } from "ts-typed-events";
import { Output, TrackFragment } from "uniprot-nightingale/src/types/accession";
import { Highlight } from "uniprot-nightingale/src/types/highlight";
import { Residue } from "./types/residue";

export default interface StructureViewer<StructureConfig> {
    onStructureLoaded: SealedEvent<void>;
    onHover: SealedEvent<Residue | null>;
    onHighlightChange: SealedEvent<Highlight[]>;
    handleResize(): void;
    load(
        output: Output,
        structure: StructureConfig,
        markedFragments: TrackFragment[],
        isBinary?: boolean,
        assemblyId?: string
    ): void;
    overpaintFragments(fragments: TrackFragment[]): void;
    highlightMouseOverResidue(resNum?: number): void;
    isStructureLoaded(): boolean;
    highlightInStructure(resNum: number): void;
    unhighlightInStructure(): void;
    focusInStructure(resNum: number, radius: number, chain: string | undefined): void;
    getOuterElement(): HTMLElement;
}
