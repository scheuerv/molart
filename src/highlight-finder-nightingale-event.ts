import { Mapping } from "uniprot-nightingale/src/parsers/track-parser";
export default class HighlightFinderNightingaleEvent {
    public calculate(resNum: number, structureMapping: Mapping): number | undefined {
        const fragmentMapping = this.getFragmentMapping(resNum, structureMapping);
        if (fragmentMapping) {
            let position = resNum;
            if (structureMapping.uniprotStart != fragmentMapping.pdbStart) {
                position += fragmentMapping.pdbStart - fragmentMapping.from;
            }
            if (position >= fragmentMapping.pdbStart && position <= fragmentMapping.pdbEnd) {
                return position;
            }
        }
        return undefined;
    }
    private getFragmentMapping(resNum: number, structureMapping: Mapping) {
        for (let i = 0; i < structureMapping.fragmentMappings.length; i++) {
            const fragmentMapping = structureMapping.fragmentMappings[i];
            if (fragmentMapping.from <= resNum && fragmentMapping.to >= resNum) {
                return fragmentMapping;
            }
        }
    }
    public getPositionOfLastResidueInFragment(resNum: number, structureMapping: Mapping)
    {
        return this.getFragmentMapping(resNum, structureMapping)?.pdbEnd;
    }
    public getPositionOfFirstResidueInFragment(resNum: number, structureMapping: Mapping)
    {
        return this.getFragmentMapping(resNum, structureMapping)?.pdbStart;
    }
}