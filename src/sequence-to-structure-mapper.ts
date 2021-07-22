import { FragmentMapping } from "uniprot-nightingale/lib/types/mapping";

export class SequenceToStructureMapper {
    public getMappedPositionFromResidue(
        sequenceResidueNumber: number,
        chainMapping: FragmentMapping[]
    ) {
        const fragmentMapping = this.getFragmentMapping(sequenceResidueNumber, chainMapping);
        if (fragmentMapping) {
            return this.mapPosition(sequenceResidueNumber, fragmentMapping);
        }
    }

    private mapPosition(sequenceResidueNumber: number, fragmentMapping: FragmentMapping) {
        return (
            sequenceResidueNumber + fragmentMapping.structureStart - fragmentMapping.sequenceStart
        );
    }

    private getFragmentMapping(
        sequenceResidueNumber: number,
        structureMapping: FragmentMapping[]
    ): FragmentMapping | undefined {
        for (let i = 0; i < structureMapping.length; i++) {
            const fragmentMapping = structureMapping[i];
            if (
                fragmentMapping.sequenceStart <= sequenceResidueNumber &&
                fragmentMapping.sequenceEnd >= sequenceResidueNumber
            ) {
                return fragmentMapping;
            }
        }
    }
}
