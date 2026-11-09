import { Scissors } from 'lucide-react';
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

// A die-cut border's colour and width, in both editors; picking either also switches it on.
export function DieCutControls({ color, width, onChange }: { color: string; width: number; onChange: (patch: { dieCut: true; dieCutColor?: string; dieCutWidth?: number }) => void }) {
  return (
    <>
      <Row label="Color">
        <SwatchRow ariaLabel="Die-cut border colour" colors={DIECUT_COLORS} value={color} onChange={(c) => onChange({ dieCut: true, dieCutColor: c })} />
      </Row>
      <Row label="Width">
        <Slider label="Border width" min={2} max={20} step={1} value={width} onChange={(w) => onChange({ dieCut: true, dieCutWidth: w })} format={(v) => String(Math.round(v))} />
      </Row>
    </>
  );
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
    <Sheet Icon={Scissors}
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
      <DieCutControls color={color} width={width} onChange={(patch) => patchLayer(storeKey, activeId, patch)} />
    </Sheet>
  );
}
