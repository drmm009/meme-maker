import { useEffect, useRef } from 'react';
import { useMemeEditorStoreApi } from '../store/useMemeEditorStore';
import { useEditorUiStoreApi } from '../store/useEditorUiStore';
import { STICKER_OUTLINE, STICKER_PHOTO, stickerStyleLook } from '../stickerMaker';

interface ImageLayer {
  id: string;
  originalUrl?: string | null;
  dieCut?: boolean;
}
interface EditorState {
  imageLayers: ImageLayer[];
  activeLayerId: string | null;
  setActiveLayerId: (id: string | null) => void;
  patchLayer: (key: string, id: string, patch: object) => void;
}
interface UiState {
  mode: string;
  stickerDieCut: boolean;
  stickerStyle: string;
  setStickerDieCut: (on: boolean) => void;
}
interface StoreApi<S> {
  getState(): S;
  subscribe(fn: (state: S, prev: S) => void): () => void;
}

// The Stickers maker: a photo added in the 'sticker' mode (Upload image or Gallery) is centred and
// sized to fill the square, and left selected-free so the sticker shows clean. Generate cuts out
// every photo not cut out yet and gives it the look of the sticker style picked (stickerStyle); Die-cut
// turns that outline on or off for the cut-out photos (and later ones). Photos already there when
// the editor opens (a restored draft) aren't moved; nothing happens in the other modes.
export function useStickerMaker({ removeBackground }: { removeBackground: () => Promise<void> }) {
  const store = useMemeEditorStoreApi() as unknown as StoreApi<EditorState>;
  const ui = useEditorUiStoreApi() as unknown as StoreApi<UiState>;
  const removeRef = useRef(removeBackground);
  removeRef.current = removeBackground;

  useEffect(() => {
    const seen = new Set(store.getState().imageLayers.map((l) => l.id));
    const place = (id: string) => {
      const s = store.getState();
      s.patchLayer('imageLayers', id, STICKER_PHOTO);
      if (s.activeLayerId === id) s.setActiveLayerId(null);
    };
    return store.subscribe((state, prev) => {
      if (state.imageLayers === prev.imageLayers) return;
      for (const layer of state.imageLayers) {
        if (seen.has(layer.id)) continue;
        seen.add(layer.id);
        // After the rest of the add (selecting it, its undo step) has happened.
        if (ui.getState().mode === 'sticker') setTimeout(() => place(layer.id), 0);
      }
    });
  }, [store, ui]);

  const outline = (on: boolean) => (on ? STICKER_OUTLINE : { dieCut: false });

  const generate = async () => {
    const uncut = store.getState().imageLayers.filter((l) => !l.originalUrl).map((l) => l.id);
    for (const id of uncut) {
      // Removal works on the selected layer.
      store.getState().setActiveLayerId(id);
      await removeRef.current();
      const layer = store.getState().imageLayers.find((l) => l.id === id);
      if (layer?.originalUrl) {
        const { stickerStyle, stickerDieCut } = ui.getState();
        store.getState().patchLayer('imageLayers', id, { ...stickerStyleLook(stickerStyle), ...(stickerDieCut ? {} : { dieCut: false }) });
      }
    }
    store.getState().setActiveLayerId(null);
  };

  const setDieCut = (on: boolean) => {
    ui.getState().setStickerDieCut(on);
    for (const layer of store.getState().imageLayers) {
      if (layer.originalUrl) store.getState().patchLayer('imageLayers', layer.id, outline(on));
    }
  };

  return { generate, setDieCut };
}
