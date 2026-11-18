// A multi-panel layout's panels (the image editor's native layouts: a template's `layoutDef`), as
// rectangles in fractions (0..1) of the image area. One place for the drawing (paintBase), tapping
// a panel (findSlotAt), the panels' starting captions and their start cards (ImagePanelPrompts).

export interface PanelLayout {
  // '2-vert', '3-stacked', '2-horiz', '3-horiz', '4-grid', '3-hybrid', or 'custom-grid' with
  // `cols` and `rows`.
  id: string;
  slots: number;
  cols?: number;
  rows?: number;
}

export interface PanelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const GRIDS: Record<string, { cols: number; rows: number }> = {
  '2-vert': { cols: 1, rows: 2 },
  '3-stacked': { cols: 1, rows: 3 },
  '2-horiz': { cols: 2, rows: 1 },
  '3-horiz': { cols: 3, rows: 1 },
  '4-grid': { cols: 2, rows: 2 },
};

export function panelRects(layout: PanelLayout | null | undefined): PanelRect[] {
  if (!layout) return [];
  const n = Math.max(1, layout.slots || 1);
  // One wide panel on top, two below.
  if (layout.id === '3-hybrid') {
    return [
      { x: 0, y: 0, width: 1, height: 0.5 },
      { x: 0, y: 0.5, width: 0.5, height: 0.5 },
      { x: 0.5, y: 0.5, width: 0.5, height: 0.5 },
    ].slice(0, n);
  }
  const grid = layout.id === 'custom-grid'
    ? { cols: Math.max(1, layout.cols || 1), rows: Math.max(1, layout.rows || 1) }
    : GRIDS[layout.id];
  if (!grid) return Array.from({ length: n }, () => ({ x: 0, y: 0, width: 1, height: 1 }));
  return Array.from({ length: n }, (_, i) => ({
    x: (i % grid.cols) / grid.cols,
    y: Math.floor(i / grid.cols) / grid.rows,
    width: 1 / grid.cols,
    height: 1 / grid.rows,
  }));
}

// Whether a point (fractions of the image area) is in a panel.
export const inPanel = (r: PanelRect, x: number, y: number): boolean =>
  x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height;
