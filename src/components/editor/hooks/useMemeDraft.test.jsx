// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';

const io = vi.hoisted(() => ({ saved: null, saves: [] }));
vi.mock('../../../utils/memeDraftStore', async (importOriginal) => ({
  ...(await importOriginal()),
  loadMemeDraft: async () => io.saved,
  saveMemeDraft: async (state) => { io.saves.push(state); },
}));

// Tests share a module cache (isolate: false): load the hook fresh, so it uses this file's mock.
vi.resetModules();
const { useMemeDraft } = await import('./useMemeDraft');
const { createMemeEditorStore, MemeEditorStoreContext } = await import('../store/useMemeEditorStore');

const template = { id: 't', name: 'Drake', url: 'https://example.test/drake.png' };
const savedDraft = {
  savedAt: Date.now() - 5 * 60000,
  document: { activeTemplate: { id: 'old', name: 'Old one', url: 'https://example.test/old.png' }, captions: [{ id: 'c', text: 'SAVED' }], stickers: [], imageLayers: [] },
  media: {},
};

const setup = (opts = {}) => {
  const store = createMemeEditorStore(template);
  const onRestore = vi.fn();
  const wrapper = ({ children }) => <MemeEditorStoreContext.Provider value={store}>{children}</MemeEditorStoreContext.Provider>;
  const hook = renderHook(() => useMemeDraft({ restored: false, onRestore, ...opts }), { wrapper });
  return { store, onRestore, ...hook };
};

beforeEach(() => {
  io.saved = null;
  io.saves = [];
});
afterEach(() => vi.useRealTimers());

describe('useMemeDraft', () => {
  it('offers the saved draft and restores its document', async () => {
    io.saved = savedDraft;
    const { result, onRestore } = setup();
    await act(async () => {});
    expect(result.current.offer).toEqual({ savedAt: savedDraft.savedAt, name: 'Old one', layers: 1 });
    act(() => result.current.restore());
    expect(onRestore).toHaveBeenCalledWith(savedDraft.document);
  });

  it('makes no offer in a restored session', async () => {
    io.saved = savedDraft;
    const { result } = setup({ restored: true });
    await act(async () => {});
    expect(result.current.offer).toBeNull();
  });

  it('saves after an edit, not on setup, and the edit withdraws the offer', async () => {
    io.saved = savedDraft;
    vi.useFakeTimers();
    const { result, store } = setup();
    await act(async () => {});
    // Setup-style changes without an undo step don't count.
    act(() => store.getState().setActiveTemplate({ ...template }));
    await act(async () => { vi.advanceTimersByTime(2000); });
    expect(io.saves).toHaveLength(0);
    expect(result.current.offer).not.toBeNull();

    act(() => {
      store.getState().setCaptions((c) => [...c, { id: 'new', text: 'NEW' }]);
      store.getState().pushHistory();
    });
    expect(result.current.offer).toBeNull();
    await act(async () => { vi.advanceTimersByTime(1200); });
    expect(io.saves).toHaveLength(1);
    expect(io.saves[0].captions.at(-1).text).toBe('NEW');
  });

  it('saves a pending edit on unmount', async () => {
    vi.useFakeTimers();
    const { store, unmount } = setup();
    act(() => {
      store.getState().setCaptions([]);
      store.getState().pushHistory();
    });
    unmount();
    expect(io.saves).toHaveLength(1);
  });
});

describe('createMemeEditorStore with a restored document', () => {
  it('starts from the document instead of the template, with no undo steps', () => {
    const store = createMemeEditorStore(template, savedDraft.document);
    expect(store.getState().captions).toEqual(savedDraft.document.captions);
    expect(store.getState().activeTemplate.id).toBe('old');
    expect(store.temporal.getState().pastStates).toHaveLength(0);
  });
});
