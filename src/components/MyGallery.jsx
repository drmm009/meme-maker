// My Studio: everything saved on this device, in an iOS look (MyGallery.css). A large title with
// the count and a grid/list switch, a search field, and a segmented control for the kinds (All,
// Memes, Stickers, GIFs, Videos) whose thumb slides to the picked one. Saves show as a collage (each
// picture at its own shape, dealt across columns so the newest run along the top; the name and date
// only for screen readers) or as an inset grouped list; each has a More button that pulls down
// Edit, Download and Delete.
// Tapping a save opens it in a sheet (from the bottom on a phone) with the same actions.
import React, { useMemo, useState, useEffect, useRef } from 'react';
import ModalPortal from './ModalPortal';
import useCollageColumns, { dealColumns } from './useCollageColumns';
import {
  Clapperboard,
  Download,
  Ellipsis,
  ImageIcon,
  ImagePlay,
  LayoutGrid,
  List,
  Pencil,
  Scissors,
  Search,
  Trash2,
} from 'lucide-react';
import { downloadImageHelper } from '../utils/downloadHelper';
import SegmentedControl from './pages/SegmentedControl';
import SearchField from './pages/SearchField';
import PullDownMenu from './pages/PullDownMenu';
import './MyGallery.css';

const clock = (ms) => {
  const sec = Math.max(1, Math.round((ms || 0) / 1000));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
};

const KINDS = {
  meme: { label: 'Meme', plural: 'Memes', Icon: ImageIcon, make: 'Make a meme' },
  sticker: { label: 'Sticker', plural: 'Stickers', Icon: Scissors, make: 'Make a sticker' },
  gif: { label: 'GIF', plural: 'GIFs', Icon: ImagePlay, make: 'Make a GIF' },
  video: { label: 'Video', plural: 'Videos', Icon: Clapperboard, make: 'Make a video' },
};
const TABS = ['all', 'meme', 'sticker', 'gif', 'video'];

const fileBase = (name, fallback) =>
  String(name || fallback)
    .replace(/[^a-z0-9-_]+/gi, '-')
    .toLowerCase()
    .slice(0, 60) || fallback;

const day = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Unknown date';

// The sheet's actions in one row: Re-Edit (grey) and Download (orange) pills with their icon and
// name, then Delete, a round grey button with only a red bin. With no Re-Edit (a GIF), Download keeps
// its size and the two sit together in the middle instead of stretching across.
function SheetActions({ editLabel, onEdit, onDownload, downloadDisabled, onDelete }) {
  return (
    <div className={`mg-sheet-actions ${onEdit ? '' : 'mg-sheet-actions--compact'}`}>
      {onEdit && (
        <button type="button" className="ios-btn ios-btn--gray mg-sheet-btn-edit" onClick={onEdit}>
          <Pencil size={17} aria-hidden="true" /> {editLabel}
        </button>
      )}
      {onDownload && (
        <button
          type="button"
          className="ios-btn ios-btn--filled mg-sheet-btn-download"
          onClick={onDownload}
          disabled={downloadDisabled}
        >
          <Download size={17} aria-hidden="true" /> Download
        </button>
      )}
      <button
        type="button"
        className="ios-btn ios-btn--gray mg-sheet-btn-delete"
        onClick={onDelete}
        aria-label="Delete"
        title="Delete"
      >
        <Trash2 size={19} aria-hidden="true" />
      </button>
    </div>
  );
}

// A save's sheet: the grabber, the picture, its name and kind, then what the caller puts in it
// (the actions). Escape, a tap outside or dragging the grabber down closes it; focus returns to
// what opened it.
function Viewer({ title, kind, onClose, preview, children }) {
  const { label } = KINDS[kind] || KINDS.meme;
  const sheetRef = useRef(null);
  const dragStartY = useRef(0);
  const currentDeltaY = useRef(0);
  const isDragging = useRef(false);

  useEffect(() => {
    const opener = document.activeElement;
    sheetRef.current?.focus();
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, [onClose]);

  // Pull handle down to close gesture (touch & pointer)
  const handlePointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    dragStartY.current = e.clientY;
    currentDeltaY.current = 0;
    isDragging.current = true;
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'none';
    }
    const target = e.currentTarget;
    try {
      target.setPointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }

    const onPointerMove = (moveEvt) => {
      if (!isDragging.current) return;
      const deltaY = moveEvt.clientY - dragStartY.current;
      if (deltaY > 0) {
        currentDeltaY.current = deltaY;
        if (sheetRef.current) {
          sheetRef.current.style.transform = `translateY(${deltaY}px)`;
        }
      } else {
        currentDeltaY.current = 0;
        if (sheetRef.current) {
          sheetRef.current.style.transform = 'translateY(0)';
        }
      }
    };

    const onPointerUp = (upEvt) => {
      if (!isDragging.current) return;
      isDragging.current = false;
      try {
        target.releasePointerCapture?.(upEvt.pointerId);
      } catch {
        // ignore
      }
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      if (sheetRef.current) {
        sheetRef.current.style.transition = 'transform 0.24s cubic-bezier(0.2, 0.9, 0.3, 1)';
        if (currentDeltaY.current > 60) {
          sheetRef.current.style.transform = 'translateY(100%)';
          setTimeout(onClose, 200);
        } else {
          sheetRef.current.style.transform = 'translateY(0)';
        }
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  return (
    <ModalPortal>
      <div className="ios ios-layer mg-sheet-backdrop" onClick={onClose} role="presentation">
        <div
          ref={sheetRef}
          className="mg-sheet"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Dragging the grabber down closes the sheet; so do Escape and a tap outside. */}
          <div className="mg-sheet-handle-area" onPointerDown={handlePointerDown} aria-hidden="true">
            <span className="mg-sheet-grabber" />
          </div>

          {preview}

          <div className="mg-sheet-heading">
            <h3 className="mg-sheet-title" title={title}>
              {title}
            </h3>
            <span className="mg-sheet-kind">{label}</span>
          </div>

          {children}
        </div>
      </div>
    </ModalPortal>
  );
}

// A saved video in its sheet: the exported file playing, or the project's picture.
function VideoViewer({ video, onClose, onOpen, onDelete, onGetFile }) {
  const [file, setFile] = useState(null);
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

  const preview = (
    <div className="mg-sheet-pic">
      {url && !isGif ? (
        <video className="mg-sheet-media" src={url} controls autoPlay loop playsInline />
      ) : (
        <img
          className="mg-sheet-media"
          src={url || video.thumbnail}
          alt={video.name}
          decoding="async"
        />
      )}
    </div>
  );

  return (
    <Viewer title={video.name} kind="video" onClose={onClose} preview={preview}>
      {!video.exportType && (
        <p className="mg-sheet-note">This project hasn’t been exported yet. Edit it to export a video.</p>
      )}
      <SheetActions
        editLabel="Edit"
        onEdit={() => onOpen(video)}
        onDownload={video.exportType ? download : undefined}
        downloadDisabled={!url}
        onDelete={() => onDelete(video.id)}
      />
    </Viewer>
  );
}

const NO_VIDEOS = [];

export default function MyGallery({
  savedMemes,
  galleryReady,
  onDeleteMeme,
  onSelectMeme,
  onResolveFullImage,
  savedVideos = NO_VIDEOS,
  onOpenVideo,
  onDeleteVideo,
  onGetVideoFile,
  onBrowseTemplates,
  onMake,
}) {
  const [tab, setTab] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const columnCount = useCollageColumns();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemeForView, setSelectedMemeForView] = useState(null);
  const [fullViewUrl, setFullViewUrl] = useState('');
  const [videoForView, setVideoForView] = useState(null);

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

  const thumbOf = (meme) => meme.thumbnailUrl || meme.imageUrl || '';

  // Everything as one list, newest first.
  const items = useMemo(() => {
    const images = (savedMemes || []).map((m) => ({
      kind: KINDS[m.kind] ? m.kind : 'meme',
      id: m.id,
      name: m.name,
      date: m.createdAt,
      thumb: m.thumbnailUrl || m.imageUrl || '',
      meme: m,
    }));
    const videos = (savedVideos || []).map((v) => ({
      kind: 'video',
      id: v.id,
      name: v.name,
      date: v.savedAt,
      thumb: v.thumbnail,
      video: v,
    }));
    return [...images, ...videos].sort(
      (a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0)
    );
  }, [savedMemes, savedVideos]);

  const counts = useMemo(() => {
    const c = { all: items.length, meme: 0, sticker: 0, gif: 0, video: 0 };
    for (const it of items) {
      if (c[it.kind] !== undefined) c[it.kind] += 1;
    }
    return c;
  }, [items]);

  const shown = useMemo(() => {
    const byTab = tab === 'all' ? items : items.filter((it) => it.kind === tab);
    const q = searchQuery.trim().toLowerCase();
    if (!q) return byTab;
    return byTab.filter((it) => (it.name || '').toLowerCase().includes(q));
  }, [items, tab, searchQuery]);

  const handleDownload = async (meme, e) => {
    if (e) e.stopPropagation();
    const ext = meme.kind === 'gif' ? 'gif' : 'png';
    const full = onResolveFullImage ? await onResolveFullImage(meme) : thumbOf(meme);
    await downloadImageHelper(
      full,
      `${fileBase(meme.name, meme.kind || 'meme')}-${Date.now()}.${ext}`
    );
  };

  const handleEdit = async (meme, e) => {
    if (e) e.stopPropagation();
    const fullUrl = onResolveFullImage
      ? await onResolveFullImage(meme)
      : meme.rawImageUrl || meme.imageUrl;
    const editTemplate = {
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
      imageLayers: meme.imageLayers || [],
    };
    if (onSelectMeme) {
      onSelectMeme(editTemplate);
    }
  };

  const handleDelete = (id, e) => {
    if (e) e.stopPropagation();
    onDeleteMeme?.(id);
    if (selectedMemeForView?.id === id) {
      setSelectedMemeForView(null);
    }
  };

  const make = (kind) => {
    if (onMake) onMake(kind);
    else if (onBrowseTemplates) onBrowseTemplates();
    else if (onSelectMeme) onSelectMeme(null);
  };

  // What a save's More menu offers. A GIF can't be edited again; a video's download is in its
  // sheet, where the file loads.
  const actionsFor = (it) => {
    const { label } = KINDS[it.kind];
    return [
      it.kind !== 'gif' && {
        id: 'edit',
        label: 'Edit',
        title: `Edit ${label}`,
        Icon: Pencil,
        run: () => (it.video ? onOpenVideo?.(it.video) : handleEdit(it.meme)),
      },
      {
        id: 'download',
        label: 'Download',
        title: `Download ${label}`,
        Icon: Download,
        run: () => (it.video ? setVideoForView(it.video) : handleDownload(it.meme)),
      },
      {
        id: 'delete',
        label: 'Delete',
        title: `Delete ${label}`,
        Icon: Trash2,
        destructive: true,
        run: () => (it.video ? onDeleteVideo?.(it.id) : handleDelete(it.id)),
      },
    ].filter(Boolean);
  };

  const openItem = (it) => (it.video ? setVideoForView(it.video) : setSelectedMemeForView(it.meme));
  const viewing = selectedMemeForView;
  const viewingKind = viewing && KINDS[viewing.kind] ? viewing.kind : 'meme';
  const TabIcon = tab === 'all' ? LayoutGrid : KINDS[tab].Icon;
  const panelLabel = tab === 'all' ? 'All' : KINDS[tab].plural;
  const hasSaves = galleryReady !== false && items.length > 0;

  return (
    <div className="my-gallery mg ios ios-page">
      <header className="mg-nav">
        <div className="ios-nav-row">
          <h1 className="ios-title">My Studio</h1>
          {hasSaves && (
            <div className="mg-view-switch" role="group" aria-label="Layout">
              <button
                type="button"
                className="mg-view-btn"
                aria-pressed={viewMode === 'grid'}
                aria-label="Grid"
                title="Grid"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid size={17} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="mg-view-btn"
                aria-pressed={viewMode === 'list'}
                aria-label="List"
                title="List"
                onClick={() => setViewMode('list')}
              >
                <List size={17} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
        {hasSaves && (
          <p className="ios-subtitle">
            {items.length} {items.length === 1 ? 'item' : 'items'} saved on this device
          </p>
        )}

        {hasSaves && <SearchField value={searchQuery} onChange={setSearchQuery} label="Search My Studio" />}

        {hasSaves && (
          <SegmentedControl
            label="Kinds of saves"
            segments={TABS.map((t) => ({ id: t, label: t === 'all' ? 'All' : KINDS[t].plural, count: counts[t] }))}
            value={tab}
            onChange={setTab}
          />
        )}
      </header>

      {galleryReady === false ? (
        <div className="ios-empty" role="status">
          <span className="ios-spinner" aria-hidden="true" />
          <h2 className="ios-empty-title">Loading gallery…</h2>
        </div>
      ) : items.length === 0 ? (
        <div className="ios-empty">
          <LayoutGrid className="ios-empty-icon" aria-hidden="true" />
          <h2 className="ios-empty-title">No Saved Memes Yet</h2>
          <p className="ios-empty-text">Memes, stickers, GIFs and videos you save appear here.</p>
          <button type="button" className="ios-btn ios-btn--filled ios-btn--capsule" onClick={() => make('meme')}>
            Make a meme
          </button>
        </div>
      ) : shown.length === 0 ? (
        <div className="ios-empty">
          {searchQuery ? (
            <>
              <Search className="ios-empty-icon" aria-hidden="true" />
              <h2 className="ios-empty-title">No Results for “{searchQuery}”</h2>
              <p className="ios-empty-text">Check the spelling or try a new search.</p>
              <button type="button" className="ios-text-btn" onClick={() => setSearchQuery('')}>
                Clear Search
              </button>
            </>
          ) : (
            <>
              <TabIcon className="ios-empty-icon" aria-hidden="true" />
              <h2 className="ios-empty-title">No {KINDS[tab].plural} Yet</h2>
              <p className="ios-empty-text">{KINDS[tab].plural} you save appear here.</p>
              <button type="button" className="ios-btn ios-btn--filled ios-btn--capsule" onClick={() => make(tab)}>
                {KINDS[tab].make}
              </button>
            </>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="mg-grid" role="tabpanel" aria-label={panelLabel}>
          {dealColumns(shown, columnCount).map((column, c) => (
            <div className="mg-grid-col" key={c}>
              {column.map((it) => {
                const { Icon } = KINDS[it.kind];
                return (
                  <article key={`${it.kind}-${it.id}`} className={`mg-tile mg-tile--${it.kind}`}>
                    <button type="button" className="mg-tile-open" onClick={() => openItem(it)}>
                      <span className="mg-tile-pic">
                        {it.thumb ? (
                          <img src={it.thumb} alt="" decoding="async" loading="lazy" />
                        ) : (
                          <Icon className="mg-tile-placeholder" aria-hidden="true" />
                        )}
                        {it.video && <span className="mg-tile-time">{clock(it.video.durationMs)}</span>}
                      </span>
                      {/* The collage shows only pictures; the name and date are read out, not shown. */}
                      <span className="mg-tile-words">
                        <span className="mg-tile-name">{it.name}</span>
                        <span className="mg-tile-date">{day(it.date)}</span>
                      </span>
                    </button>
                    <PullDownMenu
                      label={`More for ${it.name}`}
                      menuLabel={it.name}
                      actions={actionsFor(it)}
                      buttonClassName="mg-tile-more"
                    >
                      <Ellipsis size={18} aria-hidden="true" />
                    </PullDownMenu>
                  </article>
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        <div className="mg-list" role="tabpanel" aria-label={panelLabel}>
          {shown.map((it) => {
            const { Icon, label } = KINDS[it.kind];
            return (
              <div key={`${it.kind}-${it.id}`} className={`mg-row mg-row--${it.kind}`}>
                <button type="button" className="mg-row-open" onClick={() => openItem(it)}>
                  <span className="mg-row-pic">
                    {it.thumb ? (
                      <img src={it.thumb} alt="" decoding="async" loading="lazy" />
                    ) : (
                      <Icon className="mg-tile-placeholder" aria-hidden="true" />
                    )}
                  </span>
                  <span className="mg-row-text">
                    <span className="mg-row-name" title={it.name}>
                      {it.name}
                    </span>
                    <span className="mg-row-meta">
                      {label} · {day(it.date)}
                      {it.video && <> · <span className="mg-row-time">{clock(it.video.durationMs)}</span></>}
                    </span>
                  </span>
                </button>
                <PullDownMenu label={`More for ${it.name}`} menuLabel={it.name} actions={actionsFor(it)}>
                  <Ellipsis size={18} aria-hidden="true" />
                </PullDownMenu>
              </div>
            );
          })}
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

      {viewing && (
        <Viewer
          title={viewing.name}
          kind={viewingKind}
          onClose={() => setSelectedMemeForView(null)}
          preview={
            <div className={`mg-sheet-pic mg-sheet-pic--${viewingKind}`}>
              <img
                className="mg-sheet-media"
                src={fullViewUrl || thumbOf(viewing)}
                alt={viewing.name}
                decoding="async"
              />
            </div>
          }
        >
          <SheetActions
            editLabel="Re-Edit"
            onEdit={viewingKind !== 'gif' ? () => handleEdit(viewing) : undefined}
            onDownload={() => handleDownload(viewing)}
            onDelete={() => handleDelete(viewing.id)}
          />
        </Viewer>
      )}
    </div>
  );
}
