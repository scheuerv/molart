import { FragmentMapping, Mapping } from "uniprot-nightingale/src/types/mapping";
import HighlightFinderNightingaleEvent from "../src/highlight-finder-nightingale-event";

describe("HighlightFinderNightingaleEvent tests", function () {
    let instance: HighlightFinderNightingaleEvent;

    beforeEach(() => {
        instance = new HighlightFinderNightingaleEvent();
    });

    describe("calculate test", function () {
        it("fragment covers whole sequence, no difference between sequence - structure position", async () => {
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
            expect(instance.calculate(5, mapping)).toEqual(new Map([["A", 5]]));
        });

        it("use structAsymId", async () => {
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
            expect(instance.calculate(5, mapping, "mmcif")).toEqual(new Map([["B", 5]]));
        });

        it("position outside of fragments", async () => {
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
            expect(instance.calculate(50, mapping)).toBeUndefined;
        });

        it("position outside of sequence", async () => {
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
            expect(instance.calculate(180, mapping)).toBeUndefined;
        });

        it("no mappings", async () => {
            const mapping: Mapping = {};
            expect(instance.calculate(5, mapping)).toBeUndefined;
        });

        it("difference between sequence - structure position, two fragments, position in first fragment", async () => {
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
            expect(instance.calculate(11, mapping)).toEqual(new Map([["A", 373]]));
        });

        it("difference between sequence - structure position, two fragments, position in first fragment, structure numbers lower than sequence", async () => {
            const fragmentMappings: FragmentMapping[] = [
                {
                    structureStart: 10,
                    structureEnd: 11,
                    sequenceStart: 372,
                    sequenceEnd: 373
                },
                {
                    structureStart: 10,
                    structureEnd: 42,
                    sequenceStart: 382,
                    sequenceEnd: 404
                }
            ];
            const mapping: Mapping = {
                A: {
                    structAsymId: "A",
                    fragmentMappings: fragmentMappings
                }
            };
            expect(instance.calculate(373, mapping)).toEqual(new Map([["A", 11]]));
        });

        it("difference between sequence - structure position, two fragments, position in second fragment", async () => {
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
            expect(instance.calculate(23, mapping)).toEqual(new Map([["A", 385]]));
        });

        it("pdbId 2dnc test", async () => {
            const fragmentMappings: FragmentMapping[] = [
                {
                    structureStart: 8,
                    structureEnd: 92,
                    sequenceStart: 57,
                    sequenceEnd: 141
                }
            ];
            const mapping: Mapping = {
                A: {
                    structAsymId: "A",
                    fragmentMappings: fragmentMappings
                }
            };
            expect(instance.calculate(60, mapping)).toEqual(new Map([["A", 11]]));
        });

        it("two chains", async () => {
            const fragmentMappings1: FragmentMapping[] = [
                {
                    structureStart: 8,
                    structureEnd: 92,
                    sequenceStart: 57,
                    sequenceEnd: 141
                }
            ];
            const fragmentMappings2: FragmentMapping[] = [
                {
                    structureStart: 0,
                    structureEnd: 70,
                    sequenceStart: 10,
                    sequenceEnd: 80
                }
            ];
            const mapping: Mapping = {
                A: {
                    structAsymId: "A",
                    fragmentMappings: fragmentMappings1
                },
                B: {
                    structAsymId: "C",
                    fragmentMappings: fragmentMappings2
                }
            };
            expect(instance.calculate(60, mapping)).toEqual(
                new Map([
                    ["A", 11],
                    ["B", 50]
                ])
            );
        });
    });

    describe("calculateFromRange test", function () {
        it("fragment covers whole sequence, no difference between sequence - structure position", async () => {
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
            expect(instance.calculateFromRange(5, 10, mapping)).toEqual(
                new Map([["A", [[5, 10]]]])
            );
        });

        it("first position outside of fragments", async () => {
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
            expect(instance.calculateFromRange(50, 95, mapping)).toEqual(
                new Map([["A", [[90, 95]]]])
            );
        });

        it("position outside of sequence", async () => {
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
            expect(instance.calculateFromRange(180, 190, mapping)).toBeUndefined;
        });

        it("no mappings", async () => {
            const mapping: Mapping = {};
            expect(instance.calculateFromRange(5, 10, mapping)).toBeUndefined;
        });

        it("difference between sequence - structure position, three fragments, position in first and last fragment", async () => {
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
                },
                {
                    structureStart: 420,
                    structureEnd: 430,
                    sequenceStart: 50,
                    sequenceEnd: 60
                }
            ];
            const mapping: Mapping = {
                A: {
                    structAsymId: "A",
                    fragmentMappings: fragmentMappings
                }
            };
            expect(instance.calculateFromRange(11, 52, mapping)).toEqual(
                new Map([
                    [
                        "A",
                        [
                            [373, 373],
                            [382, 404],
                            [420, 422]
                        ]
                    ]
                ])
            );
        });

        it("difference between sequence - structure position, two fragments, position in first and second fragment", async () => {
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
            expect(instance.calculateFromRange(10, 23, mapping)).toEqual(
                new Map([
                    [
                        "A",
                        [
                            [372, 373],
                            [382, 385]
                        ]
                    ]
                ])
            );
        });

        it("two chains", async () => {
            const fragmentMappings1: FragmentMapping[] = [
                {
                    structureStart: 8,
                    structureEnd: 92,
                    sequenceStart: 57,
                    sequenceEnd: 141
                }
            ];
            const fragmentMappings2: FragmentMapping[] = [
                {
                    structureStart: 0,
                    structureEnd: 70,
                    sequenceStart: 10,
                    sequenceEnd: 80
                }
            ];
            const mapping: Mapping = {
                A: {
                    structAsymId: "A",
                    fragmentMappings: fragmentMappings1
                },
                B: {
                    structAsymId: "C",
                    fragmentMappings: fragmentMappings2
                }
            };
            expect(instance.calculateFromRange(60, 70, mapping)).toEqual(
                new Map([
                    ["A", [[11, 21]]],
                    ["B", [[50, 60]]]
                ])
            );
        });
    });
});
