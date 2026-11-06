// A photo's Filters sheet, beyond its controls (PhotoLookPanel): each adjustment's value, whether
// the photo is filtered (its tool lit), and the sheet's Reset.
import { RotateCcw } from 'lucide-react';
import { adjustmentBase, filtersChanged } from '../editor/panels/filterAdjustments';
import { useEditorStore } from '../../store/useVideoEditorStore';
import type { ImageClip } from '../../model/videoProject';

type Filtered = Pick<ImageClip, 'id' | 'filters' | 'filterId'>;

export const filterValueOf = (item: Filtered) => (key: string): number => Number(item.filters?.[key] ?? adjustmentBase(key));

export const photoFiltered = (item: Filtered): boolean => filtersChanged(item.filterId || 'original', filterValueOf(item));

// Back to the untouched photo.
export const photoFiltersReset = (item: Filtered) => ({
  label: 'Reset',
  Icon: RotateCcw,
  variant: 'plain' as const,
  disabled: !photoFiltered(item),
  onClick: () => useEditorStore.getState().updateItem(item.id, { filterId: null, filters: null }),
});
