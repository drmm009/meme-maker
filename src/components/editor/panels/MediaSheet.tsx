import { Image as ImageIcon, Sticker, Images } from 'lucide-react';
import { Sheet, Section, ChipRow, Chip } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { useSelection } from './selection';
import type { EditorActions } from './selection';
import type { MemeImageLayer } from '../../../model/memeDocument';
import StickerControls, { StickerFlip } from './StickerControls';
import type { MemeSticker } from '../../../model/memeDocument';
import { PhotoLookControls, PhotoTiles } from './PhotoControls';

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
    <Sheet Icon={image ? ImageIcon : sticker ? Sticker : Images}
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
          <PhotoTiles
            flipX={image.flipX}
            flipY={image.flipY}
            onMirror={() => actions.handleFlipActiveLayer()}
            onFlip={() => setImage({ flipY: !image.flipY })}
            onCopy={() => actions.handleDuplicateLayer(id)}
            onReplace={actions.handleReplaceImageLayer}
            onCrop={() => setCropLayerId(id)}
          />
          <PhotoLookControls look={image} set={setImage} />
        </>
      )}
    </Sheet>
  );
}
