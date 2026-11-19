import { describe, expect, it } from 'vitest';
import { blobs, edgeAlpha, subjectConfidence, subjectShares } from './photoCutout';

const f = (v: number[]) => Float32Array.from(v);
const u = (v: number[]) => Uint8Array.from(v);
const round = (a: Float32Array) => Array.from(a).map((v) => +v.toFixed(2));

describe('photo cut-out', () => {
  it('says how much of the photo is something, and how much of that is people', () => {
    // Pixels: background, person, person, dog (DeepLab: 0 background, 15 person, 12 dog).
    expect(subjectShares(u([0, 15, 15, 12]))).toEqual({ subject: 0.75, people: 2 / 3 });
    expect(subjectShares(u([0, 0, 0, 0]))).toEqual({ subject: 0, people: 0 });
    expect(subjectShares(new Uint8Array(0))).toEqual({ subject: 0, people: 0 });
  });

  it('finds the separate things in a picture', () => {
    // 4 x 2: a blob on the left, background, a blob on the right.
    const { labels, count } = blobs(u([15, 15, 0, 8, 15, 0, 0, 8]), 4, 2);
    expect(count).toBe(2);
    expect(Array.from(labels)).toEqual([1, 1, 0, 2, 1, 0, 0, 2]);
  });

  it('keeps everything that is not background without the people model', () => {
    const general = { width: 4, height: 1, classes: u([0, 12, 12, 12]), background: f([0.9, 0.2, 0.5, 0]) };
    expect(round(subjectConfidence(general))).toEqual([0.1, 0.8, 0.5, 1]);
  });

  it('takes people from the people model, and keeps a pet beside them that General calls a person', () => {
    // 5 x 1: a person, a gap, a cat that General wrongly calls a person, background.
    const general = { width: 5, height: 1, classes: u([15, 15, 0, 15, 0]), background: f([0.3, 0.2, 0.9, 0.25, 0.95]) };
    // The People model: sure about the person, rightly not about the cat.
    const peopleBackground = f([0.02, 0.05, 0.98, 0.97, 0.99]);
    expect(round(subjectConfidence(general, peopleBackground))).toEqual([0.98, 0.95, 0.02, 0.75, 0.01]);
  });

  it("uses the people model's edge for a blob that is a person", () => {
    // General's sloppy halo joined to the person: the People model's background wins there.
    const general = { width: 3, height: 1, classes: u([15, 15, 15]), background: f([0.1, 0.1, 0.4]) };
    const peopleBackground = f([0.01, 0.02, 0.99]);
    expect(round(subjectConfidence(general, peopleBackground))).toEqual([0.99, 0.98, 0.01]);
  });

  it('ignores a people mask of another size', () => {
    const general = { width: 4, height: 1, classes: u([0, 15, 0, 15]), background: f([1, 0, 1, 0]) };
    expect(round(subjectConfidence(general, new Float32Array(9)))).toEqual([0, 1, 0, 1]);
  });

  it('turns confidence into a smooth edge', () => {
    expect(edgeAlpha(0)).toBe(0);
    expect(edgeAlpha(0.35)).toBe(0);
    expect(edgeAlpha(0.5)).toBeCloseTo(0.5);
    expect(edgeAlpha(0.65)).toBe(1);
    expect(edgeAlpha(1)).toBe(1);
  });
});
