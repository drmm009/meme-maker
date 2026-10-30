import { STICKERS } from '../../../data/stickers';
import { GRAPHIC_STICKERS } from '../../../data/memeStickers';

// What the Media pickers (Templates, Stickers, Emoji) show for a search or a category. Shared by the
// image editor's docked sheets and the video editor's pop-up pickers.

export interface EmojiItem { id: string; name?: string; emoji: string; category: string }
export interface GraphicSticker { id: string; name: string; url: string; category: string }
export interface PickerTemplate {
  id: string;
  name?: string;
  imageUrl?: string;
  category?: string;
  tags?: string[];
  type?: string;
  mediaType?: string;
  trendingScore?: number;
}

export const EMOJI_CATEGORIES = [
  { id: 'faces', icon: '😀', label: 'Faces' },
  { id: 'gestures', icon: '👋', label: 'Hands' },
  { id: 'symbols', icon: '❤️', label: 'Symbols' },
  { id: 'objects', icon: '💡', label: 'Objects' },
  { id: 'flags', icon: '🏳️‍🌈', label: 'Flags' },
];

export const TEMPLATE_TAGS = [
  { id: 'all', label: 'All' },
  { id: 'social', label: 'Social Media' },
  { id: 'images', label: 'Images' },
  { id: 'reaction', label: 'Reactions' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'classics', label: 'Classics' },
  { id: 'multi-panel', label: 'Multi-Panel' },
];

const has = (text: string | undefined, q: string) => Boolean(text && text.toLowerCase().includes(q));

// A search looks through every category; without one, the picked category shows.
export function filterEmojis(query: string, category: string): EmojiItem[] {
  const q = query.trim().toLowerCase();
  return (STICKERS as EmojiItem[]).filter((s) => (q ? has(s.id, q) || has(s.name, q) || s.emoji.includes(q) : s.category === category));
}

export function filterStickers(query: string, category: string): GraphicSticker[] {
  const q = query.trim().toLowerCase();
  return (GRAPHIC_STICKERS as unknown as GraphicSticker[]).filter((s) => (q ? has(s.name, q) || has(s.category, q) || has(s.id, q) : s.category === category));
}

// Pictures only (no video templates), most popular first.
export function filterTemplates(list: PickerTemplate[], query: string, tag: string, favorites: string[]): PickerTemplate[] {
  const q = query.trim().toLowerCase();
  const inTag = (t: PickerTemplate) => {
    if (tag === 'social') return t.category === 'social' || t.category === 'social media' || Boolean(t.tags?.includes('social'));
    if (tag === 'reaction') return t.category === 'reaction';
    if (tag === 'favorites') return favorites.includes(t.id);
    if (tag === 'classics') return t.category === 'classic' || t.category === 'popular';
    if (tag === 'multi-panel') return t.category === 'multi-panel';
    return true;
  };
  return list
    .filter((t) => t.type !== 'video' && t.mediaType !== 'video')
    .filter((t) => !q || has(t.name, q) || has(t.category, q) || Boolean(t.tags?.some((tag) => tag.toLowerCase().includes(q))))
    .filter(inTag)
    .sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0));
}
