// Where the clip being dragged on the preview is now (its centre, in stage units), or null when
// nothing is being dragged. Kept apart from the editor's store so a drag doesn't touch undo
// history; VideoStartArea reads it to put away the start card of the panel it's over.
import { create } from 'zustand';
import type Konva from 'konva';

export interface DragPoint { x: number; y: number }

export const usePanelDrag = create<{ point: DragPoint | null }>(() => ({ point: null }));

export const setDragPoint = (point: DragPoint | null): void => {
  const prev = usePanelDrag.getState().point;
  if (prev === point || (prev && point && prev.x === point.x && prev.y === point.y)) return;
  usePanelDrag.setState({ point });
};

// A Konva node's centre on its layer (rotation and scale included).
export const nodeCentre = (node: Konva.Node): DragPoint => {
  const r = node.getClientRect({ relativeTo: node.getLayer() ?? undefined, skipShadow: true });
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
};
