import { describe, it, expect } from 'vitest';
import { loadEmojiLibrary, searchLibrary, toLibrary } from './emojiLibrary';
import type { RawEmoji } from './emojiLibrary';

const raw: RawEmoji[] = [
  { hexcode: '1F480', label: 'skull', emoji: '💀', group: 0, order: 114, version: 1, tags: ['dead', 'lmao'] },
  { hexcode: '1F602', label: 'face with tears of joy', emoji: '😂', group: 0, order: 3, version: 0.6, tags: ['laugh', 'joy'] },
  { hexcode: '1F3FB', label: 'light skin tone', emoji: '🏻', group: 2, order: 1, version: 1 },
  { hexcode: '1F1E6', label: 'regional indicator A', emoji: '🇦', version: 0 },
  { hexcode: '1FAE9', label: 'face with bags under eyes', emoji: '🫩', group: 0, order: 99, version: 16 },
  { hexcode: '1F355', label: 'pizza', emoji: '🍕', group: 4, order: 900, version: 0.6, tags: ['cheese', 'slice'] },
];

describe('emojiLibrary', () => {
  it('keeps keyboard groups in order, without skin tones, letters or too-new emoji', () => {
    expect(toLibrary(raw).map((e) => [e.emoji, e.category, e.name])).toEqual([
      ['😂', 'smileys', 'Face with tears of joy'],
      ['💀', 'smileys', 'Skull'],
      ['🍕', 'food', 'Pizza'],
    ]);
  });

  it('searches names and search words, every word must match', () => {
    const list = toLibrary(raw);
    expect(searchLibrary(list, 'lma').map((e) => e.emoji)).toEqual(['💀']);
    expect(searchLibrary(list, 'face joy').map((e) => e.emoji)).toEqual(['😂']);
    expect(searchLibrary(list, 'face pizza')).toEqual([]);
    expect(searchLibrary(list, '  ')).toEqual([]);
  });

  it('loads the full set', async () => {
    const all = await loadEmojiLibrary();
    expect(all.length).toBeGreaterThan(1700);
    expect(searchLibrary(all, 'skull').map((e) => e.emoji)).toContain('💀');
  });
});
