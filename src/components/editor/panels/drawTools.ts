import { Brush, Highlighter, SunMedium, Shapes, EyeOff, Eraser } from 'lucide-react';
import type { StripItem } from '../../ui';

// The Draw tab's strip above the dock (ids are the canvas's draw tools). Shapes (and Censor, on the
// Canvas tab's strip) are dragged out on the canvas instead of painted freehand.
export const DRAW_TOOLS: StripItem[] = [
  { id: 'brush', label: 'Brush', title: 'Brush: solid stroke', Icon: Brush },
  { id: 'glow', label: 'Glow', title: 'Glow: neon stroke', Icon: SunMedium },
  { id: 'highlighter', label: 'Marker', title: 'Marker: translucent highlighter', Icon: Highlighter },
  { id: 'eraser', label: 'Eraser', title: 'Eraser: rub out drawing (not the picture)', Icon: Eraser },
  { id: 'shape', label: 'Shapes', title: 'Arrows, circles, boxes and lines', Icon: Shapes },
];

// Censor sits on the Canvas tab's strip, and draws while that tab is showing.
export const CENSOR_TOOL: StripItem = { id: 'censor', label: 'Censor', title: 'Blur, pixelate or black out part of the meme', Icon: EyeOff };

// The dock tab a draw tool belongs to.
export const drawTabOf = (tool: string | null): string => (tool === 'censor' ? 'canvas' : 'draw');

// Whether taps on the canvas draw: a draw tool is picked and its tab is showing.
export const isDrawingOn = (dockTab: string | null, tool: string | null): boolean => Boolean(tool) && dockTab === drawTabOf(tool);
