import { useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import {
  Camera,
  Check,
  ChevronLeft,
  ImagePlus,
  LayoutTemplate,
  Palette,
  Repeat2,
  Scissors,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react';
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

// Quick sample presets to try the sticker maker in one tap
const QUICK_SAMPLES = [
  { id: 'drake', label: 'Drake', url: '/faces/drake.jpg', tag: 'Classic' },
  { id: 'doakes', label: 'Doakes', url: '/faces/doakes.jpg', tag: 'Reaction' },
  { id: 'akshay', label: 'Akshay', url: '/faces/akshay.jpg', tag: 'Meme' },
  { id: 'srk', label: 'SRK', url: '/faces/srk.jpg', tag: 'Legend' },
];

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

// StickerStudio: Revamped custom sticker creator.
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

  const [picker, setPicker] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [backdrop, setBackdrop] = useState<'check' | 'dark' | 'gradient'>('check');

  const busy = Boolean(actions.isRemovingBg);
  const photo = imageLayers[imageLayers.length - 1];

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (onClose) {
      onClose();
    } else if (actions?.onBack) {
      actions.onBack();
    } else {
      window.history.back();
    }
  };

  const pickFile = (e: ChangeEvent<HTMLInputElement>) => {
    setPicker(false);
    void replace(() => actions.handleFileUploadImageLayer(e));
  };

  const handleDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const synthetic = {
        target: { files: [file] },
      } as unknown as ChangeEvent<HTMLInputElement>;
      pickFile(synthetic);
    }
  };

  const openGallery = () => {
    setPicker(false);
    openSheet('stickerGallery');
  };

  const remove = () => {
    setImageLayers([]);
    pushHistory();
  };

  const cycleBackdrop = () => {
    setBackdrop((b) => (b === 'check' ? 'dark' : b === 'dark' ? 'gradient' : 'check'));
  };

  // Where a photo comes from: on the page when there is none, in the Change sheet when there is.
  const sources = (
    <div className="ie-stk-sources" role="group" aria-label="Add a photo">
      <label className="ie-stk-source">
        <span className="ie-stk-source-icon" aria-hidden="true">
          <UploadCloud size={20} strokeWidth={2.2} />
        </span>
        <span className="ie-stk-source-text">
          <span className="ie-stk-source-title">Upload</span>
          <span className="ie-stk-source-sub">From files</span>
        </span>
        <input type="file" accept="image/*" aria-label="Upload a photo" onChange={pickFile} hidden />
      </label>

      <label className="ie-stk-source">
        <span className="ie-stk-source-icon" aria-hidden="true">
          <Camera size={20} strokeWidth={2.2} />
        </span>
        <span className="ie-stk-source-text">
          <span className="ie-stk-source-title">Camera</span>
          <span className="ie-stk-source-sub">Snap photo</span>
        </span>
        <input type="file" accept="image/*" capture="environment" aria-label="Take a photo" onChange={pickFile} hidden />
      </label>

      <button type="button" className="ie-stk-source" aria-label="Gallery" onClick={openGallery}>
        <span className="ie-stk-source-icon" aria-hidden="true">
          <LayoutTemplate size={20} strokeWidth={2.2} />
        </span>
        <span className="ie-stk-source-text">
          <span className="ie-stk-source-title">Gallery</span>
          <span className="ie-stk-source-sub">Templates</span>
        </span>
      </button>
    </div>
  );

  return (
    <section className="ie-swap ie-stk" aria-label="Make a sticker">
      {/* Top Header: Back button only, title with icon removed */}
      <header className="ie-stk-header">
        <button
          type="button"
          className="ie-stk-back-btn"
          onClick={handleBack}
          aria-label="Back"
          title="Back"
        >
          <ChevronLeft size={22} strokeWidth={2.4} />
        </button>

        <div className="ie-stk-header-main">
          <span className="ie-stk-tagline">
            <Sparkles size={10} className="ie-stk-sparkle-icon" aria-hidden="true" />
            <span>AI Sticker Studio</span>
          </span>
          <h1 className="ie-stk-title ui-topbar-title">
            <span>Create Custom </span><span>Stickers</span>
          </h1>
        </div>

        {/* Visually hidden for screen readers & vitest selectors */}
        <p className="ie-stk-status ui-topbar-subtitle" aria-live="polite">
          {!photo ? 'Add a photo' : 'Ready to generate'}
        </p>
      </header>

      {!photo ? (
        <div className="ie-stk-body ie-stk-body--empty">

          {/* Drag & Drop Upload Tile */}
          <label
            className={`ie-stk-drop ${isDragging ? 'is-drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="ie-stk-drop-visual" aria-hidden="true">
              <div className="ie-stk-drop-sticker-pill">
                <Scissors size={24} className="ie-stk-drop-cut-icon" />
                <span className="ie-stk-drop-peel-corner" />
              </div>
            </div>
            <span className="ie-stk-drop-title">Add a photo</span>
            <span className="ie-stk-drop-hint">A pet, a face or a snack: anything with a clear outline</span>
            <div className="ie-stk-drop-cta" aria-hidden="true">
              <ImagePlus size={15} /> Choose Photo
            </div>
            <input type="file" accept="image/*" aria-label="Choose your photo" onChange={pickFile} hidden />
          </label>

          {/* Quick Source Options */}
          {sources}

          {/* Instant Sample Presets */}
          <div className="ie-stk-samples-section">
            <div className="ie-stk-samples-head">
              <span className="ie-stk-samples-label">Or try a popular sample:</span>
            </div>
            <div className="ie-stk-samples-row">
              {QUICK_SAMPLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="ie-stk-sample-chip"
                  onClick={() => void replace(() => actions.handleAddImageLayer(s.url))}
                  title={`Try with ${s.label}`}
                >
                  <img src={s.url} alt={s.label} className="ie-stk-sample-avatar" />
                  <span className="ie-stk-sample-name">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="ie-stk-body ie-stk-body--loaded">
          {/* Main Stage Canvas */}
          <div className="ie-stk-stage">
            <div className={`ie-stk-board ie-stk-board--${backdrop}`}>
              <img className={`ie-stk-preview ie-stk-look--${style}`} src={photo.url} alt="Your photo" />

              {!busy && (
                <>
                  {/* Backdrop Toggle */}
                  <div className="ie-stk-board-left-tools">
                    <button
                      type="button"
                      className="ie-stk-pill-btn"
                      onClick={cycleBackdrop}
                      title={`Backdrop: ${backdrop} (click to toggle)`}
                      aria-label="Toggle preview backdrop"
                    >
                      <Palette size={14} />
                      <span className="ie-stk-pill-text">{backdrop === 'check' ? 'Grid' : backdrop === 'dark' ? 'Dark' : 'Color'}</span>
                    </button>
                  </div>

                  {/* Change and Remove Actions */}
                  <div className="ie-stk-board-tools">
                    <button
                      type="button"
                      className="ie-stk-pill-btn"
                      aria-label="Change the photo"
                      title="Change the photo"
                      onClick={() => setPicker(true)}
                    >
                      <Repeat2 size={15} aria-hidden="true" />
                      <span className="ie-stk-pill-text">Change</span>
                    </button>
                    <button
                      type="button"
                      className="ie-stk-pill-btn ie-stk-pill-btn--danger"
                      aria-label="Remove the photo"
                      title="Remove the photo"
                      onClick={remove}
                    >
                      <X size={15} aria-hidden="true" />
                      <span className="ie-stk-pill-text">Remove</span>
                    </button>
                  </div>

                  {/* Informational badge */}
                  <span className="ie-stk-note" aria-hidden="true">
                    <Scissors size={12} className="ie-stk-note-icon" /> The background comes off when you generate
                  </span>
                </>
              )}

              {/* Busy / Cutting Status */}
              {busy && (
                <div className="ie-stk-busy" role="status">
                  <div className="ie-stk-busy-spinner-wrap" aria-hidden="true">
                    <span className="ie-swap-spinner" />
                    <Scissors size={20} className="ie-stk-busy-icon" />
                  </div>
                  <div className="ie-stk-busy-text">
                    <span className="ie-stk-busy-headline">Cutting out your sticker…</span>
                    <span className="ie-stk-busy-sub">Removing background & applying {style} style</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sticker Style Selector Ribbon */}
          <div className="ie-stk-style-picker-header">
            <span className="ie-stk-picker-title">Sticker Outline Style</span>
            <span className="ie-stk-picker-badge">{STICKER_STYLES.find((s) => s.id === style)?.label || 'Classic'}</span>
          </div>

          <div className="ie-stk-styles" role="radiogroup" aria-label="Sticker style">
            {STICKER_STYLES.map((s) => {
              const isOn = style === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={isOn}
                  aria-label={s.label}
                  className={`ie-stk-style${isOn ? ' is-on' : ''}`}
                  disabled={busy}
                  onClick={() => setStyle(s.id)}
                >
                  <span className="ie-stk-thumb" aria-hidden="true">
                    <img className={`ie-stk-look--${s.id}`} src={photo.url} alt="" draggable={false} />
                    {isOn && (
                      <span className="ie-stk-thumb-check" aria-hidden="true">
                        <Check size={11} strokeWidth={3.5} />
                      </span>
                    )}
                  </span>
                  <span className="ie-stk-style-label">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Integrated bottom action button: NO separate bottom panel wrapper */}
      <button
        type="button"
        className="ie-swap-btn ie-swap-btn--primary ie-stk-go"
        disabled={!photo || busy}
        onClick={() => void actions.handleGenerateSticker()}
      >
        <Scissors size={18} aria-hidden="true" />
        <span>{busy ? 'Generating…' : 'Generate sticker'}</span>
      </button>

      {picker && photo && (
        <PickerSheet title="Your photo" onClose={() => setPicker(false)}>
          {sources}
        </PickerSheet>
      )}
    </section>
  );
}
