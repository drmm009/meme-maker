// Guides for lining things up by eye (Canvas > Grid): the image area cut in thirds, plus dashed
// centre lines. Drawn on screen only, never in an export (render/paintOverlays).

export interface GuideLine {
  from: [number, number];
  to: [number, number];
  kind: 'third' | 'centre';
}

// The guides for an image area at (x, y), w x h, in canvas pixels.
export function guideLines(x: number, y: number, w: number, h: number): GuideLine[] {
  const lines: GuideLine[] = [];
  for (const f of [1 / 3, 2 / 3]) {
    lines.push({ from: [x + w * f, y], to: [x + w * f, y + h], kind: 'third' });
    lines.push({ from: [x, y + h * f], to: [x + w, y + h * f], kind: 'third' });
  }
  lines.push({ from: [x + w / 2, y], to: [x + w / 2, y + h], kind: 'centre' });
  lines.push({ from: [x, y + h / 2], to: [x + w, y + h / 2], kind: 'centre' });
  return lines;
}

// Light lines with a dark edge, so they show on any picture. `scale` is canvas pixels per screen
// pixel, keeping them thin on screen however big the canvas is.
export function paintGuideGrid(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, scale = 1): void {
  ctx.save();
  for (const line of guideLines(x, y, w, h)) {
    ctx.setLineDash(line.kind === 'centre' ? [8 * scale, 6 * scale] : []);
    for (const [colour, width] of [['rgba(0, 0, 0, 0.35)', 3], ['rgba(255, 255, 255, 0.75)', 1]] as const) {
      ctx.strokeStyle = colour;
      ctx.lineWidth = width * scale;
      ctx.beginPath();
      ctx.moveTo(line.from[0], line.from[1]);
      ctx.lineTo(line.to[0], line.to[1]);
      ctx.stroke();
    }
  }
  ctx.restore();
}
