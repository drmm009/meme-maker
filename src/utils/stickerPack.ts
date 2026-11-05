// The 3D sticker pack: Microsoft's Fluent Emoji 3D (MIT), about 1,600 glossy emoji pictures. The
// list (src/data/fluentStickers.json: name, file, whether it sits in a skin-tone folder, keyboard
// group, the emoji) loads with the Stickers sheet; the pictures come from jsDelivr, pinned to one
// commit of the GitHub repo so they never change under saved memes. They're served with CORS, so
// they export like any other sticker.
import { EMOJI_GROUPS } from './emojiLibrary';

export const PACK_COMMIT = '1ffb34c752ecf5d402f04cfb4b392c77f57c54bc';
const PACK_BASE = `https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@${PACK_COMMIT}/assets/`;

export type PackRow = [name: string, file: string, toned: 0 | 1, category: string, emoji: string];
export interface PackSticker { id: string; name: string; url: string; category: string; emoji: string }

export const packUrl = (name: string, file: string, toned: boolean): string =>
  `${PACK_BASE}${encodeURIComponent(name)}/${toned ? 'Default/' : ''}3D/${encodeURIComponent(file)}`;

export const toPack = (rows: PackRow[]): PackSticker[] => rows.map(([name, file, toned, category, emoji]) => ({
  id: `fluent:${file.replace(/(_3d(_default)?)?\.png$/, '')}`,
  name,
  url: packUrl(name, file, Boolean(toned)),
  category,
  emoji,
}));

// The pack's shelves, in keyboard order (the groups that have stickers).
export const packGroups = (pack: PackSticker[]) => EMOJI_GROUPS
  .map((g) => ({ id: `3d-${g.id}`, label: `3D ${g.label}`, icon: g.icon, items: pack.filter((s) => s.category === g.id) }))
  .filter((g) => g.items.length);

// Each word must match the name, or a search word of its emoji (`tags`: emoji -> words).
export const searchPack = (pack: PackSticker[], query: string, tags: Map<string, string[]> = new Map()): PackSticker[] => {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return pack.filter((s) => {
    const name = s.name.toLowerCase();
    const extra = tags.get(s.emoji) ?? [];
    return words.every((w) => name.includes(w) || extra.some((t) => t.startsWith(w)));
  });
};

let loading: Promise<PackSticker[]> | null = null;

export const loadStickerPack = (): Promise<PackSticker[]> => {
  loading ??= import('../data/fluentStickers.json')
    .then((m) => toPack((m.default ?? m) as unknown as PackRow[]))
    .catch((err) => { loading = null; throw err; });
  return loading;
};
