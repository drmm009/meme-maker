import { Brush, Highlighter, SunMedium } from 'lucide-react';
import type { StripItem } from '../../ui';

// The Draw tab's strip above the dock (ids are the canvas's draw tools).
export const DRAW_TOOLS: StripItem[] = [
  { id: 'brush', label: 'Brush', title: 'Brush: solid stroke', Icon: Brush },
  { id: 'glow', label: 'Glow', title: 'Glow: neon stroke', Icon: SunMedium },
  { id: 'highlighter', label: 'Marker', title: 'Marker: translucent highlighter', Icon: Highlighter },
];
