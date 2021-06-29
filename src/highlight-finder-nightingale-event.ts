import { FragmentMapping, Mapping } from "uniprot-nightingale/src/types/mapping";
import { findUniprotIntervalsFromUniprotSequence } from "uniprot-nightingale/src/utils/fragment-mapping-utils";

export default class HighlightFinderNightingaleEvent {
    public calculate(
        sequenceResidueNumber: number,
        structureMapping?: Mapping,
        format?: string
    ): Map<string, number> {
        const mappedResidueNumberForChains: Map<string, number> = new Map();
        if (structureMapping) {
            Object.entries(structureMapping).forEach(([chainId, chainMapping]) => {
                for (let i = 0; i < chainMapping.fragmentMappings.length; i++) {
                    const fragmentMapping = chainMapping.fragmentMappings[i];
                    if (
                        fragmentMapping.sequenceStart <= sequenceResidueNumber &&
                        fragmentMapping.sequenceEnd >= sequenceResidueNumber
                    ) {
                        mappedResidueNumberForChains.set(
                            format == "mmcif" ? chainMapping.structAsymId : chainId,
                            this.mapPosition(sequenceResidueNumber, fragmentMapping)
                        );
                        break;
                    }
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
                    const startMapped = this.getMappedPositionFromResidue(
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

    private getMappedPositionFromResidue(
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
