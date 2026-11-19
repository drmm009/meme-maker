// The GIF maker: a video clip made into a looping GIF. A page of its own (App's 'gif' view, link
// #/gif), in the Stickers page's look: the Back chevron and the title; one card that takes the video
// (empty, a card like Face Swap's Your face that takes a tap or a drop; with one, the live preview with
// the caption on it and a remove button); under it Upload, Record and Clips (the meme clips the video
// editor offers, downloaded on a pick) until there is a video, then the clip's trim (a filmstrip with two handles, at
// most 10 seconds), the caption (top or bottom), and Speed, Loop and Size, each in its grey card;
// Make GIF pinned at the bottom, opening a sheet with the GIF to download, share or save to My Studio.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, CSSProperties, DragEvent, KeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import { Camera, Check, ChevronLeft, Clapperboard, Download, FolderHeart, Gauge, ImagePlay, Maximize2, Repeat, Scissors, Share2, Type, UploadCloud, Video, X } from 'lucide-react';
import { EmptyTile, PickerSheet } from '../editor/panels/MakerPage';
import ClipsSheet from '../video-editor/ClipsSheet';
import type { VideoClip } from '../video-editor/ClipsSheet';
import { MAX_CLIP_S, clock, defaultTrim, gifDimensions, gifSeconds, moveTrim, slideTrim } from './gifPlan';
import type { CaptionPlace, GifSize, Loop, Trim } from './gifPlan';
import { CAPTION_FONT, makeGif } from './renderGif';
import { downloadImageHelper } from '../../utils/downloadHelper';
import './gifMaker.css';

interface VideoSrc { file: File; url: string; duration: number; w: number; h: number }
interface Result { blob: Blob; url: string; w: number; h: number; seconds: number }
export interface SavedGif { kind: 'gif'; name: string; imageUrl: string; rawImageUrl: string }

const SPEEDS = [{ value: 0.5, label: '0.5×' }, { value: 1, label: '1×' }, { value: 2, label: '2×' }];
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

export default function GifMaker({ onBack, onSaveToGallery }: { onBack: () => void; onSaveToGallery?: (gif: SavedGif) => boolean | void | Promise<boolean | void> }) {
  const [video, setVideo] = useState<VideoSrc | null>(null);
  const [error, setError] = useState('');
  const [trim, setTrim] = useState<Trim>({ start: 0, end: 0 });
  const [speed, setSpeed] = useState(1);
  const [loop, setLoop] = useState<Loop>('loop');
  const [size, setSize] = useState<GifSize>(480);
  const [caption, setCaption] = useState('');
  const [place, setPlace] = useState<CaptionPlace>('top');
  const [progress, setProgress] = useState<number | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [saved, setSaved] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [library, setLibrary] = useState(false);
  const [fetching, setFetching] = useState<string | null>(null);
  const making = progress !== null;

  // Object URLs go when they're replaced or the page closes.
  const urls = useRef<Set<string>>(new Set());
  const keep = (url: string) => { urls.current.add(url); return url; };
  useEffect(() => () => { urls.current.forEach((u) => URL.revokeObjectURL(u)); }, []);

  const dims = gifDimensions(video?.w ?? 1, video?.h ?? 1, size);
  const step = result ? 2 : video ? 1 : 0;

  const takeFile = async (file: File | undefined) => {
    if (!file) return;
    const url = keep(URL.createObjectURL(file));
    try {
      const info = await videoInfo(url);
      setVideo({ file, url, ...info });
      setTrim(defaultTrim(info.duration));
      setError('');
    } catch {
      setError("That video can't be played here. Try an MP4.");
    }
  };
  const pickVideo = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    void takeFile(file);
  };
  // A video dropped on the card becomes the clip.
  const onDragOver = (e: DragEvent<HTMLElement>) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = (e: DragEvent<HTMLElement>) => { e.preventDefault(); setDragging(false); };
  const onDrop = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) void takeFile(file);
  };
  // A meme clip from the app's library (the video editor's Clips), downloaded to make the GIF from.
  const pickClip = async (clip: VideoClip) => {
    setFetching(clip.name);
    setError('');
    try {
      const res = await fetch(clip.videoUrl);
      if (!res.ok) throw new Error('unavailable');
      const blob = await res.blob();
      await takeFile(new File([blob], `${clip.name}.mp4`, { type: blob.type || 'video/mp4' }));
    } catch {
      setError("That clip couldn't be downloaded. Check the connection and try again.");
    } finally {
      setFetching(null);
    }
  };
  const startOver = () => {
    setVideo(null);
    setResult(null);
    setCaption('');
    setError('');
  };

  const make = async () => {
    if (!video || making) return;
    setError('');
    setProgress(0);
    try {
      const blob = await makeGif({ file: video.file, trim, speed, loop, w: dims.w, h: dims.h, caption: { text: caption, place } }, setProgress);
      const seconds = gifSeconds({ clip: trim.end - trim.start, speed, loop });
      setResult({ blob, url: keep(URL.createObjectURL(blob)), ...dims, seconds });
      setSaved(false);
      setSaveFailed(false);
    } catch {
      setError("The GIF couldn't be made. Try a shorter clip.");
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="ui-theme gm">
      <header className="gm-header">
        <button type="button" className="gm-back" onClick={onBack} aria-label="Back" title="Back">
          <ChevronLeft size={22} strokeWidth={2.4} />
        </button>
        <h1 className="gm-title ui-topbar-title">
          <ImagePlay size={17} strokeWidth={2.3} className="gm-title-icon" aria-hidden="true" />
          <span>GIF Studio</span>
        </h1>
        {/* Said for screen readers (and the tests): where the GIF stands. */}
        <p className="gm-status ui-topbar-subtitle" aria-live="polite">{['Add a video', 'Ready to make', 'Ready to export'][step]}</p>
      </header>

      <main className="gm-body" aria-label="Make a GIF">
        <div className="gm-stage" onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
          {video ? (
            <>
              <Preview video={video} trim={trim} speed={speed} loop={loop} caption={caption} place={place} progress={progress} />
              {!making && (
                <button type="button" className="gm-remove" aria-label="Remove the video" onClick={startOver}>
                  <X size={14} strokeWidth={2.6} aria-hidden="true" />
                </button>
              )}
            </>
          ) : (
            <label className={`ie-swap-tile is-empty gm-video-tile${dragging ? ' is-drag-over' : ''}`}>
              {/* As Face Swap's Your face card: the icon in a soft orange circle, what goes in, Choose. */}
              {fetching ? (
                <span className="ie-swap-empty" role="status">
                  <span className="ie-swap-spinner" aria-hidden="true" />
                  <span className="ie-swap-empty-title gm-fetching">Getting the clip…</span>
                  <span className="ie-swap-empty-hint">{fetching}</span>
                </span>
              ) : (
                <EmptyTile Icon={Video} title={dragging ? 'Drop it here' : 'Add a video'} hint={`Up to ${MAX_CLIP_S} seconds of it becomes your GIF`} />
              )}
              <input type="file" accept="video/*" aria-label="Choose a video" onChange={pickVideo} disabled={Boolean(fetching)} hidden />
            </label>
          )}
        </div>

        {error && <p className="gm-error" role="alert">{error}</p>}

        {!video ? (
          <div className="gm-sources" role="group" aria-label="Add a video">
            <label className="gm-source">
              <UploadCloud size={22} aria-hidden="true" />
              Upload
              <input type="file" accept="video/*" aria-label="Upload a video" onChange={pickVideo} hidden />
            </label>
            <label className="gm-source">
              <Camera size={22} aria-hidden="true" />
              Record
              <input type="file" accept="video/*" capture="environment" aria-label="Record a video" onChange={pickVideo} hidden />
            </label>
            <button type="button" className="gm-source" aria-label="Clips" disabled={Boolean(fetching)} onClick={() => setLibrary(true)}>
              <Clapperboard size={22} aria-hidden="true" />
              Clips
            </button>
          </div>
        ) : (
          <>
            <TrimBar video={video} trim={trim} onChange={setTrim} disabled={making} />

            <div className="gm-panel gm-caption">
              <Type size={16} className="gm-row-icon" aria-hidden="true" />
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

            <div className="gm-panel gm-settings">
              <div className="gm-setting">
                <span className="gm-setting-name"><Gauge size={16} className="gm-row-icon" aria-hidden="true" />Speed</span>
                <Segmented label="Speed" options={SPEEDS} value={speed} onChange={setSpeed} disabled={making} />
              </div>
              <div className="gm-setting">
                <span className="gm-setting-name"><Repeat size={16} className="gm-row-icon" aria-hidden="true" />Loop</span>
                <Segmented label="Loop" options={LOOPS} value={loop} onChange={setLoop} disabled={making} />
              </div>
              <div className="gm-setting">
                <span className="gm-setting-name"><Maximize2 size={16} className="gm-row-icon" aria-hidden="true" />Size <small>{dims.w} × {dims.h}</small></span>
                <Segmented label="Size" options={SIZES} value={size} onChange={setSize} disabled={making} />
              </div>
            </div>
          </>
        )}
      </main>

      <div className="gm-actions">
        <button type="button" className="gm-make" disabled={!video || making} onClick={() => void make()}>
          <ImagePlay aria-hidden="true" />
          {making ? `Making GIF… ${Math.round((progress ?? 0) * 100)}%` : 'Make GIF'}
        </button>
      </div>

      {/* The meme clips, full height over the page. */}
      {library && (
        <div className="gm-library ie-panels--full">
          <ClipsSheet onClose={() => setLibrary(false)} onPick={(c) => void pickClip(c)} />
        </div>
      )}

      {result && (
        <PickerSheet title="Your GIF" onClose={() => setResult(null)}>
          <ResultSheet result={result} saved={saved} saveFailed={saveFailed} onSave={onSaveToGallery ? async () => {
            const dataUrl = await readDataUrl(result.blob);
            const ok = await onSaveToGallery({ kind: 'gif', name: caption.trim() || 'My GIF', imageUrl: dataUrl, rawImageUrl: dataUrl });
            setSaveFailed(ok === false);
            setSaved(ok !== false);
          } : undefined} />
        </PickerSheet>
      )}
    </div>
  );
}

// The live preview: the clip looping between its trim at its speed (a bounce played back by
// stepping the video), the caption laid over in the GIF's look.
function Preview({ video, trim, speed, loop, caption, place, progress }: { video: VideoSrc; trim: Trim; speed: number; loop: Loop; caption: string; place: CaptionPlace; progress: number | null }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
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
  }, [video, trim.start, trim.end, speed, loop]);

  return (
    <div className="gm-preview-box">
      <div className="gm-preview" style={{ '--gm-ar': String(video.w / Math.max(1, video.h)) } as CSSProperties}>
        <video ref={ref} src={video.url} muted playsInline aria-label="Preview" />
        {caption.trim() && (
          <span className={`gm-preview-caption is-${place}`} style={{ fontFamily: CAPTION_FONT }} aria-hidden="true">{caption.toUpperCase()}</span>
        )}
      </div>
      {progress !== null && (
        <div className="gm-busy" role="status">
          <span className="ie-swap-spinner" aria-hidden="true" />
          Making your GIF… {Math.round(progress * 100)}%
        </div>
      )}
    </div>
  );
}

// The clip's trim, in its card: a filmstrip of the video with the chosen part framed in orange
// between two handles; drag a handle to move that end, or the frame to slide the whole clip.
function TrimBar({ video, trim, onChange, disabled }: { video: VideoSrc; trim: Trim; onChange: (t: Trim) => void; disabled: boolean }) {
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
    <div className="gm-panel gm-trim">
      <div className="gm-trim-head">
        <span className="gm-setting-name"><Scissors size={16} className="gm-row-icon" aria-hidden="true" />Clip</span>
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

function ResultSheet({ result, saved, saveFailed, onSave }: { result: Result; saved: boolean; saveFailed?: boolean; onSave?: () => Promise<void> }) {
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
      {saveFailed && (
        <p className="gm-result-error" role="alert">Couldn't save to My Studio. Your device may be out of space. Download it instead.</p>
      )}
    </div>
  );
}
