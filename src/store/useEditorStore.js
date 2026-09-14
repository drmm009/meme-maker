import { create } from 'zustand';

export const useEditorStore = create((set, get) => ({
  playhead: 0, // Current time in milliseconds
  isPlaying: false,
  duration: 7000, // Total project duration
  
  // Actions
  setPlayhead: (time) => set({ playhead: Math.max(0, Math.min(time, get().duration)) }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setDuration: (duration) => set({ duration: Math.max(1000, Math.min(100000, duration)) }),
}));
