// Main-thread side of the Whisper worker. One worker is reused while it lives; cancel() terminates
// it (the next call starts a fresh one, with the model still cached by the browser).

let worker = null;
let nextId = 1;
const pending = new Map();

const failAll = (message) => {
  for (const { reject } of pending.values()) reject(new Error(message));
  pending.clear();
};

const getWorker = () => {
  if (worker) return worker;
  worker = new Worker(new URL('../workers/whisper.worker.js', import.meta.url), { type: 'module' });
  worker.onmessage = ({ data }) => {
    const job = pending.get(data.id);
    if (!job) return;
    if (data.type === 'progress') job.onProgress?.(data);
    else if (data.type === 'result') { pending.delete(data.id); job.resolve(data); }
    else if (data.type === 'error') { pending.delete(data.id); job.reject(new Error(data.message)); }
  };
  worker.onerror = (e) => {
    failAll(e.message || 'Speech recognition failed to start');
    worker = null;
  };
  return worker;
};

export class TranscribeCancelledError extends Error {
  constructor() { super('Cancelled'); this.name = 'TranscribeCancelledError'; }
}

// audio: Float32Array, 16 kHz mono. Resolves to { words: [{ text, start, end }] } in seconds.
export const transcribe = (audio, onProgress) => new Promise((resolve, reject) => {
  const id = nextId++;
  pending.set(id, { resolve, reject, onProgress });
  getWorker().postMessage({ type: 'transcribe', id, audio }, [audio.buffer]);
});

export const cancelTranscription = () => {
  if (!worker) return;
  worker.terminate();
  worker = null;
  for (const { reject } of pending.values()) reject(new TranscribeCancelledError());
  pending.clear();
};
