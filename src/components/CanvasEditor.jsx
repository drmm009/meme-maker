import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { useMemeEditorStore } from './editor/store/useMemeEditorStore';
import { useEditorUiStore } from './editor/store/useEditorUiStore';
import { wrapText } from './canvas/draw/text';
import { getWhatsAppCardHeight } from './canvas/draw/socialCards/whatsapp';
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

  const isDrawingActive = useRef(false);

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
  const [canvasScale, setCanvasScale] = useState(1);
  const [naturalSize, setNaturalSize] = useState({ w: 800, h: 800 });

  const isDragging = useRef(false);
  const snappingLines = useRef({ horizontal: null, vertical: null });
  const dragTarget = useRef(null);
  // Double-tap detection: track last tap time and layer id
  const [editingCaptionId, setEditingCaptionId] = useState(null);
  const [editingCaptionText, setEditingCaptionText] = useState('');

  useEffect(() => {
    if (editingCaptionId && activeLayerId !== editingCaptionId) {
      setEditingCaptionId(null);
    }
  }, [editingCaptionId, activeLayerId]);


  const imgSrc = template?.canvasOnly ? null : (template?.rawImageUrl || imageUrl || template?.imageUrl);
  let canvasW = 1080;
  let canvasH = 1080;
  let rawW = 1080;
  let rawH = 1080;

  if (aspectRatio === '16:9') {
    rawW = 1920;
    rawH = 1080;
  } else if (aspectRatio === '9:16') {
    rawW = 1080;
    rawH = 1920;
  } else if (aspectRatio === '4:5') {
    rawW = 1080;
    rawH = 1350;
  } else if (aspectRatio === 'original') {
    rawW = template?.width || naturalSize.w || 1080;
    rawH = template?.height || naturalSize.h || 1080;
  }
  
  // Normalize canvas internal resolution to max dimension 1080
  // This keeps font sizes consistent relative to the canvas across all aspect ratios
  // and prevents performance issues from huge original image resolutions
  
  const maxDim = Math.max(rawW, rawH);
  if (maxDim > 0) {
    canvasW = Math.round((rawW / maxDim) * 1080);
    canvasH = Math.round((rawH / maxDim) * 1080);
  }

  // Header Canvas Extension calculations
  const isHeaderEnabled = !!canvasHeader?.enabled;
  const headerCap = captions.find(c => c.isHeaderCaption);
  let headerExtH = 0;
  if (isHeaderEnabled) {
    if (headerCap) {
      const hFontSize = headerCap.fontSize || 50;
      const hFontFamily = headerCap.fontFamily || 'Montserrat, sans-serif';
      let linesCount = 1;
      if (typeof document !== 'undefined') {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.font = `bold ${hFontSize}px ${hFontFamily}`;
          const wrapped = wrapText(tempCtx, headerCap.text || '', (headerCap.width || 0.92) * canvasW);
          linesCount = Math.max(1, wrapped.length);
        }
      }
      const hLineHeight = hFontSize * 1.35;
      const hPadY = Math.max(22, Math.round(hFontSize * 0.6));
      headerExtH = Math.max(110, Math.round(linesCount * hLineHeight + hPadY * 2));
    } else {
      headerExtH = canvasHeader?.height || 140;
    }
  }

  // Footer Canvas Extension calculations
  const isFooterEnabled = !!canvasFooter?.enabled;
  const footerCap = captions.find(c => c.isFooterCaption);
  let footerExtH = 0;
  if (isFooterEnabled) {
    if (footerCap) {
      const fFontSize = footerCap.fontSize || 50;
      const fFontFamily = footerCap.fontFamily || 'Montserrat, sans-serif';
      let linesCount = 1;
      if (typeof document !== 'undefined') {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.font = `bold ${fFontSize}px ${fFontFamily}`;
          const wrapped = wrapText(tempCtx, footerCap.text || '', (footerCap.width || 0.92) * canvasW);
          linesCount = Math.max(1, wrapped.length);
        }
      }
      const fLineHeight = fFontSize * 1.35;
      const fPadY = Math.max(22, Math.round(fFontSize * 0.6));
      footerExtH = Math.max(110, Math.round(linesCount * fLineHeight + fPadY * 2));
    } else {
      footerExtH = canvasFooter?.height || 140;
    }
  }

  const totalCanvasH = canvasH + headerExtH + footerExtH;

  // Layer Center Y position in canvas pixels (anchors meme image layers to the image area below header)
  const getCaptionCenterY = (cap, customCanvas = null) => {
    if (!cap) return 0;
    const activeCanvas = customCanvas || canvasRef.current;
    if (cap.isHeaderCaption) {
      if (cap.hasCustomPos) {
        return (cap.y ?? 0) * (activeCanvas?.height || totalCanvasH);
      }
      return headerExtH / 2;
    }
    if (cap.isFooterCaption) {
      if (cap.hasCustomPos) {
        return (cap.y ?? 0) * (activeCanvas?.height || totalCanvasH);
      }
      return headerExtH + canvasH + (footerExtH / 2);
    }
    const currentH = activeCanvas?.height || canvasH;
    const rawY = headerExtH + (cap.y ?? 0.5) * canvasH;
    if (cap.isWhatsAppCard && activeCanvas) {
      const cardW = Math.max(180, (cap.width || 0.82) * (activeCanvas.width || canvasW));
      const ctx = activeCanvas.getContext ? activeCanvas.getContext('2d') : null;
      const cardH = getWhatsAppCardHeight(ctx, cap, cardW);
      const minMargin = 16;
      if (cardH <= currentH - minMargin * 2) {
        const minY = cardH / 2 + minMargin;
        const maxY = currentH - cardH / 2 - minMargin;
        return Math.max(minY, Math.min(maxY, rawY));
      }
    }
    return rawY;
  };

  const getStickerCenterY = (stk) => {
    return headerExtH + ((stk?.y) || 0) * canvasH;
  };

  const getImageLayerCenterY = (img) => {
    return headerExtH + ((img?.y) || 0) * canvasH;
  };
  
  const activeFilters = filters || { brightness: 100, contrast: 100, saturation: 100, grayscale: 0, blur: 0 };

  const activeCaption = captions.find((c) => c.id === activeLayerId);

  // Compute exact scale ratio synchronously so font scale is accurate
  const updateScaleSync = () => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      if (rect.width > 0 && canvasW > 0) {
        setCanvasScale(rect.width / canvasW);
      }
    }
  };

  useLayoutEffect(() => {
    updateScaleSync();
  }, [canvasW, imgSrc, totalCanvasH]);

  useEffect(() => {
    updateScaleSync();
    window.addEventListener('resize', updateScaleSync);
    const ro = typeof ResizeObserver !== 'undefined' && canvasRef.current
      ? new ResizeObserver(() => updateScaleSync())
      : null;
    if (ro && canvasRef.current) {
      ro.observe(canvasRef.current);
    }
    return () => {
      window.removeEventListener('resize', updateScaleSync);
      if (ro) ro.disconnect();
    };
  }, [canvasW, imgSrc]);

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

  const handlePointerDownRef = useRef(null);
  const handlePointerMoveRef = useRef(null);
  const handlePointerUpRef = useRef(null);
  const handlePointerEndRef = useRef(null);

  // rAF batching for high-DPI drag, resize, and rotate operations (prevents event flooding)

  useLayoutEffect(() => {
    handlePointerDownRef.current = handlePointerDown;
    handlePointerMoveRef.current = handlePointerMove;
    handlePointerEndRef.current = handlePointerEnd;
    handlePointerUpRef.current = handlePointerUp;
  });

  // Native non-passive touch listeners: handle drag & drawing AND block page scroll
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const onTouchStart = (e) => {
      if (e.cancelable && e.target !== editableRef.current) {
        e.preventDefault();
      }
      if (handlePointerDownRef.current) handlePointerDownRef.current(e);
    };

    const onTouchMove = (e) => {
      if (e.cancelable) {
        e.preventDefault();
        e.stopPropagation();
      }
      if ((isDragging.current || isDrawingActive.current) && handlePointerMoveRef.current) {
        handlePointerMoveRef.current(e);
      }
    };

    const onTouchEnd = (e) => {
      if (handlePointerEndRef.current) handlePointerEndRef.current(e);
    };

    wrapper.addEventListener('touchstart', onTouchStart, { passive: false });
    wrapper.addEventListener('touchmove', onTouchMove, { passive: false });
    wrapper.addEventListener('touchend', onTouchEnd, { passive: false });
    wrapper.addEventListener('touchcancel', onTouchEnd, { passive: false });

    return () => {
      wrapper.removeEventListener('touchstart', onTouchStart);
      wrapper.removeEventListener('touchmove', onTouchMove);
      wrapper.removeEventListener('touchend', onTouchEnd);
      wrapper.removeEventListener('touchcancel', onTouchEnd);
    };
  }, []);

  // Global window listeners for mouse & touch drag so continuous dragging outside canvas never freezes
  useEffect(() => {
    const onGlobalPointerMove = (e) => {
      if ((isDragging.current || isDrawingActive.current) && handlePointerMoveRef.current) {
        if (!wrapperRef.current || !wrapperRef.current.contains(e.target)) {
          handlePointerMoveRef.current(e);
        }
      }
    };
    const onGlobalPointerEnd = (e) => {
      if (isDragging.current || isDrawingActive.current) {
        if (handlePointerEndRef.current) {
          handlePointerEndRef.current(e);
        } else if (handlePointerUpRef.current) {
          handlePointerUpRef.current();
        }
      }
    };

    window.addEventListener('mousemove', onGlobalPointerMove);
    window.addEventListener('mouseup', onGlobalPointerEnd);
    window.addEventListener('touchmove', onGlobalPointerMove, { passive: false });
    window.addEventListener('touchend', onGlobalPointerEnd);
    window.addEventListener('touchcancel', onGlobalPointerEnd);

    return () => {
      window.removeEventListener('mousemove', onGlobalPointerMove);
      window.removeEventListener('mouseup', onGlobalPointerEnd);
      window.removeEventListener('touchmove', onGlobalPointerMove);
      window.removeEventListener('touchend', onGlobalPointerEnd);
      window.removeEventListener('touchcancel', onGlobalPointerEnd);
    };
  }, []);

  const baseImgRef = useRef(null);
  const {
    handlePointerDown, handleTextOverlayPointerDown, handleTextOverlayPointerEnd,
    handlePointerEnd, handlePointerMove, handlePointerUp, handleWheel
  } = useCanvasInteraction({
    activeIsNativeLayout, activeLayoutDef, baseImgRef, canvasH, canvasRef, canvasW,
    dragTarget, editableRef, focusTextarea, getCaptionCenterY, getImageLayerCenterY,
    getStickerCenterY, headerExtH, imageCacheRef, isDragging, isDrawingActive, isDrawingMode,
    isFooterEnabled, isHeaderEnabled, onAddDrawing, onDeleteLayer, onSelectLayer,
    onUpdateCaptionBounds, onUpdateImageLayerBounds, onUpdateSlotTransform,
    onUpdateStickerBounds, setEditingCaptionId, setEditingCaptionText, snappingLines,
    totalCanvasH
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

  useEffect(() => {
    if (baseImgRef.current || isNativeLayout) {
      // Just force a re-render. To force a re-render in CanvasEditor we just call renderCanvas.
      // But renderCanvas is inside the component body, so it is accessible.
      // Let's check if renderCanvas is defined in the body... yes.
      // We will inject a dummy state update to force the component to re-execute and thus call renderCanvas via the existing mechanisms, OR just call renderCanvas directly.
      // Wait, renderCanvas takes the image. 
      if (typeof renderCanvas === 'function') {
         renderCanvas(baseImgRef.current);
      }
    }
  }, [liveBgColor, isNativeLayout]);
  
// Keep focus on active caption whenever selected (not for social cards)
  useEffect(() => {
    const isSocial = activeCaption?.isTweetCard || activeCaption?.isInstagramCard || activeCaption?.isWhatsAppCard;
    if (activeCaption && !isSocial && editingCaptionId === activeCaption.id) {
      focusTextarea();
    }
  }, [activeCaption?.id, editingCaptionId]);

  const computedFontSize = activeCaption ? (activeCaption.fontSize || 50) * (canvasScale || 1) : 18;

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
