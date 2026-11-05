export type Aspect = 'original' | '1:1' | '4:5' | '9:16' | '16:9';

// The canvas shapes, for the pill bar above the canvas (label) and the top bar's size menu (name: where
// the shape fits, its ratio as sub, and an outline of the shape, w x h in px).
export const CANVAS_SIZES: { value: Aspect; label: string; name: string; sub: string; title: string; w: number; h: number }[] = [
  { value: 'original', label: 'Original', name: 'Original', sub: '', title: 'Original image', w: 26, h: 18 },
  { value: '1:1', label: '1:1', name: 'Facebook', sub: '1:1', title: 'Square', w: 22, h: 22 },
  { value: '4:5', label: '4:5', name: 'Instagram', sub: '4:5', title: 'Portrait', w: 20, h: 25 },
  { value: '9:16', label: '9:16', name: 'Reels & TikTok', sub: '9:16', title: 'Story', w: 16, h: 28 },
  { value: '16:9', label: '16:9', name: 'YouTube', sub: '16:9', title: 'Video', w: 30, h: 17 },
];
