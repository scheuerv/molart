export const customFeatures = {
    sequence: `MPIMGSSVYITVELAIAVLAILGNVLVCWAVWLNSNLQNVTNYFVVSLAAADIAVGVLAI
PFAITISTGFCAACHGCLFIACFVLVLTQSSIFSLLAIAIDRYIAIRIPLRYNGLVTGTR
AKGIIAICWVLSFAIGLTPMLGWNNCGQPKEGKNHSQGCGEGQVACLFEDVVPMNYMVYF
NFFACVLVPLLLMLGVYLRIFLAARRQLKQMESQPLPGERARSTLQKEVHAAKSLAIIVG
LFALCWLPLHIINCFTFFCPDCSHAPLWLMYLAIVLSHTNSVVNPFIYAYRIREFRQTFR
KIIRSHVLRQQEPFKAAGTSARVLAAHGSDGEQVSLRLNGHPPGVWANGSAPHPERRPNG
YALGLVSGGSAQESQGNTGLPDVELLSHELKGVCPEPPGLDDPLAQDGAGVS`,
    features: [
        {
            type: "UNIQUE_MAXQ",
            category: "PROTEOMICS",
            description: "MaxQuant",
            begin: "17",
            end: "27",
            color: "#00B88A"
        },
        {
            type: "UNIQUE_MAXQ",
            category: "PROTEOMICS",
            description: "MaxQuant",
            begin: "18",
            end: "29",
            color: "#00B88A"
        },
        {
            type: "UNIQUE_MAXQ",
            category: "PROTEOMICS",
            description: "MaxQuant",
            begin: "28",
            end: "33",
            color: "#00B88A"
        },
        {
            type: "UNIQUE_MAXQ",
            category: "PROTEOMICS",
            description: "MaxQuant",
            begin: "47",
            end: "59",
            color: "#00B88A"
        },
        {
            type: "UNIQUE_MAXQ",
            category: "PROTEOMICS",
            description: "N-APP",
            begin: "86",
            end: "97",
            color: "#00B88A"
        },
        {
            type: "UNIQUE_MAXQ",
            category: "PROTEOMICS",
            description: "MaxQuant",
            begin: "72",
            end: "83",
            color: "#00B88A"
        },
        {
            type: "UNIQUE_MAXQ",
            category: "PROTEOMICS",
            description: "MaxQuant",
            begin: "52",
            end: "61",
            color: "#00B88A"
        },
        {
            type: "NON_UNIQUE_MAXQ",
            category: "PROTEOMICS",
            description: "MaxQuant",
            begin: "96",
            end: "110",
            color: "#FFCC33"
        },
        {
            type: "NON_UNIQUE_MAXQ",
            category: "PROTEOMICS",
            description: "MaxQuant",
            begin: "181",
            end: "188",
            color: "#FFCC33"
        },
        {
            type: "CATALYTIC_SITE",
            category: "DOMAINS_AND_SITES",
            description: "Inherited through a sequence alignment",
            begin: "147",
            end: "147"
        },
        {
            type: "CATALYTIC_SITE",
            category: "DOMAINS_AND_SITES",
            description: "Inherited through a sequence alignment",
            begin: "151",
            end: "151"
        },
        {
            type: "CATALYTIC_SITE",
            category: "DOMAINS_AND_SITES",
            description: "Inherited through a sequence alignment",
            begin: "168",
            end: "168"
        },
        {
            type: "NOVEL_FEATURE",
            category: "NOVELTIES",
            begin: "43",
            end: "45"
        },
        {
            type: "TURN",
            category: "STRUCTURAL",
            begin: "47",
            end: "49",
            color: "#00CCCC"
        },
        {
            type: "STRAND",
            category: "STRUCTURAL",
            begin: "52",
            end: "54",
            color: "#70E000"
        },
        {
            type: "STRAND",
            category: "STRUCTURAL",
            begin: "56",
            end: "58",
            color: "#70E000"
        },
        {
            type: "HELIX",
            category: "STRUCTURAL",
            begin: "66",
            end: "76",
            color: "#FF66FF"
        },

        {
            type: "VARIANT",
            category: "VARIATION",
            description: "Same mutation, opposite predictions, same xrefs",
            alternativeSequence: "S",
            begin: "91",
            end: "91",
            xrefs: [
                {
                    name: "ExAC",
                    id: "rs747355134",
                    url: "http://exac.broadinstitute.org/dbsnp/rs747355134"
                }
            ],
            wildType: "P",
            predictions: [
                {
                    predictionValType: "looking good",
                    score: 0.001,
                    predAlgorithmNameType: "PolyPhen"
                },
                {
                    predictionValType: "looking still good",
                    score: 0.93,
                    predAlgorithmNameType: "SIFT"
                }
            ]
        },
        {
            type: "VARIANT",
            category: "VARIATION",
            description:
                "different position, originally in 8, less evidences, different made-up xref",
            alternativeSequence: "I",
            begin: "18",
            end: "18",
            xrefs: [
                {
                    name: "ExAC",
                    id: "rs1234567",
                    url: "http://exac.broadinstitute.org/dbsnp/rs1234567"
                },
                {
                    name: "OtherXRef",
                    id: "oxr:1234"
                }
            ],
            evidences: [
                {
                    code: "ECO:0000313",
                    source: {
                        name: "PubMed",
                        id: "23292937",
                        url: "http://www.ncbi.nlm.nih.gov/pubmed/23292937",
                        alternativeUrl: "http://europepmc.org/abstract/MED/23292937"
                    }
                }
            ],
            wildType: "L",
            predictions: [
                {
                    predictionValType: "unknown",
                    score: 0.0,
                    predAlgorithmNameType: "PolyPhen"
                },
                {
                    predictionValType: "not tolerated, low value",
                    score: 0.13,
                    predAlgorithmNameType: "SIFT"
                }
            ]
        },
        {
            type: "VARIANT",
            category: "VARIATION",
            description: "Same mutation, no predictions, no xref",
            alternativeSequence: "I",
            begin: "86",
            end: "86",
            wildType: "V",
            consequenceType: "mutation"
        },
        {
            type: "VARIANT",
            category: "VARIATION",
            alternativeSequence: "S",
            begin: "184",
            end: "184",
            wildType: "F",
            predictions: [
                {
                    predictionValType: "unknown",
                    score: 0.0,
                    predAlgorithmNameType: "PolyPhen"
                },
                {
                    predictionValType: "deleterious",
                    score: 0.04,
                    predAlgorithmNameType: "SIFT"
                }
            ]
        },
        {
            type: "VARIANT",
            category: "VARIATION",
            alternativeSequence: "T",
            begin: "17",
            end: "17",
            wildType: "A",
            predictions: [
                {
                    predictionValType: "benign",
                    score: 0.11111,
                    predAlgorithmNameType: "PolyPhen"
                },
                {
                    predictionValType: "tolerated",
                    score: 0.99999,
                    predAlgorithmNameType: "SIFT"
                }
            ]
        },
        {
            type: "VARIANT",
            category: "VARIATION",
            alternativeSequence: "V",
            begin: "17",
            end: "17",
            wildType: "A",
            consequenceType: "missense"
        },
        {
            type: "VARIANT",
            category: "VARIATION",
            alternativeSequence: "KKK",
            begin: "17",
            end: "18",
            wildType: "AL",
            predictions: [
                {
                    predictionValType: "deleterious",
                    score: 0.98,
                    predAlgorithmNameType: "PolyPhen"
                },
                {
                    predictionValType: "tolerated",
                    score: 0.89,
                    predAlgorithmNameType: "SIFT"
                }
            ]
        }
    ]
};
