// Lining layers up: align their edges or centres, spread them out evenly. Boxes are the layers'
// boxes on the canvas in canvas pixels ({ x, y } centre, w, h, as render/paintLayers reports them
// in canvas.layerBoxes); the result is how far to move each, in canvas pixels.

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ArrangeItem {
  id: string;
  box: Box;
}

export interface Move {
  id: string;
  dx: number;
  dy: number;
}

export type AlignMode = 'left' | 'hcenter' | 'right' | 'top' | 'vcenter' | 'bottom';
export type DistributeMode = 'horizontal' | 'vertical';

const left = (b: Box) => b.x - b.w / 2;
const right = (b: Box) => b.x + b.w / 2;
const top = (b: Box) => b.y - b.h / 2;
const bottom = (b: Box) => b.y + b.h / 2;

// Align to each other, or (one layer, or `frame` given) to the frame: the image area.
export function alignMoves(items: ArrangeItem[], mode: AlignMode, frame?: Box | null): Move[] {
  if (!items.length) return [];
  const ref: Box = frame && items.length === 1 ? frame : (() => {
    const l = Math.min(...items.map((i) => left(i.box)));
    const r = Math.max(...items.map((i) => right(i.box)));
    const t = Math.min(...items.map((i) => top(i.box)));
    const b = Math.max(...items.map((i) => bottom(i.box)));
    return { x: (l + r) / 2, y: (t + b) / 2, w: r - l, h: b - t };
  })();
  return items.map(({ id, box }) => {
    let dx = 0;
    let dy = 0;
    if (mode === 'left') dx = left(ref) - left(box);
    else if (mode === 'hcenter') dx = ref.x - box.x;
    else if (mode === 'right') dx = right(ref) - right(box);
    else if (mode === 'top') dy = top(ref) - top(box);
    else if (mode === 'vcenter') dy = ref.y - box.y;
    else dy = bottom(ref) - bottom(box);
    return { id, dx, dy };
  });
}

// Equal gaps between neighbours, the outermost two staying put (needs three or more).
export function distributeMoves(items: ArrangeItem[], mode: DistributeMode): Move[] {
  if (items.length < 3) return items.map(({ id }) => ({ id, dx: 0, dy: 0 }));
  const horizontal = mode === 'horizontal';
  const sorted = [...items].sort((a, b) => (horizontal ? a.box.x - b.box.x : a.box.y - b.box.y));
  const size = (b: Box) => (horizontal ? b.w : b.h);
  const start = horizontal ? left(sorted[0].box) : top(sorted[0].box);
  const end = horizontal ? right(sorted[sorted.length - 1].box) : bottom(sorted[sorted.length - 1].box);
  const gap = (end - start - sorted.reduce((sum, i) => sum + size(i.box), 0)) / (sorted.length - 1);
  let at = start;
  const moves = new Map<string, Move>();
  for (const { id, box } of sorted) {
    const centre = at + size(box) / 2;
    moves.set(id, horizontal ? { id, dx: centre - box.x, dy: 0 } : { id, dx: 0, dy: centre - box.y });
    at += size(box) + gap;
  }
  return items.map(({ id }) => moves.get(id) as Move);
}

// The other layers that move with `id`: its group, if it has one.
export function groupMates<T extends { id: string; groupId?: string | null }>(layers: T[], id: string): T[] {
  const groupId = layers.find((l) => l.id === id)?.groupId;
  return groupId ? layers.filter((l) => l.groupId === groupId && l.id !== id) : [];
}
