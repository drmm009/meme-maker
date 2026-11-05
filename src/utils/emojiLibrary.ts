// Every emoji (emojibase-data, MIT), loaded the first time the Emoji sheet opens: grouped like a
// phone keyboard, with search words. Emoji newer than MAX_EMOJI_VERSION are left out, since older
// phones draw them as empty boxes. Skin tones are left out too; the default yellow is used.

export interface LibraryEmoji { id: string; name: string; emoji: string; category: string; tags: string[] }

// Unicode emoji version Android 13 and iOS 16 draw in full.
export const MAX_EMOJI_VERSION = 14;

export const EMOJI_GROUPS = [
  { id: 'smileys', group: 0, icon: '😀', label: 'Smileys' },
  { id: 'people', group: 1, icon: '👋', label: 'People' },
  { id: 'animals', group: 3, icon: '🐶', label: 'Animals' },
  { id: 'food', group: 4, icon: '🍔', label: 'Food' },
  { id: 'travel', group: 5, icon: '🚗', label: 'Travel' },
  { id: 'activities', group: 6, icon: '⚽', label: 'Activities' },
  { id: 'objects', group: 7, icon: '💡', label: 'Objects' },
  { id: 'symbols', group: 8, icon: '❤️', label: 'Symbols' },
  { id: 'flags', group: 9, icon: '🏁', label: 'Flags' },
];

const BY_GROUP = new Map(EMOJI_GROUPS.map((g) => [g.group, g.id]));

export interface RawEmoji { hexcode: string; label: string; emoji: string; group?: number; order?: number; version?: number; tags?: string[] }

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// The data as the sheet uses it: kept groups only, in keyboard order.
export const toLibrary = (raw: RawEmoji[]): LibraryEmoji[] => raw
  .filter((e) => e.group !== undefined && BY_GROUP.has(e.group) && (e.version ?? 0) <= MAX_EMOJI_VERSION)
  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  .map((e) => ({ id: e.hexcode, name: capitalise(e.label), emoji: e.emoji, category: BY_GROUP.get(e.group as number) as string, tags: e.tags ?? [] }));

// Matches the name or a search word (each word of the query must match).
export const searchLibrary = (list: LibraryEmoji[], query: string): LibraryEmoji[] => {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return list.filter((e) => {
    const name = e.name.toLowerCase();
    return words.every((w) => name.includes(w) || e.tags.some((t) => t.startsWith(w)));
  });
};

let loading: Promise<LibraryEmoji[]> | null = null;

export const loadEmojiLibrary = (): Promise<LibraryEmoji[]> => {
  loading ??= import('emojibase-data/en/data.json')
    .then((m) => toLibrary((m.default ?? m) as unknown as RawEmoji[]))
    .catch((err) => { loading = null; throw err; });
  return loading;
};
