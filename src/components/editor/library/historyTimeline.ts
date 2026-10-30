// The History list: every undo step as a line saying what changed. Steps are the document states
// zundo keeps (pastStates oldest first; futureStates with the next redo last).

type DocState = Record<string, unknown>;

export interface HistoryEntry {
  label: string;
  // Where this step is relative to now: negative is undo, positive redo, 0 the current state.
  offset: number;
}

const NOUN: Record<string, [string, string]> = {
  captions: ['text', 'text'],
  stickers: ['a sticker', 'sticker'],
  imageLayers: ['a photo', 'photo'],
  drawings: ['drawing', 'drawing'],
};

const OTHER: Record<string, string> = {
  activeTemplate: 'Changed the photo',
  canvasHeader: 'Changed the header',
  canvasFooter: 'Changed the footer',
  demotivational: 'Changed the frame',
  canvasFlipX: 'Mirrored',
  templateFaceMorph: 'Face swap',
};

const len = (v: unknown) => (Array.isArray(v) ? v.length : 0);

// Saved steps are copies, so an unchanged list can be a different array with the same contents.
const changed = (a: unknown, b: unknown) => a !== b && JSON.stringify(a) !== JSON.stringify(b);

// What changed from `prev` to `next`, in a few words.
export function historyLabel(prev: DocState, next: DocState): string {
  for (const key of Object.keys(NOUN)) {
    if (!changed(prev[key], next[key])) continue;
    const [added, edited] = NOUN[key];
    const diff = len(next[key]) - len(prev[key]);
    if (diff > 0) return `Added ${added}`;
    if (diff < 0) return `Removed ${key === 'captions' ? 'text' : added}`;
    return `Changed ${edited}`;
  }
  for (const key of Object.keys(OTHER)) if (changed(prev[key], next[key])) return OTHER[key];
  return 'Edit';
}

// The whole timeline, oldest first, the current state at offset 0.
export function historyTimeline(past: DocState[], current: DocState, future: DocState[]): HistoryEntry[] {
  const states = [...past, current, ...[...future].reverse()];
  return states.map((state, i) => ({
    label: i === 0 ? 'Start' : historyLabel(states[i - 1], state),
    offset: i - past.length,
  }));
}
