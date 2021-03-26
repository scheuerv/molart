import { Canvas3D } from "Molstar/mol-canvas3d/canvas3d";
import { createPlugin, DefaultPluginSpec } from 'Molstar/mol-plugin';
import { PluginContext } from 'Molstar/mol-plugin/context';
import { TrackManager } from "uniprot-nightingale/src/index";
import PDBParser from "uniprot-nightingale/src/parsers/pdb-parser";
import "./index.html";
import { BuiltInTrajectoryFormat } from "Molstar/mol-plugin-state/formats/trajectory";
import { Asset } from "Molstar/mol-util/assets";
import { StructureElement, StructureProperties as Props, StructureSelection } from "Molstar/mol-model/structure";
import { Loci } from "Molstar/mol-model/structure/structure/element/loci";

(globalThis as any).d3 = require("d3")
import HoverEvent = Canvas3D.HoverEvent;
import SMRParser from "uniprot-nightingale/src/parsers/SMR-parser";
import { Script } from "molstar/lib/mol-script/script";

require('Molstar/mol-plugin-ui/skin/light.scss');
require('./main.scss');

type LoadParams = { url: string, format?: BuiltInTrajectoryFormat, isBinary?: boolean, assemblyId?: string }

export class TypedMolArt {
    plugin: PluginContext;
    protvistaWrapper: HTMLElement;
    trackManager: TrackManager;

    init(target: string | HTMLElement, targetProtvista: string) {
        this.protvistaWrapper = document.getElementById(targetProtvista);
        this.plugin = createPlugin(typeof target === 'string' ? document.getElementById(target)! : target, {
            ...DefaultPluginSpec,
            layout: {
                initial: {
                    isExpanded: false,
                    showControls: false
                },
                controls: { left: 'none', right: 'none', top: 'none', bottom: 'none' },
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
        this.trackManager.onResidueMouseOver.on(resNum => {
            const data = this.plugin.managers.structure.hierarchy.current.structures[0]?.cell.obj?.data;
            if (!data) return;
            const sel = Script.getStructureSelection(
                (Q) =>
                    Q.struct.generator.atomGroups({
                        "residue-test": Q.core.logic.or(
                            [
                                Q.core.rel.inRange([
                                    Q.struct.atomProperty.macromolecular.auth_seq_id(),
                                    resNum,
                                    resNum,
                                ])
                            ]
                        ),
                    }),
                data
            );
            const loci = StructureSelection.toLociWithSourceUnits(sel);
            this.plugin.managers.interactivity.lociHighlights.highlightOnly({ loci });
        });
        this.trackManager.onFragmentMouseOut.on(resNum => {
            this.plugin.managers.interactivity.lociHighlights.clearHighlights();
        });
        this.plugin.canvas3d.interaction.hover.subscribe((e: HoverEvent) => {
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

    async load({ url, format = 'mmcif', isBinary = false, assemblyId = '' }: LoadParams) {
        await this.plugin.clear();
        const data = await this.plugin.builders.data.download({
            url: Asset.Url(url),
            isBinary
        }, { state: { isGhost: true } });

        const trajectory = await this.plugin.builders.structure.parseTrajectory(data, format);

        await this.plugin.builders.structure.hierarchy.applyPreset(trajectory, 'default', {
            structure: assemblyId ? {
                name: 'assembly',
                params: { id: assemblyId }
            } : {
                name: 'model',
                params: {}
            },
            showUnitcell: false,
            representationPreset: 'auto'
        });
    }
}

(window as any).TypedMolArt = new TypedMolArt();
