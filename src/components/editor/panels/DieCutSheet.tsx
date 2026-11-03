import { Sheet, Row, SwatchRow, Slider, Switch } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useSelection } from './selection';
import { DIECUT_COLORS } from '../stickerMaker';
import type { EditorActions } from './selection';

interface DieCutItem {
  id?: string;
  dieCut?: boolean;
  dieCutColor?: string;
  dieCutWidth?: number;
  originalUrl?: string | null;
}

// A sticker's die-cut border: the switch beside the heading, then its colour and width (picking
// either also switches it on, so the sheet can be opened just to look).
export default function DieCutSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const { id, kind, sticker, image } = useSelection();
  const patchLayer = useMemeEditorStore((s: { patchLayer: (key: string, id: string, patch: object) => void }) => s.patchLayer);
  const imageLayers: DieCutItem[] = useMemeEditorStore((s: { imageLayers: DieCutItem[] }) => s.imageLayers);

  const isSticker = kind === 'sticker' && Boolean(sticker);
  const isImage = kind === 'image' && Boolean(image);
  const fallbackImage = !id && imageLayers.length > 0 ? (imageLayers.find((l) => Boolean(l.originalUrl)) || imageLayers[0]) : null;
  const activeItem = isSticker ? sticker : isImage ? image : fallbackImage;
  const activeId = id || fallbackImage?.id;
  const storeKey = isSticker ? 'stickers' : 'imageLayers';

  if (!activeId || !activeItem) return null;

  const isDieCut = Boolean(activeItem.dieCut);
  const color = typeof activeItem.dieCutColor === 'string' ? activeItem.dieCutColor : '#ffffff';
  const width = typeof activeItem.dieCutWidth === 'number' ? activeItem.dieCutWidth : 6;

  return (
    <Sheet
      className="ie-diecut-sheet ie-tool-sheet"
      title="Die-cut"
      aside={
        <Switch
          label="Die-cut border"
          checked={isDieCut}
          onChange={() => {
            if (id) actions.handleToggleDieCutSticker();
            else patchLayer(storeKey, activeId, { dieCut: !isDieCut });
          }}
        />
      }
      onClose={onClose}
    >
      <Row label="Color">
        <SwatchRow
          ariaLabel="Die-cut border colour"
          colors={DIECUT_COLORS}
          value={color}
          // A colour or width also switches the border on.
          onChange={(c) => patchLayer(storeKey, activeId, { dieCut: true, dieCutColor: c })}
        />
      </Row>
      <Row label="Width">
        <Slider
          label="Border width"
          min={2}
          max={20}
          step={1}
          value={width}
          onChange={(w) => patchLayer(storeKey, activeId, { dieCut: true, dieCutWidth: w })}
          format={(v) => String(Math.round(v))}
        />
      </Row>
    </Sheet>
  );
}
