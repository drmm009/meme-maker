// Each image-editor maker's colour: its tagline pill (MakerBar), and the glow of the page behind it
// (`maker-glow`, makerTopBar.css).
export type MakerBarMode = 'sticker' | 'ai' | 'faceswap';

export const MAKER_TONES: Record<MakerBarMode, string> = {
  sticker: '#14c08a',
  ai: '#8b7bff',
  faceswap: '#ff5a36',
};
