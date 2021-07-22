import { Mapping } from "uniprot-nightingale/lib/types/mapping";
import { findUniprotIntervalsFromUniprotSequence } from "uniprot-nightingale/lib/utils/fragment-mapping-utils";
import { SequenceToStructureMapper } from "../sequence-to-structure-mapper";

/**
 * It is used to calculate higlight in strucutre when hovering over sequence.
 */
export default class HighlightFinderNightingaleEvent {
    private readonly sequenceToStructureMapper: SequenceToStructureMapper =
        new SequenceToStructureMapper();

    /**
     * From index residue in sequence it calculates highlight structure indeces
     * for all mapped chains.
     * @param sequenceResidueNumber Index of residue in uniprot sequence.
     * @param structureMapping Mapping for all chains in structure.
     * @param format Format of structure coordinates file.
     * @returns Map of chain ids with their calculated higlight index.
     */
    public calculate(
        sequenceResidueNumber: number,
        structureMapping?: Mapping,
        format?: string
    ): Map<string, number> {
        const mappedResidueNumberForChains: Map<string, number> = new Map();
        if (structureMapping) {
            Object.entries(structureMapping).forEach(([chainId, chainMapping]) => {
                const mappedPosition = this.sequenceToStructureMapper.getMappedPositionFromResidue(
                    sequenceResidueNumber,
                    chainMapping.fragmentMappings
                );
                if (mappedPosition) {
                    //struct_asym_id is used in mmcif format instead of chain id
                    mappedResidueNumberForChains.set(
                        format == "mmcif" ? chainMapping.structAsymId : chainId,
                        mappedPosition
                    );
                }
            });
        }
        return mappedResidueNumberForChains;
    }

    /**
     * It calculates and mapped ranges for all given chains. Given range can be split
     * into more mapped ranges because mapping doesn't have to cover whole range.
     * @param sequenceResidueNumberStart Start index of residue in uniprot sequence.
     * @param sequenceResidueNumberEnd End index of residue in uniprot sequence.
     * @param structureMapping Mapping for all chains in structure.
     * @returns Map of chain ids with mapped ranges.
     */
    public calculateFromRange(
        sequenceResidueNumberStart: number,
        sequenceResidueNumberEnd: number,
        structureMapping?: Mapping
    ): Map<string, [number, number][]> {
        const rangesForChains: Map<string, [number, number][]> = new Map();
        if (structureMapping) {
            Object.entries(structureMapping).forEach(([chainId, chainMapping]) => {
                const fragmentMappings = chainMapping.fragmentMappings;
                rangesForChains.set(chainId, []);
                // split given range to intervals which are covered by mapping
                const intervals = findUniprotIntervalsFromUniprotSequence(
                    sequenceResidueNumberStart,
                    sequenceResidueNumberEnd,
                    fragmentMappings
                );
                intervals.forEach((interval) => {
                    // map index
                    const startMapped = this.sequenceToStructureMapper.getMappedPositionFromResidue(
                        interval.start,
                        fragmentMappings
                    );
                    if (startMapped) {
                        rangesForChains
                            .get(chainId)
                            ?.push([startMapped, startMapped + interval.end - interval.start]);
                    }
                });
            });
        }

        return rangesForChains;
    }
}
