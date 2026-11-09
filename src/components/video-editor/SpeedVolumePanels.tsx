import { useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { Mic, Volume2, VolumeX } from 'lucide-react';
import { Slider } from '../ui';
import { useEditorStore } from '../../store/useVideoEditorStore';
import { DEFAULT_FADE_MS } from '../../utils/audioFades';
import { formatClock } from './timeline/timelineMath';

interface TimedClip {
  id: string;
  type: string;
  startMs: number;
  endMs: number;
  playbackRate?: number;
  volume?: number;
  muted?: boolean;
  fadeInMs?: number;
  fadeOutMs?: number;
  duck?: boolean;
  isVoiceover?: boolean;
}

const update = (id: string, patch: Partial<TimedClip>) => useEditorStore.getState().updateItem(id, patch);

// Every stop plays its sound with one atempo filter on export (0.5 to 2).
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

// A clip's speed: the speed and how long the clip runs at it, big, over a scale of stops. Changing
// speed keeps the clip covering the same footage, so it gets longer or shorter.
export function SpeedPanel({ item }: { item: TimedClip }) {
  const rate = item.playbackRate || 1;
  const footageMs = (item.endMs - item.startMs) * rate;
  const pick = (next: number) => {
    if (next !== rate) update(item.id, { playbackRate: next, endMs: item.startMs + footageMs / next });
  };
  // Dragging along the scale moves the knob from stop to stop (the nearest to the finger).
  const dragging = useRef(false);
  const stopAt = (e: ReactPointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const share = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width));
    return SPEEDS[Math.min(SPEEDS.length - 1, Math.floor(share * SPEEDS.length))];
  };
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    pick(stopAt(e));
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragging.current) pick(stopAt(e));
  };
  const onPointerUp = () => { dragging.current = false; };
  return (
    <div className="vt-speed">
      <div className="vt-readout">
        <strong>{rate}×</strong>
        <span>{rate === 1 ? 'Normal speed' : `${formatClock(footageMs / rate)} long, was ${formatClock(footageMs)}`}</span>
      </div>
      <div className="vt-speed-scale" role="radiogroup" aria-label="Speed"
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
        {SPEEDS.map((s) => (
          <button key={s} type="button" role="radio" aria-checked={s === rate} aria-label={`${s}×`}
            className={`vt-speed-stop${s === rate ? ' is-on' : ''}`} onClick={() => pick(s)}>
            <span className="vt-speed-dot" aria-hidden="true" />
            <span className="vt-speed-label" aria-hidden="true">{s}×</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Fade in and out as ramps.
function FadeGlyph({ out }: { out?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={out ? 'M3 6h6l12 12' : 'M3 18 15 6h6'} />
      <path d="M3 20h18" opacity="0.4" />
    </svg>
  );
}

// A clip's sound: a mute button beside the volume slider, then fades (and, for a sound, lowering
// it under a voice) as tiles that light up while on.
export function VolumePanel({ item }: { item: TimedClip }) {
  const volume = Math.round((Number.isFinite(item.volume) ? (item.volume as number) : 1) * 100);
  const muted = Boolean(item.muted);
  const tile = (on: boolean, label: string, icon: ReactNode, onClick: () => void, title?: string) => (
    <button type="button" aria-pressed={on} title={title} className={`vt-tool-tile${on ? ' is-on' : ''}`} onClick={onClick}>
      <span className="vt-tool-tile-icon">{icon}</span>
      <span className="vt-tool-tile-label">{label}</span>
    </button>
  );
  const fade = (key: 'fadeInMs' | 'fadeOutMs') => tile(Boolean(item[key]), key === 'fadeInMs' ? 'Fade in' : 'Fade out',
    <FadeGlyph out={key === 'fadeOutMs'} />, () => update(item.id, { [key]: item[key] ? 0 : DEFAULT_FADE_MS }));
  return (
    <div className="vt-volume">
      <div className="vt-readout">
        <strong>{muted ? 'Muted' : `${volume}%`}</strong>
        <span>{muted ? 'No sound from this clip' : volume === 100 ? 'Full volume' : 'Of its full volume'}</span>
      </div>
      <div className={`vt-volume-row${muted ? ' is-muted' : ''}`}>
        <button type="button" aria-pressed={muted} className={`vt-mute${muted ? ' is-on' : ''}`} onClick={() => update(item.id, { muted: !muted })}>
          {muted ? <VolumeX size={20} aria-hidden="true" /> : <Volume2 size={20} aria-hidden="true" />}
          <span>{muted ? 'Unmute' : 'Mute'}</span>
        </button>
        <Slider label="Volume" min={0} max={100} value={volume} onChange={(v) => update(item.id, { volume: v / 100, ...(muted && v > 0 ? { muted: false } : {}) })} />
      </div>
      <div className="vt-tool-tiles vt-volume-tiles">
        {fade('fadeInMs')}
        {fade('fadeOutMs')}
        {item.type === 'audio' && !item.isVoiceover && tile(Boolean(item.duck), 'Lower under voice', <Mic size={20} aria-hidden="true" />,
          () => update(item.id, { duck: !item.duck }), "Quieter while a voiceover or a video's sound plays")}
      </div>
    </div>
  );
}
