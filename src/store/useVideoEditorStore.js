import { create } from 'zustand';
import { temporal } from 'zundo';

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
