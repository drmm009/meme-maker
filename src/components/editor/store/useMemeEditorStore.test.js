import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createMemeEditorStore,
  buildInitialDocument,
  HISTORY_LIMIT,
  HISTORY_DEBOUNCE_MS,
} from './useMemeEditorStore';

const TEMPLATE = { id: 't1', name: 'Test', imageUrl: '/images/a.jpg' };

const texts = (store) => store.getState().captions.map((c) => c.text);
const canUndo = (store) => store.temporal.getState().pastStates.length > 0;
const canRedo = (store) => store.temporal.getState().futureStates.length > 0;

function addCaption(store, text) {
  store.getState().setCaptions((caps) => [...caps, { id: `cap-${text}`, text }]);
  store.getState().pushHistory();
}

describe('buildInitialDocument', () => {
  it('gives a plain template TOP/BOTTOM captions at font size 50', () => {
    const doc = buildInitialDocument(TEMPLATE);
    expect(doc.captions.map((c) => [c.text, c.fontSize])).toEqual([['TOP TEXT', 50], ['BOTTOM TEXT', 50]]);
    expect(doc.activeTemplate).toBe(TEMPLATE);
    expect(doc.canvasHeader).toEqual({ enabled: false, bgColor: '#ffffff', height: 140 });
  });

  it('creates one caption per text panel for native layouts', () => {
    const doc = buildInitialDocument({
      isNativeLayout: true,
      layoutDef: { id: '2-vert', slots: 2 },
      slotImages: ['TEXT_PANEL', '/images/b.jpg'],
    });
    expect(doc.captions).toHaveLength(1);
    expect(doc.captions[0]).toMatchObject({ text: 'ADD TEXT', x: 0.5, y: 0.25 });
    expect(doc.slotImages[0]).toMatch(/^data:image\/png/);
    expect(doc.slotImages[1]).toBe('/images/b.jpg');
  });

  it('selects the social card caption on social templates', () => {
    const doc = buildInitialDocument({ defaultCaptions: [{ id: 'tw', isTweetCard: true, text: 'hi' }] });
    expect(doc.activeLayerId).toBe('tw');
  });

  it('stacks image layers, then stickers, then captions', () => {
    const doc = buildInitialDocument({
      imageLayers: [{ url: 'a' }],
      stickers: [{ emoji: 'x' }],
      captions: [{ text: 'c' }],
    });
    expect(doc.imageLayers[0].zIndex).toBe(0);
    expect(doc.stickers[0].zIndex).toBe(1);
    expect(doc.captions[0].zIndex).toBe(2);
  });
});

describe('createMemeEditorStore', () => {
  let store;

  beforeEach(() => {
    store = createMemeEditorStore(TEMPLATE);
  });

  afterEach(() => {
    store.getState().cancelPendingHistory();
    vi.useRealTimers();
  });

  it('setters accept a value or an updater', () => {
    store.getState().setCanvasFlipX(true);
    expect(store.getState().canvasFlipX).toBe(true);
    store.getState().setCanvasFlipX((v) => !v);
    expect(store.getState().canvasFlipX).toBe(false);
  });

  it('starts with nothing to undo or redo', () => {
    expect(canUndo(store)).toBe(false);
    expect(canRedo(store)).toBe(false);
  });

  it('does not record history for plain sets', () => {
    store.getState().setCaptions([]);
    expect(canUndo(store)).toBe(false);
  });

  it('undoes and redoes checkpoints', () => {
    addCaption(store, 'A');
    addCaption(store, 'B');
    expect(texts(store)).toEqual(['TOP TEXT', 'BOTTOM TEXT', 'A', 'B']);

    store.getState().undo();
    expect(texts(store)).toEqual(['TOP TEXT', 'BOTTOM TEXT', 'A']);
    store.getState().undo();
    expect(texts(store)).toEqual(['TOP TEXT', 'BOTTOM TEXT']);
    expect(canUndo(store)).toBe(false);

    store.getState().redo();
    store.getState().redo();
    expect(texts(store)).toEqual(['TOP TEXT', 'BOTTOM TEXT', 'A', 'B']);
    expect(canRedo(store)).toBe(false);
  });

  it('undo back to the start restores the exact initial captions', () => {
    const initial = store.getState().captions;
    addCaption(store, 'A');
    store.getState().undo();
    expect(store.getState().captions).toEqual(initial);
  });

  it('a new checkpoint clears redo', () => {
    addCaption(store, 'A');
    store.getState().undo();
    expect(canRedo(store)).toBe(true);
    addCaption(store, 'B');
    expect(canRedo(store)).toBe(false);
    expect(texts(store)).toEqual(['TOP TEXT', 'BOTTOM TEXT', 'B']);
  });

  it('restores every history field but leaves selection alone', () => {
    store.getState().setActiveLayerId('cap-A');
    store.getState().setCanvasFlipX(true);
    store.getState().setDrawings([{ points: [0, 0, 1, 1] }]);
    store.getState().setCanvasHeader((h) => ({ ...h, enabled: true }));
    store.getState().setActiveTemplate((t) => ({ ...t, imageUrl: '/swapped.jpg', originalUrl: '/images/a.jpg' }));
    store.getState().pushHistory();

    store.getState().undo();
    const s = store.getState();
    expect(s.canvasFlipX).toBe(false);
    expect(s.drawings).toEqual([]);
    expect(s.canvasHeader.enabled).toBe(false);
    expect(s.activeTemplate.imageUrl).toBe('/images/a.jpg');
    expect(s.activeTemplate.originalUrl).toBeUndefined();
    expect(s.activeLayerId).toBe('cap-A');
  });

  it('snapshots are copies, so later in-place edits do not leak into history', () => {
    addCaption(store, 'A');
    addCaption(store, 'B');
    store.getState().captions[2].text = 'MUTATED';
    store.getState().undo();
    expect(texts(store)).toEqual(['TOP TEXT', 'BOTTOM TEXT', 'A']);
  });

  it('keeps at most HISTORY_LIMIT undo steps', () => {
    for (let i = 0; i < HISTORY_LIMIT + 5; i++) addCaption(store, `C${i}`);
    expect(store.temporal.getState().pastStates).toHaveLength(HISTORY_LIMIT);
  });

  it('debounced checkpoints group rapid edits into one step', () => {
    vi.useFakeTimers();
    for (const t of ['H', 'HE', 'HEY']) {
      store.getState().setCaptions((caps) => caps.map((c, i) => (i === 0 ? { ...c, text: t } : c)));
      store.getState().pushHistoryDebounced();
      vi.advanceTimersByTime(HISTORY_DEBOUNCE_MS / 2);
    }
    expect(canUndo(store)).toBe(false);
    vi.advanceTimersByTime(HISTORY_DEBOUNCE_MS);
    expect(store.temporal.getState().pastStates).toHaveLength(1);

    store.getState().undo();
    expect(texts(store)[0]).toBe('TOP TEXT');
  });

  it('undo cancels a pending debounced checkpoint so redo survives', () => {
    vi.useFakeTimers();
    addCaption(store, 'A');
    store.getState().setCaptions((caps) => caps.map((c, i) => (i === 0 ? { ...c, text: 'typing' } : c)));
    store.getState().pushHistoryDebounced();
    store.getState().undo();
    vi.advanceTimersByTime(HISTORY_DEBOUNCE_MS * 2);
    expect(canRedo(store)).toBe(true);
  });

  it('nudgeLayer moves the matching caption, sticker or image layer', () => {
    vi.useFakeTimers();
    store.getState().setStickers([{ id: 'stk', x: 0.2, y: 0.2 }]);
    const top = store.getState().captions[0];
    store.getState().nudgeLayer(top.id, 0.01, -0.02);
    store.getState().nudgeLayer('stk', 0.1, 0);
    store.getState().nudgeLayer('missing', 1, 1);
    expect(store.getState().captions[0]).toMatchObject({ x: top.x + 0.01, y: top.y - 0.02 });
    expect(store.getState().stickers[0].x).toBeCloseTo(0.3);
    vi.advanceTimersByTime(HISTORY_DEBOUNCE_MS);
    expect(store.temporal.getState().pastStates).toHaveLength(1);
  });

  it('separate stores do not share state', () => {
    const other = createMemeEditorStore(TEMPLATE);
    addCaption(store, 'A');
    expect(other.getState().captions).toHaveLength(2);
    expect(other.temporal.getState().pastStates).toHaveLength(0);
  });
});
