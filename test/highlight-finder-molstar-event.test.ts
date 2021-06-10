import { expect } from "chai";
import HighlightFinderMolstarEvent, { AuthSeqIdExtractor } from "../src/highlight-finder-molstar-event";
import { Representation } from "Molstar/mol-repr/representation";
import { ModifiersKeys } from "Molstar/mol-util/input/input-observer";
import { Highlight } from "uniprot-nightingale/src/manager/track-manager";
import { Canvas3D } from "Molstar/mol-canvas3d/canvas3d";

describe("HighlightFinderMolstarEvent tests", function () {
  const fakeHoverEvent: Canvas3D.HoverEvent = {
    current: Representation.Loci.Empty,
    modifiers: ModifiersKeys.None,
    buttons: 0,
    button: 0
  }
  let instance: HighlightFinderMolstarEvent;
  let fakeExtractor: FakeAuthSeqIdExtractor;

  beforeEach(() => {
    fakeExtractor = new FakeAuthSeqIdExtractor();
    instance = new HighlightFinderMolstarEvent(fakeExtractor);
  });

  it('fragment covers whole sequence, no difference between sequence - structure position', async () => {
    fakeExtractor.fakePosition = 5;
    const highlights: Highlight[] = instance.calculate(fakeHoverEvent,
      {
        uniprotStart: 0, uniprotEnd: 140,
        fragmentMappings: [
          {
            pdbEnd: 140,
            pdbStart: 0,
            from: 0,
            to: 140
          }
        ]
      });
    expect(highlights).to.deep.equals([{
      end: 5,
      start: 5,
    }]);
  });

  it('position outside of fragments', async () => {
    fakeExtractor.fakePosition = 50;
    const highlights: Highlight[] = instance.calculate(fakeHoverEvent,
      {
        uniprotStart: 0, uniprotEnd: 140,
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
      });
    expect(highlights).to.deep.equals([]);
  });

  it('position outside of sequence', async () => {
    fakeExtractor.fakePosition = 180;
    const highlights: Highlight[] = instance.calculate(fakeHoverEvent,
      {
        uniprotStart: 0, uniprotEnd: 140,
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
      });
    expect(highlights).to.deep.equals([]);
  });

  it('no fragment mappings', async () => {
    fakeExtractor.fakePosition = 5;
    const highlights: Highlight[] = instance.calculate(fakeHoverEvent,
      {
        uniprotStart: 0, uniprotEnd: 140,
        fragmentMappings: []
      });
    expect(highlights).to.deep.equals([]);
  });

  it('difference between sequence - structure position, two fragments, position in first fragment', async () => {
    fakeExtractor.fakePosition = 373;
    const highlights: Highlight[] = instance.calculate(fakeHoverEvent,
      {
        uniprotStart: 10, uniprotEnd: 42,
        fragmentMappings: [
          { pdbStart: 372, pdbEnd: 373, from: 10, to: 11 },
          { pdbStart: 382, pdbEnd: 404, from: 20, to: 42 }
        ]
      });
    expect(highlights).to.deep.equals([{
      end: 11,
      start: 11,
    }]);
  });

  it('difference between sequence - structure position, two fragments, position in second fragment', async () => {
    fakeExtractor.fakePosition = 385;
    const highlights = instance.calculate(fakeHoverEvent,
      {
        uniprotStart: 10, uniprotEnd: 42,
        fragmentMappings: [
          { pdbStart: 372, pdbEnd: 373, from: 10, to: 11 },
          { pdbStart: 382, pdbEnd: 404, from: 20, to: 42 }
        ]
      });
    expect(highlights).to.deep.equals([{
      end: 23,
      start: 23,
    }]);
  });
});

class FakeAuthSeqIdExtractor implements AuthSeqIdExtractor {
  fakePosition: number | undefined;
  extractAuthSeqId(e: Canvas3D.HoverEvent): number | undefined {
    return this.fakePosition;
  }
}