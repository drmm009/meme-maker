import { Crop, FlipHorizontal, FlipVertical, ImageUp, Copy } from 'lucide-react';
import { Sheet, Section, Row, ChipRow, Chip, TileGrid, Tile, Slider, SwatchRow } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { useSelection } from './selection';
import type { EditorActions } from './selection';
import type { MemeImageLayer } from '../../../model/memeDocument';
import StickerControls, { StickerFlip } from './StickerControls';
import type { MemeSticker } from '../../../model/memeDocument';
import { COLOR_SWATCHES } from '../../../utils/captionLayout';
import { SHADOW_COLORS } from '../../canvas/draw/layerLook';

const pct = (v: number) => `${Math.round(v * 100)}%`;

// The Media sheet, under the Media strip (which adds photos, templates, stickers and emoji). For a
// selected image (its floating bar's More) it is the compact Photo sheet: mirror, flip upside down,
// copy, replace and crop (the photo cropper, as for the main photo) as tiles, then opacity, corners, border and shadow two to a line; filters,
// background, face swap, layers and delete are on the floating bar. For a sticker (its bar's Edit) it is
// the Sticker sheet: Flip in the header, then size, opacity and shadow (StickerControls).
export default function MediaSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const imageLayers: MemeImageLayer[] = useMemeEditorStore((s: { imageLayers: MemeImageLayer[] }) => s.imageLayers || []);
  const setActiveLayerId = useMemeEditorStore((s: { setActiveLayerId: (id: string | null) => void }) => s.setActiveLayerId);
  const stickers: MemeSticker[] = useMemeEditorStore((s: { stickers: MemeSticker[] }) => s.stickers);
  const patchLayer = useMemeEditorStore((s: { patchLayer: (key: string, id: string, patch: object) => void }) => s.patchLayer);
  const setCropLayerId = useEditorUiStore((s: { setCropLayerId: (id: string | null) => void }) => s.setCropLayerId);
  const { id, image, sticker } = useSelection();
  const setImage = (patch: Partial<MemeImageLayer>) => id && patchLayer('imageLayers', id, patch);

  return (
    <Sheet
      className={`ie-media-sheet${sticker ? ' ie-sticker-sheet ie-tool-sheet' : ''}${image ? ' ie-photo-sheet ie-tool-sheet' : ''}`}
      title={image ? 'Photo' : sticker ? 'Sticker' : 'Media'}
      hideTitle={!image && !sticker}
      aside={sticker ? <StickerFlip actions={actions} /> : undefined}
      onClose={onClose}
    >
      {imageLayers.length + stickers.length === 0 && <p className="ie-empty">No photos or stickers yet. Add one from the strip above.</p>}

      {!image && !sticker && imageLayers.length + stickers.length > 0 && (
        <Section title="On the meme">
          <ChipRow ariaLabel="Images and stickers">
            {imageLayers.map((l, i) => <Chip key={l.id} label={l.layerName?.trim() || `Image ${i + 1}`} active={l.id === id} onClick={() => setActiveLayerId(l.id)} />)}
            {stickers.map((s) => <Chip key={s.id} label={s.layerName?.trim() || s.emoji || s.name || 'Sticker'} active={s.id === id} onClick={() => setActiveLayerId(s.id)} />)}
          </ChipRow>
        </Section>
      )}

      {sticker && <StickerControls />}

      {image && id && (
        <>
          <Section>
            <TileGrid columns={5}>
              <Tile label="Mirror" title="Flip left to right" Icon={FlipHorizontal} active={Boolean(image.flipX)} onClick={() => actions.handleFlipActiveLayer()} />
              <Tile label="Flip" title="Flip upside down" Icon={FlipVertical} active={Boolean(image.flipY)} onClick={() => setImage({ flipY: !image.flipY })} />
              <Tile label="Copy" Icon={Copy} title="Duplicate" onClick={() => actions.handleDuplicateLayer(id)} />
              <Tile label="Replace" Icon={ImageUp} title="Use another picture here" accept="image/*" onFile={actions.handleReplaceImageLayer} />
              <Tile label="Crop" title="Crop or turn the photo" Icon={Crop} onClick={() => setCropLayerId(id)} />
            </TileGrid>
          </Section>
          {/* The look, two sliders to a line; a colour row follows the border or shadow once there is one. */}
          <div className="ie-adjust-grid">
            <div className="ie-adjust-item">
              <span className="ui-row-label">Opacity</span>
              <Slider label="Opacity" min={0.1} max={1} step={0.05} value={image.opacity ?? 1} onChange={(opacity) => setImage({ opacity })} format={pct} />
            </div>
            <div className="ie-adjust-item">
              <span className="ui-row-label">Corners</span>
              <Slider label="Corner rounding" min={0} max={1} step={0.05} value={image.cornerRadius || 0} onChange={(cornerRadius) => setImage({ cornerRadius })} format={pct} />
            </div>
            <div className="ie-adjust-item">
              <span className="ui-row-label">Border</span>
              <Slider label="Border width" min={0} max={30} value={image.borderWidth || 0} onChange={(borderWidth) => setImage({ borderWidth })} format={String} />
            </div>
            <div className="ie-adjust-item">
              <span className="ui-row-label">Shadow</span>
              <Slider label="Shadow size" min={0} max={40} value={image.shadowSize || 0} onChange={(shadowSize) => setImage({ shadowSize })} format={String} />
            </div>
          </div>
          {(image.borderWidth || 0) > 0 && (
            <Row label="Border">
              <SwatchRow ariaLabel="Border colour" colors={COLOR_SWATCHES} value={image.borderColor || '#ffffff'} onChange={(borderColor) => setImage({ borderColor })} />
            </Row>
          )}
          {(image.shadowSize || 0) > 0 && (
            <Row label="Shadow">
              <SwatchRow ariaLabel="Shadow colour" colors={SHADOW_COLORS} value={image.shadowColor || '#000000'} onChange={(shadowColor) => setImage({ shadowColor })} />
            </Row>
          )}
        </>
      )}
    </Sheet>
  );
}
