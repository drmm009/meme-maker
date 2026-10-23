import { useRef } from 'react';
import { clientToCanvas, getStickerBoxSize, isInBox, rotatePoint } from './geometry';
import { usePointerListeners } from './usePointerListeners';
import { getCurveSagitta, wrapText } from '../draw/text';
import { getWhatsAppCardHeight } from '../draw/socialCards/whatsapp';
import { getBreakingNewsHeight } from '../draw/chyron';
import { getTweetCardHeight } from '../draw/socialCards/tweet';
import { getInstagramCardHeight } from '../draw/socialCards/instagram';
import { useMemeEditorStore } from '../../editor/store/useMemeEditorStore';
import { useEditorUiStore } from '../../editor/store/useEditorUiStore';
import { isSocialCardCaption } from '../../editor/memeEditorUtils';

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
  const activeLayerId = useMemeEditorStore((s) => s.activeLayerId);
  const stickers = useMemeEditorStore((s) => s.stickers);
  const captions = useMemeEditorStore((s) => s.captions);
  const imageLayers = useMemeEditorStore((s) => s.imageLayers);
  const slotImages = useMemeEditorStore((s) => s.slotImages);
  const slotTransforms = useMemeEditorStore((s) => s.slotTransforms);

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

  const handlePointerDown = (e) => {
    if (e.cancelable && e.target !== editableRef.current) {
      e.preventDefault();
    }
    const coords = getCanvasCoords(e);
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDrawingMode) {
      isDrawingActive.current = true;
      const isEraser = drawTool === 'eraser';
      const strokeColor = isEraser ? (canvasBgColor || '#ffffff') : brushColor;
      const strokeMode = drawTool === 'highlighter' ? 'highlighter' : (drawTool === 'glow' ? 'glow' : (isEraser ? 'eraser' : 'pen'));
      const initialStroke = {
        id: `brush-${Date.now()}`,
        type: isEraser ? 'eraser' : (drawTool || 'brush'),
        mode: strokeMode,
        color: strokeColor,
        size: brushSize,
        points: [{ x: coords.x, y: coords.y }]
      };
      currentStroke.current = initialStroke;
      lastDrawPoint.current = { x: coords.x, y: coords.y };

      // Immediate visual dot on canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.save();
        ctx.fillStyle = strokeColor;
        if (strokeMode === 'highlighter') {
          ctx.globalAlpha = 0.45;
        } else if (strokeMode === 'glow') {
          ctx.shadowColor = strokeColor;
          ctx.shadowBlur = Math.max(8, brushSize * 1.5);
        }
        ctx.beginPath();
        ctx.arc(coords.x, coords.y, brushSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      return;
    }

    const ctx = canvas.getContext('2d');
    let hitLayer = null;

    // A. Priority 1: Check Active Layer interactive handles (only if layer is unlocked)
    if (activeLayerId) {
      // 1. Active Sticker handles
      const activeStk = stickers.find(s => s.id === activeLayerId);
      if (activeStk && !activeStk.locked) {
        const cx = activeStk.x * canvas.width;
        const cy = getStickerCenterY(activeStk);
        const stkSize = getStickerBoxSize(activeStk);
        const p = rotatePoint(coords.x, coords.y, cx, cy, -(activeStk.rotation || 0));
        const hs = stkSize / 2 + 6;

        const handles = [
          { type: 'delete_layer', x: cx - hs, y: cy - hs, r: 26 },
          { type: 'rotate_sticker', x: cx, y: cy - stkSize / 2 - 28, r: 24 },
          { type: 'resize_sticker_br', x: cx + hs, y: cy + hs, r: 24 },
        ];

        for (const h of handles) {
          if (Math.hypot(p.x - h.x, p.y - h.y) <= h.r) {
            hitLayer = { 
              id: activeStk.id, 
              type: h.type, 
              x: activeStk.x, 
              y: activeStk.y, 
              scale: activeStk.scale || 1.0, 
              rotation: activeStk.rotation || 0 
            };
            break;
          }
        }
      }

      // 2. Active Caption handles
      if (!hitLayer) {
        const activeCap = captions.find(c => c.id === activeLayerId);
        if (activeCap && !activeCap.locked) {
          let cx = (activeCap.x ?? 0.5) * canvas.width;
          let cy = getCaptionCenterY(activeCap, canvas);
          if (activeCap.isWhatsAppCard) {
            const cardW = Math.max(180, (activeCap.width || 0.82) * canvas.width);
            const halfW = cardW / 2;
            const minPadX = 14;
            if (cardW <= canvas.width - minPadX * 2) {
              cx = Math.max(halfW + minPadX, Math.min(canvas.width - halfW - minPadX, cx));
            }
          }
          const p = rotatePoint(coords.x, coords.y, cx, cy, -(activeCap.rotation || 0));

          const renderMaxWidth = (activeCap.width || 0.9) * canvas.width;
          const fontSize = activeCap.fontSize || 50;
          ctx.font = `bold ${fontSize}px ${activeCap.fontFamily || 'Impact, sans-serif'}`;
          const lines = wrapText(ctx, activeCap.text, renderMaxWidth);
          let maxLineWidth = 0;
          for (const line of lines) {
            maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line).width);
          }
          const isBubble = !!activeCap.bubbleStyle;
          const hasBg = (activeCap.bgColor && activeCap.bgColor !== 'transparent' && activeCap.bgColor !== 'none') || isBubble;
          const padX = isBubble ? Math.max(24, fontSize * 0.5) : (hasBg && activeCap.bgStyle !== 'banner' ? Math.max(16, fontSize * 0.35) : Math.max(16, fontSize * 0.25));
          const padY = isBubble ? Math.max(18, fontSize * 0.4) : (hasBg && activeCap.bgStyle !== 'banner' ? Math.max(10, fontSize * 0.2) : Math.max(10, fontSize * 0.16));
          let boxWidth = (activeCap.hasCustomWidth && activeCap.width)
            ? Math.max(maxLineWidth + padX * 2, activeCap.width * canvas.width)
            : (maxLineWidth + padX * 2);
          boxWidth = Math.min(canvas.width - 16, boxWidth);
          const textHeight = lines.length * (fontSize * 1.2);
          let boxHeight = textHeight + padY * 2;
          if (activeCap.curve && Math.abs(activeCap.curve) > 0) {
            boxHeight += Math.round(getCurveSagitta(maxLineWidth, activeCap.curve));
          }

          if (activeCap.isBreakingNews) {
            boxWidth = Math.max(300, (activeCap.width || 0.94) * canvas.width);
            boxHeight = getBreakingNewsHeight(activeCap);
          } else if (activeCap.isTweetCard) {
            boxWidth = Math.max(180, (activeCap.width || 0.88) * canvas.width);
            boxHeight = getTweetCardHeight(ctx, activeCap, boxWidth);
          } else if (activeCap.isInstagramCard) {
            boxWidth = Math.max(180, (activeCap.width || 0.88) * canvas.width);
            boxHeight = getInstagramCardHeight(ctx, activeCap, boxWidth);
          } else if (activeCap.isWhatsAppCard) {
            boxWidth = Math.max(180, (activeCap.width || 0.84) * canvas.width);
            boxHeight = getWhatsAppCardHeight(ctx, activeCap, boxWidth);
          }
          const halfW = boxWidth / 2;
          const halfH = boxHeight / 2;

          const topY = cy - halfH;
          const bottomY = cy + halfH;
          const leftX = cx - halfW;
          const rightX = cx + halfW;

          // Screen scale factor ensures touch target is at least 44px on user's physical screen
          const screenScale = canvasRef.current
            ? (canvas.width / Math.max(1, canvasRef.current.getBoundingClientRect().width))
            : 2.5;
          const touchHitRadius = Math.max(48, Math.round(22 * screenScale));
          const deleteHitRadius = Math.max(52, Math.round(24 * screenScale));

          const handles = [
            { type: 'delete_layer', x: leftX, y: topY, r: deleteHitRadius },
            { type: 'rotate_caption', x: cx, y: topY - 28, r: touchHitRadius },
            { type: 'resize_caption_l', x: leftX, y: cy, r: touchHitRadius },
            { type: 'resize_caption_r', x: rightX, y: cy, r: touchHitRadius },
            { type: 'resize_caption_br', x: rightX, y: bottomY, r: touchHitRadius }
          ];

          let closestHandle = null;
          let minDistance = Infinity;

          for (const h of handles) {
            const dist = Math.hypot(p.x - h.x, p.y - h.y);
            if (dist <= h.r && dist < minDistance) {
              minDistance = dist;
              closestHandle = h;
            }
          }

          if (closestHandle) {
            // Check double-click on side handles to quickly reset back to auto-fit width
            if (closestHandle.type === 'resize_caption_l' || closestHandle.type === 'resize_caption_r') {
              const now = Date.now();
              if (lastTapRef.current.id === `${activeCap.id}-${closestHandle.type}` && (now - lastTapRef.current.time) < 350) {
                lastTapRef.current = { id: null, time: 0 };
                onUpdateCaptionBounds(activeCap.id, { hasCustomWidth: false, width: 0.9 });
                return;
              }
              lastTapRef.current = { id: `${activeCap.id}-${closestHandle.type}`, time: now };
            }

            const cornerDist = Math.hypot(closestHandle.x - cx, closestHandle.y - cy);
            hitLayer = { 
              id: activeCap.id, 
              type: closestHandle.type, 
              x: activeCap.x, 
              y: activeCap.y,
              isHeaderCaption: !!activeCap.isHeaderCaption, 
              isFooterCaption: !!activeCap.isFooterCaption, 
              hasCustomPos: !!activeCap.hasCustomPos,
              boxWidth,
              boxHeight,
              width: activeCap.width || (boxWidth / canvas.width), 
              rotation: activeCap.rotation || 0,
              fontSize: activeCap.fontSize || 50,
              initialFontSize: activeCap.fontSize || 50,
              initialWidth: activeCap.width || (boxWidth / canvas.width),
              initialBoxWidth: boxWidth,
              initialBoxHeight: boxHeight,
              initialDist: Math.max(15, cornerDist),
              handleRelX: closestHandle.x - cx,
              handleRelY: closestHandle.y - cy,
              hasCustomWidth: !!activeCap.hasCustomWidth
            };
          }
        }
      }

      // 3. Active Image Layer handles
      if (!hitLayer) {
        const activeImg = imageLayers.find(l => l.id === activeLayerId);
        if (activeImg && !activeImg.locked) {
          const cached = imageCacheRef.current[activeImg.url];
          if (cached) {
            const cx = activeImg.x * canvas.width;
            const cy = getImageLayerCenterY(activeImg);
            const scale = activeImg.scale || 1.0;
            const baseW = cached.width || 200;
            const baseH = cached.height || 200;
            const fitScale = Math.min(320 / baseW, 320 / baseH);
            const w = activeImg.boxWidth || activeImg.width || (baseW * fitScale * scale);
            const h = activeImg.boxHeight || activeImg.height || (baseH * fitScale * scale);
            const p = rotatePoint(coords.x, coords.y, cx, cy, -(activeImg.rotation || 0));

            const hw = w / 2 + 6;
            const hh = h / 2 + 6;

            const isCropping = activeImg.fitMode === 'crop';

            const handles = activeImg.isFaceMorph ? [
              { type: 'delete_layer', x: cx - hw * 0.72, y: cy - hh * 0.72, r: 26 },
              { type: 'rotate_imageLayer', x: cx, y: cy - hh - 28, r: 24 },
              { type: 'resize_imageLayer_br', x: cx + hw * 0.72, y: cy + hh * 0.72, r: 24 }
            ] : isCropping ? [
              // In crop mode: only middle handles are active; delete and resize are removed per user request
              { type: 'resize_imageLayer_t',  x: cx,      y: cy - hh, r: 24 },
              { type: 'resize_imageLayer_b',  x: cx,      y: cy + hh, r: 24 },
              { type: 'resize_imageLayer_l',  x: cx - hw, y: cy,      r: 24 },
              { type: 'resize_imageLayer_r',  x: cx + hw, y: cy,      r: 24 }
            ] : [
              { type: 'delete_layer', x: cx - hw, y: cy - hh, r: 26 },
              { type: 'rotate_imageLayer', x: cx, y: cy - hh - 28, r: 22 },
              { type: 'resize_imageLayer_br', x: cx + hw, y: cy + hh, r: 22 },
              { type: 'resize_imageLayer_t',  x: cx,      y: cy - hh, r: 22 },
              { type: 'resize_imageLayer_b',  x: cx,      y: cy + hh, r: 22 },
              { type: 'resize_imageLayer_l',  x: cx - hw, y: cy,      r: 22 },
              { type: 'resize_imageLayer_r',  x: cx + hw, y: cy,      r: 22 }
            ];

            let closestHandle = null;
            let minDistance = Infinity;

            for (const h of handles) {
              const dist = Math.hypot(p.x - h.x, p.y - h.y);
              if (dist <= h.r && dist < minDistance) {
                minDistance = dist;
                closestHandle = h;
              }
            }

            if (closestHandle) {
              hitLayer = { 
                id: activeImg.id, 
                type: closestHandle.type, 
                x: activeImg.x, 
                y: activeImg.y, 
                scale, 
                rotation: activeImg.rotation || 0, 
                baseW, baseH, fitScale, 
                boxWidth: w, 
                boxHeight: h, 
                width: w, 
                height: h,
                crop: activeImg.crop ? { ...activeImg.crop } : { x: 0, y: 0, width: 1, height: 1 },
                fitMode: activeImg.fitMode
              };
            }
          }
        }
      }
    }

    // B. Priority 2: Check ALL layers in Descending Stack Order (top-most layer under pointer wins)
    if (!hitLayer) {
      const allLayersRev = [
        ...(imageLayers || []).map(l => ({ ...l, _type: 'imageLayer', zIndex: l.zIndex ?? 0 })),
        ...(stickers || []).map(l => ({ ...l, _type: 'sticker', zIndex: l.zIndex ?? 0 })),
        ...(captions || []).map(l => ({ ...l, _type: 'caption', zIndex: l.zIndex ?? 0 }))
      ];
      allLayersRev.sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0)); // Descending: topmost first

      for (const layer of allLayersRev) {
        if (hitLayer) break;
        if (layer.hidden) continue; // Skip hidden layers

        if (layer._type === 'sticker') {
          const stk = layer;
          const cx = stk.x * canvas.width;
          const cy = getStickerCenterY(stk);
          const stkSize = getStickerBoxSize(stk);
          const p = rotatePoint(coords.x, coords.y, cx, cy, -(stk.rotation || 0));
          if (isInBox(p, cx, cy, stkSize, stkSize, 6)) {
            hitLayer = { 
              id: stk.id, 
              type: 'sticker', 
              x: stk.x, 
              y: stk.y, 
              scale: stk.scale || 1.0, 
              rotation: stk.rotation || 0,
              locked: !!stk.locked
            };
          }
        } else if (layer._type === 'caption') {
          const cap = layer;
          let cx = (cap.x ?? 0.5) * canvas.width;
          let cy = getCaptionCenterY(cap, canvas);
          if (cap.isWhatsAppCard) {
            const cardW = Math.max(180, (cap.width || 0.82) * canvas.width);
            const halfW = cardW / 2;
            const minPadX = 14;
            if (cardW <= canvas.width - minPadX * 2) {
              cx = Math.max(halfW + minPadX, Math.min(canvas.width - halfW - minPadX, cx));
            }
          }
          const p = rotatePoint(coords.x, coords.y, cx, cy, -(cap.rotation || 0));
          const fontSize = cap.fontSize || 50;
          ctx.font = `bold ${fontSize}px ${cap.fontFamily || 'Impact, sans-serif'}`;
          const renderMaxWidth = (cap.width || 0.9) * canvas.width;
          const lines = wrapText(ctx, cap.text || '', renderMaxWidth);
          let maxLineWidth = 0;
          for (const line of lines) {
            maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line).width);
          }
          const isBubble = !!cap.bubbleStyle;
          const hasBg = (cap.bgColor && cap.bgColor !== 'transparent' && cap.bgColor !== 'none') || isBubble;
          const padX = isBubble ? Math.max(24, fontSize * 0.5) : (hasBg && cap.bgStyle !== 'banner' ? Math.max(16, fontSize * 0.35) : Math.max(8, fontSize * 0.15));
          const padY = isBubble ? Math.max(18, fontSize * 0.4) : (hasBg && cap.bgStyle !== 'banner' ? Math.max(10, fontSize * 0.2) : Math.max(4, fontSize * 0.1));
          let boxWidth = (cap.hasCustomWidth && cap.width)
            ? Math.max(maxLineWidth + padX * 2, cap.width * canvas.width)
            : (maxLineWidth + padX * 2);
          boxWidth = Math.min(canvas.width - 16, boxWidth);
          const lineHeight = fontSize * 1.2;
          let boxHeight = lines.length * lineHeight + padY * 2;
          if (cap.curve && Math.abs(cap.curve) > 0) {
            boxHeight += Math.round(getCurveSagitta(maxLineWidth, cap.curve));
          }

          if (cap.isBreakingNews) {
            boxWidth = Math.max(300, (cap.width || 0.94) * canvas.width);
            boxHeight = getBreakingNewsHeight(cap);
          } else if (cap.isTweetCard) {
            boxWidth = Math.max(180, (cap.width || 0.88) * canvas.width);
            boxHeight = getTweetCardHeight(ctx, cap, boxWidth);
          } else if (cap.isInstagramCard) {
            boxWidth = Math.max(180, (cap.width || 0.88) * canvas.width);
            boxHeight = getInstagramCardHeight(ctx, cap, boxWidth);
          } else if (cap.isWhatsAppCard) {
            boxWidth = Math.max(180, (cap.width || 0.84) * canvas.width);
            boxHeight = getWhatsAppCardHeight(ctx, cap, boxWidth);
          }

          let hitBox = false;
          if (hasBg && cap.bgStyle === 'banner') {
             const bannerY = - ((lines.length - 1) * lineHeight) / 2 - lineHeight / 2 - padY;
             hitBox = (p.y >= cy + bannerY && p.y <= cy + bannerY + boxHeight);
          } else {
             hitBox = isInBox(p, cx, cy, boxWidth, boxHeight);
          }

          if (hitBox) {
            hitLayer = { 
              id: cap.id, 
              type: 'caption', 
              x: cap.x, 
              y: cap.y,
              isHeaderCaption: !!cap.isHeaderCaption,
              isFooterCaption: !!cap.isFooterCaption,
              hasCustomPos: !!cap.hasCustomPos,
              boxWidth,
              boxHeight,
              width: cap.width || (boxWidth / canvas.width),
              rotation: cap.rotation || 0,
              fontSize: cap.fontSize || 50,
              initialFontSize: cap.fontSize || 50,
              initialWidth: cap.width || 0.9,
              initialBoxWidth: boxWidth,
              initialBoxHeight: boxHeight,
              hasCustomWidth: !!cap.hasCustomWidth,
              locked: !!cap.locked
            };
          }
        } else if (layer._type === 'imageLayer') {
          const imgLayer = layer;
          const cx = imgLayer.x * canvas.width;
          const cy = getImageLayerCenterY(imgLayer);
          const cached = imageCacheRef.current[imgLayer.url];
          
          if (cached) {
            const baseW = cached.width || 200;
            const baseH = cached.height || 200;
            const scale = imgLayer.scale || 1.0;
            const maxDim = 320;
            const fitScale = Math.min(maxDim / baseW, maxDim / baseH);
            const w = imgLayer.boxWidth || imgLayer.width || (baseW * fitScale * scale);
            const h = imgLayer.boxHeight || imgLayer.height || (baseH * fitScale * scale);

            const p = rotatePoint(coords.x, coords.y, cx, cy, -(imgLayer.rotation || 0));
            if (isInBox(p, cx, cy, w, h)) {
              hitLayer = { 
                id: imgLayer.id, 
                type: 'imageLayer', 
                x: imgLayer.x, 
                y: imgLayer.y, 
                scale: imgLayer.scale || 1.0, 
                rotation: imgLayer.rotation || 0,
                baseW, baseH, fitScale,
                boxWidth: w,
                boxHeight: h,
                width: w,
                height: h,
                locked: !!imgLayer.locked,
                crop: imgLayer.crop ? { ...imgLayer.crop } : undefined,
                fitMode: imgLayer.fitMode
              };
            }
          }
        }
      }
    }

    if (!hitLayer && isHeaderEnabled && coords.y <= headerExtH) {
      const hCap = captions.find(c => c.isHeaderCaption);
      if (hCap && !hCap.hasCustomPos) {
        hitLayer = {
          id: hCap.id,
          type: 'caption',
          x: hCap.x,
          y: hCap.y,
          isHeaderCaption: true,
          hasCustomPos: false,
          locked: !!hCap.locked
        };
      }
    }

    if (!hitLayer && isFooterEnabled && coords.y >= (headerExtH + canvasH)) {
      const fCap = captions.find(c => c.isFooterCaption);
      if (fCap && !fCap.hasCustomPos) {
        hitLayer = {
          id: fCap.id,
          type: 'caption',
          x: fCap.x,
          y: fCap.y,
          isFooterCaption: true,
          hasCustomPos: false,
          locked: !!fCap.locked
        };
      }
    }

    if (hitLayer) {
      if (hitLayer.type === 'delete_layer') {
        if (onDeleteLayer) onDeleteLayer();
        return;
      }
      
      if (hitLayer.type === 'caption') {
        const now = Date.now();
        const clickedCap = captions.find(c => c.id === hitLayer.id);
        const isSocial = isSocialCardCaption(clickedCap);
        if (!isSocial && lastTapRef.current.id === hitLayer.id && (now - lastTapRef.current.time) < 350) {
          setEditingCaptionId(hitLayer.id);
          focusTextarea();
        }
        lastTapRef.current = { id: hitLayer.id, time: now };
      }

      if (onSelectLayer) onSelectLayer(hitLayer.id);

      // Only begin dragging if the layer is not locked
      if (!hitLayer.locked) {
        isDragging.current = true;
        dragTarget.current = hitLayer;
        dragStartCoords.current = coords;
        hasDragged.current = false;

        // Prevent browser selection / autoscroll during drag
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
        if (window.getSelection) {
          window.getSelection().removeAllRanges();
        }

        const isCap = hitLayer.type === 'caption' || hitLayer.type?.startsWith('resize_caption_') || hitLayer.type === 'rotate_caption';
        const isStk = hitLayer.type === 'sticker' || hitLayer.type?.startsWith('resize_sticker_') || hitLayer.type === 'rotate_sticker';
        const isImg = hitLayer.type === 'imageLayer' || hitLayer.type?.startsWith('resize_imageLayer_') || hitLayer.type === 'rotate_imageLayer';

        const centerX = hitLayer.x * canvas.width;
        const centerY = isCap
          ? getCaptionCenterY(hitLayer)
          : isStk
          ? getStickerCenterY(hitLayer)
          : isImg
          ? getImageLayerCenterY(hitLayer)
          : (headerExtH + (hitLayer.y || 0) * canvasH);
        const initDist = hitLayer.initialDist || Math.hypot(coords.x - centerX, coords.y - centerY);

        const isHeaderOrFooter = hitLayer.isHeaderCaption || hitLayer.isFooterCaption;
        const initialNormalizedY = (isHeaderOrFooter && !hitLayer.hasCustomPos)
          ? (centerY / Math.max(1, canvas.height || totalCanvasH))
          : hitLayer.y;

        initialLayerPos.current = { 
          x: hitLayer.x, 
          y: initialNormalizedY, 
          centerX,
          centerY,
          width: hitLayer.boxWidth || hitLayer.width,
          height: hitLayer.boxHeight || hitLayer.height,
          boxWidth: hitLayer.boxWidth || hitLayer.width,
          boxHeight: hitLayer.boxHeight || hitLayer.height,
          scale: hitLayer.scale || 1.0,
          rotation: hitLayer.rotation || 0,
          initialDist: Math.max(15, initDist),
          initialFontSize: hitLayer.initialFontSize || hitLayer.fontSize || 50,
          initialWidth: hitLayer.initialWidth || hitLayer.width || 0.9,
          initialBoxWidth: hitLayer.initialBoxWidth || hitLayer.boxWidth,
          initialBoxHeight: hitLayer.initialBoxHeight || hitLayer.boxHeight,
          handleRelX: hitLayer.handleRelX,
          handleRelY: hitLayer.handleRelY,
          hasCustomWidth: hitLayer.hasCustomWidth,
          crop: hitLayer.crop ? { ...hitLayer.crop } : undefined,
          fitMode: hitLayer.fitMode
        };
      }
    } else {
      if (onSelectLayer) onSelectLayer(null);
      setEditingCaptionId(null);
      if (editableRef.current) editableRef.current.blur();
      
      // Native slot handling for pinch-to-zoom
      if (activeIsNativeLayout && activeLayoutDef) {
        const totalSlots = activeLayoutDef.slots;
        const isVert = activeLayoutDef.id === '2-vert' || activeLayoutDef.id === '3-stacked';
        const isHoriz = activeLayoutDef.id === '2-horiz' || activeLayoutDef.id === '3-horiz';
        const isGrid = activeLayoutDef.id === '4-grid';
        const isHybrid = activeLayoutDef.id === '3-hybrid';

        let hitSlotIdx = -1;
        for (let idx = 0; idx < totalSlots; idx++) {
          let x = 0, y = headerExtH, slotW = canvasW, slotH = canvasH;
          if (isVert) { slotH = canvasH / totalSlots; y = headerExtH + idx * slotH; }
          else if (isHoriz) { slotW = canvasW / totalSlots; x = idx * slotW; y = headerExtH; }
          else if (isGrid) { slotW = canvasW / 2; slotH = canvasH / 2; x = (idx % 2) * slotW; y = headerExtH + Math.floor(idx / 2) * slotH; }
          else if (isHybrid) {
            if (idx === 0) { slotW = canvasW; slotH = canvasH / 2; x = 0; y = headerExtH; }
            else { slotW = canvasW / 2; slotH = canvasH / 2; x = (idx - 1) * slotW; y = headerExtH + canvasH / 2; }
          }
          if (coords.x >= x && coords.x <= x + slotW && coords.y >= y && coords.y <= y + slotH) {
            hitSlotIdx = idx;
            break;
          }
        }

        if (hitSlotIdx !== -1) {
          isDragging.current = true;
          const hasImage = !!slotImages[hitSlotIdx];
          dragTarget.current = { type: hasImage ? 'slot' : 'empty-slot', idx: hitSlotIdx };
          dragStartCoords.current = coords;
          
          if (e.touches && e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            initialPinchDist.current = Math.hypot(dx, dy);
            const currentTransform = slotTransforms[hitSlotIdx] || { scale: 1.5 };
            initialSlotScale.current = currentTransform.scale || 1.0;
          }
        }
      }
    }
  };

  const handlePointerEnd = (e) => {
    if (canvasRef.current && !isDrawingMode) {
      canvasRef.current.style.cursor = 'default';
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

    if (wasCleanTap && tappedType === 'empty-slot') {
      // Slot actions are now handled by DOM overlays on the canvas
    }

    // Clean tap on caption: select layer, activate editing mode and open keyboard immediately (only for regular text captions, not tweet cards)
    if (wasCleanTap && tappedType === 'caption' && tappedId) {
      if (onSelectLayer) onSelectLayer(tappedId);
      const tappedCap = captions.find(c => c.id === tappedId);
      const isSocial = isSocialCardCaption(tappedCap);
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

  const updateHoverCursor = (coords) => {
    const canvas = canvasRef.current;
    if (!canvas || isDrawingMode) return;

    if (activeLayerId) {
      const activeStk = stickers.find(s => s.id === activeLayerId);
      if (activeStk && !activeStk.locked) {
        const cx = activeStk.x * canvas.width;
        const cy = getStickerCenterY(activeStk);
        const stkSize = getStickerBoxSize(activeStk);
        const p = rotatePoint(coords.x, coords.y, cx, cy, -(activeStk.rotation || 0));
        const hs = stkSize / 2 + 6;

        if (Math.hypot(p.x - (cx - hs), p.y - (cy - hs)) <= 26) {
          canvas.style.cursor = 'pointer'; return;
        }
        if (Math.hypot(p.x - cx, p.y - (cy - stkSize / 2 - 28)) <= 24) {
          canvas.style.cursor = 'grab'; return;
        }
        if (Math.hypot(p.x - (cx + hs), p.y - (cy + hs)) <= 24) {
          canvas.style.cursor = 'nwse-resize'; return;
        }
        if (isInBox(p, cx, cy, stkSize, stkSize, 6)) {
          canvas.style.cursor = 'move'; return;
        }
      }

      const activeCap = captions.find(c => c.id === activeLayerId);
      if (activeCap && !activeCap.locked) {
        let cx = (activeCap.x ?? 0.5) * canvas.width;
        let cy = getCaptionCenterY(activeCap, canvas);
        if (activeCap.isWhatsAppCard) {
          const cardW = Math.max(180, (activeCap.width || 0.82) * canvas.width);
          const halfW = cardW / 2;
          const minPadX = 14;
          if (cardW <= canvas.width - minPadX * 2) {
            cx = Math.max(halfW + minPadX, Math.min(canvas.width - halfW - minPadX, cx));
          }
        }
        const p = rotatePoint(coords.x, coords.y, cx, cy, -(activeCap.rotation || 0));
        const renderMaxWidth = (activeCap.width || 0.9) * canvas.width;
        const fontSize = activeCap.fontSize || 50;
        const ctx = canvas.getContext('2d');
        let maxLineWidth = 0;
        let lines = [activeCap.text || ''];
        if (ctx) {
          ctx.font = `bold ${fontSize}px ${activeCap.fontFamily || 'Impact, sans-serif'}`;
          lines = wrapText(ctx, activeCap.text || '', renderMaxWidth);
          for (const line of lines) maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line).width);
        }
        const isBubble = !!activeCap.bubbleStyle;
        const hasBg = (activeCap.bgColor && activeCap.bgColor !== 'transparent' && activeCap.bgColor !== 'none') || isBubble;
        const padX = isBubble ? Math.max(24, fontSize * 0.5) : (hasBg && activeCap.bgStyle !== 'banner' ? Math.max(16, fontSize * 0.35) : Math.max(16, fontSize * 0.25));
        const padY = isBubble ? Math.max(18, fontSize * 0.4) : (hasBg && activeCap.bgStyle !== 'banner' ? Math.max(10, fontSize * 0.2) : Math.max(10, fontSize * 0.16));
        let boxWidth = (activeCap.hasCustomWidth && activeCap.width)
          ? Math.max(maxLineWidth + padX * 2, activeCap.width * canvas.width)
          : (maxLineWidth + padX * 2);
        boxWidth = Math.min(canvas.width - 16, boxWidth);
        const textHeight = lines.length * (fontSize * 1.2);
        let boxHeight = textHeight + padY * 2;
        if (activeCap.curve && Math.abs(activeCap.curve) > 0) {
          boxHeight += Math.round(getCurveSagitta(maxLineWidth, activeCap.curve));
        }

        if (activeCap.isBreakingNews) {
          boxWidth = Math.max(300, (activeCap.width || 0.94) * canvas.width);
          boxHeight = getBreakingNewsHeight(activeCap);
        } else if (activeCap.isTweetCard) {
          boxWidth = Math.max(180, (activeCap.width || 0.88) * canvas.width);
          boxHeight = getTweetCardHeight(ctx, activeCap, boxWidth);
        } else if (activeCap.isInstagramCard) {
          boxWidth = Math.max(180, (activeCap.width || 0.88) * canvas.width);
          boxHeight = getInstagramCardHeight(ctx, activeCap, boxWidth);
        } else if (activeCap.isWhatsAppCard) {
          boxWidth = Math.max(180, (activeCap.width || 0.84) * canvas.width);
          boxHeight = getWhatsAppCardHeight(ctx, activeCap, boxWidth);
        }

        const halfW = boxWidth / 2;
        const halfH = boxHeight / 2;

        const topY = cy - halfH;
        const bottomY = cy + halfH;
        const leftX = cx - halfW;
        const rightX = cx + halfW;

        const screenScale = canvasRef.current
          ? (canvas.width / Math.max(1, canvasRef.current.getBoundingClientRect().width))
          : 2.5;
        const hoverHitRadius = Math.max(38, Math.round(18 * screenScale));
        const deleteHoverRadius = Math.max(42, Math.round(20 * screenScale));

        if (Math.hypot(p.x - leftX, p.y - topY) <= deleteHoverRadius) {
          canvas.style.cursor = 'pointer'; return;
        }
        if (Math.hypot(p.x - cx, p.y - (topY - 28)) <= hoverHitRadius) {
          canvas.style.cursor = 'grab'; return;
        }
        if (Math.hypot(p.x - leftX, p.y - cy) <= hoverHitRadius || Math.hypot(p.x - rightX, p.y - cy) <= hoverHitRadius) {
          canvas.style.cursor = 'ew-resize'; return;
        }
        if (Math.hypot(p.x - rightX, p.y - bottomY) <= hoverHitRadius) {
          canvas.style.cursor = 'nwse-resize'; return;
        }
        if (p.x >= cx - halfW && p.x <= cx + halfW && p.y >= cy - halfH && p.y <= cy + halfH) {
          canvas.style.cursor = 'move'; return;
        }
      }

      const activeImg = imageLayers.find(l => l.id === activeLayerId);
      if (activeImg && !activeImg.locked) {
        const cached = imageCacheRef.current[activeImg.url];
        if (cached) {
          const cx = activeImg.x * canvas.width;
          const cy = getImageLayerCenterY(activeImg);
          const scale = activeImg.scale || 1.0;
          const baseW = cached.width || 200;
          const baseH = cached.height || 200;
          const fitScale = Math.min(320 / baseW, 320 / baseH);
          const w = activeImg.boxWidth || activeImg.width || (baseW * fitScale * scale);
          const h = activeImg.boxHeight || activeImg.height || (baseH * fitScale * scale);
          const p = rotatePoint(coords.x, coords.y, cx, cy, -(activeImg.rotation || 0));
          const hw = w / 2 + 6;
          const hh = h / 2 + 6;

          const isCropping = activeImg.fitMode === 'crop';

          if (!isCropping) {
            if (Math.hypot(p.x - (cx - hw), p.y - (cy - hh)) <= 26) {
              canvas.style.cursor = 'pointer'; return;
            }
            if (Math.hypot(p.x - cx, p.y - (cy - hh - 28)) <= 22) {
              canvas.style.cursor = 'grab'; return;
            }
            if (Math.hypot(p.x - (cx + hw), p.y - (cy + hh)) <= 22) {
              canvas.style.cursor = 'nwse-resize'; return;
            }
          }
          if (Math.hypot(p.x - cx, p.y - (cy - hh)) <= 22 || Math.hypot(p.x - cx, p.y - (cy + hh)) <= 22) {
            canvas.style.cursor = 'ns-resize'; return;
          }
          if (Math.hypot(p.x - (cx - hw), p.y - cy) <= 22 || Math.hypot(p.x - (cx + hw), p.y - cy) <= 22) {
            canvas.style.cursor = 'ew-resize'; return;
          }
          if (isInBox(p, cx, cy, w, h)) {
            canvas.style.cursor = 'move'; return;
          }
        }
      }
    }

    if (isHeaderEnabled && coords.y <= headerExtH) {
      canvas.style.cursor = 'pointer';
      return;
    }

    for (const stk of stickers) {
      if (stk.hidden) continue;
      const cx = stk.x * canvas.width;
      const cy = getStickerCenterY(stk);
      const stkSize = getStickerBoxSize(stk);
      const p = rotatePoint(coords.x, coords.y, cx, cy, -(stk.rotation || 0));
      if (isInBox(p, cx, cy, stkSize, stkSize)) {
        canvas.style.cursor = 'pointer';
        return;
      }
    }

    for (const l of imageLayers) {
      if (l.hidden) continue;
      const cx = l.x * canvas.width;
      const cy = getImageLayerCenterY(l);
      const cached = imageCacheRef.current[l.url];
      if (cached) {
        const scale = l.scale || 1.0;
        const baseW = cached.width || 200;
        const baseH = cached.height || 200;
        const fitScale = Math.min(320 / baseW, 320 / baseH);
        const w = l.boxWidth || l.width || (baseW * fitScale * scale);
        const h = l.boxHeight || l.height || (baseH * fitScale * scale);
        const p = rotatePoint(coords.x, coords.y, cx, cy, -(l.rotation || 0));
        if (isInBox(p, cx, cy, w, h)) {
          canvas.style.cursor = 'pointer';
          return;
        }
      }
    }

    for (const cap of captions) {
      if (cap.hidden) continue;
      const cx = cap.x * canvas.width;
      const cy = getCaptionCenterY(cap);
      const p = rotatePoint(coords.x, coords.y, cx, cy, -(cap.rotation || 0));
      const fontSize = cap.fontSize || 50;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.font = `bold ${fontSize}px ${cap.fontFamily || 'Impact, sans-serif'}`;
        const renderMaxWidth = (cap.width || 0.9) * canvas.width;
        const lines = wrapText(ctx, cap.text || '', renderMaxWidth);
        let maxLineWidth = 0;
        for (const line of lines) maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line).width);
        const isBubble = !!cap.bubbleStyle;
        const hasBg = (cap.bgColor && cap.bgColor !== 'transparent' && cap.bgColor !== 'none') || isBubble;
        const padX = isBubble ? Math.max(24, fontSize * 0.5) : (hasBg && cap.bgStyle !== 'banner' ? Math.max(16, fontSize * 0.35) : Math.max(8, fontSize * 0.15));
        const padY = isBubble ? Math.max(18, fontSize * 0.4) : (hasBg && cap.bgStyle !== 'banner' ? Math.max(10, fontSize * 0.2) : Math.max(4, fontSize * 0.1));
        let boxWidth = (cap.hasCustomWidth && cap.width)
          ? Math.max(maxLineWidth + padX * 2, cap.width * canvas.width)
          : (maxLineWidth + padX * 2);
        boxWidth = Math.min(canvas.width - 16, boxWidth);
        const lineHeight = fontSize * 1.2;
        let boxHeight = lines.length * lineHeight + padY * 2;
        if (cap.curve && Math.abs(cap.curve) > 0) {
          boxHeight += Math.round(getCurveSagitta(maxLineWidth, cap.curve));
        }
        if (cap.isBreakingNews) {
          boxWidth = Math.max(300, (cap.width || 0.94) * canvas.width);
          boxHeight = getBreakingNewsHeight(cap);
        } else if (cap.isTweetCard) {
          boxWidth = Math.max(180, (cap.width || 0.88) * canvas.width);
          boxHeight = getTweetCardHeight(ctx, cap, boxWidth);
        } else if (cap.isInstagramCard) {
          boxWidth = Math.max(180, (cap.width || 0.88) * canvas.width);
          boxHeight = getInstagramCardHeight(ctx, cap, boxWidth);
        } else if (cap.isWhatsAppCard) {
          boxWidth = Math.max(180, (cap.width || 0.84) * canvas.width);
          boxHeight = getWhatsAppCardHeight(ctx, cap, boxWidth);
        }
        if (isInBox(p, cx, cy, boxWidth, boxHeight)) {
          canvas.style.cursor = 'pointer';
          return;
        }
      }
    }

    canvas.style.cursor = 'default';
  };

  const handlePointerMove = (e) => {
    if (e.cancelable && (isDrawingActive.current || isDragging.current)) {
      e.preventDefault();
    }
    if (isDrawingMode && isDrawingActive.current && currentStroke.current) {
      const coords = getCanvasCoords(e);
      const stroke = currentStroke.current;
      const lastPt = lastDrawPoint.current || stroke.points[stroke.points.length - 1];

      const dist = Math.hypot(coords.x - lastPt.x, coords.y - lastPt.y);
      if (dist >= 1.5) {
        stroke.points.push({ x: coords.x, y: coords.y });
        lastDrawPoint.current = { x: coords.x, y: coords.y };

        // Instant hardware-accelerated 2D canvas drawing (no React state lag!)
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.save();
            ctx.strokeStyle = stroke.color;
            ctx.lineWidth = stroke.size;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            if (stroke.mode === 'highlighter') {
              ctx.globalAlpha = 0.45;
            } else if (stroke.mode === 'glow') {
              ctx.shadowColor = stroke.color;
              ctx.shadowBlur = Math.max(8, stroke.size * 1.5);
            }
            ctx.beginPath();
            ctx.moveTo(lastPt.x, lastPt.y);
            ctx.lineTo(coords.x, coords.y);
            ctx.stroke();
            ctx.restore();
          }
        }
      }
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const coords = getCanvasCoords(e);

    if (!isDragging.current || !dragTarget.current) {
      if (!isDrawingMode) {
        updateHoverCursor(coords);
      }
      return;
    }

    const dx = (coords.x - dragStartCoords.current.x) / canvas.width;
    const isHeaderOrFooter = dragTarget.current?.isHeaderCaption || dragTarget.current?.isFooterCaption;
    const dy = isHeaderOrFooter
      ? ((coords.y - dragStartCoords.current.y) / canvas.height)
      : ((coords.y - dragStartCoords.current.y) / canvasH);

    // Mark as dragged if moved more than threshold (prevents accidental drag on tap on touchscreens)
    const pixelDx = Math.abs(coords.x - dragStartCoords.current.x);
    const pixelDy = Math.abs(coords.y - dragStartCoords.current.y);
    const dragThreshold = (e.touches && e.touches.length > 0) ? 18 : 6;
    if (pixelDx > dragThreshold || pixelDy > dragThreshold) {
      hasDragged.current = true;
      // Blur the textarea immediately when dragging starts so keyboard dismisses
      if (dragTarget.current?.type === 'caption' && editableRef.current) {
        editableRef.current.blur();
      }
    }

    if (dragTarget.current.type === 'slot') {
      if (typeof onUpdateSlotTransform === 'function') {
        const slotIdx = dragTarget.current.idx;
        
        // Handle Pinch to Zoom
        if (e.touches && e.touches.length === 2 && initialPinchDist.current) {
          const dxPinch = e.touches[0].clientX - e.touches[1].clientX;
          const dyPinch = e.touches[0].clientY - e.touches[1].clientY;
          const currentPinchDist = Math.hypot(dxPinch, dyPinch);
          const scaleFactor = currentPinchDist / initialPinchDist.current;
          
          const newScale = Math.max(0.5, Math.min(5.0, initialSlotScale.current * scaleFactor));
          
          onUpdateSlotTransform(slotIdx, (prev) => ({
            ...prev,
            scale: newScale
          }));
        } else {
          // Handle standard dragging
          onUpdateSlotTransform(slotIdx, (prev) => ({
            ...prev,
            offsetX: prev.offsetX + dx,
            offsetY: prev.offsetY + dy
          }));
          dragStartCoords.current = coords; // reset start coords for continuous offset calculation
        }
      }
      return;
    }
    
    if (dragTarget.current.type === 'empty-slot') {
      return;
    }

    if (dragTarget.current.type.startsWith('rotate_')) {
      const centerX = initialLayerPos.current.centerX ?? (initialLayerPos.current.x * canvas.width);
      const centerY = initialLayerPos.current.centerY ?? (headerExtH + initialLayerPos.current.y * canvasH);
      const angleRad = Math.atan2(coords.y - centerY, coords.x - centerX);
      let angleDeg = (angleRad * 180 / Math.PI) + 90; // offset since handle is at top (-90 deg)
      
      let normalizedAngle = ((angleDeg % 360) + 360) % 360;
      // Clean snapping to 0, 90, 180, 270, 360 degrees within 3.5 degrees threshold
      const snapAngles = [0, 90, 180, 270, 360];
      for (const snap of snapAngles) {
        if (Math.abs(normalizedAngle - snap) < 3.5) {
          angleDeg = snap === 360 ? 0 : snap;
          break;
        }
      }

      const newRotation = angleDeg;
      const id = dragTarget.current.id;

      scheduleDragBatch(() => {
        if (!dragTarget.current) return;
        if (dragTarget.current.type === 'rotate_caption' && onUpdateCaptionBounds) {
          onUpdateCaptionBounds(id, { rotation: newRotation });
        } else if (dragTarget.current.type === 'rotate_sticker' && onUpdateStickerBounds) {
          onUpdateStickerBounds(id, { rotation: newRotation });
        } else if (dragTarget.current.type === 'rotate_imageLayer' && onUpdateImageLayerBounds) {
          onUpdateImageLayerBounds(id, { rotation: newRotation });
        }
      });
      return;
    }

    if (dragTarget.current.type.startsWith('resize_imageLayer_')) {
      const id = dragTarget.current.id;
      const imgLayer = imageLayers.find(l => l.id === id);
      if (!imgLayer || !onUpdateImageLayerBounds) return;

      const centerX = initialLayerPos.current.centerX ?? (initialLayerPos.current.x * canvas.width);
      const centerY = initialLayerPos.current.centerY ?? (headerExtH + initialLayerPos.current.y * canvasH);
      const handleType = dragTarget.current.type;

      const initW = initialLayerPos.current.boxWidth || initialLayerPos.current.width || 160;
      const initH = initialLayerPos.current.boxHeight || initialLayerPos.current.height || 160;
      const initScale = initialLayerPos.current.scale || 1.0;
      const isCropping = (imgLayer.fitMode === 'crop') || (initialLayerPos.current.fitMode === 'crop');

      if (isCropping) {
        const initCrop = initialLayerPos.current.crop || { x: 0, y: 0, width: 1, height: 1 };
        const rot = (imgLayer.rotation || 0);
        let naturalFullW = initW / Math.max(0.01, initCrop.width || 1);
        let naturalFullH = initH / Math.max(0.01, initCrop.height || 1);
        const cached = imageCacheRef.current[imgLayer.url];
        if (cached && cached.width && cached.height) {
          const baseW = cached.width;
          const baseH = cached.height;
          const fitScale = Math.min(320 / baseW, 320 / baseH);
          const scale = initialLayerPos.current.scale || imgLayer.scale || 1.0;
          if (!initialLayerPos.current.crop || (initialLayerPos.current.crop.width === 1 && initialLayerPos.current.crop.height === 1)) {
            naturalFullW = baseW * fitScale * scale;
            naturalFullH = baseH * fitScale * scale;
          }
        }

        const localCoords = rotatePoint(coords.x, coords.y, centerX, centerY, -rot);

        if (handleType === 'resize_imageLayer_r') {
          const localLeft = centerX - initW / 2;
          const rawW = localCoords.x - localLeft;
          const maxCropW = Math.max(0.02, 1.0 - (initCrop.x || 0));
          const minCropW = Math.min(maxCropW, Math.max(0.02, 20 / naturalFullW));
          const targetCropW = rawW / naturalFullW;
          const newCropWidth = Math.max(minCropW, Math.min(maxCropW, targetCropW));
          const newW = Math.max(20, Math.round(newCropWidth * naturalFullW));
          const newLocalCenterX = localLeft + newW / 2;
          const newCenter = rotatePoint(newLocalCenterX, centerY, centerX, centerY, rot);

          onUpdateImageLayerBounds(id, {
            x: newCenter.x / canvas.width,
            y: (newCenter.y - headerExtH) / canvasH,
            width: newW,
            boxWidth: newW,
            crop: { ...initCrop, width: newCropWidth },
            fitMode: 'crop'
          });
          return;
        }

        if (handleType === 'resize_imageLayer_l') {
          const localRight = centerX + initW / 2;
          const rawW = localRight - localCoords.x;
          const rightCropEdge = Math.min(1.0, (initCrop.x || 0) + (initCrop.width || 1));
          const maxCropW = Math.max(0.02, rightCropEdge);
          const minCropW = Math.min(maxCropW, Math.max(0.02, 20 / naturalFullW));
          const targetCropW = rawW / naturalFullW;
          const newCropWidth = Math.max(minCropW, Math.min(maxCropW, targetCropW));
          const newCropX = Math.max(0, rightCropEdge - newCropWidth);
          const newW = Math.max(20, Math.round(newCropWidth * naturalFullW));
          const newLocalCenterX = localRight - newW / 2;
          const newCenter = rotatePoint(newLocalCenterX, centerY, centerX, centerY, rot);

          onUpdateImageLayerBounds(id, {
            x: newCenter.x / canvas.width,
            y: (newCenter.y - headerExtH) / canvasH,
            width: newW,
            boxWidth: newW,
            crop: { ...initCrop, x: newCropX, width: newCropWidth },
            fitMode: 'crop'
          });
          return;
        }

        if (handleType === 'resize_imageLayer_b') {
          const localTop = centerY - initH / 2;
          const rawH = localCoords.y - localTop;
          const maxCropH = Math.max(0.02, 1.0 - (initCrop.y || 0));
          const minCropH = Math.min(maxCropH, Math.max(0.02, 20 / naturalFullH));
          const targetCropH = rawH / naturalFullH;
          const newCropHeight = Math.max(minCropH, Math.min(maxCropH, targetCropH));
          const newH = Math.max(20, Math.round(newCropHeight * naturalFullH));
          const newLocalCenterY = localTop + newH / 2;
          const newCenter = rotatePoint(centerX, newLocalCenterY, centerX, centerY, rot);

          onUpdateImageLayerBounds(id, {
            x: newCenter.x / canvas.width,
            y: (newCenter.y - headerExtH) / canvasH,
            height: newH,
            boxHeight: newH,
            crop: { ...initCrop, height: newCropHeight },
            fitMode: 'crop'
          });
          return;
        }

        if (handleType === 'resize_imageLayer_t') {
          const localBottom = centerY + initH / 2;
          const rawH = localBottom - localCoords.y;
          const bottomCropEdge = Math.min(1.0, (initCrop.y || 0) + (initCrop.height || 1));
          const maxCropH = Math.max(0.02, bottomCropEdge);
          const minCropH = Math.min(maxCropH, Math.max(0.02, 20 / naturalFullH));
          const targetCropH = rawH / naturalFullH;
          const newCropHeight = Math.max(minCropH, Math.min(maxCropH, targetCropH));
          const newCropY = Math.max(0, bottomCropEdge - newCropHeight);
          const newH = Math.max(20, Math.round(newCropHeight * naturalFullH));
          const newLocalCenterY = localBottom - newH / 2;
          const newCenter = rotatePoint(centerX, newLocalCenterY, centerX, centerY, rot);

          onUpdateImageLayerBounds(id, {
            x: newCenter.x / canvas.width,
            y: (newCenter.y - headerExtH) / canvasH,
            height: newH,
            boxHeight: newH,
            crop: { ...initCrop, y: newCropY, height: newCropHeight },
            fitMode: 'crop'
          });
          return;
        }

        // In crop mode, corner resize is disabled
        return;
      }

      const nextFitMode = (!imgLayer.fitMode || imgLayer.fitMode === 'fit') ? 'stretch' : imgLayer.fitMode;

      if (handleType === 'resize_imageLayer_l' || handleType === 'resize_imageLayer_r') {
        // Horizontal stretch / crop
        const currentAngle = (imgLayer.rotation || 0);
        const localCoords = rotatePoint(coords.x, coords.y, centerX, centerY, -currentAngle);
        const horizontalDist = Math.abs(localCoords.x - centerX);
        const newWidth = Math.max(30, Math.round(horizontalDist * 2));

        onUpdateImageLayerBounds(id, {
          width: newWidth,
          boxWidth: newWidth,
          height: initH,
          boxHeight: initH,
          fitMode: nextFitMode
        });
        return;
      }

      if (handleType === 'resize_imageLayer_t' || handleType === 'resize_imageLayer_b') {
        // Vertical stretch / crop
        const currentAngle = (imgLayer.rotation || 0);
        const localCoords = rotatePoint(coords.x, coords.y, centerX, centerY, -currentAngle);
        const verticalDist = Math.abs(localCoords.y - centerY);
        const newHeight = Math.max(30, Math.round(verticalDist * 2));

        onUpdateImageLayerBounds(id, {
          width: initW,
          boxWidth: initW,
          height: newHeight,
          boxHeight: newHeight,
          fitMode: nextFitMode
        });
        return;
      }

      // Corner handles: uniform proportional scaling
      const currentDist = Math.hypot(coords.x - centerX, coords.y - centerY);
      const initDist = initialLayerPos.current.initialDist || 50;
      const scaleFactor = Math.max(0.05, currentDist / initDist);

      const newWidth = Math.max(30, Math.round(initW * scaleFactor));
      const newHeight = Math.max(30, Math.round(initH * scaleFactor));
      const newScale = Math.max(0.1, Math.min(10.0, Number((initScale * scaleFactor).toFixed(2))));

      onUpdateImageLayerBounds(id, { 
        width: newWidth, 
        height: newHeight, 
        boxWidth: newWidth, 
        boxHeight: newHeight, 
        scale: newScale 
      });
      return;
    }
    
    if (dragTarget.current.type.startsWith('resize_sticker_')) {
      const id = dragTarget.current.id;
      const stk = stickers.find(s => s.id === id);
      if (!stk || !onUpdateStickerBounds) return;

      const centerX = initialLayerPos.current.centerX ?? (initialLayerPos.current.x * canvas.width);
      const centerY = initialLayerPos.current.centerY ?? (headerExtH + initialLayerPos.current.y * canvasH);

      const currentDist = Math.hypot(coords.x - centerX, coords.y - centerY);
      const initDist = initialLayerPos.current.initialDist || Math.max(10, getStickerBoxSize(stk) * 0.7);
      const initScale = initialLayerPos.current.scale || 1.0;

      const scaleFactor = currentDist / initDist;
      const newScale = Math.max(0.2, Math.min(20.0, Number((initScale * scaleFactor).toFixed(2))));
      onUpdateStickerBounds(id, { scale: newScale });
      return;
    }
    
    if (dragTarget.current.type.startsWith('resize_caption_')) {
      const id = dragTarget.current.id;
      const cap = captions.find(c => c.id === id);
      if (!cap || !onUpdateCaptionBounds) return;

      const centerX = initialLayerPos.current.centerX ?? (initialLayerPos.current.x * canvas.width);
      const centerY = initialLayerPos.current.centerY ?? (headerExtH + initialLayerPos.current.y * canvasH);
      const rot = initialLayerPos.current.rotation || 0;
      const handleType = dragTarget.current.type;

      // Transform pointer coordinates into layer's local rotated coordinate space!
      const localCoords = rotatePoint(coords.x, coords.y, centerX, centerY, -rot);

      // Safe bounds limit inside canvas box with safety margin (8px)
      const edgePad = 8;
      const rad = Math.abs((rot * Math.PI) / 180);
      const cosR = Math.abs(Math.cos(rad));
      const sinR = Math.abs(Math.sin(rad));
      const maxAvailX = Math.max(20, Math.min(centerX - edgePad, canvas.width - centerX - edgePad));
      const maxAvailY = Math.max(20, Math.min(centerY - edgePad, canvas.height - centerY - edgePad));

      if (handleType === 'resize_caption_l' || handleType === 'resize_caption_r') {
        const localDx = localCoords.x - centerX;
        const rawHalfWidth = handleType === 'resize_caption_r'
          ? Math.max(30, localDx)
          : Math.max(30, -localDx);

        // Clamp width so box never expands outside the canvas box
        const currentH = initialLayerPos.current.initialBoxHeight || initialLayerPos.current.boxHeight || 60;
        let maxAllowedHalfW = canvas.width / 2 - edgePad;

        if (cosR > 0.08) {
          const limitFromX = (maxAvailX - (currentH / 2) * sinR) / cosR;
          maxAllowedHalfW = Math.min(maxAllowedHalfW, Math.max(30, limitFromX));
        }
        if (sinR > 0.08) {
          const limitFromY = (maxAvailY - (currentH / 2) * cosR) / sinR;
          maxAllowedHalfW = Math.min(maxAllowedHalfW, Math.max(30, limitFromY));
        }

        const halfWidth = Math.max(30, Math.min(maxAllowedHalfW, rawHalfWidth));
        const newBoxWidthPx = halfWidth * 2;
        const newWidth = Math.max(0.15, Math.min(0.98, Number((newBoxWidthPx / canvas.width).toFixed(3))));

        onUpdateCaptionBounds(id, { 
          width: newWidth,
          hasCustomWidth: true
        });
        return;
      }

      // Corner handles: proportional scaling
      const localDx = localCoords.x - centerX;
      const localDy = localCoords.y - centerY;
      const initDist = initialLayerPos.current.initialDist || 50;

      // Projection along the corner diagonal vector for natural, smooth scaling
      const initRelX = initialLayerPos.current.handleRelX || (handleType.includes('r') ? 50 : -50);
      const initRelY = initialLayerPos.current.handleRelY || (handleType.includes('b') ? 50 : -50);
      const proj = (localDx * initRelX + localDy * initRelY) / (initDist * initDist);

      // Clamp scaleFactor so the resized text element box stays strictly inside canvas boundaries
      const initW = initialLayerPos.current.initialBoxWidth || initialLayerPos.current.boxWidth || 100;
      const initH = initialLayerPos.current.initialBoxHeight || initialLayerPos.current.boxHeight || 60;
      const initHalfExtentX = Math.max(20, (initW / 2) * cosR + (initH / 2) * sinR);
      const initHalfExtentY = Math.max(20, (initW / 2) * sinR + (initH / 2) * cosR);

      const maxScaleX = maxAvailX / initHalfExtentX;
      const maxScaleY = maxAvailY / initHalfExtentY;
      const maxAllowedScale = Math.max(0.35, Math.min(maxScaleX, maxScaleY));

      const scaleFactor = Math.max(0.1, Math.min(maxAllowedScale, proj));

      const isSocial = isSocialCardCaption(cap);
      const defaultCardWidth = cap.isWhatsAppCard ? 0.84 : 0.88;
      const initFontSize = initialLayerPos.current.initialFontSize || cap.fontSize || (isSocial ? 16 : 50);
      const newFontSize = Math.max(10, Math.min(220, Math.round(initFontSize * scaleFactor)));

      const initWidth = initialLayerPos.current.initialWidth || cap.width || (isSocial ? defaultCardWidth : 0.9);
      const newWidth = Math.max(0.15, Math.min(0.98, Number((initWidth * scaleFactor).toFixed(3))));

      onUpdateCaptionBounds(id, { 
        fontSize: newFontSize,
        width: newWidth
      });
      return;
    }

    // Standard translation
    const targetId = dragTarget.current.id;
    let newX = initialLayerPos.current.x + dx;
    let newY = initialLayerPos.current.y + dy;

    if (dragTarget.current.type === 'caption') {
      const rot = initialLayerPos.current.rotation || 0;
      const rad = Math.abs((rot * Math.PI) / 180);
      const bW = initialLayerPos.current.boxWidth || ((initialLayerPos.current.width || 0.5) * canvas.width) || 100;
      const bH = initialLayerPos.current.boxHeight || 60;
      const halfExtX = (bW / 2) * Math.abs(Math.cos(rad)) + (bH / 2) * Math.abs(Math.sin(rad));
      const halfExtY = (bW / 2) * Math.abs(Math.sin(rad)) + (bH / 2) * Math.abs(Math.cos(rad));
      const edgePad = 8;
      const minX = Math.min(0.5, (halfExtX + edgePad) / canvas.width);
      const maxX = Math.max(0.5, (canvas.width - halfExtX - edgePad) / canvas.width);
      const isHeaderOrFooter = dragTarget.current?.isHeaderCaption || dragTarget.current?.isFooterCaption;
      const effectiveCanvasH = isHeaderOrFooter ? canvas.height : canvasH;
      const minY = Math.min(0.5, (halfExtY + edgePad) / effectiveCanvasH);
      const maxY = Math.max(0.5, (effectiveCanvasH - halfExtY - edgePad) / effectiveCanvasH);
      newX = Math.max(minX, Math.min(maxX, newX));
      newY = Math.max(minY, Math.min(maxY, newY));
    }

    const SNAP_DIST = 0.015;

    let snapH = null;
    let snapV = null;
    
    // 1. Center Snapping
    if (Math.abs(newX - 0.5) < SNAP_DIST) { newX = 0.5; snapV = 0.5; }
    if (Math.abs(newY - 0.5) < SNAP_DIST) { newY = 0.5; snapH = 0.5; }

    // 2. Layer-to-Layer Snapping
    captions.forEach((c) => {
      if (c.id !== targetId) {
        if (Math.abs(newX - c.x) < SNAP_DIST) { newX = c.x; snapV = c.x; }
        if (Math.abs(newY - c.y) < SNAP_DIST) { newY = c.y; snapH = c.y; }
      }
    });
    stickers.forEach((s) => {
      if (s.id !== targetId) {
        if (Math.abs(newX - s.x) < SNAP_DIST) { newX = s.x; snapV = s.x; }
        if (Math.abs(newY - s.y) < SNAP_DIST) { newY = s.y; snapH = s.y; }
      }
    });
    (imageLayers || []).forEach((img) => {
      if (img.id !== targetId) {
        if (Math.abs(newX - img.x) < SNAP_DIST) { newX = img.x; snapV = img.x; }
        if (Math.abs(newY - img.y) < SNAP_DIST) { newY = img.y; snapH = img.y; }
      }
    });
    
    snappingLines.current = { horizontal: snapH, vertical: snapV };

    scheduleDragBatch(() => {
      if (!dragTarget.current) return;
      if (dragTarget.current.type === 'caption' && onUpdateCaptionBounds) {
        const isHeaderOrFooter = dragTarget.current?.isHeaderCaption || dragTarget.current?.isFooterCaption;
        if (isHeaderOrFooter) {
          dragTarget.current.hasCustomPos = true;
        }
        onUpdateCaptionBounds(dragTarget.current.id, { 
          x: newX, 
          y: newY,
          ...(isHeaderOrFooter ? { hasCustomPos: true } : {})
        });
      } else if (dragTarget.current.type === 'sticker' && onUpdateStickerBounds) {
        onUpdateStickerBounds(dragTarget.current.id, { x: newX, y: newY });
      } else if (dragTarget.current.type === 'imageLayer' && onUpdateImageLayerBounds) {
        onUpdateImageLayerBounds(dragTarget.current.id, { x: newX, y: newY });
      } else if (dragTarget.current.type === 'imageLayer' && onUpdateImageLayerPosition) {
        onUpdateImageLayerPosition(dragTarget.current.id, newX, newY);
      }
    });
  };

  const handleWheel = (e) => {
    if (!activeIsNativeLayout || !activeLayoutDef || !onUpdateSlotTransform) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const coords = getCanvasCoords(e);
    
    const totalSlots = activeLayoutDef.slots;
    const isVert = activeLayoutDef.id === '2-vert' || activeLayoutDef.id === '3-stacked';
    const isHoriz = activeLayoutDef.id === '2-horiz' || activeLayoutDef.id === '3-horiz';
    const isGrid = activeLayoutDef.id === '4-grid';
    const isHybrid = activeLayoutDef.id === '3-hybrid';

    let hitSlotIdx = -1;
    for (let idx = 0; idx < totalSlots; idx++) {
      let x = 0, y = headerExtH, slotW = canvasW, slotH = canvasH;
      if (isVert) { slotH = canvasH / totalSlots; y = headerExtH + idx * slotH; }
      else if (isHoriz) { slotW = canvasW / totalSlots; x = idx * slotW; y = headerExtH; }
      else if (isGrid) { slotW = canvasW / 2; slotH = canvasH / 2; x = (idx % 2) * slotW; y = headerExtH + Math.floor(idx / 2) * slotH; }
      else if (isHybrid) {
        if (idx === 0) { slotW = canvasW; slotH = canvasH / 2; x = 0; y = headerExtH; }
        else { slotW = canvasW / 2; slotH = canvasH / 2; x = (idx - 1) * slotW; y = headerExtH + canvasH / 2; }
      }
      if (coords.x >= x && coords.x <= x + slotW && coords.y >= y && coords.y <= y + slotH) {
        hitSlotIdx = idx;
        break;
      }
    }

    if (hitSlotIdx !== -1 && slotImages && slotImages[hitSlotIdx]) {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      onUpdateSlotTransform(hitSlotIdx, (prev) => {
        const prevScale = prev?.scale || 1.5;
        const newScale = Math.max(0.4, Math.min(6.0, Number((prevScale * zoomFactor).toFixed(2))));
        return {
          ...prev,
          scale: newScale
        };
      });
    }
  };

  usePointerListeners({
    wrapperRef, editableRef, isDragging, isDrawingActive,
    handlePointerDown, handlePointerMove, handlePointerEnd
  });

  return { handlePointerDown, handleTextOverlayPointerDown, handleTextOverlayPointerEnd, handlePointerEnd, handlePointerMove, handleWheel };
}
