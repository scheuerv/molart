import HighlightFinderMolstarEvent, {
    LabelSeqIdExtractor
} from "../src/highlight-finder-molstar-event";
import { Representation } from "Molstar/mol-repr/representation";
import { ModifiersKeys } from "Molstar/mol-util/input/input-observer";
import { Canvas3D } from "Molstar/mol-canvas3d/canvas3d";
import { FragmentMapping } from "uniprot-nightingale/src/types/mapping";
import { Highlight } from "uniprot-nightingale/src/types/highlight";

describe("HighlightFinderMolstarEvent tests", function () {
    const fakeHoverEvent: Canvas3D.HoverEvent = {
        current: Representation.Loci.Empty,
        modifiers: ModifiersKeys.None,
        buttons: 0,
        button: 0
    };
    let instance: HighlightFinderMolstarEvent;
    let fakeExtractor: FakeAuthSeqIdExtractor;

    beforeEach(() => {
        fakeExtractor = new FakeAuthSeqIdExtractor();
        instance = new HighlightFinderMolstarEvent(fakeExtractor);
    });

    it("fragment covers whole sequence, no difference between sequence - structure position", async () => {
        fakeExtractor.fakePosition = 5;
        const mapping: FragmentMapping[] = [
            {
                sequenceStart: 0,
                sequenceEnd: 140,
                structureStart: 0,
                structureEnd: 140
            }
        ];
        const highlights: Highlight[] = instance.calculate(fakeHoverEvent, mapping);
        expect(highlights).toEqual([
            {
                end: 5,
                start: 5
            }
        ]);
    });

    it("position outside of fragments", async () => {
        fakeExtractor.fakePosition = 50;
        const mapping: FragmentMapping[] = [
            {
                structureStart: 90,
                structureEnd: 140,
                sequenceStart: 90,
                sequenceEnd: 140
            },
            {
                structureStart: 10,
                structureEnd: 20,
                sequenceStart: 10,
                sequenceEnd: 20
            }
        ];
        const highlights: Highlight[] = instance.calculate(fakeHoverEvent, mapping);
        expect(highlights).toEqual([]);
    });

    it("position outside of sequence", async () => {
        fakeExtractor.fakePosition = 180;
        const mapping: FragmentMapping[] = [
            {
                structureStart: 90,
                structureEnd: 140,
                sequenceStart: 90,
                sequenceEnd: 140
            },
            {
                structureStart: 10,
                structureEnd: 20,
                sequenceStart: 10,
                sequenceEnd: 20
            }
        ];
        const highlights: Highlight[] = instance.calculate(fakeHoverEvent, mapping);
        expect(highlights).toEqual([]);
    });

    it("no fragment mappings", async () => {
        fakeExtractor.fakePosition = 5;
        const highlights: Highlight[] = instance.calculate(fakeHoverEvent, []);
        expect(highlights).toEqual([]);
    });

    it("difference between sequence - structure position, two fragments, position in first fragment", async () => {
        fakeExtractor.fakePosition = 373;
        const mapping: FragmentMapping[] = [
            {
                structureStart: 372,
                structureEnd: 373,
                sequenceStart: 10,
                sequenceEnd: 11
            },
            {
                structureStart: 382,
                structureEnd: 404,
                sequenceStart: 20,
                sequenceEnd: 42
            }
        ];
        const highlights: Highlight[] = instance.calculate(fakeHoverEvent, mapping);
        expect(highlights).toEqual([
            {
                end: 11,
                start: 11
            }
        ]);
    });

    it("difference between sequence - structure position, two fragments, position in second fragment", async () => {
        fakeExtractor.fakePosition = 385;
        const mapping: FragmentMapping[] = [
            {
                structureStart: 372,
                structureEnd: 373,
                sequenceStart: 10,
                sequenceEnd: 11
            },
            {
                structureStart: 382,
                structureEnd: 404,
                sequenceStart: 20,
                sequenceEnd: 42
            }
        ];
        const highlights = instance.calculate(fakeHoverEvent, mapping);
        expect(highlights).toEqual([
            {
                end: 23,
                start: 23
            }
        ]);
    });
});

class FakeAuthSeqIdExtractor implements LabelSeqIdExtractor {
    fakePosition: number | undefined;
    extractLabelSeqId(): number | undefined {
        return this.fakePosition;
    }
}
