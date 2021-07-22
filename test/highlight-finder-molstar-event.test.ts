import HighlightFinderMolstarEvent, { IdExtractor } from "../src/highlight-finder-molstar-event";
import { Representation } from "Molstar/mol-repr/representation";
import { ModifiersKeys } from "Molstar/mol-util/input/input-observer";
import { Canvas3D } from "Molstar/mol-canvas3d/canvas3d";
import { FragmentMapping, Mapping } from "uniprot-nightingale/lib/types/mapping";
import { Highlight } from "uniprot-nightingale/lib/types/highlight";

describe("HighlightFinderMolstarEvent tests", function () {
    const fakeHoverEvent: Canvas3D.HoverEvent = {
        current: Representation.Loci.Empty,
        modifiers: ModifiersKeys.None,
        buttons: 0,
        button: 0
    };
    let instance: HighlightFinderMolstarEvent;
    let fakeExtractor: FakeIdExtractor;

    beforeEach(() => {
        fakeExtractor = new FakeIdExtractor();
        instance = new HighlightFinderMolstarEvent(fakeExtractor);
    });

    it("fragment covers whole sequence, no difference between sequence - structure position", async () => {
        fakeExtractor.fakePosition = 5;
        fakeExtractor.fakeChain = "A";
        const mapping: Mapping = {
            A: {
                structAsymId: "A",
                fragmentMappings: [
                    {
                        sequenceStart: 0,
                        sequenceEnd: 140,
                        structureStart: 0,
                        structureEnd: 140
                    }
                ]
            }
        };
        const highlights: Highlight[] = instance.calculate(fakeHoverEvent, mapping);
        expect(highlights).toEqual([
            {
                sequenceEnd: 5,
                sequenceStart: 5
            }
        ]);
    });

    it("use structAsymId", async () => {
        fakeExtractor.fakePosition = 5;
        fakeExtractor.fakeChain = "B";
        const mapping: Mapping = {
            A: {
                structAsymId: "B",
                fragmentMappings: [
                    {
                        sequenceStart: 0,
                        sequenceEnd: 140,
                        structureStart: 0,
                        structureEnd: 140
                    }
                ]
            }
        };
        const highlights: Highlight[] = instance.calculate(fakeHoverEvent, mapping, "mmcif");
        expect(highlights).toEqual([
            {
                sequenceEnd: 5,
                sequenceStart: 5
            }
        ]);
    });

    it("position outside of fragments", async () => {
        fakeExtractor.fakePosition = 50;
        fakeExtractor.fakeChain = "A";
        const fragmentMappings: FragmentMapping[] = [
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
        const mapping: Mapping = {
            A: {
                structAsymId: "A",
                fragmentMappings: fragmentMappings
            }
        };
        const highlights: Highlight[] = instance.calculate(fakeHoverEvent, mapping);
        expect(highlights).toEqual([]);
    });

    it("position outside of sequence", async () => {
        fakeExtractor.fakePosition = 180;
        fakeExtractor.fakeChain = "A";
        const fragmentMappings: FragmentMapping[] = [
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
        const mapping: Mapping = {
            A: {
                structAsymId: "A",
                fragmentMappings: fragmentMappings
            }
        };
        const highlights: Highlight[] = instance.calculate(fakeHoverEvent, mapping);
        expect(highlights).toEqual([]);
    });

    it("no fragment mappings", async () => {
        fakeExtractor.fakePosition = 5;
        fakeExtractor.fakeChain = "A";
        const fragmentMappings: FragmentMapping[] = [];
        const mapping: Mapping = {
            A: {
                structAsymId: "A",
                fragmentMappings: fragmentMappings
            }
        };
        const highlights: Highlight[] = instance.calculate(fakeHoverEvent, mapping);
        expect(highlights).toEqual([]);
    });

    it("no mappings", async () => {
        fakeExtractor.fakePosition = 5;
        fakeExtractor.fakeChain = "A";
        const mapping: Mapping = {};
        expect(instance.calculate(fakeHoverEvent, mapping)).toBeUndefined;
    });

    it("difference between sequence - structure position, two fragments, position in first fragment", async () => {
        fakeExtractor.fakePosition = 373;
        fakeExtractor.fakeChain = "A";
        const fragmentMappings: FragmentMapping[] = [
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
        const mapping: Mapping = {
            A: {
                structAsymId: "A",
                fragmentMappings: fragmentMappings
            }
        };
        const highlights: Highlight[] = instance.calculate(fakeHoverEvent, mapping);
        expect(highlights).toEqual([
            {
                sequenceEnd: 11,
                sequenceStart: 11
            }
        ]);
    });

    it("difference between sequence - structure position, two fragments, position in second fragment", async () => {
        fakeExtractor.fakePosition = 385;
        fakeExtractor.fakeChain = "A";
        const fragmentMappings: FragmentMapping[] = [
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
        const mapping: Mapping = {
            A: {
                structAsymId: "A",
                fragmentMappings: fragmentMappings
            }
        };
        const highlights = instance.calculate(fakeHoverEvent, mapping);
        expect(highlights).toEqual([
            {
                sequenceEnd: 23,
                sequenceStart: 23
            }
        ]);
    });
});

class FakeIdExtractor implements IdExtractor {
    fakePosition: number;
    fakeChain: string;
    extractAsymId(): string {
        return this.fakeChain;
    }
    extractSeqId(): number {
        return this.fakePosition;
    }
}
