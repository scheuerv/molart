import { Loci } from "Molstar/mol-model/loci";
import { Bond, StructureElement } from "Molstar/mol-model/structure";
/**
 * Coverts goven loci to object of type StructureElement.Loci if possible.
 * @param loci Mol* Loci
 * @returns StructureElement.Loci or undefined if StructureElement.Loci can not be created from given loci
 */
export function getStructureElementLoci(loci: Loci): StructureElement.Loci | undefined {
    if (loci.kind == "bond-loci") {
        return Bond.toStructureElementLoci(loci);
    } else if (loci.kind == "element-loci") {
        return loci;
    }
    return undefined;
}
