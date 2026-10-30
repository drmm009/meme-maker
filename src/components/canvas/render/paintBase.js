import { drawImageFiltered } from '../../../data/photoFilters';
import { blurredCopy } from '../draw/photoEffects';

export function paintBase({
  activeIsNativeLayout, activeLayoutDef, baseImgRef, bgFilterCss, canvasFlipX,
  demotivational, imageAreaH, imageAreaW, imageAreaX, imageAreaY, imageCacheRef, imageFit,
  img, isNativeLayout, liveBgColor, renderCanvas, slotImages, slotTransforms, targetCtx,
  // Background blur: the photo blurred (blur 0..30), with the subject cut out of it on top.
  portrait = null
}) {
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
    if (portrait?.blur > 0 && portrait.subjectUrl) {
      const subject = imageCacheRef.current[portrait.subjectUrl];
      if (subject) {
        // The blur scales with the picture, so it looks the same at every canvas size.
        const blurred = blurredCopy(img, drawW, drawH, portrait.blur * (drawW / 600));
        if (blurred) drawImageFiltered(targetCtx, blurred, bgFilterCss, offsetX, offsetY, drawW, drawH);
        drawImageFiltered(targetCtx, subject, bgFilterCss, offsetX, offsetY, drawW, drawH);
      } else if (!imageCacheRef.current[`${portrait.subjectUrl}#loading`]) {
        imageCacheRef.current[`${portrait.subjectUrl}#loading`] = true;
        const cut = new Image();
        cut.onload = () => {
          imageCacheRef.current[portrait.subjectUrl] = cut;
          renderCanvas(baseImgRef.current);
        };
        cut.src = portrait.subjectUrl;
      }
    }
    targetCtx.restore();

    if (demotivational?.enabled) {
      targetCtx.save();
      targetCtx.strokeStyle = '#ffffff';
      targetCtx.lineWidth = 2;
      targetCtx.strokeRect(imageAreaX - 5, imageAreaY - 5, imageAreaW + 10, imageAreaH + 10);
      targetCtx.restore();
    }
  }
}
