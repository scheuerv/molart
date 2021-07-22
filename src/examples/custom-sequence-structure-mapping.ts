import { data } from "./custom-structure-data-mmcif";

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
            data: data //the structure in the PDB or mmcif format
            //url: "https://www.ebi.ac.uk/pdbe/static/entry/5uig_updated.cif"
        },
        // where the structure begins with respect to the full molecule sequence (structure index)
        start: 27,
        // where the structure ends with respect to the full molecule sequence (structure index)
        end: 438,
        // where the structure begins with respect to the sequence (sequence index)
        unp_start: 1,
        // where the structure ends with respect to the sequence (sequence index)
        unp_end: 316,
        //
        mappings: {
            //mapping for chain A
            A: {
                //we use struct_asym_id when data format is mmcif
                struct_asym_id: "A",
                //sequence structure mappings
                fragment_mappings: [
                    {
                        entity_id: 1,
                        //structure end index
                        end: { residue_number: 234 },
                        //structure start index
                        start: { residue_number: 27 },
                        //sequence end index
                        unp_end: 208,
                        //sequence start index
                        unp_start: 1
                    },
                    {
                        entity_id: 1,
                        //structure end index
                        end: { residue_number: 438 },
                        //structure start index
                        start: { residue_number: 341 },
                        //sequence end index
                        unp_end: 316,
                        //sequence start index
                        unp_start: 219
                    }
                ]
            }
        },
        // observed fragments coverage
        // data in the same format as provided by ebi on https://www.ebi.ac.uk/pdbe/api/pdb/entry/polymer_coverage/{pdbId}
        polymer_coverage: {
            "5uig": {
                molecules: [
                    {
                        entity_id: 1,
                        chains: [
                            {
                                //structure start/end indices for observed ranges
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
