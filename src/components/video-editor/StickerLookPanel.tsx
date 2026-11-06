import { FlipPill, StickerEditControls } from '../editor/panels/StickerControls';
import { DieCutControls } from '../editor/panels/DieCutSheet';
import { Switch } from '../ui';
import { useEditorStore } from '../../store/useVideoEditorStore';
import { resizeAboutCenter } from './preview/previewMath';
import { DEFAULT_DIECUT_WIDTH, isGifSticker } from '../../utils/stickerLook';
import type { StickerClip } from '../../model/videoProject';
import { STAGE_WIDTH } from '../../utils/textBitmap';
import '../editor/panels/panels.css';

// A sticker's Edit and Die-cut sheets: the image editor's sticker controls (editor/panels/
// StickerControls, DieCutSheet) inside the classes that style them there, saving to the clip. Its
// look is drawn by utils/stickerLook.
const update = (id: string, patch: Partial<StickerClip>) => useEditorStore.getState().updateItem(id, patch);

// Size: how much of the stage's width it takes, resized about its centre.
export function StickerEditPanel({ item }: { item: StickerClip }) {
  const shown = ((item.width || 200) * (item.scaleX || 1)) / STAGE_WIDTH;
  return (
    <div className="ie-panels--sheet vt-ie-look">
      <div className="ie-sticker-sheet ie-tool-sheet">
        <StickerEditControls
          size={{
            value: Math.min(1, Math.max(0.05, shown)),
            min: 0.05,
            max: 1,
            step: 0.01,
            format: (v) => `${Math.round(v * 100)}%`,
            onChange: (v) => update(item.id, resizeAboutCenter(item, v * STAGE_WIDTH)),
          }}
          opacity={item.opacity}
          shadowSize={item.shadowSize}
          shadowColor={item.shadowColor}
          set={(patch) => update(item.id, patch)}
          shadow={!isGifSticker(item)}
        />
      </div>
    </div>
  );
}

export const StickerFlipAside = ({ item }: { item: StickerClip }) => (
  <FlipPill on={Boolean(item.flipX)} onToggle={() => update(item.id, { flipX: !item.flipX })} />
);

export function StickerDieCutPanel({ item }: { item: StickerClip }) {
  return (
    <div className="ie-panels--sheet vt-ie-look">
      <div className="ie-diecut-sheet ie-tool-sheet">
        <DieCutControls
          color={item.dieCutColor || '#ffffff'}
          width={item.dieCutWidth ?? DEFAULT_DIECUT_WIDTH}
          onChange={(patch) => update(item.id, patch)}
        />
      </div>
    </div>
  );
}

export const StickerDieCutAside = ({ item }: { item: StickerClip }) => (
  <Switch label="Die-cut border" checked={Boolean(item.dieCut)} onChange={() => update(item.id, { dieCut: !item.dieCut })} />
);
