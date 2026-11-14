// The image editor's modes: the full editor, or one focused maker (stickers, AI memes, face swap,
// social cards) on the same canvas, stores and export with only that job's tools. A template asks
// for one with `editorMode`; "Full editor" in the top bar switches to 'full' on the same meme.

export type EditorMode = 'full' | 'sticker' | 'ai' | 'faceswap' | 'social';
// 'swap' is the Face Swap maker's own tab (FaceSwapStrip), 'card' the Social Card maker's (CardStrip),
// 'ai' the AI Meme maker's (AiStrip), 'sticker' the Stickers maker's (StickerStrip), 'export' the Stickers, AI
// Meme and Face Swap docks' Export, 'pro' their Move to editor (the full editor), 'new' the Stickers and AI Meme makers' New.
export type DockTab = 'draw' | 'media' | 'text' | 'fx' | 'canvas' | 'swap' | 'card' | 'ai' | 'sticker' | 'new' | 'pro' | 'export';

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
  // Export alone: the sticker's Back button steps back to its page (no New), and Move to editor is
  // a pill on the sticker's board (MemeEditor).
  sticker: { title: 'Stickers', dock: ['export'], startTab: 'sticker' },
  // Export alone, as the Stickers maker: Back returns to its page, and Move to editor is a pill on the board.
  ai: { title: 'AI Meme', dock: ['export'], startTab: 'ai' },
  faceswap: { title: 'Face Swap', dock: ['swap', 'pro', 'export'], startTab: 'swap' },
  social: { title: 'Social Card', dock: ['card', 'text', 'media', 'canvas'], startTab: 'card' },
};

const isEditorMode = (value: unknown): value is EditorMode => typeof value === 'string' && Object.hasOwn(EDITOR_MODES, value);

// The mode a template asks for; the full editor when it asks for none (or one this app doesn't know).
export const editorModeOf = (template: { editorMode?: unknown } | null | undefined): EditorMode =>
  isEditorMode(template?.editorMode) ? template.editorMode : 'full';
