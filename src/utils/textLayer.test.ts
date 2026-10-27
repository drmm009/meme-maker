import { describe, it, expect } from 'vitest';
import { hasTextBox, textAttrs, textBoxAttrs } from './textLayer';
import type { TextLayerItem } from './textLayer';

describe('textAttrs', () => {
  it('draws white bold Impact with a black outline by default', () => {
    expect(textAttrs({})).toMatchObject({
      text: 'Sample Text', x: 50, y: 50, width: undefined, fontSize: 32, fontFamily: 'Impact, sans-serif',
      fontStyle: 'bold', fill: '#ffffff', stroke: '#000000', strokeWidth: 2, align: 'center', rotation: 0
    });
  });

  it('keeps empty text empty and a position of 0 at 0', () => {
    expect(textAttrs({ text: '' }).text).toBe('');
    expect(textAttrs({ x: 0, y: 0 })).toMatchObject({ x: 0, y: 0 });
  });

  it('drops the outline on a background box and picks a readable colour on white', () => {
    expect(textAttrs({ bgColor: 'black' })).toMatchObject({ fill: '#ffffff', stroke: 'transparent' });
    expect(textAttrs({ bgColor: 'white' })).toMatchObject({ fill: '#000000' });
    expect(textAttrs({ bgColor: '#ff0', stroke: 'transparent' }).strokeWidth).toBe(0);
    expect(hasTextBox({ bgColor: 'none' })).toBe(false);
  });

  it('scales the outline and tightens the spacing with the font size', () => {
    expect(textAttrs({ fontSize: 100 })).toMatchObject({ strokeWidth: 4, letterSpacing: -5 });
  });

  it('gives the export exactly the preview, scaled to the output', () => {
    const items: TextLayerItem[] = [
      { text: 'HELLO', x: 100, y: 300, fontSize: 40, bgColor: 'black', rotation: 15 },
      { text: 'WIDE', x: 10, y: 20, width: 300, fontSize: 64, strokeWidth: 3, align: 'left' },
      {},
    ];
    const ratio = 1.6;
    for (const item of items) {
      const preview = textAttrs(item);
      const exported = textAttrs(item, ratio);
      for (const key of ['x', 'y', 'fontSize', 'strokeWidth', 'letterSpacing'] as const) {
        expect(exported[key]).toBeCloseTo(preview[key] * ratio);
      }
      expect(exported.width).toBe(preview.width === undefined ? undefined : preview.width * ratio);
      expect({ ...exported, x: 0, y: 0, width: 0, fontSize: 0, strokeWidth: 0, letterSpacing: 0 })
        .toEqual({ ...preview, x: 0, y: 0, width: 0, fontSize: 0, strokeWidth: 0, letterSpacing: 0 });
    }
  });
});

describe('textBoxAttrs', () => {
  it('reaches 8px past the text at the sides and 4px at the top and bottom', () => {
    expect(textBoxAttrs({ bgColor: 'black' }, { x: 100, y: 300, width: 80, height: 40 })).toEqual({
      x: 100, y: 300, offsetX: 8, offsetY: 4, width: 96, height: 48, fill: '#000000', cornerRadius: 6, rotation: 0
    });
  });

  it('follows a transformer\'s scale and the output scale', () => {
    expect(textBoxAttrs({ bgColor: 'white' }, { x: 0, y: 0, width: 80, height: 40, scaleX: 2, scaleY: 2 })).toMatchObject({ width: 176, height: 88, fill: '#ffffff' });
    expect(textBoxAttrs({ bgColor: '#123456' }, { x: 0, y: 0, width: 160, height: 80 }, 2)).toMatchObject({ offsetX: 16, offsetY: 8, width: 192, height: 96, cornerRadius: 12, fill: '#123456' });
  });

  it('turns with the text about the text\'s own corner', () => {
    const box = textBoxAttrs({ bgColor: 'black', rotation: 30 }, { x: 100, y: 300, width: 80, height: 40 });
    expect(box).toMatchObject({ x: 100, y: 300, rotation: 30 });
  });
});
