// The focused makers (editor modes other than 'full') as things to open: the template each starts
// on, and its link (`#/stickers`…), used by Home's cards, links opened from outside and the PWA's
// home-screen shortcuts (vite.config.js).
import type { EditorMode } from './editorModes';
import { makeStickerTemplate } from './stickerMaker';
import { aiMemeTemplate, suitsAiCaption } from './aiMeme';

export type Maker = Exclude<EditorMode, 'full'>;

interface Template {
  id?: string | number;
  name?: string;
  imageUrl?: string;
  [key: string]: unknown;
}

export const MAKER_LINKS: Record<Maker, string> = {
  sticker: '#/stickers',
  ai: '#/ai-meme',
  faceswap: '#/face-swap',
  social: '#/social-card',
};

// The maker a link opens (its hash, as in location.hash), or null.
export const makerOfLink = (hash: string): Maker | null =>
  (Object.keys(MAKER_LINKS) as Maker[]).find((m) => MAKER_LINKS[m] === hash) ?? null;

// The link of the maker a template opens, or '' for the full editor.
export const linkOfTemplate = (template: { editorMode?: unknown; [key: string]: unknown } | null | undefined): string =>
  (template && MAKER_LINKS[template.editorMode as Maker]) || '';

// The template a maker opens on, from the app's templates (null when none suits): Stickers a blank
// see-through square, AI Meme the first meme an AI caption suits (with `prompt`), Face Swap Drake,
// Social Card the WhatsApp or tweet card.
export function makerTemplate(maker: Maker, templates: Template[], prompt = '') {
  if (maker === 'sticker') return makeStickerTemplate();
  if (maker === 'ai') {
    const base = templates.find(suitsAiCaption);
    return base ? aiMemeTemplate(base, prompt) : null;
  }
  if (maker === 'faceswap') {
    // The classic two-panel Drake: both faces face the camera, so the swap finds them (Drake
    // Approving's side profile has none it can find).
    const drake = templates.find((t) => t.id === 'drake') || templates.find((t) => String(t.name || '').toLowerCase().includes('drake')) || templates[0];
    return drake ? { ...drake, editorMode: 'faceswap' as const } : null;
  }
  const card = templates.find((t) => String(t.id || '').includes('whatsapp') || String(t.id || '').includes('tweet'));
  return card ? { ...card, editorMode: 'social' as const } : null;
}
