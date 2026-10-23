import React, { useEffect, useRef, useState } from 'react';
import { useMemeEditorStore } from './editor/store/useMemeEditorStore';
import { useEditorUiStore } from './editor/store/useEditorUiStore';
import { getBandHeight, getCanvasSize, makeLayerCenters } from './canvas/layout/canvasLayout';
import { renderScene } from './canvas/render/renderScene';
import { useCanvasInteraction } from './canvas/interaction/useCanvasInteraction';

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
  const activeIsNativeLayout = isNativeLayout;
  const activeLayoutDef = layoutDef;

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.resetVideoTimestamps = () => {
        Object.values(imageCacheRef.current).forEach((media) => {
          if (media && media.tagName === 'VIDEO') {
            const trimStart = media._trimStart || 0;
            media.currentTime = trimStart;
            media.play().catch(() => {});
          }
        });
      };
      canvasRef.current.getVideoElements = () => {
        return Object.values(imageCacheRef.current).filter((media) => media && media.tagName === 'VIDEO');
      };
    }
  }, [canvasRef]);

  const wrapperRef = useRef(null);
  const editableRef = useRef(null);
  const imageCacheRef = useRef({});
  const loadingMediaRef = useRef({});
  const [naturalSize, setNaturalSize] = useState({ w: 800, h: 800 });

  const isDragging = useRef(false);
  const snappingLines = useRef({ horizontal: null, vertical: null });
  const dragTarget = useRef(null);
  const [editingCaptionId, setEditingCaptionId] = useState(null);

  useEffect(() => {
    if (editingCaptionId && activeLayerId !== editingCaptionId) {
      setEditingCaptionId(null);
    }
  }, [editingCaptionId, activeLayerId]);


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

  // Focus textarea ONLY when explicitly called (not on selection change, never on Social Cards)
  const focusTextarea = () => {
    if (activeCaption?.isTweetCard || activeCaption?.isInstagramCard || activeCaption?.isWhatsAppCard) return;
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

  const baseImgRef = useRef(null);
  const {
    handlePointerDown, handleTextOverlayPointerDown, handleTextOverlayPointerEnd,
    handlePointerEnd, handlePointerMove, handleWheel
  } = useCanvasInteraction({
    activeIsNativeLayout, activeLayoutDef, canvasH, canvasRef, canvasW,
    dragTarget, editableRef, focusTextarea, getCaptionCenterY, getImageLayerCenterY,
    getStickerCenterY, headerExtH, imageCacheRef, isDragging, isDrawingMode,
    isFooterEnabled, isHeaderEnabled, onAddDrawing, onDeleteLayer, onSelectLayer,
    onUpdateCaptionBounds, onUpdateImageLayerBounds, onUpdateSlotTransform,
    onUpdateStickerBounds, setEditingCaptionId, snappingLines,
    totalCanvasH, wrapperRef
  });
  const compCanvasRef = useRef(null);

  useEffect(() => {
    renderScene({
      activeCaption, activeFilters, activeIsNativeLayout, activeLayerId, activeLayoutDef,
      baseImgRef, canvasBgColor, canvasFlipX, canvasFooter, canvasH, canvasHeader, canvasRef,
      canvasW, captions, compCanvasRef, demotivational, dragTarget, drawings, footerExtH,
      getCaptionCenterY, getImageLayerCenterY, getStickerCenterY, headerExtH, imageCacheRef,
      imageFit, imageLayers, imgSrc, isDragging, isDrawingMode, isFooterEnabled, isHeaderEnabled,
      isNativeLayout, liveBgColor, loadingMediaRef, naturalSize, setNaturalSize, slotImages,
      slotTransforms, snappingLines, stickers, totalCanvasH, watermark
    });
  }, [captions, stickers, activeLayerId, imageLayers, slotImages, slotTransforms, activeIsNativeLayout, editingCaptionId, aspectRatio, imageFit, watermark, drawings, isDrawingMode, imgSrc, filters, liveBgColor, canvasHeader, canvasFooter, demotivational, canvasFlipX]);


  // Keep focus on active caption whenever selected (not for social cards)
  useEffect(() => {
    const isSocial = activeCaption?.isTweetCard || activeCaption?.isInstagramCard || activeCaption?.isWhatsAppCard;
    if (activeCaption && !isSocial && editingCaptionId === activeCaption.id) {
      focusTextarea();
    }
  }, [activeCaption?.id, editingCaptionId]);

  return (
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
        boxSizing: 'border-box'
      }}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerEnd}
      onDragStart={(e) => e.preventDefault()}
      onWheel={handleWheel}
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

      {/* SEAMLESS LIVE CANVAS TEXT EDITOR — ONLY FOR REGULAR CAPTIONS, NOT SOCIAL CARDS */}
      {!isDrawingMode && activeCaption && !activeCaption.isTweetCard && !activeCaption.isInstagramCard && !activeCaption.isWhatsAppCard && (
        <textarea
          ref={editableRef}
          className="seamless-live-text-editor"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          style={{
            position: 'absolute',
            left: activeCaption ? `${activeCaption.x * 100}%` : '-9999px',
            top: activeCaption
              ? (activeCaption.isHeaderCaption && !activeCaption.hasCustomPos
                  ? `${((headerExtH / 2) / Math.max(1, totalCanvasH)) * 100}%`
                  : (activeCaption.isFooterCaption && !activeCaption.hasCustomPos)
                  ? `${(((headerExtH + canvasH + (footerExtH / 2))) / Math.max(1, totalCanvasH)) * 100}%`
                  : `${(((headerExtH + activeCaption.y * canvasH) / Math.max(1, totalCanvasH)) * 100)}%`)
              : '-9999px',
            transform: activeCaption ? `translate(-50%, -50%) rotate(${activeCaption.rotation || 0}deg)` : 'translate(-50%, -50%)',
            width: activeCaption ? `${Math.min(95, Math.max(35, (activeCaption.width || 0.8) * 100))}%` : '1px',
            minHeight: activeCaption ? '44px' : '1px',
            opacity: 0.001,
            pointerEvents: activeCaption ? 'auto' : 'none',
            color: 'transparent',
            caretColor: 'transparent',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            zIndex: activeCaption ? 15 : -1,
            padding: '0',
            margin: '0',
            fontSize: '16px',
            touchAction: 'manipulation',
            overflow: 'hidden'
          }}
          rows={2}
          value={activeCaption ? (activeCaption.text || '') : ''}
          onChange={(e) => {
            if (activeCaption && onUpdateCaptionText) {
              onUpdateCaptionText(activeCaption.id, e.target.value);
            }
          }}
          onFocus={(e) => {
            try {
              const len = e.target.value.length;
              e.target.setSelectionRange(len, len);
            } catch {
              // Selection fallback
            }
          }}
          onBlur={() => {
            setEditingCaptionId(null);
          }}
          onTouchStart={(e) => {
            handleTextOverlayPointerDown(e);
          }}
          onTouchEnd={(e) => {
            handleTextOverlayPointerEnd(e);
          }}
          onMouseDown={handleTextOverlayPointerDown}
          onMouseUp={handleTextOverlayPointerEnd}
        />
      )}
    </div>
  );
});

export default CanvasEditor;
