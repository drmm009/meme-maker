import { describe, it, expect } from 'vitest';
import { pinchChange, pinchPatch, snapRotation } from './layerPinch';

const fingers = (ax: number, ay: number, bx: number, by: number) => ({ a: { x: ax, y: ay }, b: { x: bx, y: by } });

describe('two fingers on a layer', () => {
  it('scales with the spread and turns with the fingers', () => {
    const change = pinchChange(fingers(0, 0, 100, 0), fingers(0, 0, 0, 200), 10);
    expect(change.scale).toBe(2);
    expect(change.rotation).toBe(100);
  });

  it('snaps onto a quarter turn when close', () => {
    expect(snapRotation(3)).toBe(0);
    expect(snapRotation(-2)).toBe(0);
    expect(snapRotation(92)).toBe(90);
    expect(snapRotation(45)).toBe(45);
  });

  it('patches each kind of layer the way it is sized', () => {
    const change = { scale: 2, rotation: 30 };
    expect(pinchPatch('caption', { fontSize: 40 }, change)).toEqual({ fontSize: 80, rotation: 30 });
    expect(pinchPatch('caption', { fontSize: 200 }, change).fontSize).toBe(300);
    expect(pinchPatch('sticker', { scale: 1.5 }, change)).toEqual({ scale: 3, rotation: 30 });
    expect(pinchPatch('imageLayer', { scale: 1, boxWidth: 100, boxHeight: 50 }, change)).toEqual({ scale: 2, rotation: 30, boxWidth: 200, boxHeight: 100 });
  });
});
