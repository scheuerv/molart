import { Highlight } from "uniprot-nightingale/src/manager/track-manager";
import { Canvas3D } from "Molstar/mol-canvas3d/canvas3d";
import { StructureElement, StructureProperties } from "Molstar/mol-model/structure";
import { FragmentMapping, Mapping } from "uniprot-nightingale/src/parsers/track-parser";
import { getStructureElementLoci } from "./molstar-utils";

export interface AuthSeqIdExtractor {
    extractAuthSeqId(e: Canvas3D.HoverEvent): number | undefined;
}
export class MolstarAuthSeqIdExtractor implements AuthSeqIdExtractor {
    public extractAuthSeqId(e: Canvas3D.HoverEvent): number | undefined {
        const structureElementLoci = getStructureElementLoci(e.current?.loci);
        if (structureElementLoci) {
            const structureElement = StructureElement.Stats.ofLoci(structureElementLoci);
            const location = structureElement.firstElementLoc;
            if (location.unit) {
                return StructureProperties.residue.auth_seq_id(location);
            }
        }
    }
}
export default class HighlightFinderMolstarEvent {
    constructor(private readonly authSeqIdExtractor: AuthSeqIdExtractor) { };

    public calculate(e: Canvas3D.HoverEvent, structureMapping: Mapping): Highlight[] {
        const result: Highlight[] = [];
        const authSeqId = this.authSeqIdExtractor.extractAuthSeqId(e);
        if (authSeqId) {
            const position = this.getPosition(authSeqId, structureMapping);
            if (position) {
                if (position >= structureMapping.uniprotStart && position <= structureMapping.uniprotEnd) {
                    result.push({ start: position, end: position });
                }
            }
        }
        return result;
    }

    private getPosition(authSeqId: number, structureMapping: Mapping): number | undefined {
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

    private getFragmentMapping(resNum: number, structureMapping: Mapping): FragmentMapping | undefined {
        for (let i = 0; i < structureMapping.fragmentMappings.length; i++) {
            const fragmentMapping = structureMapping.fragmentMappings[i];
            if (fragmentMapping.pdbStart <= resNum && fragmentMapping.pdbEnd >= resNum) {
                return fragmentMapping;
            }
        }
    }
}