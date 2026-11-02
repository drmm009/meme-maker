// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useStickerMaker } from './useStickerMaker';
import { createMemeEditorStore, MemeEditorStoreContext } from '../store/useMemeEditorStore';
import { createEditorUiStore, EditorUiStoreContext } from '../store/useEditorUiStore';
import { STICKER_OUTLINE, STICKER_PHOTO } from '../stickerMaker';

const template = { id: 't', name: 'Sticker', url: 'https://example.test/clear.png', defaultCaptions: [] };

// The editor stores in the given mode, a photo layer already there, and the hook running. Its
// removeBackground cuts out the selected layer (as the real one does) unless told to fail.
const setup = (mode, { fail = false } = {}) => {
  const store = createMemeEditorStore({ ...template, imageLayers: [{ id: 'old', url: 'old.png', x: 0.2, y: 0.2 }] });
  const ui = createEditorUiStore({ ...template, editorMode: mode });
  const removeBackground = vi.fn(async () => {
    if (fail) return;
    const { activeLayerId, imageLayers, setImageLayers } = store.getState();
    setImageLayers(imageLayers.map((l) => (l.id === activeLayerId ? { ...l, url: 'cut.png', originalUrl: l.url } : l)));
  });
  const wrapper = ({ children }) => (
    <MemeEditorStoreContext.Provider value={store}>
      <EditorUiStoreContext.Provider value={ui}>{children}</EditorUiStoreContext.Provider>
    </MemeEditorStoreContext.Provider>
  );
  renderHook(() => useStickerMaker({ removeBackground }), { wrapper });
  const addPhoto = async () => {
    act(() => {
      const s = store.getState();
      s.setImageLayers([...s.imageLayers, { id: 'new', url: 'photo.png', x: 0.3, y: 0.7, scale: 1.5 }]);
      s.setActiveLayerId('new');
    });
    await act(async () => { vi.runAllTimers(); });
    await act(async () => {});
  };
  const layer = (id) => store.getState().imageLayers.find((l) => l.id === id);
  return { store, ui, removeBackground, addPhoto, layer };
};

afterEach(() => vi.useRealTimers());

describe('useStickerMaker', () => {
  it('turns a photo added in the Stickers maker into a centred, cut-out, outlined sticker', async () => {
    vi.useFakeTimers();
    const { removeBackground, addPhoto, layer } = setup('sticker');
    await addPhoto();
    expect(removeBackground).toHaveBeenCalledTimes(1);
    expect(layer('new')).toMatchObject({ ...STICKER_PHOTO, ...STICKER_OUTLINE, url: 'cut.png' });
    // A photo already there is left alone.
    expect(layer('old')).toMatchObject({ url: 'old.png', x: 0.2, y: 0.2 });
    expect(layer('old').dieCut).toBeUndefined();
  });

  it('gives no outline when the cut-out fails', async () => {
    vi.useFakeTimers();
    const { addPhoto, layer } = setup('sticker', { fail: true });
    await addPhoto();
    expect(layer('new').dieCut).toBeUndefined();
  });

  it('leaves photos alone in the other modes, and after Full editor', async () => {
    vi.useFakeTimers();
    const full = setup('full');
    await full.addPhoto();
    expect(full.removeBackground).not.toHaveBeenCalled();
    expect(full.layer('new')).toMatchObject({ x: 0.3, y: 0.7, scale: 1.5 });

    const switched = setup('sticker');
    act(() => switched.ui.getState().openFullEditor());
    await switched.addPhoto();
    expect(switched.removeBackground).not.toHaveBeenCalled();
  });
});
