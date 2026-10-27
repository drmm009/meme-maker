import { FONTS } from '../../../data/stickers';
import { isSocialCardCaption } from '../memeEditorUtils';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';

// The font picker entry for a caption's font family (Impact when nothing matches).
const findFont = (family) => {
  const f = family?.toLowerCase();
  return FONTS.find((font) => font.family === (family || 'Impact, sans-serif'))
    || FONTS.find((font) => f?.includes('comic') && font.id.toLowerCase().includes('comic'))
    || FONTS.find((font) => (f?.includes('apple') || f?.includes('system')) && font.id.toLowerCase().includes('apple'))
    || FONTS.find((font) => f?.includes(font.id.toLowerCase()))
    || FONTS[0];
};

// The selected layer, by kind, plus the social card the card studio edits: the selected card,
// else the first card of the studio's platform, else any card.
export function useActiveLayer() {
  const activeLayerId = useMemeEditorStore((s) => s.activeLayerId);
  const captions = useMemeEditorStore((s) => s.captions);
  const stickers = useMemeEditorStore((s) => s.stickers);
  const imageLayers = useMemeEditorStore((s) => s.imageLayers);
  const socialModalPlatform = useEditorUiStore((s) => s.socialModalPlatform);

  const activeCaption = captions.find((c) => c.id === activeLayerId);
  const activeSticker = stickers.find((s) => s.id === activeLayerId);
  const activeImageLayer = imageLayers.find((i) => i.id === activeLayerId);
  const currentEditingSocialCard = (activeCaption && isSocialCardCaption(activeCaption))
    ? activeCaption
    : captions.find((c) => {
        if (socialModalPlatform === 'whatsapp') return c.isWhatsAppCard;
        if (socialModalPlatform === 'instagram') return c.isInstagramCard;
        return c.isTweetCard;
      }) || captions.find((c) => isSocialCardCaption(c));

  return {
    activeCaption,
    activeSticker,
    activeImageLayer,
    currentEditingSocialCard,
    isElementSelected: Boolean(activeLayerId || activeCaption || activeSticker || activeImageLayer),
    activeFontObj: findFont(activeCaption?.fontFamily),
  };
}
