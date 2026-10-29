import { ImagePlus, LayoutTemplate, Wand2, ScanFace, Crop, FlipHorizontal, SlidersHorizontal, Undo2, Sticker, Smile } from 'lucide-react';
import { Sheet, Section, ChipRow, Chip, TileGrid, Tile } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { useSelection } from './selection';
import type { EditorActions } from './selection';
import type { MemeImageLayer } from '../../../model/memeDocument';
import LayerActions from './LayerActions';
import StickerControls from './StickerControls';
import type { MemeSticker } from '../../../model/memeDocument';

// The Media sheet: add photos and videos (upload or template), meme stickers and emoji; crop, flip,
// filter or cut out the selected image; size, flip and die-cut the selected sticker.
export default function MediaSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const imageLayers: MemeImageLayer[] = useMemeEditorStore((s: { imageLayers: MemeImageLayer[] }) => s.imageLayers || []);
  const setActiveLayerId = useMemeEditorStore((s: { setActiveLayerId: (id: string | null) => void }) => s.setActiveLayerId);
  const stickers: MemeSticker[] = useMemeEditorStore((s: { stickers: MemeSticker[] }) => s.stickers);
  const setImagePickerTarget = useEditorUiStore((s: { setImagePickerTarget: (v: unknown) => void }) => s.setImagePickerTarget);
  const setShowMemeStickersModal = useEditorUiStore((s: { setShowMemeStickersModal: (v: boolean) => void }) => s.setShowMemeStickersModal);
  const setShowEmojiModal = useEditorUiStore((s: { setShowEmojiModal: (v: boolean) => void }) => s.setShowEmojiModal);
  const openTabSheet = useEditorUiStore((s: { openTabSheet: (sheet: string, tab?: string) => void }) => s.openTabSheet);
  const { id, image, sticker } = useSelection();
  const busy = Boolean(actions.isRemovingBg);

  return (
    <Sheet title="Media" onClose={onClose}>
      <Section>
        <TileGrid columns={2}>
          <Tile label="Photo or video" Icon={ImagePlus} title="Upload Image or Video" accept="image/*,video/*" onFile={actions.handleFileUploadImageLayer} />
          <Tile label="From templates" Icon={LayoutTemplate} title="Add Image from Templates" onClick={() => setImagePickerTarget('layer')} />
          <Tile label="Meme Stickers" Icon={Sticker} title="Add Meme Stickers" onClick={() => setShowMemeStickersModal(true)} />
          <Tile label="Emojis" Icon={Smile} title="Add Emojis" onClick={() => setShowEmojiModal(true)} />
        </TileGrid>
      </Section>

      {imageLayers.length + stickers.length > 0 && (
        <Section title="On the meme" rule>
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
              <Tile label="Filters" Icon={SlidersHorizontal} onClick={() => openTabSheet('filters', 'fx')} />
              <Tile label={image.originalUrl ? 'Undo cutout' : 'Cut out'} Icon={image.originalUrl ? Undo2 : Wand2} title="Magic Eraser (Remove Background)" disabled={busy} active={Boolean(image.originalUrl)} onClick={() => actions.handleRemoveBackground()} />
              <Tile label="Face Swap" Icon={ScanFace} onClick={() => actions.handleStartMorphFace(image)} />
            </TileGrid>
          </Section>
          <LayerActions id={id} actions={actions} />
        </>
      )}
    </Sheet>
  );
}
