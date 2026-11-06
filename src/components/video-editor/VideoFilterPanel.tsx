import { useState } from 'react';
import { Circle, Contrast, Droplets, Film, Flame, Moon, SunMoon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Slider, Tile, TileGrid } from '../ui';
import { FILTER_PRESETS, filterCss, resolveFilter } from '../../utils/clipFilters';
import { useEditorStore } from '../../store/useVideoEditorStore';
import useClipFrame from './useClipFrame';
import type { ClipFilter, VideoClip } from '../../model/videoProject';
import '../editor/panels/panels.css';

// A video's Filters sheet, laid out as a photo's (the image editor's FilterControls): Presets, a
// still of the clip in each look, or Adjust, two sliders to a line. The looks and sliders are the
// video's own (utils/clipFilters), which the FFmpeg export can match; Reset is the sheet's (clipSheetActions).
type FilteredVideo = Pick<VideoClip, 'id' | 'type' | 'url' | 'startMs' | 'endMs'> & { filter?: ClipFilter | null };

const ICONS: Record<string, LucideIcon> = {
  none: Circle, bw: SunMoon, vintage: Film, vivid: Contrast, faded: Droplets, noir: Moon, deepfried: Flame,
};

const SLIDERS = [
  { key: 'brightness', label: 'Brightness' },
  { key: 'contrast', label: 'Contrast' },
  { key: 'saturation', label: 'Saturation' },
] as const;

const TABS = [
  { id: 'presets', label: 'Presets' },
  { id: 'adjust', label: 'Adjust' },
] as const;

const update = (id: string, filter: ClipFilter | null) => useEditorStore.getState().updateItem(id, { filter });

export default function VideoFilterPanel({ item }: { item: FilteredVideo }) {
  const [tab, setTab] = useState<'presets' | 'adjust'>('presets');
  const frame = useClipFrame(item);
  const filter = item.filter || {};
  const set = (patch: ClipFilter) => update(item.id, { ...filter, ...patch });
  return (
    <div className="ie-panels--sheet vt-ie-look">
      <div className="ie-filters-sheet ie-tool-sheet">
        <div className="ie-filter-tabs" role="tablist" aria-label="Filters">
          {TABS.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id}
              className={`ie-filter-tab${tab === t.id ? ' is-on' : ''}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        {tab === 'presets' ? (
          <div className="ie-filter-grid">
            <TileGrid>
              {FILTER_PRESETS.map((p) => {
                const Icon = ICONS[p.id ?? 'none'];
                return (
                  <Tile
                    key={p.label}
                    className="ie-filter-tile"
                    label={p.label}
                    active={(filter.preset ?? null) === p.id}
                    onClick={() => set({ preset: p.id })}
                    icon={(
                      <span className="ie-filter-thumb">
                        {frame
                          ? <img src={frame} alt="" className="ie-filter-thumb-img" style={{ filter: filterCss(resolveFilter({ preset: p.id })) || undefined }} />
                          : <span className="ie-filter-thumb-img vt-filter-thumb-empty" />}
                        {p.id && Icon && (
                          <span className="ie-filter-thumb-badge" aria-hidden="true"><Icon size={10} strokeWidth={2.4} /></span>
                        )}
                      </span>
                    )}
                  />
                );
              })}
            </TileGrid>
          </div>
        ) : (
          <div className="ie-adjust-grid">
            {SLIDERS.map(({ key, label }) => (
              <div key={key} className="ie-adjust-item">
                <span className="ui-row-label">{label}</span>
                <Slider label={label} min={-100} max={100} value={Math.round(filter[key] || 0)}
                  onChange={(v) => set({ [key]: v })} format={(v) => (v > 0 ? `+${Math.round(v)}` : String(Math.round(v)))} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
