import type { ChangeEvent } from 'react';
import { Crop, FlipHorizontal, FlipVertical, ImageUp, Copy } from 'lucide-react';
import { Section, Row, TileGrid, Tile, Slider, SwatchRow } from '../../ui';
import { COLOR_SWATCHES } from '../../../utils/captionLayout';
import { SHADOW_COLORS } from '../../canvas/draw/layerLook';

const pct = (v: number) => `${Math.round(v * 100)}%`;

interface PhotoTilesProps {
  flipX?: boolean;
  flipY?: boolean;
  onMirror: () => void;
  onFlip: () => void;
  onCopy: () => void;
  onReplace: (e: ChangeEvent<HTMLInputElement>) => void;
  onCrop: () => void;
}

// A photo's More, first line, in both editors: mirror, flip upside down, copy, replace and crop.
export function PhotoTiles({ flipX, flipY, onMirror, onFlip, onCopy, onReplace, onCrop }: PhotoTilesProps) {
  return (
    <Section>
      <TileGrid columns={5}>
        <Tile label="Mirror" title="Flip left to right" Icon={FlipHorizontal} active={Boolean(flipX)} onClick={onMirror} />
        <Tile label="Flip" title="Flip upside down" Icon={FlipVertical} active={Boolean(flipY)} onClick={onFlip} />
        <Tile label="Copy" Icon={Copy} title="Duplicate" onClick={onCopy} />
        <Tile label="Replace" Icon={ImageUp} title="Use another picture here" accept="image/*" onFile={onReplace} />
        <Tile label="Crop" title="Crop or turn the photo" Icon={Crop} onClick={onCrop} />
      </TileGrid>
    </Section>
  );
}

export interface PhotoLookValues {
  opacity?: number;
  cornerRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  shadowSize?: number;
  shadowColor?: string;
}

// A photo's look, in both editors: opacity, corners, border and shadow two sliders to a line; a
// colour row follows the border or shadow once there is one.
export function PhotoLookControls({ look, set }: { look: PhotoLookValues; set: (patch: PhotoLookValues) => void }) {
  return (
    <>
      <div className="ie-adjust-grid">
        <div className="ie-adjust-item">
          <span className="ui-row-label">Opacity</span>
          <Slider label="Opacity" min={0.1} max={1} step={0.05} value={look.opacity ?? 1} onChange={(opacity) => set({ opacity })} format={pct} />
        </div>
        <div className="ie-adjust-item">
          <span className="ui-row-label">Corners</span>
          <Slider label="Corner rounding" min={0} max={1} step={0.05} value={look.cornerRadius || 0} onChange={(cornerRadius) => set({ cornerRadius })} format={pct} />
        </div>
        <div className="ie-adjust-item">
          <span className="ui-row-label">Border</span>
          <Slider label="Border width" min={0} max={30} value={look.borderWidth || 0} onChange={(borderWidth) => set({ borderWidth })} format={String} />
        </div>
        <div className="ie-adjust-item">
          <span className="ui-row-label">Shadow</span>
          <Slider label="Shadow size" min={0} max={40} value={look.shadowSize || 0} onChange={(shadowSize) => set({ shadowSize })} format={String} />
        </div>
      </div>
      {(look.borderWidth || 0) > 0 && (
        <Row label="Border">
          <SwatchRow ariaLabel="Border colour" colors={COLOR_SWATCHES} value={look.borderColor || '#ffffff'} onChange={(borderColor) => set({ borderColor })} />
        </Row>
      )}
      {(look.shadowSize || 0) > 0 && (
        <Row label="Shadow">
          <SwatchRow ariaLabel="Shadow colour" colors={SHADOW_COLORS} value={look.shadowColor || '#000000'} onChange={(shadowColor) => set({ shadowColor })} />
        </Row>
      )}
    </>
  );
}
