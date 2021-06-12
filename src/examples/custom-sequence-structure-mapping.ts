import { data } from "./custom-structure-data";

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
            format: "mmcif", //valid parameters are PDB and mmcif
            data: data //window.uig_a, //the structure in the PDB or mmcif format
            //uri: "https://www.ebi.ac.uk/pdbe/static/entry/5uig_updated.cif", 
        },
        start: 27, // where the structure begins with respect to the full molecule sequence
        end: 438, // where the structure ends with respect to the full molecule sequence
        unp_start: 1, // where the structure begins with respect to the sequence (the sequence does not have to covert the full molecule, therefore seqStart does not have to be 1)
        unp_end: 316, // where the structure ends with respect to the sequence
        coverage: {
            "5uig": {
                molecules: [
                    {
                        chains: [
                            {
                                observed: [
                                    {
                                        start: {
                                            residue_number: 30, // position of the region with respect to the full molecule sequence
                                            author_residue_number: 4, // position with respect to the beginning of the structure (in this case first three residues are not observed, i.e. residues 27, 28, 29 with respect to the full molecule)
                                            author_insertion_code: undefined
                                        },
                                        end: {
                                            residue_number: 148,
                                            author_residue_number: 174,
                                            author_insertion_code: undefined
                                        }
                                    },
                                    {
                                        start: {
                                            author_residue_number: 159,
                                            author_insertion_code: undefined,
                                            residue_number: 185
                                        },
                                        end: {
                                            author_residue_number: 1048,
                                            author_insertion_code: undefined,
                                            residue_number: 282
                                        }
                                    },
                                    {
                                        start: {
                                            author_residue_number: 1056,
                                            author_insertion_code: undefined,
                                            residue_number: 290
                                        },
                                        end: {
                                            author_residue_number: 311,
                                            author_insertion_code: undefined,
                                            residue_number: 433
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        }
    }
];