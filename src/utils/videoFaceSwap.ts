// Face swap on a video clip: the clip's section is cut and scaled down with the app's FFmpeg, the
// face swap server (face_swap_server.py) swaps it frame by frame as a job, and the swapped frames
// come back silent, so FFmpeg puts the section's sound back on them.
import { loadFFmpeg, runFFmpeg } from './ffmpegExport';
import { postJson, serverFetch } from '../components/editor/faceSwap';

export const FACE_SWAP_MAX_SECONDS = 15;
const MAX_SIDE = 720;
// The server swaps a face on every nth frame and moves that face along in between: 1 is smoothest.
export const SWAP_EVERY = { fast: 4, smooth: 1 } as const;
export type SwapQuality = keyof typeof SWAP_EVERY;

const CUT = 'faceswap_cut.mp4';
const SWAPPED = 'faceswap_frames.avi';
const OUT = 'faceswap_out.mp4';
const IN = 'faceswap_in.mp4';

const fitScale = `scale=w='if(gt(iw,ih),min(${MAX_SIDE},iw),-2)':h='if(gt(iw,ih),-2,min(${MAX_SIDE},ih))'`;

// FFmpeg arguments: the section of the clip to swap, at most 720p (pure, for tests).
export const cutArgs = ({ startSec, lengthSec, withAudio = true }: { startSec: number; lengthSec: number; withAudio?: boolean }) => [
  '-ss', startSec.toFixed(3), '-t', lengthSec.toFixed(3), '-i', IN,
  '-vf', fitScale, '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p',
  ...(withAudio ? ['-c:a', 'aac'] : ['-an']), CUT,
];

// FFmpeg arguments: the swapped frames with the section's sound, if it has any (pure, for tests).
export const muxArgs = () => [
  '-i', SWAPPED, '-i', CUT, '-map', '0:v:0', '-map', '1:a:0?',
  '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', OUT,
];

export interface SwapProgress {
  phase: 'prepare' | 'swap' | 'finish';
  done?: number;
  total?: number;
}

// A swap under way, as the panel shows it.
export type SwapJob = SwapProgress & { startedAt: number; swapStartedAt?: number };

const roughTime = (ms: number) => (ms < 60_000 ? `${Math.max(5, Math.round(ms / 5000) * 5)} s` : `${Math.round(ms / 60_000)} min`);

// How far a job has got, in words, with a time left once there's a rate to go by.
export function jobStatus(job: SwapJob, now = Date.now()): { text: string; value: number | null } {
  if (job.phase === 'prepare') return { text: 'Getting the clip ready…', value: null };
  if (job.phase === 'finish') return { text: 'Adding the sound back…', value: 1 };
  const done = job.done || 0;
  const total = Math.max(1, job.total || 1);
  const since = job.swapStartedAt ?? job.startedAt;
  const left = done >= 2 ? ((now - since) / done) * (total - done) : null;
  return {
    text: `Swapping frame ${Math.min(done + 1, total)} of ${total}${left !== null ? ` · about ${roughTime(left)} left` : '…'}`,
    value: done / total,
  };
}

interface ServerSwap {
  face: string;
  video: Blob;
  faces: number | 'all';
  referenceMs: number;
  strength: number;
  quality: SwapQuality;
}

const blobToDataUrl = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(blob);
});

const wait = (ms: number, signal?: AbortSignal) => new Promise<void>((resolve, reject) => {
  if (signal?.aborted) {
    reject(new DOMException('Cancelled', 'AbortError'));
    return;
  }
  const t = setTimeout(resolve, ms);
  signal?.addEventListener('abort', () => {
    clearTimeout(t);
    reject(new DOMException('Cancelled', 'AbortError'));
  }, { once: true });
});

const errorOf = async (res: Response, fallback: string) => {
  try {
    const data = await res.json();
    return String(data.detail || data.error || fallback);
  } catch {
    return fallback;
  }
};

// The server's side: start the job, follow it, and fetch the swapped frames (an MJPEG .avi) with
// how long they last. Cancelling (signal) stops the job on the server too.
export async function runServerSwap(
  { face, video, faces, referenceMs, strength, quality }: ServerSwap,
  { onProgress, signal, pollMs = 1000 }: { onProgress?: (p: SwapProgress) => void; signal?: AbortSignal; pollMs?: number } = {},
): Promise<{ frames: Blob; durationMs: number | null }> {
  const start = await serverFetch('/api/face-swap/video', {
    ...postJson({
      source_image: face,
      video: await blobToDataUrl(video),
      swap_all: faces === 'all',
      target_face_index: faces === 'all' ? null : faces,
      reference_ms: Math.max(0, Math.round(referenceMs)),
      blend_ratio: strength,
      every: SWAP_EVERY[quality],
    }),
    signal,
  });
  if (!start.ok) throw new Error(await errorOf(start, 'The face swap server couldn’t start the swap.'));
  const { job } = await start.json();
  const cancel = () => { serverFetch(`/api/face-swap/video/${job}/cancel`, { method: 'POST' }).catch(() => {}); };
  signal?.addEventListener('abort', cancel, { once: true });
  try {
    let st;
    for (;;) {
      const res = await serverFetch(`/api/face-swap/video/${job}`, { signal });
      if (!res.ok) throw new Error(await errorOf(res, 'Lost the face swap job.'));
      st = await res.json();
      if (st.status === 'done') break;
      if (st.status === 'error') throw new Error(st.error || 'The swap didn’t work.');
      if (st.status === 'cancelled') throw new DOMException('Cancelled', 'AbortError');
      onProgress?.({ phase: 'swap', done: st.done, total: st.total });
      await wait(pollMs, signal);
    }
    const result = await serverFetch(`/api/face-swap/video/${job}/result`, { signal });
    if (!result.ok) throw new Error(await errorOf(result, 'Couldn’t fetch the swapped video.'));
    return { frames: await result.blob(), durationMs: st.fps > 0 && st.total > 0 ? Math.round((st.total / st.fps) * 1000) : null };
  } finally {
    signal?.removeEventListener('abort', cancel);
  }
}

const checkAbort = (signal?: AbortSignal) => {
  if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
};

// Swap a face into the section [startMs, startMs + lengthMs) of the footage at `url` (at most
// FACE_SWAP_MAX_SECONDS). referenceMs is a time in that section where the picked face shows.
// `ffmpegPhase` runs each FFmpeg step (the editor holds other FFmpeg work off meanwhile).
// Resolves to the swapped section as { url, durationMs }.
export async function swapClipFaces(
  url: string,
  { startMs, lengthMs, ...swap }: Omit<ServerSwap, 'video'> & { startMs: number; lengthMs: number },
  { onProgress, signal, ffmpegPhase = (step) => step() }: {
    onProgress?: (p: SwapProgress) => void;
    signal?: AbortSignal;
    ffmpegPhase?: <T>(step: () => Promise<T>) => Promise<T>;
  } = {},
): Promise<{ url: string; durationMs: number }> {
  const lengthSec = Math.min(FACE_SWAP_MAX_SECONDS, lengthMs / 1000);
  onProgress?.({ phase: 'prepare' });
  const ff = await loadFFmpeg();
  const clean = async () => {
    for (const f of [IN, CUT, SWAPPED, OUT]) {
      try { await ff.deleteFile(f); } catch { /* not created */ }
    }
  };
  try {
    const cut = await ffmpegPhase(async () => {
      await ff.writeFile(IN, new Uint8Array(await (await fetch(url)).arrayBuffer()));
      const opts = { startSec: startMs / 1000, lengthSec };
      let code = await runFFmpeg(ff, cutArgs(opts));
      // A clip without sound: cut it silent.
      if (code !== 0) code = await runFFmpeg(ff, cutArgs({ ...opts, withAudio: false }));
      if (code !== 0) throw new Error(`Couldn’t read the clip (FFmpeg code ${code}).`);
      const data = await ff.readFile(CUT) as Uint8Array;
      return new Blob([data.slice().buffer], { type: 'video/mp4' });
    });
    checkAbort(signal);
    const { frames, durationMs } = await runServerSwap({ ...swap, video: cut }, { onProgress, signal });
    checkAbort(signal);
    onProgress?.({ phase: 'finish' });
    return await ffmpegPhase(async () => {
      await ff.writeFile(SWAPPED, new Uint8Array(await frames.arrayBuffer()));
      const code = await runFFmpeg(ff, muxArgs());
      if (code !== 0) throw new Error(`Couldn’t finish the swapped clip (FFmpeg code ${code}).`);
      const data = await ff.readFile(OUT) as Uint8Array;
      return {
        url: URL.createObjectURL(new Blob([data.slice().buffer], { type: 'video/mp4' })),
        durationMs: Math.min(durationMs ?? Infinity, Math.round(lengthSec * 1000)),
      };
    });
  } finally {
    await clean();
  }
}
