// Background removal for video clips (Effects → Background): MediaPipe's selfie segmenter finds the
// people in each frame, and everything else is made see-through. It works on people only. The
// library and model load on first use, from the same pinned MediaPipe build as the face tools
// (utils/faceLandmarkerService).
const VISION = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9';
const MODEL = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite';

// A clip's background removal: how soft the edge round the person is, 0 (crisp) .. 1 (soft).
export interface PersonCutout {
  softness: number;
}

export const DEFAULT_PERSON_CUTOUT: PersonCutout = { softness: 0.3 };

// A clip only the frame-by-frame export can draw (FFmpeg can't remove backgrounds).
export const needsFrameRenderer = (item: { type: string; hidden?: boolean; bgRemoval?: PersonCutout | null }): boolean =>
  item.type === 'video' && !item.hidden && Boolean(item.bgRemoval);

export const NEEDS_FRAME_RENDERER = 'Background removal exports as MP4 in a browser that can encode video, like Chrome or Edge. Turn it off to export a GIF or in this browser.';

interface Mask {
  width: number;
  height: number;
  getAsFloat32Array(): Float32Array;
}
interface Segmenter {
  segment(image: CanvasImageSource, callback: (result: { confidenceMasks?: Mask[] }) => void): void;
}

let segmenter: Segmenter | null = null;
let loading: Promise<void> | null = null;

export const personSegmenterReady = (): boolean => segmenter !== null;

// Loads the segmenter once (on the GPU where the browser allows, else the CPU).
export function loadPersonSegmenter(): Promise<void> {
  if (segmenter) return Promise.resolve();
  if (!loading) {
    loading = (async () => {
      const vision = await import(/* @vite-ignore */ `${VISION}/+esm`);
      const fileset = await vision.FilesetResolver.forVisionTasks(`${VISION}/wasm`);
      const create = (delegate: 'GPU' | 'CPU') => vision.ImageSegmenter.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL, delegate },
        runningMode: 'IMAGE',
        outputCategoryMask: false,
        outputConfidenceMasks: true,
      });
      segmenter = await create('GPU').catch(() => create('CPU'));
    })();
    loading.catch(() => { loading = null; });
  }
  return loading;
}

// A pixel's opacity from how sure the model is it's a person (0..1): see-through below the edge
// band, solid above it, smooth across it; softness widens the band.
export function maskAlpha(confidence: number, softness: number): number {
  const half = 0.03 + Math.max(0, Math.min(1, softness)) * 0.3;
  const t = Math.max(0, Math.min(1, (confidence - (0.5 - half)) / (2 * half)));
  return t * t * (3 - 2 * t);
}

// The model looks at frames this size (its own input is 256 square): smaller is much faster, and
// the mask is smoothly scaled back up.
const LOOK_SIDE = 320;

// The live preview looks again at most this often, using the last mask in between (a frame takes
// the model about 14ms); the export looks at every frame.
const LIVE_GAP_MS = 60;

// What a clip keeps between frames: the small copy the model looks at, the mask and when it was
// made. `live` (the preview) may reuse a recent mask.
export interface CutoutHolder {
  look?: HTMLCanvasElement | null;
  mask?: HTMLCanvasElement | null;
  maskAt?: number;
  live?: boolean;
}

// Makes everything but the people in the w x h frame drawn on ctx see-through. `src` is the frame
// to look at. False if the segmenter isn't loaded yet or found nothing to go on.
export function removeBackground(
  ctx: CanvasRenderingContext2D,
  src: CanvasImageSource,
  w: number,
  h: number,
  cutout: PersonCutout,
  holder: CutoutHolder,
): boolean {
  if (!segmenter) return false;
  const now = performance.now();
  if (holder.live && holder.mask && holder.maskAt !== undefined && now - holder.maskAt < LIVE_GAP_MS) {
    applyMask(ctx, holder.mask, w, h);
    return true;
  }
  const k = Math.min(1, LOOK_SIDE / Math.max(w, h));
  const look = holder.look || (holder.look = document.createElement('canvas'));
  const lw = Math.max(1, Math.round(w * k));
  const lh = Math.max(1, Math.round(h * k));
  if (look.width !== lw || look.height !== lh) {
    look.width = lw;
    look.height = lh;
  }
  look.getContext('2d')?.drawImage(src, 0, 0, lw, lh);
  let done = false;
  segmenter.segment(look, (result) => {
    const masks = result.confidenceMasks || [];
    if (!masks.length) return;
    // A one-class model gives the person; a multi-class one has the background first.
    const mask = masks[0];
    const person = masks.length > 1 ? (v: number) => 1 - v : (v: number) => v;
    const values = mask.getAsFloat32Array();
    const canvas = holder.mask || (holder.mask = document.createElement('canvas'));
    if (canvas.width !== mask.width || canvas.height !== mask.height) {
      canvas.width = mask.width;
      canvas.height = mask.height;
    }
    const mctx = canvas.getContext('2d');
    if (!mctx) return;
    const img = mctx.createImageData(mask.width, mask.height);
    for (let i = 0; i < values.length; i++) img.data[i * 4 + 3] = Math.round(maskAlpha(person(values[i]), cutout.softness) * 255);
    mctx.putImageData(img, 0, 0);
    holder.maskAt = now;
    applyMask(ctx, canvas, w, h);
    done = true;
  });
  return done;
}

// Keeps only what the mask covers, the mask smoothly scaled up to the frame.
function applyMask(ctx: CanvasRenderingContext2D, mask: HTMLCanvasElement, w: number, h: number): void {
  ctx.save();
  ctx.globalCompositeOperation = 'destination-in';
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(mask, 0, 0, w, h);
  ctx.restore();
}
