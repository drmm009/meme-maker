import { useEffect, useRef } from 'react';
import { Section, Row, SwatchRow, Slider, Switch } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { COLOR_SWATCHES } from '../../../utils/captionLayout';
import { useSelection } from './selection';
import type { EditorActions } from './selection';
import LayerActions from './LayerActions';

// The selected sticker's controls, in the Media sheet: size, flip, die-cut and its border colour.
export default function StickerControls({ actions }: { actions: EditorActions }) {
  const patchLayer = useMemeEditorStore((s: { patchLayer: (key: string, id: string, patch: object) => void }) => s.patchLayer);
  const sheetFocus: string | null = useEditorUiStore((s: { sheetFocus: string | null }) => s.sheetFocus);
  const { id, sticker } = useSelection();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sheetFocus === 'size') ref.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
  }, [sheetFocus, id]);

  if (!sticker || !id) return null;
  return (
    <div ref={ref}>
      <Section title="Selected sticker" id="size" rule>
        <Row label="Size">
          <Slider label="Sticker size" min={0.3} max={6} step={0.05} value={sticker.scale || 1} onChange={(v) => patchLayer('stickers', id, { scale: v })} />
        </Row>
        <Row label="Flip" end>
          <Switch label="Flip sticker" checked={Boolean(sticker.flipX)} onChange={() => actions.handleFlipActiveLayer()} />
        </Row>
        <Row label="Die-cut" end>
          <Switch label="Die-cut border" checked={Boolean(sticker.dieCut)} onChange={() => actions.handleToggleDieCutSticker()} />
        </Row>
        {sticker.dieCut && (
          <Row label="Border">
            <SwatchRow ariaLabel="Die-cut border colour" colors={COLOR_SWATCHES} value={sticker.dieCutColor || '#ffffff'} onChange={(c) => actions.handleSetDieCutColor(c)} />
          </Row>
        )}
      </Section>
      <LayerActions id={id} actions={actions} />
    </div>
  );
}
