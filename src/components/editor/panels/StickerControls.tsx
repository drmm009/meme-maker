import { FlipHorizontal } from 'lucide-react';
import { Row, SwatchRow, Slider } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { SHADOW_COLORS } from '../../canvas/draw/layerLook';
import { useSelection } from './selection';
import type { EditorActions } from './selection';

// Flip for the Sticker sheet's header: a small pill, orange while the sticker is mirrored.
export function FlipPill({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label="Flip sticker"
      title="Flip left to right"
      className={`ie-flip-pill${on ? ' is-on' : ''}`}
      onClick={onToggle}
    >
      <FlipHorizontal size={14} strokeWidth={2.2} aria-hidden="true" />
      Flip
    </button>
  );
}

export function StickerFlip({ actions }: { actions: EditorActions }) {
  const { sticker } = useSelection();
  if (!sticker) return null;
  return <FlipPill on={Boolean(sticker.flipX)} onToggle={() => actions.handleFlipActiveLayer()} />;
}

export interface StickerSize {
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}

interface StickerLookPatch {
  opacity?: number;
  shadowSize?: number;
  shadowColor?: string;
}

interface StickerEditProps {
  size: StickerSize;
  opacity?: number;
  shadowSize?: number;
  shadowColor?: string;
  set: (patch: StickerLookPatch) => void;
  // A GIF has no shadow (in the video editor).
  shadow?: boolean;
}

// A sticker's Edit, in both editors: size on its own line, then opacity and shadow side by side,
// and the shadow's colour once there is one. Flip is in the header (FlipPill).
export function StickerEditControls({ size, opacity, shadowSize = 0, shadowColor, set, shadow = true }: StickerEditProps) {
  return (
    <>
      <Row label="Size">
        <Slider label="Sticker size" min={size.min} max={size.max} step={size.step} value={size.value} onChange={size.onChange} format={size.format} />
      </Row>
      <div className="ie-adjust-grid">
        <div className="ie-adjust-item">
          <span className="ui-row-label">Opacity</span>
          <Slider label="Opacity" min={0.1} max={1} step={0.05} value={opacity ?? 1} onChange={(v) => set({ opacity: v })} format={(v) => `${Math.round(v * 100)}%`} />
        </div>
        {shadow && (
          <div className="ie-adjust-item">
            <span className="ui-row-label">Shadow</span>
            <Slider label="Shadow size" min={0} max={40} value={shadowSize} onChange={(v) => set({ shadowSize: v })} format={(v) => String(Math.round(v))} />
          </div>
        )}
      </div>
      {shadow && shadowSize > 0 && (
        <Row label="Shadow">
          <SwatchRow ariaLabel="Shadow colour" colors={SHADOW_COLORS} value={shadowColor || '#000000'} onChange={(c) => set({ shadowColor: c })} />
        </Row>
      )}
    </>
  );
}

// The image editor's selected sticker, emoji or GIF (its floating bar's Edit).
export default function StickerControls() {
  const patchLayer = useMemeEditorStore((s: { patchLayer: (key: string, id: string, patch: object) => void }) => s.patchLayer);
  const { id, sticker } = useSelection();

  if (!sticker || !id) return null;

  const set = (patch: object) => patchLayer('stickers', id, patch);

  return (
    <StickerEditControls
      size={{ value: sticker.scale || 1, min: 0.3, max: 6, step: 0.05, format: (v) => `${Number(v).toFixed(1)}×`, onChange: (scale) => set({ scale }) }}
      opacity={sticker.opacity}
      shadowSize={sticker.shadowSize}
      shadowColor={sticker.shadowColor}
      set={set}
    />
  );
}
