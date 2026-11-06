import { RotateCcw } from 'lucide-react';
import { Sheet } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import FilterControls, { SAMPLE_IMAGE } from './FilterControls';
import { ADJUSTMENTS, PRESETS, adjustmentBase, filtersChanged } from './filterAdjustments';
import type { FilterPreset } from './filterAdjustments';
import { useSelection } from './selection';
import type { EditorActions } from './selection';

type FilterValues = Record<string, unknown>;

// The AI strip's Filters, for the selected image or else the meme: Presets (a photo of
// each look) or Adjust (brightness, contrast..., two to a line), and Reset in the header to go back
// to the untouched photo.
export default function FiltersSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const imageFilters: FilterValues = useMemeEditorStore((s: { imageFilters: FilterValues }) => s.imageFilters) || {};
  const setImageFilters = useMemeEditorStore((s: { setImageFilters: (fn: (prev: FilterValues) => FilterValues) => void }) => s.setImageFilters);
  const patchLayer = useMemeEditorStore((s: { patchLayer: (key: string, id: string, patch: object) => void }) => s.patchLayer);
  const pushHistoryDebounced = useMemeEditorStore((s: { pushHistoryDebounced: () => void }) => s.pushHistoryDebounced);
  const activeTemplate = useMemeEditorStore((s: { activeTemplate?: { imageUrl?: string; url?: string; rawImageUrl?: string; mediaType?: string; type?: string } | null }) => s.activeTemplate);
  const { id, image } = useSelection();
  const onLayer = Boolean(image && id);

  // Use the active photo or template image if available; otherwise use the colorful sample image
  const templatePhoto = activeTemplate?.type !== 'video' && activeTemplate?.mediaType !== 'video'
    ? (activeTemplate?.imageUrl || activeTemplate?.url || activeTemplate?.rawImageUrl)
    : null;
  const previewSrc = (onLayer && image?.url) || templatePhoto || SAMPLE_IMAGE;

  const layerValues = (image?.filters && typeof image.filters === 'object' ? image.filters : {}) as Record<string, number>;
  const preset = onLayer ? String(image?.filterId || 'original') : String(imageFilters.preset || 'original');
  const value = (key: string) => Number((onLayer ? layerValues[key] : imageFilters[key]) ?? (key === 'saturation' ? imageFilters.saturate ?? 100 : adjustmentBase(key)));

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

  // Back to the untouched photo: the Original preset and every adjustment at its base.
  const bases = Object.fromEntries(ADJUSTMENTS.map((a) => [a.key, a.base]));
  const reset = () => {
    const original = PRESETS[0];
    if (onLayer) actions.updateActiveImageLayer({ filterId: original.id, filter: original.filterString, filters: original.values });
    else {
      setImageFilters((prev: FilterValues) => ({ ...prev, ...bases, preset: original.id, filterString: original.filterString, ...original.values }));
      pushHistoryDebounced();
    }
  };
  const changed = filtersChanged(preset, value);

  return (
    <Sheet
      className="ie-filters-sheet ie-tool-sheet"
      title="Filters"
      onClose={onClose}
      action={{ label: 'Reset', Icon: RotateCcw, variant: 'plain', disabled: !changed, onClick: reset }}
    >
      <FilterControls src={previewSrc} preset={preset} value={value} onPreset={applyPreset} onAdjust={adjust} />
    </Sheet>
  );
}
