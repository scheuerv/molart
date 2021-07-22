import { sequence, sequenceStructureMapping } from "./custom-sequence-structure-mapping";

export const configCustomSequenceFetchData = {
    structure: { extraHighlights: [] },
    sequence: {
        sequence: sequence,
        sequenceStructureMapping: sequenceStructureMapping,
        customDataSources: [
            {
                source: "CUSTOM",
                //true if should add ".json" to the end of url (after added uniprotId)
                useExtension: false,
                //url from which we should load data
                //if uniprotId is defined we add it to the end of url
                url: "https://www.ebi.ac.uk/proteins/api/features/P29274"
            }
        ]
    }
};
