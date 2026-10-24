import { create } from 'zustand';
import { temporal } from 'zundo';
import { moveLayer as moveLayerInItems } from '../utils/layerOrder';

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// An "Item" represents a single piece of media on the timeline (Video, Image, Text)
// A "Track" is a horizontal row on the timeline that holds Items.

const MIN_SPLIT_MS = 100;
export const FREEZE_MS = 1500;

// Where a freeze frame goes for a playhead inside a clip: there, or the clip's start or end when
// the playhead is too close to an edge to split.
export const freezeCutMs = (item, atMs) => {
  if (atMs <= item.startMs + MIN_SPLIT_MS) return item.startMs;
  if (atMs >= item.endMs - MIN_SPLIT_MS) return item.endMs;
  return atMs;
};

// The clip as it was before reverse/boomerang (its own fields when it has no effect).
export const clipEffectBase = (item) => item.original || {
  url: item.url, trimStartMs: item.trimStartMs || 0, endMs: item.endMs,
  sourceDurationMs: item.sourceDurationMs, thumbnailUrl: item.thumbnailUrl
};

// Time in the source footage shown at timeline time atMs.
export const sourceTimeMs = (item, atMs) => (item.trimStartMs || 0) + (atMs - item.startMs) * (item.playbackRate || 1);
const newItemId = () => `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

const calculateDuration = (items) => {
  if (!items || items.length === 0) return 7000;
  const validEnds = items.map(i => i.endMs).filter(t => typeof t === 'number' && !isNaN(t) && t > 0);
  if (validEnds.length === 0) return 7000;
  const maxEnd = Math.max(...validEnds);
  const rawDuration = Math.max(7000, maxEnd + 3000);
  return Math.min(100000, rawDuration); // Maximum 100s
};

export const useEditorStore = create(temporal((set, get) => ({
  playhead: 0, // Current time in milliseconds
  isPlaying: false,
  isExporting: false,
  exportProgress: 0,
  duration: 7000, // Total project duration (7 seconds default)
  
  canvasAspectRatio: 4/3, // Default to 4:3 (Classic)
  backgroundColor: '#ffffff', // Canvas colour behind everything (shows around letterboxed media)
  busy: null, // Label of a long-running clip job (e.g. 'Reversing clip…'), or null
  canvasDimensions: { width: 800, height: 600 }, // Actual pixel dimensions on screen
  gridOverlayUrl: null, // Transparent layout lines from Step 2
  
  items: [], // { id, type, startMs, endMs, source, x, y, scale, rotation }
  
  activeItemId: null,
  draggingTime: null, // Time to preview while dragging
  layoutSlots: [], // Geometric data for grid panels [{x,y,width,height}]
  layoutId: null, // Stores the active layout type (e.g. '2-vert')

  // Actions
  setLayoutId: (id) => set({ layoutId: id }),
  setLayoutSlots: (slots) => set({ layoutSlots: slots || [] }),
  setDraggingTime: (time) => set({ draggingTime: time }),
  setIsExporting: (exporting) => set({ isExporting: exporting }),
  setExportProgress: (progress) => set({ exportProgress: progress }),
  setCanvasAspectRatio: (ratio) => set({ canvasAspectRatio: ratio }),
  setBackgroundColor: (color) => set({ backgroundColor: color }),
  setBusy: (label) => set({ busy: label }),
  setCanvasDimensions: (dim) => set({ canvasDimensions: dim }),
  setPlayhead: (time) => set({ playhead: Math.max(0, Math.min(time, get().duration)) }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setDuration: (duration) => set({ duration: Math.min(100000, duration) }),
  
  setActiveItem: (id) => set({ activeItemId: id }),
  setGridOverlayUrl: (url) => set({ gridOverlayUrl: url }),
  
  addItem: (item) => set((state) => {
    // Auto-assign empty slot if applicable
    let slotIndex = item.slotIndex;
    if (slotIndex === undefined && (item.type === 'image' || item.type === 'video') && state.layoutSlots.length > 0) {
      const usedSlots = new Set(state.items.filter(i => i.slotIndex !== undefined).map(i => i.slotIndex));
      for (let i = 0; i < state.layoutSlots.length; i++) {
        if (!usedSlots.has(i)) {
          slotIndex = i;
          break;
        }
      }
    }

    // Videos join the end of the main sequence (in a multi-panel layout they play side by side
    // from the playhead instead); sounds go at the playhead. An explicit startMs wins.
    let startMs = state.playhead;
    if (Number.isFinite(item.startMs) && (item.type === 'video' || item.type === 'audio')) {
      startMs = item.startMs;
    } else if (item.type === 'video' && slotIndex === undefined) {
      const sequenceEnds = state.items.filter(i => i.type === 'video' && i.slotIndex === undefined).map(i => i.endMs).filter(t => Number.isFinite(t));
      startMs = sequenceEnds.length > 0 ? Math.max(...sequenceEnds) : 0;
    }
    let endMs = startMs + (item.durationMs || 3000);

    if (item.type !== 'video' && item.type !== 'audio') {
      const videos = state.items.filter(i => i.type === 'video');
      const validVideoEnds = videos.map(v => v.endMs).filter(t => typeof t === 'number' && !isNaN(t) && t > 0);
      const maxVideoEnd = validVideoEnds.length > 0 ? Math.max(...validVideoEnds) : 0;
      startMs = 0; // Cover whole timeline by default
      if (maxVideoEnd > 0) {
        endMs = maxVideoEnd;
      } else {
        const validEnds = state.items.map(i => i.endMs).filter(t => typeof t === 'number' && !isNaN(t) && t > 0);
        const maxEnd = validEnds.length > 0 ? Math.max(...validEnds) : 7000;
        endMs = maxEnd > 0 ? maxEnd : 7000;
      }
    }
    
    endMs = Math.min(100000, Number.isFinite(endMs) ? endMs : 7000);

    const visualItems = state.items.filter(i => i.type === 'text' || i.type === 'sticker' || i.type === 'image');
    const offset = (visualItems.length % 6) * 35;
    const defaultX = item.x !== undefined ? item.x : (50 + offset);
    const defaultY = item.y !== undefined ? item.y : (50 + offset);

    const newItems = [...state.items, { 
      ...item, 
      id: newItemId(),
      startMs: startMs,
      endMs: endMs,
      x: defaultX, y: defaultY, scale: 1, rotation: 0,
      slotIndex,
      playbackRate: 1,
      muted: false,
      thumbnailUrl: item.thumbnailUrl || null,
      // Length of the source media, so trims can stop at its real start and end.
      sourceDurationMs: item.sourceDurationMs ?? ((item.type === 'video' || item.type === 'audio') ? item.durationMs : undefined)
    }];

    return {
      duration: calculateDuration(newItems),
      items: newItems
    };
  }),

  removeItem: (id) => set((state) => {
    const newItems = state.items.filter(i => i.id !== id);
    return {
      items: newItems,
      activeItemId: state.activeItemId === id ? null : state.activeItemId,
      duration: calculateDuration(newItems)
    };
  }),
  
  updateItem: (id, updates) => set((state) => {
    const newItems = state.items.map(item => item.id === id ? { ...item, ...updates } : item);
    return {
      items: newItems,
      duration: calculateDuration(newItems)
    };
  }),

  // Cut a clip in two at atMs; the right half continues the same footage and becomes selected.
  splitItem: (id, atMs) => set((state) => {
    const index = state.items.findIndex(i => i.id === id);
    const item = state.items[index];
    if (!item || atMs <= item.startMs + MIN_SPLIT_MS || atMs >= item.endMs - MIN_SPLIT_MS) return {};
    const isMedia = item.type === 'video' || item.type === 'audio';
    const right = {
      ...item,
      id: newItemId(),
      startMs: atMs,
      ...(isMedia ? { trimStartMs: (item.trimStartMs || 0) + (atMs - item.startMs) * (item.playbackRate || 1), fadeInMs: 0 } : {})
    };
    const left = { ...item, endMs: atMs, ...(isMedia ? { fadeOutMs: 0 } : {}) };
    const items = [...state.items];
    items.splice(index, 1, left, right);
    return { items, activeItemId: right.id };
  }),

  // Freeze frame: hold a still of the clip at atMs for freezeMs. The clip splits at the cut (near an
  // edge the still goes before or after it instead), clips after the cut move later, and clips
  // spanning the cut (a caption over the whole video, say) stretch to cover the hold.
  insertFreeze: (id, atMs, imageUrl, freezeMs = FREEZE_MS) => set((state) => {
    const video = state.items.find(i => i.id === id);
    if (!video || atMs < video.startMs || atMs > video.endMs) return {};
    const cut = freezeCutMs(video, atMs);
    const rate = video.playbackRate || 1;
    const still = {
      id: newItemId(), type: 'image', url: imageUrl, name: 'Freeze frame', isFreeze: true,
      startMs: cut, endMs: cut + freezeMs,
      x: video.x, y: video.y, width: video.width, height: video.height,
      scaleX: video.scaleX, scaleY: video.scaleY, rotation: video.rotation || 0,
      isPositioned: true, slotIndex: video.slotIndex, scale: 1, playbackRate: 1, muted: false
    };
    const shift = (item) => ({ ...item, startMs: item.startMs + freezeMs, endMs: item.endMs + freezeMs });
    const items = [];
    for (const item of state.items) {
      if (item.id === id) {
        if (cut === item.startMs) items.push(still, shift(item));
        else if (cut === item.endMs) items.push(item, still);
        else {
          items.push(
            { ...item, endMs: cut, fadeOutMs: 0 },
            still,
            { ...shift(item), id: newItemId(), startMs: cut + freezeMs, trimStartMs: (item.trimStartMs || 0) + (cut - item.startMs) * rate, fadeInMs: 0 }
          );
        }
      } else if (item.startMs >= cut) items.push(shift(item));
      else if (item.endMs > cut) items.push({ ...item, endMs: item.endMs + freezeMs });
      else items.push(item);
    }
    return { items, activeItemId: still.id, duration: calculateDuration(items) };
  }),

  // Reverse or boomerang a video clip with a pre-rendered file ({ url, durationMs } of the visible
  // section), keeping the original so the effect can be switched off or swapped. effect null restores it.
  applyClipEffect: (id, effect, rendered) => set((state) => {
    const item = state.items.find(i => i.id === id);
    if (!item) return {};
    const base = clipEffectBase(item);
    const patch = !effect
      ? { ...base, effect: null, original: null }
      : {
          url: rendered.url,
          effect,
          original: base,
          punches: [], // they were placed on the original footage
          trimStartMs: 0,
          sourceDurationMs: rendered.durationMs,
          // The render can be shorter than asked (long clips are capped), so size the clip from it.
          endMs: item.startMs + rendered.durationMs / (item.playbackRate || 1)
        };
    const items = state.items.map(i => (i.id === id ? { ...i, ...patch } : i));
    return { items, duration: calculateDuration(items) };
  }),

  // Bring forward (dir 1) or send back (dir -1) past the nearest item on screen with it.
  moveLayer: (id, dir) => set((state) => {
    const items = moveLayerInItems(state.items, id, dir);
    return items === state.items ? {} : { items };
  }),

  // Copy a clip with all its settings: media goes right after the original, overlays are nudged.
  duplicateItem: (id) => set((state) => {
    const item = state.items.find(i => i.id === id);
    if (!item) return {};
    const isMedia = item.type === 'video' || item.type === 'audio';
    const len = item.endMs - item.startMs;
    const copy = isMedia
      ? { ...item, id: newItemId(), startMs: item.endMs, endMs: Math.min(100000, item.endMs + len) }
      : { ...item, id: newItemId(), x: (item.x || 0) + 20, y: (item.y || 0) + 20 };
    const items = [...state.items, copy];
    return { items, activeItemId: copy.id, duration: calculateDuration(items) };
  }),

  deleteItem: (id) => set((state) => {
    const newItems = state.items.filter(item => item.id !== id);
    return {
      items: newItems,
      activeItemId: state.activeItemId === id ? null : state.activeItemId,
      duration: calculateDuration(newItems)
    };
  }),

  clearItems: () => set({
    items: [],
    activeItemId: null,
    playhead: 0,
    duration: 7000,
    isPlaying: false
  }),
}), {
  partialize: (state) => ({ 
    items: state.items, 
    duration: state.duration,
    layoutId: state.layoutId,
    layoutSlots: state.layoutSlots,
    canvasAspectRatio: state.canvasAspectRatio,
    backgroundColor: state.backgroundColor,
    gridOverlayUrl: state.gridOverlayUrl
  }),
  limit: 20,
  handleSet: (handleSet) => debounce(handleSet, 1000),
}));
