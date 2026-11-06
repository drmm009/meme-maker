import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { CloudOff, Plus, RefreshCw, ScanFace } from 'lucide-react';
import { useEditorStore, clipEffectBase } from '../../store/useVideoEditorStore';
import { captureFrame } from '../../utils/clipEffects';
import { FACE_SWAP_MAX_SECONDS, jobStatus, swapClipFaces } from '../../utils/videoFaceSwap';
import type { SwapJob as Job, SwapQuality } from '../../utils/videoFaceSwap';
import {
  SAMPLE_FACES, detectFaces, getRememberedFace, loadPicture, readFile, rememberFace, serverReady, swapFace,
} from '../editor/faceSwap';
import type { Picture, TargetFace } from '../editor/faceSwap';

interface VideoClip {
  id: string;
  type?: string;
  url: string;
  // A photo's picture before its face swap.
  faceSwapOf?: string | null;
  startMs: number;
  endMs: number;
  playbackRate?: number;
  effect?: string | null;
}

type Server = 'checking' | 'online' | 'offline';

const QUALITIES: { id: SwapQuality; label: string }[] = [
  { id: 'fast', label: 'Faster' },
  { id: 'smooth', label: 'Smoother' },
];

// The section of the original footage the clip shows (before any reverse, boomerang or swap), and
// where the playhead is in it.
const clipSection = (item: VideoClip, playhead: number) => {
  const base = clipEffectBase(item);
  const rate = item.playbackRate || 1;
  const lengthMs = Math.min(FACE_SWAP_MAX_SECONDS * 1000, (base.endMs - item.startMs) * rate);
  const atMs = Math.min(Math.max(0, (playhead - item.startMs) * rate), Math.max(0, lengthMs - 50));
  return { url: base.url as string, startMs: base.trimStartMs as number, lengthMs, atMs };
};

// Face swap for a video clip (Effects → Face swap) or a photo (its bar's Face swap): whose face to
// put in, which person (in a video, found in the frame at the playhead) or everyone, then the face
// swap server swaps it: a video frame by frame in a job, its swapped clip replacing this one as its
// effect; a photo in one go, as its picture. Remove puts the original back.
export default function FaceSwapPanel({ item }: { item: VideoClip }) {
  const isPhoto = item.type === 'image';
  // The photo as it was before any swap: the one to swap into.
  const photoBase = item.faceSwapOf || item.url;
  const swapped = isPhoto ? Boolean(item.faceSwapOf) : item.effect === 'faceswap';
  const [server, setServer] = useState<Server>('checking');
  const [check, setCheck] = useState(0);
  const [face, setFace] = useState<Picture | null>(() => getRememberedFace() || SAMPLE_FACES[0]);
  const [people, setPeople] = useState<TargetFace[] | null>(null);
  const [who, setWho] = useState<number | 'all'>(0);
  const [look, setLook] = useState(0); // asks to find the people again, at the playhead now
  const [quality, setQuality] = useState<SwapQuality>('fast');
  const [strength, setStrength] = useState(1);
  const [job, setJob] = useState<Job | null>(null);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const [, tick] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const section = clipSection(item, useEditorStore.getState().playhead);

  useEffect(() => {
    let alive = true;
    setServer('checking');
    serverReady().then((ok) => alive && setServer(ok ? 'online' : 'offline'));
    return () => { alive = false; };
  }, [check]);

  // The people in the frame at the playhead.
  useEffect(() => {
    if (server !== 'online') return undefined;
    let alive = true;
    setPeople(null);
    (async () => {
      if (isPhoto) {
        const found = await detectFaces((await loadPicture(photoBase)).src);
        if (!alive) return;
        setPeople(found);
        setWho((w) => (w === 'all' || found.length === 0 ? w : Math.min(w, found.length - 1)));
        return;
      }
      const still = await captureFrame(section.url, section.startMs + section.atMs);
      try {
        const found = await detectFaces((await loadPicture(still)).src);
        if (!alive) return;
        setPeople(found);
        setWho((w) => (w === 'all' || found.length === 0 ? w : Math.min(w, found.length - 1)));
      } finally {
        URL.revokeObjectURL(still);
      }
    })().catch(() => alive && setPeople([]));
    return () => { alive = false; };
  }, [server, look, isPhoto ? photoBase : section.url]); // eslint-disable-line react-hooks/exhaustive-deps

  // Closing the sheet stops a swap in progress.
  useEffect(() => () => abortRef.current?.abort(), []);
  // The time left goes down between the server's answers.
  useEffect(() => {
    if (job?.phase !== 'swap') return undefined;
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [job?.phase]);

  const pickFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const picked = { src: await readFile(file), name: file.name };
    setFace(picked);
    rememberFace(picked);
  };

  // A photo: one request, its answer the photo's new picture (what was made from the old one goes).
  const swapPhoto = async () => {
    if (!face || job) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setMessage(null);
    setJob({ phase: 'swap', startedAt: Date.now() });
    try {
      const [faceData, target] = await Promise.all([loadPicture(face.src), loadPicture(photoBase)]);
      const image = await swapFace({ face: faceData.src, target: target.src, faces: who, strength });
      const url = URL.createObjectURL(await (await fetch(image)).blob());
      const latest = useEditorStore.getState().items.find((i: VideoClip) => i.id === item.id);
      if (controller.signal.aborted || !latest || (latest.faceSwapOf || latest.url) !== photoBase) {
        URL.revokeObjectURL(url);
        return;
      }
      useEditorStore.getState().updateItem(item.id, { url, faceSwapOf: photoBase, originalUrl: null, subjectUrl: null, subjectOf: null, bgBlur: 0 });
      setMessage({ text: 'Face swapped.' });
    } catch (e) {
      if (controller.signal.aborted) return;
      const text = (e as Error)?.message === 'offline' ? 'Lost the face swap server. Is it still running?' : (e as Error)?.message || 'The swap didn’t work.';
      setMessage({ text, error: true });
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setJob(null);
      }
    }
  };

  const swap = async () => {
    if (isPhoto) {
      await swapPhoto();
      return;
    }
    if (!face || job) return;
    const controller = new AbortController();
    abortRef.current = controller;
    const startedAt = Date.now();
    const at = clipSection(item, useEditorStore.getState().playhead);
    setMessage(null);
    setJob({ phase: 'prepare', startedAt });
    // FFmpeg is the editor's one at a time: hold the export and other clip jobs off while it's ours.
    const ffmpegPhase = async <T,>(step: () => Promise<T>): Promise<T> => {
      while (useEditorStore.getState().isExporting) await new Promise((r) => setTimeout(r, 500));
      const st = useEditorStore.getState();
      st.setBusy('Face swap…');
      try {
        return await step();
      } finally {
        if (useEditorStore.getState().busy === 'Face swap…') useEditorStore.getState().setBusy(null);
      }
    };
    try {
      const faceData = await loadPicture(face.src);
      const rendered = await swapClipFaces(at.url, {
        startMs: at.startMs, lengthMs: at.lengthMs, referenceMs: at.atMs,
        face: faceData.src, faces: who, strength, quality,
      }, {
        signal: controller.signal,
        ffmpegPhase,
        onProgress: (p) => !controller.signal.aborted && setJob((j) => ({
          ...p, startedAt, swapStartedAt: j?.swapStartedAt ?? (p.phase === 'swap' ? Date.now() : undefined),
        })),
      });
      // The clip may have gone, or changed footage, meanwhile.
      const latest = useEditorStore.getState().items.find((i: VideoClip) => i.id === item.id);
      if (controller.signal.aborted || !latest || clipEffectBase(latest).url !== at.url) {
        URL.revokeObjectURL(rendered.url);
        return;
      }
      useEditorStore.getState().applyClipEffect(item.id, 'faceswap', rendered);
      const capped = (clipEffectBase(item).endMs - item.startMs) * (item.playbackRate || 1) > FACE_SWAP_MAX_SECONDS * 1000;
      setMessage({ text: capped ? `Face swapped. The clip is now its first ${FACE_SWAP_MAX_SECONDS} seconds.` : 'Face swapped.' });
    } catch (e) {
      if ((e as Error)?.name === 'AbortError' || controller.signal.aborted) return;
      const text = (e as Error)?.message === 'offline' ? 'Lost the face swap server. Is it still running?' : (e as Error)?.message || 'The swap didn’t work.';
      setMessage({ text, error: true });
      if (import.meta.env?.DEV) console.warn('[face swap]', e);
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setJob(null);
      }
    }
  };

  const cancel = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setJob(null);
  };

  if (server === 'offline') {
    return (
      <div className="vt-swap">
        <div className="vt-swap-offline" role="status">
          <CloudOff size={20} aria-hidden="true" />
          <span>
            <strong>Face swap is offline</strong>
            Start face_swap_server.py on this computer, then try again.
          </span>
          <button type="button" className="vt-chip" onClick={() => setCheck((n) => n + 1)}>
            <RefreshCw size={14} aria-hidden="true" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const status = job && (isPhoto ? { text: 'Swapping the face…', value: null } : jobStatus(job));
  const faces = [...(face && !SAMPLE_FACES.some((s) => s.src === face.src) ? [face] : []), ...SAMPLE_FACES];
  const noPeople = people !== null && people.length === 0;

  return (
    <div className="vt-swap">
      <div className="vt-swap-row">
        <span className="vt-swap-label">Face</span>
        <div className="vt-swap-faces" role="radiogroup" aria-label="Face to put in">
          <button type="button" className="vt-swap-face vt-swap-add" aria-label="Upload a face" disabled={Boolean(job)} onClick={() => fileRef.current?.click()}>
            <Plus size={18} strokeWidth={2.4} aria-hidden="true" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickFile} />
          {faces.map((f) => (
            <button key={f.src} type="button" role="radio" aria-checked={face?.src === f.src} aria-label={f.name} disabled={Boolean(job)}
              className={`vt-swap-face${face?.src === f.src ? ' is-on' : ''}`} onClick={() => { setFace(f); rememberFace(f); }}>
              <img src={f.src} alt="" />
            </button>
          ))}
        </div>
      </div>

      <div className="vt-swap-row">
        <span className="vt-swap-label">Into</span>
        <div className="vt-swap-faces" role="radiogroup" aria-label="Who to swap">
          {people === null ? (
            <span className="vt-swap-note">{server === 'checking' ? 'Connecting…' : 'Finding faces…'}</span>
          ) : noPeople ? (
            <span className="vt-swap-note">{isPhoto ? 'No face found' : 'No face at the playhead'}</span>
          ) : (
            <>
              {people.map((p) => (
                <button key={p.index} type="button" role="radio" aria-checked={who === p.index} aria-label={`Face ${p.index + 1}`} disabled={Boolean(job)}
                  className={`vt-swap-face${who === p.index ? ' is-on' : ''}`} onClick={() => setWho(p.index)}>
                  <img src={p.thumb} alt="" />
                </button>
              ))}
              {people.length > 1 && (
                <button type="button" role="radio" aria-checked={who === 'all'} disabled={Boolean(job)}
                  className={`vt-chip${who === 'all' ? ' is-on' : ''}`} onClick={() => setWho('all')}>
                  Everyone
                </button>
              )}
            </>
          )}
          {!isPhoto && (
            <button type="button" className="vt-swap-face vt-swap-add" aria-label="Find faces at the playhead" title="Find faces at the playhead"
              disabled={Boolean(job) || server !== 'online'} onClick={() => setLook((n) => n + 1)}>
              <ScanFace size={18} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {!isPhoto && (
        <div className="vt-chip-row" role="radiogroup" aria-label="Quality">
          {QUALITIES.map((q) => (
            <button key={q.id} type="button" role="radio" aria-checked={quality === q.id} disabled={Boolean(job)}
              className={`vt-chip${quality === q.id ? ' is-on' : ''}`} onClick={() => setQuality(q.id)}>
              {q.label}
            </button>
          ))}
        </div>
      )}
      <label className="vt-slider-row">
        <span>Strength</span>
        <input type="range" min="0.5" max="1" step="0.05" value={strength} disabled={Boolean(job)} onChange={(e) => setStrength(Number(e.target.value))} />
        <output>{Math.round(strength * 100)}%</output>
      </label>

      {status ? (
        <div className="vt-captions-job" role="status">
          <div className="vt-captions-job-text">
            <span>{status.text}</span>
            <button type="button" className="vt-chip" onClick={cancel}>Cancel</button>
          </div>
          <div className={`vt-captions-bar${status.value === null ? ' is-busy' : ''}`}>
            <span style={status.value === null ? undefined : { width: `${Math.round(status.value * 100)}%` }} />
          </div>
        </div>
      ) : (
        <div className="vt-captions-actions">
          <button type="button" className="vt-captions-go" onClick={swap} disabled={server !== 'online' || !face || people === null || noPeople}>
            <ScanFace size={16} strokeWidth={2.4} aria-hidden="true" />
            {swapped ? 'Swap again' : 'Swap face'}
          </button>
          {swapped && (
            <button type="button" className="vt-chip" onClick={() => {
              if (isPhoto) useEditorStore.getState().updateItem(item.id, { url: photoBase, faceSwapOf: null, originalUrl: null, subjectUrl: null, subjectOf: null, bgBlur: 0 });
              else useEditorStore.getState().applyClipEffect(item.id, null);
              setMessage(null);
            }}>
              Remove
            </button>
          )}
        </div>
      )}
      <p className={`vt-panel-hint${message?.error ? ' is-error' : ''}`} role={message?.error ? 'alert' : undefined}>
        {message?.text || (isPhoto ? 'Puts the face into the photo. Remove brings the original back.' : quality === 'fast'
          ? `Swaps the face on every 4th frame and follows it in between. Up to ${FACE_SWAP_MAX_SECONDS} seconds.`
          : `Swaps the face on every frame: smoothest, about 4 times slower. Up to ${FACE_SWAP_MAX_SECONDS} seconds.`)}
      </p>
    </div>
  );
}
