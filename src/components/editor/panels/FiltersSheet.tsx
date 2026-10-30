import { useState } from 'react';
import { ChevronDown, Circle, Flame, Contrast, Film, SunMoon, Coffee, Blend, Skull, Droplets, Sparkles, Sun, SunDim, SunMedium, Thermometer, Focus, Aperture } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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
  original: Circle, 'deep-fried': Flame, punchy: Contrast, vintage: Film, bw: SunMoon,
  sepia: Coffee, invert: Blend, wasted: Skull, blur: Droplets,
};
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
  const { id, image } = useSelection();
  // Multi-panel layouts have several photos: background blur is for a single one.
  const isLayout = Boolean(actions.isNativeLayout);
  const onLayer = Boolean(image && id);
  const [showAdjust, setShowAdjust] = useState(false);

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
    <Sheet title="Filters" hideTitle onClose={onClose}>
      <Section title={preset !== 'original' ? `Preset: ${presetLabel(preset)}` : 'Preset'}>
        <TileGrid>
          {PRESETS.map((p) => (
            <Tile key={p.id} label={p.name} Icon={ICONS[p.id] || Sparkles} active={preset === p.id} onClick={() => applyPreset(p)} />
          ))}
        </TileGrid>
      </Section>
      <Section rule>
        <button type="button" className="ie-fold" aria-expanded={showAdjust} onClick={() => setShowAdjust(!showAdjust)}>
          Adjustments
          <ChevronDown size={18} aria-hidden="true" />
        </button>
        {showAdjust && ADJUSTMENTS.map((a) => (
          <Row key={a.key} label={a.label}>
            <Slider label={a.label} min={a.min} max={a.max} value={value(a.key)} onChange={(v) => adjust(a.key, v)} StartIcon={a.StartIcon} EndIcon={a.EndIcon} />
          </Row>
        ))}
        {showAdjust && !onLayer && !isLayout && (
          <>
            <Row label="Background blur">
              <Slider label="Background blur" min={0} max={30} value={Number(imageFilters.bgBlur || 0)} onChange={(v) => actions.setPortraitBlur(v)} StartIcon={Focus} EndIcon={Droplets} />
            </Row>
            <p className="ie-empty">{actions.isRemovingBg ? 'Finding the subject…' : 'Blurs the photo behind the person or thing in front.'}</p>
          </>
        )}
      </Section>
    </Sheet>
  );
}
