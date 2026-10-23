import { useMemeEditorStore } from '../store/useMemeEditorStore';

export function useDrawingActions() {
  const drawings = useMemeEditorStore((s) => s.drawings);
  const setDrawings = useMemeEditorStore((s) => s.setDrawings);
  const pushHistory = useMemeEditorStore((s) => s.pushHistory);

  const handleAddDrawing = (newDrawing) => {
    const nextDrawings = [...drawings, newDrawing];
    setDrawings(nextDrawings);
    pushHistory();
  };

  const handleClearDrawings = () => {
    setDrawings([]);
    pushHistory();
  };

  const handleUndoDrawing = () => {
    if (drawings.length === 0) return;
    const nextDrawings = drawings.slice(0, -1);
    setDrawings(nextDrawings);
    pushHistory();
  };

  return { handleAddDrawing, handleClearDrawings, handleUndoDrawing };
}
