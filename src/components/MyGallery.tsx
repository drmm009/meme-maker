// My Studio: the memes and videos saved on this device, as a grid. A tile opens a viewer with Edit,
// Download and Delete. In the editors' look (pages/pageLook.css).
import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';
import ModalPortal from './ModalPortal';
import { Download, Trash2, Pencil, X, Images, Play } from 'lucide-react';
import { downloadImageHelper } from '../utils/downloadHelper';
import './pages/pageLook.css';
import './MyGallery.css';

interface SavedMeme {
  id: string;
  name?: string;
  createdAt?: string | number | null;
  thumbnailUrl?: string;
  imageUrl?: string;
  rawImageUrl?: string;
  isNativeLayout?: boolean;
  layoutDef?: unknown;
  slotImages?: unknown[];
  slotTransforms?: unknown[];
  aspectRatio?: string | number;
  imageFit?: string;
  captions?: unknown[];
  stickers?: unknown[];
  imageLayers?: unknown[];
}

interface SavedVideo {
  id: string;
  name: string;
  savedAt: string | number;
  durationMs?: number;
  thumbnail?: string;
  exportType?: string;
}

const clock = (ms?: number) => {
  const sec = Math.max(1, Math.round((ms || 0) / 1000));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
};

const fileBase = (name: string | undefined, fallback: string) =>
  String(name || fallback).replace(/[^a-z0-9-_]+/gi, '-').toLowerCase().slice(0, 60) || fallback;

const dateOf = (value: string | number | null | undefined) => (value ? new Date(value).toLocaleDateString() : 'Unknown date');

// A picture over the page: black backdrop, a grey sheet from the bottom (centred on a wide screen),
// its title and close, the picture, then the actions. Escape or a press outside closes it.
function Viewer({ title, onClose, children, actions }: { title: string; onClose: () => void; children: ReactNode; actions: ReactNode }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
  }, []);
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };
  return (
    <ModalPortal>
      <div className="pg-layer gl-viewer" onClick={onClose} onKeyDown={onKeyDown}>
        <div className="gl-sheet" role="dialog" aria-modal="true" aria-labelledby="gl-viewer-title" onClick={(e) => e.stopPropagation()}>
          <div className="gl-sheet-head">
            <h3 id="gl-viewer-title" className="gl-sheet-title">{title}</h3>
            <button ref={closeRef} type="button" className="gl-close" onClick={onClose} title="Close" aria-label="Close">
              <X size={18} />
            </button>
          </div>
          {children}
          <div className="gl-actions">{actions}</div>
        </div>
      </div>
    </ModalPortal>
  );
}

// A saved video: its exported file playing (or its still, when it was saved without exporting).
function VideoViewer({ video, onClose, onOpen, onDelete, onGetFile }: {
  video: SavedVideo;
  onClose: () => void;
  onOpen: (video: SavedVideo) => void;
  onDelete: (id: string) => void;
  onGetFile?: (id: string) => Promise<Blob | null | undefined>;
}) {
  const [file, setFile] = useState<Blob | null>(null);
  const [url, setUrl] = useState('');
  useEffect(() => {
    let alive = true;
    let objectUrl = '';
    if (video.exportType && onGetFile) {
      onGetFile(video.id)
        .then((blob) => {
          if (!alive || !blob) return;
          objectUrl = URL.createObjectURL(blob);
          setFile(blob);
          setUrl(objectUrl);
        })
        .catch(() => {});
    }
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [video, onGetFile]);

  const isGif = video.exportType === 'image/gif';
  const download = () => {
    if (!url || !file) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileBase(video.name, 'video')}.${isGif ? 'gif' : 'mp4'}`;
    a.click();
  };

  return (
    <Viewer
      title={video.name}
      onClose={onClose}
      actions={
        <>
          <button type="button" className="pg-btn pg-btn--accent" onClick={() => onOpen(video)}>
            <Pencil aria-hidden="true" /> Edit
          </button>
          {video.exportType && (
            <button type="button" className="pg-btn" onClick={download} disabled={!url}>
              <Download aria-hidden="true" /> Download
            </button>
          )}
          <button type="button" className="pg-btn gl-delete" onClick={() => onDelete(video.id)}>
            <Trash2 aria-hidden="true" /> Delete
          </button>
        </>
      }
    >
      {url && !isGif ? (
        <video className="gl-media pg-pic" src={url} controls autoPlay loop playsInline />
      ) : (
        <img className="gl-media pg-pic" src={url || video.thumbnail} alt={video.name} decoding="async" />
      )}
      {!video.exportType && <p className="gl-note">Saved without exporting. Edit it to export.</p>}
    </Viewer>
  );
}

interface MyGalleryProps {
  savedMemes: SavedMeme[];
  galleryReady?: boolean;
  onDeleteMeme: (id: string) => void;
  onSelectMeme?: (template: Record<string, unknown>) => void;
  onResolveFullImage?: (meme: SavedMeme) => Promise<string>;
  savedVideos?: SavedVideo[];
  onOpenVideo?: (video: SavedVideo) => void;
  onDeleteVideo?: (id: string) => void;
  onGetVideoFile?: (id: string) => Promise<Blob | null | undefined>;
  onBrowseTemplates?: () => void;
}

// A tile: the picture (a video's with its length), the name and date, and Delete.
function Tile({ name, date, thumb, onOpen, onDelete, deleteTitle, video }: {
  name: string;
  date: string;
  thumb?: string;
  onOpen: () => void;
  onDelete: (e: MouseEvent) => void;
  deleteTitle: string;
  video?: { ms?: number };
}) {
  return (
    <div
      className="pg-card gl-tile"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <div className="gl-thumb pg-pic">
        {thumb && <img src={thumb} alt={name} decoding="async" loading="lazy" />}
        {video && (
          <span className="pg-tag gl-time">
            <Play fill="currentColor" aria-hidden="true" />
            {clock(video.ms)}
          </span>
        )}
      </div>
      <div className="gl-info">
        <span className="gl-text">
          <span className="gl-name" title={name}>{name}</span>
          <span className="gl-date">{date}</span>
        </span>
        <button type="button" className="gl-tile-delete" onClick={onDelete} title={deleteTitle} aria-label={`Delete ${name}`}>
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

export default function MyGallery({
  savedMemes,
  galleryReady,
  onDeleteMeme,
  onSelectMeme,
  onResolveFullImage,
  savedVideos = [],
  onOpenVideo,
  onDeleteVideo,
  onGetVideoFile,
  onBrowseTemplates
}: MyGalleryProps) {
  const [selectedMemeForView, setSelectedMemeForView] = useState<SavedMeme | null>(null);
  const [fullViewUrl, setFullViewUrl] = useState('');
  const [videoForView, setVideoForView] = useState<SavedVideo | null>(null);

  useEffect(() => {
    let cancelled = false;
    setFullViewUrl('');
    if (selectedMemeForView && onResolveFullImage) {
      onResolveFullImage(selectedMemeForView).then((url) => {
        if (!cancelled) setFullViewUrl(url);
      });
    } else if (selectedMemeForView) {
      setFullViewUrl(selectedMemeForView.thumbnailUrl || selectedMemeForView.imageUrl || '');
    }
    return () => {
      cancelled = true;
    };
  }, [selectedMemeForView, onResolveFullImage]);

  const thumbOf = (meme: SavedMeme) => meme.thumbnailUrl || meme.imageUrl || '';

  const handleDownload = async (meme: SavedMeme) => {
    const full = onResolveFullImage ? await onResolveFullImage(meme) : thumbOf(meme);
    await downloadImageHelper(full, `${fileBase(meme.name, 'meme')}-${Date.now()}.png`);
  };

  const handleEdit = async (meme: SavedMeme) => {
    const fullUrl = onResolveFullImage ? await onResolveFullImage(meme) : meme.rawImageUrl || meme.imageUrl;
    onSelectMeme?.({
      id: meme.id || `custom-saved-${Date.now()}`,
      name: meme.name || 'Saved Meme',
      imageUrl: fullUrl || meme.rawImageUrl || meme.imageUrl,
      rawImageUrl: meme.rawImageUrl || fullUrl || meme.imageUrl,
      category: 'saved',
      isNativeLayout: meme.isNativeLayout || false,
      layoutDef: meme.layoutDef || null,
      slotImages: meme.slotImages || [],
      slotTransforms: meme.slotTransforms || [],
      aspectRatio: meme.aspectRatio || 'original',
      imageFit: meme.imageFit || 'cover',
      defaultCaptions: meme.captions || [],
      defaultStickers: meme.stickers || [],
      imageLayers: meme.imageLayers || []
    });
  };

  const handleDelete = (id: string, e?: MouseEvent) => {
    e?.stopPropagation();
    onDeleteMeme(id);
    if (selectedMemeForView?.id === id) setSelectedMemeForView(null);
  };

  const total = savedMemes.length + savedVideos.length;
  const both = savedMemes.length > 0 && savedVideos.length > 0;

  return (
    <div className="pg gl my-gallery">
      <div className="pg-head">
        <h1 className="pg-title">My saved memes</h1>
        {galleryReady !== false && total > 0 && <span className="pg-count">{total}</span>}
      </div>

      {galleryReady === false ? (
        <div className="pg-empty" role="status">
          <h3 className="pg-empty-title">Loading gallery…</h3>
        </div>
      ) : total > 0 ? (
        <>
          {savedVideos.length > 0 && (
            <section className="gl-section" aria-label="Videos">
              <h2 className="gl-section-title">Videos</h2>
              <div className="gl-grid">
                {savedVideos.map((video) => (
                  <Tile
                    key={video.id}
                    name={video.name}
                    date={dateOf(video.savedAt)}
                    thumb={video.thumbnail}
                    video={{ ms: video.durationMs }}
                    onOpen={() => setVideoForView(video)}
                    onDelete={(e) => {
                      e.stopPropagation();
                      onDeleteVideo?.(video.id);
                    }}
                    deleteTitle="Delete video"
                  />
                ))}
              </div>
            </section>
          )}
          {savedMemes.length > 0 && (
            <section className="gl-section" aria-label="Memes">
              {both && <h2 className="gl-section-title">Memes</h2>}
              <div className="gl-grid">
                {savedMemes.map((meme) => (
                  <Tile
                    key={meme.id}
                    name={meme.name || 'Untitled'}
                    date={dateOf(meme.createdAt)}
                    thumb={thumbOf(meme)}
                    onOpen={() => setSelectedMemeForView(meme)}
                    onDelete={(e) => handleDelete(meme.id, e)}
                    deleteTitle="Delete meme"
                  />
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <div className="pg-empty">
          <Images className="pg-empty-icon" aria-hidden="true" />
          <h3 className="pg-empty-title">No saved memes yet</h3>
          <p className="pg-empty-text">Make a meme from any template or layout, then tap Save. It shows up here.</p>
          {onBrowseTemplates && (
            <button type="button" className="pg-btn pg-btn--accent" onClick={onBrowseTemplates}>
              Explore templates
            </button>
          )}
        </div>
      )}

      {videoForView && (
        <VideoViewer
          video={videoForView}
          onClose={() => setVideoForView(null)}
          onOpen={(v) => {
            setVideoForView(null);
            onOpenVideo?.(v);
          }}
          onDelete={(id) => {
            setVideoForView(null);
            onDeleteVideo?.(id);
          }}
          onGetFile={onGetVideoFile}
        />
      )}

      {selectedMemeForView && (
        <Viewer
          title={selectedMemeForView.name || 'Untitled'}
          onClose={() => setSelectedMemeForView(null)}
          actions={
            <>
              <button type="button" className="pg-btn pg-btn--accent" onClick={() => handleEdit(selectedMemeForView)}>
                <Pencil aria-hidden="true" /> Edit
              </button>
              <button type="button" className="pg-btn" onClick={() => handleDownload(selectedMemeForView)}>
                <Download aria-hidden="true" /> Download
              </button>
              <button type="button" className="pg-btn gl-delete" onClick={(e) => handleDelete(selectedMemeForView.id, e)}>
                <Trash2 aria-hidden="true" /> Delete
              </button>
            </>
          }
        >
          <img
            src={fullViewUrl || thumbOf(selectedMemeForView)}
            alt={selectedMemeForView.name}
            decoding="async"
            className="gl-media pg-pic"
          />
        </Viewer>
      )}
    </div>
  );
}
