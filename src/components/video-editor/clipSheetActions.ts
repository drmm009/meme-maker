// The heading buttons of a video clip's sheets (Sheet's `action`): Crop's and Filters' Reset, Green
// screen's Turn off, Zoom punch's Clear all.
import { Power, RotateCcw, Trash2 } from 'lucide-react';
import { useEditorStore } from '../../store/useVideoEditorStore';
import { FULL_CROP, applyCrop, clipCrop, isCropped } from '../../utils/clipCrop';
import { clipPunchTimes } from '../../utils/zoomPunch';
import type { ChromaKey, ClipCrop, ClipFilter, Placed } from '../../model/videoProject';

type CroppableClip = Placed & { id: string; crop?: ClipCrop | null };

// Crops the clip as it is in the store now (a drag may have ended since the sheet last drew).
export const setClipCrop = (id: string, crop: ClipCrop) => {
  const latest = useEditorStore.getState().items.find((i: { id: string }) => i.id === id) as CroppableClip | undefined;
  if (latest) useEditorStore.getState().updateItem(id, applyCrop(latest, crop));
};

// The whole picture again.
export const cropReset = (item: CroppableClip) => ({
  label: 'Reset',
  Icon: RotateCcw,
  variant: 'plain' as const,
  disabled: !isCropped(clipCrop(item)),
  onClick: () => setClipCrop(item.id, { ...FULL_CROP }),
});

// The untouched video.
export const videoFiltersReset = (item: { id: string; filter?: ClipFilter | null }) => ({
  label: 'Reset',
  Icon: RotateCcw,
  variant: 'plain' as const,
  disabled: !item.filter || !Object.values(item.filter).some(Boolean),
  onClick: () => useEditorStore.getState().updateItem(item.id, { filter: null }),
});

// Green screen off.
export const greenScreenOff = (item: { id: string; chromaKey?: ChromaKey | null }) => ({
  label: 'Turn off',
  Icon: Power,
  variant: 'plain' as const,
  disabled: !item.chromaKey,
  onClick: () => useEditorStore.getState().updateItem(item.id, { chromaKey: null }),
});

// No zoom punches.
export const punchesClear = (item: Parameters<typeof clipPunchTimes>[0] & { id: string }) => ({
  label: 'Clear all',
  Icon: Trash2,
  variant: 'plain' as const,
  disabled: !clipPunchTimes(item).length,
  onClick: () => useEditorStore.getState().updateItem(item.id, { punches: [] }),
});
