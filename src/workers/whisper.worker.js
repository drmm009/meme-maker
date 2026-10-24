// Speech-to-text for auto captions: Whisper tiny (English) via transformers.js, run off the main
// thread. The model (~40 MB) downloads on first use and is kept in the browser's Cache Storage.
//
// Messages in:  { type: 'transcribe', id, audio: Float32Array (16 kHz mono) }
// Messages out: { type: 'progress', id, phase: 'download'|'transcribe', progress: 0..1 }
//               { type: 'result', id, words: [{ text, start, end }] }   (seconds)
//               { type: 'error', id, message }

const MODEL = 'onnx-community/whisper-tiny.en_timestamped';
// Loaded from the CDN at runtime (exact version) rather than bundled: bundling copies ~50 MB of
// ONNX Runtime WASM into dist/ and the Android app, for a feature that downloads its model anyway.
const TRANSFORMERS_URL = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.1/dist/transformers.min.js';

let pipePromise = null;

const hasWebGPU = async () => {
  try {
    return Boolean(await navigator.gpu?.requestAdapter());
  } catch {
    return false;
  }
};

// Bytes downloaded across all model files, so one bar covers the whole download.
const makeDownloadTracker = (report) => {
  const files = new Map();
  return (event) => {
    if (event.status !== 'progress' || !event.total) return;
    files.set(event.file, { loaded: event.loaded, total: event.total });
    let loaded = 0;
    let total = 0;
    for (const f of files.values()) { loaded += f.loaded; total += f.total; }
    report(total ? loaded / total : 0);
  };
};

const loadPipeline = (report) => {
  if (!pipePromise) {
    pipePromise = (async () => {
      const { pipeline } = await import(/* @vite-ignore */ TRANSFORMERS_URL);
      const progress_callback = makeDownloadTracker(report);
      if (await hasWebGPU()) {
        try {
          return await pipeline('automatic-speech-recognition', MODEL, {
            device: 'webgpu', dtype: { encoder_model: 'fp32', decoder_model_merged: 'q4' }, progress_callback,
          });
        } catch { /* fall back to WASM below */ }
      }
      return pipeline('automatic-speech-recognition', MODEL, { device: 'wasm', dtype: 'q8', progress_callback });
    })().catch((err) => {
      pipePromise = null;
      throw err;
    });
  }
  return pipePromise;
};

self.onmessage = async ({ data }) => {
  if (data?.type !== 'transcribe') return;
  const { id, audio } = data;
  try {
    const transcriber = await loadPipeline((progress) => self.postMessage({ type: 'progress', id, phase: 'download', progress }));
    self.postMessage({ type: 'progress', id, phase: 'transcribe', progress: 0 });
    const output = await transcriber(audio, {
      return_timestamps: 'word',
      chunk_length_s: 30,
      stride_length_s: 5,
    });
    const words = (output.chunks || [])
      .map((c) => ({ text: c.text, start: c.timestamp?.[0], end: c.timestamp?.[1] }))
      .filter((w) => w.text && w.text.trim() && Number.isFinite(w.start));
    self.postMessage({ type: 'result', id, words, text: output.text || '' });
  } catch (err) {
    self.postMessage({ type: 'error', id, message: err?.message || String(err) });
  }
};
