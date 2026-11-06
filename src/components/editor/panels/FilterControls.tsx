import { useState } from 'react';
import { Circle, Flame, Contrast, Film, SunMoon, Coffee, Blend, Skull, Droplets } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Slider, TileGrid, Tile } from '../../ui';
import { ADJUSTMENTS, PRESETS } from './filterAdjustments';
import type { FilterPreset } from './filterAdjustments';

const ICONS: Record<string, LucideIcon> = {
  original: Circle,
  'deep-fried': Flame,
  punchy: Contrast,
  vintage: Film,
  bw: SunMoon,
  sepia: Coffee,
  invert: Blend,
  wasted: Skull,
  blur: Droplets,
};

// Vibrant default sample graphic with sunset gradient and meme sunglasses character
// ensures each filter's visual effect is immediately obvious even before a photo is loaded.
export const SAMPLE_IMAGE = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ec4899"/>
      <stop offset="50%" stop-color="#8b5cf6"/>
      <stop offset="100%" stop-color="#06b6d4"/>
    </linearGradient>
    <linearGradient id="fur" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" fill="url(#bg)"/>
  <circle cx="78" cy="22" r="12" fill="#fbbf24"/>
  <path d="M28 32 L36 12 L48 28 Z" fill="#d97706"/>
  <path d="M72 32 L64 12 L52 28 Z" fill="#d97706"/>
  <ellipse cx="50" cy="54" rx="28" ry="26" fill="url(#fur)"/>
  <ellipse cx="50" cy="62" rx="18" ry="14" fill="#fef3c7"/>
  <rect x="30" y="44" width="16" height="11" rx="3" fill="#111827"/>
  <rect x="54" y="44" width="16" height="11" rx="3" fill="#111827"/>
  <line x1="45" y1="48" x2="55" y2="48" stroke="#111827" stroke-width="2.5"/>
  <polygon points="32,46 42,46 38,50 32,50" fill="#38bdf8" opacity="0.6"/>
  <polygon points="56,46 66,46 62,50 56,50" fill="#38bdf8" opacity="0.6"/>
  <ellipse cx="50" cy="59" rx="4" ry="3" fill="#111827"/>
  <path d="M46 64 Q50 67 54 64" fill="none" stroke="#111827" stroke-width="2" stroke-linecap="round"/>
</svg>
`)}`;

function FilterThumbnail({ preset, src }: { preset: FilterPreset; src: string }) {
  const [failed, setFailed] = useState(false);
  const Icon = ICONS[preset.id];

  // For Panic Blur in small thumbnail, 2px gives a clean motion blur indicator without becoming solid grey
  const filterStyle = preset.id === 'blur'
    ? 'blur(2px) contrast(110%)'
    : preset.filterString !== 'none'
      ? preset.filterString
      : undefined;

  return (
    <span className="ie-filter-thumb">
      <img
        key={src}
        src={failed ? SAMPLE_IMAGE : src}
        alt=""
        className="ie-filter-thumb-img"
        style={{ filter: filterStyle }}
        onError={() => setFailed(true)}
      />
      {Icon && preset.id !== 'original' && (
        <span className="ie-filter-thumb-badge" aria-hidden="true">
          <Icon size={10} strokeWidth={2.4} />
        </span>
      )}
    </span>
  );
}

const TABS = [
  { id: 'presets', label: 'Presets' },
  { id: 'adjust', label: 'Adjust' },
] as const;

interface FilterControlsProps {
  // The picture the presets' thumbnails show.
  src: string;
  // The preset picked, and each adjustment's value.
  preset: string;
  value: (key: string) => number;
  onPreset: (p: FilterPreset) => void;
  onAdjust: (key: string, v: number) => void;
}

// A photo's Filters, in both editors: Presets (a photo of each look) or Adjust (brightness,
// contrast..., two to a line). Reset is the sheet's.
export default function FilterControls({ src, preset, value, onPreset, onAdjust }: FilterControlsProps) {
  const [tab, setTab] = useState<'presets' | 'adjust'>('presets');
  return (
    <>
      <div className="ie-filter-tabs" role="tablist" aria-label="Filters">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`ie-filter-tab${tab === t.id ? ' is-on' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'presets' ? (
        <div className="ie-filter-grid">
          <TileGrid>
            {PRESETS.map((p) => (
              <Tile
                key={p.id}
                className="ie-filter-tile"
                label={p.name}
                icon={<FilterThumbnail preset={p} src={src} />}
                active={preset === p.id}
                onClick={() => onPreset(p)}
              />
            ))}
          </TileGrid>
        </div>
      ) : (
        <div className="ie-adjust-grid">
          {ADJUSTMENTS.map((a) => (
            <div key={a.key} className="ie-adjust-item">
              <span className="ui-row-label">{a.label}</span>
              <Slider label={a.label} min={a.min} max={a.max} value={value(a.key)} onChange={(v) => onAdjust(a.key, v)} format={(v) => String(Math.round(v - a.base))} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
