import { FlipHorizontal } from 'lucide-react';
import { Row, SwatchRow, Slider } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { SHADOW_COLORS } from '../../canvas/draw/layerLook';
import { useSelection } from './selection';
import type { EditorActions } from './selection';

// Flip for the Sticker sheet's header: a small pill, orange while the sticker is mirrored.
export function StickerFlip({ actions }: { actions: EditorActions }) {
  const { sticker } = useSelection();
  if (!sticker) return null;
  const on = Boolean(sticker.flipX);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label="Flip sticker"
      title="Flip left to right"
      className={`ie-flip-pill${on ? ' is-on' : ''}`}
      onClick={() => actions.handleFlipActiveLayer()}
    >
      <FlipHorizontal size={14} strokeWidth={2.2} aria-hidden="true" />
      Flip
    </button>
  );
}

// The selected sticker, emoji or GIF (its floating bar's Edit): size on its own line, then opacity
// and shadow side by side, and the shadow's colour once there is one. Flip is in the header.
export default function StickerControls() {
  const patchLayer = useMemeEditorStore((s: { patchLayer: (key: string, id: string, patch: object) => void }) => s.patchLayer);
  const { id, sticker } = useSelection();

  if (!sticker || !id) return null;

  const set = (patch: object) => patchLayer('stickers', id, patch);

  return (
    <>
      <Row label="Size">
        <Slider label="Sticker size" min={0.3} max={6} step={0.05} value={sticker.scale || 1} onChange={(scale) => set({ scale })} format={(v) => `${Number(v).toFixed(1)}×`} />
      </Row>
      <div className="ie-adjust-grid">
        <div className="ie-adjust-item">
          <span className="ui-row-label">Opacity</span>
          <Slider label="Opacity" min={0.1} max={1} step={0.05} value={sticker.opacity ?? 1} onChange={(opacity) => set({ opacity })} format={(v) => `${Math.round(v * 100)}%`} />
        </div>
        <div className="ie-adjust-item">
          <span className="ui-row-label">Shadow</span>
          <Slider label="Shadow size" min={0} max={40} value={sticker.shadowSize || 0} onChange={(shadowSize) => set({ shadowSize })} format={(v) => String(Math.round(v))} />
        </div>
      </div>
      {(sticker.shadowSize || 0) > 0 && (
        <Row label="Shadow">
          <SwatchRow ariaLabel="Shadow colour" colors={SHADOW_COLORS} value={sticker.shadowColor || '#000000'} onChange={(shadowColor) => set({ shadowColor })} />
        </Row>
      )}
    </>
  );
}
