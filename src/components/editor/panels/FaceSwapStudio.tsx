import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { ArrowRight, Camera, Check, CloudOff, Eye, ImagePlus, LayoutTemplate, Pencil, RefreshCw, UserRound, X } from 'lucide-react';
import { Slider } from '../../ui';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import {
  SAMPLE_FACES, detectFaces, faceSwapTemplate, getRememberedFace, loadPicture, pictureSize, readFile, rememberFace, serverReady, swapFace,
} from '../faceSwap';
import type { FaceSwapInputs, Picture, TargetFace } from '../faceSwap';
import type { EditorActions } from './selection';
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

// A small sheet over the page, rising from the bottom: where a picture comes from.
function PickerSheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="ie-swap-sheet-backdrop" onClick={onClose}>
      <div className="ie-swap-sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <span className="ie-swap-sheet-grip" aria-hidden="true" />
        <div className="ie-swap-sheet-head">
          <h2 className="ie-swap-sheet-title">{title}</h2>
          <button type="button" className="ie-swap-sheet-close" aria-label="Close" onClick={onClose}><X size={18} aria-hidden="true" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// The meme the maker opened on, as the picture to swap into.
const targetOf = (t: Template | null): Picture | null => (t?.faceSwap?.target
  ?? (t?.imageUrl ? { src: t.imageUrl, name: t.name || 'Meme', width: t.width, height: t.height, captions: t.defaultCaptions } : null));

// The Face Swap maker's page, over the meme: your face and the picture to swap it into side by side
// (each a button opening a sheet of where to get one; the picture has a remove button), which faces
// to swap and how strongly, then Swap faces. The result shows large (hold to compare);
// Use this makes it the meme, ready for captions and export. Needs face_swap_server.py running.
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
  const [result, setResult] = useState<string | null>(null);
  const [comparing, setComparing] = useState(false);
  const [picker, setPicker] = useState<Picker | null>(null);
  // The target as sent to the server (scaled data URL), with its size.
  const sent = useRef<{ src: string; width?: number; height?: number } | null>(null);

  // Any change to the inputs or settings undoes the result shown.
  const changed = () => {
    setResult(null);
    setError(null);
  };
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
      setResult(await swapFace({ face: faceData.src, target: targetData.src, faces, strength }));
    } catch (e) {
      setError((e as Error).message === 'offline' ? 'Lost the face swap server. Is it still running?' : (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // The meme takes the swapped picture's own size (the target's may not be known).
  const use = async () => {
    if (!result || !face || !target) return;
    const size = await pictureSize(result);
    actions.handleChangeMeme(faceSwapTemplate(result, { face, target: { ...target, width: size.width ?? target.width, height: size.height ?? target.height } }));
  };

  // (While swapping, the overlay on the pictures says so.)
  const status = busy ? null
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
          {result ? (
            <figure className="ie-swap-result">
              <img src={comparing ? target?.src : result} alt={comparing ? 'Before the swap' : 'The face swap'} />
              <button
                type="button"
                className="ie-swap-compare"
                onPointerDown={() => setComparing(true)}
                onPointerUp={() => setComparing(false)}
                onPointerLeave={() => setComparing(false)}
                onKeyDown={(e) => e.key === ' ' && setComparing(true)}
                onKeyUp={() => setComparing(false)}
              >
                <Eye size={15} aria-hidden="true" /> {comparing ? 'Before' : 'Hold to compare'}
              </button>
            </figure>
          ) : (
            <div className="ie-swap-inputs">
              <div className="ie-swap-slot">
                <button type="button" className={`ie-swap-tile${face ? '' : ' is-empty'}`} aria-label={face ? 'Change your face' : 'Add your face'} onClick={() => setPicker('face')}>
                  {face ? <img src={face.src} alt="" /> : <UserRound size={30} strokeWidth={1.8} aria-hidden="true" />}
                  <span className="ie-swap-tile-label">{face && <Pencil size={11} strokeWidth={2.6} aria-hidden="true" />}{face ? 'Your face' : 'Add your face'}</span>
                </button>
              </div>
              <span className="ie-swap-arrow" aria-hidden="true"><ArrowRight size={16} strokeWidth={2.4} /></span>
              <div className="ie-swap-slot">
                <button type="button" className={`ie-swap-tile${target ? '' : ' is-empty'}`} aria-label={target ? 'Change the picture' : 'Add a picture to swap into'} onClick={() => setPicker('target')}>
                  {target ? <img src={target.src} alt="" /> : <ImagePlus size={30} strokeWidth={1.8} aria-hidden="true" />}
                  <span className="ie-swap-tile-label">{target && <Pencil size={11} strokeWidth={2.6} aria-hidden="true" />}{target ? 'Swap into' : 'Add a picture'}</span>
                </button>
                {target && (
                  <button type="button" className="ie-swap-remove" aria-label="Remove the picture" onClick={() => setTarget(null)}>
                    <X size={14} strokeWidth={2.6} aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          )}
          {busy && (
            <div className="ie-swap-busy" role="status">
              <span className="ie-swap-spinner" aria-hidden="true" />
              Swapping faces…
            </div>
          )}
        </div>

        {error ? <p className="ie-swap-note is-error" role="alert">{error}</p> : status && <p className="ie-swap-note" aria-live="polite">{status}</p>}

        {targetFaces && targetFaces.length > 1 && (
          <div className="ie-swap-group">
            <p className="ie-swap-label">Faces to swap</p>
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
          </div>
        )}

        <div className="ie-swap-group">
          <div className="ie-swap-label-row">
            <p className="ie-swap-label">Strength</p>
            <span className="ie-swap-value">{Math.round(strength * 100)}%</span>
          </div>
          <Slider label="Swap strength" min={0.5} max={1} step={0.05} value={strength} onChange={(v) => { setStrength(v); changed(); }} />
        </div>
      </div>

      <div className="ie-swap-actions">
        {result ? (
          <>
            <button type="button" className="ie-swap-btn" onClick={changed}>Edit</button>
            <button type="button" className="ie-swap-btn ie-swap-btn--primary" onClick={() => void use()}>Use this</button>
          </>
        ) : (
          <>
            {swapped && <button type="button" className="ie-swap-btn" onClick={onClose}>Cancel</button>}
            <button type="button" className="ie-swap-btn ie-swap-btn--primary" disabled={!ready} onClick={swap}>
              {busy ? 'Swapping…' : 'Swap faces'}
            </button>
          </>
        )}
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
