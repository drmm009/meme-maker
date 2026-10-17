import { describe, it, expect } from 'vitest';
import {
  PRESET_PHRASES,
  BUBBLE_LAYOUT_OPTIONS,
  COLOR_SWATCHES,
  DRAW_COLORS,
  getNonOverlappingPosition,
  isColorDark,
} from './captionLayout';

describe('captionLayout constants', () => {
  it('exposes non-empty phrase, bubble and swatch lists', () => {
    expect(PRESET_PHRASES.length).toBeGreaterThan(0);
    expect(BUBBLE_LAYOUT_OPTIONS.length).toBeGreaterThan(0);
    expect(COLOR_SWATCHES).toContain('#ffffff');
    expect(DRAW_COLORS).toEqual(['#ffffff', '#ff2a5f', '#ffe600', '#00f0ff', '#000000']);
    expect(DRAW_COLORS.length).toBe(5);
  });
});

describe('getNonOverlappingPosition', () => {
  it('centers on an empty canvas', () => {
    expect(getNonOverlappingPosition('caption', [], [], [])).toEqual({ x: 0.5, y: 0.5 });
  });

  it('avoids an element occupying the center', () => {
    const pos = getNonOverlappingPosition(
      'caption',
      [{ x: 0.5, y: 0.5, fontSize: 50 }],
      [],
      []
    );
    expect(pos).not.toEqual({ x: 0.5, y: 0.5 });
    expect(pos.x).toBeGreaterThanOrEqual(0.18);
    expect(pos.x).toBeLessThanOrEqual(0.82);
    expect(pos.y).toBeGreaterThanOrEqual(0.18);
    expect(pos.y).toBeLessThanOrEqual(0.82);
  });

  it('ignores header/footer captions when measuring overlap', () => {
    const pos = getNonOverlappingPosition(
      'caption',
      [{ x: 0.5, y: 0.5, isHeaderCaption: true }],
      [],
      []
    );
    expect(pos).toEqual({ x: 0.5, y: 0.5 });
  });
});

describe('isColorDark', () => {
  it('classifies named and hex colors', () => {
    expect(isColorDark('#000000')).toBe(true);
    expect(isColorDark('black')).toBe(true);
    expect(isColorDark('#ffffff')).toBe(false);
    expect(isColorDark('white')).toBe(false);
    expect(isColorDark('transparent')).toBe(false);
    expect(isColorDark(null)).toBe(false);
  });

  it('handles rgb() strings', () => {
    expect(isColorDark('rgb(0, 0, 0)')).toBe(true);
    expect(isColorDark('rgb(255, 255, 255)')).toBe(false);
  });
});
