import { ImagePlus, LayoutTemplate, Wand2, ScanFace, Crop, FlipHorizontal, SlidersHorizontal, Undo2 } from 'lucide-react';
import { Sheet, Section, ChipRow, Chip, TileGrid, Tile } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { useSelection } from './selection';
import type { EditorActions } from './selection';
import type { MemeImageLayer } from '../../../model/memeDocument';
import LayerActions from './LayerActions';

// The Media sheet: add photos and videos (upload or template), cut out or face swap; crop, flip
// and filter the selected image.
export default function MediaSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const imageLayers: MemeImageLayer[] = useMemeEditorStore((s: { imageLayers: MemeImageLayer[] }) => s.imageLayers || []);
  const setActiveLayerId = useMemeEditorStore((s: { setActiveLayerId: (id: string | null) => void }) => s.setActiveLayerId);
  const bgRemoved = useMemeEditorStore((s: { activeTemplate?: { originalUrl?: string } }) => Boolean(s.activeTemplate?.originalUrl));
  const setImagePickerTarget = useEditorUiStore((s: { setImagePickerTarget: (v: unknown) => void }) => s.setImagePickerTarget);
  const setShowFaceMorphModal: (v: boolean) => void = actions.setShowFaceMorphModal;
  const openSheet = useEditorUiStore((s: { openSheet: (sheet: string, focus?: string | null) => void }) => s.openSheet);
  const { id, image } = useSelection();
  const busy = Boolean(actions.isRemovingBg);

  return (
    <Sheet title="Media" onClose={onClose}>
      <Section>
        <TileGrid columns={2}>
          <Tile label="Photo or video" Icon={ImagePlus} title="Upload Image or Video" accept="image/*,video/*" onFile={actions.handleFileUploadImageLayer} />
          <Tile label="From templates" Icon={LayoutTemplate} title="Add Image from Templates" onClick={() => setImagePickerTarget('layer')} />
          {!image && (
            <>
              <Tile label={bgRemoved ? 'Restore background' : 'Remove background'} Icon={bgRemoved ? Undo2 : Wand2} title="Remove the meme background" active={bgRemoved} disabled={busy} onClick={() => actions.handleRemoveBackground()} />
              <Tile label="Face Swap" Icon={ScanFace} title="Swap faces with another photo using AI" onClick={() => setShowFaceMorphModal(true)} />
            </>
          )}
        </TileGrid>
      </Section>

      {imageLayers.length > 0 && (
        <Section title="On the meme">
          <ChipRow ariaLabel="Images">
            {imageLayers.map((l, i) => <Chip key={l.id} label={`Image ${i + 1}`} active={l.id === id} onClick={() => setActiveLayerId(l.id)} />)}
          </ChipRow>
        </Section>
      )}

      {image && id && (
        <>
          <Section title="Selected image">
            <TileGrid>
              <Tile label={image.fitMode === 'crop' ? 'Done cropping' : 'Crop'} Icon={Crop} active={image.fitMode === 'crop'} onClick={() => actions.updateActiveImageLayer('fitMode', image.fitMode === 'crop' ? 'fit' : 'crop')} />
              <Tile label="Flip" Icon={FlipHorizontal} active={Boolean(image.flipX)} onClick={() => actions.handleFlipActiveLayer()} />
              <Tile label="Filters" Icon={SlidersHorizontal} onClick={() => openSheet('fx')} />
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
