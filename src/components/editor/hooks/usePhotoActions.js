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
      ? { ...l, url, originalUrl: null, uncroppedUrl: null, crop: undefined, width: undefined, height: undefined, boxWidth: undefined, boxHeight: undefined, trimStart: undefined, trimEnd: undefined }
      : l)));
    s.pushHistory();
  };

  // A photo layer through the cropper: the new picture keeps the layer's place and width (its
  // height follows the new shape), its look and its first uncropped picture to go back to.
  const setLayerPhoto = async (id, url, { keepUncropped = false } = {}) => {
    const size = await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => resolve(null);
      img.src = url;
    });
    const s = store.getState();
    s.setImageLayers(s.imageLayers.map((l) => {
      if (l.id !== id) return l;
      const width = l.width ?? l.boxWidth;
      return {
        ...l,
        url,
        originalUrl: l.originalUrl ?? null,
        subjectUrl: undefined,
        subjectOf: undefined,
        crop: undefined,
        fitMode: l.fitMode === 'crop' ? 'fit' : l.fitMode,
        boxWidth: undefined,
        boxHeight: undefined,
        width: width && size ? width : undefined,
        height: width && size ? (width * size.h) / size.w : undefined,
        uncroppedUrl: keepUncropped ? (l.uncroppedUrl || l.url) : null,
      };
    }));
    s.pushHistory();
  };
  const handleApplyLayerCrop = (id, url) => setLayerPhoto(id, url, { keepUncropped: true });
  const handleRestoreLayerPhoto = (id, url) => setLayerPhoto(id, url);

  return { handleApplyMainPhotoCrop, handleRestoreMainPhoto, handleReplaceImageLayer, handleApplyLayerCrop, handleRestoreLayerPhoto };
}
