(globalThis as any).d3 = require("d3")
import {createPlugin, DefaultPluginSpec} from 'Molstar/mol-plugin';
import {PluginContext} from 'Molstar/mol-plugin/context';
import {ProtvistaPDB} from 'protvista-pdb/src/protvista-pdb';
import 'protvista-pdb/src/index';
import "./index.html";
import {BuiltInTrajectoryFormat} from "Molstar/mol-plugin-state/formats/trajectory";
import {Asset} from "Molstar/mol-util/assets";

require('Molstar/mol-plugin-ui/skin/light.scss');
require('./main.scss');

type LoadParams = { url: string, format?: BuiltInTrajectoryFormat, isBinary?: boolean, assemblyId?: string }

export class TypedMolArt {
    plugin: PluginContext;
    protvistaPdb: ProtvistaPDB;
    protvistaWrapper: HTMLElement;

    init(target: string | HTMLElement, targetProtvista: string) {
        this.protvistaWrapper = document.getElementById(targetProtvista);
        this.plugin = createPlugin(typeof target === 'string' ? document.getElementById(target)! : target, {
            ...DefaultPluginSpec,
            layout: {
                initial: {
                    isExpanded: false,
                    showControls: false
                },
                controls: {left: 'none', right: 'none', top: 'none', bottom: 'none'},
            },
        });
        this.protvistaPdb = document.createElement("protvista-pdb");
        this.protvistaPdb.addEventListener("rendered", e => this.load({
            url: `https://files.rcsb.org/download/${e.detail.pdbIds[0]}.cif`,
            assemblyId: '1'
        }));
        this.protvistaPdb.addEventListener("protvista-click", e => {
            const accession = e.detail?.feature?.accession;
            const accessionFromLabel = e.detail?.feature?.label?.id;
            if (accession !== undefined && accession === accessionFromLabel) {
                this.load({
                    url: `https://files.rcsb.org/download/${e.detail.feature.label.id}.cif`,
                    assemblyId: '1'
                });
            }
        });

        // this.load({url: 'https://files.rcsb.org/download/3pqr.cif', assemblyId: '1'})

    }

    loadUniprot(uniprotId: string) {
        this.protvistaPdb.setAttribute("accession", uniprotId);
        this.protvistaWrapper.append(this.protvistaPdb);

    }

    async load({url, format = 'mmcif', isBinary = false, assemblyId = ''}: LoadParams) {
        await this.plugin.clear();

        const data = await this.plugin.builders.data.download({
            url: Asset.Url(url),
            isBinary
        }, {state: {isGhost: true}});

        const trajectory = await this.plugin.builders.structure.parseTrajectory(data, format);

        await this.plugin.builders.structure.hierarchy.applyPreset(trajectory, 'default', {
            structure: assemblyId ? {
                name: 'assembly',
                params: {id: assemblyId}
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
