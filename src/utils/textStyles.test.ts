// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { MAX_TEXT_STYLES, loadTextStyles, saveTextStyles, styleOf, withStyle } from './textStyles';

describe('saved text styles', () => {
  beforeEach(() => localStorage.clear());

  it('takes the look of a caption, not its words or place', () => {
    expect(styleOf({ text: 'HI', x: 0.5, fontFamily: 'Anton', color: '#fff', bold: false, shadowSize: 0 }))
      .toEqual({ fontFamily: 'Anton', color: '#fff', bold: false, shadowSize: 0 });
  });

  it('puts the newest first, moves a repeat to the front, and keeps a dozen', () => {
    let list = withStyle([], { color: '#fff' }, 'a');
    list = withStyle(list, { color: '#000' }, 'b');
    list = withStyle(list, { color: '#fff' }, 'c');
    expect(list.map((s) => s.id)).toEqual(['c', 'b']);
    for (let i = 0; i < 20; i++) list = withStyle(list, { fontSize: i }, `n${i}`);
    expect(list).toHaveLength(MAX_TEXT_STYLES);
  });

  it('survives a reload, and ignores junk', () => {
    saveTextStyles([{ id: 'a', style: { color: '#f00' } }]);
    expect(loadTextStyles()).toEqual([{ id: 'a', style: { color: '#f00' } }]);
    localStorage.setItem('meme-maker-text-styles', '{"nope":1}');
    expect(loadTextStyles()).toEqual([]);
  });
});
