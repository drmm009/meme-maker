export interface Rect { left: number; top: number; width: number; height: number }

const GAP = 12;
export const BUBBLE_W = 300;

// Where the bubble sits: under the target when it is in the top half of the screen, else over it,
// kept on screen.
export function placeBubble(target: Rect, viewport: { width: number; height: number }) {
  const below = target.top + target.height / 2 < viewport.height / 2;
  const width = Math.min(BUBBLE_W, viewport.width - 24);
  const left = Math.max(12, Math.min(viewport.width - width - 12, target.left + target.width / 2 - width / 2));
  return below
    ? { left, width, top: target.top + target.height + GAP, bottom: undefined }
    : { left, width, top: undefined, bottom: viewport.height - target.top + GAP };
}
