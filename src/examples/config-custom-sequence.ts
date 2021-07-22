import { customFeatures } from "./custom-features";
import { sequence, sequenceStructureMapping } from "./custom-sequence-structure-mapping";

export const configCustomSequence = {
    structure: { extraHighlights: [] },
    sequence: {
        sequence: sequence,
        sequenceStructureMapping: sequenceStructureMapping,
        customDataSources: [
            {
                source: "CUSTOM",
                data: customFeatures
            }
        ]
    }
};
