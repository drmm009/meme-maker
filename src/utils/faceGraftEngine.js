/**
 * Face Graft Engine: Direct On-Template Feature Fusion & Skin Tone Matching
 * Seamlessly grafts facial features (eyes, nose, mouth) into meme template pixels
 * with 100% offline color transfer, organic anatomical masking, and zero sticker handles.
 */

import { morphFaceMesh } from './faceMorphEngine';

/**
 * Loads an image from a URL, Image element, or Canvas element asynchronously.
 */
export function loadImg(src) {
  if (!src) return Promise.resolve(null);
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (src instanceof HTMLImageElement) {
    if (src.complete && src.naturalWidth > 0) return Promise.resolve(src);
    return new Promise((resolve) => {
      src.onload = () => resolve(src);
      src.onerror = () => resolve(null);
    });
  }
  if (src instanceof HTMLCanvasElement) {
    return Promise.resolve(src);
  }
  return new Promise((resolve) => {
    const img = new Image();
    if (typeof src === 'string' && !src.startsWith('data:') && !src.startsWith('blob:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Samples the average skin tone, luminance, and color distribution from the template canvas
 */
export function sampleSkinStats(ctx, cx, cy, radius) {
  if (!ctx || radius <= 0) {
    return { meanR: 180, meanG: 140, meanB: 110, stdR: 40, stdG: 35, stdB: 30, luminance: 140, warmth: 15 };
  }

  try {
    const r = Math.max(12, Math.round(radius * 0.65));
    const sx = Math.max(0, Math.round(cx - r));
    const sy = Math.max(0, Math.round(cy - r));
    const sw = Math.min(r * 2, ctx.canvas.width - sx);
    const sh = Math.min(r * 2, ctx.canvas.height - sy);

    const imgData = ctx.getImageData(sx, sy, sw, sh);
    const data = imgData.data;

    let sumR = 0, sumG = 0, sumB = 0, count = 0;
    // Step by 8 for high performance
    for (let i = 0; i < data.length; i += 8) {
      const a = data[i + 3];
      if (a > 50) {
        sumR += data[i];
        sumG += data[i + 1];
        sumB += data[i + 2];
        count++;
      }
    }

    if (count === 0) {
      return { meanR: 180, meanG: 140, meanB: 110, stdR: 40, stdG: 35, stdB: 30, luminance: 140, warmth: 15 };
    }

    const meanR = sumR / count;
    const meanG = sumG / count;
    const meanB = sumB / count;

    // Standard deviation
    let sqR = 0, sqG = 0, sqB = 0;
    for (let i = 0; i < data.length; i += 8) {
      if (data[i + 3] > 50) {
        sqR += Math.pow(data[i] - meanR, 2);
        sqG += Math.pow(data[i + 1] - meanG, 2);
        sqB += Math.pow(data[i + 2] - meanB, 2);
      }
    }

    const stdR = Math.max(15, Math.sqrt(sqR / count));
    const stdG = Math.max(15, Math.sqrt(sqG / count));
    const stdB = Math.max(15, Math.sqrt(sqB / count));

    const luminance = Math.round(0.299 * meanR + 0.587 * meanG + 0.114 * meanB);
    const warmth = Math.max(0, Math.min(45, Math.round(((meanR - meanB) / 255) * 50)));

    return { meanR, meanG, meanB, stdR, stdG, stdB, luminance, warmth };
  } catch (err) {
    console.warn('Sample skin stats error (cross-origin fallback):', err);
    return { meanR: 180, meanG: 140, meanB: 110, stdR: 40, stdG: 35, stdB: 30, luminance: 140, warmth: 15 };
  }
}

/**
 * Creates an organic anatomical feature mask focusing on eyes, nose, and mouth
 * with smooth gradient falloff so outer skull, hair, and neck stay 100% original.
 */
export function createFeatureGraftMask(width, height = width, options = {}) {
  let opts = options;
  let h = height;
  if (typeof height === 'object' && height !== null) {
    opts = height;
    h = width;
  }
  const feather = opts.feather !== undefined ? opts.feather : Math.round(width * 0.12);
  const mouthExtend = opts.mouthExtend !== undefined ? opts.mouthExtend : 1.08;

  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = width;
  maskCanvas.height = h;
  const ctx = maskCanvas.getContext('2d');

  const cx = width / 2;
  const cy = h * 0.48;
  const rx = width * 0.42;
  const ry = h * 0.48 * mouthExtend;

  // Solid-core radial gradient: 100% opaque across eyes, nose, and mouth, fading only at skin perimeter
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx);
  grad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
  grad.addColorStop(0.70, 'rgba(0, 0, 0, 1.0)'); // SOLID CORE - NO GHOSTING
  grad.addColorStop(0.85, 'rgba(0, 0, 0, 0.75)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  // Anatomical rounded diamond contour
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  // Subtle boundary softening
  if (feather > 0) {
    const blurCanvas = document.createElement('canvas');
    blurCanvas.width = width;
    blurCanvas.height = h;
    const bCtx = blurCanvas.getContext('2d');
    bCtx.filter = `blur(${Math.min(8, Math.max(3, feather))}px)`;
    bCtx.drawImage(maskCanvas, 0, 0);
    return blurCanvas;
  }

  return maskCanvas;
}

/**
 * Performs Reinhard Color Transfer in RGB space to match the incoming photo's
 * skin tone and ambient lighting to the meme template's character.
 */
export function applySkinColorTransfer(canvas, targetStats, { warmthShift = 0, brightnessShift = 0 } = {}) {
  const ctx = canvas.getContext('2d');
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  // First pass: compute source photo mean and std
  let sumR = 0, sumG = 0, sumB = 0, count = 0;
  for (let i = 0; i < data.length; i += 8) {
    if (data[i + 3] > 60) {
      sumR += data[i];
      sumG += data[i + 1];
      sumB += data[i + 2];
      count++;
    }
  }

  if (count === 0) return canvas;

  const srcMeanR = sumR / count;
  const srcMeanG = sumG / count;
  const srcMeanB = sumB / count;

  let sqR = 0, sqG = 0, sqB = 0;
  for (let i = 0; i < data.length; i += 8) {
    if (data[i + 3] > 60) {
      sqR += Math.pow(data[i] - srcMeanR, 2);
      sqG += Math.pow(data[i + 1] - srcMeanG, 2);
      sqB += Math.pow(data[i + 2] - srcMeanB, 2);
    }
  }

  const srcStdR = Math.max(10, Math.sqrt(sqR / count));
  const srcStdG = Math.max(10, Math.sqrt(sqG / count));
  const srcStdB = Math.max(10, Math.sqrt(sqB / count));

  // Target values with user adjustments
  const tgtMeanR = targetStats.meanR * (1 + brightnessShift * 0.005) + warmthShift * 0.8;
  const tgtMeanG = targetStats.meanG * (1 + brightnessShift * 0.005) + warmthShift * 0.2;
  const tgtMeanB = targetStats.meanB * (1 + brightnessShift * 0.005) - warmthShift * 0.5;

  const scaleR = Math.min(1.4, Math.max(0.6, targetStats.stdR / srcStdR));
  const scaleG = Math.min(1.4, Math.max(0.6, targetStats.stdG / srcStdG));
  const scaleB = Math.min(1.4, Math.max(0.6, targetStats.stdB / srcStdB));

  // Second pass: map pixel colors
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 20) {
      const r = (data[i] - srcMeanR) * scaleR + tgtMeanR;
      const g = (data[i + 1] - srcMeanG) * scaleG + tgtMeanG;
      const b = (data[i + 2] - srcMeanB) * scaleB + tgtMeanB;

      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * Frames and crops an uploaded portrait photo to focus squarely on the face
 * with automatic skin cluster detection, eliminating suits, shoulders, and background.
 */
export function frameFaceSquare(img, size = 400) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!img) return canvas;

  const w = img.naturalWidth || img.width || size;
  const h = img.naturalHeight || img.height || size;

  // If already square (e.g. SVG presets, patch canvases), draw directly
  if (Math.abs(w - h) < 6) {
    ctx.drawImage(img, 0, 0, size, size);
    return canvas;
  }

  // Detect skin cluster to center directly on facial features
  let cx = w * 0.5;
  let cy = h * 0.42;
  let cropSize = Math.min(w, h) * 0.82;

  try {
    const tempC = document.createElement('canvas');
    tempC.width = w;
    tempC.height = h;
    const tCtx = tempC.getContext('2d');
    tCtx.drawImage(img, 0, 0);
    const data = tCtx.getImageData(0, 0, w, h).data;

    let sumX = 0, sumY = 0, count = 0;
    let minX = w, maxX = 0, minY = h, maxY = 0;
    const step = Math.max(2, Math.round(w / 180));

    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const i = (y * w + x) * 4;
        const r = data[i], g = data[i + 1], b = data[i + 2];
        if (r > 85 && g > 45 && b > 25 && (r - g > 12) && (r > b) && (Math.max(r, g, b) - Math.min(r, g, b) > 12)) {
          sumX += x; sumY += y; count++;
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
    }

    if (count > 80) {
      cx = (minX + maxX) / 2;
      cy = minY + (maxY - minY) * 0.38;
      const cW = maxX - minX;
      cropSize = cW * 1.08;
    }
  } catch {
    // Cross-origin fallback: upper-center crop
  }

  cropSize = Math.min(cropSize, Math.min(w, h));
  const sx = Math.max(0, Math.min(w - cropSize, cx - cropSize / 2));
  const sy = Math.max(0, Math.min(h - cropSize, cy - cropSize / 2));

  ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, size, size);
  return canvas;
}

/**
 * Fuses the target face photo directly into the base template canvas image.
 * Uses true anatomical Delaunay mesh warping and skin tone transfer.
 * Returns a high-res data URL of the modified template with the face morphed in place.
 */
export async function fuseFaceIntoTemplate({
  baseImg,
  faceTarget, // { x, y, radius } normalized [0, 1]
  photoImg,
  morphedPatch = null,
  landmarksA = null,
  landmarksB = null,
  triangles = null,
  morphProgress = 0.85, // 0 = original meme, 1 = full morph
  warmth = 0,
  brightness = 0,
  flipX = false,
  rotation = 0
}) {
  if (!baseImg || (!photoImg && !morphedPatch) || !faceTarget) return null;

  const base = await loadImg(baseImg);
  if (!base) return null;

  const bW = base.naturalWidth || base.width || 800;
  const bH = base.naturalHeight || base.height || 800;

  const canvas = document.createElement('canvas');
  canvas.width = bW;
  canvas.height = bH;
  const ctx = canvas.getContext('2d');

  // 1. Draw base template image
  ctx.drawImage(base, 0, 0, bW, bH);

  // If morphProgress is 0, return untouched template
  if (morphProgress <= 0.01) {
    return canvas.toDataURL('image/png');
  }

  // Calculate face coordinates on base image
  const cx = faceTarget.x * bW;
  const cy = faceTarget.y * bH;
  const r = (faceTarget.radius || 0.14) * bW;
  const faceSize = Math.max(64, Math.round(r * 2.3));

  // Sample template skin tone under the face
  const skinStats = sampleSkinStats(ctx, cx, cy, r);

  let warpedFaceCanvas = null;

  // Case A: Dynamic Landmark Grafting on pristine base image (Option 1 Laplacian Blend)
  if (landmarksA && landmarksB && photoImg) {
    const photo = await loadImg(photoImg);
    if (photo) {
      // 1. Extract clean patch A directly from base image
      const patchA = document.createElement('canvas');
      patchA.width = faceSize;
      patchA.height = faceSize;
      const pCtxA = patchA.getContext('2d');
      pCtxA.drawImage(
        base,
        cx - faceSize / 2,
        cy - faceSize / 2,
        faceSize,
        faceSize,
        0,
        0,
        faceSize,
        faceSize
      );

      // 2. Prepare patch B from user photo
      const patchB = document.createElement('canvas');
      patchB.width = faceSize;
      patchB.height = faceSize;
      const pCtxB = patchB.getContext('2d');
      pCtxB.save();
      pCtxB.translate(faceSize / 2, faceSize / 2);
      if (rotation) pCtxB.rotate((rotation * Math.PI) / 180);
      if (flipX) pCtxB.scale(-1, 1);
      const framedPhoto = frameFaceSquare(photo, faceSize);
      pCtxB.drawImage(framedPhoto, -faceSize / 2, -faceSize / 2, faceSize, faceSize);
      pCtxB.restore();

      // 3. Multi-Band Laplacian Pyramid & Inner Feature Grafting
      warpedFaceCanvas = document.createElement('canvas');
      warpedFaceCanvas.width = faceSize;
      warpedFaceCanvas.height = faceSize;

      morphFaceMesh({
        sourceCanvasA: patchA,
        landmarksA,
        sourceCanvasB: patchB,
        landmarksB,
        morphProgress,
        outputCanvas: warpedFaceCanvas,
        triangles,
        featherEdge: true,
        solidCore: true,
        blendMode: 'laplacian'
      });
    }
  }

  // Case B: Pre-morphed patch fallback if landmarks not available
  if (!warpedFaceCanvas && morphedPatch) {
    const loadedPatch = await loadImg(morphedPatch);
    if (loadedPatch) {
      warpedFaceCanvas = document.createElement('canvas');
      warpedFaceCanvas.width = faceSize;
      warpedFaceCanvas.height = faceSize;
      const wCtx = warpedFaceCanvas.getContext('2d');
      wCtx.drawImage(loadedPatch, 0, 0, faceSize, faceSize);
    }
  }

  // Case C: Standard feature fusion fallback if no landmarks/patch
  if (!warpedFaceCanvas && photoImg) {
    const photo = await loadImg(photoImg);
    if (photo) {
      warpedFaceCanvas = document.createElement('canvas');
      warpedFaceCanvas.width = faceSize;
      warpedFaceCanvas.height = faceSize;
      const pCtx = warpedFaceCanvas.getContext('2d');

      pCtx.save();
      pCtx.translate(faceSize / 2, faceSize / 2);
      if (rotation) pCtx.rotate((rotation * Math.PI) / 180);
      if (flipX) pCtx.scale(-1, 1);
      const framedPhoto = frameFaceSquare(photo, faceSize);
      pCtx.drawImage(framedPhoto, -faceSize / 2, -faceSize / 2, faceSize, faceSize);
      pCtx.restore();

      applySkinColorTransfer(warpedFaceCanvas, skinStats, {
        warmthShift: warmth,
        brightnessShift: brightness
      });

      const mask = createFeatureGraftMask(faceSize, faceSize, {
        feather: Math.max(4, Math.round(faceSize * 0.10))
      });
      pCtx.globalCompositeOperation = 'destination-in';
      pCtx.drawImage(mask, 0, 0);
      pCtx.globalCompositeOperation = 'source-over';
    }
  }

  // Blend warped face directly into template pixels
  if (warpedFaceCanvas) {
    ctx.save();
    // Solid core feature overlay prevents ghosting under original features
    const effectiveAlpha = morphProgress >= 0.70 ? 1.0 : Math.max(0.0, morphProgress / 0.70);
    ctx.globalAlpha = effectiveAlpha;
    ctx.drawImage(warpedFaceCanvas, cx - faceSize / 2, cy - faceSize / 2, faceSize, faceSize);
    ctx.restore();
  }

  return canvas.toDataURL('image/png');
}
