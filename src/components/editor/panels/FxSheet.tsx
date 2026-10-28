import { useState } from 'react';
import { Circle, Flame, Contrast, Film, SunMoon, Coffee, Blend, Skull, Droplets, Sparkles, Sun, SunDim, SunMedium, ImagePlus, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Sheet, Section, Row, SwatchRow, Slider, Switch, TileGrid, Tile, SegmentedControl } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';
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
const ADJUSTMENTS = [
  { key: 'brightness', label: 'Brightness', min: 40, max: 200, StartIcon: SunDim, EndIcon: Sun },
  { key: 'contrast', label: 'Contrast', min: 40, max: 250, StartIcon: Contrast, EndIcon: Contrast },
  { key: 'saturation', label: 'Saturation', min: 0, max: 300, StartIcon: SunMedium, EndIcon: SunMedium },
];
const CANVAS_COLORS = ['#ffffff', '#000000', '#1e293b', '#ff5a36', '#ffd60a', '#0a84ff', 'transparent'];
const WATERMARK_SPOTS = [
  { value: 'top-left', label: 'Top L' },
  { value: 'top-right', label: 'Top R' },
  { value: 'bottom-left', label: 'Bottom L' },
  { value: 'bottom-right', label: 'Bottom R' },
];

const presetLabel = (id: string) => (PRESETS.find((p) => p.id === id)?.name || '').replace(/[^\p{L}\p{N}&' ]/gu, '').trim();

// "Photo Grading & Effects": filter presets and adjustments for the photo, the whole meme or the
// selected image, then the canvas settings (background, flip, watermark).
export default function FxSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const imageFilters: FilterValues = useMemeEditorStore((s: { imageFilters: FilterValues }) => s.imageFilters) || {};
  const setImageFilters = useMemeEditorStore((s: { setImageFilters: (fn: (prev: FilterValues) => FilterValues) => void }) => s.setImageFilters);
  const patchLayer = useMemeEditorStore((s: { patchLayer: (key: string, id: string, patch: object) => void }) => s.patchLayer);
  const pushHistoryDebounced = useMemeEditorStore((s: { pushHistoryDebounced: () => void }) => s.pushHistoryDebounced);
  const canvasBgColor: string = useMemeEditorStore((s: { canvasBgColor: string }) => s.canvasBgColor);
  const canvasFlipX: boolean = useMemeEditorStore((s: { canvasFlipX: boolean }) => s.canvasFlipX);
  const watermark = useEditorUiStore((s: { watermark: Record<string, any> }) => s.watermark);
  const updateWatermark = useEditorUiStore((s: { updateWatermark: (key: string, value: unknown) => void }) => s.updateWatermark);
  const { id, image } = useSelection();
  const [target, setTarget] = useState<'layer' | 'photo' | 'meme'>(image ? 'layer' : imageFilters.filterScope === 'background' ? 'photo' : 'meme');
  const onLayer = target === 'layer' && Boolean(image && id);

  const layerValues = (image?.filters && typeof image.filters === 'object' ? image.filters : {}) as Record<string, number>;
  const preset = onLayer ? String(image?.filterId || 'original') : String(imageFilters.preset || 'original');
  const value = (key: string) => Number((onLayer ? layerValues[key] : imageFilters[key]) ?? (key === 'saturation' ? imageFilters.saturate ?? 100 : 100));

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
  const pickTarget = (t: 'layer' | 'photo' | 'meme') => {
    setTarget(t);
    if (t !== 'layer') setImageFilters((prev: FilterValues) => ({ ...prev, filterScope: t === 'photo' ? 'background' : 'all' }));
  };

  const targets = [
    ...(image ? [{ value: 'layer' as const, label: 'Image' }] : []),
    { value: 'photo' as const, label: 'Canvas Photo' },
    { value: 'meme' as const, label: 'Whole Meme' },
  ];

  return (
    <Sheet title="Photo Grading & Effects" badge={preset !== 'original' ? presetLabel(preset) : undefined} onClose={onClose}>
      <Section title="Target" aside={<SegmentedControl ariaLabel="Apply to" variant="divided" value={target} options={targets} onChange={pickTarget} />}>
        <TileGrid>
          {PRESETS.map((p) => (
            <Tile key={p.id} label={p.name} Icon={ICONS[p.id] || Sparkles} active={preset === p.id} onClick={() => applyPreset(p)} />
          ))}
        </TileGrid>
      </Section>
      <Section title="Adjustments" rule>
        {ADJUSTMENTS.map((a) => (
          <Row key={a.key} label={a.label}>
            <Slider label={a.label} min={a.min} max={a.max} value={value(a.key)} onChange={(v) => adjust(a.key, v)} StartIcon={a.StartIcon} EndIcon={a.EndIcon} />
          </Row>
        ))}
      </Section>

      <Section title="Canvas" rule>
        <Row label="Background">
          <SwatchRow ariaLabel="Canvas colour" colors={CANVAS_COLORS} value={canvasBgColor} onChange={actions.handleSetCanvasBgColor} />
        </Row>
        <Row label="Mirror" end>
          <Switch label="Flip Canvas Horizontal" checked={Boolean(canvasFlipX)} onChange={() => actions.handleToggleCanvasFlip()} />
        </Row>
        <Row label="Watermark" end>
          <Switch label="Watermark" checked={Boolean(watermark?.enabled)} onChange={(on) => updateWatermark('enabled', on)} />
        </Row>
        {watermark?.enabled && (
          <div className="ie-subpanel">
            <input
              className="ui-field"
              aria-label="Watermark name"
              placeholder="@username"
              value={(watermark.text || '').replace(/^@/, '')}
              onChange={(e) => {
                const raw = e.target.value.replace(/^@+/, '');
                updateWatermark('text', raw ? `@${raw}` : '');
                if (raw) updateWatermark('imageUrl', null);
              }}
            />
            <Row label="Place">
              <SegmentedControl ariaLabel="Watermark position" variant="fill" value={watermark.position || 'bottom-right'} options={WATERMARK_SPOTS} onChange={(p) => updateWatermark('position', p)} />
            </Row>
            <Row label="Size">
              <Slider label="Watermark size" min={12} max={48} value={watermark.size || 24} onChange={(v) => updateWatermark('size', v)} />
            </Row>
            <Row label="Opacity">
              <Slider label="Watermark opacity" min={0.1} max={1} step={0.05} value={watermark.opacity ?? 0.5} onChange={(v) => updateWatermark('opacity', v)} />
            </Row>
            <Row label="Color">
              <SwatchRow ariaLabel="Watermark colour" colors={['#ffffff', '#000000', '#ff5a36', '#ffd60a']} value={watermark.color || '#ffffff'} onChange={(c) => updateWatermark('color', c)} />
            </Row>
            <TileGrid columns={2}>
              <Tile label={watermark.imageUrl ? 'Change logo' : 'Use a logo'} Icon={ImagePlus} accept="image/*" onFile={actions.handleWatermarkImageUpload} />
              {watermark.imageUrl && <Tile label="Remove logo" Icon={X} onClick={() => updateWatermark('imageUrl', null)} />}
            </TileGrid>
          </div>
        )}
      </Section>
    </Sheet>
  );
}
