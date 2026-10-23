import { getFilterCss, drawImageFiltered } from '../../../data/photoFilters';
import { isColorDark } from '../../../utils/captionLayout';
import { drawCurvedText, drawRoundRect, drawTextLineWithEffect, getCurveSagitta, wrapText } from '../draw/text';
import { drawWhatsAppCard, getWhatsAppCardHeight } from '../draw/socialCards/whatsapp';
import { sampleFaceLighting } from '../draw/faceLighting';
import { renderDieCutEmoji, renderDieCutImage } from '../draw/dieCut';
import { drawBreakingNewsChyron, getBreakingNewsHeight } from '../draw/chyron';
import { drawTweetCard, getTweetCardHeight } from '../draw/socialCards/tweet';
import { drawInstagramCard, getInstagramCardHeight } from '../draw/socialCards/instagram';
import { drawSpeechBubble } from '../draw/speechBubble';

// Draws the whole meme onto the editor canvas (and attaches the face-morph helpers
// the editor calls on the canvas element). Called by CanvasEditor whenever its inputs change.
export function renderScene(scene) {
  const {
    activeCaption, activeFilters, activeIsNativeLayout, activeLayerId, activeLayoutDef,
    baseImgRef, canvasBgColor, canvasFlipX, canvasFooter, canvasH, canvasHeader, canvasRef,
    canvasW, captions, compCanvasRef, demotivational, dragTarget, drawings, footerExtH,
    getCaptionCenterY, getImageLayerCenterY, getStickerCenterY, headerExtH, imageCacheRef,
    imageFit, imageLayers, imgSrc, isDragging, isDrawingMode, isFooterEnabled, isHeaderEnabled,
    isNativeLayout, liveBgColor, loadingMediaRef, naturalSize, setNaturalSize, slotImages,
    slotTransforms, snappingLines, stickers, totalCanvasH, watermark
  } = scene;

  const canvas = canvasRef.current;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Methods for Face Morphing Studio
  canvas.sampleFaceLighting = (normX, normY, normRadius = 0.14) => {
    const cx = normX * canvasW;
    const cy = headerExtH + normY * canvasH;
    const r = normRadius * canvasW;
    return sampleFaceLighting(ctx, cx, cy, r);
  };

  canvas.extractFacePatch = (normX, normY, normRadius = 0.14, outputSize = 400) => {
    const cx = normX * canvasW;
    const cy = headerExtH + normY * canvasH;
    const r = normRadius * canvasW;
    const side = Math.max(80, r * 2.3);
    const sx = Math.max(0, Math.min(canvasW - side, cx - side / 2));
    const sy = Math.max(0, Math.min(totalCanvasH - side, cy - side / 2));
    const sw = Math.min(side, canvasW - sx);
    const sh = Math.min(side, totalCanvasH - sy);

    const patchCanvas = document.createElement('canvas');
    patchCanvas.width = outputSize;
    patchCanvas.height = outputSize;
    const pCtx = patchCanvas.getContext('2d');
    pCtx.drawImage(canvas, sx, sy, sw, sh, 0, 0, outputSize, outputSize);
    return {
      canvas: patchCanvas,
      dataUrl: patchCanvas.toDataURL('image/png'),
    };
  };

  canvas.getBaseImageElement = () => {
    return baseImgRef.current;
  };

  canvas.bakeLayerIntoBase = (layerId) => {
    const layer = (imageLayers || []).find((l) => l.id === layerId);
    if (!layer) return null;

    const baseImg = baseImgRef.current;
    const bW = baseImg ? (baseImg.naturalWidth || baseImg.width || 800) : canvasW;
    const bH = baseImg ? (baseImg.naturalHeight || baseImg.height || 800) : canvasH;

    const offCanvas = document.createElement('canvas');
    offCanvas.width = bW;
    offCanvas.height = bH;
    const oCtx = offCanvas.getContext('2d');

    if (baseImg) {
      oCtx.drawImage(baseImg, 0, 0, bW, bH);
    } else {
      oCtx.fillStyle = '#ffffff';
      oCtx.fillRect(0, 0, bW, bH);
    }

    const cached = imageCacheRef.current[layer.url];
    if (cached) {
      const lX = (layer.x !== undefined ? layer.x : 0.5) * bW;
      const lY = (layer.y !== undefined ? layer.y : 0.38) * bH;
      const lScale = layer.scale || 1.0;
      const maxDim = 320;
      const cW = cached.naturalWidth || cached.width || 200;
      const cH = cached.naturalHeight || cached.height || 200;
      const fitScale = Math.min(maxDim / cW, maxDim / cH);
      const w = (layer.boxWidth || layer.width || (cW * fitScale * lScale)) * (bW / canvasW);
      const h = (layer.boxHeight || layer.height || (cH * fitScale * lScale)) * (bH / canvasH);

      const imgAspect = cW / cH;
      const boxAspect = w / h;
      let drawW = w;
      let drawH = h;
      if (boxAspect > imgAspect) {
        drawH = h;
        drawW = h * imgAspect;
      } else {
        drawW = w;
        drawH = w / imgAspect;
      }

      oCtx.save();
      oCtx.translate(lX, lY);
      if (layer.rotation) oCtx.rotate((layer.rotation * Math.PI) / 180);
      if (layer.flipX) oCtx.scale(-1, 1);
      if (layer.opacity !== undefined) oCtx.globalAlpha = layer.opacity;

      oCtx.beginPath();
      if (layer.isFaceMorph) {
        oCtx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
      } else {
        oCtx.rect(-w / 2, -h / 2, w, h);
      }
      oCtx.clip();
      oCtx.drawImage(cached, -drawW / 2, -drawH / 2, drawW, drawH);
      oCtx.restore();
    }

    return offCanvas.toDataURL('image/png');
  };

  canvas.exportCleanImage = (format = 'image/png', quality = 0.92) => {
    renderCanvas(baseImgRef.current, true);
    const res = canvas.toDataURL(format, quality);
    renderCanvas(baseImgRef.current, false);
    return res;
  };

  const renderCanvas = (img, skipHandles = false) => {
    if (typeof window !== 'undefined') {
      window.__memeCanvasForceRender = () => {
        renderCanvas(baseImgRef.current, false);
      };
    }
    if (canvas.width !== canvasW) canvas.width = canvasW;
    if (canvas.height !== totalCanvasH) canvas.height = totalCanvasH;

    const filterScope = activeFilters?.filterScope || 'all';
    const filterCss = getFilterCss(activeFilters);
    const applyGlobalFilter = filterScope === 'all' && filterCss !== 'none';
    const bgFilterCss = applyGlobalFilter ? 'none' : (filterScope === 'background' ? filterCss : 'none');

    let targetCtx = ctx;
    let compCanvas = null;

    if (applyGlobalFilter) {
      if (!compCanvasRef.current) {
        compCanvasRef.current = document.createElement('canvas');
      }
      compCanvas = compCanvasRef.current;
      if (compCanvas.width !== canvasW) compCanvas.width = canvasW;
      if (compCanvas.height !== totalCanvasH) compCanvas.height = totalCanvasH;
      targetCtx = compCanvas.getContext('2d');
    }

    targetCtx.clearRect(0, 0, canvas.width, canvas.height);
    targetCtx.fillStyle = demotivational?.enabled ? '#000000' : liveBgColor;
    targetCtx.fillRect(0, 0, canvas.width, canvas.height);

    let activeHandleDrawer = null;

    // Modern UI Handle Drawer Helpers (Matches User Reference Image: Coral Outline, White Badges, Top-Left ✕, Bottom-Right ⤢, Side Capsules)
    const THEME_CORAL = '#f06853';
    const THEME_GLOW = 'rgba(240, 104, 83, 0.45)';
    const THEME_BADGE_BG = '#ffffff';

    // 1. Selection Box Outline (Smooth rounded rectangle with soft coral glow)
    const drawSelectionBox = (uiCtx, bx, by, bw, bh, radius = 10) => {
      uiCtx.save();
      uiCtx.shadowColor = THEME_GLOW;
      uiCtx.shadowBlur = 8;
      uiCtx.shadowOffsetY = 0;
      uiCtx.strokeStyle = THEME_CORAL;
      uiCtx.lineWidth = 2.4;
      uiCtx.beginPath();
      if (uiCtx.roundRect) {
        uiCtx.roundRect(bx, by, bw, bh, radius);
      } else {
        uiCtx.rect(bx, by, bw, bh);
      }
      uiCtx.stroke();
      uiCtx.restore();
    };

    // 2. Delete Handle (Top-Left corner handle: crisp white circular badge, coral border & coral ✕ icon, increased size)
    const drawDeleteHandle = (uiCtx, hx, hy) => {
      uiCtx.save();
      uiCtx.shadowColor = 'rgba(0, 0, 0, 0.28)';
      uiCtx.shadowBlur = 6;
      uiCtx.shadowOffsetY = 1.5;

      // Button background circle (increased to radius 18)
      uiCtx.beginPath();
      uiCtx.arc(hx, hy, 18, 0, Math.PI * 2);
      uiCtx.fillStyle = THEME_BADGE_BG;
      uiCtx.fill();

      // Coral border
      uiCtx.strokeStyle = THEME_CORAL;
      uiCtx.lineWidth = 2.4;
      uiCtx.stroke();

      // Coral ✕ inside (scaled up to match radius 18)
      uiCtx.shadowColor = 'transparent';
      uiCtx.beginPath();
      uiCtx.strokeStyle = THEME_CORAL;
      uiCtx.lineWidth = 2.4;
      uiCtx.lineCap = 'round';
      const cr = 5.5;
      uiCtx.moveTo(hx - cr, hy - cr);
      uiCtx.lineTo(hx + cr, hy + cr);
      uiCtx.moveTo(hx + cr, hy - cr);
      uiCtx.lineTo(hx - cr, hy + cr);
      uiCtx.stroke();
      uiCtx.restore();
    };

    // 3. Resize Handle (Bottom-Right corner handle: crisp white circular badge, coral border & diagonal double-arrows ⤢, increased size)
    const drawResizeHandle = (uiCtx, hx, hy) => {
      uiCtx.save();
      uiCtx.shadowColor = 'rgba(0, 0, 0, 0.28)';
      uiCtx.shadowBlur = 6;
      uiCtx.shadowOffsetY = 1.5;

      // Button background circle (increased to radius 18)
      uiCtx.beginPath();
      uiCtx.arc(hx, hy, 18, 0, Math.PI * 2);
      uiCtx.fillStyle = THEME_BADGE_BG;
      uiCtx.fill();

      uiCtx.strokeStyle = THEME_CORAL;
      uiCtx.lineWidth = 2.4;
      uiCtx.stroke();

      // Diagonal double-arrow icon inside (scaled up for radius 18)
      uiCtx.shadowColor = 'transparent';
      uiCtx.strokeStyle = THEME_CORAL;
      uiCtx.lineWidth = 2.4;
      uiCtx.lineCap = 'round';
      uiCtx.lineJoin = 'round';

      // Inside-out diagonal connecting stem (from inside/top-left to outside/bottom-right)
      uiCtx.beginPath();
      uiCtx.moveTo(hx - 5.5, hy - 5.5);
      uiCtx.lineTo(hx + 5.5, hy + 5.5);
      uiCtx.stroke();

      // Inward arrowhead ↖ (pointing inside toward box center)
      uiCtx.beginPath();
      uiCtx.moveTo(hx - 1.5, hy - 5.5);
      uiCtx.lineTo(hx - 5.5, hy - 5.5);
      uiCtx.lineTo(hx - 5.5, hy - 1.5);
      uiCtx.stroke();

      // Outward arrowhead ↘ (pointing outside away from box)
      uiCtx.beginPath();
      uiCtx.moveTo(hx + 1.5, hy + 5.5);
      uiCtx.lineTo(hx + 5.5, hy + 5.5);
      uiCtx.lineTo(hx + 5.5, hy + 1.5);
      uiCtx.stroke();

      uiCtx.restore();
    };

    // 4. Corner Knob (fallback if ever needed)
    const drawRoundHandle = (uiCtx, hx, hy) => {
      drawResizeHandle(uiCtx, hx, hy);
    };

    // 5. Side Stretch Handle (Crisp white rounded capsule for width stretching)
    const drawSideHandle = (uiCtx, hx, hy, isVertical = true) => {
      uiCtx.save();
      uiCtx.shadowColor = 'rgba(0, 0, 0, 0.25)';
      uiCtx.shadowBlur = 5;
      uiCtx.shadowOffsetY = 1;

      uiCtx.beginPath();
      if (isVertical) {
        if (uiCtx.roundRect) {
          uiCtx.roundRect(hx - 4, hy - 13, 8, 26, 4);
        } else {
          uiCtx.rect(hx - 4, hy - 13, 8, 26);
        }
      } else {
        if (uiCtx.roundRect) {
          uiCtx.roundRect(hx - 13, hy - 4, 26, 8, 4);
        } else {
          uiCtx.rect(hx - 13, hy - 4, 26, 8);
        }
      }
      uiCtx.fillStyle = THEME_BADGE_BG;
      uiCtx.fill();
      uiCtx.strokeStyle = THEME_CORAL;
      uiCtx.lineWidth = 2;
      uiCtx.stroke();
      uiCtx.restore();
    };

    // 6. Rotation Handle (Clean vertical stem + crisp white rotation knob with circular arrow)
    const drawRotateHandle = (uiCtx, startX, startY, knobX, knobY) => {
      uiCtx.save();
      // Rotation stem
      uiCtx.strokeStyle = THEME_CORAL;
      uiCtx.lineWidth = 1.8;
      uiCtx.beginPath();
      uiCtx.moveTo(startX, startY);
      uiCtx.lineTo(knobX, knobY);
      uiCtx.stroke();

      // Rotation knob
      uiCtx.shadowColor = 'rgba(0, 0, 0, 0.28)';
      uiCtx.shadowBlur = 6;
      uiCtx.shadowOffsetY = 1.5;
      uiCtx.beginPath();
      uiCtx.arc(knobX, knobY, 15, 0, Math.PI * 2);
      uiCtx.fillStyle = THEME_BADGE_BG;
      uiCtx.fill();
      uiCtx.strokeStyle = THEME_CORAL;
      uiCtx.lineWidth = 2.2;
      uiCtx.stroke();

      // Circular rotate icon inside knob
      uiCtx.shadowColor = 'transparent';
      uiCtx.strokeStyle = THEME_CORAL;
      uiCtx.lineWidth = 2;
      uiCtx.lineCap = 'round';
      uiCtx.beginPath();
      uiCtx.arc(knobX, knobY, 6.5, -Math.PI * 0.7, Math.PI * 0.8);
      uiCtx.stroke();

      // Arrowhead
      uiCtx.fillStyle = THEME_CORAL;
      uiCtx.beginPath();
      uiCtx.moveTo(knobX + 4.5, knobY + 4.5);
      uiCtx.lineTo(knobX + 8, knobY);
      uiCtx.lineTo(knobX + 4, knobY - 3);
      uiCtx.fill();
      uiCtx.restore();
    };

    // Available image area (below header extension if active)
    let imageAreaX = 0;
    let imageAreaY = headerExtH;
    let imageAreaW = canvasW;
    let imageAreaH = canvasH;

    if (demotivational?.enabled) {
      const sidePad = Math.round(canvasW * 0.08);
      const topPad = Math.round(canvasH * 0.08);
      const botPad = Math.max(160, Math.round(canvasH * 0.28));
      imageAreaX = sidePad;
      imageAreaY = headerExtH + topPad;
      imageAreaW = canvasW - sidePad * 2;
      imageAreaH = canvasH - topPad - botPad;
    }

    // Draw Base Image or Native Layout Slots
    if (activeIsNativeLayout && activeLayoutDef) {
      const totalSlots = activeLayoutDef.slots;
      const isVert = activeLayoutDef.id === '2-vert' || activeLayoutDef.id === '3-stacked';
      const isHoriz = activeLayoutDef.id === '2-horiz' || activeLayoutDef.id === '3-horiz';
      const isGrid = activeLayoutDef.id === '4-grid';
      const isHybrid = activeLayoutDef.id === '3-hybrid';

      for (let idx = 0; idx < totalSlots; idx++) {
        let x = 0, y = 0, slotW = imageAreaW, slotH = imageAreaH;

        if (isVert) {
          slotH = imageAreaH / totalSlots;
          y = idx * slotH;
        } else if (isHoriz) {
          slotW = imageAreaW / totalSlots;
          x = idx * slotW;
        } else if (isGrid) {
          slotW = imageAreaW / 2;
          slotH = imageAreaH / 2;
          x = (idx % 2) * slotW;
          y = Math.floor(idx / 2) * slotH;
        } else if (isHybrid) {
          if (idx === 0) {
            slotW = imageAreaW;
            slotH = imageAreaH / 2;
            x = 0;
            y = 0;
          } else {
            slotW = imageAreaW / 2;
            slotH = imageAreaH / 2;
            x = (idx - 1) * slotW;
            y = imageAreaH / 2;
          }
        }

        const src = slotImages[idx];
        if (src) {
          const cached = imageCacheRef.current[src];
          if (cached) {
            const tx = slotTransforms[idx] || { offsetX: 0, offsetY: 0, scale: 1.5 };
            const scale = Math.min(slotW / cached.width, slotH / cached.height) * (tx.scale || 1.0);
            const nw = cached.width * scale;
            const nh = cached.height * scale;
            const nx = x + (slotW - nw) / 2 + (tx.offsetX * slotW);
            const ny = imageAreaY + y + (slotH - nh) / 2 + (tx.offsetY * slotH);

            targetCtx.save();
            targetCtx.beginPath();
            targetCtx.rect(x, imageAreaY + y, slotW, slotH);
            targetCtx.clip();
            if (canvasFlipX) {
              targetCtx.translate(x + slotW / 2, 0);
              targetCtx.scale(-1, 1);
              targetCtx.translate(-(x + slotW / 2), 0);
            }
            try {
              drawImageFiltered(targetCtx, cached, bgFilterCss, nx, ny, nw, nh);
            } catch (err) {
              console.warn('Failed to draw slot image:', err);
            }
            targetCtx.restore();
          } else {
            // Load image and re-render
            const newImg = new Image();
            if (src && !src.startsWith('blob:') && !src.startsWith('data:')) newImg.crossOrigin = 'anonymous';
            newImg.onload = () => {
              imageCacheRef.current[src] = newImg;
              if (baseImgRef.current || activeIsNativeLayout) renderCanvas(baseImgRef.current);
            };
            newImg.src = src;
            
            targetCtx.fillStyle = liveBgColor;
            targetCtx.fillRect(x, imageAreaY + y, slotW, slotH);
          }
        } else {
          targetCtx.fillStyle = liveBgColor;
          targetCtx.fillRect(x, imageAreaY + y, slotW, slotH);
        }

        if (activeLayoutDef.id !== '1-panel' && totalSlots > 1) {
          targetCtx.strokeStyle = '#000000';
          targetCtx.lineWidth = 2;
          targetCtx.strokeRect(x, imageAreaY + y, slotW, slotH);
        }
      }
    } else if (img && !isNativeLayout) {
      let drawW = imageAreaW;
      let drawH = imageAreaH;
      let offsetX = 0;
      let offsetY = imageAreaY;

      if (imageFit === 'stretch') {
        drawW = imageAreaW;
        drawH = imageAreaH;
        offsetX = imageAreaX;
        offsetY = imageAreaY;
      } else if (imageFit === 'contain') {
        const imgRatio = img.width / img.height;
        const canvasRatio = imageAreaW / imageAreaH;

        if (imgRatio > canvasRatio) {
          drawW = imageAreaW;
          drawH = imageAreaW / imgRatio;
          offsetX = imageAreaX;
          offsetY = imageAreaY + (imageAreaH - drawH) / 2;
        } else {
          drawH = imageAreaH;
          drawW = imageAreaH * imgRatio;
          offsetY = imageAreaY;
          offsetX = imageAreaX + (imageAreaW - drawW) / 2;
        }
      } else {
        const imgRatio = img.width / img.height;
        const canvasRatio = imageAreaW / imageAreaH;

        if (imgRatio > canvasRatio) {
          drawH = imageAreaH;
          drawW = imageAreaH * imgRatio;
          offsetX = imageAreaX + (imageAreaW - drawW) / 2;
          offsetY = imageAreaY;
        } else {
          drawW = imageAreaW;
          drawH = imageAreaW / imgRatio;
          offsetY = imageAreaY + (imageAreaH - drawH) / 2;
          offsetX = imageAreaX;
        }
      }
      targetCtx.save();
      if (canvasFlipX) {
        targetCtx.translate(imageAreaX + imageAreaW / 2, 0);
        targetCtx.scale(-1, 1);
        targetCtx.translate(-(imageAreaX + imageAreaW / 2), 0);
      }
      if (demotivational?.enabled) {
        targetCtx.beginPath();
        targetCtx.rect(imageAreaX, imageAreaY, imageAreaW, imageAreaH);
        targetCtx.clip();
      }
      drawImageFiltered(targetCtx, img, bgFilterCss, offsetX, offsetY, drawW, drawH);
      targetCtx.restore();

      if (demotivational?.enabled) {
        targetCtx.save();
        targetCtx.strokeStyle = '#ffffff';
        targetCtx.lineWidth = 2;
        targetCtx.strokeRect(imageAreaX - 5, imageAreaY - 5, imageAreaW + 10, imageAreaH + 10);
        targetCtx.restore();
      }
    }

    // Draw Header Extension (Banner extending above canvas)
    if (isHeaderEnabled && headerExtH > 0) {
      targetCtx.save();
      // 1. Solid background for header extension (matches canvas background color)
      const extBg = liveBgColor || canvasBgColor || canvasHeader?.bgColor || '#ffffff';
      targetCtx.fillStyle = extBg;
      targetCtx.fillRect(0, 0, canvasW, headerExtH);

      // 2. Crisp boundary divider line between header extension and meme image
      const isDark = isColorDark(extBg);
      targetCtx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)';
      targetCtx.lineWidth = 1;
      targetCtx.beginPath();
      targetCtx.moveTo(0, headerExtH);
      targetCtx.lineTo(canvasW, headerExtH);
      targetCtx.stroke();
      targetCtx.restore();
    }

    // Draw Footer Extension (Banner extending below canvas)
    if (isFooterEnabled && footerExtH > 0) {
      targetCtx.save();
      const footerY = headerExtH + canvasH;
      // 1. Solid background for footer extension (matches canvas background color)
      const extBg = liveBgColor || canvasBgColor || canvasFooter?.bgColor || '#ffffff';
      targetCtx.fillStyle = extBg;
      targetCtx.fillRect(0, footerY, canvasW, footerExtH);

      // 2. Crisp boundary divider line between meme image and footer extension
      const isDark = isColorDark(extBg);
      targetCtx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)';
      targetCtx.lineWidth = 1;
      targetCtx.beginPath();
      targetCtx.moveTo(0, footerY);
      targetCtx.lineTo(canvasW, footerY);
      targetCtx.stroke();
      targetCtx.restore();
    }

    // Reset filter for text/stickers/image-layers overlay (safe on all browsers)
    try { targetCtx.filter = 'none'; } catch(e) {}

    // Render Custom Image Overlay Layers
          const allLayers = [
      ...(imageLayers || []).map(l => ({ ...l, _type: 'imageLayer', zIndex: l.zIndex || 0 })),
      ...(stickers || []).map(l => ({ ...l, _type: 'sticker', zIndex: l.zIndex || 0 })),
      ...(captions || []).map(l => ({ ...l, _type: 'caption', zIndex: l.zIndex || 0 }))
    ];
    allLayers.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    allLayers.forEach((layer) => {
      if (layer.hidden) return;
      if (layer._type === 'imageLayer') {
        const imgLayer = layer;
      const cx = imgLayer.x * canvas.width;
      const cy = getImageLayerCenterY(imgLayer);
      const cached = imageCacheRef.current[imgLayer.url];

      if (cached) {
        const baseW = cached.width || 200;
        const baseH = cached.height || 200;
        let drawSource = cached;

        if (imgLayer.filters || imgLayer.filter) {
          const filterObj = imgLayer.filters || imgLayer.filter;
          const filterCss = getFilterCss(filterObj);
          if (filterCss !== 'none') {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = baseW;
            tempCanvas.height = baseH;
            const tempCtx = tempCanvas.getContext('2d');
            // iOS-safe: uses pixel-level fallback on iOS Safari
            drawImageFiltered(tempCtx, cached, filterCss, 0, 0, baseW, baseH);
            drawSource = tempCanvas;
          }
        }

        targetCtx.save();
        targetCtx.translate(cx, cy);
        if (imgLayer.rotation) {
          targetCtx.rotate((imgLayer.rotation * Math.PI) / 180);
        }
        if (imgLayer.flipX) {
          targetCtx.scale(-1, 1);
        }
        if (imgLayer.opacity !== undefined) {
          targetCtx.globalAlpha = imgLayer.opacity;
        }
        
        const scale = imgLayer.scale || 1.0;
        const maxDim = 320;
        const fitScale = Math.min(maxDim / baseW, maxDim / baseH);
        const crop = imgLayer.crop || { x: 0, y: 0, width: 1, height: 1 };
        const naturalFullW = baseW * fitScale * scale;
        const naturalFullH = baseH * fitScale * scale;
        const w = imgLayer.boxWidth || imgLayer.width || Math.round(naturalFullW * (crop.width || 1));
        const h = imgLayer.boxHeight || imgLayer.height || Math.round(naturalFullH * (crop.height || 1));

        const mode = imgLayer.fitMode || 'fit';
        
        if (mode === 'crop') {
          const sx = Math.max(0, Math.min(baseW - 1, (crop.x || 0) * baseW));
          const sy = Math.max(0, Math.min(baseH - 1, (crop.y || 0) * baseH));
          const sw = Math.max(1, Math.min(baseW - sx, (crop.width || 1) * baseW));
          const sh = Math.max(1, Math.min(baseH - sy, (crop.height || 1) * baseH));

          targetCtx.save();
          targetCtx.beginPath();
          if (imgLayer.isFaceMorph) {
            targetCtx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
          } else {
            targetCtx.rect(-w / 2, -h / 2, w, h);
          }
          targetCtx.clip();
          targetCtx.drawImage(drawSource, sx, sy, sw, sh, -w / 2, -h / 2, w, h);
          targetCtx.restore();
        } else if (mode === 'stretch') {
          const sx = Math.max(0, Math.min(baseW - 1, (crop.x || 0) * baseW));
          const sy = Math.max(0, Math.min(baseH - 1, (crop.y || 0) * baseH));
          const sw = Math.max(1, Math.min(baseW - sx, (crop.width || 1) * baseW));
          const sh = Math.max(1, Math.min(baseH - sy, (crop.height || 1) * baseH));
          targetCtx.drawImage(drawSource, sx, sy, sw, sh, -w / 2, -h / 2, w, h);
        } else { // fit
          const hasCrop = (crop.width && crop.width < 1) || (crop.height && crop.height < 1) || (crop.x || 0) > 0 || (crop.y || 0) > 0;
          const sx = hasCrop ? Math.max(0, Math.min(baseW - 1, (crop.x || 0) * baseW)) : 0;
          const sy = hasCrop ? Math.max(0, Math.min(baseH - 1, (crop.y || 0) * baseH)) : 0;
          const sw = hasCrop ? Math.max(1, Math.min(baseW - sx, (crop.width || 1) * baseW)) : baseW;
          const sh = hasCrop ? Math.max(1, Math.min(baseH - sy, (crop.height || 1) * baseH)) : baseH;

          const imgAspect = sw / sh;
          const boxAspect = w / h;
          let drawW = w;
          let drawH = h;
          
          if (boxAspect > imgAspect) {
            drawH = h;
            drawW = h * imgAspect;
          } else {
            drawW = w;
            drawH = w / imgAspect;
          }
          
          targetCtx.save();
          targetCtx.beginPath();
          if (imgLayer.isFaceMorph) {
            targetCtx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
          } else {
            targetCtx.rect(-w / 2, -h / 2, w, h);
          }
          targetCtx.clip();
          targetCtx.drawImage(drawSource, sx, sy, sw, sh, -drawW / 2, -drawH / 2, drawW, drawH);
          targetCtx.restore();
        }

        if (imgLayer.id === activeLayerId && !isDrawingMode) {
          const hw = w / 2 + 6;
          const hh = h / 2 + 6;
          const rot = imgLayer.rotation || 0;

          activeHandleDrawer = (uiCtx) => {
            uiCtx.save();
            uiCtx.translate(cx, cy);
            if (rot) {
              uiCtx.rotate((rot * Math.PI) / 180);
            }
            if (imgLayer.locked) {
              uiCtx.strokeStyle = '#f59e0b';
              uiCtx.lineWidth = 2.5;
              uiCtx.setLineDash([4, 4]);
              uiCtx.strokeRect(-w / 2 - 6, -h / 2 - 6, w + 12, h + 12);
              uiCtx.setLineDash([]);
              uiCtx.fillStyle = '#f59e0b';
              uiCtx.font = 'bold 12px sans-serif';
              uiCtx.textAlign = 'center';
              uiCtx.fillText('🔒 LOCKED', 0, -hh - 14);
              uiCtx.restore();
              return;
            }

            if (imgLayer.isFaceMorph) {
              // Sleek, glowing face reticle (matching coral theme)
              uiCtx.strokeStyle = THEME_CORAL;
              uiCtx.lineWidth = 2.4;
              uiCtx.setLineDash([5, 5]);
              uiCtx.beginPath();
              uiCtx.ellipse(0, 0, hw, hh, 0, 0, Math.PI * 2);
              uiCtx.stroke();
              uiCtx.setLineDash([]);

              // Rotation handle stem & circle
              drawRotateHandle(uiCtx, 0, -hh, 0, -hh - 28);

              // Round size handles (Bottom Right corner)
              drawResizeHandle(uiCtx, hw * 0.72, hh * 0.72);

              // Delete handle (Top Left)
              drawDeleteHandle(uiCtx, -hw * 0.72, -hh * 0.72);

              // Floating badge
              uiCtx.save();
              uiCtx.fillStyle = THEME_BADGE_BG;
              uiCtx.strokeStyle = THEME_CORAL;
              uiCtx.lineWidth = 1.5;
              const badgeText = `🎭 ${imgLayer.faceName || 'Face Morph'} (${Math.round((imgLayer.opacity !== undefined ? imgLayer.opacity : 1) * 100)}%)`;
              uiCtx.font = 'bold 12px sans-serif';
              const textW = uiCtx.measureText(badgeText).width;
              uiCtx.beginPath();
              uiCtx.roundRect(-textW / 2 - 8, hh + 12, textW + 16, 24, 12);
              uiCtx.fill();
              uiCtx.stroke();
              uiCtx.fillStyle = THEME_CORAL;
              uiCtx.textAlign = 'center';
              uiCtx.textBaseline = 'middle';
              uiCtx.fillText(badgeText, 0, hh + 24);
              uiCtx.restore();

              uiCtx.restore();
              return;
            }

            const isCropping = imgLayer.fitMode === 'crop';

            // Reference Image Style: Coral Glow Rounded Box with Side Handles
            drawSelectionBox(uiCtx, -hw, -hh, w + 12, h + 12, 10);

            if (isCropping) {
              // Subtle rule-of-thirds grid in crop mode
              uiCtx.save();
              uiCtx.strokeStyle = 'rgba(240, 104, 83, 0.35)';
              uiCtx.lineWidth = 1;
              uiCtx.setLineDash([3, 3]);
              uiCtx.beginPath();
              uiCtx.moveTo(-hw + (w + 12) / 3, -hh);
              uiCtx.lineTo(-hw + (w + 12) / 3, hh);
              uiCtx.moveTo(-hw + (w + 12) * 2 / 3, -hh);
              uiCtx.lineTo(-hw + (w + 12) * 2 / 3, hh);
              uiCtx.moveTo(-hw, -hh + (h + 12) / 3);
              uiCtx.lineTo(hw, -hh + (h + 12) / 3);
              uiCtx.moveTo(-hw, -hh + (h + 12) * 2 / 3);
              uiCtx.lineTo(hw, -hh + (h + 12) * 2 / 3);
              uiCtx.stroke();
              uiCtx.restore();
            } else {
              // Rotation handle
              drawRotateHandle(uiCtx, 0, -hh, 0, -hh - 28);

              // Corner handles:
              // Top-Left IS the Delete Handle!
              drawDeleteHandle(uiCtx, -hw, -hh);
              // Bottom-Right IS the Resize Handle!
              drawResizeHandle(uiCtx, hw, hh);
            }

            // 4 Middle-of-side handles (used for freeform cropping in crop mode, or stretching)
            drawSideHandle(uiCtx, 0, -hh, false);  // Top middle
            drawSideHandle(uiCtx, 0, hh, false);   // Bottom middle
            drawSideHandle(uiCtx, -hw, 0, true);   // Left middle
            drawSideHandle(uiCtx, hw, 0, true);    // Right middle
            uiCtx.restore();
          };
        }

        targetCtx.restore();
      } else {
        const newImg = new Image();
        if (imgLayer.url && !imgLayer.url.startsWith('blob:') && !imgLayer.url.startsWith('data:')) newImg.crossOrigin = 'anonymous';
        newImg.onload = () => {
          imageCacheRef.current[imgLayer.url] = newImg;
          renderCanvas(baseImgRef.current);
        };
        newImg.src = imgLayer.url;
      }
            } else if (layer._type === 'sticker') {
        const stk = layer;
      
      const sx = stk.x * canvas.width;
      const sy = getStickerCenterY(stk);
      targetCtx.save();
      targetCtx.translate(sx, sy);
      if (stk.rotation) targetCtx.rotate(stk.rotation * Math.PI / 180);
      if (stk.flipX) targetCtx.scale(-1, 1);
      
      const stkSize = (stk.scale || 1.0) * 52;
      targetCtx.font = `${stkSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
      targetCtx.textAlign = 'center';
      targetCtx.textBaseline = 'middle';

      if (stk.id === activeLayerId && !isDrawingMode) {
        const rot = stk.rotation || 0;
        activeHandleDrawer = (uiCtx) => {
          uiCtx.save();
          uiCtx.translate(sx, sy);
          if (rot) uiCtx.rotate(rot * Math.PI / 180);
          if (stk.locked) {
            uiCtx.strokeStyle = '#f59e0b';
            uiCtx.lineWidth = 2.5;
            uiCtx.setLineDash([4, 4]);
            uiCtx.strokeRect(-stkSize / 2 - 6, -stkSize / 2 - 6, stkSize + 12, stkSize + 12);
            uiCtx.setLineDash([]);
            uiCtx.fillStyle = '#f59e0b';
            uiCtx.font = 'bold 12px sans-serif';
            uiCtx.textAlign = 'center';
            uiCtx.fillText('🔒 LOCKED', 0, -stkSize / 2 - 14);
            uiCtx.restore();
            return;
          }
          const hs = stkSize / 2 + 6;

          // Reference Image Style: Coral Glow Rounded Box with Top-Left Delete, Bottom-Right Resize & Side Handles
          drawSelectionBox(uiCtx, -hs, -hs, stkSize + 12, stkSize + 12, 10);

          // Side Handles: Left & Right Capsules
          drawSideHandle(uiCtx, -hs, 0, true);
          drawSideHandle(uiCtx, hs, 0, true);

          // Top Rotation Stem & Handle
          drawRotateHandle(uiCtx, 0, -hs, 0, -hs - 28);

          // Corner Handles:
          // Top-Left IS the Delete Handle!
          drawDeleteHandle(uiCtx, -hs, -hs);
          // Bottom-Right IS the Resize Handle!
          drawResizeHandle(uiCtx, hs, hs);

          uiCtx.restore();
        };
      }

      if (stk.url || stk.imageUrl) {
        const imgUrl = stk.url || stk.imageUrl;
        const cached = imageCacheRef.current[imgUrl];
        if (cached && (cached.complete && (cached.naturalWidth || cached.width))) {
          const aspect = (cached.naturalWidth || cached.width) / ((cached.naturalHeight || cached.height) || 1);
          const drawW = aspect >= 1 ? stkSize : stkSize * aspect;
          const drawH = aspect >= 1 ? stkSize / aspect : stkSize;
          if (stk.dieCut) {
            renderDieCutImage(targetCtx, cached, drawW, drawH, stk.dieCutColor || '#ffffff', stk.dieCutWidth || 6);
          } else {
            targetCtx.drawImage(cached, -drawW / 2, -drawH / 2, drawW, drawH);
          }
        } else {
          if (!loadingMediaRef.current[imgUrl]) {
            loadingMediaRef.current[imgUrl] = true;
            const newImg = new Image();
            if (imgUrl && !imgUrl.startsWith('blob:') && !imgUrl.startsWith('data:')) newImg.crossOrigin = 'anonymous';
            newImg.onload = () => {
              imageCacheRef.current[imgUrl] = newImg;
              renderCanvas(baseImgRef.current);
            };
            newImg.src = imgUrl;
          }
        }
      } else if (stk.emoji) {
        if (stk.dieCut) {
          renderDieCutEmoji(targetCtx, stk.emoji, stkSize, stk.dieCutColor || '#ffffff', stk.dieCutWidth || 6);
        } else {
          targetCtx.fillText(stk.emoji, 0, 0);
        }
      }
      targetCtx.restore();
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
      
      targetCtx.save();
      targetCtx.translate(cx, cy);
      if (cap.rotation) targetCtx.rotate(cap.rotation * Math.PI / 180);

      // Text opacity support (0.0 to 1.0)
      let opacity = 1;
      if (cap.opacity !== undefined && cap.opacity !== null) {
        const num = Number(cap.opacity);
        if (!isNaN(num)) {
          opacity = num > 1 ? num / 100 : num;
          opacity = Math.max(0, Math.min(1, opacity));
        }
      }
      targetCtx.globalAlpha = opacity;

      // Text blur support (px)
      if (cap.blur && Number(cap.blur) > 0) {
        targetCtx.filter = `blur(${Number(cap.blur)}px)`;
      } else {
        targetCtx.filter = 'none';
      }

      const fontSize = cap.fontSize || 50;
      const fontFamily = cap.fontFamily || 'Impact, sans-serif';
      targetCtx.font = `bold ${fontSize}px ${fontFamily}`;
      const align = cap.align || 'center';
      targetCtx.textAlign = align;
      targetCtx.textBaseline = 'middle';

      const renderMaxWidth = (cap.width || 0.9) * canvas.width;
      
      const displayString = cap.text || '';
      
      // Use the SAME global wrapText for rendering and hit-testing
      const lines = wrapText(targetCtx, displayString, renderMaxWidth);
      
      let maxLineWidth = 0;
      for (const line of lines) {
        maxLineWidth = Math.max(maxLineWidth, targetCtx.measureText(line).width);
      }
      // Draw Meme Text Background if enabled (white, black, or custom)
      const isBubble = !!cap.bubbleStyle;
      const hasBg = (cap.bgColor && cap.bgColor !== 'transparent' && cap.bgColor !== 'none') || isBubble;

      // The visual bounding box is sized to match the actual text
      const padX = isBubble ? Math.max(24, fontSize * 0.5) : (hasBg && cap.bgStyle !== 'banner' ? Math.max(16, fontSize * 0.35) : Math.max(16, fontSize * 0.25));
      const padY = isBubble ? Math.max(18, fontSize * 0.4) : (hasBg && cap.bgStyle !== 'banner' ? Math.max(10, fontSize * 0.2) : Math.max(10, fontSize * 0.16));
      let boxWidth = (cap.hasCustomWidth && cap.width)
        ? Math.max(maxLineWidth + padX * 2, cap.width * canvas.width)
        : (maxLineWidth + padX * 2);
      boxWidth = Math.min(canvas.width - 16, boxWidth);
      const lineHeight = fontSize * 1.2;
      const totalHeight = lines.length * lineHeight;
      let boxHeight = totalHeight + padY * 2;
      if (cap.curve && Math.abs(cap.curve) > 0) {
        boxHeight += Math.round(getCurveSagitta(maxLineWidth, cap.curve));
      }
      const startY = - ((lines.length - 1) * lineHeight) / 2;

      if (cap.isBreakingNews) {
        boxWidth = Math.max(300, (cap.width || 0.94) * canvas.width);
        boxHeight = getBreakingNewsHeight(cap);
        drawBreakingNewsChyron(targetCtx, boxWidth, cap);
      } else if (cap.isTweetCard) {
        boxWidth = Math.max(180, (cap.width || 0.88) * canvas.width);
        boxHeight = getTweetCardHeight(targetCtx, cap, boxWidth);
        drawTweetCard(targetCtx, boxWidth, cap);
      } else if (cap.isInstagramCard) {
        boxWidth = Math.max(180, (cap.width || 0.88) * canvas.width);
        boxHeight = getInstagramCardHeight(targetCtx, cap, boxWidth);
        drawInstagramCard(targetCtx, boxWidth, cap);
      } else if (cap.isWhatsAppCard) {
        boxWidth = Math.max(180, (cap.width || 0.84) * canvas.width);
        boxHeight = getWhatsAppCardHeight(targetCtx, cap, boxWidth);
        drawWhatsAppCard(targetCtx, boxWidth, cap);
      } else {
        let bgFillColor = '#ffffff';
        if (isBubble) {
          const boxStartX = - boxWidth / 2;
          const boxStartY = - boxHeight / 2;
          const bubbleFill = cap.bgColor === 'black' ? '#000000' : (cap.bgColor || '#ffffff');
          const bubbleBorder = cap.stroke && cap.stroke !== 'transparent' ? cap.stroke : (bubbleFill === '#000000' ? '#ffffff' : '#000000');
          const bubbleStrokeWidth = cap.strokeWidth || 3;
          drawSpeechBubble(targetCtx, boxStartX, boxStartY, boxWidth, boxHeight, cap.bubbleStyle, bubbleFill, bubbleBorder, bubbleStrokeWidth);
        } else if (hasBg) {
          targetCtx.save();
          bgFillColor = cap.bgColor === 'white' ? '#ffffff' : (cap.bgColor === 'black' ? '#000000' : cap.bgColor);
          targetCtx.fillStyle = bgFillColor;

          if (cap.bgStyle === 'banner') {
            // Full-width edge-to-edge banner across the canvas
            const bannerPadY = Math.max(14, fontSize * 0.28);
            const bannerH = totalHeight + bannerPadY * 2;
            const bannerY = startY - lineHeight / 2 - bannerPadY;
            const bannerX = -cx;
            const bannerW = canvas.width;
            targetCtx.fillRect(bannerX, bannerY, bannerW, bannerH);
          } else {
            // Box style: clean padded rounded rectangle enclosing the text
            const boxStartX = - boxWidth / 2;
            const boxStartY = - boxHeight / 2;
            const r = Math.min(8, fontSize * 0.15);
            drawRoundRect(targetCtx, boxStartX, boxStartY, boxWidth, boxHeight, r);
          }
          targetCtx.restore();
        }

        // Determine text color with smart contrast for White / Black BG and Bubbles
        let textColor = cap.color || '#ffffff';
        if (isBubble) {
          if (cap.bubbleStyle === 'imessage-send' || cap.bubbleStyle === 'whatsapp-send') {
            textColor = '#ffffff';
          } else if (cap.bubbleStyle === 'imessage-receive') {
            textColor = isColorDark(cap.bgColor) ? '#ffffff' : '#000000';
          } else if (cap.bubbleStyle === 'whatsapp-receive') {
            textColor = isColorDark(cap.bgColor) ? '#ffffff' : '#111b21';
          } else {
            const bubbleFill = cap.bgColor === 'black' ? '#000000' : (cap.bgColor || '#ffffff');
            textColor = isColorDark(bubbleFill) ? '#ffffff' : '#000000';
          }
        } else if (cap.bgColor === 'white' && (textColor.toLowerCase() === '#ffffff' || textColor.toLowerCase() === '#fff' || textColor === 'white')) {
          textColor = '#000000';
        } else if (cap.bgColor === 'black' && (textColor.toLowerCase() === '#000000' || textColor.toLowerCase() === '#000' || textColor === 'black')) {
          textColor = '#ffffff';
        }

        const shouldStroke = cap.stroke && cap.stroke !== 'transparent' && (!hasBg || (cap.stroke !== cap.bgColor && cap.stroke !== bgFillColor));
        const textAnchorX = align === 'left' ? (-boxWidth / 2 + padX) : (align === 'right' ? (boxWidth / 2 - padX) : 0);

        lines.forEach((line, index) => {
          const ly = startY + index * lineHeight;

          if (cap.curve && Math.abs(cap.curve) > 0) {
            drawCurvedText(
              targetCtx,
              line,
              cap.curve,
              ly,
              textAnchorX,
              fontSize,
              shouldStroke,
              cap.stroke,
              cap.strokeWidth || Math.max(3, fontSize / 7),
              textColor,
              cap.effect
            );
          } else {
            drawTextLineWithEffect(
              targetCtx,
              line,
              textAnchorX,
              ly,
              fontSize,
              shouldStroke,
              cap.stroke,
              cap.strokeWidth || Math.max(3, fontSize / 7),
              textColor,
              cap.effect
            );
          }
        });
      }

      if (cap.id === activeLayerId && !isDrawingMode) {
        const rot = cap.rotation || 0;
        activeHandleDrawer = (uiCtx) => {
          uiCtx.save();
          uiCtx.translate(cx, cy);
          if (rot) uiCtx.rotate((rot * Math.PI) / 180);
          uiCtx.globalAlpha = 1.0;
          const boxX = - boxWidth / 2;
          const boxY = - boxHeight / 2;

          if (cap.locked) {
            uiCtx.strokeStyle = '#f59e0b';
            uiCtx.lineWidth = 2.5;
            uiCtx.setLineDash([4, 4]);
            uiCtx.strokeRect(boxX, boxY, boxWidth, boxHeight);
            uiCtx.setLineDash([]);
            uiCtx.fillStyle = '#f59e0b';
            uiCtx.font = 'bold 12px sans-serif';
            uiCtx.textAlign = 'center';
            uiCtx.fillText('🔒 LOCKED', 0, boxY - 14);
            uiCtx.restore();
            return;
          }

          // Reference Image Style: Coral Glow Rounded Box with Top-Left Delete, Bottom-Right Resize & Side Handles
          drawSelectionBox(uiCtx, boxX, boxY, boxWidth, boxHeight, 10);

          // Side Handles: Left & Right Capsules
          drawSideHandle(uiCtx, boxX, 0, true); // Middle Left
          drawSideHandle(uiCtx, boxX + boxWidth, 0, true); // Middle Right

          // Corner Handles:
          // Top-Left IS the Delete Handle!
          drawDeleteHandle(uiCtx, boxX, boxY);
          // Bottom-Right IS the Resize / Scale Handle (with diagonal arrows ⤢)
          drawResizeHandle(uiCtx, boxX + boxWidth, boxY + boxHeight);
          // (Note: Top-Right duplicate button omitted per user request; Top-Right & Bottom-Left remain clean rounded corners)

          // Top Rotation Stem & Handle
          drawRotateHandle(uiCtx, 0, boxY, 0, boxY - 28);

          // Live Dimension / Size pill feedback during drag
          if (isDragging.current && dragTarget.current?.id === cap.id && dragTarget.current?.type?.startsWith('resize_caption_')) {
            uiCtx.save();
            const isWidthResize = dragTarget.current.type === 'resize_caption_l' || dragTarget.current.type === 'resize_caption_r';
            const label = isWidthResize
              ? `Width: ${Math.round(boxWidth)}px`
              : `Font: ${Math.round(cap.fontSize || 50)}px`;
            uiCtx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            const tw = uiCtx.measureText(label).width;
            const pw = tw + 18;
            const ph = 24;
            const py = boxY + boxHeight + 16;
            
            uiCtx.shadowColor = 'rgba(0, 0, 0, 0.4)';
            uiCtx.shadowBlur = 6;
            uiCtx.shadowOffsetY = 2;
            uiCtx.fillStyle = THEME_BADGE_BG;
            uiCtx.beginPath();
            if (uiCtx.roundRect) {
              uiCtx.roundRect(-pw / 2, py, pw, ph, 12);
            } else {
              uiCtx.rect(-pw / 2, py, pw, ph);
            }
            uiCtx.fill();

            uiCtx.strokeStyle = THEME_CORAL;
            uiCtx.lineWidth = 1.5;
            uiCtx.stroke();

            uiCtx.fillStyle = THEME_CORAL;
            uiCtx.textAlign = 'center';
            uiCtx.textBaseline = 'middle';
            uiCtx.fillText(label, 0, py + ph / 2);
            uiCtx.restore();
          } else if (isDragging.current && dragTarget.current?.id === cap.id && dragTarget.current?.type === 'rotate_caption') {
            uiCtx.save();
            const label = `${Math.round(((rot % 360) + 360) % 360)}°`;
            uiCtx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            const tw = uiCtx.measureText(label).width;
            const pw = tw + 18;
            const ph = 24;
            const py = boxY - 54;
            
            uiCtx.shadowColor = 'rgba(0, 0, 0, 0.4)';
            uiCtx.shadowBlur = 6;
            uiCtx.shadowOffsetY = 2;
            uiCtx.fillStyle = THEME_BADGE_BG;
            uiCtx.beginPath();
            if (uiCtx.roundRect) {
              uiCtx.roundRect(-pw / 2, py, pw, ph, 12);
            } else {
              uiCtx.rect(-pw / 2, py, pw, ph);
            }
            uiCtx.fill();

            uiCtx.strokeStyle = THEME_CORAL;
            uiCtx.lineWidth = 1.5;
            uiCtx.stroke();

            uiCtx.fillStyle = THEME_CORAL;
            uiCtx.textAlign = 'center';
            uiCtx.textBaseline = 'middle';
            uiCtx.fillText(label, 0, py + ph / 2);
            uiCtx.restore();
          }
          uiCtx.restore();
        };
      }

      targetCtx.restore();
      }
    });

    // --- RENDER FREEHAND DRAWINGS ---
    const drawBrushStroke = (stroke) => {
      if (!stroke || !stroke.points || stroke.points.length === 0) return;
      targetCtx.save();
      targetCtx.strokeStyle = stroke.color || '#a855f7';
      targetCtx.lineWidth = stroke.size || 8;
      targetCtx.lineCap = 'round';
      targetCtx.lineJoin = 'round';

      const strokeMode = stroke.mode || (stroke.type === 'highlighter' ? 'highlighter' : (stroke.type === 'glow' ? 'glow' : (stroke.type === 'eraser' ? 'eraser' : 'pen')));
      if (strokeMode === 'highlighter') {
        targetCtx.globalAlpha = 0.45;
      } else if (strokeMode === 'glow') {
        targetCtx.shadowColor = stroke.color || '#00f0ff';
        targetCtx.shadowBlur = Math.max(8, (stroke.size || 8) * 1.5);
      }

      targetCtx.beginPath();
      if (stroke.points.length === 1) {
        targetCtx.arc(stroke.points[0].x, stroke.points[0].y, (stroke.size || 8) / 2, 0, Math.PI * 2);
        targetCtx.fillStyle = stroke.color || '#a855f7';
        targetCtx.fill();
      } else {
        targetCtx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          targetCtx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        targetCtx.stroke();
      }
      targetCtx.restore();
    };

    (drawings || []).forEach((d) => {
      drawBrushStroke(d);
    });
    
    // Render Watermark
    if (watermark?.enabled) {
      targetCtx.save();
      targetCtx.globalAlpha = watermark.opacity || 0.5;
      
      const pad = 20;
      let wx = 0;
      let wy = 0;
      
      const getPositions = (w, h) => {
        const pos = watermark.position || 'bottom-right';
        if (pos === 'bottom-right') return { x: canvas.width - pad - w, y: canvas.height - pad - h };
        if (pos === 'bottom-left') return { x: pad, y: canvas.height - pad - h };
        if (pos === 'top-right') return { x: canvas.width - pad - w, y: pad };
        if (pos === 'top-left') return { x: pad, y: pad };
        return { x: pad, y: pad };
      };
      
      if (watermark.imageUrl && imageCacheRef.current[watermark.imageUrl]) {
        const wmImg = imageCacheRef.current[watermark.imageUrl];
        const scale = (watermark.size || 24) * 3 / Math.max(wmImg.width, wmImg.height);
        const drawW = wmImg.width * scale;
        const drawH = wmImg.height * scale;
        const { x, y } = getPositions(drawW, drawH);
        targetCtx.drawImage(wmImg, x, y, drawW, drawH);
      } else if (watermark.text) {
        targetCtx.font = `bold ${watermark.size || 24}px Impact, sans-serif`;
        const fillColor = watermark.color || '#ffffff';
        targetCtx.fillStyle = fillColor;
        targetCtx.strokeStyle = fillColor === '#000000' ? '#ffffff' : '#000000';
        targetCtx.lineWidth = Math.max(2, (watermark.size || 24) / 10);
        targetCtx.textBaseline = 'top';
        targetCtx.textAlign = 'left';
        
        const textMetrics = targetCtx.measureText(watermark.text);
        const w = textMetrics.width;
        const h = watermark.size || 24;
        const { x, y } = getPositions(w, h);
        
        targetCtx.strokeText(watermark.text, x, y);
        targetCtx.fillText(watermark.text, x, y);
      }
      
      targetCtx.restore();
    }

    // If global composition filter is enabled, draw the rendered composition canvas with the filter
    if (applyGlobalFilter && compCanvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawImageFiltered(ctx, compCanvas, filterCss, 0, 0, canvas.width, canvas.height);
    }

    // Draw active layer selection handles and rotation knob on the screen canvas (unfiltered and sharp)
    if (activeHandleDrawer && !skipHandles) {
      activeHandleDrawer(ctx);
    }

    // Draw Snapping Guides
    if (!skipHandles && isDragging.current && snappingLines.current && (snappingLines.current.horizontal !== null || snappingLines.current.vertical !== null)) {
      const { horizontal, vertical } = snappingLines.current;
      ctx.save();
      ctx.setLineDash([6, 6]);
      
      if (horizontal !== null) {
        const isHeaderOrFooter = activeCaption?.isHeaderCaption || activeCaption?.isFooterCaption;
        const y = isHeaderOrFooter ? (horizontal * canvas.height) : (headerExtH + horizontal * canvasH);
        const isCenter = Math.abs(horizontal - 0.5) < 0.002;
        ctx.strokeStyle = isCenter ? '#00f0ff' : '#a855f7';
        ctx.lineWidth = isCenter ? 2 : 1.5;
        ctx.shadowColor = isCenter ? 'rgba(0, 240, 255, 0.7)' : 'rgba(168, 85, 247, 0.7)';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      
      if (vertical !== null) {
        const x = vertical * canvas.width;
        const isCenter = Math.abs(vertical - 0.5) < 0.002;
        ctx.strokeStyle = isCenter ? '#00f0ff' : '#a855f7';
        ctx.lineWidth = isCenter ? 2 : 1.5;
        ctx.shadowColor = isCenter ? 'rgba(0, 240, 255, 0.7)' : 'rgba(168, 85, 247, 0.7)';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      ctx.restore();
    }
  };

  if (baseImgRef.current && baseImgRef.current.src === imgSrc) {
    renderCanvas(baseImgRef.current);
  } else if (imgSrc) {
      const baseImg = new Image();
      if (imgSrc && !imgSrc.startsWith('blob:') && !imgSrc.startsWith('data:')) baseImg.crossOrigin = 'anonymous';
      baseImg.onload = () => {
        if (baseImg.width && baseImg.height && (naturalSize.w !== baseImg.width || naturalSize.h !== baseImg.height)) {
          setNaturalSize({ w: baseImg.width, h: baseImg.height });
        }
        baseImgRef.current = baseImg;
        renderCanvas(baseImg);
      };
      baseImg.onerror = () => {
        renderCanvas(null);
      };
      baseImg.src = imgSrc;
  } else {
    renderCanvas(null);
  }
}
