// Dev-only comparison of photo background removal: the app's cut-out (utils/photoCutout) against
// the three MediaPipe models on their own. Open http://localhost:5173/prototypes/bg-compare.html with `npm run dev`.
// Not part of the app or its build.

const VISION = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9';
const MODELS = {
  people: 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite',
  general: 'https://storage.googleapis.com/mediapipe-models/image_segmenter/deeplab_v3/float32/latest/deeplab_v3.tflite',
  tap: 'https://storage.googleapis.com/mediapipe-models/interactive_segmenter/magic_touch/float32/latest/magic_touch.tflite',
};

type Method = 'app' | 'people' | 'general' | 'tap';
const METHODS: { id: Method; label: string }[] = [
  { id: 'app', label: 'App (new)' },
  { id: 'people', label: 'MP People' },
  { id: 'general', label: 'MP General' },
  { id: 'tap', label: 'MP Tap' },
];

const SAMPLES: { name: string; url: string }[] = [
  { name: 'Person: Drake', url: '/images/drake-single.jpg' },
  { name: 'Person close-up: WiFi hair', url: '/images/desi-wifi-hairstyle.jpg' },
  { name: 'Person and table: Magnus', url: '/images/Magnus-Carlsen-table-slam-1024x419.webp' },
  { name: 'Dog: Doge', url: 'https://api.memegen.link/images/doge.png' },
  { name: 'Cat (and woman): Woman yelling at cat', url: 'https://api.memegen.link/images/woman-cat.png' },
  { name: 'Comic: Batman slap', url: '/images/creator-batman-slap.jpg' },
];

interface Mask { width: number; height: number; getAsFloat32Array(): Float32Array }
interface SegResult { confidenceMasks?: Mask[] }
// The MediaPipe library and its segmenters, loaded from the CDN at run time.
type Vision = any;

let vision: Vision | null = null;
const segmenters: Partial<Record<Exclude<Method, 'app'>, Promise<Vision>>> = {};

async function loadVision(): Promise<Vision> {
  if (!vision) {
    const mod = await import(/* @vite-ignore */ `${VISION}/+esm`);
    vision = { mod, fileset: await mod.FilesetResolver.forVisionTasks(`${VISION}/wasm`) };
  }
  return vision;
}

function segmenter(kind: Exclude<Method, 'app'>): Promise<Vision> {
  segmenters[kind] ??= (async () => {
    const { mod, fileset } = await loadVision();
    const make = (delegate: 'GPU' | 'CPU') => {
      const options = { baseOptions: { modelAssetPath: MODELS[kind], delegate }, outputCategoryMask: false, outputConfidenceMasks: true };
      return kind === 'tap'
        ? mod.InteractiveSegmenter.createFromOptions(fileset, options)
        : mod.ImageSegmenter.createFromOptions(fileset, { ...options, runningMode: 'IMAGE' });
    };
    return make('GPU').catch(() => make('CPU'));
  })();
  return segmenters[kind]!;
}

const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => resolve(img);
  img.onerror = () => reject(new Error(`Couldn't load ${src}`));
  img.src = src;
});

// The photo drawn on a canvas, at most `side` on its long edge.
function canvasOf(img: HTMLImageElement, side = 1024): HTMLCanvasElement {
  const k = Math.min(1, side / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement('canvas');
  c.width = Math.round(img.naturalWidth * k);
  c.height = Math.round(img.naturalHeight * k);
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
  return c;
}

// Smooth step from see-through to solid around the model's 50% confidence.
const alphaOf = (v: number) => {
  const t = Math.max(0, Math.min(1, (v - 0.35) / 0.3));
  return t * t * (3 - 2 * t);
};

// The photo with everything outside the mask see-through. `keep` turns a mask value into how sure
// the pixel is part of the subject.
function applyMask(photo: HTMLCanvasElement, mask: Mask, keep: (v: number) => number): HTMLCanvasElement {
  const values = mask.getAsFloat32Array();
  const m = document.createElement('canvas');
  m.width = mask.width;
  m.height = mask.height;
  const mctx = m.getContext('2d')!;
  const data = mctx.createImageData(mask.width, mask.height);
  for (let i = 0; i < values.length; i++) data.data[i * 4 + 3] = Math.round(alphaOf(keep(values[i])) * 255);
  mctx.putImageData(data, 0, 0);
  const out = document.createElement('canvas');
  out.width = photo.width;
  out.height = photo.height;
  const ctx = out.getContext('2d')!;
  ctx.drawImage(photo, 0, 0);
  ctx.globalCompositeOperation = 'destination-in';
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(m, 0, 0, out.width, out.height);
  return out;
}

const segment = (seg: Vision, photo: HTMLCanvasElement, roi?: { x: number; y: number }) => new Promise<Mask[]>((resolve) => {
  const done = (r: SegResult) => resolve(r.confidenceMasks || []);
  if (roi) seg.segment(photo, { keypoint: roi }, done);
  else seg.segment(photo, done);
});

async function run(method: Method, img: HTMLImageElement, tap: { x: number; y: number }): Promise<HTMLCanvasElement | HTMLImageElement> {
  if (method === 'app') {
    const blob = await (await fetch(img.src)).blob();
    const { cutOutPhoto } = await import('../src/utils/photoCutout');
    return loadImage(URL.createObjectURL(await cutOutPhoto(blob)));
  }
  const photo = canvasOf(img);
  const seg = await segmenter(method);
  const masks = await segment(seg, photo, method === 'tap' ? tap : undefined);
  if (!masks.length) throw new Error('No mask');
  if (method === 'tap') {
    // Magic Touch gives one mask; make sure it is the tapped thing, not everything else.
    const mask = masks[0];
    const v = mask.getAsFloat32Array();
    const at = v[Math.min(v.length - 1, Math.floor(tap.y * mask.height) * mask.width + Math.floor(tap.x * mask.width))];
    return applyMask(photo, mask, at >= 0.5 ? (x) => x : (x) => 1 - x);
  }
  // People and General: the first mask is the background.
  return applyMask(photo, masks[0], (x) => 1 - x);
}

interface Row { name: string; img: HTMLImageElement; tap: { x: number; y: number }; cells: Record<Method, HTMLElement>; dot: HTMLElement }
const rows: Row[] = [];
const statusEl = document.getElementById('status')!;

async function runCell(row: Row, method: Method) {
  const cell = row.cells[method];
  const frame = cell.querySelector('.frame')!;
  const time = cell.querySelector('.time')!;
  frame.innerHTML = '<div class="note">Working…</div>';
  time.textContent = '';
  const start = performance.now();
  try {
    const result = await run(method, row.img, row.tap);
    frame.replaceChildren(result);
    time.textContent = `${((performance.now() - start) / 1000).toFixed(1)} s`;
  } catch (e) {
    frame.innerHTML = `<div class="err">${(e as Error).message}</div>`;
  }
}

function addRow(name: string, img: HTMLImageElement) {
  const el = document.createElement('section');
  el.className = 'row';
  el.innerHTML = `<h2></h2><div class="cells"></div>`;
  el.querySelector('h2')!.textContent = name;
  const cells = el.querySelector('.cells')!;
  const original = document.createElement('div');
  original.className = 'cell';
  original.innerHTML = '<div class="head">Original <span class="time">tap to move the dot</span></div><div class="frame original"></div>';
  const frame = original.querySelector('.frame') as HTMLElement;
  const shown = img.cloneNode() as HTMLImageElement;
  frame.append(shown);
  const dot = document.createElement('span');
  dot.className = 'dot';
  frame.append(dot);
  cells.append(original);
  const row: Row = { name, img, tap: { x: 0.5, y: 0.5 }, cells: {} as Record<Method, HTMLElement>, dot };
  const placeDot = () => {
    dot.style.left = `${shown.offsetLeft + row.tap.x * shown.offsetWidth}px`;
    dot.style.top = `${shown.offsetTop + row.tap.y * shown.offsetHeight}px`;
  };
  shown.addEventListener('load', placeDot);
  requestAnimationFrame(placeDot);
  frame.addEventListener('click', (e) => {
    const r = shown.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return;
    row.tap = { x, y };
    placeDot();
    void runCell(row, 'tap');
  });
  for (const m of METHODS) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.innerHTML = `<div class="head">${m.label} <span class="time"></span></div><div class="frame"></div>`;
    cells.append(cell);
    row.cells[m.id] = cell;
  }
  rows.push(row);
  document.getElementById('rows')!.append(el);
  return row;
}

async function runAll(list = rows) {
  for (const m of METHODS) {
    for (const row of list) {
      statusEl.textContent = `${m.label}: ${row.name}…`;
      await runCell(row, m.id);
    }
  }
  statusEl.textContent = 'Done.';
}

document.getElementById('run')!.addEventListener('click', () => void runAll());
document.getElementById('files')!.addEventListener('change', async (e) => {
  const input = e.target as HTMLInputElement;
  const added: Row[] = [];
  for (const file of Array.from(input.files || [])) added.push(addRow(file.name, await loadImage(URL.createObjectURL(file))));
  input.value = '';
  void runAll(added);
});

(async () => {
  for (const s of SAMPLES) {
    try {
      addRow(s.name, await loadImage(s.url));
    } catch (e) {
      statusEl.textContent = (e as Error).message;
    }
  }
  statusEl.textContent = 'Ready. Press Run all.';
})();
