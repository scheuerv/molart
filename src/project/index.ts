(globalThis as any).d3 = require("d3")
import {createPlugin, DefaultPluginSpec} from 'Molstar/mol-plugin';
import {PluginContext} from 'Molstar/mol-plugin/context';
import 'ProtvistaPdb';
import "./index.html";
import {BuiltInTrajectoryFormat} from "Molstar/mol-plugin-state/formats/trajectory";
import {Asset} from "Molstar/mol-util/assets";

require('Molstar/mol-plugin-ui/skin/light.scss');
require('./main.scss');

type LoadParams = { url: string, format?: BuiltInTrajectoryFormat, isBinary?: boolean, assemblyId?: string }


export class TypedMolArt {
    plugin: PluginContext;

    init(target: string | HTMLElement) {
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


        this.load({url: 'https://files.rcsb.org/download/3pqr.cif', assemblyId: '1'})

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
