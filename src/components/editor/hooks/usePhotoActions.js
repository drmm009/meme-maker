import { blobToDataURL } from '../../../utils/galleryStore';
import { useMemeEditorStoreApi } from '../store/useMemeEditorStore';

const readFile = async (e) => {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (!file || !file.type.startsWith('image/')) return null;
  return blobToDataURL(file);
};

// The main photo and photo layers swapped or cropped in place: every layer, and the layer's own
// position, size and look, stay as they were. Each is an undo step.
export function usePhotoActions() {
  const store = useMemeEditorStoreApi();

  // A new main photo. `keepUncropped` remembers the photo before the first crop, to go back to.
  const setMainPhoto = (url, { keepUncropped = false } = {}) => {
    const s = store.getState();
    s.setActiveTemplate((t) => ({
      ...t,
      rawImageUrl: url,
      imageUrl: url,
      originalUrl: null,
      // The template's stored size was the old photo's: the new one's own size decides the shape.
      width: undefined,
      height: undefined,
      uncroppedUrl: keepUncropped ? (t.uncroppedUrl || t.rawImageUrl || t.imageUrl) : null,
    }));
    s.pushHistory();
  };

  const handleApplyMainPhotoCrop = (url) => setMainPhoto(url, { keepUncropped: true });

  // Back to the photo before any crop.
  const handleRestoreMainPhoto = (url) => setMainPhoto(url);

  // The selected photo layer gets a new picture, fitted to its own shape (its old size and crop
  // were for the old picture).
  const handleReplaceImageLayer = async (e) => {
    const url = await readFile(e);
    if (!url) return;
    const s = store.getState();
    const id = s.activeLayerId;
    if (!s.imageLayers.some((l) => l.id === id)) return;
    s.setImageLayers(s.imageLayers.map((l) => (l.id === id
      ? { ...l, url, originalUrl: null, crop: undefined, width: undefined, height: undefined, boxWidth: undefined, boxHeight: undefined, trimStart: undefined, trimEnd: undefined }
      : l)));
    s.pushHistory();
  };

  return { handleApplyMainPhotoCrop, handleRestoreMainPhoto, handleReplaceImageLayer };
}
