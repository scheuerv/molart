import { FragmentMapping, Mapping } from "uniprot-nightingale/src/types/mapping";

export default class HighlightFinderNightingaleEvent {
    public calculate(sequenceResidueNumber: number, structureMapping: Mapping): number | undefined {
        const fragmentMapping = this.getFragmentMapping(sequenceResidueNumber, structureMapping);
        if (fragmentMapping) {
            return (
                sequenceResidueNumber +
                fragmentMapping.start.residue_number -
                fragmentMapping.unp_start
            );
        }
        return undefined;
    }

    public getStructurePositionOfLastResidueInFragment(
        sequenceResidueNumber: number,
        structureMapping: Mapping
    ): number | undefined {
        return this.getFragmentMapping(sequenceResidueNumber, structureMapping)?.end.residue_number;
    }

    public getStructurePositionOfFirstResidueInFragment(
        sequenceResidueNumber: number,
        structureMapping: Mapping
    ): number | undefined {
        return this.getFragmentMapping(sequenceResidueNumber, structureMapping)?.start
            .residue_number;
    }

    private getFragmentMapping(
        sequenceResidueNumber: number,
        structureMapping: Mapping
    ): FragmentMapping | undefined {
        for (let i = 0; i < structureMapping.length; i++) {
            const fragmentMapping = structureMapping[i];
            if (
                fragmentMapping.unp_start <= sequenceResidueNumber &&
                fragmentMapping.unp_end >= sequenceResidueNumber
            ) {
                return fragmentMapping;
            }
        }
    }
}
