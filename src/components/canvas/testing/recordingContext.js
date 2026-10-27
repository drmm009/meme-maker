// A fake 2D canvas context for tests. It records every call with the transform and drawing
// state in force at the time, so a test can ask "where on the canvas was this text drawn, in
// what colour?" without a browser canvas (jsdom has none).
//
// Text measures as 0.6 x the font's pixel size per character, so wrapping is predictable.

const STATE_KEYS = [
  'fillStyle', 'strokeStyle', 'font', 'globalAlpha', 'lineWidth', 'filter', 'textAlign',
  'textBaseline', 'shadowColor', 'shadowBlur', 'shadowOffsetX', 'shadowOffsetY', 'lineCap',
  'lineJoin', 'miterLimit', 'globalCompositeOperation', 'imageSmoothingEnabled'
];

const DEFAULT_STATE = {
  fillStyle: '#000000', strokeStyle: '#000000', font: '10px sans-serif', globalAlpha: 1,
  lineWidth: 1, filter: 'none', textAlign: 'start', textBaseline: 'alphabetic',
  shadowColor: 'rgba(0, 0, 0, 0)', shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0,
  lineCap: 'butt', lineJoin: 'miter', miterLimit: 10, globalCompositeOperation: 'source-over',
  imageSmoothingEnabled: true
};

export const CHAR_WIDTH_RATIO = 0.6;

const fontPx = (font) => {
  const m = /(\d+(?:\.\d+)?)px/.exec(font || '');
  return m ? Number(m[1]) : 10;
};

// [a, b, c, d, e, f] as in setTransform: x' = a*x + c*y + e, y' = b*x + d*y + f.
const IDENTITY = [1, 0, 0, 1, 0, 0];
const multiply = ([a, b, c, d, e, f], [a2, b2, c2, d2, e2, f2]) => [
  a * a2 + c * b2, b * a2 + d * b2, a * c2 + c * d2, b * c2 + d * d2, a * e2 + c * f2 + e, b * e2 + d * f2 + f
];

export function createRecordingContext() {
  const calls = [];
  let state = { ...DEFAULT_STATE, lineDash: [], matrix: IDENTITY };
  const stack = [];

  const toCanvas = (x, y) => {
    const [a, b, c, d, e, f] = state.matrix;
    return { x: a * x + c * y + e, y: b * x + d * y + f };
  };
  const record = (name, args) => {
    const entry = { name, args, state: { ...state, lineDash: [...state.lineDash] } };
    // Where the call's first (x, y) lands on the canvas, for calls that have one.
    const xy = name === 'fillText' || name === 'strokeText' ? [args[1], args[2]]
      : name === 'drawImage' ? (args.length >= 9 ? [args[5], args[6]] : [args[1], args[2]])
      : typeof args[0] === 'number' && typeof args[1] === 'number' ? [args[0], args[1]] : null;
    if (xy) entry.at = toCanvas(xy[0], xy[1]);
    calls.push(entry);
  };
  const transform = (m) => { state.matrix = multiply(state.matrix, m); };

  const methods = {
    save() { record('save', []); stack.push({ ...state, lineDash: [...state.lineDash] }); },
    restore() { record('restore', []); if (stack.length) state = stack.pop(); },
    translate(x, y) { record('translate', [x, y]); transform([1, 0, 0, 1, x, y]); },
    rotate(rad) { record('rotate', [rad]); transform([Math.cos(rad), Math.sin(rad), -Math.sin(rad), Math.cos(rad), 0, 0]); },
    scale(sx, sy) { record('scale', [sx, sy]); transform([sx, 0, 0, sy, 0, 0]); },
    setTransform(a = 1, b = 0, c = 0, d = 1, e = 0, f = 0) { record('setTransform', [a, b, c, d, e, f]); state.matrix = [a, b, c, d, e, f]; },
    resetTransform() { record('resetTransform', []); state.matrix = IDENTITY; },
    setLineDash(dash) { record('setLineDash', [dash]); state.lineDash = [...dash]; },
    getLineDash() { return [...state.lineDash]; },
    measureText(text) {
      return { width: String(text).length * fontPx(state.font) * CHAR_WIDTH_RATIO, actualBoundingBoxAscent: fontPx(state.font) * 0.8, actualBoundingBoxDescent: fontPx(state.font) * 0.2 };
    },
    createLinearGradient(...args) { record('createLinearGradient', args); return { kind: 'gradient', stops: [], addColorStop(o, c) { this.stops.push([o, c]); } }; },
    createRadialGradient(...args) { record('createRadialGradient', args); return { kind: 'gradient', stops: [], addColorStop(o, c) { this.stops.push([o, c]); } }; },
    createPattern(...args) { record('createPattern', args); return { kind: 'pattern' }; },
    getImageData(x, y, w, h) { record('getImageData', [x, y, w, h]); return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }; },
    isPointInPath() { return false; },
  };

  const ctx = new Proxy({}, {
    get(_, prop) {
      if (prop === 'calls') return calls;
      if (prop === 'currentTransform') return state.matrix;
      if (prop in methods) return methods[prop];
      if (STATE_KEYS.includes(prop)) return state[prop];
      if (typeof prop === 'symbol') return undefined;
      // Any other method (beginPath, fillRect, roundRect, drawImage, ...) is recorded.
      return (...args) => record(prop, args);
    },
    set(_, prop, value) {
      state[prop] = value;
      return true;
    },
    has(_, prop) {
      return prop in methods || STATE_KEYS.includes(prop) || prop === 'roundRect';
    }
  });
  return ctx;
}

// A fake <canvas> backed by a recording context. getBoundingClientRect reports it drawn at 1:1.
export function createRecordingCanvas(width = 800, height = 600) {
  const ctx = createRecordingContext();
  return {
    width,
    height,
    ctx,
    style: {},
    getContext: () => ctx,
    getBoundingClientRect: () => ({ left: 0, top: 0, width, height }),
    toDataURL: () => 'data:image/png;base64,',
  };
}

// Helpers for reading a recording.
export const callsNamed = (ctx, name) => ctx.calls.filter((c) => c.name === name);
export const textsDrawn = (ctx) => callsNamed(ctx, 'fillText').map((c) => ({
  text: c.args[0], at: c.at, color: c.state.fillStyle, font: c.state.font, alpha: c.state.globalAlpha,
  align: c.state.textAlign, matrix: c.state.matrix
}));
// The rotation (degrees) of a recorded call's transform.
export const rotationOf = (call) => Math.round((Math.atan2(call.state.matrix[1], call.state.matrix[0]) * 180) / Math.PI);
