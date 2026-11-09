import { useEffect, useState, type CSSProperties } from 'react';
import { Contrast, Droplets, Sun } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { FILTER_PRESETS, filterCss, resolveFilter } from '../../utils/clipFilters';
import { CLIP_FX, applyClipFx, seeded } from '../../utils/clipFx';
import type { ClipFxId } from '../../utils/clipFx';
import { useEditorStore } from '../../store/useVideoEditorStore';
import useClipFrame from './useClipFrame';
import type { ClipFilter, VideoClip } from '../../model/videoProject';

// A video's Filters sheet, in the sheets' grey with black controls: Presets, a row of stills of the
// clip in each look; Effects, the same for the effects drawn over it (Glitch, Pixel, VHS…:
// utils/clipFx, which only the frame-by-frame export draws); or Adjust, a slider per setting that
// fills out from the middle (0). Reset is the sheet's (clipSheetActions).
type FilteredVideo = Pick<VideoClip, 'id' | 'type' | 'url' | 'startMs' | 'endMs'> & { filter?: ClipFilter | null };

const SLIDERS: { key: 'brightness' | 'contrast' | 'saturation'; label: string; Icon: LucideIcon }[] = [
  { key: 'brightness', label: 'Brightness', Icon: Sun },
  { key: 'contrast', label: 'Contrast', Icon: Contrast },
  { key: 'saturation', label: 'Saturation', Icon: Droplets },
];

const TABS = [
  { id: 'presets', label: 'Presets' },
  { id: 'effects', label: 'Effects' },
  { id: 'adjust', label: 'Adjust' },
] as const;
type Tab = (typeof TABS)[number]['id'];

// A moment of the footage at which Glitch is mid-burst, for its still.
const GLITCH_MS = (() => {
  for (let k = 0; k < 64; k++) if (seeded(k * 31) < 0.35) return k * 90;
  return 0;
})();
const THUMB_WIDTH = 160;

// Each effect drawn over a still of the clip (with its look), as picture URLs; {} until ready.
function useFxStills(frame: string | null, css: string): Partial<Record<ClipFxId, string>> {
  const [stills, setStills] = useState<Partial<Record<ClipFxId, string>>>({});
  useEffect(() => {
    if (!frame) return undefined;
    let live = true;
    const img = new Image();
    img.onload = () => {
      if (!live || !img.width) return;
      const w = THUMB_WIDTH;
      const h = Math.max(1, Math.round((img.height / img.width) * w));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      const holder = {};
      const out: Partial<Record<ClipFxId, string>> = {};
      for (const { id } of CLIP_FX) {
        ctx.filter = css || 'none';
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        ctx.filter = 'none';
        try {
          applyClipFx(ctx, w, h, id, id === 'glitch' ? GLITCH_MS : 1200, holder);
          out[id] = canvas.toDataURL('image/jpeg', 0.8);
        } catch {
          // A still that can't be read back: that tile shows the plain still.
        }
      }
      setStills(out);
    };
    img.src = frame;
    return () => { live = false; };
  }, [frame, css]);
  return stills;
}

const update = (id: string, filter: ClipFilter | null) => useEditorStore.getState().updateItem(id, { filter });

const signed = (v: number) => (v > 0 ? `+${v}` : String(v));

export default function VideoFilterPanel({ item }: { item: FilteredVideo }) {
  const [tab, setTab] = useState<Tab>('presets');
  const frame = useClipFrame(item);
  const filter = item.filter || {};
  const lookCss = filterCss(resolveFilter({ preset: filter.preset ?? null }));
  const stills = useFxStills(tab === 'effects' ? frame : null, lookCss);
  const set = (patch: ClipFilter) => update(item.id, { ...filter, ...patch });
  return (
    <div className="vt-filters">
      <div className="vt-seg" role="tablist" aria-label="Filters">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id}
            className={`vt-seg-btn${tab === t.id ? ' is-on' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'effects' ? (
        <div className="vt-looks" role="radiogroup" aria-label="Effects">
          {[{ id: null, label: 'None' }, ...CLIP_FX].map((f) => {
            const on = (filter.fx ?? null) === f.id;
            const still = f.id ? stills[f.id] : frame;
            return (
              <button key={f.label} type="button" role="radio" aria-checked={on}
                className={`vt-look${on ? ' is-on' : ''}`} onClick={() => set({ fx: f.id })}>
                <span className="vt-look-thumb">
                  {still
                    ? <img src={still} alt="" style={!f.id && lookCss ? { filter: lookCss } : undefined} />
                    : <span className="vt-filter-thumb-empty" />}
                </span>
                <span className="vt-look-label">{f.label}</span>
              </button>
            );
          })}
        </div>
      ) : tab === 'presets' ? (
        <div className="vt-looks" role="radiogroup" aria-label="Looks">
          {FILTER_PRESETS.map((p) => {
            const on = (filter.preset ?? null) === p.id;
            return (
              <button key={p.label} type="button" role="radio" aria-checked={on}
                className={`vt-look${on ? ' is-on' : ''}`} onClick={() => set({ preset: p.id })}>
                <span className="vt-look-thumb">
                  {frame
                    ? <img src={frame} alt="" style={{ filter: filterCss(resolveFilter({ preset: p.id })) || undefined }} />
                    : <span className="vt-filter-thumb-empty" />}
                </span>
                <span className="vt-look-label">{p.label}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="vt-adjust">
          {SLIDERS.map(({ key, label, Icon }) => {
            const value = Math.round(filter[key] || 0);
            // The filled part runs from the middle (0) to the value.
            const pct = (value + 100) / 2;
            const fill = { '--lo': `${Math.min(50, pct)}%`, '--hi': `${Math.max(50, pct)}%` } as CSSProperties;
            return (
              <div key={key} className="vt-adjust-row">
                <div className="vt-adjust-head">
                  <span className="vt-adjust-icon" aria-hidden="true"><Icon size={16} /></span>
                  <span className="vt-adjust-label">{label}</span>
                  <button type="button" className={`vt-adjust-value${value ? ' is-set' : ''}`} disabled={!value}
                    aria-label={`Reset ${label}`} title={value ? 'Back to 0' : undefined} onClick={() => set({ [key]: 0 })}>
                    {signed(value)}
                  </button>
                </div>
                <input type="range" className="vt-bislider" aria-label={label} min={-100} max={100} step={1} value={value}
                  style={fill} onChange={(e) => set({ [key]: Number(e.target.value) })} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
