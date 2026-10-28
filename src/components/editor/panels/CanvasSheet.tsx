import { ImagePlus, X } from 'lucide-react';
import { Sheet, Section, Row, SwatchRow, Slider, Switch, TileGrid, Tile, SegmentedControl } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';
import type { EditorActions } from './selection';

const CANVAS_COLORS = ['#ffffff', '#000000', '#1e293b', '#ff5a36', '#ffd60a', '#0a84ff', 'transparent'];
const WATERMARK_SPOTS = [
  { value: 'top-left', label: 'Top L' },
  { value: 'top-right', label: 'Top R' },
  { value: 'bottom-left', label: 'Bottom L' },
  { value: 'bottom-right', label: 'Bottom R' },
];

// The Canvas sheet: background colour, mirror, the white bands above and below the meme, watermark.
export default function CanvasSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const canvasBgColor: string = useMemeEditorStore((s: { canvasBgColor: string }) => s.canvasBgColor);
  const canvasFlipX: boolean = useMemeEditorStore((s: { canvasFlipX: boolean }) => s.canvasFlipX);
  const canvasHeader = useMemeEditorStore((s: { canvasHeader: { enabled: boolean } }) => s.canvasHeader);
  const canvasFooter = useMemeEditorStore((s: { canvasFooter: { enabled: boolean } }) => s.canvasFooter);
  const watermark = useEditorUiStore((s: { watermark: Record<string, any> }) => s.watermark);
  const updateWatermark = useEditorUiStore((s: { updateWatermark: (key: string, value: unknown) => void }) => s.updateWatermark);

  return (
    <Sheet title="Canvas" onClose={onClose}>
      <Section>
        <Row label="Background">
          <SwatchRow ariaLabel="Canvas colour" colors={CANVAS_COLORS} value={canvasBgColor} onChange={actions.handleSetCanvasBgColor} />
        </Row>
        <Row label="Mirror" end>
          <Switch label="Flip Canvas Horizontal" checked={Boolean(canvasFlipX)} onChange={() => actions.handleToggleCanvasFlip()} />
        </Row>
        <Row label="Top band" end>
          <Switch label="White band above the meme" checked={Boolean(canvasHeader.enabled)} onChange={() => actions.handleToggleCanvasHeader()} />
        </Row>
        <Row label="Bottom band" end>
          <Switch label="White band below the meme" checked={Boolean(canvasFooter.enabled)} onChange={() => actions.handleToggleCanvasFooter()} />
        </Row>
      </Section>

      <Section title="Watermark" rule aside={<Switch label="Watermark" checked={Boolean(watermark?.enabled)} onChange={(on) => updateWatermark('enabled', on)} />}>
        {watermark?.enabled && (
          <div className="ie-subpanel">
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
            <Row label="Place">
              <SegmentedControl ariaLabel="Watermark position" variant="fill" value={watermark.position || 'bottom-right'} options={WATERMARK_SPOTS} onChange={(p) => updateWatermark('position', p)} />
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
            <TileGrid columns={2}>
              <Tile label={watermark.imageUrl ? 'Change logo' : 'Use a logo'} Icon={ImagePlus} accept="image/*" onFile={actions.handleWatermarkImageUpload} />
              {watermark.imageUrl && <Tile label="Remove logo" Icon={X} onClick={() => updateWatermark('imageUrl', null)} />}
            </TileGrid>
          </div>
        )}
      </Section>
    </Sheet>
  );
}
