import React, { useEffect, useReducer, useRef, useState } from 'react';
import { useMemeEditorStore } from './editor/store/useMemeEditorStore';
import { useEditorUiStore } from './editor/store/useEditorUiStore';
import { isSocialCardCaption } from './editor/memeEditorUtils';
import { getBandHeight, getCanvasSize, makeLayerCenters } from './canvas/layout/canvasLayout';
import { renderScene } from './canvas/render/renderScene';
import { useCanvasInteraction } from './canvas/interaction/useCanvasInteraction';
import { useCanvasView } from './canvas/interaction/useCanvasView';
import { isZoomed } from './canvas/interaction/viewZoom';
import CaptionTextOverlay from './canvas/CaptionTextOverlay';

// The meme canvas: works out the layout, draws the scene with renderScene, and hands pointer
// input to useCanvasInteraction. Drawing and hit testing live in ./canvas.
const CanvasEditor = React.forwardRef(function CanvasEditor(
  {
    imageUrl,
    imageFit = 'cover',
    onSelectLayer,
    onDeleteLayer,
    onUpdateCaptionBounds,
    onUpdateStickerBounds,
    onUpdateImageLayerBounds,
    onUpdateCaptionText,
    isNativeLayout,
    layoutDef,
    onUpdateSlotTransform,
    onAddDrawing,
    isDrawingMode = false,
  },
  ref
) {
  // Meme document and shared UI state come from the editor stores.
  const template = useMemeEditorStore((s) => s.activeTemplate);
  const captions = useMemeEditorStore((s) => s.captions);
  const stickers = useMemeEditorStore((s) => s.stickers);
  const imageLayers = useMemeEditorStore((s) => s.imageLayers);
  const aspectRatio = useMemeEditorStore((s) => s.aspectRatio);
  const filters = useMemeEditorStore((s) => s.imageFilters);
  const activeLayerId = useMemeEditorStore((s) => s.activeLayerId);
  const slotImages = useMemeEditorStore((s) => s.slotImages);
  const slotTransforms = useMemeEditorStore((s) => s.slotTransforms);
  const canvasBgColor = useMemeEditorStore((s) => s.canvasBgColor);
  const drawings = useMemeEditorStore((s) => s.drawings);
  const canvasHeader = useMemeEditorStore((s) => s.canvasHeader);
  const canvasFooter = useMemeEditorStore((s) => s.canvasFooter);
  const demotivational = useMemeEditorStore((s) => s.demotivational);
  const canvasFlipX = useMemeEditorStore((s) => s.canvasFlipX);
  const watermark = useEditorUiStore((s) => s.watermark);

  // The colour picker previews the background through a window event before committing to the store.
  const [liveBgColor, setLiveBgColor] = useState(canvasBgColor);
  useEffect(() => {
    setLiveBgColor(canvasBgColor);
  }, [canvasBgColor]);

  useEffect(() => {
    const handler = (e) => {
      setLiveBgColor(e.detail);
    };
    window.addEventListener('liveCanvasBgColor', handler);
    return () => window.removeEventListener('liveCanvasBgColor', handler);
  }, []);

  const internalRef = useRef(null);
  const canvasRef = ref || internalRef;
  const wrapperRef = useRef(null);
  const editableRef = useRef(null);
  const baseImgRef = useRef(null);
  const compCanvasRef = useRef(null);
  const imageCacheRef = useRef({});
  const loadingMediaRef = useRef({});
  // Written by the interaction hook, read by the renderer (snap guides, handles).
  const isDragging = useRef(false);
  const snappingLines = useRef({ horizontal: null, vertical: null });
  const dragTarget = useRef(null);

  const [naturalSize, setNaturalSize] = useState({ w: 800, h: 800 });
  const [editingCaptionId, setEditingCaptionId] = useState(null);
  // Redraws for changes that live in refs rather than state (e.g. snap guides cleared on release).
  const [redrawTick, requestRedraw] = useReducer((n) => n + 1, 0);

  useEffect(() => {
    if (editingCaptionId && activeLayerId !== editingCaptionId) {
      setEditingCaptionId(null);
    }
  }, [editingCaptionId, activeLayerId]);

  const activeIsNativeLayout = isNativeLayout;
  const activeLayoutDef = layoutDef;
  const imgSrc = template?.canvasOnly ? null : (template?.rawImageUrl || imageUrl || template?.imageUrl);
  const { canvasW, canvasH } = getCanvasSize(aspectRatio, template, naturalSize);

  // Optional header/footer bands extend the canvas above and below the image area.
  const isHeaderEnabled = !!canvasHeader?.enabled;
  const isFooterEnabled = !!canvasFooter?.enabled;
  const headerExtH = getBandHeight(canvasHeader, captions.find(c => c.isHeaderCaption), canvasW);
  const footerExtH = getBandHeight(canvasFooter, captions.find(c => c.isFooterCaption), canvasW);
  const totalCanvasH = canvasH + headerExtH + footerExtH;

  const { getCaptionCenterY, getStickerCenterY, getImageLayerCenterY } = makeLayerCenters({
    canvasRef, canvasW, canvasH, headerExtH, footerExtH, totalCanvasH
  });

  const activeFilters = filters || { brightness: 100, contrast: 100, saturation: 100, grayscale: 0, blur: 0 };

  const activeCaption = captions.find((c) => c.id === activeLayerId);
  const showTextOverlay = !isDrawingMode && activeCaption && !isSocialCardCaption(activeCaption);

  // Focus textarea ONLY when explicitly called (not on selection change, never on Social Cards)
  const focusTextarea = () => {
    if (isSocialCardCaption(activeCaption)) return;
    if (editableRef.current) {
      try {
        editableRef.current.focus();
        const len = editableRef.current.value.length;
        editableRef.current.setSelectionRange(len, len);
      } catch {
        // Focus fallback
      }
    }
  };

  // Pinch-zoom and pan of the editor's view (CSS only: the meme and its export don't change).
  const canvasView = useCanvasView(wrapperRef);
  const { view } = canvasView;
  const resetView = canvasView.reset;
  // A different picture or canvas shape starts back at fit.
  useEffect(() => {
    resetView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasW, totalCanvasH, imgSrc]);
  // The floating layer toolbar places itself from the canvas's box on screen, which a zoom moves.
  useEffect(() => {
    canvasRef.current?.dispatchEvent?.(new Event('canvasview'));
  }, [view, canvasRef]);

  const {
    handlePointerDown, handleTextOverlayPointerDown, handleTextOverlayPointerEnd,
    handlePointerEnd, handlePointerMove
  } = useCanvasInteraction({
    activeIsNativeLayout, activeLayoutDef, canvasH, canvasRef, canvasView, canvasW,
    dragTarget, editableRef, focusTextarea, getCaptionCenterY, getImageLayerCenterY,
    getStickerCenterY, headerExtH, imageCacheRef, isDragging, isDrawingMode,
    isFooterEnabled, isHeaderEnabled, onAddDrawing, onDeleteLayer, onSelectLayer,
    onUpdateCaptionBounds, onUpdateImageLayerBounds, onUpdateSlotTransform,
    onUpdateStickerBounds, requestRedraw, setEditingCaptionId, snappingLines,
    totalCanvasH, wrapperRef
  });

  // The scene's inputs, read through a ref: the redraw effect below fires on its listed triggers
  // only, and everything else in here is derived from them.
  const sceneRef = useRef(null);
  sceneRef.current = {
    activeCaption, activeFilters, activeIsNativeLayout, activeLayerId, activeLayoutDef,
    baseImgRef, canvasBgColor, canvasFlipX, canvasFooter, canvasH, canvasHeader, canvasRef,
    canvasW, captions, compCanvasRef, demotivational, dragTarget, drawings, footerExtH,
    getCaptionCenterY, getImageLayerCenterY, getStickerCenterY, headerExtH, imageCacheRef,
    imageFit, imageLayers, imgSrc, isDragging, isDrawingMode, isFooterEnabled, isHeaderEnabled,
    isNativeLayout, liveBgColor, loadingMediaRef, naturalSize, setNaturalSize, slotImages,
    slotTransforms, snappingLines, stickers, totalCanvasH, watermark
  };

  useEffect(() => {
    renderScene(sceneRef.current);
  }, [captions, stickers, activeLayerId, imageLayers, slotImages, slotTransforms, activeIsNativeLayout, editingCaptionId, aspectRatio, imageFit, watermark, drawings, isDrawingMode, imgSrc, filters, liveBgColor, canvasHeader, canvasFooter, demotivational, canvasFlipX, redrawTick]);

  // Keep focus on active caption whenever selected (not for social cards). Runs on a new
  // selection or edit only, not on every keystroke, so the cursor isn't moved while typing.
  const focusTextareaRef = useRef(focusTextarea);
  focusTextareaRef.current = focusTextarea;
  const activeCaptionId = activeCaption?.id;
  const activeCaptionEditable = Boolean(activeCaption) && !isSocialCardCaption(activeCaption);
  useEffect(() => {
    if (activeCaptionEditable && editingCaptionId === activeCaptionId) {
      focusTextareaRef.current();
    }
  }, [activeCaptionId, activeCaptionEditable, editingCaptionId]);

  const zoomed = isZoomed(view);

  return (
    <>
    <div
      ref={wrapperRef}
      className="canvas-interactive-wrapper"
      style={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        touchAction: 'none',
        flex: 'none',
        width: 'auto',
        height: 'auto',
        maxWidth: '100%',
        maxHeight: '100%',
        aspectRatio: `${canvasW} / ${totalCanvasH}`,
        boxSizing: 'border-box',
        transform: zoomed ? `translate(${view.x}px, ${view.y}px) scale(${view.zoom})` : undefined,
        willChange: zoomed ? 'transform' : undefined
      }}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerEnd}
      onDragStart={(e) => e.preventDefault()}
    >
      <canvas
        ref={canvasRef}
        className="meme-canvas"
        onDragStart={(e) => e.preventDefault()}
        style={{
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          cursor: isDrawingMode ? 'crosshair' : 'default',
          width: '100%',
          height: '100%',
          maxWidth: '100%',
          maxHeight: '100%',
          display: 'block',
          objectFit: 'contain'
        }}
      />

      {showTextOverlay && (
        <CaptionTextOverlay
          caption={activeCaption}
          editableRef={editableRef}
          headerExtH={headerExtH}
          canvasH={canvasH}
          footerExtH={footerExtH}
          totalCanvasH={totalCanvasH}
          onChangeText={(text) => onUpdateCaptionText?.(activeCaption.id, text)}
          onBlur={() => setEditingCaptionId(null)}
          onPointerDown={handleTextOverlayPointerDown}
          onPointerEnd={handleTextOverlayPointerEnd}
        />
      )}
    </div>
    {zoomed && (
      <button type="button" className="ie-zoom-pill" onClick={resetView} aria-label="Zoom back to fit">
        {Math.round(view.zoom * 100)}% <span>Fit</span>
      </button>
    )}
    </>
  );
});

export default CanvasEditor;
