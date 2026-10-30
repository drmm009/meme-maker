import { ImagePlus, X, ArrowUpLeft, ArrowUpRight, ArrowDownLeft, ArrowDownRight } from 'lucide-react';
import { Sheet, Section, Row, SwatchRow, Slider, Switch, TileGrid, Tile, SegmentedControl } from '../../ui';
import { useEditorUiStore } from '../store/useEditorUiStore';
import type { EditorActions } from './selection';

const SPOTS = [
  { value: 'top-left', label: 'Top left', Icon: ArrowUpLeft },
  { value: 'top-right', label: 'Top right', Icon: ArrowUpRight },
  { value: 'bottom-left', label: 'Bottom left', Icon: ArrowDownLeft },
  { value: 'bottom-right', label: 'Bottom right', Icon: ArrowDownRight },
];

// The Canvas strip's Watermark: your @name or a logo, its corner, size, opacity and colour.
// Remembered between sessions (the UI store saves it).
export default function WatermarkSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const watermark = useEditorUiStore((s: { watermark: Record<string, any> }) => s.watermark);
  const updateWatermark = useEditorUiStore((s: { updateWatermark: (key: string, value: unknown) => void }) => s.updateWatermark);

  return (
    <Sheet title="Watermark" hideTitle onClose={onClose}>
      <Section>
        <Row label="Show" end>
          <Switch label="Watermark" checked={Boolean(watermark?.enabled)} onChange={(on) => updateWatermark('enabled', on)} />
        </Row>
      </Section>
      {watermark?.enabled && (
        <>
          <Section rule>
            <input
              className="ui-field"
              aria-label="Watermark name"
              placeholder="@username"
              value={(watermark.text || '').replace(/^@/, '')}
              onChange={(e) => {
                const raw = e.target.value.replace(/^@+/, '');
                updateWatermark('text', raw ? `@${raw}` : '');
                if (raw) updateWatermark('imageUrl', null);
              }}
            />
          </Section>
          <Section>
            <Row label="Place">
              <SegmentedControl ariaLabel="Watermark position" variant="fill" value={watermark.position || 'bottom-right'} options={SPOTS} onChange={(p) => updateWatermark('position', p)} />
            </Row>
            <Row label="Size">
              <Slider label="Watermark size" min={12} max={48} value={watermark.size || 24} onChange={(v) => updateWatermark('size', v)} />
            </Row>
            <Row label="Opacity">
              <Slider label="Watermark opacity" min={0.1} max={1} step={0.05} value={watermark.opacity ?? 0.5} onChange={(v) => updateWatermark('opacity', v)} />
            </Row>
            <Row label="Color">
              <SwatchRow ariaLabel="Watermark colour" colors={['#ffffff', '#000000', '#ff5a36', '#ffd60a']} value={watermark.color || '#ffffff'} onChange={(c) => updateWatermark('color', c)} />
            </Row>
          </Section>
          <Section>
            <TileGrid columns={2}>
              <Tile label={watermark.imageUrl ? 'Change logo' : 'Use a logo'} Icon={ImagePlus} accept="image/*" onFile={actions.handleWatermarkImageUpload} />
              {watermark.imageUrl && <Tile label="Remove logo" Icon={X} onClick={() => updateWatermark('imageUrl', null)} />}
            </TileGrid>
          </Section>
        </>
      )}
    </Sheet>
  );
}
