import { Sheet, Section, Row, SwatchRow, Slider, Switch } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useSelection } from './selection';
import type { EditorActions } from './selection';

const DIECUT_COLORS = [
  '#ffffff',
  '#000000',
  '#ffd60a',
  '#ff5a36',
  '#34c759',
  '#0a84ff',
  '#bf5af2',
  '#ff375f',
];

// Die-cut border customization: toggle border, change outline colour, and adjust border thickness.
export default function DieCutSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const { id, kind, sticker, image } = useSelection();
  const patchLayer = useMemeEditorStore((s: { patchLayer: (key: string, id: string, patch: object) => void }) => s.patchLayer);

  const isSticker = kind === 'sticker' && Boolean(sticker);
  const isImage = kind === 'image' && Boolean(image);
  const activeItem = isSticker ? sticker : isImage ? image : null;
  const storeKey = isSticker ? 'stickers' : 'imageLayers';

  if (!id || !activeItem) return null;

  const isDieCut = Boolean(activeItem.dieCut);
  const color = typeof activeItem.dieCutColor === 'string' ? activeItem.dieCutColor : '#ffffff';
  const width = typeof activeItem.dieCutWidth === 'number' ? activeItem.dieCutWidth : 6;

  return (
    <Sheet className="ie-diecut-sheet" title="Die-cut" hideTitle onClose={onClose}>
      <Section
        title="Die-cut border"
        aside={
          <Switch
            label="Die-cut border"
            checked={isDieCut}
            onChange={() => actions.handleToggleDieCutSticker()}
          />
        }
      >
        <Row label="Color">
          <SwatchRow
            ariaLabel="Die-cut border colour"
            colors={DIECUT_COLORS}
            value={color}
            onChange={(c) => {
              if (!isDieCut) actions.handleToggleDieCutSticker(c);
              else actions.handleSetDieCutColor(c);
            }}
          />
        </Row>
        <Row label="Border width">
          <Slider
            label="Border width"
            min={2}
            max={20}
            step={1}
            value={width}
            onChange={(w) => {
              if (!isDieCut) actions.handleToggleDieCutSticker();
              patchLayer(storeKey, id, { dieCutWidth: w });
            }}
            format={(v) => `${Math.round(v)}px`}
          />
        </Row>
      </Section>
    </Sheet>
  );
}
