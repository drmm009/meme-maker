import { useMemeEditorStoreApi } from '../store/useMemeEditorStore';
import { alignMoves, distributeMoves } from '../panels/arrange';

// Lining up, grouping and deleting several layers at once (the Layers sheet's Select mode). Boxes
// come from the canvas (canvas.layerBoxes, canvas.imageArea, set while it paints).
export function useArrangeActions({ canvasRef }) {
  const store = useMemeEditorStoreApi();
  const allLayers = () => {
    const { captions, stickers, imageLayers } = store.getState();
    return [...captions, ...stickers, ...(imageLayers || [])];
  };

  // The chosen layers that can move: not locked, and not a caption sitting in the header/footer band.
  const movable = (ids) => {
    const boxes = canvasRef.current?.layerBoxes || {};
    const byId = new Map(allLayers().map((l) => [l.id, l]));
    return ids
      .map((id) => ({ id, box: boxes[id], layer: byId.get(id) }))
      .filter(({ box, layer }) => box && layer && !layer.locked && !((layer.isHeaderCaption || layer.isFooterCaption) && !layer.hasCustomPos));
  };

  // Canvas-pixel moves to layer positions (x is a fraction of the width, y of the image area).
  const apply = (items, moves) => {
    const canvas = canvasRef.current;
    if (!canvas || !moves.length) return;
    const areaH = canvas.imageArea?.h || canvas.height;
    const byId = new Map(items.map((i) => [i.id, i.layer]));
    store.getState().placeLayers(moves.map((m) => {
      const l = byId.get(m.id);
      return { id: m.id, x: l.x + m.dx / canvas.width, y: l.y + m.dy / areaH };
    }), 'now');
  };

  const handleAlignLayers = (ids, mode) => {
    const items = movable(ids);
    apply(items, alignMoves(items, mode, canvasRef.current?.imageArea));
  };

  const handleDistributeLayers = (ids, mode) => {
    const items = movable(ids);
    apply(items, distributeMoves(items, mode));
  };

  const handleGroupLayers = (ids) => store.getState().patchLayers(ids, { groupId: `grp-${Date.now()}` });
  const handleUngroupLayers = (ids) => store.getState().patchLayers(ids, { groupId: null });

  const handleDeleteLayers = (ids) => {
    const gone = new Set(ids);
    const s = store.getState();
    s.setCaptions(s.captions.filter((l) => !gone.has(l.id)));
    s.setStickers(s.stickers.filter((l) => !gone.has(l.id)));
    s.setImageLayers((s.imageLayers || []).filter((l) => !gone.has(l.id)));
    if (gone.has(s.activeLayerId)) s.setActiveLayerId(null);
    s.pushHistory();
  };

  return { handleAlignLayers, handleDistributeLayers, handleGroupLayers, handleUngroupLayers, handleDeleteLayers };
}
