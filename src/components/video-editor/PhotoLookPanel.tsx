import type { ChangeEvent } from 'react';
import { PhotoLookControls, PhotoTiles } from '../editor/panels/PhotoControls';
import { BackgroundControls } from '../editor/panels/BackgroundSheet';
import FilterControls from '../editor/panels/FilterControls';
import { PRESETS } from '../editor/panels/filterAdjustments';
import { filterValueOf } from './photoFilters';
import { useEditorStore } from '../../store/useVideoEditorStore';
import { CUTTING_OUT, FINDING_SUBJECT, toggleBackgroundBlur, toggleCutOut } from './clipJobs';
import type { ImageClip } from '../../model/videoProject';
import '../editor/panels/panels.css';

// A photo's More, Background and Filters sheets: the image editor's photo controls (editor/panels/
// PhotoControls, BackgroundSheet, FilterControls) inside the classes that style them there, saving
// to the clip. Its look is drawn by utils/photoLook.
const update = (id: string, patch: Partial<ImageClip>) => useEditorStore.getState().updateItem(id, patch);

// Another picture in the photo's place: as wide on the stage, its height by its own shape, about the
// same centre; what was made from the old picture (crop, cut out, subject, face swap) goes.
async function replacePhoto(item: ImageClip, e: ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (!file) return;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src = url;
  try {
    await img.decode();
  } catch {
    URL.revokeObjectURL(url);
    return;
  }
  const width = item.width || 200;
  const height = (width * img.naturalHeight) / (img.naturalWidth || 1);
  const grow = (height - (item.height || 200)) * (item.scaleY || 1);
  const a = ((item.rotation || 0) * Math.PI) / 180;
  update(item.id, {
    url, height, name: file.name,
    // The corner moves up by half the growth, along the clip's rotation.
    x: (item.x || 0) + (grow / 2) * Math.sin(a),
    y: (item.y || 0) - (grow / 2) * Math.cos(a),
    crop: null, originalUrl: null, faceSwapOf: null, subjectUrl: null, subjectOf: null, bgBlur: 0,
  });
}

// More: mirror, flip, copy, replace and crop, then opacity, corners, border and shadow.
export function PhotoMorePanel({ item, onOpen }: { item: ImageClip; onOpen: (sheet: string) => void }) {
  return (
    <div className="ie-panels--sheet vt-ie-look">
      <div className="ie-photo-sheet ie-tool-sheet">
        <PhotoTiles
          flipX={item.flipX}
          flipY={item.flipY}
          onMirror={() => update(item.id, { flipX: !item.flipX })}
          onFlip={() => update(item.id, { flipY: !item.flipY })}
          onCopy={() => useEditorStore.getState().duplicateItem(item.id)}
          onReplace={(e) => replacePhoto(item, e)}
          onCrop={() => onOpen('crop')}
        />
        <PhotoLookControls look={item} set={(patch) => update(item.id, patch)} />
      </div>
    </div>
  );
}

// Background: blur behind the subject, or cut the subject out.
export function PhotoBackgroundPanel({ item }: { item: ImageClip }) {
  const busy = useEditorStore((s: { busy: string | null }) => s.busy);
  return (
    <div className="ie-panels--sheet vt-ie-look">
      <div className="ie-background-sheet ie-tool-sheet">
        <BackgroundControls
          blur={item.bgBlur || 0}
          blurring={busy === FINDING_SUBJECT}
          removed={Boolean(item.originalUrl)}
          removing={busy === CUTTING_OUT}
          onToggleBlur={() => toggleBackgroundBlur(item)}
          onBlur={(bgBlur) => update(item.id, { bgBlur })}
          onToggleRemove={() => toggleCutOut(item)}
        />
      </div>
    </div>
  );
}

// Filters: a preset, or adjustments on top of it (moving one keeps the preset's name).
export function PhotoFiltersPanel({ item }: { item: ImageClip }) {
  return (
    <div className="ie-panels--sheet vt-ie-look">
      <div className="ie-filters-sheet ie-tool-sheet">
        <FilterControls
          src={item.url}
          preset={item.filterId || 'original'}
          value={filterValueOf(item)}
          onPreset={(p) => update(item.id, { filterId: p.id, filters: p.values })}
          onAdjust={(key, v) => update(item.id, { filters: { ...PRESETS[0].values, ...item.filters, [key]: v } })}
        />
      </div>
    </div>
  );
}
