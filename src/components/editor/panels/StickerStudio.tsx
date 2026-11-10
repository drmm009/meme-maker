import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { Camera, ImagePlus, LayoutTemplate, Scissors, X } from 'lucide-react';
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

// A distinctive visual sample sticker for each style: vector die-cut borders matching their cut settings.
function StickerStyleArt({ id }: { id: string }) {
  switch (id) {
    case 'classic':
      return (
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" className="ie-sticker-art-svg" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.45))' }}>
          <path
            d="M12 2l2.85 6.1 6.65.6-5 4.5 1.5 6.6L12 16.5 6 19.8l1.5-6.6-5-4.5 6.65-.6L12 2z"
            fill="#6366f1"
            stroke="#ffffff"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'bold':
      return (
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" className="ie-sticker-art-svg" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.55))' }}>
          <path
            d="M13 2L3.5 13.5h7.5l-2 8.5 11.5-12h-7.5l2.5-8z"
            fill="#ff5a36"
            stroke="#ffffff"
            strokeWidth="3.4"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'comic':
      return (
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" className="ie-sticker-art-svg" style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.35))' }}>
          <path
            d="M12 2.5l2 3.8 4.2-1.2-1 4.2 4.3 1-2.8 3.3 2.8 3.3-4.3 1 1 4.2-4.2-1.2-2 3.8-2-3.8-4.2 1.2 1-4.2-4.3-1 2.8-3.3-2.8-3.3 4.3-1-1-4.2 4.2 1.2 2-3.8z"
            fill="#ef4444"
            stroke="#000000"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="2.8" fill="#ffd60a" stroke="#000000" strokeWidth="1" />
        </svg>
      );
    case 'pop':
      return (
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" className="ie-sticker-art-svg" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.45))' }}>
          <path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            fill="#ec4899"
            stroke="#ffd60a"
            strokeWidth="2.6"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'clean':
      return (
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" className="ie-sticker-art-svg" style={{ filter: 'drop-shadow(0 6px 7px rgba(0,0,0,0.8))' }}>
          <path
            d="M12 2.5l7.5 7.5-7.5 11.5L4.5 10 12 2.5z"
            fill="#10b981"
            stroke="none"
          />
        </svg>
      );
    case 'retro':
      return (
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" className="ie-sticker-art-svg" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.45))' }}>
          <circle cx="12" cy="12" r="7.5" fill="#d97706" stroke="#fff1d6" strokeWidth="2.2" />
          <circle cx="12" cy="5" r="3" fill="#fbbf24" stroke="#fff1d6" strokeWidth="1.8" />
          <circle cx="19" cy="12" r="3" fill="#fbbf24" stroke="#fff1d6" strokeWidth="1.8" />
          <circle cx="12" cy="19" r="3" fill="#fbbf24" stroke="#fff1d6" strokeWidth="1.8" />
          <circle cx="5" cy="12" r="3" fill="#fbbf24" stroke="#fff1d6" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="2.8" fill="#fff1d6" />
        </svg>
      );
    default:
      return (
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" className="ie-sticker-art-svg">
          <circle cx="12" cy="12" r="9" fill="#ff5a36" stroke="#ffffff" strokeWidth="2" />
        </svg>
      );
  }
}

// The Stickers maker's Gallery: the Templates browser, whose pick becomes the sticker's photo.
export function StickerGallerySheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const replace = useReplacePhoto();
  return <TemplatesSheet actions={actions} onClose={onClose} title="Pick a picture" onPick={(t) => void replace(() => actions.handleAddImageLayer(t.imageUrl))} />;
}

// What each style does, under its name on the page.
const STYLE_NOTES: Record<string, string> = {
  classic: 'White edge',
  bold: 'Thick white',
  comic: 'Thin black',
  pop: 'Yellow edge',
  clean: 'Soft shadow',
  retro: 'Cream, faded',
};

// The Stickers maker until its photo is cut out (EditorPanels shows it in the canvas's place): a
// see-through board where the sticker will stand, the photo on it previewed in the picked style
// (empty, a tap opens where to get one); Upload, Camera and Gallery under it; the six styles as a
// grid of cards, each on a sample sticker; and Generate sticker, which cuts the photo out in that
// style and brings in the canvas with the editing tools.
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

  return (
    <section className="ie-swap ie-stk" aria-label="Make a sticker">
      <div className="ie-stk-body">
        <div className="ie-stk-stage">
          <div className={`ie-stk-board${photo ? '' : ' is-empty'}`}>
            <button type="button" className="ie-stk-board-btn" aria-label={photo ? 'Change the photo' : 'Choose your photo'} onClick={() => setPicker(true)} disabled={busy}>
              {photo ? (
                <img className={`ie-stk-preview ie-stk-preview--${style}`} src={photo.url} alt="" />
              ) : (
                <span className="ie-stk-empty">
                  <span className="ie-stk-empty-icon" aria-hidden="true"><ImagePlus size={26} strokeWidth={1.9} /></span>
                  <span className="ie-stk-empty-title">Choose your photo</span>
                  <span className="ie-stk-empty-hint">A pet, a face or a snack: anything with a clear outline</span>
                </span>
              )}
            </button>
            {photo && !busy && (
              <>
                <span className="ie-stk-note" aria-hidden="true">Preview · the background comes off next</span>
                <button type="button" className="ie-stk-remove" aria-label="Remove the photo" onClick={remove}>
                  <X size={15} strokeWidth={2.6} aria-hidden="true" />
                </button>
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

        {/* Where the photo comes from, each new one taking the old one's place. */}
        <div className="ie-stk-sources" role="group" aria-label="Add a photo">
          <label className={`ie-stk-source${busy ? ' is-off' : ''}`}>
            <ImagePlus aria-hidden="true" />
            Upload
            <input type="file" accept="image/*" aria-label="Upload a photo" onChange={pickFile} disabled={busy} hidden />
          </label>
          <label className={`ie-stk-source${busy ? ' is-off' : ''}`}>
            <Camera aria-hidden="true" />
            Camera
            <input type="file" accept="image/*" capture="environment" aria-label="Take a photo" onChange={pickFile} disabled={busy} hidden />
          </label>
          <button type="button" className="ie-stk-source" onClick={openGallery} disabled={busy}>
            <LayoutTemplate aria-hidden="true" />
            Gallery
          </button>
        </div>

        {/* The sticker's look, each on a sample sticker. */}
        <h2 className="ie-stk-styles-title">Style</h2>
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
              <span className="ie-stk-style-art" aria-hidden="true">
                <StickerStyleArt id={s.id} />
              </span>
              <span className="ie-stk-style-note" aria-hidden="true">{STYLE_NOTES[s.id]}</span>
              <span className="ie-stk-style-label">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="ie-swap-actions">
        <button type="button" className="ie-swap-btn ie-swap-btn--primary ie-stk-go" disabled={!photo || busy} onClick={() => void actions.handleGenerateSticker()}>
          <Scissors aria-hidden="true" />
          {busy ? 'Generating…' : 'Generate sticker'}
        </button>
      </div>

      {picker && (
        <PickerSheet title="Your photo" onClose={() => setPicker(false)}>
          <div className="ie-swap-sources ie-stk-sheet-sources">
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
            <button type="button" className="ie-swap-source" onClick={openGallery}>
              <LayoutTemplate size={22} aria-hidden="true" />
              Gallery
            </button>
          </div>
        </PickerSheet>
      )}
    </section>
  );
}
