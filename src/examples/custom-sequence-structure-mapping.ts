//import { data } from "./custom-structure-data-mmcif";

export const sequence =
    "MPIMGSSVYITVELAIAVLAILGNVLVCWAVWLNSNLQNVTNYFVVSLAAADIAVGVLAI\n" +
    "PFAITISTGFCAACHGCLFIACFVLVLTQSSIFSLLAIAIDRYIAIRIPLRYNGLVTGTR\n" +
    "AKGIIAICWVLSFAIGLTPMLGWNNCGQPKEGKNHSQGCGEGQVACLFEDVVPMNYMVYF\n" +
    "NFFACVLVPLLLMLGVYLRIFLAARRQLKQMESQPLPGERARSTLQKEVHAAKSLAIIVG\n" +
    "LFALCWLPLHIINCFTFFCPDCSHAPLWLMYLAIVLSHTNSVVNPFIYAYRIREFRQTFR\n" +
    "KIIRSHVLRQQEPFKAAGTSARVLAAHGSDGEQVSLRLNGHPPGVWANGSAPHPERRPNG\n" +
    "YALGLVSGGSAQESQGNTGLPDVELLSHELKGVCPEPPGLDDPLAQDGAGVS";
export const sequenceStructureMapping = [
    {
        pdb_id: "5uig",
        chain_id: "A",
        structure: {
            format: "mmcif", //valid parameters are pdb and mmcif
            //data: data //the structure in the PDB or mmcif format
            url: "https://www.ebi.ac.uk/pdbe/static/entry/5uig_updated.cif"
        },
        start: 27, // where the structure begins with respect to the full molecule sequence
        end: 438, // where the structure ends with respect to the full molecule sequence
        unp_start: 1, // where the structure begins with respect to the sequence (the sequence does not have to covert the full molecule, therefore seqStart does not have to be 1)
        unp_end: 316, // where the structure ends with respect to the sequence,
        mappings: {
            A: {
                struct_asym_id: "A",
                fragment_mappings: [
                    {
                        entity_id: 1,
                        end: { residue_number: 234 },
                        start: { residue_number: 27 },
                        unp_end: 208,
                        unp_start: 1
                    },
                    {
                        entity_id: 1,
                        end: { residue_number: 438 },
                        start: { residue_number: 341 },
                        unp_end: 316,
                        unp_start: 219
                    }
                ]
            }
        },
        polymer_coverage: {
            "5uig": {
                molecules: [
                    {
                        entity_id: 1,
                        chains: [
                            {
                                observed: [
                                    {
                                        start: { residue_number: 30 },
                                        end: { residue_number: 174 }
                                    },
                                    {
                                        start: { residue_number: 185 },
                                        end: { residue_number: 282 }
                                    },
                                    {
                                        start: { residue_number: 290 },
                                        end: { residue_number: 433 }
                                    }
                                ],
                                chain_id: "A",
                                struct_asym_id: "A"
                            }
                        ]
                    }
                ]
            }
        }
    }
];
