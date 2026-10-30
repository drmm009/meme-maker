import confetti from 'canvas-confetti';
import { cleanTemplateName } from '../memeEditorUtils';
import { useMemeEditorStoreApi } from '../store/useMemeEditorStore';
import { renderExport } from '../export/exportImage';

export const triggerConfetti = () => {
  try {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 }
    });
  } catch {
    // Confetti fallback
  }
};

// The meme as a full-size PNG data URL, without selection handles.
const renderCleanImage = (canvas) => (
  canvas.exportCleanImage ? canvas.exportCleanImage('image/png') : canvas.toDataURL('image/png')
);

// What the Export sheet does: render the meme as a file (format, quality, size), name it, and save
// it to the gallery (always a full-size PNG, with its layers for re-editing).
export function useExport({ canvasRef, template, onSaveToGallery, imageFit, isNativeLayout, layoutDef }) {
  const store = useMemeEditorStoreApi();

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
    return renderExport(canvas.exportCleanCanvas ? canvas.exportCleanCanvas() : canvas, prefs);
  };

  const saveToGallery = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { captions, stickers, imageLayers, aspectRatio, slotImages, slotTransforms } = store.getState();
    onSaveToGallery({
      id: `meme-${Date.now()}`,
      name: memeName(),
      imageUrl: renderCleanImage(canvas),
      rawImageUrl: template?.rawImageUrl || template?.imageUrl,
      captions: JSON.parse(JSON.stringify(captions)),
      stickers: JSON.parse(JSON.stringify(stickers)),
      imageLayers: JSON.parse(JSON.stringify(imageLayers)),
      aspectRatio, imageFit, isNativeLayout, layoutDef, slotImages, slotTransforms,
      createdAt: new Date().toISOString()
    });
    triggerConfetti();
  };

  return { memeName, canvasSize, exportBlob, saveToGallery };
}
