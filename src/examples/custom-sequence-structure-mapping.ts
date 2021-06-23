//import { data } from "./custom-structure-data";

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
            //data: data //the structure in the PDB or mmcif format
            uri: "https://www.ebi.ac.uk/pdbe/static/entry/5uig_updated.cif"
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
                                            residue_number: 30 // position of the region with respect to the full molecule sequence
                                        },
                                        end: {
                                            residue_number: 148
                                        }
                                    },
                                    {
                                        start: {
                                            residue_number: 185
                                        },
                                        end: {
                                            residue_number: 282
                                        }
                                    },
                                    {
                                        start: {
                                            residue_number: 290
                                        },
                                        end: {
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
