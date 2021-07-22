import { Canvas3D } from "Molstar/mol-canvas3d/canvas3d";
import { StructureElement, StructureProperties, Unit } from "Molstar/mol-model/structure";
import { getStructureElementLoci } from "./molstar-utils";
import { ChainMapping, FragmentMapping, Mapping } from "uniprot-nightingale/lib/types/mapping";
import { Highlight } from "uniprot-nightingale/lib/types/highlight";

export interface IdExtractor {
    /**
     * Extracts residue number from location.
     */
    extractSeqId(location?: StructureElement.Location<Unit>): number | undefined;
    /**
     * Extracts chain ID from location.
     */
    extractAsymId(location?: StructureElement.Location<Unit>): string | undefined;
}

/**
 * Uses Mol* api to find label IDs of hovered residue or chain.
 */
export class MolstarLabelIdExtractor implements IdExtractor {
    /**
     * Extracts label sequence ID from given location.
     * @param location Mol* location.
     * @returns Label sequence ID or undefined if location not provided.
     */
    public extractSeqId(location?: StructureElement.Location<Unit>): number | undefined {
        if (location) {
            return StructureProperties.residue.label_seq_id(location);
        }
    }

    /**
     * Extracts label chain ID from given location.
     * @param location Mol* location.
     * @returns Label chain ID or undefined if location not provided.
     */
    public extractAsymId(location?: StructureElement.Location<Unit>): string | undefined {
        if (location) {
            return StructureProperties.chain.label_asym_id(location);
        }
    }
}

/**
 * Uses Mol* api to find author IDs of hovered residue or chain.
 */
export class MolstarAuthIdExtractor implements IdExtractor {
    /**
     * Extracts author sequence ID from given location.
     * @param location Mol* location.
     * @returns  Author sequence ID or undefined if location not provided.
     */
    public extractSeqId(location?: StructureElement.Location<Unit>): number | undefined {
        if (location) {
            return StructureProperties.residue.auth_seq_id(location);
        }
    }

    /**
     * Extracts author chain ID from given location.
     * @param location Mol* location.
     * @returns  Author chain ID or undefined if location not provided.
     */
    public extractAsymId(location?: StructureElement.Location<Unit>): string | undefined {
        if (location) {
            return StructureProperties.chain.auth_asym_id(location);
        }
    }
}

/**
 * It is used to calculate higlight in sequence when hovering over strcuture.
 *
 * It is given a IdExtractor in constructor which is later used to extract
 * correct index of the residue or chain (typically author index or label index).
 */
export default class HighlightFinderMolstarEvent {
    constructor(private readonly idExtractor: IdExtractor) {}

    /**
     * Using given mapping it creates sequence higlight from
     * event recieved from Mol* when hovering over residue.
     * @param event Hover event.
     * @param structureMapping  Mapping for all chains in structure.
     * @returns Empty array or array containing one object of type Highlight
     */
    public calculate(
        event: Canvas3D.HoverEvent,
        structureMapping?: Mapping,
        format?: string
    ): Highlight[] {
        const result: Highlight[] = [];
        this.findLocationWithUnit(event);
        const location = this.findLocationWithUnit(event);
        const chainId = this.idExtractor.extractAsymId(location);
        if (structureMapping && chainId) {
            // find correct mapping for hovered chain
            const foundChainMapping = this.findChainMapping(chainId, structureMapping, format);
            const seqId = this.idExtractor.extractSeqId(location);
            if (seqId && foundChainMapping) {
                const position = this.getPosition(seqId, foundChainMapping.fragmentMappings);
                if (position) {
                    result.push({ sequenceStart: position, sequenceEnd: position });
                }
            }
        }
        return result;
    }

    /**
     * Finds StructureElementLoci from given hover event and then its location.
     * @param event Hover event.
     * @returns Mol* Location, or undefined if Mol* StructureElementLoci or Location.unit not found.
     */
    private findLocationWithUnit(
        event: Canvas3D.HoverEvent
    ): StructureElement.Location<Unit> | undefined {
        const structureElementLoci = getStructureElementLoci(event.current?.loci);
        if (structureElementLoci) {
            const structureElement = StructureElement.Stats.ofLoci(structureElementLoci);
            const location = structureElement.firstElementLoc;
            if (location.unit) {
                return location;
            }
        }
    }

    /**
     *
     * @param chainId Chain ID.
     * @param structureMapping Mapping for all chains in structure.
     * @param format Format of structure coordinates file.
     * @returns
     */
    private findChainMapping(
        chainId: string,
        structureMapping: Mapping,
        format?: string
    ): ChainMapping | undefined {
        let result: ChainMapping | undefined = undefined;
        if (format == "mmcif") {
            Object.entries(structureMapping).forEach(([, chainMapping]) => {
                if (chainMapping.structAsymId == chainId) {
                    result = chainMapping;
                }
            });
        } else {
            result = structureMapping[chainId];
        }
        return result;
    }

    /**
     * Using the given fragmentMappings it maps the given residue index in
     * structure to position is uniprot sequence.
     * @param structureResidueNumber Residue index in structure.
     * @param fragmentMappings Mapping for one chain.
     * @returns
     */
    private getPosition(
        structureResidueNumber: number,
        fragmentMappings: FragmentMapping[]
    ): number | undefined {
        const fragmentMapping = this.getFragmentMapping(structureResidueNumber, fragmentMappings);
        if (fragmentMapping) {
            return (
                structureResidueNumber -
                fragmentMapping.structureStart +
                fragmentMapping.sequenceStart
            );
        }
        return undefined;
    }

    /**
     * Selects mapping from given fragmentMappings array whose range includes
     * given residue index in structure.
     * @param structureResidueNumber Residue index in structure.
     * @param fragmentMappings Mapping for one chain.
     * @returns Found mapping or undefined if appropriate mapping not found.
     */
    private getFragmentMapping(
        structureResidueNumber: number,
        fragmentMappings: FragmentMapping[]
    ): FragmentMapping | undefined {
        for (let i = 0; i < fragmentMappings.length; i++) {
            const fragmentMapping = fragmentMappings[i];
            if (
                fragmentMapping.structureStart <= structureResidueNumber &&
                fragmentMapping.structureEnd >= structureResidueNumber
            ) {
                return fragmentMapping;
            }
        }
    }
}
