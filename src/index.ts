import { Canvas3D } from "Molstar/mol-canvas3d/canvas3d";
import { createPlugin } from 'Molstar/mol-plugin-ui';
import { DefaultPluginUISpec } from 'Molstar/mol-plugin-ui/spec';
import { PluginContext } from 'Molstar/mol-plugin/context';
import { TrackManager } from "uniprot-nightingale/src/index";
import PDBParser from "uniprot-nightingale/src/parsers/pdb-parser";
import "./index.html";
import { BuiltInTrajectoryFormat } from "Molstar/mol-plugin-state/formats/trajectory";
import { Asset } from "Molstar/mol-util/assets";
import { Structure, StructureElement, StructureProperties as Props, StructureSelection } from "Molstar/mol-model/structure";
import { Loci } from "Molstar/mol-model/structure/structure/element/loci";
(globalThis as any).d3 = require("d3")
import HoverEvent = Canvas3D.HoverEvent;
import SMRParser from "uniprot-nightingale/src/parsers/SMR-parser";
import { Script } from "molstar/lib/mol-script/script";
import { Color } from "molstar/lib/mol-util/color/color";
import { StateTransforms } from "molstar/lib/mol-plugin-state/transforms";
import { Bundle } from "molstar/lib/mol-model/structure/structure/element/bundle";
import { StateObjectSelector } from "molstar/lib/mol-state";
import { PluginStateObject } from "molstar/lib/mol-plugin-state/objects";
import { TrackFragment } from "uniprot-nightingale/src/manager/track-manager";

require('Molstar/mol-plugin-ui/skin/light.scss');
require('./main.scss');

type LoadParams = { url: string, format?: BuiltInTrajectoryFormat, isBinary?: boolean, assemblyId?: string }

export class TypedMolArt {
    plugin: PluginContext;
    protvistaWrapper: HTMLElement;
    trackManager: TrackManager;
    molecularSurfaceRepr: StateObjectSelector<PluginStateObject.Molecule.Structure.Representation3D> | undefined;
    cartoonRepr: StateObjectSelector<PluginStateObject.Molecule.Structure.Representation3D> | undefined;

    init(target: string | HTMLElement, targetProtvista: string) {
        const wrapper = document.getElementById(targetProtvista);
        if (!wrapper) {
            throw new Error("Invalid Protvista target Id");
        }
        this.protvistaWrapper = wrapper;

        this.plugin = createPlugin(typeof target === 'string' ? document.getElementById(target)! : target, {
            ...DefaultPluginUISpec(),
            layout: {
                initial: {
                    isExpanded: false,
                    showControls: false
                }
            },
        });

        this.trackManager = TrackManager.createDefault();
        Promise.all([
            new Promise<string>((resolve) => {
                this.trackManager.getParsersByType(PDBParser)[0].onDataLoaded.once(pdbOutputs => {
                    resolve(pdbOutputs[0]?.pdbId);
                });
            }),
            new Promise<string>((resolve) => {
                this.trackManager.getParsersByType(SMRParser)[0].onDataLoaded.once(smrOutputs => {
                    resolve(smrOutputs[0]?.pdbId);
                });
            })
        ]).then(results => {
            for (const result of results) {
                if (result) {
                    this.loadStructure(result);
                    break;
                }
            }
        });
        this.trackManager.getParsersByType(PDBParser)[0].onLabelClick.on(pdbOutput => {
            this.loadStructure(pdbOutput.pdbId);
        });
        this.trackManager.getParsersByType(SMRParser)[0].onLabelClick.on(smrOutput => {
            this.loadStructure(smrOutput.pdbId);
        });
        this.trackManager.onFragmentClick.on(fragment => {
            this.overPaintFragments([fragment]);
        });
        this.trackManager.onArrowClick.on(fragments => {
            this.overPaintFragments(fragments);
        })
        this.trackManager.onResidueMouseOver.on(async resNum => {
            const data = this.plugin.managers.structure.hierarchy.current.structures[0]?.cell.obj?.data;
            if (!data) return;
            const sel = this.selectFragment(resNum, resNum, data);
            const loci = StructureSelection.toLociWithSourceUnits(sel);
            this.plugin.managers.interactivity.lociHighlights.highlightOnly({ loci });

        });
        this.trackManager.onFragmentMouseOut.on(resNum => {
            this.plugin.managers.interactivity.lociHighlights.clearHighlights();
        });
        this.plugin.canvas3d?.interaction.hover.subscribe((e: HoverEvent) => {
            if (e.current?.loci.kind == 'element-loci') {
                let structureElement = StructureElement.Stats.ofLoci(e.current.loci as Loci);
                let location = structureElement.firstResidueLoc;
                if (location.unit) {
                    var label_seq_id = Props.residue.label_seq_id(location);
                    var auth_seq_id = Props.residue.auth_seq_id(location);
                    this.trackManager.highlight(label_seq_id, auth_seq_id);
                }
            } else {
                this.trackManager.highlightOff();
            }
        });
    }
    loadStructure(pdbId: string) {
        this.load({
            url: `https://www.ebi.ac.uk/pdbe/static/entry/${pdbId}_updated.cif`,
            assemblyId: '1'
        })
    }
    loadUniprot(uniprotId: string) {
        this.trackManager.render(uniprotId, this.protvistaWrapper);
    }
    private selectFragment(from: number, to: number, data: Structure) {
        const sel = Script.getStructureSelection(
            (Q) =>
                Q.struct.generator.atomGroups({
                    "residue-test": Q.core.logic.or(
                        [
                            Q.core.rel.inRange([
                                Q.struct.atomProperty.macromolecular.auth_seq_id(),
                                from,
                                to,
                            ])
                        ]
                    ),
                }),
            data
        );
        return sel;
    }
    private overPaintFragments(fragments: TrackFragment[]) {
        if (!this.molecularSurfaceRepr || !this.cartoonRepr) return;
        const data = this.plugin.managers.structure.hierarchy.current.structures[0]?.cell.obj?.data;
        if (!data) return;
        const params: { bundle: StructureElement.Bundle, color: Color, clear: boolean }[] = []
        fragments.forEach(fragment => {
            const sel = this.selectFragment(fragment.start, fragment.end, data);
            const loci = StructureSelection.toLociWithSourceUnits(sel);
            const bundle = Bundle.fromLoci(loci);
            params.push({
                bundle: bundle,
                color: Color(parseInt(fragment.color.slice(1), 16)),
                clear: false
            });
        });
        const update = this.plugin.build();
        update.to(this.molecularSurfaceRepr).apply(StateTransforms.Representation.OverpaintStructureRepresentation3DFromBundle, {
            layers: params
        });
        update.to(this.cartoonRepr).apply(StateTransforms.Representation.OverpaintStructureRepresentation3DFromBundle, {
            layers: params
        });
        update.commit();
    }
    async load({ url, format = 'mmcif', isBinary = false, assemblyId = '' }: LoadParams) {
        this.molecularSurfaceRepr = undefined;
        this.cartoonRepr = undefined;
        await this.plugin.clear();
        const data = await this.plugin.builders.data.download({
            url: Asset.Url(url),
            isBinary
        }, { state: { isGhost: true } });
        const trajectory = await this.plugin.builders.structure.parseTrajectory(data, format);
        const model = await this.plugin.builders.structure.createModel(trajectory);
        const structure = await this.plugin.builders.structure.createStructure(model, assemblyId ? { name: 'assembly', params: { id: assemblyId } } : { name: 'model', params: {} });
        const polymer = await this.plugin.builders.structure.tryCreateComponentStatic(structure, 'polymer');
        const water = await this.plugin.builders.structure.tryCreateComponentStatic(structure, 'water');
        if (polymer) {
            this.cartoonRepr = await this.plugin.builders.structure.representation.addRepresentation(polymer, {
                type: 'cartoon', color: 'chain-id',
            });
            this.molecularSurfaceRepr = await this.plugin.builders.structure.representation.addRepresentation(polymer, {
                type: 'molecular-surface', typeParams: { alpha: 0.25 }, color: 'uniform'
            });
        }
        if(water)
        {
            await this.plugin.builders.structure.representation.addRepresentation(water, {
                type: 'ball-and-stick', color: 'element-symbol',
            });
        }
    }
}

(window as any).TypedMolArt = new TypedMolArt();
