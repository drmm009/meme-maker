import { createContext, useContext } from 'react';
import { createStore, useStore } from 'zustand';
import { temporal } from 'zundo';
import { isSocialCardCaption } from '../memeEditorUtils';

// Document state for one MemeEditor session: what the meme *is*.
// UI state (open menus, modals, tabs) stays in components.
//
// Undo/redo keeps the editor's explicit checkpoints: zundo's automatic
// per-set tracking is paused, and pushHistory() records a step. zundo holds
// the past/future stacks and applies undo/redo.

export const HISTORY_LIMIT = 30;
export const HISTORY_DEBOUNCE_MS = 800;

// Fields restored by undo/redo. Everything else in the store is left alone.
export const HISTORY_FIELDS = [
  'captions',
  'stickers',
  'imageLayers',
  'drawings',
  'canvasHeader',
  'canvasFooter',
  'demotivational',
  'canvasFlipX',
  'activeTemplate',
  'templateFaceMorph',
];

const WHITE_PIXEL_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=';

export const DEFAULT_IMAGE_FILTERS = {
  preset: 'original',
  brightness: 100,
  contrast: 100,
  saturation: 100,
  grayscale: 0,
  sepia: 0,
  invert: 0,
  hueRotate: 0,
  blur: 0,
  filterString: 'none',
  filterScope: 'all'
};

export const cloneSnapshot = (v) => {
  if (v === undefined) return v;
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(v);
    } catch {
      // fall through to JSON
    }
  }
  return JSON.parse(JSON.stringify(v));
};

const pickHistoryFields = (state) => Object.fromEntries(HISTORY_FIELDS.map((key) => [key, state[key]]));

function buildInitialCaptions(template) {
  const baseZ = (template?.imageLayers || []).length + (template?.defaultStickers || template?.stickers || []).length;
  let initialCaps = [];
  const rawCaps = template?.defaultCaptions || template?.captions;

  if (rawCaps) {
    initialCaps = rawCaps.map((c, idx) => ({
      fontSize: 50, color: '#ffffff', stroke: '#000000', align: 'center', fontFamily: 'Impact, sans-serif',
      rotation: 0,
      ...c, id: c.id || `cap-${idx}-${Date.now()}`,
      zIndex: baseZ + idx
    }));
  } else if (template?.isNativeLayout && template?.layoutDef) {
    const layoutDef = template.layoutDef;
    const totalSlots = layoutDef.slots;
    const isVert = layoutDef.id === '2-vert' || layoutDef.id === '3-stacked';
    const isHoriz = layoutDef.id === '2-horiz' || layoutDef.id === '3-horiz';
    const isGrid = layoutDef.id === '4-grid';
    const isHybrid = layoutDef.id === '3-hybrid';

    (template.slotImages || []).forEach((img, idx) => {
      if (!img || img === 'TEXT_PANEL') {
        let cx = 0.5, cy = 0.5;
        if (isVert) {
          cy = (idx + 0.5) / totalSlots;
        } else if (isHoriz) {
          cx = (idx + 0.5) / totalSlots;
        } else if (isGrid) {
          cx = ((idx % 2) + 0.5) / 2;
          cy = (Math.floor(idx / 2) + 0.5) / 2;
        } else if (isHybrid) {
          if (idx === 0) {
            cx = 0.5; cy = 0.25;
          } else {
            cx = ((idx - 1) + 0.5) / 2;
            cy = 0.75;
          }
        }
        initialCaps.push({
          text: 'ADD TEXT', x: cx, y: cy, fontSize: 45, color: '#000000', stroke: 'transparent', align: 'center', fontFamily: 'Impact, sans-serif',
          rotation: 0, width: undefined, id: `cap-slot-${idx}-${Date.now()}`,
          zIndex: baseZ + initialCaps.length
        });
      }
    });
  } else {
    initialCaps = [
      { text: 'TOP TEXT', x: 0.5, y: 0.15, fontSize: 50, color: '#ffffff', stroke: '#000000', align: 'center', fontFamily: 'Impact, sans-serif',
        rotation: 0, id: `cap-top-${Date.now()}`, zIndex: baseZ },
      { text: 'BOTTOM TEXT', x: 0.5, y: 0.85, fontSize: 50, color: '#ffffff', stroke: '#000000', align: 'center', fontFamily: 'Impact, sans-serif',
        rotation: 0, id: `cap-bot-${Date.now()}`, zIndex: baseZ + 1 }
    ];
  }
  return initialCaps;
}

function buildInitialActiveLayerId(template) {
  const socialCap = template?.defaultCaptions?.find((c) => isSocialCardCaption(c));
  if (socialCap) {
    return socialCap.id;
  }
  if (template?.defaultCaptions?.length === 1 && isSocialCardCaption(template.defaultCaptions[0])) {
    return template.defaultCaptions[0].id || 'social-card-1';
  }
  return null;
}

export function buildInitialDocument(template) {
  const imageLayers = (template?.imageLayers || []).map((img, idx) => ({
    ...img,
    id: img.id || `img-${idx}-${Date.now()}`,
    zIndex: idx
  }));

  const stickerBaseZ = (template?.imageLayers || []).length;
  const stickers = (template?.defaultStickers || template?.stickers || []).map((s, idx) => ({
    ...s,
    id: s.id || `stk-${idx}-${Date.now()}`,
    zIndex: stickerBaseZ + idx
  }));

  return {
    imageLayers,
    stickers,
    captions: buildInitialCaptions(template),
    drawings: [],
    activeLayerId: buildInitialActiveLayerId(template),
    slotImages: (template?.slotImages || []).map((img) => (!img || img === 'TEXT_PANEL') ? WHITE_PIXEL_URL : img),
    slotTransforms: template?.slotTransforms || [],
    activeTemplate: template,
    aspectRatio: template?.aspectRatio || 'original',
    canvasBgColor: template?.canvasBgColor || '#ffffff',
    canvasFlipX: template?.canvasFlipX || false,
    canvasHeader: template?.canvasHeader || {
      enabled: false,
      bgColor: template?.canvasBgColor || '#ffffff',
      height: 140
    },
    canvasFooter: template?.canvasFooter || {
      enabled: false,
      bgColor: template?.canvasBgColor || '#ffffff',
      height: 140
    },
    demotivational: template?.demotivational || {
      enabled: false,
      title: 'PROCRASTINATION',
      subtitle: 'Hard work pays off in the future, laziness pays off now.'
    },
    templateFaceMorph: null,
    imageFilters: { ...DEFAULT_IMAGE_FILTERS },
  };
}

// useState-style setter: accepts a value or an updater function.
const fieldSetter = (set, key) => (valueOrUpdater) =>
  set((state) => ({
    [key]: typeof valueOrUpdater === 'function' ? valueOrUpdater(state[key]) : valueOrUpdater
  }));

// `initialDocument` (a restored draft) replaces the template's starting document.
export function createMemeEditorStore(template, initialDocument = null) {
  let committed = null;
  let debounceTimer = null;

  const cancelPendingHistory = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = null;
  };

  const store = createStore(
    temporal(
      (set, get) => {
        const syncCommitted = () => {
          committed = cloneSnapshot(pickHistoryFields(get()));
        };

        return {
          ...buildInitialDocument(template),
          ...initialDocument,

          setCaptions: fieldSetter(set, 'captions'),
          setStickers: fieldSetter(set, 'stickers'),
          setImageLayers: fieldSetter(set, 'imageLayers'),
          setDrawings: fieldSetter(set, 'drawings'),
          setActiveLayerId: fieldSetter(set, 'activeLayerId'),
          setSlotImages: fieldSetter(set, 'slotImages'),
          setSlotTransforms: fieldSetter(set, 'slotTransforms'),
          setActiveTemplate: fieldSetter(set, 'activeTemplate'),
          setAspectRatio: fieldSetter(set, 'aspectRatio'),
          setCanvasBgColor: fieldSetter(set, 'canvasBgColor'),
          setCanvasFlipX: fieldSetter(set, 'canvasFlipX'),
          setCanvasHeader: fieldSetter(set, 'canvasHeader'),
          setCanvasFooter: fieldSetter(set, 'canvasFooter'),
          setDemotivational: fieldSetter(set, 'demotivational'),
          setTemplateFaceMorph: fieldSetter(set, 'templateFaceMorph'),
          setImageFilters: fieldSetter(set, 'imageFilters'),

          // Merge props into one caption / sticker / image layer (canvas drags, resizes, rotations).
          // key: 'captions' | 'stickers' | 'imageLayers'
          patchLayer: (key, id, patch) => {
            set((state) => ({ [key]: state[key].map((layer) => (layer.id === id ? { ...layer, ...patch } : layer)) }));
            get().pushHistoryDebounced();
          },

          // Put several layers (any kind) at { id, x, y } at once: a group being dragged, layers lined up.
          // `history`: 'now' records an undo step straight away, 'later' once edits stop.
          placeLayers: (positions, history = 'later') => {
            const at = new Map(positions.map((p) => [p.id, p]));
            const place = (list) => list.map((l) => (at.has(l.id) ? { ...l, x: at.get(l.id).x, y: at.get(l.id).y } : l));
            set((state) => ({ captions: place(state.captions), stickers: place(state.stickers), imageLayers: place(state.imageLayers || []) }));
            if (history === 'now') get().pushHistory();
            else get().pushHistoryDebounced();
          },

          // Give layers (any kind) the same props, e.g. a groupId, as one undo step.
          patchLayers: (ids, patch) => {
            const set_ = new Set(ids);
            const apply = (list) => list.map((l) => (set_.has(l.id) ? { ...l, ...patch } : l));
            set((state) => ({ captions: apply(state.captions), stickers: apply(state.stickers), imageLayers: apply(state.imageLayers || []) }));
            get().pushHistory();
          },

          // Inline text edit on the canvas: a string, or an object of caption props.
          updateCaptionText: (id, text) => {
            set((state) => ({
              captions: state.captions.map((c) => {
                if (c.id !== id) return c;
                if (typeof text === 'object') return { ...c, ...text };
                return c.isBreakingNews ? { ...c, text, newsHeadline: text } : { ...c, text };
              }),
            }));
            get().pushHistoryDebounced();
          },

          // Move a caption, sticker or image layer by (dx, dy), e.g. from arrow keys.
          nudgeLayer: (id, dx, dy) => {
            for (const key of ['captions', 'stickers', 'imageLayers']) {
              const layers = get()[key];
              if (layers.some((layer) => layer.id === id)) {
                set({ [key]: layers.map((layer) => (layer.id === id ? { ...layer, x: layer.x + dx, y: layer.y + dy } : layer)) });
                get().pushHistoryDebounced();
                return;
              }
            }
          },

          // Record the current document as an undo step.
          pushHistory: () => {
            cancelPendingHistory();
            const { pastStates } = store.temporal.getState();
            store.temporal.setState({
              pastStates: [...pastStates, committed].slice(-HISTORY_LIMIT),
              futureStates: []
            });
            syncCommitted();
          },

          // Same, once edits stop for a moment (used while typing).
          pushHistoryDebounced: () => {
            cancelPendingHistory();
            debounceTimer = setTimeout(() => get().pushHistory(), HISTORY_DEBOUNCE_MS);
          },

          undo: () => {
            cancelPendingHistory();
            store.temporal.getState().undo();
            syncCommitted();
          },

          redo: () => {
            cancelPendingHistory();
            store.temporal.getState().redo();
            syncCommitted();
          },

          cancelPendingHistory,
        };
      },
      { partialize: pickHistoryFields }
    )
  );

  store.temporal.getState().pause();
  committed = cloneSnapshot(pickHistoryFields(store.getState()));
  return store;
}

export const MemeEditorStoreContext = createContext(null);

function useStoreFromContext() {
  const store = useContext(MemeEditorStoreContext);
  if (!store) throw new Error('useMemeEditorStore must be used inside MemeEditorStoreContext');
  return store;
}

// The store itself, for reading fresh state inside async handlers (store.getState()).
export function useMemeEditorStoreApi() {
  return useStoreFromContext();
}

export function useMemeEditorStore(selector) {
  return useStore(useStoreFromContext(), selector);
}

export function useMemeEditorHistory(selector) {
  return useStore(useStoreFromContext().temporal, selector);
}
