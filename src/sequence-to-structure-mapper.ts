import { FragmentMapping } from "uniprot-nightingale/lib/types/mapping";

/**
 * Ii is used to map sequence indices to structure indices.
 */
export class SequenceToStructureMapper {
    /**
     * Maps given sequence index to structure index using given mappings.
     * @param sequenceResidueNumber Residue index in uniprot sequence.
     * @param chainMapping Mappings to use.
     * @returns Structure index of given residue or undefined if mapping was not found.
     */
    public getMappedPositionFromResidue(
        sequenceResidueNumber: number,
        chainMapping: FragmentMapping[]
    ): number | undefined {
        // Find mapping containing given residue.
        const fragmentMapping = this.getFragmentMapping(sequenceResidueNumber, chainMapping);
        if (fragmentMapping) {
            return this.mapPosition(sequenceResidueNumber, fragmentMapping);
        }
    }

    /**
     * Maps given sequence index to structure index using given mapping.
     * @param sequenceResidueNumber Residue index in uniprot sequence.
     * @param fragmentMapping Mapping.
     * @returns
     */
    private mapPosition(sequenceResidueNumber: number, fragmentMapping: FragmentMapping): number {
        return (
            sequenceResidueNumber + fragmentMapping.structureStart - fragmentMapping.sequenceStart
        );
    }

    /**
     * Finds mapping whose range contains given sequence index.
     * @param sequenceResidueNumber Residue index in uniprot sequence.
     * @param fragmentMappings Mappings.
     * @returns Found mapping or undefined if none of the mappings contain given index.
     */
    private getFragmentMapping(
        sequenceResidueNumber: number,
        fragmentMappings: FragmentMapping[]
    ): FragmentMapping | undefined {
        for (let i = 0; i < fragmentMappings.length; i++) {
            const fragmentMapping = fragmentMappings[i];
            if (
                fragmentMapping.sequenceStart <= sequenceResidueNumber &&
                fragmentMapping.sequenceEnd >= sequenceResidueNumber
            ) {
                return fragmentMapping;
            }
        }
    }
}
