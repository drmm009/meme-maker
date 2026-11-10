// The GIF maker: a video clip or a set of photos made into a looping GIF. A page of its own (App's
// 'gif' view, link #/gif), in the editors' look: the top bar with its steps (Clip · Caption ·
// Export); empty, two cards to start from (Video, Photos); then a live preview with the caption on
// it, the clip's trim (a filmstrip with two handles, at most 10 seconds) or the photo frames (add,
// remove, move), the caption (top or bottom), Speed, Loop (loop or bounce) and Size; Make GIF pinned
// at the bottom, opening a sheet with the GIF to download, share or save to My Studio.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, CSSProperties, KeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import { ChevronLeft, ChevronRight, Download, FolderHeart, Images, ImagePlay, Plus, RotateCcw, Share2, Check, Video, X } from 'lucide-react';
import MakerBar from '../editor/top-bar/MakerBar';
import { PickerSheet } from '../editor/panels/MakerPage';
import { MAX_CLIP_S, MAX_PHOTOS, clock, defaultTrim, frameOrder, gifDimensions, gifSeconds, moveTrim, slideTrim } from './gifPlan';
import type { CaptionPlace, GifSize, Loop, Trim } from './gifPlan';
import { CAPTION_FONT, makeGif } from './renderGif';
import { downloadImageHelper } from '../../utils/downloadHelper';
import './gifMaker.css';

interface Photo { id: string; url: string; w: number; h: number }
type Source =
  | { kind: 'video'; file: File; url: string; duration: number; w: number; h: number }
  | { kind: 'photos'; photos: Photo[] };
interface Result { blob: Blob; url: string; w: number; h: number; seconds: number }
export interface SavedGif { name: string; imageUrl: string; rawImageUrl: string }

const VIDEO_SPEEDS = [{ value: 0.5, label: '0.5×' }, { value: 1, label: '1×' }, { value: 2, label: '2×' }];
const PHOTO_SPEEDS = [{ value: 1, label: 'Slow' }, { value: 0.5, label: 'Normal' }, { value: 0.2, label: 'Fast' }];
const LOOPS: { value: Loop; label: string }[] = [{ value: 'loop', label: 'Loop' }, { value: 'bounce', label: 'Bounce' }];
const SIZES: { value: GifSize; label: string }[] = [{ value: 320, label: 'Small' }, { value: 480, label: 'Large' }];
const PLACES: { value: CaptionPlace; label: string }[] = [{ value: 'top', label: 'Top' }, { value: 'bottom', label: 'Bottom' }];
const STRIP_FRAMES = 8;

const readDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });

function videoInfo(url: string) {
  return new Promise<{ duration: number; w: number; h: number }>((resolve, reject) => {
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.muted = true;
    v.onloadedmetadata = () => resolve({ duration: v.duration, w: v.videoWidth, h: v.videoHeight });
    v.onerror = () => reject(new Error('unreadable'));
    v.src = url;
  });
}

function photoInfo(file: File): Promise<Photo> {
  const url = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, url, w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => reject(new Error('unreadable'));
    img.src = url;
  });
}

// Frames along the video for the trim's filmstrip.
function useFilmstrip(url: string | null, duration: number) {
  const [frames, setFrames] = useState<string[]>([]);
  useEffect(() => {
    setFrames([]);
    if (!url || !(duration > 0)) return;
    let alive = true;
    const v = document.createElement('video');
    v.muted = true;
    v.preload = 'auto';
    v.src = url;
    const canvas = document.createElement('canvas');
    (async () => {
      try {
        await new Promise((r, j) => { v.onloadeddata = r; v.onerror = j; });
        canvas.height = 56;
        canvas.width = Math.round((56 * v.videoWidth) / Math.max(1, v.videoHeight));
        const ctx = canvas.getContext('2d');
        const out: string[] = [];
        for (let i = 0; i < STRIP_FRAMES && alive && ctx; i++) {
          v.currentTime = ((i + 0.5) / STRIP_FRAMES) * duration;
          await new Promise((r) => { v.onseeked = r; });
          ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
          out.push(canvas.toDataURL('image/jpeg', 0.6));
          if (alive) setFrames([...out]);
        }
      } catch { /* no filmstrip: the track stays plain */ }
    })();
    return () => { alive = false; v.removeAttribute('src'); };
  }, [url, duration]);
  return frames;
}

function Segmented<T extends string | number>({ label, options, value, onChange, disabled }: { label: string; options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; disabled?: boolean }) {
  return (
    <div className="gm-seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.label} type="button" role="radio" aria-checked={value === o.value} className={`gm-seg-btn${value === o.value ? ' is-on' : ''}`} disabled={disabled} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function GifMaker({ onBack, onSaveToGallery }: { onBack: () => void; onSaveToGallery?: (gif: SavedGif) => void }) {
  const [source, setSource] = useState<Source | null>(null);
  const [error, setError] = useState('');
  const [trim, setTrim] = useState<Trim>({ start: 0, end: 0 });
  const [speed, setSpeed] = useState(1);
  const [frameS, setFrameS] = useState(0.5);
  const [loop, setLoop] = useState<Loop>('loop');
  const [size, setSize] = useState<GifSize>(480);
  const [caption, setCaption] = useState('');
  const [place, setPlace] = useState<CaptionPlace>('top');
  const [picked, setPicked] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [saved, setSaved] = useState(false);
  const making = progress !== null;

  // Object URLs go when they're replaced or the page closes.
  const urls = useRef<Set<string>>(new Set());
  const keep = (url: string) => { urls.current.add(url); return url; };
  useEffect(() => () => { urls.current.forEach((u) => URL.revokeObjectURL(u)); }, []);

  const video = source?.kind === 'video' ? source : null;
  const photos = source?.kind === 'photos' ? source.photos : [];
  const shape = video ? { w: video.w, h: video.h } : photos[0] ? { w: photos[0].w, h: photos[0].h } : { w: 1, h: 1 };
  const dims = gifDimensions(shape.w, shape.h, size);
  const step = result ? 2 : source ? 1 : 0;

  const pickVideo = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const url = keep(URL.createObjectURL(file));
    try {
      const info = await videoInfo(url);
      setSource({ kind: 'video', file, url, ...info });
      setTrim(defaultTrim(info.duration));
      setError('');
    } catch {
      setError("That video can't be played here. Try an MP4.");
    }
  };
  const addPhotos = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = [...(e.target.files ?? [])].slice(0, MAX_PHOTOS - photos.length);
    e.target.value = '';
    if (!files.length) return;
    const added = (await Promise.all(files.map((f) => photoInfo(f).catch(() => null)))).filter((p): p is Photo => Boolean(p));
    added.forEach((p) => keep(p.url));
    if (!added.length) {
      setError("Those photos couldn't be read.");
      return;
    }
    setSource({ kind: 'photos', photos: [...photos, ...added] });
    setError('');
  };
  const setPhotos = (next: Photo[]) => setSource(next.length ? { kind: 'photos', photos: next } : null);
  const movePhoto = (id: string, by: -1 | 1) => {
    const i = photos.findIndex((p) => p.id === id);
    const j = i + by;
    if (i < 0 || j < 0 || j >= photos.length) return;
    const next = [...photos];
    [next[i], next[j]] = [next[j], next[i]];
    setPhotos(next);
  };
  const startOver = () => {
    setSource(null);
    setResult(null);
    setCaption('');
    setPicked(null);
    setError('');
  };

  const make = async () => {
    if (!source || making) return;
    setError('');
    setProgress(0);
    const cap = { text: caption, place };
    try {
      const blob = await makeGif(
        source.kind === 'video'
          ? { kind: 'video', file: source.file, trim, speed, loop, w: dims.w, h: dims.h, caption: cap }
          : { kind: 'photos', urls: photos.map((p) => p.url), frameS, loop, w: dims.w, h: dims.h, caption: cap },
        setProgress,
      );
      const seconds = gifSeconds(source.kind === 'video' ? { clip: trim.end - trim.start, speed, loop } : { photos: photos.length, frameS, loop });
      setResult({ blob, url: keep(URL.createObjectURL(blob)), ...dims, seconds });
      setSaved(false);
    } catch {
      setError("The GIF couldn't be made. Try a shorter clip or fewer photos.");
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="ui-theme gm">
      <MakerBar
        title="GIF maker"
        Icon={ImagePlay}
        tone="#9bd02a"
        steps={['Clip', 'Caption', 'Export']}
        step={step}
        status={['Add a video or photos', 'Ready to make', 'Ready to export'][step]}
        onBack={onBack}
      >
        {source && (
          <button type="button" className="mtb-round" onClick={startOver} disabled={making} aria-label="Start over" title="Start over">
            <RotateCcw size={18} strokeWidth={2.2} />
          </button>
        )}
      </MakerBar>

      <main className="gm-body" aria-label="Make a GIF">
        {!source ? (
          <div className="gm-start">
            <div className="gm-sources">
              <label className="gm-source" style={{ '--gm-tone': '#1fb6e8' } as CSSProperties}>
                <span className="gm-source-icon" aria-hidden="true"><Video /></span>
                <span className="gm-source-title">Video</span>
                <span className="gm-source-hint">Trim up to {MAX_CLIP_S} seconds of it</span>
                <input type="file" accept="video/*" aria-label="Choose a video" onChange={(e) => void pickVideo(e)} hidden />
              </label>
              <label className="gm-source" style={{ '--gm-tone': '#ec4899' } as CSSProperties}>
                <span className="gm-source-icon" aria-hidden="true"><Images /></span>
                <span className="gm-source-title">Photos</span>
                <span className="gm-source-hint">Each one a frame, up to {MAX_PHOTOS}</span>
                <input type="file" accept="image/*" multiple aria-label="Choose photos" onChange={(e) => void addPhotos(e)} hidden />
              </label>
            </div>
            <p className="gm-start-note">Then add a caption, pick the speed and the loop, and make it a GIF.</p>
            {error && <p className="gm-error" role="alert">{error}</p>}
          </div>
        ) : (
          <>
            <Preview source={source} trim={trim} speed={speed} frameS={frameS} loop={loop} caption={caption} place={place} progress={progress} />

            {video && <TrimBar video={video} trim={trim} onChange={setTrim} disabled={making} />}

            {source.kind === 'photos' && (
              <div className="gm-frames" role="list" aria-label="Frames">
                {photos.map((p, i) => (
                  <div key={p.id} role="listitem" className={`gm-frame${picked === p.id ? ' is-on' : ''}`}>
                    <button type="button" className="gm-frame-pic" aria-label={`Frame ${i + 1}`} aria-pressed={picked === p.id} disabled={making} onClick={() => setPicked(picked === p.id ? null : p.id)}>
                      <img src={p.url} alt="" />
                      <span className="gm-frame-n" aria-hidden="true">{i + 1}</span>
                    </button>
                    {picked === p.id && !making && (
                      <div className="gm-frame-tools">
                        <button type="button" aria-label="Move earlier" disabled={i === 0} onClick={() => movePhoto(p.id, -1)}><ChevronLeft size={15} /></button>
                        <button type="button" aria-label="Remove frame" onClick={() => { setPhotos(photos.filter((x) => x.id !== p.id)); setPicked(null); }}><X size={15} /></button>
                        <button type="button" aria-label="Move later" disabled={i === photos.length - 1} onClick={() => movePhoto(p.id, 1)}><ChevronRight size={15} /></button>
                      </div>
                    )}
                  </div>
                ))}
                {photos.length < MAX_PHOTOS && (
                  <label className={`gm-frame gm-frame-add${making ? ' is-off' : ''}`}>
                    <Plus size={20} aria-hidden="true" />
                    <span>Add</span>
                    <input type="file" accept="image/*" multiple aria-label="Add photos" onChange={(e) => void addPhotos(e)} disabled={making} hidden />
                  </label>
                )}
              </div>
            )}

            <div className="gm-caption">
              <input
                className="gm-caption-field"
                type="text"
                aria-label="Caption"
                placeholder="Add a caption"
                maxLength={80}
                value={caption}
                disabled={making}
                onChange={(e) => setCaption(e.target.value)}
              />
              <Segmented label="Caption place" options={PLACES} value={place} onChange={setPlace} disabled={making} />
            </div>

            <div className="gm-settings">
              <div className="gm-setting">
                <span className="gm-setting-name">Speed</span>
                {video
                  ? <Segmented label="Speed" options={VIDEO_SPEEDS} value={speed} onChange={setSpeed} disabled={making} />
                  : <Segmented label="Speed" options={PHOTO_SPEEDS} value={frameS} onChange={setFrameS} disabled={making} />}
              </div>
              <div className="gm-setting">
                <span className="gm-setting-name">Loop</span>
                <Segmented label="Loop" options={LOOPS} value={loop} onChange={setLoop} disabled={making} />
              </div>
              <div className="gm-setting">
                <span className="gm-setting-name">Size <small>{dims.w} × {dims.h}</small></span>
                <Segmented label="Size" options={SIZES} value={size} onChange={setSize} disabled={making} />
              </div>
            </div>
            {error && <p className="gm-error" role="alert">{error}</p>}
          </>
        )}
      </main>

      <div className="gm-actions">
        <button type="button" className="gm-make" disabled={!source || making} onClick={() => void make()}>
          <ImagePlay aria-hidden="true" />
          {making ? `Making GIF… ${Math.round((progress ?? 0) * 100)}%` : 'Make GIF'}
        </button>
      </div>

      {result && (
        <PickerSheet title="Your GIF" onClose={() => setResult(null)}>
          <ResultSheet result={result} saved={saved} onSave={onSaveToGallery ? async () => {
            const dataUrl = await readDataUrl(result.blob);
            onSaveToGallery({ name: caption.trim() || 'My GIF', imageUrl: dataUrl, rawImageUrl: dataUrl });
            setSaved(true);
          } : undefined} />
        </PickerSheet>
      )}
    </div>
  );
}

// The live preview: the clip looping between its trim at its speed (a bounce played back by
// stepping the video), or the photos in turn; the caption laid over in the GIF's look.
function Preview({ source, trim, speed, frameS, loop, caption, place, progress }: { source: Source; trim: Trim; speed: number; frameS: number; loop: Loop; caption: string; place: CaptionPlace; progress: number | null }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [frame, setFrame] = useState(0);
  const photos = source.kind === 'photos' ? source.photos : [];
  const order = useMemo(() => frameOrder(photos.length, loop), [photos.length, loop]);
  const shape = source.kind === 'video' ? source : photos[0] ?? { w: 1, h: 1 };

  useEffect(() => {
    const v = ref.current;
    if (source.kind !== 'video' || !v) return;
    const len = Math.max(0.1, trim.end - trim.start);
    v.playbackRate = speed;
    if (loop === 'loop') {
      v.currentTime = trim.start;
      const onTime = () => { if (v.currentTime >= trim.end || v.currentTime < trim.start - 0.05) v.currentTime = trim.start; };
      v.addEventListener('timeupdate', onTime);
      void v.play().catch(() => {});
      return () => v.removeEventListener('timeupdate', onTime);
    }
    v.pause();
    let raf = 0;
    let seeking = false;
    const t0 = performance.now();
    const onSeeked = () => { seeking = false; };
    v.addEventListener('seeked', onSeeked);
    const tick = (now: number) => {
      const phase = (((now - t0) / 1000) * speed) % (len * 2);
      if (!seeking) {
        seeking = true;
        v.currentTime = trim.start + (phase < len ? phase : len * 2 - phase);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); v.removeEventListener('seeked', onSeeked); };
  }, [source, trim.start, trim.end, speed, loop]);

  useEffect(() => {
    if (source.kind !== 'photos' || order.length < 2) { setFrame(0); return; }
    let i = 0;
    const id = setInterval(() => { i = (i + 1) % order.length; setFrame(i); }, frameS * 1000);
    return () => clearInterval(id);
  }, [source.kind, order, frameS]);

  const photo = photos[order[frame] ?? 0] ?? photos[0];
  return (
    <div className="gm-stage">
      <div className="gm-preview" style={{ '--gm-ar': String(shape.w / Math.max(1, shape.h)) } as CSSProperties}>
        {source.kind === 'video'
          ? <video ref={ref} src={source.url} muted playsInline aria-label="Preview" />
          : photo && <img src={photo.url} alt="Preview" />}
        {caption.trim() && (
          <span className={`gm-preview-caption is-${place}`} style={{ fontFamily: CAPTION_FONT }} aria-hidden="true">{caption.toUpperCase()}</span>
        )}
        {progress !== null && (
          <div className="gm-busy" role="status">
            <span className="ie-swap-spinner" aria-hidden="true" />
            Making your GIF… {Math.round(progress * 100)}%
          </div>
        )}
      </div>
    </div>
  );
}

// The clip's trim: a filmstrip of the video with the chosen part framed in orange between two
// handles; drag a handle to move that end, or the frame to slide the whole clip.
function TrimBar({ video, trim, onChange, disabled }: { video: Extract<Source, { kind: 'video' }>; trim: Trim; onChange: (t: Trim) => void; disabled: boolean }) {
  const track = useRef<HTMLDivElement>(null);
  const frames = useFilmstrip(video.url, video.duration);
  const d = video.duration;
  const drag = useRef<{ what: 'start' | 'end' | 'slide'; offset: number } | null>(null);

  const secondsAt = useCallback((clientX: number) => {
    const r = track.current?.getBoundingClientRect();
    if (!r || !r.width) return 0;
    return ((clientX - r.left) / r.width) * d;
  }, [d]);
  const down = (what: 'start' | 'end' | 'slide') => (e: ReactPointerEvent) => {
    if (disabled) return;
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    drag.current = { what, offset: what === 'slide' ? secondsAt(e.clientX) - trim.start : 0 };
  };
  const move = (e: ReactPointerEvent) => {
    const g = drag.current;
    if (!g) return;
    const t = secondsAt(e.clientX);
    onChange(g.what === 'slide' ? slideTrim(trim, t - g.offset, d) : moveTrim(trim, g.what, t, d));
  };
  const up = () => { drag.current = null; };
  const nudge = (what: 'start' | 'end') => (e: KeyboardEvent) => {
    const by = e.key === 'ArrowLeft' ? -0.1 : e.key === 'ArrowRight' ? 0.1 : 0;
    if (!by) return;
    e.preventDefault();
    onChange(moveTrim(trim, what, trim[what] + by, d));
  };
  const pct = (s: number) => `${(s / d) * 100}%`;

  return (
    <div className="gm-trim">
      <div className="gm-trim-head">
        <span className="gm-trim-title">Clip</span>
        <span className="gm-trim-time">{clock(trim.start)} – {clock(trim.end)} · <b>{(trim.end - trim.start).toFixed(1)} s</b></span>
      </div>
      <div className={`gm-track${disabled ? ' is-off' : ''}`} ref={track} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        <div className="gm-strip" aria-hidden="true">
          {frames.map((src, i) => <img key={i} src={src} alt="" />)}
        </div>
        <div className="gm-shade" style={{ left: 0, width: pct(trim.start) }} aria-hidden="true" />
        <div className="gm-shade" style={{ left: pct(trim.end), right: 0 }} aria-hidden="true" />
        <div className="gm-window" style={{ left: pct(trim.start), width: pct(trim.end - trim.start) }} onPointerDown={down('slide')}>
          <span
            className="gm-handle is-start"
            role="slider"
            tabIndex={0}
            aria-label="Clip start"
            aria-valuemin={0}
            aria-valuemax={Number(d.toFixed(1))}
            aria-valuenow={Number(trim.start.toFixed(1))}
            aria-valuetext={clock(trim.start)}
            onPointerDown={down('start')}
            onKeyDown={nudge('start')}
          />
          <span
            className="gm-handle is-end"
            role="slider"
            tabIndex={0}
            aria-label="Clip end"
            aria-valuemin={0}
            aria-valuemax={Number(d.toFixed(1))}
            aria-valuenow={Number(trim.end.toFixed(1))}
            aria-valuetext={clock(trim.end)}
            onPointerDown={down('end')}
            onKeyDown={nudge('end')}
          />
        </div>
      </div>
    </div>
  );
}

function ResultSheet({ result, saved, onSave }: { result: Result; saved: boolean; onSave?: () => Promise<void> }) {
  const file = useMemo(() => new File([result.blob], `meme-${Date.now()}.gif`, { type: 'image/gif' }), [result.blob]);
  const canShare = typeof navigator !== 'undefined' && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });
  const kb = result.blob.size / 1024;
  const weight = kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(kb))} KB`;

  const download = async () => downloadImageHelper(await readDataUrl(result.blob), file.name);
  const share = () => navigator.share({ files: [file] }).catch(() => {});

  return (
    <div className="gm-result">
      <div className="gm-result-pic"><img src={result.url} alt="Your GIF" /></div>
      <p className="gm-result-meta">{result.w} × {result.h} · {weight} · {result.seconds.toFixed(1)} s</p>
      <div className="gm-result-actions">
        <button type="button" className="gm-make gm-result-main" onClick={() => void download()}>
          <Download aria-hidden="true" />
          Download
        </button>
        {canShare && (
          <button type="button" className="gm-result-btn" aria-label="Share" title="Share" onClick={() => void share()}>
            <Share2 aria-hidden="true" />
          </button>
        )}
        {onSave && (
          <button type="button" className="gm-result-btn" aria-label={saved ? 'Saved to My Studio' : 'Save to My Studio'} title={saved ? 'Saved to My Studio' : 'Save to My Studio'} disabled={saved} onClick={() => void onSave()}>
            {saved ? <Check aria-hidden="true" /> : <FolderHeart aria-hidden="true" />}
          </button>
        )}
      </div>
    </div>
  );
}
