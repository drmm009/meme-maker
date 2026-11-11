import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { Camera, ImagePlus, LayoutTemplate, Repeat2, Scissors, X } from 'lucide-react';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { useMemeEditorStore, useMemeEditorStoreApi } from '../store/useMemeEditorStore';
import TemplatesSheet from './TemplatesSheet';
import { PickerSheet } from './MakerPage';
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

// The Stickers maker until its photo is cut out (EditorPanels shows it in the canvas's place), in
// two screens. With no photo: one tall card to add one (a tap uploads) over a panel of where else
// it can come from (Upload, Camera, Gallery). With a photo: the photo large in the picked style,
// Change and Remove on its corner, and under it the styles as a strip of small pictures of that
// same photo in each style, as a camera app shows its filters, the picked one ringed in orange.
// Generate sticker, pinned at the bottom, cuts the photo out in that style and brings in the canvas
// with the editing tools.
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
  const openGallery = () => {
    setPicker(false);
    openSheet('stickerGallery');
  };
  const remove = () => {
    setImageLayers([]);
    pushHistory();
  };

  // Where a photo comes from: on the page when there is none, in the Change sheet when there is.
  const sources = (
    <div className="ie-stk-sources" role="group" aria-label="Add a photo">
      <label className="ie-stk-source">
        <span className="ie-stk-source-icon" aria-hidden="true"><ImagePlus /></span>
        Upload
        <input type="file" accept="image/*" aria-label="Upload a photo" onChange={pickFile} hidden />
      </label>
      <label className="ie-stk-source">
        <span className="ie-stk-source-icon" aria-hidden="true"><Camera /></span>
        Camera
        <input type="file" accept="image/*" capture="environment" aria-label="Take a photo" onChange={pickFile} hidden />
      </label>
      <button type="button" className="ie-stk-source" onClick={openGallery}>
        <span className="ie-stk-source-icon" aria-hidden="true"><LayoutTemplate /></span>
        Gallery
      </button>
    </div>
  );

  return (
    <section className="ie-swap ie-stk" aria-label="Make a sticker">
      {!photo ? (
        <div className="ie-stk-body">
          <label className="ie-stk-drop">
            <span className="ie-stk-drop-icon" aria-hidden="true"><ImagePlus /></span>
            <span className="ie-stk-drop-title">Add a photo</span>
            <span className="ie-stk-drop-hint">A pet, a face or a snack: anything with a clear outline</span>
            <input type="file" accept="image/*" aria-label="Choose your photo" onChange={pickFile} hidden />
          </label>
          {sources}
        </div>
      ) : (
        <div className="ie-stk-body">
          <div className="ie-stk-stage">
            <div className="ie-stk-board">
              <img className={`ie-stk-preview ie-stk-look--${style}`} src={photo.url} alt="Your photo" />
              {!busy && (
                <>
                  <div className="ie-stk-board-tools">
                    <button type="button" className="ie-stk-round" aria-label="Change the photo" title="Change the photo" onClick={() => setPicker(true)}>
                      <Repeat2 aria-hidden="true" />
                    </button>
                    <button type="button" className="ie-stk-round" aria-label="Remove the photo" title="Remove the photo" onClick={remove}>
                      <X aria-hidden="true" />
                    </button>
                  </div>
                  <span className="ie-stk-note" aria-hidden="true">The background comes off when you generate</span>
                </>
              )}
              {busy && (
                <div className="ie-stk-busy" role="status">
                  <span className="ie-swap-spinner" aria-hidden="true" />
                  Cutting out your sticker…
                </div>
              )}
            </div>
          </div>

          {/* The styles, each on the photo itself. */}
          <div className="ie-stk-styles" role="radiogroup" aria-label="Sticker style">
            {STICKER_STYLES.map((s) => (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={style === s.id}
                aria-label={s.label}
                className={`ie-stk-style${style === s.id ? ' is-on' : ''}`}
                disabled={busy}
                onClick={() => setStyle(s.id)}
              >
                <span className="ie-stk-thumb" aria-hidden="true">
                  <img className={`ie-stk-look--${s.id}`} src={photo.url} alt="" draggable={false} />
                </span>
                <span className="ie-stk-style-label">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="ie-swap-actions">
        <button type="button" className="ie-swap-btn ie-swap-btn--primary ie-stk-go" disabled={!photo || busy} onClick={() => void actions.handleGenerateSticker()}>
          <Scissors aria-hidden="true" />
          {busy ? 'Generating…' : 'Generate sticker'}
        </button>
      </div>

      {picker && photo && (
        <PickerSheet title="Your photo" onClose={() => setPicker(false)}>
          {sources}
        </PickerSheet>
      )}
    </section>
  );
}
