import { useRef } from 'react';
import { clientToCanvas } from './geometry';
import { usePointerListeners } from './usePointerListeners';
import { findSlotAt } from './layerBoxes';
import { hitActiveHandle, hitBandCaption, hitLayerAt } from './hitTest';
import { getHoverCursor } from './hoverCursor';
import { getDragCenter, getDragStart, getRotation, moveLayer, resizeCaption, resizeImageLayer, resizeSticker } from './dragMath';
import { paintStrokeDot, paintStrokeSegment, startStroke } from './freehand';
import { isTooSmall, paintDragDrawing, paintDragGuide, startDragDrawing } from '../draw/shapes';
import { dragDrawingHandle, hitDrawingAt, hitDrawingHandle, isDragDrawing, moveDrawingPoints } from './drawingHits';
import { groupMates } from '../../editor/panels/arrange';
import { pinchChange, pinchPatch } from './layerPinch';
import { useMemeEditorStore } from '../../editor/store/useMemeEditorStore';
import { useEditorUiStore } from '../../editor/store/useEditorUiStore';
import { isSocialCardCaption } from '../../editor/memeEditorUtils';

// A second tap within this many ms counts as a double tap.
const DOUBLE_TAP_MS = 350;

// How close (in screen pixels) a press has to be to grab a shape's end or corner, or its line.
const DRAWING_HANDLE_PX = 22;
const DRAWING_SLACK_PX = 10;

const fingersOf = (e) => ({ a: { x: e.touches[0].clientX, y: e.touches[0].clientY }, b: { x: e.touches[1].clientX, y: e.touches[1].clientY } });

// Canvas pixels per screen pixel.
const screenScale = (canvas) => canvas.width / Math.max(1, canvas.getBoundingClientRect().width);

// Pointer input on the meme canvas: drawing, selecting, dragging, rotating and resizing layers,
// moving and resizing shapes and censor regions,
// panning or pinch-zooming the photos in a multi-panel layout, and zooming the editor's view
// (canvasView, from useCanvasView). The maths lives in the modules imported above; this hook keeps
// the gesture state and calls the editor's handlers.
export function useCanvasInteraction({
  activeIsNativeLayout, activeLayoutDef, canvasH, canvasRef, canvasView, canvasW,
  dragTarget, editableRef, focusTextarea, getCaptionCenterY, getImageLayerCenterY,
  getStickerCenterY, headerExtH, imageCacheRef, isDragging, isDrawingMode,
  isFooterEnabled, isHeaderEnabled, onAddDrawing, onDeleteLayer, onSelectLayer,
  onMoveLayers, onPreviewStroke, onUpdateCaptionBounds, onUpdateDrawing, onUpdateImageLayerBounds, onUpdateSlotTransform,
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
  const groupStart = useRef([]);
  // Two fingers on a layer: the layer and the fingers as they came down.
  const layerPinch = useRef(null);
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
  const drawings = useMemeEditorStore((s) => s.drawings);

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

  // A gesture's end applies its last move now and clears the waiting frame, so a frame that never
  // came (the page was hidden mid-drag) can't hold up every later drag.
  const flushDragBatch = () => {
    if (dragRafRef.current) cancelAnimationFrame(dragRafRef.current);
    dragRafRef.current = null;
    const pending = pendingDragRef.current;
    pendingDragRef.current = null;
    if (pending) pending();
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
    // Moving a grouped layer moves its group: where each mate started.
    const all = [...captions, ...stickers, ...imageLayers];
    const isBody = hit.type === 'caption' || hit.type === 'sticker' || hit.type === 'imageLayer';
    groupStart.current = isBody ? groupMates(all, hit.id).filter((l) => !l.locked).map((l) => ({ id: l.id, x: l.x, y: l.y })) : [];
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
  // Returns whether there was a panel there.
  const beginSlotDrag = (e, coords) => {
    const idx = findSlotAt(coords, activeLayoutDef, { canvasW, canvasH, headerExtH });
    if (idx === -1) return false;
    isDragging.current = true;
    dragTarget.current = { type: slotImages[idx] ? 'slot' : 'empty-slot', idx };
    dragStartCoords.current = coords;
    if (e.touches && e.touches.length === 2) {
      initialPinchDist.current = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      initialSlotScale.current = (slotTransforms[idx] || { scale: 1.5 }).scale || 1.0;
    }
    return true;
  };

  // A shape or censor region (of `type`, if given) under the pointer: the selected one's ends and
  // corners first, then the topmost one. Grabbing selects it and starts moving or resizing it.
  const grabDrawing = (coords, canvas, type) => {
    const scale = screenScale(canvas);
    const active = drawings.find((d) => d.id === activeLayerId && isDragDrawing(d) && (!type || d.type === type));
    const handle = active ? hitDrawingHandle(active, coords, DRAWING_HANDLE_PX * scale) : null;
    const target = handle ? active : hitDrawingAt(drawings, coords, DRAWING_SLACK_PX * scale, type);
    if (!target) return false;
    if (onSelectLayer) onSelectLayer(target.id);
    setEditingCaptionId(null);
    // A locked one is picked, not moved.
    if (target.locked) return true;
    isDragging.current = true;
    hasDragged.current = false;
    dragTarget.current = { type: handle ? 'drawing_handle' : 'drawing', id: target.id, handle, points: target.points };
    dragStartCoords.current = coords;
    return true;
  };

  // A second finger turns whatever the first one started (a drag, a stroke, a shape) into a zoom
  // of the view: the half-done stroke or shape is dropped and the canvas redrawn without it.
  const cancelGesture = () => {
    if (dragDrawing.current) {
      const { snapshot } = dragDrawing.current;
      dragDrawing.current = null;
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.drawImage(snapshot, 0, 0);
      }
    }
    if (isDrawingActive.current) {
      isDrawingActive.current = false;
      currentStroke.current = null;
      lastDrawPoint.current = null;
      requestRedraw();
    }
    if (isDragging.current) {
      isDragging.current = false;
      hasDragged.current = false;
      dragTarget.current = null;
      snappingLines.current = { horizontal: null, vertical: null };
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      requestRedraw();
    }
  };

  const handlePointerDown = (e) => {
    if (e.cancelable && e.target !== editableRef.current) {
      e.preventDefault();
    }
    const coords = getCanvasCoords(e);
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Two fingers on a layer (the first one went down on it) resize and turn it.
    const grabbed = dragTarget.current;
    const onLayer = grabbed && (grabbed.type === 'caption' || grabbed.type === 'sticker' || grabbed.type === 'imageLayer') && !grabbed.locked;
    if (e.touches && e.touches.length >= 2 && onLayer) {
      const list = grabbed.type === 'caption' ? captions : grabbed.type === 'sticker' ? stickers : imageLayers;
      const layer = list.find((l) => l.id === grabbed.id);
      if (layer) {
        layerPinch.current = { kind: grabbed.type, id: layer.id, start: { ...layer }, from: fingersOf(e) };
        groupStart.current = [];
        hasDragged.current = true;
        return;
      }
    }

    // Two fingers zoom the view, except on a multi-panel layout's photo, which they zoom instead.
    const onSlot = dragTarget.current?.type === 'slot' || dragTarget.current?.type === 'empty-slot';
    if (e.touches && e.touches.length >= 2 && !onSlot) {
      cancelGesture();
      canvasView.startPinch(e);
      return;
    }

    if (isDrawingMode && (drawTool === 'shape' || drawTool === 'censor')) {
      // Pressing an existing one of the kind being drawn moves it; anywhere else starts a new one.
      if (grabDrawing(coords, canvas, drawTool)) return;
      const snapshot = document.createElement('canvas');
      snapshot.width = canvas.width;
      snapshot.height = canvas.height;
      snapshot.getContext('2d')?.drawImage(canvas, 0, 0);
      dragDrawing.current = {
        drawing: startDragDrawing(drawTool, coords, { shape: shapeKind, color: brushColor, size: brushSize, fill: shapeFill, censor: censorMode, strength: censorStrength }),
        snapshot,
      };
      // Counts as drawing, so the window listeners follow the drag and its release off the canvas.
      isDrawingActive.current = true;
      return;
    }

    if (isDrawingMode) {
      isDrawingActive.current = true;
      currentStroke.current = startStroke({ drawTool, canvasBgColor, brushColor, brushSize, point: coords });
      lastDrawPoint.current = { x: coords.x, y: coords.y };
      // The eraser can't be painted on top: the scene is redrawn with it instead.
      if (currentStroke.current.mode === 'eraser') {
        onPreviewStroke?.(currentStroke.current);
        return;
      }
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
    // Shapes and censor regions are drawn over the layers, so they are picked first.
    if (!handleHit && grabDrawing(coords, canvas)) return;
    const hit = handleHit || hitLayerAt(scene, coords) || hitBandCaption(captions, coords, bands);

    if (!hit) {
      if (onSelectLayer) onSelectLayer(null);
      setEditingCaptionId(null);
      if (editableRef.current) editableRef.current.blur();
      // Zoomed in, dragging empty space pans the view.
      const grabbedSlot = activeIsNativeLayout && activeLayoutDef && beginSlotDrag(e, coords);
      if (!grabbedSlot && canvasView.isZoomed()) canvasView.startPan(e);
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
    if (canvasView.endGesture()) return;
    flushDragBatch();
    layerPinch.current = null;
    if (canvasRef.current && !isDrawingMode) {
      canvasRef.current.style.cursor = 'default';
    }
    if (dragDrawing.current) {
      const { drawing, snapshot } = dragDrawing.current;
      dragDrawing.current = null;
      isDrawingActive.current = false;
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.drawImage(snapshot, 0, 0);
      }
      // The new one is selected, so it can be adjusted straight away; a tap deselects.
      if (!isTooSmall(drawing) && onAddDrawing) {
        onAddDrawing(drawing);
        if (onSelectLayer) onSelectLayer(drawing.id);
      } else if (onSelectLayer) {
        onSelectLayer(null);
      }
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
    if (stroke.mode === 'eraser') {
      onPreviewStroke?.(stroke);
      return;
    }
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
    if (e.cancelable && (isDrawingActive.current || dragDrawing.current || isDragging.current || canvasView.gesture.current)) {
      e.preventDefault();
    }
    if (canvasView.moveGesture(e)) return;
    if (layerPinch.current) {
      if (e.touches && e.touches.length >= 2) {
        const { kind, id, start, from } = layerPinch.current;
        const patch = pinchPatch(kind, start, pinchChange(from, fingersOf(e), start.rotation || 0));
        scheduleDragBatch(() => {
          if (kind === 'caption') onUpdateCaptionBounds?.(id, patch);
          else if (kind === 'sticker') onUpdateStickerBounds?.(id, patch);
          else onUpdateImageLayerBounds?.(id, patch);
        });
      }
      return;
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

    if (target.type === 'drawing' || target.type === 'drawing_handle') {
      const points = target.type === 'drawing'
        ? moveDrawingPoints(target.points, coords.x - dragStartCoords.current.x, coords.y - dragStartCoords.current.y)
        : dragDrawingHandle(target.points, target.handle, coords);
      scheduleDragBatch(() => onUpdateDrawing?.(target.id, { points }));
      return;
    }

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
      if (groupStart.current.length && onMoveLayers) {
        onMoveLayers(groupStart.current.map((m) => ({ id: m.id, x: m.x + (x - start.x), y: m.y + (y - start.y) })));
      }
    });
  };

  // Ctrl + wheel (or a trackpad pinch) zooms the view; the wheel over a multi-panel layout's photo
  // zooms that photo; otherwise, zoomed in, the wheel pans.
  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      canvasView.zoomByWheel(e);
      return;
    }
    if (!zoomSlotByWheel(e)) canvasView.panByWheel(e);
  };

  const zoomSlotByWheel = (e) => {
    if (!activeIsNativeLayout || !activeLayoutDef || !onUpdateSlotTransform) return false;
    if (!canvasRef.current) return false;
    const idx = findSlotAt(getCanvasCoords(e), activeLayoutDef, { canvasW, canvasH, headerExtH });
    if (idx === -1 || !slotImages || !slotImages[idx]) return false;
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    onUpdateSlotTransform(idx, (prev) => ({
      ...prev,
      scale: Math.max(0.4, Math.min(6.0, Number(((prev?.scale || 1.5) * zoomFactor).toFixed(2))))
    }));
    return true;
  };

  usePointerListeners({
    wrapperRef, editableRef, isDragging, isDrawingActive, isViewGesture: canvasView.gesture,
    handlePointerDown, handlePointerMove, handlePointerEnd, handleWheel
  });

  return { handlePointerDown, handleTextOverlayPointerDown, handleTextOverlayPointerEnd, handlePointerEnd, handlePointerMove };
}
