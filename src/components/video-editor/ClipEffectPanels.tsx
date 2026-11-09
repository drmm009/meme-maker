import { Pipette, X, ZoomIn } from 'lucide-react';
import { Slider } from '../ui';
import { useEditorStore, sourceTimeMs } from '../../store/useVideoEditorStore';
import { clipOpacity } from '../../model/videoProject';
import type { ChromaKey } from '../../model/videoProject';
import { DEFAULT_CHROMA_KEY } from '../../utils/chromaKey';
import { clipPunchTimes } from '../../utils/zoomPunch';
import { flashCanvas } from './preview/flashBus';

// A video clip as these sheets see it.
interface EffectClip {
  id: string;
  startMs: number;
  endMs: number;
  playbackRate?: number;
  trimStartMs?: number;
  opacity?: number;
  chromaKey?: ChromaKey | null;
  punches?: number[];
}

const update = (id: string, patch: Partial<EffectClip>) => useEditorStore.getState().updateItem(id, patch);

const OPACITY_STOPS = [25, 50, 75, 100];

// How see-through the clip is: the value big, a slider, then quick stops.
export function OpacityPanel({ item }: { item: EffectClip }) {
  const opacity = Math.round(clipOpacity(item) * 100);
  const set = (v: number) => update(item.id, { opacity: v / 100 });
  return (
    <div className="vt-stack">
      <div className="vt-readout">
        <strong>{opacity}%</strong>
        <span>{opacity === 100 ? 'Solid' : opacity === 0 ? 'Hidden' : 'See-through'}</span>
      </div>
      <Slider label="Opacity" min={0} max={100} value={opacity} onChange={set} />
      <div className="vt-pills" role="radiogroup" aria-label="Quick opacity">
        {OPACITY_STOPS.map((v) => (
          <button key={v} type="button" role="radio" aria-checked={opacity === v} className={`vt-pill${opacity === v ? ' is-on' : ''}`} onClick={() => set(v)}>
            {v}%
          </button>
        ))}
      </div>
    </div>
  );
}

// Green screen: the screen colour (found by itself, or picked by tapping the swatch) with Detect
// beside it, then how much is taken out and how soft its edges are. Turn off is the sheet's.
export function GreenScreenPanel({ item }: { item: EffectClip }) {
  const key = item.chromaKey;
  if (!key) return null;
  const setKey = (patch: Partial<ChromaKey>) => update(item.id, { chromaKey: { ...key, ...patch } });
  const detecting = key.color === 'auto';
  const colour = detecting ? DEFAULT_CHROMA_KEY.color : key.color;
  return (
    <div className="vt-stack">
      <div className="vt-key-colour">
        <label className="vt-key-swatch" title="Pick the screen colour" style={{ background: colour }}>
          <input type="color" className="vt-hidden-input" aria-label="Screen colour" value={colour} onChange={(e) => setKey({ color: e.target.value })} />
        </label>
        <span className="vt-key-text">
          <strong>Screen colour</strong>
          <span>{detecting ? 'Finding it…' : 'Tap the colour to pick it yourself'}</span>
        </span>
        <button type="button" className="vt-pill" onClick={() => setKey({ color: 'auto' })} disabled={detecting}>
          <Pipette size={15} aria-hidden="true" /> Detect
        </button>
      </div>
      <div className="vt-tune">
        <span className="vt-tune-label">Strength</span>
        <Slider label="Strength" min={5} max={50} value={Math.round(key.similarity * 100)} onChange={(v) => setKey({ similarity: v / 100 })} format={(v) => String(v)} />
        <span className="vt-tune-label">Edges</span>
        <Slider label="Edges" min={0} max={30} value={Math.round(key.blend * 100)} onChange={(v) => setKey({ blend: v / 100 })} format={(v) => String(v)} />
      </div>
      <p className="vt-panel-hint">More strength takes out more of the screen; softer edges blend hair and outlines.</p>
    </div>
  );
}

const seconds = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

// Zoom punches: how many, a big button to add one at the playhead, then each one as a pill (tap to
// go to it, × to remove it). Clear all is the sheet's.
export function PunchPanel({ item }: { item: EffectClip }) {
  const playhead = useEditorStore((s) => s.playhead) as number;
  const inside = playhead >= item.startMs && playhead <= item.endMs;
  const punches = item.punches || [];
  const times = clipPunchTimes(item);
  const add = () => {
    if (!inside) return;
    update(item.id, { punches: [...punches, sourceTimeMs(item, playhead)].sort((a, b) => a - b) });
    flashCanvas({ kind: 'punch' });
  };
  const rate = item.playbackRate || 1;
  const trim = item.trimStartMs || 0;
  const at = (s: number) => item.startMs + (s - trim) / rate;
  return (
    <div className="vt-stack">
      <div className="vt-readout">
        <strong>{times.length || 'None'}</strong>
        <span>{times.length ? (times.length === 1 ? 'zoom punch' : 'zoom punches') : 'A quick zoom in, on the beat'}</span>
      </div>
      <button type="button" className="vt-big-btn" onClick={add} disabled={!inside}>
        <ZoomIn size={20} aria-hidden="true" />
        <span>{inside ? 'Punch at playhead' : 'Move the playhead onto this clip'}</span>
      </button>
      {times.length > 0 && (
        <div className="vt-pills" aria-label="Punches">
          {punches.map((s, i) => {
            const t = at(s);
            if (t < item.startMs || t > item.endMs) return null;
            return (
              <span key={`${s}-${i}`} className="vt-pill vt-pill--split">
                <button type="button" className="vt-pill-main" title="Go to this punch" onClick={() => useEditorStore.getState().setPlayhead(t)}>
                  {seconds(t)}
                </button>
                <button type="button" className="vt-pill-x" aria-label={`Remove the punch at ${seconds(t)}`} onClick={() => update(item.id, { punches: punches.filter((_, j) => j !== i) })}>
                  <X size={14} aria-hidden="true" />
                </button>
              </span>
            );
          })}
        </div>
      )}
      <p className="vt-panel-hint">Tip: press play and tap Punch on the beat.</p>
    </div>
  );
}
