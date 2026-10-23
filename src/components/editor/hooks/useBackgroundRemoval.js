import { useState } from 'react';
import { removeBackground } from '@imgly/background-removal';
import { blobToDataURL, dataURLToBlob } from '../../../utils/galleryStore';
import { useMemeEditorStoreApi } from '../store/useMemeEditorStore';

const removeImageBackground = async (url) => {
  let blob;
  if (typeof url === 'string' && url.startsWith('data:')) {
    blob = dataURLToBlob(url);
  } else {
    const res = await fetch(url);
    blob = await res.blob();
  }
  return blobToDataURL(await removeBackground(blob));
};

const reportFailure = (err) => {
  console.error('Failed to remove background:', err);
  alert('Failed to remove background: ' + (err.message || err.toString()));
};

// Magic Eraser: toggles background removal on the selected image layer or
// sticker, or on the template image when nothing is selected. Results are
// applied by layer id to the latest state, since removal takes seconds.
export function useBackgroundRemoval() {
  const store = useMemeEditorStoreApi();
  const [isRemovingBg, setIsRemovingBg] = useState(false);

  const run = async (work) => {
    try {
      setIsRemovingBg(true);
      await work();
    } catch (err) {
      reportFailure(err);
    } finally {
      setIsRemovingBg(false);
    }
  };

  const handleRemoveBackground = async () => {
    const { activeLayerId, imageLayers, stickers, activeTemplate } = store.getState();
    const imageLayer = imageLayers.find((l) => l.id === activeLayerId);
    const sticker = stickers.find((s) => s.id === activeLayerId);

    if (imageLayer) {
      const updateLayer = (patch) => {
        const s = store.getState();
        s.setImageLayers(s.imageLayers.map((l) => (l.id === imageLayer.id ? { ...l, ...patch } : l)));
        s.pushHistory();
      };
      if (imageLayer.originalUrl) {
        updateLayer({ url: imageLayer.originalUrl, originalUrl: null });
        return;
      }
      await run(async () => {
        const newUrl = await removeImageBackground(imageLayer.url);
        updateLayer({ url: newUrl, originalUrl: imageLayer.url });
      });
    } else if (sticker) {
      const updateSticker = (patch) => {
        const s = store.getState();
        s.setStickers(s.stickers.map((st) => (st.id === sticker.id ? { ...st, ...patch } : st)));
        s.pushHistoryDebounced();
      };
      if (sticker.originalUrl) {
        updateSticker({ src: sticker.originalUrl, url: sticker.originalUrl, originalUrl: null });
        return;
      }
      await run(async () => {
        const oldUrl = sticker.url || sticker.src;
        const newUrl = await removeImageBackground(oldUrl);
        updateSticker({ src: newUrl, url: newUrl, originalUrl: oldUrl });
      });
    } else if (activeTemplate && (activeTemplate.rawImageUrl || activeTemplate.imageUrl)) {
      const { setActiveTemplate } = store.getState();
      if (activeTemplate.originalUrl) {
        setActiveTemplate((t) => ({ ...t, rawImageUrl: activeTemplate.originalUrl, imageUrl: activeTemplate.originalUrl, originalUrl: null }));
        return;
      }
      await run(async () => {
        const oldUrl = activeTemplate.rawImageUrl || activeTemplate.imageUrl;
        const newUrl = await removeImageBackground(oldUrl);
        setActiveTemplate((t) => ({ ...t, rawImageUrl: newUrl, imageUrl: newUrl, originalUrl: oldUrl }));
      });
    }
  };

  return { isRemovingBg, handleRemoveBackground };
}
