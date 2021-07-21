import { TrackFragment } from "uniprot-nightingale/lib/types/accession";
import { mixFragmentColors } from "../src/fragment-color-mixer";
describe("FragmentColorMixer tests", function () {
    it("no fragments", async () => {
        expect(mixFragmentColors([])).toEqual([]);
    });

    it("two non overlapping fragments", async () => {
        const trackFragments: TrackFragment[] = [
            {
                sequenceStart: 5,
                sequenceEnd: 10,
                color: "#000000"
            },
            {
                sequenceStart: 25,
                sequenceEnd: 30,
                color: "#FFFFFF"
            }
        ];
        const expectedResult: TrackFragment[] = [
            {
                sequenceStart: 5,
                sequenceEnd: 10,
                color: "#000000"
            },
            {
                sequenceStart: 25,
                sequenceEnd: 30,
                color: "#FFFFFF"
            }
        ];
        expect(mixFragmentColors(trackFragments)).toEqual(expectedResult);
    });

    it("two partially overlapping fragments", async () => {
        const trackFragments: TrackFragment[] = [
            {
                sequenceStart: 0,
                sequenceEnd: 10,
                color: "#FF0000"
            },
            {
                sequenceStart: 5,
                sequenceEnd: 15,
                color: "#00FF00"
            }
        ];
        const expectedResult: TrackFragment[] = [
            {
                sequenceStart: 0,
                sequenceEnd: 4,
                color: "#FF0000"
            },
            {
                sequenceStart: 5,
                sequenceEnd: 10,
                color: "#555500"
            },
            {
                sequenceStart: 11,
                sequenceEnd: 15,
                color: "#00FF00"
            }
        ];
        expect(mixFragmentColors(trackFragments)).toEqual(expectedResult);
    });
    it("two partially overlapping fragments, same color", async () => {
        const trackFragments: TrackFragment[] = [
            {
                sequenceStart: 0,
                sequenceEnd: 10,
                color: "#FF0000"
            },
            {
                sequenceStart: 5,
                sequenceEnd: 15,
                color: "#FF0000"
            }
        ];
        const expectedResult: TrackFragment[] = [
            {
                sequenceStart: 0,
                sequenceEnd: 4,
                color: "#FF0000"
            },
            {
                sequenceStart: 5,
                sequenceEnd: 10,
                color: "#FF0000"
            },
            {
                sequenceStart: 11,
                sequenceEnd: 15,
                color: "#FF0000"
            }
        ];
        expect(mixFragmentColors(trackFragments)).toEqual(expectedResult);
    });

    it("three partially overlapping fragments", async () => {
        const trackFragments: TrackFragment[] = [
            {
                sequenceStart: 4,
                sequenceEnd: 50,
                color: "#FF0000"
            },
            {
                sequenceStart: 40,
                sequenceEnd: 87,
                color: "#00FF00"
            },
            {
                sequenceStart: 25,
                sequenceEnd: 80,
                color: "#0000FF"
            }
        ];
        const expectedResult: TrackFragment[] = [
            {
                sequenceStart: 4,
                sequenceEnd: 24,
                color: "#FF0000"
            },
            {
                sequenceStart: 25,
                sequenceEnd: 39,
                color: "#550055"
            },
            {
                sequenceStart: 40,
                sequenceEnd: 50,
                color: "#242524"
            },
            {
                sequenceStart: 51,
                sequenceEnd: 80,
                color: "#005555"
            },
            {
                sequenceStart: 81,
                sequenceEnd: 87,
                color: "#00FF00"
            }
        ];
        expect(mixFragmentColors(trackFragments)).toEqual(expectedResult);
    });
    it("invalid color", async () => {
        const trackFragments: TrackFragment[] = [
            {
                sequenceStart: 4,
                sequenceEnd: 50,
                color: "invalid color"
            }
        ];
        const expectedResult: TrackFragment[] = [
            {
                sequenceStart: 4,
                sequenceEnd: 50,
                color: "#000000"
            }
        ];
        expect(mixFragmentColors(trackFragments)).toEqual(expectedResult);
    });

    it("tests if mixing includes all fragments", async () => {
        const trackFragments1: TrackFragment[] = [
            {
                sequenceStart: 0,
                sequenceEnd: 50,
                color: "#FF0000"
            },
            {
                sequenceStart: 0,
                sequenceEnd: 50,
                color: "#00FF00"
            }
        ];
        const trackFragments2: TrackFragment[] = [
            {
                sequenceStart: 0,
                sequenceEnd: 50,
                color: "#FF0000"
            },
            {
                sequenceStart: 0,
                sequenceEnd: 50,
                color: "#00FF00"
            },
            {
                sequenceStart: 0,
                sequenceEnd: 50,
                color: "#0000FF"
            }
        ];
        expect(mixFragmentColors(trackFragments1)[0].color).not.toEqual(
            mixFragmentColors(trackFragments2)[0].color
        );
    });
});
