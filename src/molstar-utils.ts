import { Loci } from "Molstar/mol-model/loci";
import { Bond, StructureElement } from "Molstar/mol-model/structure";
export function getStructureElementLoci(loci: Loci): StructureElement.Loci | undefined {
    if (loci.kind == "bond-loci") {
        return Bond.toStructureElementLoci(loci);
    } else if (loci.kind == "element-loci") {
        return loci;
    }
    return undefined;
}
