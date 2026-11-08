import { useState, type CSSProperties } from 'react';
import { Contrast, Droplets, Sun } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { FILTER_PRESETS, filterCss, resolveFilter } from '../../utils/clipFilters';
import { useEditorStore } from '../../store/useVideoEditorStore';
import useClipFrame from './useClipFrame';
import type { ClipFilter, VideoClip } from '../../model/videoProject';

// A video's Filters sheet, in the sheets' grey with black controls: Looks, a row of stills of the
// clip in each look, or Adjust, a slider per setting that fills out from the middle (0). The looks
// and sliders are the video's own (utils/clipFilters), which the FFmpeg export can match; Reset is
// the sheet's (clipSheetActions).
type FilteredVideo = Pick<VideoClip, 'id' | 'type' | 'url' | 'startMs' | 'endMs'> & { filter?: ClipFilter | null };

const SLIDERS: { key: 'brightness' | 'contrast' | 'saturation'; label: string; Icon: LucideIcon }[] = [
  { key: 'brightness', label: 'Brightness', Icon: Sun },
  { key: 'contrast', label: 'Contrast', Icon: Contrast },
  { key: 'saturation', label: 'Saturation', Icon: Droplets },
];

const TABS = [
  { id: 'presets', label: 'Presets' },
  { id: 'adjust', label: 'Adjust' },
] as const;

const update = (id: string, filter: ClipFilter | null) => useEditorStore.getState().updateItem(id, { filter });

const signed = (v: number) => (v > 0 ? `+${v}` : String(v));

export default function VideoFilterPanel({ item }: { item: FilteredVideo }) {
  const [tab, setTab] = useState<'presets' | 'adjust'>('presets');
  const frame = useClipFrame(item);
  const filter = item.filter || {};
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
      {tab === 'presets' ? (
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
