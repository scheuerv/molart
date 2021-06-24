import HighlightFinderMolstarEvent, {
    LabelSeqIdExtractor
} from "../src/highlight-finder-molstar-event";
import { Representation } from "Molstar/mol-repr/representation";
import { ModifiersKeys } from "Molstar/mol-util/input/input-observer";
import { Highlight } from "uniprot-nightingale/src/manager/track-manager";
import { Canvas3D } from "Molstar/mol-canvas3d/canvas3d";
import { Mapping } from "uniprot-nightingale/src/types/mapping";

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
        const mapping = [
            {
                unp_start: 0,
                unp_end: 140,
                start: {
                    residue_number: 0
                },
                end: {
                    residue_number: 140
                }
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
        const mapping: Mapping = [
            {
                start: {
                    residue_number: 90
                },
                end: {
                    residue_number: 140
                },
                unp_start: 90,
                unp_end: 140
            },
            {
                start: {
                    residue_number: 10
                },
                end: {
                    residue_number: 20
                },
                unp_start: 10,
                unp_end: 20
            }
        ];
        const highlights: Highlight[] = instance.calculate(fakeHoverEvent, mapping);
        expect(highlights).toEqual([]);
    });

    it("position outside of sequence", async () => {
        fakeExtractor.fakePosition = 180;
        const mapping: Mapping = [
            {
                start: {
                    residue_number: 90
                },
                end: {
                    residue_number: 140
                },
                unp_start: 90,
                unp_end: 140
            },
            {
                start: {
                    residue_number: 10
                },
                end: {
                    residue_number: 20
                },
                unp_start: 10,
                unp_end: 20
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
        const mapping: Mapping = [
            {
                start: { residue_number: 372 },
                end: { residue_number: 373 },
                unp_start: 10,
                unp_end: 11
            },
            {
                start: { residue_number: 382 },
                end: { residue_number: 404 },
                unp_start: 20,
                unp_end: 42
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
        const mapping: Mapping = [
            {
                start: { residue_number: 372 },
                end: { residue_number: 373 },
                unp_start: 10,
                unp_end: 11
            },
            {
                start: { residue_number: 382 },
                end: { residue_number: 404 },
                unp_start: 20,
                unp_end: 42
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
