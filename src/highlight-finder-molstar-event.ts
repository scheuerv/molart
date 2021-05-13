import { Highlight } from "uniprot-nightingale/src/manager/track-manager";
import { Loci } from "Molstar/mol-model/structure/structure/element/loci";
import { Canvas3D } from "Molstar/mol-canvas3d/canvas3d";
import { StructureElement, StructureProperties, } from "Molstar/mol-model/structure";
import HoverEvent = Canvas3D.HoverEvent;
import { Mapping } from "uniprot-nightingale/src/parsers/track-parser";

export default class HighlightFinderMolstarEvent {

    public calculate(e: HoverEvent, structureMapping: Mapping): Highlight[] {
        const result: Highlight[] = [];
        if (e.current?.loci.kind == 'element-loci') {
            const structureElement = StructureElement.Stats.ofLoci(e.current.loci as Loci);
            const location = structureElement.firstResidueLoc;
            if (location.unit) {
                let position: number | undefined = this.getPosition(location, structureMapping);
                if (position) {
                    if (position >= structureMapping.uniprotStart && position <= structureMapping.uniprotEnd) {
                        result.push({ start: position, end: position });
                    }
                }
            }
        }
        return result;
    }
    private getPosition(location: any, structureMapping: Mapping) {
        const authSeqId = StructureProperties.residue.auth_seq_id(location);
        let position: number | undefined;
        const fragmentMapping = this.getFragmentMapping(authSeqId, structureMapping);
        if (fragmentMapping) {
            const useMapping = structureMapping.uniprotStart == fragmentMapping.pdbStart;
            if (useMapping) {
                position = authSeqId
            }
            else {
                position = authSeqId - fragmentMapping.pdbStart + fragmentMapping.from;
            }
        }
        return position;
    }

    private getFragmentMapping(resNum: number, structureMapping: Mapping) {
        for (let i = 0; i < structureMapping.fragmentMappings.length; i++) {
            const fragmentMapping = structureMapping.fragmentMappings[i];
            if (fragmentMapping.pdbStart <= resNum && fragmentMapping.pdbEnd >= resNum) {
                return fragmentMapping;
            }
        }
    }
}