import { Mapping } from "uniprot-nightingale/lib/types/mapping";
import { findUniprotIntervalsFromUniprotSequence } from "uniprot-nightingale/lib/utils/fragment-mapping-utils";
import { SequenceToStructureMapper } from "./sequence-to-structure-mapper";

export default class HighlightFinderNightingaleEvent {
    private readonly sequenceToStructureMapper: SequenceToStructureMapper =
        new SequenceToStructureMapper();
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
                    mappedResidueNumberForChains.set(
                        format == "mmcif" ? chainMapping.structAsymId : chainId,
                        mappedPosition
                    );
                }
            });
        }
        return mappedResidueNumberForChains;
    }

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
                const intervals = findUniprotIntervalsFromUniprotSequence(
                    sequenceResidueNumberStart,
                    sequenceResidueNumberEnd,
                    fragmentMappings
                );
                intervals.forEach((interval) => {
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
