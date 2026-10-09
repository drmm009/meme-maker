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

// Pre-computed canonical triangulation indices
export const CANONICAL_TRIANGLES = (() => {
  const pts = CANONICAL_LANDMARKS.map(p => [p.x, p.y]);
  const delaunay = Delaunay.from(pts);
  const triIndices = [];
  for (let i = 0; i < delaunay.triangles.length; i += 3) {
    triIndices.push([
      delaunay.triangles[i],
      delaunay.triangles[i + 1],
      delaunay.triangles[i + 2]
    ]);
  }
  return triIndices;
})();

/**
 * Returns a deep copy of default landmarks
 */
export function getDefaultLandmarks() {
  return CANONICAL_LANDMARKS.map(p => ({ ...p }));
}

/**
 * Generates angle/expression presets for quick alignment
 */
export function getLandmarkPreset(presetType = 'front') {
  const base = getDefaultLandmarks();
  if (presetType === 'front') return base;

  if (presetType === 'left') {
    // 3/4 View turned towards left (like Drake upper panel)
    return base.map(p => {
      if (p.isAnchor) return p;
      let nx = p.x;
      let ny = p.y;
      // Shift features slightly left and compress left side
      if (p.x < 0.5) {
        nx = 0.5 - (0.5 - p.x) * 0.75 - 0.06;
      } else {
        nx = 0.5 + (p.x - 0.5) * 1.15 - 0.06;
      }
      return { ...p, x: Math.max(0.04, Math.min(0.96, nx)), y: ny };
    });
  }

  if (presetType === 'right') {
    // 3/4 View turned towards right
    return base.map(p => {
      if (p.isAnchor) return p;
      let nx = p.x;
      let ny = p.y;
      if (p.x > 0.5) {
        nx = 0.5 + (p.x - 0.5) * 0.75 + 0.06;
      } else {
        nx = 0.5 - (0.5 - p.x) * 1.15 + 0.06;
      }
      return { ...p, x: Math.max(0.04, Math.min(0.96, nx)), y: ny };
    });
  }

  if (presetType === 'smile') {
    // Wide meme smile
    return base.map(p => {
      if (p.id === 'mouth_corner_l') return { ...p, x: p.x - 0.04, y: p.y - 0.03 };
      if (p.id === 'mouth_corner_r') return { ...p, x: p.x + 0.04, y: p.y - 0.03 };
      if (p.id === 'mouth_lip_bot') return { ...p, y: p.y + 0.03 };
      if (p.id === 'cheek_l') return { ...p, y: p.y - 0.02 };
      if (p.id === 'cheek_r') return { ...p, y: p.y - 0.02 };
      return p;
    });
  }

  return base;
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
  triangles = CANONICAL_TRIANGLES,
  featherEdge = true
}) {
  if (!outputCanvas || !sourceCanvasA || !sourceCanvasB) return;

  const size = outputCanvas.width;
  const outCtx = outputCanvas.getContext('2d');
  outCtx.clearRect(0, 0, size, size);

  const t = Math.max(0, Math.min(1, morphProgress));

  // Compute interpolated target landmark coordinates at progress t
  const currentPoints = landmarksA.map((ptA, idx) => {
    const ptB = landmarksB[idx] || ptA;
    const normX = (1 - t) * ptA.x + t * ptB.x;
    const normY = (1 - t) * ptA.y + t * ptB.y;
    return {
      x: normX * size,
      y: normY * size
    };
  });

  const scaledPtsA = landmarksA.map(p => ({ x: p.x * size, y: p.y * size }));
  const scaledPtsB = landmarksB.map(p => ({ x: p.x * size, y: p.y * size }));

  // Offscreen buffer for Warped Face A (Meme Face)
  const bufferA = document.createElement('canvas');
  bufferA.width = size;
  bufferA.height = size;
  const ctxA = bufferA.getContext('2d');

  // Offscreen buffer for Warped Face B (Photo Face)
  const bufferB = document.createElement('canvas');
  bufferB.width = size;
  bufferB.height = size;
  const ctxB = bufferB.getContext('2d');

  // Warp all triangles for both faces into the shared intermediate geometry
  for (let i = 0; i < triangles.length; i++) {
    const [i1, i2, i3] = triangles[i];
    const q1 = currentPoints[i1];
    const q2 = currentPoints[i2];
    const q3 = currentPoints[i3];

    if (t < 1) {
      warpTriangle(ctxA, sourceCanvasA, scaledPtsA[i1], scaledPtsA[i2], scaledPtsA[i3], q1, q2, q3);
    }
    if (t > 0) {
      warpTriangle(ctxB, sourceCanvasB, scaledPtsB[i1], scaledPtsB[i2], scaledPtsB[i3], q1, q2, q3);
    }
  }

  // Cross-fade the two warped textures
  if (t < 1) {
    outCtx.globalAlpha = 1 - t;
    outCtx.drawImage(bufferA, 0, 0);
  }
  if (t > 0) {
    outCtx.globalAlpha = t;
    outCtx.drawImage(bufferB, 0, 0);
  }
  outCtx.globalAlpha = 1.0;

  // Feather outer border so the face morph melts seamlessly into the meme background
  if (featherEdge) {
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = size;
    maskCanvas.height = size;
    const mCtx = maskCanvas.getContext('2d');

    const featherPx = Math.round(size * 0.08); // 8% smooth perimeter feather
    mCtx.filter = `blur(${featherPx}px)`;
    mCtx.fillStyle = '#000000';
    mCtx.beginPath();
    // Inset oval mask
    mCtx.ellipse(size / 2, size / 2, size * 0.44, size * 0.44, 0, 0, Math.PI * 2);
    mCtx.fill();

    outCtx.globalCompositeOperation = 'destination-in';
    outCtx.drawImage(maskCanvas, 0, 0);
    outCtx.globalCompositeOperation = 'source-over';
  }
}

/**
 * Draws interactive wireframe mesh and draggable landmark pins for visual tuning
 */
export function drawLandmarkMeshOverlay(ctx, landmarks, size, { showTriangles = true, showPins = true, activePinId = null, color = '#06b6d4' }) {
  if (!ctx || !landmarks) return;

  const pts = landmarks.map(p => ({ id: p.id, name: p.name, x: p.x * size, y: p.y * size, isAnchor: p.isAnchor, isKeyPin: p.isKeyPin }));

  // Draw wireframe triangles
  if (showTriangles) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.4;

    for (let i = 0; i < CANONICAL_TRIANGLES.length; i++) {
      const [i1, i2, i3] = CANONICAL_TRIANGLES[i];
      const p1 = pts[i1], p2 = pts[i2], p3 = pts[i3];
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
  }

  // Draw landmark pins
  if (showPins) {
    pts.forEach(p => {
      if (p.isAnchor) return; // Don't draw border anchors as interactive pins

      const isActive = p.id === activePinId;
      const isKey = p.isKeyPin;
      const radius = isActive ? 7 : (isKey ? 5.5 : 3.5);

      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);

      if (isActive) {
        ctx.fillStyle = '#ff0055';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
      } else if (isKey) {
        ctx.fillStyle = color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
      }

      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });
  }
}
