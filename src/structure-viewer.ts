import { SealedEvent } from "ts-typed-events";
import { StructureInfo, TrackFragment } from "uniprot-nightingale/lib/types/accession";
import { Highlight } from "uniprot-nightingale/lib/types/highlight";

/**
 * Classes that implement this interface are representing structure visualisation components.
 */
export default interface StructureViewer<StructureConfig, Residue> {
    onLoaded: SealedEvent<void>;
    onHover: SealedEvent<Residue | undefined>;
    onHighlightChange: SealedEvent<Highlight[]>;
    /**
     * Is called when element's size from getOuterElement is changed
     */
    handleResize(): void;
    /**
     * This method is called when Molart wants to display a new structure.
     * @param structureInfo Necessary information to load a structure.
     * @param config Config from Molart.
     */
    load(structureInfo: StructureInfo, config: StructureConfig): Promise<void>;
    /**
     * Should highlight given fragments in strucure.
     * @param fragments Fragments to highlight.
     */
    overpaintFragments(fragments: TrackFragment[]): void;
    /**
     * Is called
     * @param resNum Hovered residue index in sequence.
     */
    highlightMouseOverResidue(resNum?: number): void;
    isLoaded(): boolean;
    highlight(resNum: number, chain?: string): void;
    unhighlight(): void;
    focus(resNum: number, chain?: string, radius?: number): void;
    getOuterElement(): HTMLElement;
}
