import { cleanTemplateName } from '../memeEditorUtils';
import { useMemeEditorStoreApi } from '../store/useMemeEditorStore';
import { useEditorUiStoreApi } from '../store/useEditorUiStore';
import { renderExport, wantsTransparency } from '../export/exportImage';
import { renderMotion } from '../export/motionExport';

// Loaded the first time there is something to celebrate.
export const triggerConfetti = () => {
  import('canvas-confetti').then(({ default: confetti }) => {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 }
    });
  }).catch(() => {
    // No confetti: nothing else depends on it.
  });
};

// The meme as a full-size PNG data URL, without selection handles.
const renderCleanImage = (canvas) => (
  canvas.exportCleanImage ? canvas.exportCleanImage('image/png') : canvas.toDataURL('image/png')
);

// What the Export sheet does: render the meme as a file (format, quality, size), name it, and save
// it to the gallery (always a full-size PNG, with its layers for re-editing).
export function useExport({ canvasRef, template, onSaveToGallery, imageFit, isNativeLayout, layoutDef }) {
  const store = useMemeEditorStoreApi();
  const uiStore = useEditorUiStoreApi();

  // A default name for the meme: the template's, else the first real caption.
  const memeName = () => {
    const { captions } = store.getState();
    const cleaned = cleanTemplateName(template?.name);
    return cleaned || (captions[0]?.text && captions[0].text !== 'TOP TEXT' ? captions[0].text : '') || 'My Meme';
  };

  const canvasSize = () => ({ w: canvasRef.current?.width || 0, h: canvasRef.current?.height || 0 });

  // The meme as a Blob in the chosen format and size (see export/exportImage).
  const exportBlob = (prefs) => {
    const canvas = canvasRef.current;
    if (!canvas) return Promise.reject(new Error('No canvas'));
    return renderExport(canvas.exportCleanCanvas ? canvas.exportCleanCanvas({ transparent: wantsTransparency(prefs) }) : canvas, prefs);
  };

  // How long each moving layer (GIF, video) loops, or null when nothing on the meme moves.
  const motionLoops = () => canvasRef.current?.animation?.loopsMs || null;

  // The meme as an animated GIF or MP4 (see export/motionExport).
  const exportMotion = (prefs, onProgress, isCancelled) => {
    const canvas = canvasRef.current;
    if (!canvas) return Promise.reject(new Error('No canvas'));
    return renderMotion(canvas, { format: prefs.format, width: prefs.width, onProgress, isCancelled });
  };

  // Saves to My Studio, celebrating only once it is stored; when it can't be (storage full or
  // blocked), a red note over the canvas says so.
  const saveToGallery = async (customName) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { captions, stickers, imageLayers, aspectRatio, slotImages, slotTransforms } = store.getState();
    const finalName = (typeof customName === 'string' && customName.trim()) ? customName.trim() : memeName();
    const saved = await onSaveToGallery({
      // The Sticker maker's saves go under Stickers in My Studio; everything else is a meme.
      kind: uiStore.getState().mode === 'sticker' ? 'sticker' : 'meme',
      id: `meme-${Date.now()}`,
      name: finalName,
      imageUrl: renderCleanImage(canvas),
      rawImageUrl: template?.rawImageUrl || template?.imageUrl,
      captions: JSON.parse(JSON.stringify(captions)),
      stickers: JSON.parse(JSON.stringify(stickers)),
      imageLayers: JSON.parse(JSON.stringify(imageLayers)),
      aspectRatio, imageFit, isNativeLayout, layoutDef, slotImages, slotTransforms,
      createdAt: new Date().toISOString()
    });
    if (saved === false) {
      const ui = uiStore.getState();
      ui.setPasteToast({ text: "Couldn't save to My Studio. Your device may be out of space. Download it instead.", error: true });
      setTimeout(() => uiStore.getState().setPasteToast(false), 5000);
      return;
    }
    triggerConfetti();
  };

  return { memeName, canvasSize, exportBlob, exportMotion, motionLoops, saveToGallery };
}
