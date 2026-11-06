// The heading buttons of a video clip's Crop and Filters sheets (Sheet's `action`): Reset.
import { RotateCcw } from 'lucide-react';
import { useEditorStore } from '../../store/useVideoEditorStore';
import { FULL_CROP, applyCrop, clipCrop, isCropped } from '../../utils/clipCrop';
import type { ClipCrop, ClipFilter, Placed } from '../../model/videoProject';

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
