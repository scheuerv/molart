import { Canvas3D } from "Molstar/mol-canvas3d/canvas3d";
import { StructureElement, StructureProperties } from "Molstar/mol-model/structure";
import { getStructureElementLoci } from "./molstar-utils";
import { FragmentMapping } from "uniprot-nightingale/src/types/mapping";
import { Highlight } from "uniprot-nightingale/src/types/highlight";

export interface LabelSeqIdExtractor {
    extractLabelSeqId(e: Canvas3D.HoverEvent): number | undefined;
}
export class MolstarLabelSeqIdExtractor implements LabelSeqIdExtractor {
    public extractLabelSeqId(e: Canvas3D.HoverEvent): number | undefined {
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
export default class HighlightFinderMolstarEvent {
    constructor(private readonly labelSeqIdExtractor: LabelSeqIdExtractor) {}

    public calculate(e: Canvas3D.HoverEvent, structureMapping: FragmentMapping[]): Highlight[] {
        const result: Highlight[] = [];
        const labelSeqId = this.labelSeqIdExtractor.extractLabelSeqId(e);
        if (labelSeqId) {
            const position = this.getPosition(labelSeqId, structureMapping);
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
