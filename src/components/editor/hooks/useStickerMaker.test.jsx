// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useStickerMaker } from './useStickerMaker';
import { createMemeEditorStore, MemeEditorStoreContext } from '../store/useMemeEditorStore';
import { createEditorUiStore, EditorUiStoreContext } from '../store/useEditorUiStore';
import { STICKER_OUTLINE, STICKER_PHOTO, stickerStyleLook } from '../stickerMaker';

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
  const { result } = renderHook(() => useStickerMaker({ removeBackground }), { wrapper });
  const addPhoto = async () => {
    act(() => {
      const s = store.getState();
      s.setImageLayers([...s.imageLayers, { id: 'new', url: 'photo.png', x: 0.3, y: 0.7, scale: 1.5 }]);
      s.setActiveLayerId('new');
    });
    await act(async () => { vi.runAllTimers(); });
  };
  const generate = () => act(async () => { await result.current.generate(); });
  const layer = (id) => store.getState().imageLayers.find((l) => l.id === id);
  return { store, ui, removeBackground, addPhoto, generate, setDieCut: (on) => act(() => result.current.setDieCut(on)), layer };
};

afterEach(() => vi.useRealTimers());

describe('useStickerMaker', () => {
  it('centres a photo added in the Stickers maker and deselects it, leaving the cut-out to Generate', async () => {
    vi.useFakeTimers();
    const { store, removeBackground, addPhoto, layer } = setup('sticker');
    await addPhoto();
    expect(layer('new')).toMatchObject(STICKER_PHOTO);
    expect(store.getState().activeLayerId).toBeNull();
    expect(removeBackground).not.toHaveBeenCalled();
    // A photo already there is left alone.
    expect(layer('old')).toMatchObject({ x: 0.2, y: 0.2 });
  });

  it('Generate cuts out every photo not cut out yet and outlines it; Die-cut turns the outline off and on', async () => {
    vi.useFakeTimers();
    const { store, ui, removeBackground, addPhoto, generate, setDieCut, layer } = setup('sticker');
    await addPhoto();
    await generate();
    expect(removeBackground).toHaveBeenCalledTimes(2);
    expect(layer('new')).toMatchObject({ ...STICKER_OUTLINE, url: 'cut.png' });
    expect(layer('old')).toMatchObject({ ...STICKER_OUTLINE, url: 'cut.png' });
    expect(store.getState().activeLayerId).toBeNull();
    // Already cut out: Generate again does nothing more.
    await generate();
    expect(removeBackground).toHaveBeenCalledTimes(2);

    setDieCut(false);
    expect(ui.getState().stickerDieCut).toBe(false);
    expect(layer('new').dieCut).toBe(false);
    setDieCut(true);
    expect(layer('new')).toMatchObject(STICKER_OUTLINE);
  });

  it('Generate cuts out in the sticker style picked', async () => {
    vi.useFakeTimers();
    const { ui, addPhoto, generate, layer } = setup('sticker');
    act(() => ui.getState().setStickerStyle('pop'));
    await addPhoto();
    await generate();
    expect(layer('new')).toMatchObject({ dieCut: true, dieCutColor: '#ffd60a', url: 'cut.png' });

    const clean = setup('sticker');
    act(() => clean.ui.getState().setStickerStyle('clean'));
    await clean.addPhoto();
    await clean.generate();
    expect(clean.layer('new')).toMatchObject({ dieCut: false, shadowSize: 28 });
    expect(stickerStyleLook('unknown')).toEqual(STICKER_OUTLINE);
  });

  it('gives no outline when the cut-out fails, or with Die-cut off', async () => {
    vi.useFakeTimers();
    const failed = setup('sticker', { fail: true });
    await failed.addPhoto();
    await failed.generate();
    expect(failed.layer('new').dieCut).toBeUndefined();

    const plain = setup('sticker');
    plain.setDieCut(false);
    await plain.addPhoto();
    await plain.generate();
    expect(plain.layer('new')).toMatchObject({ url: 'cut.png', dieCut: false });
  });

  it('leaves photos alone in the other modes, and after Full editor', async () => {
    vi.useFakeTimers();
    const full = setup('full');
    await full.addPhoto();
    expect(full.layer('new')).toMatchObject({ x: 0.3, y: 0.7, scale: 1.5 });

    const switched = setup('sticker');
    act(() => switched.ui.getState().openFullEditor());
    await switched.addPhoto();
    expect(switched.layer('new')).toMatchObject({ x: 0.3, y: 0.7, scale: 1.5 });
  });
});
