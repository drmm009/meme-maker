import { FONTS } from '../../../data/stickers';
import { useMemeEditorStore } from '../store/useMemeEditorStore';

// The font picker entry for a caption's font family (Impact when nothing matches).
const findFont = (family) => {
  const f = family?.toLowerCase();
  return FONTS.find((font) => font.family === (family || 'Impact, sans-serif'))
    || FONTS.find((font) => f?.includes('comic') && font.id.toLowerCase().includes('comic'))
    || FONTS.find((font) => (f?.includes('apple') || f?.includes('system')) && font.id.toLowerCase().includes('apple'))
    || FONTS.find((font) => f?.includes(font.id.toLowerCase()))
    || FONTS[0];
};

// The selected layer, by kind.
export function useActiveLayer() {
  const activeLayerId = useMemeEditorStore((s) => s.activeLayerId);
  const captions = useMemeEditorStore((s) => s.captions);
  const stickers = useMemeEditorStore((s) => s.stickers);
  const imageLayers = useMemeEditorStore((s) => s.imageLayers);

  const activeCaption = captions.find((c) => c.id === activeLayerId);
  const activeSticker = stickers.find((s) => s.id === activeLayerId);
  const activeImageLayer = imageLayers.find((i) => i.id === activeLayerId);

  return {
    activeCaption,
    activeSticker,
    activeImageLayer,
    isElementSelected: Boolean(activeLayerId || activeCaption || activeSticker || activeImageLayer),
    activeFontObj: findFont(activeCaption?.fontFamily),
  };
}
