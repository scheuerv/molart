import { expect } from "chai";
import { Mapping } from "uniprot-nightingale/src/parsers/track-parser";
import HighlightFinderNightingaleEvent from "../src/highlight-finder-nightingale-event";

describe("HighlightFinderNightingaleEvent tests", function () {
    let instance: HighlightFinderNightingaleEvent;

    beforeEach(() => {
        instance = new HighlightFinderNightingaleEvent();
    });

    describe("calculate test", function () {
        it("fragment covers whole sequence, no difference between sequence - structure position", async () => {
            const mapping = {
                uniprotStart: 0,
                uniprotEnd: 140,
                fragmentMappings: [
                    {
                        pdbEnd: 140,
                        pdbStart: 0,
                        from: 0,
                        to: 140
                    }
                ]
            };
            expect(instance.calculate(5, mapping)).to.equals(5);
        });

        it("position outside of fragments", async () => {
            const mapping = {
                uniprotStart: 0,
                uniprotEnd: 140,
                fragmentMappings: [
                    {
                        pdbEnd: 140,
                        pdbStart: 90,
                        from: 90,
                        to: 140
                    },
                    {
                        pdbEnd: 20,
                        pdbStart: 10,
                        from: 10,
                        to: 20
                    }
                ]
            };
            expect(instance.calculate(50, mapping)).to.undefined;
        });

        it("position outside of sequence", async () => {
            const mapping = {
                uniprotStart: 0,
                uniprotEnd: 140,
                fragmentMappings: [
                    {
                        pdbEnd: 140,
                        pdbStart: 90,
                        from: 90,
                        to: 140
                    },
                    {
                        pdbEnd: 20,
                        pdbStart: 10,
                        from: 10,
                        to: 20
                    }
                ]
            };
            expect(instance.calculate(180, mapping)).to.undefined;
        });

        it("no fragment mappings", async () => {
            const mapping = {
                uniprotStart: 0,
                uniprotEnd: 140,
                fragmentMappings: []
            };
            expect(instance.calculate(5, mapping)).to.undefined;
        });

        it("difference between sequence - structure position, two fragments, position in first fragment", async () => {
            const mapping = {
                uniprotStart: 10,
                uniprotEnd: 42,
                fragmentMappings: [
                    { pdbStart: 372, pdbEnd: 373, from: 10, to: 11 },
                    { pdbStart: 382, pdbEnd: 404, from: 20, to: 42 }
                ]
            };
            expect(instance.calculate(11, mapping)).to.equals(373);
        });

        it("difference between sequence - structure position, two fragments, position in second fragment", async () => {
            const mapping = {
                uniprotStart: 10,
                uniprotEnd: 42,
                fragmentMappings: [
                    { pdbStart: 372, pdbEnd: 373, from: 10, to: 11 },
                    { pdbStart: 382, pdbEnd: 404, from: 20, to: 42 }
                ]
            };
            expect(instance.calculate(23, mapping)).to.equals(385);
        });

        it("pdbId 2dnc test", async () => {
            const mapping: Mapping = {
                uniprotStart: 57,
                uniprotEnd: 141,
                fragmentMappings: [{ pdbStart: 8, pdbEnd: 92, from: 57, to: 141 }]
            };
            expect(instance.calculate(60, mapping)).to.equal(11);
        });
    });

    describe("getStructurePositionOfLastResidueInFragment test", function () {
        it("one fragment, position inside", async () => {
            const mapping: Mapping = {
                uniprotStart: 0,
                uniprotEnd: 140,
                fragmentMappings: [
                    {
                        pdbEnd: 90,
                        pdbStart: 50,
                        from: 50,
                        to: 90
                    }
                ]
            };
            expect(instance.getStructurePositionOfLastResidueInFragment(55, mapping)).to.equals(90);
        });

        it("one fragment, position outside", async () => {
            const mapping: Mapping = {
                uniprotStart: 0,
                uniprotEnd: 140,
                fragmentMappings: [
                    {
                        pdbEnd: 90,
                        pdbStart: 50,
                        from: 50,
                        to: 90
                    }
                ]
            };
            expect(instance.getStructurePositionOfLastResidueInFragment(40, mapping)).to.undefined;
        });

        it("two fragments, position in first", async () => {
            const mapping: Mapping = {
                uniprotStart: 10,
                uniprotEnd: 42,
                fragmentMappings: [
                    { pdbStart: 372, pdbEnd: 373, from: 10, to: 11 },
                    { pdbStart: 382, pdbEnd: 404, from: 20, to: 42 }
                ]
            };
            expect(instance.getStructurePositionOfLastResidueInFragment(10, mapping)).to.equal(373);
        });

        it("two fragments, position in second", async () => {
            const mapping: Mapping = {
                uniprotStart: 10,
                uniprotEnd: 42,
                fragmentMappings: [
                    { pdbStart: 372, pdbEnd: 373, from: 10, to: 11 },
                    { pdbStart: 382, pdbEnd: 404, from: 20, to: 42 }
                ]
            };
            expect(instance.getStructurePositionOfLastResidueInFragment(30, mapping)).to.equal(404);
        });
    });

    describe("getStructurePositionOfFirstResidueInFragment test", function () {
        it("one fragment, position inside", async () => {
            const mapping: Mapping = {
                uniprotStart: 0,
                uniprotEnd: 140,
                fragmentMappings: [
                    {
                        pdbEnd: 90,
                        pdbStart: 50,
                        from: 50,
                        to: 90
                    }
                ]
            };
            expect(instance.getStructurePositionOfFirstResidueInFragment(55, mapping)).to.equals(
                50
            );
        });

        it("one fragment, position outside", async () => {
            const mapping: Mapping = {
                uniprotStart: 0,
                uniprotEnd: 140,
                fragmentMappings: [
                    {
                        pdbEnd: 90,
                        pdbStart: 50,
                        from: 50,
                        to: 90
                    }
                ]
            };
            expect(instance.getStructurePositionOfFirstResidueInFragment(40, mapping)).to.undefined;
        });

        it("two fragments, position in first", async () => {
            const mapping: Mapping = {
                uniprotStart: 10,
                uniprotEnd: 42,
                fragmentMappings: [
                    { pdbStart: 372, pdbEnd: 373, from: 10, to: 11 },
                    { pdbStart: 382, pdbEnd: 404, from: 20, to: 42 }
                ]
            };
            expect(instance.getStructurePositionOfFirstResidueInFragment(10, mapping)).to.equal(
                372
            );
        });

        it("two fragments, position in second", async () => {
            const mapping: Mapping = {
                uniprotStart: 10,
                uniprotEnd: 42,
                fragmentMappings: [
                    { pdbStart: 372, pdbEnd: 373, from: 10, to: 11 },
                    { pdbStart: 382, pdbEnd: 404, from: 20, to: 42 }
                ]
            };
            expect(instance.getStructurePositionOfFirstResidueInFragment(30, mapping)).to.equal(
                382
            );
        });
    });
});
