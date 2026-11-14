import { useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { Camera, ChevronLeft, ImagePlus, LayoutTemplate, Scissors, Sparkles, UploadCloud, X } from 'lucide-react';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { useMemeEditorStore, useMemeEditorStoreApi } from '../store/useMemeEditorStore';
import TemplatesSheet from './TemplatesSheet';
import StickerStylePicker from './StickerStylePicker';
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

// What the outline styles are shown on until there is a photo.
const STYLE_PREVIEW_URL = '/faces/drake.jpg';

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
  return (
    <TemplatesSheet
      actions={actions}
      onClose={onClose}
      title="Pick a picture"
      onPick={(t) => void replace(() => actions.handleAddImageLayer(t.imageUrl))}
    />
  );
}

// The Stickers maker's page, in the Face Swap page's look (faceSwap.css, MakerPage): one photo card
// (empty, a tap uploads; with a photo, the photo whole as the sticker will look, with a remove
// button), a line saying where it stands, the choices in one card (where the photo comes from:
// Upload, Camera, Templates; then the outline style), then Generate sticker, which cuts the photo
// out and opens the editing page.
export default function StickerStudio({
  actions,
  onClose,
  onBack,
}: {
  actions: EditorActions;
  onClose?: () => void;
  onBack?: () => void;
}) {
  const imageLayers: Photo[] = useMemeEditorStore((s: { imageLayers: Photo[] }) => s.imageLayers);
  const setImageLayers = useMemeEditorStore((s: PhotoStore) => s.setImageLayers);
  const pushHistory = useMemeEditorStore((s: PhotoStore) => s.pushHistory);
  const openSheet = useEditorUiStore((s: { openSheet: (sheet: string) => void }) => s.openSheet);
  const style: string = useEditorUiStore((s: { stickerStyle: string }) => s.stickerStyle);
  const setStyle = useEditorUiStore((s: { setStickerStyle: (id: string) => void }) => s.setStickerStyle);
  const replace = useReplacePhoto();

  const [isDragging, setIsDragging] = useState(false);

  const busy = Boolean(actions.isRemovingBg);
  const photo = imageLayers[imageLayers.length - 1];

  const handleBack = () => {
    if (onBack) onBack();
    else if (onClose) onClose();
    else if (actions?.onBack) actions.onBack();
    else window.history.back();
  };

  const pickFile = (e: ChangeEvent<HTMLInputElement>) => {
    void replace(() => actions.handleFileUploadImageLayer(e));
  };

  // A picture dropped on the photo card becomes the photo.
  const onDragOver = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const onDrop = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) pickFile({ target: { files: [file] } } as unknown as ChangeEvent<HTMLInputElement>);
  };

  const openTemplates = () => {
    openSheet('stickerGallery');
  };

  const remove = () => {
    setImageLayers([]);
    pushHistory();
  };

  // Under the card once there is a photo; nothing before.
  const note = busy ? 'This takes a few seconds'
    : photo ? 'The background comes off when you generate'
    : null;

  return (
    <section className="ie-swap ie-stk" aria-label="Make a sticker">
      <header className="ie-stk-header">
        <button type="button" className="ie-stk-back-btn" onClick={handleBack} aria-label="Back" title="Back">
          <ChevronLeft size={22} strokeWidth={2.4} />
        </button>
        <div className="ie-stk-header-main">
          <h1 className="ie-stk-title ui-topbar-title">
            <Sparkles size={16} strokeWidth={2.4} className="ie-stk-title-icon" aria-hidden="true" />
            <span>Sticker Studio</span>
          </h1>
        </div>
        {/* Said for screen readers (and the tests): where the sticker stands. */}
        <p className="ie-stk-status ui-topbar-subtitle" aria-live="polite">
          {!photo ? 'Add a photo' : 'Ready to generate'}
        </p>
      </header>

      <div className="ie-swap-scroll">
        <div className="ie-swap-stage">
          <div className="ie-swap-inputs ie-stk-inputs">
            {/* One card. Empty, a tap uploads a photo (or drop one on it); with one, it shows the
                photo whole as the sticker will look, in the style picked, with a remove button. */}
            <div className="ie-swap-slot" onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
              {photo ? (
                <div className={`ie-swap-tile ie-stk-result${isDragging ? ' is-drag-over' : ''}`}>
                  <img className={`ie-stk-preview ie-stk-look--${style}`} src={photo.url} alt="Sticker preview" />
                </div>
              ) : (
                <label className={`ie-swap-tile is-empty ie-stk-drop${isDragging ? ' is-drag-over' : ''}`}>
                  {/* A blank sticker waiting for its picture: a tilted card with a white die-cut
                      edge and a peeled corner, on the see-through checkerboard. */}
                  <span className="ie-stk-drop-art" aria-hidden="true">
                    <span className="ie-stk-drop-sticker">
                      <ImagePlus size={30} strokeWidth={1.8} />
                    </span>
                  </span>
                  <span className="ie-stk-drop-title">{isDragging ? 'Drop it here' : 'Add a photo'}</span>
                  <span className="ie-stk-drop-hint">A pet, a face or a snack: anything with a clear outline</span>
                  <input type="file" accept="image/*" aria-label="Add your photo" onChange={pickFile} hidden />
                </label>
              )}
              {photo && !busy && (
                <button type="button" className="ie-swap-remove" aria-label="Remove the photo" onClick={remove}>
                  <X size={14} strokeWidth={2.6} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
          {busy && (
            <div className="ie-swap-busy" role="status">
              <span className="ie-swap-spinner" aria-hidden="true" />
              Cutting out your sticker…
            </div>
          )}
        </div>

        {note && <p className="ie-swap-note" aria-live="polite">{note}</p>}

        {/* Where the photo comes from: three raised tiles of their own under the card. */}
        <div className="ie-stk-sources" role="group" aria-label="Add a photo">
          <label className={`ie-stk-source${busy ? ' is-disabled' : ''}`}>
            <UploadCloud size={22} aria-hidden="true" />
            Upload
            <input type="file" accept="image/*" aria-label="Upload a photo" onChange={pickFile} disabled={busy} hidden />
          </label>
          <label className={`ie-stk-source${busy ? ' is-disabled' : ''}`}>
            <Camera size={22} aria-hidden="true" />
            Camera
            <input type="file" accept="image/*" capture="environment" aria-label="Take a photo" onChange={pickFile} disabled={busy} hidden />
          </label>
          <button type="button" className="ie-stk-source" aria-label="Templates" disabled={busy} onClick={openTemplates}>
            <LayoutTemplate size={22} aria-hidden="true" />
            Templates
          </button>
        </div>

        {/* The style, alone in its card above the button. */}
        <div className="ie-swap-panel">
          <div className="ie-swap-panel-row ie-stk-panel-stack">
            <StickerStylePicker previewUrl={photo?.url ?? STYLE_PREVIEW_URL} disabled={busy} onPick={setStyle} />
          </div>
        </div>
      </div>

      <div className="ie-swap-actions">
        <button
          type="button"
          className="ie-swap-btn ie-swap-btn--primary ie-stk-go"
          disabled={!photo || busy}
          onClick={() => void actions.handleGenerateSticker()}
        >
          <Scissors size={18} aria-hidden="true" />
          <span>{busy ? 'Generating…' : 'Generate sticker'}</span>
        </button>
      </div>
    </section>
  );
}
