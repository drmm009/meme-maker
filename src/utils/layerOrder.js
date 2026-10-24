// Drawing order of the video editor's visual items, shared by the preview and the export.
// By default videos sit at the bottom, then photos, stickers, and text on top, each in the order
// added. Bring forward / send back give an item an explicit `z` that overrides this.

const GROUP = { video: 0, image: 1, sticker: 2, text: 3 };
const GROUP_SPAN = 1e6;

export const layerZ = (item, index) => (Number.isFinite(item.z) ? item.z : (GROUP[item.type] ?? 4) * GROUP_SPAN + index);

// Visual items (audio excluded), bottom to top.
export const drawOrder = (items) => items
  .map((item, index) => ({ item, z: layerZ(item, index) }))
  .filter(({ item }) => item.type !== 'audio')
  .sort((a, b) => a.z - b.z)
  .map(({ item }) => item);

const overlaps = (a, b) => a.startMs < b.endMs && b.startMs < a.endMs;

// Items with `id` moved one step up (dir 1) or down (dir -1), past the nearest item it overlaps
// in time (moving past one that is never on screen with it would change nothing you can see).
// Returns the same array when there is nothing to move past.
export const moveLayer = (items, id, dir) => {
  const ranked = items
    .map((item, index) => ({ item, z: layerZ(item, index) }))
    .filter(({ item }) => item.type !== 'audio')
    .sort((a, b) => a.z - b.z);
  const at = ranked.findIndex(({ item }) => item.id === id);
  if (at < 0) return items;
  const me = ranked[at];
  for (let i = at + dir; i >= 0 && i < ranked.length; i += dir) {
    if (!overlaps(me.item, ranked[i].item)) continue;
    // Slot in just past that item, between it and its next neighbour; nothing else moves.
    const beyond = ranked[i + dir];
    const z = beyond ? (ranked[i].z + beyond.z) / 2 : ranked[i].z + dir;
    return items.map((item) => (item.id === id ? { ...item, z } : item));
  }
  return items;
};
