import { Canvas3D } from "Molstar/mol-canvas3d/canvas3d";
import { StructureElement, StructureProperties } from "Molstar/mol-model/structure";
import { getStructureElementLoci } from "./molstar-utils";
import { FragmentMapping } from "uniprot-nightingale/lib/types/mapping";
import { Highlight } from "uniprot-nightingale/lib/types/highlight";

export interface SeqIdExtractor {
    extractSeqId(e: Canvas3D.HoverEvent): number | undefined;
}
export class MolstarLabelSeqIdExtractor implements SeqIdExtractor {
    public extractSeqId(e: Canvas3D.HoverEvent): number | undefined {
        const structureElementLoci = getStructureElementLoci(e.current?.loci);
        if (structureElementLoci) {
            const structureElement = StructureElement.Stats.ofLoci(structureElementLoci);
            const location = structureElement.firstElementLoc;
            if (location.unit) {
                return StructureProperties.residue.label_seq_id(location);
            }
        }
    }
}
export class MolstarAuthSeqIdExtractor implements SeqIdExtractor {
    public extractSeqId(e: Canvas3D.HoverEvent): number | undefined {
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
    constructor(private readonly seqIdExtractor: SeqIdExtractor) {}

    public calculate(e: Canvas3D.HoverEvent, structureMapping: FragmentMapping[]): Highlight[] {
        const result: Highlight[] = [];
        const seqId = this.seqIdExtractor.extractSeqId(e);
        if (seqId) {
            const position = this.getPosition(seqId, structureMapping);
            if (position) {
                result.push({ sequenceStart: position, sequenceEnd: position });
            }
        }
        return result;
    }

    private getPosition(
        structureResidueNumber: number,
        structureMapping: FragmentMapping[]
    ): number | undefined {
        const fragmentMapping = this.getFragmentMapping(structureResidueNumber, structureMapping);
        if (fragmentMapping) {
            return (
                structureResidueNumber -
                fragmentMapping.structureStart +
                fragmentMapping.sequenceStart
            );
        }
        return undefined;
    }

    private getFragmentMapping(
        structureResidueNumber: number,
        structureMapping: FragmentMapping[]
    ): FragmentMapping | undefined {
        for (let i = 0; i < structureMapping.length; i++) {
            const fragmentMapping = structureMapping[i];
            if (
                fragmentMapping.structureStart <= structureResidueNumber &&
                fragmentMapping.structureEnd >= structureResidueNumber
            ) {
                return fragmentMapping;
            }
        }
    }
}
