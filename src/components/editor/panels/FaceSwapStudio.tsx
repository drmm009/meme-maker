import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { ArrowRight, Camera, Check, CloudOff, ImagePlus, LayoutTemplate, Pencil, RefreshCw, ScanFace, SlidersHorizontal, UserRound, X } from 'lucide-react';
import { Slider } from '../../ui';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import {
  SAMPLE_FACES, detectFaces, faceSwapTemplate, getRememberedFace, loadPicture, pictureSize, readFile, rememberFace, serverReady, swapFace,
} from '../faceSwap';
import type { FaceSwapInputs, Picture, TargetFace } from '../faceSwap';
import type { EditorActions } from './selection';
import { EmptyTile, PickerSheet } from './MakerPage';
import './faceSwap.css';

interface Template {
  name?: string;
  imageUrl?: string;
  width?: number;
  height?: number;
  defaultCaptions?: unknown[];
  faceSwap?: FaceSwapInputs;
}

type Server = 'checking' | 'online' | 'offline';
type Picker = 'face' | 'target';

// The meme the maker opened on, as the picture to swap into.
const targetOf = (t: Template | null): Picture | null => (t?.faceSwap?.target
  ?? (t?.imageUrl ? { src: t.imageUrl, name: t.name || 'Meme', width: t.width, height: t.height, captions: t.defaultCaptions } : null));

// The Face Swap maker's page, over the meme: your face and the picture to swap it into side by side
// (each a button opening a sheet of where to get one; the picture has a remove button), which faces
// to swap and how strongly, then Swap faces, whose result becomes the meme straight away (the
// editing page, with Hold to compare in CanvasStage). Needs face_swap_server.py running.
export default function FaceSwapStudio({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const activeTemplate: Template | null = useMemeEditorStore((s: { activeTemplate: Template | null }) => s.activeTemplate);
  const openSheet = useEditorUiStore((s: { openSheet: (sheet: string) => void }) => s.openSheet);
  const swapped = Boolean(activeTemplate?.faceSwap);
  const [face, setFaceState] = useState<Picture | null>(() => activeTemplate?.faceSwap?.face ?? getRememberedFace());
  const [target, setTargetState] = useState<Picture | null>(() => targetOf(activeTemplate));
  const [server, setServer] = useState<Server>('checking');
  const [check, setCheck] = useState(0);
  const [targetFaces, setTargetFaces] = useState<TargetFace[] | null>(null);
  const [faces, setFaces] = useState<number | 'all'>('all');
  const [strength, setStrength] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picker, setPicker] = useState<Picker | null>(null);
  // The target as sent to the server (scaled data URL), with its size.
  const sent = useRef<{ src: string; width?: number; height?: number } | null>(null);

  // Any change to the inputs or settings clears the last error.
  const changed = () => setError(null);
  const setFace = (next: Picture) => {
    rememberFace(next);
    setFaceState(next);
    changed();
  };
  const setTarget = (next: Picture | null) => {
    sent.current = null;
    setTargetState(next);
    setTargetFaces(null);
    changed();
  };

  useEffect(() => {
    let alive = true;
    setServer('checking');
    serverReady().then((ok) => alive && setServer(ok ? 'online' : 'offline'));
    return () => {
      alive = false;
    };
  }, [check]);

  // The faces in the target, to pick which to swap: all of them when there are several.
  useEffect(() => {
    if (server !== 'online' || !target) return undefined;
    let alive = true;
    setTargetFaces(null);
    loadPicture(target.src).then(async (picture) => {
      sent.current = picture;
      const found = await detectFaces(picture.src).catch(() => []);
      if (!alive) return;
      setTargetFaces(found);
      setFaces(found.length === 1 ? 0 : 'all');
    });
    return () => {
      alive = false;
    };
  }, [server, target]);

  const pickFile = (apply: (p: Picture) => void, name: string) => async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    setPicker(null);
    if (!file) return;
    const src = await readFile(file);
    const size = await loadPicture(src);
    apply({ src, name, width: size.width, height: size.height });
  };

  const noFaces = targetFaces !== null && targetFaces.length === 0;
  const ready = server === 'online' && Boolean(face && target) && targetFaces !== null && !noFaces && !busy;

  const swap = async () => {
    if (!ready || !face || !target) return;
    setBusy(true);
    setError(null);
    try {
      const [faceData, targetData] = await Promise.all([loadPicture(face.src), sent.current ? Promise.resolve(sent.current) : loadPicture(target.src)]);
      const result = await swapFace({ face: faceData.src, target: targetData.src, faces, strength });
      // The meme takes the swapped picture's own size (the target's may not be known).
      const size = await pictureSize(result);
      actions.handleChangeMeme(faceSwapTemplate(result, { face, target: { ...target, width: size.width ?? target.width, height: size.height ?? target.height } }));
    } catch (e) {
      setError((e as Error).message === 'offline' ? 'Lost the face swap server. Is it still running?' : (e as Error).message);
      setBusy(false);
    }
  };

  // (While swapping, the overlay on the pictures says so; this says how long.)
  const status = busy ? 'This can take up to a minute'
    : server === 'checking' ? 'Connecting to the face swap server…'
    : !face ? 'Add your face to start'
    : !target ? 'Pick a picture to swap into'
    : targetFaces === null ? 'Finding faces…'
    : noFaces ? 'No faces found in that picture. Try another.'
    : null;

  return (
    <section className="ie-swap" aria-label="Face swap">
      <div className="ie-swap-scroll">
        {server === 'offline' && (
          <div className="ie-swap-offline" role="status">
            <CloudOff size={20} aria-hidden="true" />
            <div>
              <p className="ie-swap-offline-title">Face swap is offline</p>
              <p className="ie-swap-offline-body">Start face_swap_server.py on this computer, then try again.</p>
            </div>
            <button type="button" className="ie-swap-chip" onClick={() => setCheck((n) => n + 1)}>
              <RefreshCw size={14} aria-hidden="true" /> Retry
            </button>
          </div>
        )}

        <div className="ie-swap-stage">
          <div className="ie-swap-inputs">
            <div className="ie-swap-slot">
              <button type="button" className={`ie-swap-tile${face ? '' : ' is-empty'}`} aria-label={face ? 'Change your face' : 'Add your face'} onClick={() => setPicker('face')}>
                {face ? (
                  <>
                    <img src={face.src} alt="" />
                    <span className="ie-swap-tile-label"><Pencil size={11} strokeWidth={2.6} aria-hidden="true" />Your face</span>
                  </>
                ) : (
                  <EmptyTile step={1} Icon={UserRound} title="Your face" hint="A clear, front-facing photo" />
                )}
              </button>
            </div>
            <div className="ie-swap-slot">
              <button type="button" className={`ie-swap-tile${target ? '' : ' is-empty'}`} aria-label={target ? 'Change the picture' : 'Add a picture to swap into'} onClick={() => setPicker('target')}>
                {target ? (
                  <>
                    <img src={target.src} alt="" />
                    <span className="ie-swap-tile-label"><Pencil size={11} strokeWidth={2.6} aria-hidden="true" />Swap into</span>
                  </>
                ) : (
                  <EmptyTile step={2} Icon={ImagePlus} title="Swap into" hint="A meme or any photo with faces" />
                )}
              </button>
              {target && (
                <button type="button" className="ie-swap-remove" aria-label="Remove the picture" onClick={() => setTarget(null)}>
                  <X size={14} strokeWidth={2.6} aria-hidden="true" />
                </button>
              )}
            </div>
            <span className="ie-swap-arrow" aria-hidden="true"><ArrowRight size={18} strokeWidth={2.6} /></span>
          </div>
          {busy && (
            <div className="ie-swap-busy" role="status">
              <span className="ie-swap-spinner" aria-hidden="true" />
              Swapping faces…
            </div>
          )}
        </div>

        <p className={`ie-swap-note${error ? ' is-error' : ''}`} role={error ? 'alert' : undefined} aria-live={error ? undefined : 'polite'}>
          {error || status || 'Ready to swap'}
        </p>

        {/* The choices, together in one card above the button. */}
        <div className="ie-swap-panel">
          <div className="ie-swap-panel-row">
            <span className="ie-swap-panel-label"><ScanFace size={16} aria-hidden="true" /> Faces</span>
            {targetFaces && targetFaces.length > 1 ? (
              <div className="ie-swap-row" role="radiogroup" aria-label="Faces to swap">
                <button type="button" role="radio" aria-checked={faces === 'all'} className={`ie-swap-chip${faces === 'all' ? ' is-on' : ''}`} onClick={() => { setFaces('all'); changed(); }}>
                  All {targetFaces.length}
                </button>
                {targetFaces.map((f) => (
                  <button key={f.index} type="button" role="radio" aria-checked={faces === f.index} aria-label={`Face ${f.index + 1}`} className={`ie-swap-face${faces === f.index ? ' is-on' : ''}`} onClick={() => { setFaces(f.index); changed(); }}>
                    <img src={f.thumb} alt="" />
                  </button>
                ))}
              </div>
            ) : (
              <span className="ie-swap-panel-value">
                {!target ? 'Add a picture first' : targetFaces === null ? (server === 'online' ? 'Finding…' : '—') : noFaces ? 'None found' : '1 face'}
              </span>
            )}
          </div>
          <div className="ie-swap-panel-row ie-swap-panel-row--slider">
            <span className="ie-swap-panel-label"><SlidersHorizontal size={16} aria-hidden="true" /> Strength</span>
            <div className="ie-swap-strength">
              <Slider label="Swap strength" min={0.5} max={1} step={0.05} value={strength} onChange={(v) => { setStrength(v); changed(); }} />
            </div>
            <span className="ie-swap-value">{Math.round(strength * 100)}%</span>
          </div>
        </div>
      </div>

      <div className="ie-swap-actions">
        {swapped && <button type="button" className="ie-swap-btn" onClick={onClose}>Cancel</button>}
        <button type="button" className="ie-swap-btn ie-swap-btn--primary" disabled={!ready} onClick={swap}>
          {busy ? 'Swapping…' : 'Swap faces'}
        </button>
      </div>

      {picker === 'face' && (
        <PickerSheet title="Your face" onClose={() => setPicker(null)}>
          <div className="ie-swap-sources">
            <label className="ie-swap-source">
              <ImagePlus size={22} aria-hidden="true" />
              Upload photo
              <input type="file" accept="image/*" aria-label="Upload your face" onChange={pickFile(setFace, 'Your photo')} hidden />
            </label>
            <label className="ie-swap-source">
              <Camera size={22} aria-hidden="true" />
              Take a selfie
              <input type="file" accept="image/*" capture="user" aria-label="Take a selfie" onChange={pickFile(setFace, 'Selfie')} hidden />
            </label>
          </div>
          <p className="ie-swap-label">Or try a sample</p>
          <div className="ie-swap-samples" role="radiogroup" aria-label="Sample faces">
            {SAMPLE_FACES.map((sample) => {
              const on = face?.src === sample.src;
              return (
                <button
                  key={sample.src}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  className={`ie-swap-sample${on ? ' is-on' : ''}`}
                  onClick={() => {
                    setFace(sample);
                    setPicker(null);
                  }}
                >
                  <span className="ie-swap-sample-pic">
                    <img src={sample.src} alt="" />
                    {on && <span className="ie-swap-sample-tick" aria-hidden="true"><Check size={12} strokeWidth={3} /></span>}
                  </span>
                  {sample.name}
                </button>
              );
            })}
          </div>
        </PickerSheet>
      )}

      {picker === 'target' && (
        <PickerSheet title="Swap into" onClose={() => setPicker(null)}>
          <div className="ie-swap-sources">
            <label className="ie-swap-source">
              <ImagePlus size={22} aria-hidden="true" />
              Upload photo
              <input type="file" accept="image/*" aria-label="Upload a picture to swap into" onChange={pickFile(setTarget, 'Picture')} hidden />
            </label>
            <button
              type="button"
              className="ie-swap-source"
              onClick={() => {
                setPicker(null);
                openSheet('memes');
              }}
            >
              <LayoutTemplate size={22} aria-hidden="true" />
              Pick a meme
            </button>
          </div>
        </PickerSheet>
      )}
    </section>
  );
}
