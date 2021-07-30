import { MolstarPluginConfig } from "../molstar-plugin/molstar-plugin";
import { Config } from "../molart";
export const configCustomHiglightCategoryPdbIdSetting: Config<MolstarPluginConfig> = {
    structure: {
        extraHighlights: [
            {
                //higlight name
                label: "ball and stick",
                //Mol* StructureRepresentationBuiltInProps setting
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
                //atoms which should be highlighted
                //we use author atom names for predicted structures and label (classic)
                //atom names for experimental and user defined structures
                atom: ["CA", "CE"]
            },
            {
                //higlight name
                label: "molecular surface",
                //Mol* StructureRepresentationBuiltInProps setting
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
                //range of residues which should be highlighted
                //we use author indices for predicted structures and label (classic)
                //indices for experimental and user defined structures
                residue: {
                    residueNumFrom: 60,
                    residueNumTo: 62
                },
                //chains which should be highlighted
                //we use author chain names for predicted structures and label (classic)
                //chain names for experimental and user defined structures
                chain: ["A", "I"]
            }
        ]
    },
    sequence: {
        uniprotId: "P37840",
        //pdbIds which should be shown (others won't)
        pdbIds: ["6cu7", "2m55"],
        //order of first categories, others wil be shown after these by default order
        categoryOrder: ["VARIATION", "STRUCTURAL"],
        //categories which shouldn't be shown
        categoryExclusions: [
            "SEQUENCE_INFORMATION",
            "TOPOLOGY",
            "MUTAGENESIS",
            "MOLECULE_PROCESSING"
        ]
    }
};
