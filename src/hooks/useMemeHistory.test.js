import { describe, it, expect } from 'vitest';
import { cloneSnapshot, pushToStack, undoStep, redoStep } from './useMemeHistory';

describe('cloneSnapshot', () => {
  it('deep-clones so later mutations do not leak into history', () => {
    const src = { captions: [{ text: 'a' }], nested: { n: 1 } };
    const copy = cloneSnapshot(src);
    src.captions[0].text = 'mutated';
    src.nested.n = 99;
    expect(copy.captions[0].text).toBe('a');
    expect(copy.nested.n).toBe(1);
  });

  it('preserves undefined and null face-morph payloads', () => {
    expect(cloneSnapshot(undefined)).toBe(undefined);
    const s = { templateFaceMorph: null };
    expect(cloneSnapshot(s)).toEqual(s);
  });
});

describe('pushToStack', () => {
  it('appends and advances step', () => {
    const { stack, step } = pushToStack([{ v: 0 }], 0, { v: 1 }, 30);
    expect(stack).toEqual([{ v: 0 }, { v: 1 }]);
    expect(step).toBe(1);
  });

  it('truncates the redo branch', () => {
    const { stack, step } = pushToStack([{ v: 0 }, { v: 1 }, { v: 2 }], 0, { v: 3 }, 30);
    expect(stack).toEqual([{ v: 0 }, { v: 3 }]);
    expect(step).toBe(1);
  });

  it('caps at limit, dropping oldest', () => {
    let stack = [{ v: 0 }];
    let step = 0;
    for (let i = 1; i <= 35; i++) {
      ({ stack, step } = pushToStack(stack, step, { v: i }, 30));
    }
    expect(stack.length).toBe(30);
    expect(step).toBe(29);
    expect(stack[0]).toEqual({ v: 6 }); // 0..5 evicted
    expect(stack[29]).toEqual({ v: 35 });
  });
});

describe('undo/redo steps', () => {
  it('clamps at bounds', () => {
    expect(undoStep(0)).toBe(0);
    expect(undoStep(2)).toBe(1);
    expect(redoStep(2, 3)).toBe(2);
    expect(redoStep(0, 3)).toBe(1);
  });
});
