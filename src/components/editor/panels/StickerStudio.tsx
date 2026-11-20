import { useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { Camera, ChevronLeft, ImagePlus, LayoutTemplate, RefreshCw, Scissors, UploadCloud, X } from 'lucide-react';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { useMemeEditorStore, useMemeEditorStoreApi } from '../store/useMemeEditorStore';
import TemplatesSheet from './TemplatesSheet';
import StickerStylePicker from './StickerStylePicker';
import type { EditorActions } from './selection';
import './stickerStudio.css';
import './stickerStudioPage.css';

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

// The Stickers maker's Gallery: the Templates browser in Sticker Studio's look (sst-templates), whose
// pick becomes the sticker's photo.
export function StickerGallerySheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const replace = useReplacePhoto();
  return (
    <TemplatesSheet
      actions={actions}
      onClose={onClose}
      title="Pick a picture"
      className="sst-templates"
      onPick={(t) => void replace(() => actions.handleAddImageLayer(t.imageUrl))}
    />
  );
}

// The Stickers maker's page (stickerStudioPage.css; the outline looks and the style row from
// stickerStudio.css). Under the header (a round Back button, the title centred with green scissors
// beside it), one stage on the
// see-through checkerboard: with no photo, a tilted die-cut sticker with a plus over a short line
// (a tap uploads, or drop a picture on it); with one, the sticker as it will look in the outline
// picked, with Change (pick another) and Remove; while it is cut out, a green light sweeps across.
// Then where the photo comes from (Upload, Camera, Templates) as three tiles, the outline
// styles, and Generate sticker in the maker's green, which cuts the photo out and opens the
// editing page.
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

  // A picture dropped on the stage becomes the photo.
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

  const remove = () => {
    setImageLayers([]);
    pushHistory();
  };

  return (
    <section className="ie-swap ie-stk sst" aria-label="Make a sticker">
      <header className="sst-header">
        <button type="button" className="sst-back" onClick={handleBack} aria-label="Back" title="Back">
          <ChevronLeft size={22} strokeWidth={2.4} />
        </button>
        <h1 className="sst-title ui-topbar-title"><span className="sst-title-icon" aria-hidden="true"><Scissors size={17} strokeWidth={2.4} /></span><span>Sticker Studio</span></h1>
        {/* Said for screen readers (and the tests): where the sticker stands. */}
        <p className="sst-status ui-topbar-subtitle" aria-live="polite">{!photo ? 'Add a photo' : 'Ready to generate'}</p>
      </header>

      <div className="sst-body">
        {/* The stage: a picture dropped anywhere on it becomes the photo. */}
        <div
          className={`sst-stage${isDragging ? ' is-drag-over' : ''}${photo ? ' has-photo' : ''}${busy ? ' is-busy' : ''}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          {photo ? (
            <>
              <img className={`sst-preview ie-stk-look--${style}`} src={photo.url} alt="Sticker preview" />
              {!busy && (
                <div className="sst-stage-tools">
                  <label className="sst-chip">
                    <RefreshCw size={14} strokeWidth={2.4} aria-hidden="true" />
                    Change
                    <input type="file" accept="image/*" aria-label="Change the photo" onChange={pickFile} hidden />
                  </label>
                  <button type="button" className="sst-chip sst-chip--round" aria-label="Remove the photo" onClick={remove}>
                    <X size={15} strokeWidth={2.6} aria-hidden="true" />
                  </button>
                </div>
              )}
              {busy && (
                <div className="sst-busy" role="status">
                  <span className="sst-sweep" aria-hidden="true" />
                  <span className="sst-busy-pill"><span className="sst-spinner" aria-hidden="true" />Cutting out your sticker…</span>
                </div>
              )}
            </>
          ) : (
            <label className="sst-empty">
              {/* A blank sticker waiting for its picture: tilted, a thick white die-cut edge. */}
              <span className="sst-empty-art" aria-hidden="true">
                <span className="sst-empty-sticker"><ImagePlus size={34} strokeWidth={1.8} /></span>
              </span>
              <span className="sst-empty-title">{isDragging ? 'Drop it here' : 'Turn a photo into a sticker'}</span>
              <span className="sst-empty-hint">A pet, a face or a snack: anything with a clear outline</span>
              <input type="file" accept="image/*" aria-label="Add your photo" onChange={pickFile} hidden />
            </label>
          )}
        </div>

        {/* Where the photo comes from: three tiles, each a bare green icon over its name. */}
        <div className="sst-sources" role="group" aria-label="Add a photo">
          <label className={`sst-source sst-source--upload${busy ? ' is-disabled' : ''}`}>
            <span className="sst-source-icon" aria-hidden="true"><UploadCloud size={20} strokeWidth={2.2} /></span>
            <span className="sst-source-label">Upload</span>
            <input type="file" accept="image/*" aria-label="Upload a photo" onChange={pickFile} disabled={busy} hidden />
          </label>
          <label className={`sst-source sst-source--camera${busy ? ' is-disabled' : ''}`}>
            <span className="sst-source-icon" aria-hidden="true"><Camera size={20} strokeWidth={2.2} /></span>
            <span className="sst-source-label">Camera</span>
            <input type="file" accept="image/*" capture="environment" aria-label="Take a photo" onChange={pickFile} disabled={busy} hidden />
          </label>
          <button type="button" className="sst-source sst-source--templates" aria-label="Templates" disabled={busy} onClick={() => openSheet('stickerGallery')}>
            <span className="sst-source-icon" aria-hidden="true"><LayoutTemplate size={20} strokeWidth={2.2} /></span>
            <span className="sst-source-label">Templates</span>
          </button>
        </div>

        {/* The outline styles, each shown on the photo (or a sample until there is one). */}
        <div className="sst-styles">
          <StickerStylePicker previewUrl={photo?.url ?? STYLE_PREVIEW_URL} disabled={busy} onPick={setStyle} />
        </div>
      </div>

      <div className="sst-actions">
        <button type="button" className="sst-go" disabled={!photo || busy} onClick={() => void actions.handleGenerateSticker()}>
          <Scissors size={18} aria-hidden="true" />
          <span>{busy ? 'Generating…' : 'Generate sticker'}</span>
        </button>
        <p className="sst-note" aria-live="polite">
          {busy ? 'This takes a few seconds' : photo ? 'The background comes off when you generate' : 'Add a photo to start'}
        </p>
      </div>
    </section>
  );
}
