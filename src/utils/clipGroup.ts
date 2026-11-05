// Several clips picked together on the timeline: moved as one, duplicated as one (the copies play
// right after the group, keeping their timing), or deleted.

type Timed = { id: string; startMs: number; endMs: number };

export const MAX_TIMELINE_MS = 100000;

// The picked set after tapping a clip: the first tap takes the selected clip along, so going from
// one selected clip to several keeps it.
export const togglePick = (picked: string[], id: string, activeId: string | null): string[] => {
  const base = picked.length ? picked : activeId && activeId !== id ? [activeId] : [];
  return base.includes(id) ? base.filter((p) => p !== id) : [...base, id];
};

// How far the group may move: not before 0 or past the end of the timeline.
export const clampGroupShift = (spans: { startMs: number; endMs: number }[], deltaMs: number): number => {
  if (!spans.length) return 0;
  const first = Math.min(...spans.map((s) => s.startMs));
  const last = Math.max(...spans.map((s) => s.endMs));
  return Math.max(-first, Math.min(deltaMs, MAX_TIMELINE_MS - last));
};

// The items with the picked ones moved by deltaMs from where they started (`from`: id -> its start
// and end when the drag began).
export const shiftGroup = <T extends Timed>(items: T[], from: Record<string, { startMs: number; endMs: number }>, deltaMs: number): T[] => {
  const d = clampGroupShift(Object.values(from), deltaMs);
  return items.map((i) => (from[i.id] ? { ...i, startMs: from[i.id].startMs + d, endMs: from[i.id].endMs + d } : i));
};

// Copies of the picked clips placed right after the group, in the same timing; returns the items
// with the copies added and the copies' ids.
export const duplicateGroup = <T extends Timed>(items: T[], ids: string[], newId: () => string): { items: T[]; ids: string[] } => {
  const picked = items.filter((i) => ids.includes(i.id));
  if (!picked.length) return { items, ids: [] };
  const first = Math.min(...picked.map((i) => i.startMs));
  const last = Math.max(...picked.map((i) => i.endMs));
  const shift = Math.min(last - first, MAX_TIMELINE_MS - last);
  const copies = picked.map((i) => ({ ...i, id: newId(), startMs: i.startMs + shift, endMs: i.endMs + shift }));
  return { items: [...items, ...copies], ids: copies.map((c) => c.id) };
};
