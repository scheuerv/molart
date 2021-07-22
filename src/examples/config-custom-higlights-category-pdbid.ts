export const configCustomHiglightCategoryPdbIdSetting = {
    structure: {
        extraHighlights: [
            {
                label: "ball and stick",
                props: {
                    type: "ball-and-stick",
                    typeParams: { alpha: 1 },
                    color: "uniform",
                    colorParams: { value: 0x00ff00 },
                    size: "uniform",
                    sizeParams: { value: 10 }
                },
                residue: {
                    residueNumFrom: 90,
                    residueNumTo: 110
                },
                atom: ["CA", "CE"]
            },
            {
                label: "molecular surface",
                props: {
                    type: "molecular-surface",
                    typeParams: {
                        alpha: 0.5,
                        visuals: ["molecular-surface-wireframe"],
                        probeRadius: 0,
                        resolution: 1.25,
                        quality: "high"
                    },
                    color: "uniform",
                    colorParams: { value: 0x0000ff }
                },
                residue: {
                    residueNumFrom: 60,
                    residueNumTo: 62
                },
                chain: ["A", "I"]
            }
        ]
    },
    sequence: {
        uniprotId: "P37840",
        pdbIds: ["6cu7", "2m55"],
        categoryOrder: ["VARIATION", "STRUCTURAL"],
        categoryExclusions: [
            "SEQUENCE_INFORMATION",
            "TOPOLOGY",
            "MUTAGENESIS",
            "MOLECULE_PROCESSING"
        ]
    }
};
