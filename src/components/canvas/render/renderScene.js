import { getFilterCss } from '../../../data/photoFilters';
import { sampleFaceLighting } from '../draw/faceLighting';
import { getImageArea } from './imageArea';
import { paintBase } from './paintBase';
import { paintHeaderFooter } from './paintHeaderFooter';
import { paintLayers } from './paintLayers';
import { paintDrawings } from './paintDrawings';
import { paintWatermark } from './paintWatermark';
import { paintOverlays } from './paintOverlays';

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

  // A copy of the meme as exported (no selection handles), for scaling or encoding. `transparent`
  // leaves out the background colour (the header/footer bands keep theirs).
  canvas.exportCleanCanvas = ({ transparent = false } = {}) => {
    renderCanvas(baseImgRef.current, true, transparent);
    const copy = document.createElement('canvas');
    copy.width = canvas.width;
    copy.height = canvas.height;
    copy.getContext('2d')?.drawImage(canvas, 0, 0);
    renderCanvas(baseImgRef.current, false);
    return copy;
  };

  canvas.exportCleanImage = (format = 'image/png', quality = 0.92) => {
    renderCanvas(baseImgRef.current, true);
    const res = canvas.toDataURL(format, quality);
    renderCanvas(baseImgRef.current, false);
    return res;
  };

  const renderCanvas = (img, skipHandles = false, transparent = false) => {
    const bgColor = transparent ? 'transparent' : liveBgColor;
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
    if (!transparent || demotivational?.enabled) {
      targetCtx.fillStyle = demotivational?.enabled ? '#000000' : bgColor;
      targetCtx.fillRect(0, 0, canvas.width, canvas.height);
    }

    const { imageAreaX, imageAreaY, imageAreaW, imageAreaH } = getImageArea({
      canvasH, canvasW, demotivational, headerExtH
    });

    paintBase({
      activeIsNativeLayout, activeLayoutDef, baseImgRef, bgFilterCss, canvasFlipX,
      demotivational, imageAreaH, imageAreaW, imageAreaX, imageAreaY, imageCacheRef, imageFit,
      img, isNativeLayout, liveBgColor: bgColor, renderCanvas, slotImages, slotTransforms, targetCtx
    });

    paintHeaderFooter({
      canvasBgColor, canvasFooter, canvasH, canvasHeader, canvasW, footerExtH, headerExtH,
      isFooterEnabled, isHeaderEnabled, liveBgColor, targetCtx
    });

    const activeHandleDrawer = paintLayers({
      activeLayerId, baseImgRef, canvas, captions, dragTarget,
      getCaptionCenterY, getImageLayerCenterY, getStickerCenterY, imageCacheRef, imageLayers,
      isDragging, isDrawingMode, loadingMediaRef, renderCanvas, stickers, targetCtx
    });

    paintDrawings({
      drawings, targetCtx
    });

    paintWatermark({
      canvas, imageCacheRef, targetCtx, watermark
    });

    paintOverlays({
      activeCaption, activeHandleDrawer, applyGlobalFilter, canvas, canvasH, compCanvas, ctx,
      filterCss, headerExtH, isDragging, skipHandles, snappingLines
    });
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
