import { describe, it, expect } from 'vitest';
import { PACK_COMMIT, loadStickerPack, packGroups, packUrl, searchPack, toPack } from './stickerPack';
import type { PackRow } from './stickerPack';

const rows: PackRow[] = [
  ['Face with tears of joy', 'face_with_tears_of_joy_3d.png', 0, 'smileys', '😂'],
  ['Thumbs up', 'thumbs_up_3d_default.png', 1, 'people', '👍'],
  ['Pizza', 'pizza_3d.png', 0, 'food', '🍕'],
];

describe('stickerPack', () => {
  it('points at the pinned pictures, in the skin-tone folder when there is one', () => {
    expect(packUrl('Face with tears of joy', 'face_with_tears_of_joy_3d.png', false))
      .toBe(`https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@${PACK_COMMIT}/assets/Face%20with%20tears%20of%20joy/3D/face_with_tears_of_joy_3d.png`);
    expect(packUrl('Thumbs up', 'thumbs_up_3d_default.png', true)).toMatch(/\/Thumbs%20up\/Default\/3D\/thumbs_up_3d_default\.png$/);
    expect(toPack(rows).map((s) => s.id)).toEqual(['fluent:face_with_tears_of_joy', 'fluent:thumbs_up', 'fluent:pizza']);
  });

  it('shelves the pack by keyboard group, and searches names and emoji search words', () => {
    const pack = toPack(rows);
    expect(packGroups(pack).map((g) => [g.id, g.label, g.items.length])).toEqual([
      ['3d-smileys', '3D Smileys', 1], ['3d-people', '3D People', 1], ['3d-food', '3D Food', 1],
    ]);
    expect(searchPack(pack, 'tears').map((s) => s.emoji)).toEqual(['😂']);
    expect(searchPack(pack, 'lol', new Map([['😂', ['laugh', 'lol']]])).map((s) => s.emoji)).toEqual(['😂']);
    expect(searchPack(pack, ' ')).toEqual([]);
  });

  it('loads the whole pack', async () => {
    const pack = await loadStickerPack();
    expect(pack.length).toBeGreaterThan(1500);
    expect(new Set(pack.map((s) => s.id)).size).toBe(pack.length);
  });
});
