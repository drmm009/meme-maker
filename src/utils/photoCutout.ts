// Cut out for photos (the image editor's Remove BG and portrait blur, the sticker maker, the video
// editor's photos), with Google's MediaPipe (Apache-2.0), the same library as the video editor's
// background removal (utils/personSegmenter). Two models, loaded on first use from the same pinned
// build:
// - General (DeepLab v3) finds what is in the photo: people, pets, cars, furniture and the other
//   Pascal VOC classes, each with a confidence per pixel.
// - People (selfie multiclass) draws people with cleaner edges and hair.
// A photo that is mostly people gets the People mask, plus every separate thing General found that
// the People model doesn't see as a person (a cat next to the person stays, even when General calls
// it a person too); any other photo gets General's mask. A photo where General finds nothing throws
// a NoSubjectError.
const VISION = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9';
const GENERAL_MODEL = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/deeplab_v3/float32/latest/deeplab_v3.tflite';
const PEOPLE_MODEL = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite';

// DeepLab's classes: 0 is the background, 15 a person (it sometimes calls a pet next to a person a
// person too, hence the blobs below).
const PERSON = 15;
// Below this share of the photo, nothing was found.
const MIN_SUBJECT = 0.005;
// The models look at a copy at most this big (they work on 256 or 513 pixels anyway).
const LOOK_SIDE = 1024;
// The result is never bigger than this on its long edge.
const MAX_SIDE = 2048;

export class NoSubjectError extends Error {
  constructor() {
    super("Couldn't find a person, pet or object to cut out in this picture.");
    this.name = 'NoSubjectError';
  }
}

interface Mask {
  width: number;
  height: number;
  getAsFloat32Array(): Float32Array;
  getAsUint8Array(): Uint8Array;
}
interface Segmenter {
  segment(image: CanvasImageSource, callback: (result: { confidenceMasks?: Mask[]; categoryMask?: Mask }) => void): void;
}

const loaded: { general?: Promise<Segmenter>; people?: Promise<Segmenter> } = {};

function loadSegmenter(which: 'general' | 'people'): Promise<Segmenter> {
  if (!loaded[which]) {
    const promise = (async () => {
      const vision = await import(/* @vite-ignore */ `${VISION}/+esm`);
      const fileset = await vision.FilesetResolver.forVisionTasks(`${VISION}/wasm`);
      const create = (delegate: 'GPU' | 'CPU') => vision.ImageSegmenter.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: which === 'general' ? GENERAL_MODEL : PEOPLE_MODEL, delegate },
        runningMode: 'IMAGE',
        // General also says which class each pixel is, so only the masks needed are read back
        // from the GPU (each read is slow; DeepLab has 21).
        outputCategoryMask: which === 'general',
        outputConfidenceMasks: true,
      });
      return (await create('GPU').catch(() => create('CPU'))) as Segmenter;
    })();
    promise.catch(() => { delete loaded[which]; });
    loaded[which] = promise;
  }
  return loaded[which]!;
}

// What General saw: each pixel's class and how sure it is of the background (copied: MediaPipe
// reuses its buffers).
export interface GeneralLook { width: number; height: number; classes: Uint8Array; background: Float32Array }

const lookGeneral = (seg: Segmenter, image: HTMLCanvasElement) => new Promise<GeneralLook>((resolve) => {
  seg.segment(image, (result) => {
    const masks = result.confidenceMasks || [];
    const category = result.categoryMask;
    const width = masks[0]?.width || 0;
    const height = masks[0]?.height || 0;
    const n = width * height;
    resolve({
      width,
      height,
      classes: category ? Uint8Array.from(category.getAsUint8Array()) : new Uint8Array(n),
      background: masks[0] ? Float32Array.from(masks[0].getAsFloat32Array()) : new Float32Array(n).fill(1),
    });
  });
});

// How sure the People model is of the background, per pixel.
const lookPeople = (seg: Segmenter, image: HTMLCanvasElement) => new Promise<Float32Array | null>((resolve) => {
  seg.segment(image, (result) => {
    const bg = result.confidenceMasks?.[0];
    resolve(bg ? Float32Array.from(bg.getAsFloat32Array()) : null);
  });
});

// From each pixel's class (0 the background): how much of the photo is something, and how much of
// that something is people.
export function subjectShares(classes: Uint8Array): { subject: number; people: number } {
  const n = classes.length;
  if (!n) return { subject: 0, people: 0 };
  let subject = 0;
  let people = 0;
  for (let i = 0; i < n; i++) {
    if (classes[i] === 0) continue;
    subject += 1;
    if (classes[i] === PERSON) people += 1;
  }
  return { subject: subject / n, people: subject ? people / subject : 0 };
}

// The separate things General found (4-connected runs of non-background pixels), as a label per
// pixel (0 for background) and how many there are.
export function blobs(classes: Uint8Array, width: number, height: number): { labels: Int32Array; count: number } {
  const labels = new Int32Array(classes.length);
  const stack = new Int32Array(classes.length);
  let count = 0;
  for (let start = 0; start < classes.length; start++) {
    if (classes[start] === 0 || labels[start]) continue;
    count += 1;
    let top = 0;
    stack[top++] = start;
    labels[start] = count;
    while (top) {
      const i = stack[--top];
      const x = i % width;
      const near = [x > 0 ? i - 1 : -1, x < width - 1 ? i + 1 : -1, i >= width ? i - width : -1, i + width < width * height ? i + width : -1];
      for (const j of near) {
        if (j < 0 || classes[j] === 0 || labels[j]) continue;
        labels[j] = count;
        stack[top++] = j;
      }
    }
  }
  return { labels, count };
}

// A blob counts as a person when at least this much of it is a person to the People model.
const PERSON_OVERLAP = 0.3;

// How sure each pixel is part of the subject (0..1). Without `peopleBackground` (the People model's
// background confidence, the same size), whatever is not General's background. With it, people from
// the People model, plus the blobs General found that the People model doesn't see as a person.
export function subjectConfidence(general: GeneralLook, peopleBackground?: Float32Array | null): Float32Array {
  const { background, classes, width, height } = general;
  const n = background.length;
  const out = new Float32Array(n);
  if (!peopleBackground || peopleBackground.length !== n) {
    for (let i = 0; i < n; i++) out[i] = 1 - background[i];
    return out;
  }
  const { labels, count } = blobs(classes, width, height);
  const size = new Float32Array(count + 1);
  const personal = new Float32Array(count + 1);
  for (let i = 0; i < n; i++) {
    if (!labels[i]) continue;
    size[labels[i]] += 1;
    if (peopleBackground[i] < 0.5) personal[labels[i]] += 1;
  }
  for (let i = 0; i < n; i++) {
    const person = 1 - peopleBackground[i];
    const blob = labels[i];
    const other = blob && personal[blob] / size[blob] < PERSON_OVERLAP ? 1 - background[i] : 0;
    out[i] = Math.max(person, other);
  }
  return out;
}

// See-through below the edge band, solid above it, smooth across it.
export const edgeAlpha = (confidence: number): number => {
  const t = Math.max(0, Math.min(1, (confidence - 0.35) / 0.3));
  return t * t * (3 - 2 * t);
};

async function decode(source: Blob): Promise<HTMLCanvasElement> {
  const url = URL.createObjectURL(source);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("This picture couldn't be opened."));
      el.src = url;
    });
    const k = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * k));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * k));
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function scaled(photo: HTMLCanvasElement, side: number): HTMLCanvasElement {
  const k = Math.min(1, side / Math.max(photo.width, photo.height));
  if (k === 1) return photo;
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(photo.width * k));
  c.height = Math.max(1, Math.round(photo.height * k));
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(photo, 0, 0, c.width, c.height);
  return c;
}

// The photo's subject on a see-through background, as a WebP (or PNG) the size of the photo.
export async function cutOutPhoto(source: Blob): Promise<Blob> {
  const photo = await decode(source);
  const look = scaled(photo, LOOK_SIDE);
  const general = await lookGeneral(await loadSegmenter('general'), look);
  const shares = subjectShares(general.classes);
  if (shares.subject < MIN_SUBJECT) throw new NoSubjectError();
  const people = shares.people >= 0.5 ? await lookPeople(await loadSegmenter('people'), look) : null;
  const confidence = subjectConfidence(general, people);

  // The mask at the models' size, then stretched smoothly over the full photo.
  const mask = document.createElement('canvas');
  mask.width = general.width;
  mask.height = general.height;
  const mctx = mask.getContext('2d')!;
  const data = mctx.createImageData(mask.width, mask.height);
  for (let i = 0; i < confidence.length; i++) data.data[i * 4 + 3] = Math.round(edgeAlpha(confidence[i]) * 255);
  mctx.putImageData(data, 0, 0);

  const out = document.createElement('canvas');
  out.width = photo.width;
  out.height = photo.height;
  const ctx = out.getContext('2d')!;
  ctx.drawImage(photo, 0, 0);
  ctx.globalCompositeOperation = 'destination-in';
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  // A touch of blur, in proportion to the stretch, softens the mask's stair-steps.
  const stretch = out.width / mask.width;
  if (stretch > 1.5 && 'filter' in ctx) ctx.filter = `blur(${Math.min(3, stretch / 2).toFixed(1)}px)`;
  ctx.drawImage(mask, 0, 0, out.width, out.height);
  ctx.filter = 'none';

  // WebP keeps the see-through edges (its alpha is lossless) and encodes about ten times faster and
  // smaller than PNG; a browser that can't write WebP gives a PNG instead.
  return new Promise<Blob>((resolve, reject) => out.toBlob((b) => (b ? resolve(b) : reject(new Error('The cut-out could not be made.'))), 'image/webp', 0.95));
}
