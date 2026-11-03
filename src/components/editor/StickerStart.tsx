import type { ChangeEvent } from 'react';
import { ImagePlus, LayoutTemplate } from 'lucide-react';
import { useEditorUiStore } from './store/useEditorUiStore';
import './stickerStart.css';

// The Stickers maker before it has anything on it: what to do first, on the empty checkerboard,
// with the two ways to add a photo (the strip below has them too). Dropping or pasting a picture
// works as well.
export default function StickerStart({ onUpload }: { onUpload: (e: ChangeEvent<HTMLInputElement>) => void }) {
  const openSheet = useEditorUiStore((s: { openSheet: (sheet: string) => void }) => s.openSheet);
  return (
    <div className="ie-sticker-start" role="group" aria-label="Start a sticker" onPointerDown={(e) => e.stopPropagation()}>
      <p className="ie-sticker-start-title">Make a sticker</p>
      <p className="ie-sticker-start-body">Add a photo of a pet, a face or a snack. Generate cuts it out with a white border.</p>
      <div className="ie-sticker-start-actions">
        <label className="ie-sticker-start-btn ie-sticker-start-btn--primary">
          <ImagePlus size={18} strokeWidth={2.2} aria-hidden="true" />
          Upload photo
          <input type="file" accept="image/*" onChange={onUpload} hidden />
        </label>
        <button type="button" className="ie-sticker-start-btn" onClick={() => openSheet('templates')}>
          <LayoutTemplate size={18} strokeWidth={2.2} aria-hidden="true" />
          Gallery
        </button>
      </div>
      <p className="ie-sticker-start-hint">or drop or paste a picture</p>
    </div>
  );
}
