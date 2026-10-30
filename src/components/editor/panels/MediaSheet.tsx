import { Wand2, ScanFace, Crop, FlipHorizontal, SlidersHorizontal, Undo2 } from 'lucide-react';
import { Sheet, Section, ChipRow, Chip, TileGrid, Tile } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { useSelection } from './selection';
import type { EditorActions } from './selection';
import type { MemeImageLayer } from '../../../model/memeDocument';
import LayerActions from './LayerActions';
import StickerControls from './StickerControls';
import LayerLookControls from './LayerLookControls';
import type { MemeSticker } from '../../../model/memeDocument';

// The Media sheet, under the Media strip (which adds photos, templates, stickers and emoji): pick an
// image or sticker on the meme; crop, flip, filter, cut out or face swap the selected image; size,
// flip and die-cut the selected sticker; and how either sits on the meme (LayerLookControls).
export default function MediaSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const imageLayers: MemeImageLayer[] = useMemeEditorStore((s: { imageLayers: MemeImageLayer[] }) => s.imageLayers || []);
  const setActiveLayerId = useMemeEditorStore((s: { setActiveLayerId: (id: string | null) => void }) => s.setActiveLayerId);
  const stickers: MemeSticker[] = useMemeEditorStore((s: { stickers: MemeSticker[] }) => s.stickers);
  const openSheet = useEditorUiStore((s: { openSheet: (sheet: string, focus?: string | null) => void }) => s.openSheet);
  const { id, image, sticker } = useSelection();
  const busy = Boolean(actions.isRemovingBg);

  return (
    <Sheet title="Media" onClose={onClose}>
      {imageLayers.length + stickers.length === 0 && <p className="ie-empty">No photos or stickers yet. Add one from the strip above.</p>}

      {imageLayers.length + stickers.length > 0 && (
        <Section title="On the meme">
          <ChipRow ariaLabel="Images and stickers">
            {imageLayers.map((l, i) => <Chip key={l.id} label={`Image ${i + 1}`} active={l.id === id} onClick={() => setActiveLayerId(l.id)} />)}
            {stickers.map((s) => <Chip key={s.id} label={s.emoji || s.name || 'Sticker'} active={s.id === id} onClick={() => setActiveLayerId(s.id)} />)}
          </ChipRow>
        </Section>
      )}

      {sticker && <StickerControls actions={actions} />}

      {image && id && (
        <>
          <Section title="Selected image" rule>
            <TileGrid>
              <Tile label={image.fitMode === 'crop' ? 'Done cropping' : 'Crop'} Icon={Crop} active={image.fitMode === 'crop'} onClick={() => actions.updateActiveImageLayer('fitMode', image.fitMode === 'crop' ? 'fit' : 'crop')} />
              <Tile label="Flip" Icon={FlipHorizontal} active={Boolean(image.flipX)} onClick={() => actions.handleFlipActiveLayer()} />
              <Tile label="Filters" Icon={SlidersHorizontal} onClick={() => openSheet('filters')} />
              <Tile label={image.originalUrl ? 'Undo cutout' : 'Cut out'} Icon={image.originalUrl ? Undo2 : Wand2} title="Magic Eraser (Remove Background)" disabled={busy} active={Boolean(image.originalUrl)} onClick={() => actions.handleRemoveBackground()} />
              <Tile label="Face Swap" Icon={ScanFace} onClick={() => actions.handleStartMorphFace(image)} />
            </TileGrid>
          </Section>
          <LayerLookControls id={id} layer={image} kind="image" />
          <LayerActions id={id} actions={actions} />
        </>
      )}
    </Sheet>
  );
}
