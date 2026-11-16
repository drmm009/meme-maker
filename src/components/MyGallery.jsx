// My Studio: The Creator Vault & Production Showcase.
// Redesigned with a cyber-studio aesthetic:
// - Category segmented rail with live count badges
// - Dual view modes: Cinematic Poster Grid vs Compact Archive List
// - Quick search filter
// - Ambient glow lightbox viewer with keyboard accessibility
import React, { useMemo, useState, useEffect, useRef } from 'react';
import ModalPortal from './ModalPortal';
import {
  Clapperboard,
  Download,
  Edit3,
  ImageIcon,
  ImagePlay,
  LayoutGrid,
  List,
  Play,
  Scissors,
  Trash2,
  X,
  Search,
  Sparkles,
  Flame,
  ArrowUpRight
} from 'lucide-react';
import { downloadImageHelper } from '../utils/downloadHelper';
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

// Fullscreen Darkroom Lightbox Viewer
function Viewer({ title, kind, onClose, children }) {
  const { Icon, label } = KINDS[kind] || KINDS.meme;

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <ModalPortal>
      <div className="mg-viewer-backdrop animate-fade-in" onClick={onClose} role="presentation">
        <div
          className="mg-viewer animate-scale-up"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mg-viewer-head">
            <span className={`mg-kind-tag mg-kind-tag--${kind}`}>
              <Icon size={12} strokeWidth={2.4} /> {label}
            </span>
            <h3 className="mg-viewer-title" title={title}>
              {title}
            </h3>
            <button
              type="button"
              className="mg-viewer-close"
              onClick={onClose}
              title="Close"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
          {children}
        </div>
      </div>
    </ModalPortal>
  );
}

// Saved video preview modal
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

  return (
    <Viewer title={video.name} kind="video" onClose={onClose}>
      <div className="mg-viewer-pic">
        {url && !isGif ? (
          <video className="mg-viewer-media" src={url} controls autoPlay loop playsInline />
        ) : (
          <img
            className="mg-viewer-media"
            src={url || video.thumbnail}
            alt={video.name}
            decoding="async"
          />
        )}
      </div>
      {!video.exportType && (
        <p className="mg-viewer-note">Saved draft project. Re-edit to render full HD video.</p>
      )}
      <div className="mg-viewer-actions">
        <button
          type="button"
          className="mg-btn mg-btn--primary"
          onClick={() => onOpen(video)}
        >
          <Edit3 size={16} /> Edit
        </button>
        {video.exportType && (
          <button
            type="button"
            className="mg-btn mg-btn--secondary"
            onClick={download}
            disabled={!url}
          >
            <Download size={16} /> Download
          </button>
        )}
        <button
          type="button"
          className="mg-btn mg-btn--danger"
          onClick={() => onDelete(video.id)}
        >
          <Trash2 size={16} /> Delete
        </button>
      </div>
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemeForView, setSelectedMemeForView] = useState(null);
  const [fullViewUrl, setFullViewUrl] = useState('');
  const [videoForView, setVideoForView] = useState(null);
  const searchInputRef = useRef(null);

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

  // Consolidate creations chronologically
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

  // Tab counts
  const counts = useMemo(() => {
    const c = { all: items.length, meme: 0, sticker: 0, gif: 0, video: 0 };
    for (const it of items) {
      if (c[it.kind] !== undefined) c[it.kind] += 1;
    }
    return c;
  }, [items]);

  // Filtered items
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

  const viewing = selectedMemeForView;
  const viewingKind = viewing && KINDS[viewing.kind] ? viewing.kind : 'meme';
  const TabIcon = tab === 'all' ? LayoutGrid : KINDS[tab].Icon;

  return (
    <div className="my-gallery mg-vault">
      {/* Background ambient lighting */}
      <div className="mg-ambient-glow" aria-hidden="true" />

      {/* 1. VAULT COMMAND HEADER */}
      <header className="mg-header-deck">
        <div className="mg-hero-identity">
          <div className="mg-hero-pill-badge">
            <span className="mg-pulsing-dot" />
            <span>CREATOR VAULT</span>
          </div>
          <h1 className="mg-hero-title">My Studio</h1>
          {galleryReady !== false && items.length > 0 && (
            <p className="mg-hero-stats">
              <span className="mg-stat-value">{items.length}</span> creations secured on device
            </p>
          )}
        </div>

        {/* Action Toolbar: Search & View Switcher */}
        {items.length > 0 && (
          <div className="mg-controls-bar">
            <div className="mg-search-capsule">
              <Search size={15} className="mg-search-icon" aria-hidden="true" />
              <input
                ref={searchInputRef}
                type="text"
                className="mg-search-input"
                placeholder="Search creations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Filter creations"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="mg-search-clear"
                  onClick={() => {
                    setSearchQuery('');
                    searchInputRef.current?.focus();
                  }}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* View Mode Switcher */}
            <div className="mg-view-toggle-capsule" role="group" aria-label="Layout mode">
              <button
                type="button"
                className={`mg-view-btn ${viewMode === 'grid' ? 'is-active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Poster Grid"
                aria-label="Poster Grid"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                className={`mg-view-btn ${viewMode === 'list' ? 'is-active' : ''}`}
                onClick={() => setViewMode('list')}
                title="Archive List"
                aria-label="Archive List"
              >
                <List size={16} />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. CATEGORY SEGMENTED FILTER RAIL */}
      {items.length > 0 && (
        <nav className="mg-category-rail" role="tablist" aria-label="Saved categories">
          {TABS.map((t) => {
            const label = t === 'all' ? 'All' : KINDS[t].plural;
            const count = counts[t];
            const isActive = tab === t;
            return (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`mg-tab-chip ${isActive ? 'is-active' : ''}`}
                onClick={(e) => {
                  setTab(t);
                  e.currentTarget.scrollIntoView?.({
                    block: 'nearest',
                    inline: 'nearest',
                    behavior: 'smooth',
                  });
                }}
              >
                {label}
                <span className="mg-chip-count">{count}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* 4. CONTENT AREA: LOADING, EMPTY, OR CREATION CARDS */}
      {galleryReady === false ? (
        <div className="mg-empty-vault" role="status">
          <div className="mg-vault-spinner" />
          <h3 className="mg-empty-vault-title">Loading gallery…</h3>
          <p className="mg-empty-vault-desc">Decrypting your saved memes and assets from local vault.</p>
        </div>
      ) : items.length === 0 ? (
        /* Empty Studio */
        <div className="mg-empty-vault">
          <div className="mg-empty-icon-shield">
            <LayoutGrid size={32} />
          </div>
          <h3 className="mg-empty-vault-title">No Saved Memes Yet</h3>
          <p className="mg-empty-vault-desc">
            Your studio vault is pristine. Memes, stickers, GIFs, and reels you generate will live here.
          </p>
          <button
            type="button"
            className="mg-vault-launch-btn"
            onClick={() => make('meme')}
          >
            <Sparkles size={16} /> Make a meme
          </button>
        </div>
      ) : shown.length === 0 ? (
        /* Empty Filter or Search */
        <div className="mg-empty-vault mg-empty-vault--sub">
          <div className={`mg-empty-icon-shield mg-kind-glow--${tab}`}>
            <TabIcon size={26} />
          </div>
          {searchQuery ? (
            <>
              <h3 className="mg-empty-vault-title">No creations matching &ldquo;{searchQuery}&rdquo;</h3>
              <p className="mg-empty-vault-desc">Try searching for a different keyword or reset your filters.</p>
              <button
                type="button"
                className="mg-vault-sub-btn"
                onClick={() => setSearchQuery('')}
              >
                Clear Search
              </button>
            </>
          ) : (
            <>
              <h3 className="mg-empty-vault-title">No {KINDS[tab].plural.toLowerCase()} yet</h3>
              <p className="mg-empty-vault-desc">
                Unleash your creativity and create your first {KINDS[tab].label.toLowerCase()}.
              </p>
              <button
                type="button"
                className="mg-vault-launch-btn"
                onClick={() => make(tab)}
              >
                {KINDS[tab].make}
              </button>
            </>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* =================================================================
           POSTER GRID LAYOUT: ART-FIRST ELEVATED SQUIRCLES
           ================================================================= */
        <div
          className="mg-poster-grid"
          role="tabpanel"
          aria-label={tab === 'all' ? 'All' : KINDS[tab].plural}
        >
          {shown.map((it, idx) => {
            const isFeatured = idx === 0 && tab === 'all' && !searchQuery && shown.length > 1;
            const { Icon, label } = KINDS[it.kind];
            const open = () =>
              it.video ? setVideoForView(it.video) : setSelectedMemeForView(it.meme);
            const remove = (e) => {
              e.stopPropagation();
              if (it.video) onDeleteVideo?.(it.id);
              else handleDelete(it.id, e);
            };
            const downloadQuick = (e) => {
              e.stopPropagation();
              if (it.video) setVideoForView(it.video);
              else handleDownload(it.meme, e);
            };
            const editQuick = (e) => {
              e.stopPropagation();
              if (it.video) onOpenVideo?.(it.video);
              else handleEdit(it.meme, e);
            };

            return (
              <article
                key={`${it.kind}-${it.id}`}
                className={`mg-poster-card mg-poster-card--${it.kind} ${isFeatured ? 'mg-poster-card--featured' : ''}`}
                onClick={open}
              >
                {/* Media Artwork Window */}
                <div className="mg-poster-window">
                  {it.thumb ? (
                    <img
                      src={it.thumb}
                      alt={it.name}
                      decoding="async"
                      loading="lazy"
                      className="mg-poster-img"
                    />
                  ) : (
                    <div className="mg-poster-placeholder">
                      <Icon size={36} />
                    </div>
                  )}

                  {/* Top Kind Badge */}
                  <div className="mg-poster-top-bar">
                    <div className="mg-poster-badges-row">
                      <span className={`mg-kind-tag mg-kind-tag--${it.kind}`}>
                        <Icon size={11} strokeWidth={2.4} /> {label}
                      </span>
                      {isFeatured && (
                        <span className="mg-featured-glow-tag">
                          <Flame size={11} className="mg-flame-icon" /> LATEST
                        </span>
                      )}
                    </div>
                    {it.video && (
                      <span className="mg-poster-time-pill">
                        <Play size={9} fill="currentColor" /> {clock(it.video.durationMs)}
                      </span>
                    )}
                  </div>

                  {/* Quick Action Floating Ribbon on Hover */}
                  <div className="mg-poster-hover-actions">
                    <span className="mg-hover-open-pill">
                      <ArrowUpRight size={14} /> Open
                    </span>
                  </div>
                </div>

                {/* Poster Deck Footer */}
                <div className="mg-poster-deck">
                  <div className="mg-poster-info">
                    <h4 className="mg-poster-title" title={it.name}>
                      {it.name}
                    </h4>
                    <span className="mg-poster-date">{day(it.date)}</span>
                  </div>

                  <div className="mg-poster-action-group">
                    {it.kind !== 'gif' && (
                      <button
                        type="button"
                        className="mg-mini-btn"
                        onClick={editQuick}
                        title={`Edit ${label}`}
                        aria-label={`Edit ${it.name}`}
                      >
                        <Edit3 size={13} />
                      </button>
                    )}
                    <button
                      type="button"
                      className="mg-mini-btn"
                      onClick={downloadQuick}
                      title={`Download ${label}`}
                      aria-label={`Download ${it.name}`}
                    >
                      <Download size={13} />
                    </button>
                    <button
                      type="button"
                      className="mg-mini-btn mg-mini-btn--danger"
                      onClick={remove}
                      title={`Delete ${label}`}
                      aria-label={`Delete ${it.name}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        /* =================================================================
           COMPACT ARCHIVE LIST LAYOUT: DENSE STUDIO TIMELINE
           ================================================================= */
        <div
          className="mg-archive-list"
          role="tabpanel"
          aria-label={tab === 'all' ? 'All' : KINDS[tab].plural}
        >
          {shown.map((it) => {
            const { Icon, label } = KINDS[it.kind];
            const open = () =>
              it.video ? setVideoForView(it.video) : setSelectedMemeForView(it.meme);
            const remove = (e) => {
              e.stopPropagation();
              if (it.video) onDeleteVideo?.(it.id);
              else handleDelete(it.id, e);
            };
            const downloadQuick = (e) => {
              e.stopPropagation();
              if (it.video) setVideoForView(it.video);
              else handleDownload(it.meme, e);
            };
            const editQuick = (e) => {
              e.stopPropagation();
              if (it.video) onOpenVideo?.(it.video);
              else handleEdit(it.meme, e);
            };

            return (
              <div
                key={`${it.kind}-${it.id}`}
                className={`mg-archive-row mg-archive-row--${it.kind}`}
                onClick={open}
              >
                <div className="mg-archive-thumb-wrap">
                  {it.thumb ? (
                    <img src={it.thumb} alt="" decoding="async" loading="lazy" />
                  ) : (
                    <Icon size={20} />
                  )}
                  {it.video && (
                    <span className="mg-archive-row-duration">
                      <Play size={8} fill="currentColor" /> {clock(it.video.durationMs)}
                    </span>
                  )}
                </div>

                <div className="mg-archive-row-main">
                  <div className="mg-archive-row-title-bar">
                    <span className={`mg-kind-tag mg-kind-tag--${it.kind}`}>
                      {label}
                    </span>
                    <h4 className="mg-archive-row-title" title={it.name}>
                      {it.name}
                    </h4>
                  </div>
                  <span className="mg-archive-row-date">{day(it.date)}</span>
                </div>

                <div className="mg-archive-row-actions">
                  {it.kind !== 'gif' && (
                    <button
                      type="button"
                      className="mg-mini-btn"
                      onClick={editQuick}
                      title={`Edit ${label}`}
                      aria-label={`Edit ${it.name}`}
                    >
                      <Edit3 size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    className="mg-mini-btn"
                    onClick={downloadQuick}
                    title={`Download ${label}`}
                    aria-label={`Download ${it.name}`}
                  >
                    <Download size={14} />
                  </button>
                  <button
                    type="button"
                    className="mg-mini-btn mg-mini-btn--danger"
                    onClick={remove}
                    title={`Delete ${label}`}
                    aria-label={`Delete ${it.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. LIGHTBOX PREVIEWS */}
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
        >
          <div className={`mg-viewer-pic mg-viewer-pic--${viewingKind}`}>
            <img
              className="mg-viewer-media"
              src={fullViewUrl || thumbOf(viewing)}
              alt={viewing.name}
              decoding="async"
            />
          </div>
          <div className="mg-viewer-actions">
            {viewingKind !== 'gif' && (
              <button
                type="button"
                className="mg-btn mg-btn--primary"
                onClick={(e) => handleEdit(viewing, e)}
              >
                <Edit3 size={16} /> Re-Edit
              </button>
            )}
            <button
              type="button"
              className={`mg-btn ${viewingKind === 'gif' ? 'mg-btn--primary' : 'mg-btn--secondary'}`}
              onClick={(e) => handleDownload(viewing, e)}
            >
              <Download size={16} /> Download
            </button>
            <button
              type="button"
              className="mg-btn mg-btn--danger"
              onClick={(e) => handleDelete(viewing.id, e)}
            >
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </Viewer>
      )}
    </div>
  );
}
