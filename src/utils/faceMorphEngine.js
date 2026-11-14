import { Delaunay } from 'd3-delaunay';

// 44 canonical facial feature landmarks normalized [0, 1]
// Includes 8 perimeter anchors so boundary transitions are 100% seamless
export const CANONICAL_LANDMARKS = [
  // 0-7: Perimeter anchors (corners & edge midpoints)
  { id: 'p_tl', name: 'Top-Left Anchor', x: 0.0, y: 0.0, isAnchor: true },
  { id: 'p_tm', name: 'Top-Mid Anchor', x: 0.5, y: 0.0, isAnchor: true },
  { id: 'p_tr', name: 'Top-Right Anchor', x: 1.0, y: 0.0, isAnchor: true },
  { id: 'p_mr', name: 'Mid-Right Anchor', x: 1.0, y: 0.5, isAnchor: true },
  { id: 'p_br', name: 'Bottom-Right Anchor', x: 1.0, y: 1.0, isAnchor: true },
  { id: 'p_bm', name: 'Bottom-Mid Anchor', x: 0.5, y: 1.0, isAnchor: true },
  { id: 'p_bl', name: 'Bottom-Left Anchor', x: 0.0, y: 1.0, isAnchor: true },
  { id: 'p_ml', name: 'Mid-Left Anchor', x: 0.0, y: 0.5, isAnchor: true },

  // 8-10: Forehead & Temples
  { id: 'forehead', name: 'Forehead Top', x: 0.50, y: 0.15, category: 'forehead' },
  { id: 'temple_l', name: 'Left Temple', x: 0.22, y: 0.22, category: 'forehead' },
  { id: 'temple_r', name: 'Right Temple', x: 0.78, y: 0.22, category: 'forehead' },

  // 11-14: Eyebrows
  { id: 'brow_l_out', name: 'Left Brow Outer', x: 0.22, y: 0.30, category: 'brows' },
  { id: 'brow_l_in', name: 'Left Brow Inner', x: 0.42, y: 0.30, category: 'brows' },
  { id: 'brow_r_in', name: 'Right Brow Inner', x: 0.58, y: 0.30, category: 'brows' },
  { id: 'brow_r_out', name: 'Right Brow Outer', x: 0.78, y: 0.30, category: 'brows' },

  // 15-19: Left Eye
  { id: 'eye_l_center', name: 'Left Pupil', x: 0.33, y: 0.38, category: 'eyes', isKeyPin: true },
  { id: 'eye_l_out', name: 'Left Eye Outer', x: 0.24, y: 0.38, category: 'eyes' },
  { id: 'eye_l_top', name: 'Left Eye Top', x: 0.33, y: 0.34, category: 'eyes' },
  { id: 'eye_l_in', name: 'Left Eye Inner', x: 0.42, y: 0.38, category: 'eyes' },
  { id: 'eye_l_bot', name: 'Left Eye Bottom', x: 0.33, y: 0.42, category: 'eyes' },

  // 20-24: Right Eye
  { id: 'eye_r_center', name: 'Right Pupil', x: 0.67, y: 0.38, category: 'eyes', isKeyPin: true },
  { id: 'eye_r_in', name: 'Right Eye Inner', x: 0.58, y: 0.38, category: 'eyes' },
  { id: 'eye_r_top', name: 'Right Eye Top', x: 0.67, y: 0.34, category: 'eyes' },
  { id: 'eye_r_out', name: 'Right Eye Outer', x: 0.76, y: 0.38, category: 'eyes' },
  { id: 'eye_r_bot', name: 'Right Eye Bottom', x: 0.67, y: 0.42, category: 'eyes' },

  // 25-29: Nose
  { id: 'nose_bridge', name: 'Nose Bridge', x: 0.50, y: 0.40, category: 'nose' },
  { id: 'nose_tip', name: 'Nose Tip', x: 0.50, y: 0.54, category: 'nose', isKeyPin: true },
  { id: 'nose_nostril_l', name: 'Left Nostril', x: 0.43, y: 0.53, category: 'nose' },
  { id: 'nose_nostril_r', name: 'Right Nostril', x: 0.57, y: 0.53, category: 'nose' },
  { id: 'nose_columella', name: 'Nose Base', x: 0.50, y: 0.58, category: 'nose' },

  // 30-37: Mouth & Lips
  { id: 'mouth_corner_l', name: 'Mouth Left Corner', x: 0.34, y: 0.68, category: 'mouth', isKeyPin: true },
  { id: 'mouth_corner_r', name: 'Mouth Right Corner', x: 0.66, y: 0.68, category: 'mouth', isKeyPin: true },
  { id: 'mouth_lip_top', name: 'Upper Lip Peak', x: 0.50, y: 0.63, category: 'mouth' },
  { id: 'mouth_center', name: 'Mouth Center', x: 0.50, y: 0.67, category: 'mouth' },
  { id: 'mouth_lip_bot', name: 'Lower Lip Bottom', x: 0.50, y: 0.74, category: 'mouth' },
  { id: 'mouth_lip_bot_inner', name: 'Lower Lip Inner', x: 0.50, y: 0.70, category: 'mouth' },
  { id: 'mouth_mid_l', name: 'Upper Lip Left', x: 0.42, y: 0.65, category: 'mouth' },
  { id: 'mouth_mid_r', name: 'Upper Lip Right', x: 0.58, y: 0.65, category: 'mouth' },

  // 38-43: Cheeks & Jawline
  { id: 'cheek_l', name: 'Left Cheek', x: 0.20, y: 0.52, category: 'jaw' },
  { id: 'cheek_r', name: 'Right Cheek', x: 0.80, y: 0.52, category: 'jaw' },
  { id: 'jaw_l', name: 'Left Jaw', x: 0.26, y: 0.76, category: 'jaw' },
  { id: 'jaw_r', name: 'Right Jaw', x: 0.74, y: 0.76, category: 'jaw' },
  { id: 'chin_center', name: 'Chin Center', x: 0.50, y: 0.88, category: 'jaw', isKeyPin: true },
  { id: 'chin_bot', name: 'Chin Bottom', x: 0.50, y: 0.94, category: 'jaw' }
];

import { getDefaultLandmarks as getUnifiedLandmarks, createAnatomicalFaceMask, createInnerFeatureMask } from './faceLandmarkerService';
import { blendLaplacianMultiBand } from './laplacianBlendEngine';

/**
 * Returns a deep copy of default landmarks (unified 78-point mesh)
 */
export function getDefaultLandmarks() {
  return getUnifiedLandmarks();
}

/**
 * Warps a single triangle from source image to destination canvas using affine transformation
 */
export function warpTriangle(ctx, srcImage, p1, p2, p3, q1, q2, q3) {
  const x1 = p1.x, y1 = p1.y;
  const x2 = p2.x, y2 = p2.y;
  const x3 = p3.x, y3 = p3.y;

  const u1 = q1.x, v1 = q1.y;
  const u2 = q2.x, v2 = q2.y;
  const u3 = q3.x, v3 = q3.y;

  const det = (x1 - x3) * (y2 - y3) - (x2 - x3) * (y1 - y3);
  if (Math.abs(det) < 1e-7) return; // Avoid degenerate matrix

  const a = ((u1 - u3) * (y2 - y3) - (u2 - u3) * (y1 - y3)) / det;
  const c = ((x1 - x3) * (u2 - u3) - (x2 - x3) * (u1 - u3)) / det;
  const b = ((v1 - v3) * (y2 - y3) - (v2 - v3) * (y1 - y3)) / det;
  const d = ((x1 - x3) * (v2 - v3) - (x2 - x3) * (v1 - v3)) / det;
  const e = u3 - a * x3 - c * y3;
  const f = v3 - b * x3 - d * y3;

  ctx.save();
  ctx.beginPath();

  // Subtle outward centroid padding (0.6px) prevents any subpixel crack between adjacent triangles
  const cx = (u1 + u2 + u3) / 3;
  const cy = (v1 + v2 + v3) / 3;
  const expand = 0.6;

  const pad = (pt) => {
    const dx = pt.x - cx;
    const dy = pt.y - cy;
    const dist = Math.hypot(dx, dy) || 1;
    return { x: pt.x + (dx / dist) * expand, y: pt.y + (dy / dist) * expand };
  };

  const ep1 = pad(q1);
  const ep2 = pad(q2);
  const ep3 = pad(q3);

  ctx.moveTo(ep1.x, ep1.y);
  ctx.lineTo(ep2.x, ep2.y);
  ctx.lineTo(ep3.x, ep3.y);
  ctx.closePath();
  ctx.clip();

  ctx.transform(a, b, c, d, e, f);
  ctx.drawImage(srcImage, 0, 0);
  ctx.restore();
}

/**
 * Executes true landmark mesh face morph between Face A and Face B at progress t in [0, 1]
 */
export function morphFaceMesh({
  sourceCanvasA,
  landmarksA,
  sourceCanvasB,
  landmarksB,
  morphProgress = 0.5,
  outputCanvas,
  triangles = null,
  featherEdge = true,
  solidCore = true,
  blendMode = 'laplacian' // 'laplacian' | 'classical'
}) {
  if (!outputCanvas || !sourceCanvasA || !sourceCanvasB) return;
  if (!landmarksA || !landmarksB || landmarksA.length === 0) return;

  const size = outputCanvas.width;
  const outCtx = outputCanvas.getContext('2d');
  outCtx.clearRect(0, 0, size, size);

  const t = Math.max(0, Math.min(1, morphProgress));

  // For Laplacian mode: exclude 8 outer box anchors to prevent elf-ear/neck distortion
  const isLaplacian = blendMode === 'laplacian';
  const effectiveLandmarksA = isLaplacian ? landmarksA.filter(p => !p.isAnchor) : landmarksA;
  const effectiveLandmarksB = isLaplacian ? landmarksB.filter(p => !p.isAnchor) : landmarksB;

  // Dynamically compute Delaunay triangles on anatomical facial features
  let activeTriangles = triangles;
  if (!activeTriangles || activeTriangles.length === 0 || isLaplacian || effectiveLandmarksA.length !== CANONICAL_LANDMARKS.length) {
    const pts = effectiveLandmarksA.map((p, i) => {
      const pB = effectiveLandmarksB[i] || p;
      return [(p.x + pB.x) / 2, (p.y + pB.y) / 2];
    });
    const delaunay = Delaunay.from(pts);
    activeTriangles = [];
    for (let i = 0; i < delaunay.triangles.length; i += 3) {
      activeTriangles.push([
        delaunay.triangles[i],
        delaunay.triangles[i + 1],
        delaunay.triangles[i + 2]
      ]);
    }
  }

  // Compute interpolated target landmark coordinates at progress t
  const currentPoints = effectiveLandmarksA.map((ptA, idx) => {
    const ptB = effectiveLandmarksB[idx] || ptA;
    const normX = (1 - t) * ptA.x + t * ptB.x;
    const normY = (1 - t) * ptA.y + t * ptB.y;
    return {
      x: normX * size,
      y: normY * size
    };
  });

  const scaledPtsA = effectiveLandmarksA.map(p => ({ x: p.x * size, y: p.y * size }));
  const scaledPtsB = effectiveLandmarksB.map(p => ({ x: p.x * size, y: p.y * size }));

  // Offscreen buffer for Warped Face A (Meme Face)
  const bufferA = document.createElement('canvas');
  bufferA.width = size;
  bufferA.height = size;
  const ctxA = bufferA.getContext('2d');
  ctxA.drawImage(sourceCanvasA, 0, 0, size, size);

  // Offscreen buffer for Warped Face B (Photo Face)
  const bufferB = document.createElement('canvas');
  bufferB.width = size;
  bufferB.height = size;
  const ctxB = bufferB.getContext('2d');
  // Initialize bufferB with sourceCanvasA so outer non-warped region is continuous skin, not black
  if (isLaplacian) {
    ctxB.drawImage(sourceCanvasA, 0, 0, size, size);
  }

  // Warp all triangles for both faces into the shared intermediate geometry
  for (let i = 0; i < activeTriangles.length; i++) {
    const [i1, i2, i3] = activeTriangles[i];
    if (i1 >= currentPoints.length || i2 >= currentPoints.length || i3 >= currentPoints.length) continue;

    const q1 = currentPoints[i1];
    const q2 = currentPoints[i2];
    const q3 = currentPoints[i3];

    if (t < 1 && !isLaplacian) {
      warpTriangle(ctxA, sourceCanvasA, scaledPtsA[i1], scaledPtsA[i2], scaledPtsA[i3], q1, q2, q3);
    }
    if (t > 0) {
      warpTriangle(ctxB, sourceCanvasB, scaledPtsB[i1], scaledPtsB[i2], scaledPtsB[i3], q1, q2, q3);
    }
  }

  // Option 1: Multi-Band Laplacian Pyramid & Inner Feature Inset Grafting
  if (isLaplacian) {
    const maskLandmarks = currentPoints.map((p, i) => ({
      x: p.x / size,
      y: p.y / size,
      meshIdx: effectiveLandmarksA[i]?.meshIdx,
      id: effectiveLandmarksA[i]?.id
    }));

    // Create organic inner feature mask strictly protecting hair, forehead, ears, beard outline
    const innerMask = createInnerFeatureMask(maskLandmarks, size, Math.max(8, Math.round(size * 0.040)));

    // Re-light and harmonize user features with meme illumination
    const harmonizedCanvas = blendLaplacianMultiBand({
      targetCanvas: bufferA,
      warpedCanvas: bufferB,
      maskCanvas: innerMask,
      width: size,
      height: size,
      blendStrength: t,
      detailStrength: 1.25,
      albedoWeight: 0.10
    });

    outCtx.drawImage(harmonizedCanvas, 0, 0);
    return;
  }

  // Classical fallback blend mode
  if (t < 1) {
    outCtx.globalAlpha = 1 - t;
    outCtx.drawImage(bufferA, 0, 0);
  }
  if (t > 0) {
    outCtx.globalAlpha = solidCore && t >= 0.70 ? 1.0 : t;
    outCtx.drawImage(bufferB, 0, 0);
  }
  outCtx.globalAlpha = 1.0;

  if (featherEdge) {
    const maskLandmarks = currentPoints.map((p, i) => ({
      x: p.x / size,
      y: p.y / size,
      meshIdx: landmarksA[i]?.meshIdx,
      id: landmarksA[i]?.id
    }));
    const maskCanvas = createAnatomicalFaceMask(maskLandmarks, size, Math.max(3, Math.round(size * 0.04)));

    outCtx.globalCompositeOperation = 'destination-in';
    outCtx.drawImage(maskCanvas, 0, 0);
    outCtx.globalCompositeOperation = 'source-over';
  }
}
