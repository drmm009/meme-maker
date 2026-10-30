import { useRef } from 'react';
import { clientToCanvas } from './geometry';
import { usePointerListeners } from './usePointerListeners';
import { findSlotAt } from './layerBoxes';
import { hitActiveHandle, hitBandCaption, hitLayerAt } from './hitTest';
import { getHoverCursor } from './hoverCursor';
import { getDragCenter, getDragStart, getRotation, moveLayer, resizeCaption, resizeImageLayer, resizeSticker } from './dragMath';
import { paintStrokeDot, paintStrokeSegment, startStroke } from './freehand';
import { isTooSmall, paintDragDrawing, paintDragGuide, startDragDrawing } from '../draw/shapes';
import { useMemeEditorStore } from '../../editor/store/useMemeEditorStore';
import { useEditorUiStore } from '../../editor/store/useEditorUiStore';
import { isSocialCardCaption } from '../../editor/memeEditorUtils';

// A second tap within this many ms counts as a double tap.
const DOUBLE_TAP_MS = 350;

// Pointer input on the meme canvas: drawing, selecting, dragging, rotating and resizing layers,
// and panning or pinch-zooming the photos in a multi-panel layout. The maths lives in the
// modules imported above; this hook keeps the gesture state and calls the editor's handlers.
export function useCanvasInteraction({
  activeIsNativeLayout, activeLayoutDef, canvasH, canvasRef, canvasW,
  dragTarget, editableRef, focusTextarea, getCaptionCenterY, getImageLayerCenterY,
  getStickerCenterY, headerExtH, imageCacheRef, isDragging, isDrawingMode,
  isFooterEnabled, isHeaderEnabled, onAddDrawing, onDeleteLayer, onSelectLayer,
  onUpdateCaptionBounds, onUpdateImageLayerBounds, onUpdateSlotTransform,
  onUpdateStickerBounds, requestRedraw, setEditingCaptionId, snappingLines,
  totalCanvasH, wrapperRef
}) {
  const isDrawingActive = useRef(false);
  const currentStroke = useRef(null);
  // A shape or censor region being dragged out, with the canvas as it was before the drag.
  const dragDrawing = useRef(null);
  const dragRafRef = useRef(null);
  const dragStartCoords = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);
  const initialLayerPos = useRef({ x: 0.5, y: 0.5 });
  const initialPinchDist = useRef(null);
  const initialSlotScale = useRef(null);
  const lastDrawPoint = useRef(null);
  const lastTapRef = useRef({ id: null, time: 0 });
  const pendingDragRef = useRef(null);
  const drawTool = useEditorUiStore((s) => s.drawTool);
  const canvasBgColor = useMemeEditorStore((s) => s.canvasBgColor);
  const brushColor = useEditorUiStore((s) => s.brushColor);
  const brushSize = useEditorUiStore((s) => s.brushSize);
  const shapeKind = useEditorUiStore((s) => s.shapeKind);
  const shapeFill = useEditorUiStore((s) => s.shapeFill);
  const censorMode = useEditorUiStore((s) => s.censorMode);
  const censorStrength = useEditorUiStore((s) => s.censorStrength);
  const activeLayerId = useMemeEditorStore((s) => s.activeLayerId);
  const stickers = useMemeEditorStore((s) => s.stickers);
  const captions = useMemeEditorStore((s) => s.captions);
  const imageLayers = useMemeEditorStore((s) => s.imageLayers);
  const slotImages = useMemeEditorStore((s) => s.slotImages);
  const slotTransforms = useMemeEditorStore((s) => s.slotTransforms);

  const bands = { isHeaderEnabled, isFooterEnabled, headerExtH, canvasH };
  const getScene = (canvas) => ({
    canvas, ctx: canvas.getContext('2d'), captions, stickers, imageLayers,
    imageCache: imageCacheRef.current, getCaptionCenterY, getStickerCenterY, getImageLayerCenterY
  });

  // Coalesce drag updates to one store write per animation frame.
  const scheduleDragBatch = (fn) => {
    pendingDragRef.current = fn;
    if (!dragRafRef.current) {
      dragRafRef.current = requestAnimationFrame(() => {
        dragRafRef.current = null;
        if (pendingDragRef.current) {
          const u = pendingDragRef.current;
          pendingDragRef.current = null;
          u();
        }
      });
    }
  };

  const getCanvasCoords = (e) => clientToCanvas(e, canvasRef.current);

  // A tap on a caption's side handle twice in a row resets it to auto-fit width.
  const isSideHandleDoubleTap = (hit) => {
    if (hit.type !== 'resize_caption_l' && hit.type !== 'resize_caption_r') return false;
    const key = `${hit.id}-${hit.type}`;
    const now = Date.now();
    if (lastTapRef.current.id === key && (now - lastTapRef.current.time) < DOUBLE_TAP_MS) {
      lastTapRef.current = { id: null, time: 0 };
      return true;
    }
    lastTapRef.current = { id: key, time: now };
    return false;
  };

  const beginDrag = (hit, coords, canvas) => {
    isDragging.current = true;
    dragTarget.current = hit;
    dragStartCoords.current = coords;
    hasDragged.current = false;

    // Prevent browser selection / autoscroll during drag
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    }

    initialLayerPos.current = getDragStart(hit, coords, {
      canvas, canvasH, headerExtH, totalCanvasH, getCaptionCenterY, getStickerCenterY, getImageLayerCenterY
    });
  };

  // Empty space in a multi-panel layout grabs that panel's photo (drag to pan, two fingers to zoom).
  const beginSlotDrag = (e, coords) => {
    const idx = findSlotAt(coords, activeLayoutDef, { canvasW, canvasH, headerExtH });
    if (idx === -1) return;
    isDragging.current = true;
    dragTarget.current = { type: slotImages[idx] ? 'slot' : 'empty-slot', idx };
    dragStartCoords.current = coords;
    if (e.touches && e.touches.length === 2) {
      initialPinchDist.current = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      initialSlotScale.current = (slotTransforms[idx] || { scale: 1.5 }).scale || 1.0;
    }
  };

  const handlePointerDown = (e) => {
    if (e.cancelable && e.target !== editableRef.current) {
      e.preventDefault();
    }
    const coords = getCanvasCoords(e);
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDrawingMode && (drawTool === 'shape' || drawTool === 'censor')) {
      const snapshot = document.createElement('canvas');
      snapshot.width = canvas.width;
      snapshot.height = canvas.height;
      snapshot.getContext('2d')?.drawImage(canvas, 0, 0);
      dragDrawing.current = {
        drawing: startDragDrawing(drawTool, coords, { shape: shapeKind, color: brushColor, size: brushSize, fill: shapeFill, censor: censorMode, strength: censorStrength }),
        snapshot,
      };
      return;
    }

    if (isDrawingMode) {
      isDrawingActive.current = true;
      currentStroke.current = startStroke({ drawTool, canvasBgColor, brushColor, brushSize, point: coords });
      lastDrawPoint.current = { x: coords.x, y: coords.y };
      const ctx = canvas.getContext('2d');
      if (ctx) paintStrokeDot(ctx, currentStroke.current, coords);
      return;
    }

    // The selected layer's handles win, then the topmost layer, then a header/footer band.
    const scene = getScene(canvas);
    const handleHit = hitActiveHandle(scene, coords, activeLayerId);
    if (handleHit && isSideHandleDoubleTap(handleHit)) {
      onUpdateCaptionBounds(handleHit.id, { hasCustomWidth: false, width: 0.9 });
      return;
    }
    const hit = handleHit || hitLayerAt(scene, coords) || hitBandCaption(captions, coords, bands);

    if (!hit) {
      if (onSelectLayer) onSelectLayer(null);
      setEditingCaptionId(null);
      if (editableRef.current) editableRef.current.blur();
      if (activeIsNativeLayout && activeLayoutDef) beginSlotDrag(e, coords);
      return;
    }

    if (hit.type === 'delete_layer') {
      if (onDeleteLayer) onDeleteLayer();
      return;
    }

    // Double tap on a text caption starts editing it in place.
    if (hit.type === 'caption') {
      const now = Date.now();
      const isSocial = isSocialCardCaption(captions.find((c) => c.id === hit.id));
      if (!isSocial && lastTapRef.current.id === hit.id && (now - lastTapRef.current.time) < DOUBLE_TAP_MS) {
        setEditingCaptionId(hit.id);
        focusTextarea();
      }
      lastTapRef.current = { id: hit.id, time: now };
    }

    if (onSelectLayer) onSelectLayer(hit.id);
    if (!hit.locked) beginDrag(hit, coords, canvas);
  };

  const handlePointerEnd = () => {
    if (canvasRef.current && !isDrawingMode) {
      canvasRef.current.style.cursor = 'default';
    }
    if (dragDrawing.current) {
      const { drawing, snapshot } = dragDrawing.current;
      dragDrawing.current = null;
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.drawImage(snapshot, 0, 0);
      }
      if (!isTooSmall(drawing) && onAddDrawing) onAddDrawing(drawing);
      return;
    }
    if (isDrawingMode && isDrawingActive.current) {
      isDrawingActive.current = false;
      lastDrawPoint.current = null;
      if (currentStroke.current) {
        const strokeToSave = currentStroke.current;
        currentStroke.current = null;
        if (strokeToSave.points.length > 0 && onAddDrawing) {
          onAddDrawing(strokeToSave);
        }
      }
      return;
    }

    const wasCleanTap = !hasDragged.current;
    const tappedId = dragTarget.current?.id;
    const tappedType = dragTarget.current?.type;

    isDragging.current = false;
    hasDragged.current = false;
    dragTarget.current = null;
    document.body.style.userSelect = '';
    // The last frame drawn mid-drag shows drag-only feedback (snap guides, size and angle pills): redraw without it.
    snappingLines.current = { horizontal: null, vertical: null };
    if (tappedType) requestRedraw();
    document.body.style.webkitUserSelect = '';

    // Clean tap on caption: select layer, activate editing mode and open keyboard immediately (only for regular text captions, not tweet cards)
    if (wasCleanTap && tappedType === 'caption' && tappedId) {
      if (onSelectLayer) onSelectLayer(tappedId);
      const isSocial = isSocialCardCaption(captions.find((c) => c.id === tappedId));
      if (!isSocial) {
        setEditingCaptionId(tappedId);
        focusTextarea();
      } else {
        setEditingCaptionId(null);
        if (editableRef.current) editableRef.current.blur();
      }
    }
  };

  const handleTextOverlayPointerDown = (e) => {
    handlePointerDown(e);
  };

  const handleTextOverlayPointerEnd = (e) => {
    handlePointerEnd(e);
  };

  const continueStroke = (e) => {
    const coords = getCanvasCoords(e);
    const stroke = currentStroke.current;
    const lastPt = lastDrawPoint.current || stroke.points[stroke.points.length - 1];
    if (Math.hypot(coords.x - lastPt.x, coords.y - lastPt.y) < 1.5) return;
    stroke.points.push({ x: coords.x, y: coords.y });
    lastDrawPoint.current = { x: coords.x, y: coords.y };
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) paintStrokeSegment(ctx, stroke, lastPt, coords);
  };

  const dragSlot = (e, coords, dx, dy) => {
    if (typeof onUpdateSlotTransform !== 'function') return;
    const slotIdx = dragTarget.current.idx;
    if (e.touches && e.touches.length === 2 && initialPinchDist.current) {
      const pinchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      const scale = Math.max(0.5, Math.min(5.0, initialSlotScale.current * (pinchDist / initialPinchDist.current)));
      onUpdateSlotTransform(slotIdx, (prev) => ({ ...prev, scale }));
    } else {
      onUpdateSlotTransform(slotIdx, (prev) => ({ ...prev, offsetX: prev.offsetX + dx, offsetY: prev.offsetY + dy }));
      dragStartCoords.current = coords; // offsets accumulate, so measure the next move from here
    }
  };

  const handlePointerMove = (e) => {
    if (e.cancelable && (isDrawingActive.current || dragDrawing.current || isDragging.current)) {
      e.preventDefault();
    }
    if (dragDrawing.current) {
      // Repaint the canvas from before the drag with the shape at its new size.
      const { drawing, snapshot } = dragDrawing.current;
      const coords = getCanvasCoords(e);
      drawing.points[1] = { x: coords.x, y: coords.y };
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.drawImage(snapshot, 0, 0);
        paintDragDrawing(ctx, drawing);
        paintDragGuide(ctx, drawing);
      }
      return;
    }
    if (isDrawingMode && isDrawingActive.current && currentStroke.current) {
      continueStroke(e);
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const coords = getCanvasCoords(e);
    const target = dragTarget.current;

    if (!isDragging.current || !target) {
      if (!isDrawingMode) {
        canvas.style.cursor = getHoverCursor(getScene(canvas), coords, activeLayerId, bands);
      }
      return;
    }

    const isHeaderOrFooter = target.isHeaderCaption || target.isFooterCaption;
    const dx = (coords.x - dragStartCoords.current.x) / canvas.width;
    const dy = (coords.y - dragStartCoords.current.y) / (isHeaderOrFooter ? canvas.height : canvasH);

    // Only a move past the threshold counts as a drag, so a shaky tap still selects.
    const dragThreshold = (e.touches && e.touches.length > 0) ? 18 : 6;
    if (Math.abs(coords.x - dragStartCoords.current.x) > dragThreshold || Math.abs(coords.y - dragStartCoords.current.y) > dragThreshold) {
      hasDragged.current = true;
      // Blur the textarea immediately when dragging starts so keyboard dismisses
      if (target.type === 'caption' && editableRef.current) {
        editableRef.current.blur();
      }
    }

    if (target.type === 'slot') {
      dragSlot(e, coords, dx, dy);
      return;
    }
    if (target.type === 'empty-slot') return;

    const start = initialLayerPos.current;
    const id = target.id;

    if (target.type.startsWith('rotate_')) {
      const rotation = getRotation(getDragCenter(start, canvas.width, headerExtH, canvasH), coords);
      scheduleDragBatch(() => {
        const type = dragTarget.current?.type;
        if (type === 'rotate_caption' && onUpdateCaptionBounds) onUpdateCaptionBounds(id, { rotation });
        else if (type === 'rotate_sticker' && onUpdateStickerBounds) onUpdateStickerBounds(id, { rotation });
        else if (type === 'rotate_imageLayer' && onUpdateImageLayerBounds) onUpdateImageLayerBounds(id, { rotation });
      });
      return;
    }

    if (target.type.startsWith('resize_imageLayer_')) {
      const layer = imageLayers.find((l) => l.id === id);
      if (!layer || !onUpdateImageLayerBounds) return;
      const patch = resizeImageLayer({
        handleType: target.type, coords, start, layer, cached: imageCacheRef.current[layer.url],
        canvasWidth: canvas.width, headerExtH, canvasH
      });
      if (patch) onUpdateImageLayerBounds(id, patch);
      return;
    }

    if (target.type.startsWith('resize_sticker_')) {
      const sticker = stickers.find((s) => s.id === id);
      if (!sticker || !onUpdateStickerBounds) return;
      onUpdateStickerBounds(id, resizeSticker({ coords, start, sticker, canvasWidth: canvas.width, headerExtH, canvasH }));
      return;
    }

    if (target.type.startsWith('resize_caption_')) {
      const caption = captions.find((c) => c.id === id);
      if (!caption || !onUpdateCaptionBounds) return;
      onUpdateCaptionBounds(id, resizeCaption({ handleType: target.type, coords, start, caption, canvas, headerExtH, canvasH }));
      return;
    }

    const { x, y, guides } = moveLayer({ target, start, dx, dy, canvas, canvasH, captions, stickers, imageLayers });
    snappingLines.current = guides;
    scheduleDragBatch(() => {
      const current = dragTarget.current;
      if (!current) return;
      if (current.type === 'caption' && onUpdateCaptionBounds) {
        // A header/footer caption dragged out of its band keeps its own position from now on.
        const fromBand = current.isHeaderCaption || current.isFooterCaption;
        if (fromBand) current.hasCustomPos = true;
        onUpdateCaptionBounds(current.id, { x, y, ...(fromBand ? { hasCustomPos: true } : {}) });
      } else if (current.type === 'sticker' && onUpdateStickerBounds) {
        onUpdateStickerBounds(current.id, { x, y });
      } else if (current.type === 'imageLayer' && onUpdateImageLayerBounds) {
        onUpdateImageLayerBounds(current.id, { x, y });
      }
    });
  };

  // Mouse wheel over a multi-panel layout zooms that panel's photo.
  const handleWheel = (e) => {
    if (!activeIsNativeLayout || !activeLayoutDef || !onUpdateSlotTransform) return;
    if (!canvasRef.current) return;
    const idx = findSlotAt(getCanvasCoords(e), activeLayoutDef, { canvasW, canvasH, headerExtH });
    if (idx === -1 || !slotImages || !slotImages[idx]) return;
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    onUpdateSlotTransform(idx, (prev) => ({
      ...prev,
      scale: Math.max(0.4, Math.min(6.0, Number(((prev?.scale || 1.5) * zoomFactor).toFixed(2))))
    }));
  };

  usePointerListeners({
    wrapperRef, editableRef, isDragging, isDrawingActive,
    handlePointerDown, handlePointerMove, handlePointerEnd
  });

  return { handlePointerDown, handleTextOverlayPointerDown, handleTextOverlayPointerEnd, handlePointerEnd, handlePointerMove, handleWheel };
}
