import { TrackFragment } from "uniprot-nightingale/src/manager/track-manager";
const blender = require("color-blend");
import ColorConvert from "color-convert";
import { RGB } from "color-convert/conversions";

export function mixFragmentColors(fragments: TrackFragment[]): TrackFragment[] {
    const mixedColorFragments: TrackFragment[] = [];
    if (fragments.length > 0) {
        const sortedFragments = fragments.sort((a, b) => {
            return a.start - b.start;
        });
        let lastStart: number = sortedFragments[0].start;
        let [openedFragments, nextId] = getStartsWith(lastStart, sortedFragments);
        while (nextId < sortedFragments.length || openedFragments.length > 0) {
            const nearestEnd = getNearestEnd(openedFragments);
            const nearestStart = sortedFragments[nextId]?.start
                ? sortedFragments[nextId]?.start - 1
                : nearestEnd;
            if (nearestEnd < nearestStart) {
                mixedColorFragments.push({
                    start: lastStart,
                    end: nearestEnd,
                    color: mixColor(openedFragments)
                });
                openedFragments = openedFragments.filter((fragment) => fragment.end != nearestEnd);
                lastStart = nearestEnd + 1;
            } else if (nearestEnd > nearestStart) {
                mixedColorFragments.push({
                    start: lastStart,
                    end: nearestStart,
                    color: mixColor(openedFragments)
                });
                let newFragments: TrackFragment[];
                [newFragments, nextId] = getStartsWith(nearestStart + 1, sortedFragments);
                openedFragments = openedFragments.concat(newFragments);
                lastStart = nearestStart + 1;
            } else {
                mixedColorFragments.push({
                    start: lastStart,
                    end: nearestStart,
                    color: mixColor(openedFragments)
                });
                let newFragments: TrackFragment[];
                [newFragments, nextId] = getStartsWith(nearestStart + 1, sortedFragments);
                openedFragments = openedFragments.concat(newFragments);
                openedFragments = openedFragments.filter((fragment) => fragment.end != nearestEnd);
                lastStart = nearestStart + 1;
            }
            if (openedFragments.length == 0 && nextId < sortedFragments.length) {
                lastStart = sortedFragments[nextId].start;
                let newFragments: TrackFragment[];
                [newFragments, nextId] = getStartsWith(lastStart, sortedFragments);
                openedFragments = openedFragments.concat(newFragments);
                if (nextId == sortedFragments.length && openedFragments.length != 0) {
                    while (openedFragments.length != 0) {
                        const nearestEnd = getNearestEnd(openedFragments);
                        mixedColorFragments.push({
                            start: lastStart,
                            end: nearestEnd,
                            color: mixColor(openedFragments)
                        });
                        openedFragments = openedFragments.filter(
                            (fragment) => fragment.end != nearestEnd
                        );
                        lastStart = nearestEnd + 1;
                    }
                }
            }
        }
    }
    return mixedColorFragments;
}

function getStartsWith(start: number, sortedFragments: TrackFragment[]): [TrackFragment[], number] {
    const newFragments: TrackFragment[] = [];
    for (let i = 0; i < sortedFragments.length; i++) {
        const fragment = sortedFragments[i];
        if (fragment.start == start) {
            newFragments.push(fragment);
        } else if (fragment.start > start) {
            return [newFragments, i];
        }
    }
    return [newFragments, sortedFragments.length];
}

function getNearestEnd(openedFragments: TrackFragment[]): number {
    if (openedFragments.length == 0) {
        throw new Error("At least one fragment required");
    }
    let minEnd: number = Number.MAX_SAFE_INTEGER;
    for (let i = 0; i < openedFragments.length; i++) {
        const fragment: TrackFragment = openedFragments[i];
        if (fragment.end < minEnd) {
            minEnd = fragment.end;
        }
    }
    return minEnd;
}

function mixColor(openedFragments: TrackFragment[]): string {
    if (openedFragments.length == 0) {
        throw new Error("At least one fragment required");
    }
    const color: RGB = ColorConvert.hex.rgb(openedFragments[0].color);
    let rgbaColor = { a: 0.5, r: color[0], g: color[1], b: color[2] };
    for (let i = 1; i < openedFragments.length; i++) {
        const nextColor: RGB = ColorConvert.hex.rgb(openedFragments[i].color);
        rgbaColor = blender.darken(rgbaColor, {
            a: 0.5,
            r: nextColor[0],
            g: nextColor[1],
            b: nextColor[2]
        });
    }
    return "#" + ColorConvert.rgb.hex([rgbaColor.r, rgbaColor.g, rgbaColor.b]);
}
