import { create } from 'zustand';

// An "Item" represents a single piece of media on the timeline (Video, Image, Text)
// A "Track" is a horizontal row on the timeline that holds Items.

const calculateDuration = (items) => {
  if (items.length === 0) return 7000;
  const maxEnd = Math.max(...items.map(i => i.endMs));
  const rawDuration = Math.max(7000, maxEnd + 3000);
  return Math.min(100000, rawDuration); // Maximum 100s
};

export const useEditorStore = create((set, get) => ({
  playhead: 0, // Current time in milliseconds
  isPlaying: false,
  isExporting: false,
  exportProgress: 0,
  duration: 7000, // Total project duration (7 seconds default)
  
  canvasAspectRatio: 16/9, // Default to 16:9 widescreen
  canvasDimensions: { width: 800, height: 450 }, // Actual pixel dimensions on screen
  
  items: [], // { id, type, startMs, endMs, source, x, y, scale, rotation }
  
  activeItemId: null,

  // Actions
  setIsExporting: (exporting) => set({ isExporting: exporting }),
  setExportProgress: (progress) => set({ exportProgress: progress }),
  setCanvasAspectRatio: (ratio) => set({ canvasAspectRatio: ratio }),
  setCanvasDimensions: (dim) => set({ canvasDimensions: dim }),
  setPlayhead: (time) => set({ playhead: Math.max(0, Math.min(time, get().duration)) }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setDuration: (duration) => set({ duration: Math.min(100000, duration) }),
  
  setActiveItem: (id) => set({ activeItemId: id }),
  
  addItem: (item) => set((state) => {
    const duration = item.durationMs || 3000;
    const endMs = Math.min(100000, state.playhead + duration);
    
    const newItems = [...state.items, { 
      ...item, 
      id: `item-${Date.now()}`,
      startMs: state.playhead,
      endMs: endMs,
      x: 50, y: 50, scale: 1, rotation: 0,
      playbackRate: 1,
      muted: false,
      thumbnailUrl: item.thumbnailUrl || null
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

  deleteItem: (id) => set((state) => {
    const newItems = state.items.filter(item => item.id !== id);
    return {
      items: newItems,
      activeItemId: state.activeItemId === id ? null : state.activeItemId,
      duration: calculateDuration(newItems)
    };
  }),
}));
