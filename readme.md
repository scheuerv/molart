# MolArt 2.0 ![NPM](https://img.shields.io/npm/l/molart2) [![npm version](https://badge.fury.io/js/molart2.svg)](https://badge.fury.io/js/molart2)

A tool for visualization of annotated protein sequence and its corresponding experimental or predicted protein structure.

Examples of MolArt's use can be found at <https://scheuerv.github.io/molart/>.

[Documentation](https://github.com/scheuerv/molart/tree/master/docs) shows usage of the plugin.

## Features overview

-   Visualization of protein structure as provided by [Mol\*](https://github.com/molstar)
-   Annotation of protein sequence as provided by [uniprot-nightingale](https://github.com/scheuerv/uniprot-nightingale) module which is using [Nightingale](https://github.com/ebi-webcomponents/nightingale) library
-   Mapping of structure on corresponding substring in the sequence
-   Automatic retrieval of sequence data based on UniProt ID and corresponding experimental structures from PDB
-   Retrieval of predicted models from [SWISS-MODEL Repository](https://swissmodel.expasy.org/repository) (SMR)
-   Controlling transparency of the structure to see both cartoon and surface view of the structure
-   Hovering over position in sequence to highlight it in structure and vice versa
-   Color overlay any sequence feature over the structure
-   Color overlay all sequence features of given type over the structure
-   Color overlay individual variation over the structure
-   Color overlay mutation frequency of residues over the structure
-   Upload of custom annotations
-   Ability to control which structures will be shown
-   Ability to select and highlight specific residues (not necessarily corresponding to annotations) and specific atoms
-   Ability to provide custom sequence and mapping

## Data sources

-   Sequence and annotation data
    -   Sequence information comes from [UniProt website REST API](https://www.uniprot.org/help/api) or can be provided by the user
    -   Sequence annotations are provided by
        -   ProtVista plugin which utilizes the EBI's
            [Proteins REST API](https://www.ebi.ac.uk/proteins/api/doc/).
            Proteins API includes access to variation, proteomics and antigen services containing
            "annotations imported and mapped from large scale data sources, such as 1000 Genomes,
            ExAC (Exome Aggregation Consortium), COSMIC (Catalogue Of Somatic Mutations In Cancer),
            PeptideAtlas, MaxQB (MaxQuant DataBase), EPD (Encyclopedia of Proteome Dynamics) and HPA,
            along with UniProtKB annotations for these feature types".
-   Structure mapping

    -   Automatic
        -   To obtain the mapping between UniProt and PDB, MolArt is using the [SIFTS API](https://www.ebi.ac.uk/pdbe/api/doc/sifts.html), part of the [PDBe REST API](http://www.ebi.ac.uk/pdbe/pdbe-rest-api).
        -   To obtain predicted structures, SMR is queried using its [API](https://swissmodel.expasy.org/docs/repository_help#smr_api) for available models.
    -   Custom
        -   When working with sequence which is not in UniProt or when the mapping is not known,
            sequence-structure mapping can be provided. This includes
            -   Molecule-level mapping, i.e. which PDB structures correspond to the sequence
            -   Residue-level mapping, i.e. which regions in sequence correspond to which regions in the structure

-   Structure data
    -   In case an experimental structure is available in PDB for given UniProt ID, this structure is downloaded by Mol*. In this case, MolArt instructs Mol* to use the mmCIF format.
    -   In case there is no experimental structure in PDB, but a model exists in SMR, MolArt instructs Mol\* to use the PDB-format structure data from SMR.

## Usage

```bash
  npm i molart2
```

The detail description of how to incorporate MolArt into your project can be found in the [developer documentation](https://github.com/scheuerv/molart/tree/master/docs).

```typescript
import { MolArt } from "molart/lib/molart";
import MolstarPlugin, { MolstarPluginConfig } from "molart/lib/molstar-plugin";
import { MolstarResidue } from "molart/lib/types/molstar-residue";
const molart = new MolArt<MolstarPluginConfig, MolstarResidue>(
    new MolstarPlugin(document.getElementById("structure-wrapper")!),
    document.getElementById("sequence-wrapper")!
);
molart.loadConfig({
    structure: { extraHighlights: [] },
    sequence: { uniprotId: "P37840" }
});

molart.onSequenceMouseOn.on(async (resNum) => console.log(resNum));

molart.onStructureMouseOn.on(async (residue) => {
    console.log(residue.authSeqNumber);
});
```

### Examples of use

Exmpales of how to use MolArt are located in the `src/examples` folder.

## License

This project is licensed under the Apache 2.0 license, quoted below.

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
