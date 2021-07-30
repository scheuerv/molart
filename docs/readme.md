# Developers documentation

## Obtaining MOLART

### Build and run

```bash
git clone https://github.com/scheuerv/molart.git
npm i
npm run start
```

Open your browser on <http://localhost:1341/>.

Or to see examples open your browser on <http://localhost:1341/examples>.

### Build examples

```bash
git clone https://github.com/scheuerv/molart.git
npm i
npm run build
```

Examples are build in `dist` folder. To browse examples open `index.html` file.

### Using MOLART as a NPM package

If your application uses NPM as the packaging system, MOLART can be
also easily obtain with NPM using:

```
npm i molart2
```

## Using the plugin

### Create a containers

Create a DIV or SPAN elements. One which will contain uniprot-nightingale module and other for structure viewer.

```html
<div id="sequence-wrapper"></div>
<div id="structure-wrapper"></div>
```

### Create instance of MOLART

You need to create an instance of the Structure viewer and pass it to MolArt constructor together with sequence container element.

```typescript
import { MolArt } from "molart/lib/molart";
import MolstarPlugin { MolstarPluginConfig } from "molart/lib/molstar-plugin/molstar-plugin";
import { MolstarResidue } from "molart/lib/types/molstar-residue";
const molart = new MolArt<MolstarPluginConfig, MolstarResidue>(
    new MolstarPlugin(document.getElementById("ma-structure-wrapper"),
    document.getElementById("ma-sequence-wrapper")
);
```

### Create instance of MOLART

Finally, you need to create config and load it.

```typescript
import { Config } from "molart/lib/molart";
const config: Config<MolstarPluginConfig> = {
    structure: { extraHighlights: [] },
    sequence: { uniprotId: "P37840" }
};
molart.loadConfig(config);
```

## Options, parameters and events

### Define visibility and order of categories

In order to exclude categories or customize their order, simply add additional
parameters to the `MolArt` config.

```typescript
import { Config, MolArt  } from "molart/lib/molart";
import MolstarPlugin { MolstarPluginConfig } from "molart/lib/molstar-plugin/molstar-plugin";
import { MolstarResidue } from "molart/lib/types/molstar-residue";
const config: Config<MolstarPluginConfig> = {
    structure: {
        extraHighlights: []
    },
    sequence: {
        uniprotId: "P37840",
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
const molart = new MolArt<MolstarPluginConfig, MolstarResidue>(
    new MolstarPlugin(document.getElementById("ma-structure-wrapper"),
    document.getElementById("ma-sequence-wrapper")
).loadConfig(config);
```

### Custom data sources

You can also provide custom annotations which will be automatically
mapped over the structures. The format of the annotation data
is defined in [uniprot-nightingale config definiton](https://github.com/scheuerv/uniprot-nightingale/blob/master/src/types/config.ts) section.
MOLART lets you to
use multiple data sources.

The following example shows how to mix "local"
with "external" data sources. In the following example, there are two data sources one provides annotations defined by `customFeatures` other downloads data from <http://localhost/externalFeatures_P37840.json> (if available).

```typescript
import { Config, MolArt  } from "molart/lib/molart";
import MolstarPlugin { MolstarPluginConfig } from "molart/lib/molstar-plugin/molstar-plugin";
import { MolstarResidue } from "molart/lib/types/molstar-residue";
import { CustomDataSource } from "uniprot-nightingale/lib/types/config";
import { CustomDataSourceData } from "uniprot-nightingale/lib/types/config";

const customFeatures: CustomDataSourceData = {
    sequence: `MPIMGSSVYITVELAIAVLAILGNVLVCWAVWLNSNLQNVTNYFVVSLAAADIAVGVLAI
PFAITISTGFCAACHGCLFIACFVLVLTQSSIFSLLAIAIDRYIAIRIPLRYNGLVTGTR
AKGIIAICWVLSFAIGLTPMLGWNNCGQPKEGKNHSQGCGEGQVACLFEDVVPMNYMVYF
NFFACVLVPLLLMLGVYLRIFLAARRQLKQMESQPLPGERARSTLQKEVHAAKSLAIIVG
LFALCWLPLHIINCFTFFCPDCSHAPLWLMYLAIVLSHTNSVVNPFIYAYRIREFRQTFR
KIIRSHVLRQQEPFKAAGTSARVLAAHGSDGEQVSLRLNGHPPGVWANGSAPHPERRPNG
YALGLVSGGSAQESQGNTGLPDVELLSHELKGVCPEPPGLDDPLAQDGAGVS`,
    features: [
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

const customDataSources : CustomDataSource[] = [
    {
        source: "CUSTOM",
        data: customFeatures
    },
    {
        source: "CUSTOM URL",
        useExtension: true,
        url: "http://localhost/externalFeatures_"
    }
];

const config : Config<MolstarPluginConfig> = {
    structure: {
        extraHighlights: []
    },
    sequence: {
        uniprotId: "P37840",
        customDataSources: customDataSources
    }
};

const molart = new MolArt<MolstarPluginConfig, MolstarResidue>(
    new MolstarPlugin(document.getElementById("ma-structure-wrapper"),
    document.getElementById("ma-sequence-wrapper")
).loadConfig(config);


```

### Custom sequence and sequence-structure mapping

MolArt is able to handle situations when a user wants to visualize

-   a sequence which is not available in UniProt
-   PDB structures where the sequence-structure mapping is not available in Protein API
-   structures which are not in PDB

#### User-provided sequence-structure mapping

To provide a custom sequence-structure mapping, one needs to pass MolArt the information about
which structures map to given sequence and which regions in the sequence map to which regions in the structure. This
is basically the information which MolArt automatically gets from the `https://www.ebi.ac.uk/pdbe/api/mappings/best_structures/`
and `https://www.ebi.ac.uk/pdbe/api/pdb/entry/polymer_coverage/` PDBe REST API endpoints. Also the format is
somewhat similar to what these endpoints provide.

The format also allows to define custom source of data which can be either a valid URI (`structure.url`) or simply
a string with the structure data (`structure.data`). In any case, the user needs to pass in information about the
format of the data (`structure.format`) which can be either `mmCIF` or `PDB`.

```typescript
import { Config, MolArt  } from "molart/lib/molart";
import MolstarPlugin { MolstarPluginConfig } from "molart/lib/molstar-plugin/molstar-plugin";
import { MolstarResidue } from "molart/lib/types/molstar-residue";
import { PDBParserData } from "uniprot-nightingale/lib/types/pdb-parser";
import { data } from "molart/src/examples/custom-structure-data-mmcif";
const sequenceStructureMapping : PDBParserData = [
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

 const config : Config<MolstarPluginConfig>= {
    structure: {
        extraHighlights: []
    },
    sequence: {
        uniprotId: "P37840",
        sequenceStructureMapping: sequenceStructureMapping,
    }
};

const molart = new MolArt<MolstarPluginConfig, MolstarResidue>(
    new MolstarPlugin(document.getElementById("ma-structure-wrapper"),
    document.getElementById("ma-sequence-wrapper")
).loadConfig(config);
```

#### User-provided sequence

To provide custom sequence, one simply needs to do so in the MolArt config. Obviously, in such a case
the sequence must be accompanied by a sequence-structure mapping as there is not UniProtID which could be
used to obtain the mapping. Moreover, it is not possible to provide both sequence and UniProt ID at the
same time.

```typescript
import { Config, MolArt } from "molart/lib/molart";
import MolstarPlugin { MolstarPluginConfig } from "molart/lib/molstar-plugin/molstar-plugin";
import { MolstarResidue } from "molart/lib/types/molstar-residue";
const sequenceStructureMapping : PDBParserData = [
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

 const config: Config<MolstarPluginConfig> = {
    structure: {
        extraHighlights: []
    },
    sequence: {
        sequence: `MPIMGSSVYITVELAIAVLAILGNVLVCWAVWLNSNLQNVTNYFVVSLAAADIAVGVLAI
PFAITISTGFCAACHGCLFIACFVLVLTQSSIFSLLAIAIDRYIAIRIPLRYNGLVTGTR
AKGIIAICWVLSFAIGLTPMLGWNNCGQPKEGKNHSQGCGEGQVACLFEDVVPMNYMVYF
NFFACVLVPLLLMLGVYLRIFLAARRQLKQMESQPLPGERARSTLQKEVHAAKSLAIIVG
LFALCWLPLHIINCFTFFCPDCSHAPLWLMYLAIVLSHTNSVVNPFIYAYRIREFRQTFR
KIIRSHVLRQQEPFKAAGTSARVLAAHGSDGEQVSLRLNGHPPGVWANGSAPHPERRPNG
YALGLVSGGSAQESQGNTGLPDVELLSHELKGVCPEPPGLDDPLAQDGAGVS`,
        sequenceStructureMapping: sequenceStructureMapping,
    }
};

const molart = new MolArt<MolstarPluginConfig, MolstarResidue>(
    new MolstarPlugin(document.getElementById("ma-structure-wrapper"),
    document.getElementById("ma-sequence-wrapper")
).loadConfig(config);
```

### Other options

-   `pdbIds` (default `undefined`) - list of PDB IDs (such as `['3q26', '4r17']`) which are supposed to be shown in the Experimental structures category. Structures in the mapping outside of this list will not be shown. If not set, no restriction takes place.

-   `smrIds` (default `undefined`) - list of SMR IDs (such as `['6ssx.1']`) which are supposed to be shown in the Predicted structures category. Structures in the mapping outside of this list will not be shown. If not set, no restriction takes place.

-   `extraHighlights` (default `undefined`) - allows to highlight a list of residues and
    even restrict atoms of the residues. Moreover, one can specify the type of highlight according to Mol\* StructureRepresentationBuiltInProps setting. Specifically, on needs to pass an object containing an array where each element defines a selection and how that selection should be viusalized. A dropdown will be shown in the header where the user can turn on and of the defined highlights.

```typescript
import { Config } from "molart/lib/molart";
import { MolstarPluginConfig } from "molart/lib/molstar-plugin/molstar-plugin";
const config: Config<MolstarPluginConfig> = {
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
        //smrIds which should be shown (others won't)
        smrIds: ["6ssx.1"]
    }
};
```

### Events

MolArt object generates several events. The app which owns the MolArt object can register listeners for those events and thus react on what happens inside the plugin.

-   `onSequenceViewerReady`
    Once the _onSequenceViewerReady_ is emitted, the sequence view is ready to accept user events.
-   `onStructureLoaded`
    Emitted every time the active structure changes.
-   `onStructureMouseOn`

    ```typescript
    molart.onStructureMouseOn.on((residue) => {
        console.log(residue);
    });
    ```

    Triggers when a residue is hovered over in the structure view.
    The listener is passed an argument with a `MolstarResidue` object containing information about
    the corresponding residue. The `MolstarResidue` object
    contains information as returned from Mol\*:

    -   ```typescript
        {
            authName: "SER",
            authSeqNumber: 13,
            chain: {
                asymId: "A",
                authAsymId: "A",
                entity: {
                    entityId: "1",
                    index: 0
                    },
                index: 0
            },
            index: 12,
            insCode: null,
            isHet: 0,
            name: "SER",
            seqNumber: 281,
        }
        ```

-   `onStructureMouseOff`
    -   Triggers when the mouse stops being over a residue.
-   `onSequenceMouseOn`
    -   Triggers when a mouse hovers over a position in the sequence view.
        The listener is passed an argument which corresponds to the actual position in the sequence.
-   `onSequenceMouseOff`
    -   Triggers when the mouse leaves the space of the sequence view.

### MolArt API

Molart can be partially controlled from by accessing methods available in the MolArt object.

-   `loadConfig(config: Config<StructureConfig>)`

    -   Loads new Molart config.

    ```typescript
    type Config<StructureConfig> = {
        readonly structure: StructureConfig;
        readonly sequence: SequenceConfig;
    };
    ```

-   `getSequenceController(): TrackManager | undefined`

    -   Returns TrackManager.

-   `getStructureController(): StructureViewer<StructureConfig, Residue>`

    -   Returns StructureViewer.

-   `highlightInSequence(higlight: Highlight)`

    -   Highlights the specified range with specified (or default) color in the sequence view.

    ```typescript
    type Highlight = {
        readonly sequenceStart: number;
        readonly sequenceEnd: number;
        readonly color?: string;
    };
    ```

-   `unhighlightInSequence()`

    -   Removes user highlighting in the sequence view.

-   `highlightInStructure(resNum: number, chain?: string)`

    -   Highlights the specified residue in the structure view. The position is the position in sequence (which might differ from the position in the structure). If the chain is specified, only the residue contained in this chain will be hightlighted.

-   `unhighlightInStructure()`

    -   Removes user highlighting in the structure view.

-   `focusInStructure(resNum: number, radius = 0, chain?: string)`

    -   Focuses at a given residue possibly in given chain.

-   `isStructureLoaded()`

    -   True if a structure is loaded.

-   `getSequenceStructureRange(): Interval[]`
    -   Get ranges in the sequence which have a structure mapped. The return value is an array of Interval objects which contain start and end attributes.

## How to publish on npm

```bash
rm -r lib
tsc -p .\tsconfig.prod.json
#increase version in package.json
cp src/main.css lib/
npm publish
```
