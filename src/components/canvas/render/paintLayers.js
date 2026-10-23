import { THEME_BADGE_BG, THEME_CORAL, drawDeleteHandle, drawResizeHandle, drawRotateHandle, drawSelectionBox, drawSideHandle } from './handles';
import { getFilterCss, drawImageFiltered } from '../../../data/photoFilters';
import { isColorDark } from '../../../utils/captionLayout';
import { drawCurvedText, drawRoundRect, drawTextLineWithEffect, getCurveSagitta, wrapText } from '../draw/text';
import { drawWhatsAppCard, getWhatsAppCardHeight } from '../draw/socialCards/whatsapp';
import { renderDieCutEmoji, renderDieCutImage } from '../draw/dieCut';
import { drawBreakingNewsChyron, getBreakingNewsHeight } from '../draw/chyron';
import { drawTweetCard, getTweetCardHeight } from '../draw/socialCards/tweet';
import { drawInstagramCard, getInstagramCardHeight } from '../draw/socialCards/instagram';
import { drawSpeechBubble } from '../draw/speechBubble';

export function paintLayers({
  activeLayerId, baseImgRef, canvas, captions, dragTarget,
  
  getCaptionCenterY, getImageLayerCenterY, getStickerCenterY, imageCacheRef, imageLayers,
  isDragging, isDrawingMode, loadingMediaRef, renderCanvas, stickers, targetCtx
}) {
  let activeHandleDrawer = null;

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

  return activeHandleDrawer;
}
