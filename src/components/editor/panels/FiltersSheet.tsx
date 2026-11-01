import { useState } from 'react';
import { ChevronDown, Circle, Flame, Contrast, Film, SunMoon, Coffee, Blend, Skull, Droplets, Sun, SunDim, SunMedium, Thermometer, Focus, Aperture } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, Section, Row, Slider, TileGrid, Tile } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { PHOTO_FILTERS } from '../../../data/photoFilters';
import { useSelection } from './selection';
import type { EditorActions } from './selection';

interface FilterPreset {
  id: string;
  name: string;
  filterString: string;
  values: Record<string, number>;
}
type FilterValues = Record<string, unknown>;

const PRESETS = PHOTO_FILTERS as FilterPreset[];
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
const SAMPLE_IMAGE = `data:image/svg+xml,${encodeURIComponent(`
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

// `base` is the untouched value. Warmth, sharpen and vignette are canvas/draw/photoEffects.
const ADJUSTMENTS = [
  { key: 'brightness', label: 'Brightness', min: 40, max: 200, base: 100, StartIcon: SunDim, EndIcon: Sun },
  { key: 'contrast', label: 'Contrast', min: 40, max: 250, base: 100, StartIcon: Contrast, EndIcon: Contrast },
  { key: 'saturation', label: 'Saturation', min: 0, max: 300, base: 100, StartIcon: SunMedium, EndIcon: SunMedium },
  { key: 'warmth', label: 'Warmth', min: -100, max: 100, base: 0, StartIcon: Thermometer, EndIcon: Thermometer },
  { key: 'sharpen', label: 'Sharpen', min: 0, max: 100, base: 0, StartIcon: Focus, EndIcon: Focus },
  { key: 'vignette', label: 'Vignette', min: 0, max: 100, base: 0, StartIcon: Aperture, EndIcon: Aperture },
];

const presetLabel = (id: string) => (PRESETS.find((p) => p.id === id)?.name || '').replace(/[^\p{L}\p{N}&' ]/gu, '').trim();

// The AI/Filters strip's Filters: presets for the selected image, or else the meme; the
// adjustments (brightness, contrast..., background blur) fold away until opened.
export default function FiltersSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const imageFilters: FilterValues = useMemeEditorStore((s: { imageFilters: FilterValues }) => s.imageFilters) || {};
  const setImageFilters = useMemeEditorStore((s: { setImageFilters: (fn: (prev: FilterValues) => FilterValues) => void }) => s.setImageFilters);
  const patchLayer = useMemeEditorStore((s: { patchLayer: (key: string, id: string, patch: object) => void }) => s.patchLayer);
  const pushHistoryDebounced = useMemeEditorStore((s: { pushHistoryDebounced: () => void }) => s.pushHistoryDebounced);
  const activeTemplate = useMemeEditorStore((s: { activeTemplate?: { imageUrl?: string; url?: string; rawImageUrl?: string; mediaType?: string; type?: string } | null }) => s.activeTemplate);
  const { id, image } = useSelection();
  const onLayer = Boolean(image && id);
  const [showAdjust, setShowAdjust] = useState(false);

  const toggleAdjust = () => {
    setShowAdjust((prev) => {
      const next = !prev;
      if (!next) {
        const body = document.querySelector('.ie-filters-sheet .ui-sheet-body');
        if (body) body.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return next;
    });
  };

  // Use the active photo or template image if available; otherwise use the colorful sample image
  const templatePhoto = activeTemplate?.type !== 'video' && activeTemplate?.mediaType !== 'video'
    ? (activeTemplate?.imageUrl || activeTemplate?.url || activeTemplate?.rawImageUrl)
    : null;
  const previewSrc = (onLayer && image?.url) || templatePhoto || SAMPLE_IMAGE;

  const layerValues = (image?.filters && typeof image.filters === 'object' ? image.filters : {}) as Record<string, number>;
  const preset = onLayer ? String(image?.filterId || 'original') : String(imageFilters.preset || 'original');
  const base = (key: string) => ADJUSTMENTS.find((a) => a.key === key)?.base ?? 100;
  const value = (key: string) => Number((onLayer ? layerValues[key] : imageFilters[key]) ?? (key === 'saturation' ? imageFilters.saturate ?? 100 : base(key)));

  const applyPreset = (p: FilterPreset) => {
    if (onLayer) actions.updateActiveImageLayer({ filterId: p.id, filter: p.filterString, filters: p.values });
    else {
      setImageFilters((prev: FilterValues) => ({ ...prev, preset: p.id, filterString: p.filterString, ...p.values }));
      pushHistoryDebounced();
    }
  };
  // Moving a slider keeps the preset's name but drops its fixed filter string, so the values rule.
  const adjust = (key: string, v: number) => {
    if (onLayer && id) patchLayer('imageLayers', id, { filters: { ...PRESETS[0].values, ...layerValues, [key]: v }, filter: undefined });
    else {
      setImageFilters((prev: FilterValues) => ({ ...prev, [key]: v, filterString: '' }));
      pushHistoryDebounced();
    }
  };

  return (
    <Sheet className="ie-filters-sheet" title="Filters" hideTitle onClose={onClose}>
      <Section title={preset !== 'original' ? `Preset: ${presetLabel(preset)}` : 'Preset'}>
        <div className="ie-filter-grid">
          <TileGrid>
            {PRESETS.map((p) => (
              <Tile
                key={p.id}
                className="ie-filter-tile"
                label={p.name}
                icon={<FilterThumbnail preset={p} src={previewSrc} />}
                active={preset === p.id}
                onClick={() => applyPreset(p)}
              />
            ))}
          </TileGrid>
        </div>
      </Section>
      <Section rule>
        <button type="button" className="ie-fold" aria-expanded={showAdjust} onClick={toggleAdjust}>
          Adjustments
          <ChevronDown size={18} aria-hidden="true" />
        </button>
        <AnimatePresence initial={false}>
          {showAdjust && (
            <motion.div
              key="filters-adjustments"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              style={{ overflow: 'hidden' }}
            >
              <div className="ie-adjustments-content">
                {ADJUSTMENTS.map((a) => (
                  <Row key={a.key} label={a.label}>
                    <Slider label={a.label} min={a.min} max={a.max} value={value(a.key)} onChange={(v) => adjust(a.key, v)} StartIcon={a.StartIcon} EndIcon={a.EndIcon} />
                  </Row>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Section>
    </Sheet>
  );
}
