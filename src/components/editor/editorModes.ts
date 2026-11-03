// The image editor's modes: the full editor, or one focused maker (stickers, AI memes, face swap,
// social cards) on the same canvas, stores and export with only that job's tools. A template asks
// for one with `editorMode`; "Full editor" in the top bar switches to 'full' on the same meme.

export type EditorMode = 'full' | 'sticker' | 'ai' | 'faceswap' | 'social';
// 'swap' is the Face Swap maker's own tab (FaceSwapStrip), 'card' the Social Card maker's (CardStrip),
// 'ai' the AI Meme maker's (AiStrip), 'sticker' the Stickers maker's (StickerStrip), 'export' the Stickers dock export.
export type DockTab = 'draw' | 'media' | 'text' | 'fx' | 'canvas' | 'swap' | 'card' | 'ai' | 'sticker' | 'export';

export interface EditorModeConfig {
  // The top bar's title.
  title: string;
  // The dock's tabs, in order.
  dock: DockTab[];
  // The tab whose tool strip shows on arrival.
  startTab: DockTab | null;
}

export const EDITOR_MODES: Record<EditorMode, EditorModeConfig> = {
  full: { title: 'Meme Editor', dock: ['draw', 'media', 'text', 'fx', 'canvas'], startTab: 'text' },
  sticker: { title: 'Stickers', dock: ['sticker', 'export'], startTab: 'sticker' },
  ai: { title: 'AI Meme', dock: ['ai', 'text', 'media', 'fx'], startTab: 'ai' },
  faceswap: { title: 'Face Swap', dock: ['swap', 'text', 'media'], startTab: 'swap' },
  social: { title: 'Social Card', dock: ['card', 'text', 'media', 'canvas'], startTab: 'card' },
};

const isEditorMode = (value: unknown): value is EditorMode => typeof value === 'string' && Object.hasOwn(EDITOR_MODES, value);

// The mode a template asks for; the full editor when it asks for none (or one this app doesn't know).
export const editorModeOf = (template: { editorMode?: unknown } | null | undefined): EditorMode =>
  isEditorMode(template?.editorMode) ? template.editorMode : 'full';
