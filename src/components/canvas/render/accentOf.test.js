// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { STICKER_GREEN, THEME_CORAL, accentOf } from './handles';

describe('accentOf', () => {
  it('is the app orange, and green inside the Stickers maker', () => {
    const plain = document.createElement('canvas');
    expect(accentOf({ canvas: plain })).toBe(THEME_CORAL);

    const screen = document.createElement('div');
    screen.className = 'meme-editor-container meme-editor--sticker-mode';
    const inSticker = document.createElement('canvas');
    screen.appendChild(inSticker);
    expect(accentOf({ canvas: inSticker })).toBe(STICKER_GREEN);
  });

  it('falls back to orange without a DOM canvas', () => {
    expect(accentOf({ canvas: {} })).toBe(THEME_CORAL);
    expect(accentOf(undefined)).toBe(THEME_CORAL);
  });
});
