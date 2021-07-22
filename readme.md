# MolArt 2.0

A tool for visualization of annotated protein sequence and its corresponding experimental or predicted protein structure.

## Build and run

```bash
npm i
npm run start
```

Open your browser on <http://localhost:1341/>.

Or to see examples open your browser on <http://localhost:1341/examples>.

## Usage

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

## How to publish on npm

```bash
rm -r lib
tsc -p .\tsconfig.prod.json
#increase version in package.json
cp src/main.css lib/
npm publish
```
