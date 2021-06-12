import { expect } from "chai";
import { mixFragmentColors } from "../src/fragment-color-mixer";
describe("FragmentColorMixer tests", function () {
    it("no fragments", async () => {
        expect(mixFragmentColors([])).to.deep.equals([]);
    });

    it("two non overlapping fragments", async () => {
        const trackFragments = [
            {
                start: 5,
                end: 10,
                color: "#000000"
            },
            {
                start: 25,
                end: 30,
                color: "#FFFFFF"
            }
        ];
        const expectedResult = [
            {
                start: 5,
                end: 10,
                color: "#000000"
            },
            {
                start: 25,
                end: 30,
                color: "#FFFFFF"
            }
        ];
        expect(mixFragmentColors(trackFragments)).to.deep.equals(expectedResult);
    });

    it("two partially overlapping fragments", async () => {
        const trackFragments = [
            {
                start: 0,
                end: 10,
                color: "#FF0000"
            },
            {
                start: 5,
                end: 15,
                color: "#00FF00"
            }
        ];
        const expectedResult = [
            {
                start: 0,
                end: 4,
                color: "#FF0000"
            },
            {
                start: 5,
                end: 10,
                color: "#555500"
            },
            {
                start: 11,
                end: 15,
                color: "#00FF00"
            }
        ];
        expect(mixFragmentColors(trackFragments)).to.deep.equals(expectedResult);
    });
    it("two partially overlapping fragments, same color", async () => {
        const trackFragments = [
            {
                start: 0,
                end: 10,
                color: "#FF0000"
            },
            {
                start: 5,
                end: 15,
                color: "#FF0000"
            }
        ];
        const expectedResult = [
            {
                start: 0,
                end: 4,
                color: "#FF0000"
            },
            {
                start: 5,
                end: 10,
                color: "#FF0000"
            },
            {
                start: 11,
                end: 15,
                color: "#FF0000"
            }
        ];
        expect(mixFragmentColors(trackFragments)).to.deep.equals(expectedResult);
    });

    it("three partially overlapping fragments", async () => {
        const trackFragments = [
            {
                start: 4,
                end: 50,
                color: "#FF0000"
            },
            {
                start: 40,
                end: 87,
                color: "#00FF00"
            },
            {
                start: 25,
                end: 80,
                color: "#0000FF"
            }
        ];
        const expectedResult = [
            {
                start: 4,
                end: 24,
                color: "#FF0000"
            },
            {
                start: 25,
                end: 39,
                color: "#550055"
            },
            {
                start: 40,
                end: 50,
                color: "#242524"
            },
            {
                start: 51,
                end: 80,
                color: "#005555"
            },
            {
                start: 81,
                end: 87,
                color: "#00FF00"
            }
        ];
        expect(mixFragmentColors(trackFragments)).to.deep.equals(expectedResult);
    });
    it("invalid color", async () => {
        const trackFragments = [
            {
                start: 4,
                end: 50,
                color: "invalid color"
            }
        ];
        const expectedResult = [
            {
                start: 4,
                end: 50,
                color: "#000000"
            }
        ];
        expect(mixFragmentColors(trackFragments)).to.deep.equals(expectedResult);
    });

    it("tests if mixing includes all fragments", async () => {
        const trackFragments1 = [
            {
                start: 0,
                end: 50,
                color: "#FF0000"
            },
            {
                start: 0,
                end: 50,
                color: "#00FF00"
            }
        ];
        const trackFragments2 = [
            {
                start: 0,
                end: 50,
                color: "#FF0000"
            },
            {
                start: 0,
                end: 50,
                color: "#00FF00"
            },
            {
                start: 0,
                end: 50,
                color: "#0000FF"
            }
        ];
        expect(mixFragmentColors(trackFragments1)[0].color).to.not.deep.equals(
            mixFragmentColors(trackFragments2)[0].color
        );
    });
});
