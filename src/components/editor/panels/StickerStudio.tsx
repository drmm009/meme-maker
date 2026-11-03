import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { Camera, ImagePlus, LayoutTemplate, Pencil, X } from 'lucide-react';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { useMemeEditorStore, useMemeEditorStoreApi } from '../store/useMemeEditorStore';
import TemplatesSheet from './TemplatesSheet';
import { EmptyTile, PickerSheet } from './MakerPage';
import { STICKER_STYLES } from '../stickerMaker';
import type { EditorActions } from './selection';
import './stickerStudio.css';

interface Photo {
  id: string;
  url: string;
}
interface PhotoStore {
  imageLayers: Photo[];
  setImageLayers: (layers: Photo[]) => void;
  pushHistory: () => void;
}

// A new photo takes the old one's place: added (the add appends to the photos there), then the
// photos from before dropped.
function useReplacePhoto() {
  const store = useMemeEditorStoreApi() as unknown as { getState(): PhotoStore };
  return async (add: () => unknown) => {
    const old = new Set(store.getState().imageLayers.map((l) => l.id));
    await add();
    const s = store.getState();
    if (old.size && s.imageLayers.some((l) => !old.has(l.id))) {
      s.setImageLayers(s.imageLayers.filter((l) => !old.has(l.id)));
      s.pushHistory();
    }
  };
}

// The Stickers maker's Gallery: the Templates browser, whose pick becomes the sticker's photo.
export function StickerGallerySheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const replace = useReplacePhoto();
  return <TemplatesSheet actions={actions} onClose={onClose} title="Pick a picture" onPick={(t) => void replace(() => actions.handleAddImageLayer(t.imageUrl))} />;
}

// The Stickers maker until its photo is cut out (EditorPanels shows it in the canvas's place): one
// square card where the sticker will stand (empty: Choose your photo; a tap opens upload, camera or
// the gallery; filled: the photo, with a remove button), the sticker styles to cut it in, and
// Generate sticker, which cuts the photo out in that style and brings in the canvas with the
// editing tools.
export default function StickerStudio({ actions }: { actions: EditorActions; onClose?: () => void }) {
  const imageLayers: Photo[] = useMemeEditorStore((s: { imageLayers: Photo[] }) => s.imageLayers);
  const setImageLayers = useMemeEditorStore((s: PhotoStore) => s.setImageLayers);
  const pushHistory = useMemeEditorStore((s: PhotoStore) => s.pushHistory);
  const openSheet = useEditorUiStore((s: { openSheet: (sheet: string) => void }) => s.openSheet);
  const style: string = useEditorUiStore((s: { stickerStyle: string }) => s.stickerStyle);
  const setStyle = useEditorUiStore((s: { setStickerStyle: (id: string) => void }) => s.setStickerStyle);
  const replace = useReplacePhoto();
  const [picker, setPicker] = useState(false);
  const busy = Boolean(actions.isRemovingBg);
  // The newest photo is the sticker's.
  const photo = imageLayers[imageLayers.length - 1];

  const pickFile = (e: ChangeEvent<HTMLInputElement>) => {
    setPicker(false);
    void replace(() => actions.handleFileUploadImageLayer(e));
  };
  const remove = () => {
    setImageLayers([]);
    pushHistory();
  };

  return (
    <section className="ie-swap ie-sticker-page" aria-label="Make a sticker">
      <div className="ie-sticker-stage">
        <div className="ie-swap-slot ie-sticker-square">
          <button type="button" className={`ie-swap-tile ie-sticker-tile${photo ? '' : ' is-empty'}`} aria-label={photo ? 'Change the photo' : 'Choose your photo'} onClick={() => setPicker(true)} disabled={busy}>
            {photo ? (
              <>
                <img src={photo.url} alt="" />
                {!busy && <span className="ie-swap-tile-label"><Pencil size={11} strokeWidth={2.6} aria-hidden="true" />Change</span>}
              </>
            ) : (
              <EmptyTile Icon={ImagePlus} title="Choose your photo" hint="A pet, a face or a snack: anything with a clear outline" />
            )}
          </button>
          {photo && !busy && (
            <button type="button" className="ie-swap-remove" aria-label="Remove the photo" onClick={remove}>
              <X size={14} strokeWidth={2.6} aria-hidden="true" />
            </button>
          )}
          {busy && (
            <div className="ie-swap-busy" role="status">
              <span className="ie-swap-spinner" aria-hidden="true" />
              Cutting out your sticker…
            </div>
          )}
        </div>
      </div>

      {/* The sticker's look, each on a sample sticker. */}
      <p className="ie-sticker-styles-title" aria-hidden="true">Choose your style</p>
      <div className="ie-sticker-styles" role="radiogroup" aria-label="Sticker style">
        {STICKER_STYLES.map((s) => (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={style === s.id}
            className={`ie-sticker-style ie-sticker-style--${s.id}${style === s.id ? ' is-on' : ''}`}
            disabled={busy}
            onClick={() => setStyle(s.id)}
          >
            <span className="ie-sticker-style-art" aria-hidden="true">
              <span>🐶</span>
            </span>
            {s.label}
          </button>
        ))}
      </div>

      <div className="ie-swap-actions">
        <button type="button" className="ie-swap-btn ie-swap-btn--primary" disabled={!photo || busy} onClick={() => void actions.handleGenerateSticker()}>
          {busy ? 'Generating…' : 'Generate sticker'}
        </button>
      </div>

      {picker && (
        <PickerSheet title="Your photo" onClose={() => setPicker(false)}>
          <div className="ie-swap-sources ie-sticker-sources">
            <label className="ie-swap-source">
              <ImagePlus size={22} aria-hidden="true" />
              Upload photo
              <input type="file" accept="image/*" aria-label="Upload a photo" onChange={pickFile} hidden />
            </label>
            <label className="ie-swap-source">
              <Camera size={22} aria-hidden="true" />
              Take a photo
              <input type="file" accept="image/*" capture="environment" aria-label="Take a photo" onChange={pickFile} hidden />
            </label>
            <button
              type="button"
              className="ie-swap-source"
              onClick={() => {
                setPicker(false);
                openSheet('stickerGallery');
              }}
            >
              <LayoutTemplate size={22} aria-hidden="true" />
              Gallery
            </button>
          </div>
        </PickerSheet>
      )}
    </section>
  );
}
