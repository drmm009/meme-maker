// The image editor's modes: the full editor, or one focused maker (stickers, AI memes, face swap,
// social cards) on the same canvas, stores and export with only that job's tools. A template asks
// for one with `editorMode`; "Full editor" in the top bar switches to 'full' on the same meme.

export type EditorMode = 'full' | 'sticker' | 'ai' | 'faceswap' | 'social';
// 'swap' is the Face Swap maker's own tab (FaceSwapStrip).
export type DockTab = 'draw' | 'media' | 'text' | 'fx' | 'canvas' | 'swap';

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
  sticker: { title: 'Stickers', dock: ['media', 'text', 'fx'], startTab: 'media' },
  ai: { title: 'AI Meme', dock: ['text', 'media', 'fx'], startTab: 'text' },
  faceswap: { title: 'Face Swap', dock: ['swap', 'text', 'media'], startTab: 'swap' },
  social: { title: 'Social Card', dock: ['text', 'media', 'canvas'], startTab: 'text' },
};

const isEditorMode = (value: unknown): value is EditorMode => typeof value === 'string' && Object.hasOwn(EDITOR_MODES, value);

// The mode a template asks for; the full editor when it asks for none (or one this app doesn't know).
export const editorModeOf = (template: { editorMode?: unknown } | null | undefined): EditorMode =>
  isEditorMode(template?.editorMode) ? template.editorMode : 'full';
