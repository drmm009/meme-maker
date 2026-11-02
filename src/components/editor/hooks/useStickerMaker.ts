import { useEffect, useRef } from 'react';
import { useMemeEditorStoreApi } from '../store/useMemeEditorStore';
import { useEditorUiStoreApi } from '../store/useEditorUiStore';
import { STICKER_OUTLINE, STICKER_PHOTO } from '../stickerMaker';

interface ImageLayer {
  id: string;
  originalUrl?: string | null;
}
interface EditorState {
  imageLayers: ImageLayer[];
  activeLayerId: string | null;
  patchLayer: (key: string, id: string, patch: object) => void;
}
interface StoreApi<S> {
  getState(): S;
  subscribe(fn: (state: S, prev: S) => void): () => void;
}

// The Stickers maker's one-tap sticker: a photo added in the 'sticker' mode is centred and sized to
// fill the square, its
// background removed, then given a white die-cut outline. Photos already there when the editor
// opens (a restored draft) are left as they are; so is everything in the other modes.
export function useStickerMaker({ removeBackground }: { removeBackground: () => Promise<void> }) {
  const store = useMemeEditorStoreApi() as unknown as StoreApi<EditorState>;
  const ui = useEditorUiStoreApi() as unknown as StoreApi<{ mode: string }>;
  const removeRef = useRef(removeBackground);
  removeRef.current = removeBackground;

  useEffect(() => {
    const seen = new Set(store.getState().imageLayers.map((l) => l.id));
    const makeSticker = async (id: string) => {
      store.getState().patchLayer('imageLayers', id, STICKER_PHOTO);
      // Removal works on the selected layer, which a new photo is.
      if (store.getState().activeLayerId !== id) return;
      await removeRef.current();
      const layer = store.getState().imageLayers.find((l) => l.id === id);
      if (layer?.originalUrl) store.getState().patchLayer('imageLayers', id, STICKER_OUTLINE);
    };
    return store.subscribe((state, prev) => {
      if (state.imageLayers === prev.imageLayers) return;
      for (const layer of state.imageLayers) {
        if (seen.has(layer.id)) continue;
        seen.add(layer.id);
        // After the rest of the add (selecting it, its undo step) has happened.
        if (ui.getState().mode === 'sticker') setTimeout(() => void makeSticker(layer.id), 0);
      }
    });
  }, [store, ui]);
}
