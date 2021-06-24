import { Mapping } from "uniprot-nightingale/src/types/mapping";
import HighlightFinderNightingaleEvent from "../src/highlight-finder-nightingale-event";

describe("HighlightFinderNightingaleEvent tests", function () {
    let instance: HighlightFinderNightingaleEvent;

    beforeEach(() => {
        instance = new HighlightFinderNightingaleEvent();
    });

    describe("calculate test", function () {
        it("fragment covers whole sequence, no difference between sequence - structure position", async () => {
            const mapping: Mapping = [
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
            expect(instance.calculate(5, mapping)).toEqual(5);
        });

        it("position outside of fragments", async () => {
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
            expect(instance.calculate(50, mapping)).toBeUndefined;
        });

        it("position outside of sequence", async () => {
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
            expect(instance.calculate(180, mapping)).toBeUndefined;
        });

        it("no fragment mappings", async () => {
            const mapping: Mapping = [];
            expect(instance.calculate(5, mapping)).toBeUndefined;
        });

        it("difference between sequence - structure position, two fragments, position in first fragment", async () => {
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
            expect(instance.calculate(11, mapping)).toEqual(373);
        });

        it("difference between sequence - structure position, two fragments, position in first fragment, structure numbers lower than sequence", async () => {
            const mapping: Mapping = [
                {
                    start: { residue_number: 10 },
                    end: { residue_number: 11 },
                    unp_start: 372,
                    unp_end: 373
                },
                {
                    start: { residue_number: 10 },
                    end: { residue_number: 42 },
                    unp_start: 382,
                    unp_end: 404
                }
            ];
            expect(instance.calculate(373, mapping)).toEqual(11);
        });

        it("difference between sequence - structure position, two fragments, position in second fragment", async () => {
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
            expect(instance.calculate(23, mapping)).toEqual(385);
        });

        it("pdbId 2dnc test", async () => {
            const mapping: Mapping = [
                {
                    start: { residue_number: 8 },
                    end: { residue_number: 92 },
                    unp_start: 57,
                    unp_end: 141
                }
            ];
            expect(instance.calculate(60, mapping)).toEqual(11);
        });
    });

    describe("getStructurePositionOfLastResidueInFragment test", function () {
        it("one fragment, position inside", async () => {
            const mapping: Mapping = [
                {
                    start: { residue_number: 50 },
                    end: { residue_number: 90 },
                    unp_start: 50,
                    unp_end: 90
                }
            ];
            expect(instance.getStructurePositionOfLastResidueInFragment(55, mapping)).toEqual(90);
        });

        it("one fragment, position outside", async () => {
            const mapping: Mapping = [
                {
                    start: { residue_number: 50 },
                    end: { residue_number: 90 },
                    unp_start: 50,
                    unp_end: 90
                }
            ];
            expect(instance.getStructurePositionOfLastResidueInFragment(40, mapping)).toBeUndefined;
        });

        it("two fragments, position in first", async () => {
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
            expect(instance.getStructurePositionOfLastResidueInFragment(10, mapping)).toEqual(373);
        });

        it("two fragments, position in second", async () => {
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
            expect(instance.getStructurePositionOfLastResidueInFragment(30, mapping)).toEqual(404);
        });
    });

    describe("getStructurePositionOfFirstResidueInFragment test", function () {
        it("one fragment, position inside", async () => {
            const mapping: Mapping = [
                {
                    start: { residue_number: 50 },
                    end: { residue_number: 90 },
                    unp_start: 50,
                    unp_end: 90
                }
            ];
            expect(instance.getStructurePositionOfFirstResidueInFragment(55, mapping)).toEqual(50);
        });

        it("one fragment, position outside", async () => {
            const mapping: Mapping = [
                {
                    start: { residue_number: 50 },
                    end: { residue_number: 90 },
                    unp_start: 50,
                    unp_end: 90
                }
            ];
            expect(instance.getStructurePositionOfFirstResidueInFragment(40, mapping))
                .toBeUndefined;
        });

        it("two fragments, position in first", async () => {
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
            expect(instance.getStructurePositionOfFirstResidueInFragment(10, mapping)).toEqual(372);
        });

        it("two fragments, position in second", async () => {
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
            expect(instance.getStructurePositionOfFirstResidueInFragment(30, mapping)).toEqual(382);
        });
    });
});
