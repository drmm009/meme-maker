/**
 * Client-Side MediaPipe FaceLandmarker Service
 * Detects 478 3D facial landmarks directly in browser WebGL/WASM
 * Extracts 78-point Delaunay morph topology (70 anatomical features + 8 boundary anchors).
 */

import { Delaunay } from 'd3-delaunay';

// 70 anatomical MediaPipe landmark indices
export const KEY_LANDMARK_INDICES = [
  // Jawline & Chin (21 points)
  234, 93, 132, 58, 172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397, 288, 361, 323, 454,
  // Eyebrows (10 points)
  70, 63, 105, 66, 107, 336, 296, 334, 293, 300,
  // Nose (10 points)
  168, 6, 197, 195, 5, 4, 1, 19, 94, 2,
  // Eyes & Pupils (12 points)
  33, 160, 158, 133, 153, 144, 362, 385, 387, 263, 373, 380,
  // Mouth & Lips (20 points)
  61, 39, 37, 0, 267, 269, 291, 405, 314, 17, 84, 181, 78, 82, 13, 312, 308, 317, 14, 87,
  // Forehead & Temples (15 points)
  10, 338, 297, 332, 284, 251, 389, 356, 127, 162, 21, 54, 103, 67, 109
];

// Highlighted pins for user interaction
export const KEY_PIN_INDICES = new Set([
  152, // Chin Center
  1,   // Nose Tip
  4,   // Nose Base
  133, // Left Eye Inner
  362, // Right Eye Inner
  61,  // Mouth Left Corner
  291, // Mouth Right Corner
  13,  // Upper Lip Center
  14   // Lower Lip Center
]);

export const BOUNDARY_ANCHORS = [
  { id: 'b_tl', x: 0.0, y: 0.0, isAnchor: true },
  { id: 'b_tm', x: 0.5, y: 0.0, isAnchor: true },
  { id: 'b_tr', x: 1.0, y: 0.0, isAnchor: true },
  { id: 'b_mr', x: 1.0, y: 0.5, isAnchor: true },
  { id: 'b_br', x: 1.0, y: 1.0, isAnchor: true },
  { id: 'b_bm', x: 0.5, y: 1.0, isAnchor: true },
  { id: 'b_bl', x: 0.0, y: 1.0, isAnchor: true },
  { id: 'b_ml', x: 0.0, y: 0.5, isAnchor: true }
];

// Canonical 70 feature landmark coordinates matching KEY_LANDMARK_INDICES 1:1
export const CANONICAL_70_COORDS = [
  // Jawline & Chin (21 points)
  { idx: 234, x: 0.08, y: 0.40 }, { idx: 93, x: 0.08, y: 0.48 }, { idx: 132, x: 0.09, y: 0.57 }, { idx: 58, x: 0.12, y: 0.67 }, { idx: 172, x: 0.16, y: 0.74 },
  { idx: 136, x: 0.21, y: 0.79 }, { idx: 150, x: 0.27, y: 0.83 }, { idx: 149, x: 0.33, y: 0.86 }, { idx: 176, x: 0.39, y: 0.89 }, { idx: 148, x: 0.46, y: 0.91 },
  { idx: 152, x: 0.50, y: 0.92 }, { idx: 377, x: 0.54, y: 0.91 }, { idx: 400, x: 0.61, y: 0.89 }, { idx: 378, x: 0.67, y: 0.86 }, { idx: 379, x: 0.73, y: 0.83 },
  { idx: 365, x: 0.79, y: 0.79 }, { idx: 397, x: 0.84, y: 0.74 }, { idx: 288, x: 0.88, y: 0.67 }, { idx: 361, x: 0.91, y: 0.57 }, { idx: 323, x: 0.92, y: 0.48 },
  { idx: 454, x: 0.92, y: 0.40 },
  // Eyebrows (10 points)
  { idx: 70, x: 0.18, y: 0.22 }, { idx: 63, x: 0.24, y: 0.18 }, { idx: 105, x: 0.30, y: 0.16 }, { idx: 66, x: 0.38, y: 0.17 }, { idx: 107, x: 0.45, y: 0.19 },
  { idx: 336, x: 0.55, y: 0.19 }, { idx: 296, x: 0.62, y: 0.17 }, { idx: 334, x: 0.70, y: 0.16 }, { idx: 293, x: 0.76, y: 0.18 }, { idx: 300, x: 0.82, y: 0.22 },
  // Nose (10 points)
  { idx: 168, x: 0.50, y: 0.24 }, { idx: 6, x: 0.50, y: 0.28 }, { idx: 197, x: 0.50, y: 0.32 }, { idx: 195, x: 0.50, y: 0.36 }, { idx: 5, x: 0.50, y: 0.40 },
  { idx: 4, x: 0.50, y: 0.45 }, { idx: 1, x: 0.50, y: 0.49 }, { idx: 19, x: 0.50, y: 0.51 }, { idx: 94, x: 0.44, y: 0.51 }, { idx: 2, x: 0.56, y: 0.51 },
  // Eyes & Pupils (12 points)
  { idx: 33, x: 0.26, y: 0.30 }, { idx: 160, x: 0.31, y: 0.27 }, { idx: 158, x: 0.37, y: 0.27 }, { idx: 133, x: 0.42, y: 0.30 }, { idx: 153, x: 0.37, y: 0.33 },
  { idx: 144, x: 0.31, y: 0.33 }, { idx: 362, x: 0.58, y: 0.30 }, { idx: 385, x: 0.63, y: 0.27 }, { idx: 387, x: 0.69, y: 0.27 }, { idx: 263, x: 0.74, y: 0.30 },
  { idx: 373, x: 0.69, y: 0.33 }, { idx: 380, x: 0.63, y: 0.33 },
  // Mouth & Lips (20 points)
  { idx: 61, x: 0.34, y: 0.64 }, { idx: 39, x: 0.42, y: 0.60 }, { idx: 37, x: 0.46, y: 0.59 }, { idx: 0, x: 0.50, y: 0.60 }, { idx: 267, x: 0.54, y: 0.59 },
  { idx: 269, x: 0.58, y: 0.60 }, { idx: 291, x: 0.66, y: 0.64 }, { idx: 405, x: 0.60, y: 0.72 }, { idx: 314, x: 0.55, y: 0.73 }, { idx: 17, x: 0.50, y: 0.74 },
  { idx: 84, x: 0.45, y: 0.73 }, { idx: 181, x: 0.40, y: 0.72 }, { idx: 78, x: 0.37, y: 0.64 }, { idx: 82, x: 0.46, y: 0.63 }, { idx: 13, x: 0.50, y: 0.63 },
  { idx: 312, x: 0.54, y: 0.63 }, { idx: 308, x: 0.63, y: 0.64 }, { idx: 317, x: 0.54, y: 0.68 }, { idx: 14, x: 0.50, y: 0.68 }, { idx: 87, x: 0.46, y: 0.68 },
  // Forehead & Temples (15 points)
  { idx: 10, x: 0.50, y: 0.05 }, { idx: 338, x: 0.60, y: 0.05 }, { idx: 297, x: 0.70, y: 0.07 }, { idx: 332, x: 0.80, y: 0.10 }, { idx: 284, x: 0.86, y: 0.15 },
  { idx: 251, x: 0.90, y: 0.22 }, { idx: 389, x: 0.91, y: 0.29 }, { idx: 356, x: 0.91, y: 0.36 }, { idx: 127, x: 0.09, y: 0.36 }, { idx: 162, x: 0.09, y: 0.29 },
  { idx: 21, x: 0.10, y: 0.22 }, { idx: 54, x: 0.14, y: 0.15 }, { idx: 103, x: 0.20, y: 0.10 }, { idx: 67, x: 0.30, y: 0.07 }, { idx: 109, x: 0.40, y: 0.05 }
];

/**
 * Returns default 78-point canonical landmark mesh (70 anatomical features + 8 boundary anchors).
 */
export function getDefaultLandmarks() {
  const points = CANONICAL_70_COORDS.map((c, i) => ({
    id: `mp_${c.idx}`,
    meshIdx: c.idx,
    x: c.x,
    y: c.y,
    isKeyPin: KEY_PIN_INDICES.has(c.idx),
    name: `Landmark ${i}`
  }));
  const anchors = BOUNDARY_ANCHORS.map(b => ({ ...b }));
  return [...points, ...anchors];
}

let landmarkerPromise = null;

/**
 * Initializes MediaPipe FaceLandmarker singleton
 */
export async function getFaceLandmarker() {
  if (landmarkerPromise) return landmarkerPromise;

  landmarkerPromise = (async () => {
    try {
      const vision = await import(
        /* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/+esm'
      );
      const { FaceLandmarker, FilesetResolver } = vision;

      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/wasm'
      );

      // Try GPU delegate first, fallback to CPU if needed
      try {
        const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU'
          },
          runningMode: 'IMAGE',
          numFaces: 1
        });
        return landmarker;
      } catch (gpuErr) {
        console.warn('FaceLandmarker GPU init failed, trying CPU fallback:', gpuErr);
        const landmarkerCpu = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'CPU'
          },
          runningMode: 'IMAGE',
          numFaces: 1
        });
        return landmarkerCpu;
      }
    } catch (err) {
      console.warn('MediaPipe FaceLandmarker initialization error:', err);
      return null;
    }
  })();

  return landmarkerPromise;
}

/**
 * Extracts 70-landmark normalized points + 8 boundary anchors from an image or canvas.
 * Always returns 78 points with the exact same topological index mapping.
 */
export async function detectFaceLandmarks(imageOrCanvas) {
  if (!imageOrCanvas) return getDefaultLandmarks();

  try {
    const landmarker = await getFaceLandmarker();
    if (!landmarker) return getDefaultLandmarks();

    let source = imageOrCanvas;

    if (source instanceof HTMLImageElement && (!source.complete || source.naturalWidth === 0)) {
      await new Promise((resolve, reject) => {
        source.onload = resolve;
        source.onerror = reject;
      });
    }

    const results = landmarker.detect(source);
    if (!results || !results.faceLandmarks || results.faceLandmarks.length === 0) {
      return getDefaultLandmarks();
    }

    const raw478 = results.faceLandmarks[0];

    const featurePoints = KEY_LANDMARK_INDICES.map((meshIdx, i) => {
      const p = raw478[meshIdx] || CANONICAL_70_COORDS[i];
      return {
        id: `mp_${meshIdx}`,
        meshIdx,
        x: Math.max(0.01, Math.min(0.99, p.x)),
        y: Math.max(0.01, Math.min(0.99, p.y)),
        isKeyPin: KEY_PIN_INDICES.has(meshIdx),
        name: `Landmark ${i}`
      };
    });

    const anchors = BOUNDARY_ANCHORS.map((b) => ({ ...b }));

    return [...featurePoints, ...anchors];
  } catch (err) {
    console.warn('Error during face landmark detection, using canonical fallback:', err);
    return getDefaultLandmarks();
  }
}

/**
 * Detects any prominent face on a full meme template image or canvas,
 * returning normalized { x, y, radius } in [0, 1].
 */
export async function detectFaceOnTemplate(canvasOrImg) {
  if (!canvasOrImg) return null;
  try {
    const landmarker = await getFaceLandmarker();
    if (!landmarker) return null;

    let source = canvasOrImg;
    if (source instanceof HTMLImageElement && (!source.complete || source.naturalWidth === 0)) {
      await new Promise((resolve, reject) => {
        source.onload = resolve;
        source.onerror = reject;
      });
    }

    const res = landmarker.detect(source);
    if (!res || !res.faceLandmarks || res.faceLandmarks.length === 0) {
      return null;
    }

    // Select first detected face
    const landmarks = res.faceLandmarks[0];
    let minX = 1, maxX = 0, minY = 1, maxY = 0;
    for (const p of landmarks) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const size = Math.max(maxX - minX, maxY - minY);
    const radius = Math.max(0.08, Math.min(0.22, size * 0.65));

    return { x: cx, y: cy, radius };
  } catch (err) {
    console.warn('detectFaceOnTemplate error:', err);
    return null;
  }
}

/**
 * Computes Delaunay triangulation indices from two sets of landmarks (Face A and Face B).
 * Uses the mean midpoint coordinates so triangles are valid and non-crossing for both geometries.
 */
export function computeDelaunayTriangles(landmarksA, landmarksB) {
  if (!landmarksA || landmarksA.length === 0) return [];

  const points = landmarksA.map((ptA, i) => {
    const ptB = landmarksB?.[i] || ptA;
    return [(ptA.x + ptB.x) / 2, (ptA.y + ptB.y) / 2];
  });

  const delaunay = Delaunay.from(points);
  const triangles = [];
  for (let i = 0; i < delaunay.triangles.length; i += 3) {
    triangles.push([
      delaunay.triangles[i],
      delaunay.triangles[i + 1],
      delaunay.triangles[i + 2]
    ]);
  }

  return triangles;
}

// Perimeter contour indices that outline the natural anatomical boundary of the human face
export const FACE_CONTOUR_INDICES = [
  // Left Jawline down to Chin
  234, 93, 132, 58, 172, 136, 150, 149, 176, 148, 152,
  // Chin up right Jawline
  377, 400, 378, 379, 365, 397, 288, 361, 323, 454,
  // Right Temple across Forehead / Hairline to Left Temple
  356, 389, 251, 284, 332, 297, 338, 10, 109, 67, 103, 54, 21, 162, 127
];

// Inner feature contour indices strictly enclosing the facial core (brows, eyes, nose, cheeks, mouth)
// Keeping forehead, hairline, ears, outer beard, and neck 100% untouched
export const INNER_FEATURE_CONTOUR_INDICES = [
  // Across Left Eyebrow Top to Glabella
  70, 63, 105, 66, 107, 168,
  // Across Right Eyebrow Top
  336, 296, 334, 293, 300,
  // Right Outer Eye margin & Upper Cheek (inside beard)
  263, 373, 380, 291,
  // Under Lower Lip (Chin Crease, above beard line)
  405, 314, 17, 84, 181,
  // Left Mouth Corner, Left Cheek & Outer Eye
  61, 144, 153, 33
];

/**
 * Creates an organic anatomical mask following the face's natural contour (jaw, temples, brow)
 * with feathered edges, avoiding circular/oval sticker outlines.
 */
export function createAnatomicalFaceMask(landmarks, size, blurPx = 10) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!landmarks || landmarks.length === 0) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(size / 2, size * 0.48, size * 0.38, size * 0.44, 0, 0, Math.PI * 2);
    ctx.fill();
    return canvas;
  }

  // Find points along the anatomical face perimeter
  const pts = [];
  for (const idx of FACE_CONTOUR_INDICES) {
    const pt = landmarks.find(l => l.meshIdx === idx || l.id === `mp_${idx}`);
    if (pt) {
      pts.push({ x: pt.x * size, y: pt.y * size });
    }
  }

  if (pts.length < 12) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(size / 2, size * 0.48, size * 0.38, size * 0.44, 0, 0, Math.PI * 2);
    ctx.fill();
    return canvas;
  }

  ctx.save();
  if (blurPx > 0) {
    ctx.filter = `blur(${blurPx}px)`;
  }
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    const midX = (pts[i].x + pts[(i + 1) % pts.length].x) / 2;
    const midY = (pts[i].y + pts[(i + 1) % pts.length].y) / 2;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  return canvas;
}

/**
 * Creates an Inner Feature Mask focusing exclusively on the facial core
 * (brows, eyes, nose, cheeks, mouth/smile), strictly preserving original
 * hair, forehead, ears, beard outline, and neck.
 */
export function createInnerFeatureMask(landmarks, size, blurPx = 16) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!landmarks || landmarks.length === 0) {
    // Fallback: centered feature oval (eyes to mouth)
    const cx = size * 0.50;
    const cy = size * 0.50;
    const rx = size * 0.25;
    const ry = size * 0.28;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.55, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    return canvas;
  }

  const browIndices = new Set([70, 63, 105, 66, 107, 168, 336, 296, 334, 293, 300]);
  const pts = [];
  for (const idx of INNER_FEATURE_CONTOUR_INDICES) {
    const pt = landmarks.find(l => l.meshIdx === idx || l.id === `mp_${idx}`);
    if (pt) {
      const yOffset = browIndices.has(idx) ? size * 0.022 : 0;
      pts.push({ x: pt.x * size, y: pt.y * size + yOffset });
    }
  }

  if (pts.length < 8) {
    const cx = size * 0.50;
    const cy = size * 0.50;
    const rx = size * 0.25;
    const ry = size * 0.28;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.55, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    return canvas;
  }

  // Draw smooth continuous spline contour around inner features
  ctx.save();
  const effectiveBlur = Math.max(12, blurPx);
  if (effectiveBlur > 0) {
    ctx.filter = `blur(${effectiveBlur}px)`;
  }
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    const midX = (pts[i].x + pts[(i + 1) % pts.length].x) / 2;
    const midY = (pts[i].y + pts[(i + 1) % pts.length].y) / 2;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  return canvas;
}

