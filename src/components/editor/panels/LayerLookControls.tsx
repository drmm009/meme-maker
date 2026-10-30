import { Section, Row, ChipRow, Chip, SwatchRow, Slider, Switch } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { COLOR_SWATCHES } from '../../../utils/captionLayout';
import { BLEND_MODES } from '../../canvas/draw/layerLook';
import type { BlendMode, LayerLook } from '../../canvas/draw/layerLook';

const SHADOW_COLORS = ['#000000', '#1e1b4b', '#7f1d1d', '#ffffff', '#ff2a5f', '#00f0ff'];

type LookLayer = LayerLook & { flipY?: boolean; opacity?: number; keepShape?: boolean };

// How the selected photo or sticker sits on the meme, in the Media sheet: upside down, opacity,
// blend mode and shadow; photos also get rounded corners and a border (canvas/draw/layerLook).
export default function LayerLookControls({ id, layer, kind }: { id: string; layer: LookLayer; kind: 'image' | 'sticker' }) {
  const patchLayer = useMemeEditorStore((s: { patchLayer: (key: string, id: string, patch: object) => void }) => s.patchLayer);
  const set = (patch: Partial<LookLayer>) => patchLayer(kind === 'image' ? 'imageLayers' : 'stickers', id, patch);
  const pct = (v: number) => `${Math.round(v * 100)}%`;

  return (
    <Section title="Look" rule>
      <Row label="Upside down" end>
        <Switch label="Flip upside down" checked={Boolean(layer.flipY)} onChange={(flipY) => set({ flipY })} />
      </Row>
      <Row label="Opacity">
        <Slider label="Opacity" min={0.1} max={1} step={0.05} value={layer.opacity ?? 1} onChange={(opacity) => set({ opacity })} format={pct} />
      </Row>
      <ChipRow ariaLabel="Blend mode">
        {BLEND_MODES.map((m) => (
          <Chip key={m.value} label={m.label} active={(layer.blend || 'normal') === m.value} onClick={() => set({ blend: m.value as BlendMode })} />
        ))}
      </ChipRow>
      <Row label="Shadow">
        <Slider label="Shadow size" min={0} max={40} value={layer.shadowSize || 0} onChange={(shadowSize) => set({ shadowSize })} />
      </Row>
      {(layer.shadowSize || 0) > 0 && (
        <Row label="Color">
          <SwatchRow ariaLabel="Shadow colour" colors={SHADOW_COLORS} value={layer.shadowColor || '#000000'} onChange={(shadowColor) => set({ shadowColor })} />
        </Row>
      )}
      {kind === 'image' && (
        <>
          <Row label="Keep shape" end>
            <Switch label="Keep shape when resizing" checked={Boolean(layer.keepShape)} onChange={(keepShape) => set({ keepShape })} />
          </Row>
          <Row label="Corners">
            <Slider label="Corner rounding" min={0} max={1} step={0.05} value={layer.cornerRadius || 0} onChange={(cornerRadius) => set({ cornerRadius })} format={pct} />
          </Row>
          <Row label="Border">
            <Slider label="Border width" min={0} max={30} value={layer.borderWidth || 0} onChange={(borderWidth) => set({ borderWidth })} />
          </Row>
          {(layer.borderWidth || 0) > 0 && (
            <Row label="Color">
              <SwatchRow ariaLabel="Border colour" colors={COLOR_SWATCHES} value={layer.borderColor || '#ffffff'} onChange={(borderColor) => set({ borderColor })} />
            </Row>
          )}
        </>
      )}
    </Section>
  );
}
