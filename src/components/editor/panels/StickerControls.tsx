import { FlipHorizontal } from 'lucide-react';
import { Section, Row, SwatchRow, Slider } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { SHADOW_COLORS } from '../../canvas/draw/layerLook';
import { useSelection } from './selection';
import type { EditorActions } from './selection';

// Minimalist controls for selected sticker / emoji / gif: size bar with flip button, opacity and shadow.
export default function StickerControls({ actions }: { actions: EditorActions }) {
  const patchLayer = useMemeEditorStore((s: { patchLayer: (key: string, id: string, patch: object) => void }) => s.patchLayer);
  const { id, sticker } = useSelection();

  if (!sticker || !id) return null;

  const pct = (v: number) => `${Math.round(v * 100)}%`;

  return (
    <Section>
      <Row label="Size">
        <Slider
          label="Sticker size"
          min={0.3}
          max={6}
          step={0.05}
          value={sticker.scale || 1}
          onChange={(v) => patchLayer('stickers', id, { scale: v })}
          format={(v) => `${Number(v).toFixed(1)}×`}
        />
        <button
          type="button"
          role="switch"
          aria-checked={Boolean(sticker.flipX)}
          aria-label="Flip sticker"
          title="Flip horizontally"
          className={`ie-flip-btn${sticker.flipX ? ' is-active' : ''}`}
          onClick={() => actions.handleFlipActiveLayer()}
        >
          <FlipHorizontal size={15} strokeWidth={2.2} />
          <span>Flip</span>
        </button>
      </Row>
      <Row label="Opacity">
        <Slider
          label="Opacity"
          min={0.1}
          max={1}
          step={0.05}
          value={sticker.opacity ?? 1}
          onChange={(opacity) => patchLayer('stickers', id, { opacity })}
          format={pct}
        />
      </Row>
      <Row label="Shadow">
        <Slider
          label="Shadow size"
          min={0}
          max={40}
          value={sticker.shadowSize || 0}
          onChange={(shadowSize) => patchLayer('stickers', id, { shadowSize })}
          format={(v) => `${Math.round(v)}px`}
        />
      </Row>
      {(sticker.shadowSize || 0) > 0 && (
        <Row label="Color">
          <SwatchRow
            ariaLabel="Shadow colour"
            colors={SHADOW_COLORS}
            value={sticker.shadowColor || '#000000'}
            onChange={(shadowColor) => patchLayer('stickers', id, { shadowColor })}
          />
        </Row>
      )}
    </Section>
  );
}
