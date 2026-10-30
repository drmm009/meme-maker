import { Section, Row, ChipRow, Chip, SwatchRow, Slider, Switch } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { BLEND_MODES, SHADOW_COLORS } from '../../canvas/draw/layerLook';
import type { BlendMode, LayerLook } from '../../canvas/draw/layerLook';

type LookLayer = LayerLook & { flipY?: boolean; opacity?: number };

// How the selected sticker sits on the meme, in the Media sheet: upside down, opacity, blend mode
// and shadow (canvas/draw/layerLook). A photo's look is in the Media sheet's compact More layout.
export default function LayerLookControls({ id, layer }: { id: string; layer: LookLayer }) {
  const patchLayer = useMemeEditorStore((s: { patchLayer: (key: string, id: string, patch: object) => void }) => s.patchLayer);
  const set = (patch: Partial<LookLayer>) => patchLayer('stickers', id, patch);
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
    </Section>
  );
}
