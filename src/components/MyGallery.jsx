// My Studio: everything saved, sorted into Memes, Stickers, GIFs and Videos. A row of tabs (with
// counts) over a grid of tiles, newest first; a tile opens its preview (Re-Edit for memes and
// stickers, Download, Delete), a video its player. Memes, stickers and GIFs come from the gallery
// (each record says its kind, model/galleryRecord.ts); videos from the video editor's own store.
import React, { useMemo, useState } from 'react';
import ModalPortal from './ModalPortal';
import { Clapperboard, Download, Edit3, ImageIcon, ImagePlay, LayoutGrid, Play, Scissors, Trash2, X } from 'lucide-react';
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

const fileBase = (name, fallback) => String(name || fallback).replace(/[^a-z0-9-_]+/gi, '-').toLowerCase().slice(0, 60) || fallback;
const day = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Unknown date');

// The preview sheet both viewers share: the item's kind and name, then its picture and actions.
function Viewer({ title, kind, onClose, children }) {
  const { Icon, label } = KINDS[kind];
  return (
    <ModalPortal>
      <div className="mg-viewer-backdrop animate-fade-in" onClick={onClose}>
        <div className="mg-viewer animate-scale-up" role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
          <div className="mg-viewer-head">
            <span className={`mg-kind mg-kind--${kind}`}><Icon size={12} strokeWidth={2.4} /> {label}</span>
            <h3 className="mg-viewer-title">{title}</h3>
            <button type="button" className="mg-viewer-close" onClick={onClose} title="Close" aria-label="Close">
              <X size={18} />
            </button>
          </div>
          {children}
        </div>
      </div>
    </ModalPortal>
  );
}

// A saved video, opened from its tile: its exported file playing (or its still, when it was saved
// without exporting), with Edit, Download and Delete.
function VideoViewer({ video, onClose, onOpen, onDelete, onGetFile }) {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');
  React.useEffect(() => {
    let alive = true;
    let objectUrl = '';
    if (video.exportType && onGetFile) {
      onGetFile(video.id).then((blob) => {
        if (!alive || !blob) return;
        objectUrl = URL.createObjectURL(blob);
        setFile(blob);
        setUrl(objectUrl);
      }).catch(() => {});
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
          <img className="mg-viewer-media" src={url || video.thumbnail} alt={video.name} decoding="async" />
        )}
      </div>
      {!video.exportType && <p className="mg-viewer-note">Saved without exporting. Edit it to export.</p>}
      <div className="mg-viewer-actions">
        <button type="button" className="mg-btn mg-btn--primary" onClick={() => onOpen(video)}>
          <Edit3 size={16} /> Edit
        </button>
        {video.exportType && (
          <button type="button" className="mg-btn" onClick={download} disabled={!url}>
            <Download size={16} /> Download
          </button>
        )}
        <button type="button" className="mg-btn mg-btn--danger" onClick={() => onDelete(video.id)}>
          <Trash2 size={16} /> Delete
        </button>
      </div>
    </Viewer>
  );
}

export default function MyGallery({ savedMemes, galleryReady, onDeleteMeme, onSelectMeme, onResolveFullImage, savedVideos = [], onOpenVideo, onDeleteVideo, onGetVideoFile, onBrowseTemplates, onMake }) {
  const [tab, setTab] = useState('all');
  const [selectedMemeForView, setSelectedMemeForView] = useState(null);
  const [fullViewUrl, setFullViewUrl] = useState('');
  const [videoForView, setVideoForView] = useState(null);

  React.useEffect(() => {
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

  // Everything as one list of tiles, newest first.
  const items = useMemo(() => {
    const images = savedMemes.map((m) => ({ kind: KINDS[m.kind] ? m.kind : 'meme', id: m.id, name: m.name, date: m.createdAt, thumb: m.thumbnailUrl || m.imageUrl || '', meme: m }));
    const videos = savedVideos.map((v) => ({ kind: 'video', id: v.id, name: v.name, date: v.savedAt, thumb: v.thumbnail, video: v }));
    return [...images, ...videos].sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0));
  }, [savedMemes, savedVideos]);
  const counts = useMemo(() => {
    const c = { all: items.length, meme: 0, sticker: 0, gif: 0, video: 0 };
    for (const it of items) c[it.kind] += 1;
    return c;
  }, [items]);
  const shown = tab === 'all' ? items : items.filter((it) => it.kind === tab);

  const handleDownload = async (meme, e) => {
    if (e) e.stopPropagation();
    const ext = meme.kind === 'gif' ? 'gif' : 'png';
    const full = onResolveFullImage ? await onResolveFullImage(meme) : thumbOf(meme);
    await downloadImageHelper(full, `${fileBase(meme.name, meme.kind || 'meme')}-${Date.now()}.${ext}`);
  };

  const handleEdit = async (meme, e) => {
    if (e) e.stopPropagation();
    const fullUrl = onResolveFullImage ? await onResolveFullImage(meme) : (meme.rawImageUrl || meme.imageUrl);
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
      imageLayers: meme.imageLayers || []
    };
    if (onSelectMeme) {
      onSelectMeme(editTemplate);
    }
  };

  const handleDelete = (id, e) => {
    if (e) e.stopPropagation();
    onDeleteMeme(id);
    if (selectedMemeForView?.id === id) {
      setSelectedMemeForView(null);
    }
  };

  // An empty tab's button: that kind's maker (App), else the templates.
  const make = (kind) => {
    if (onMake) onMake(kind);
    else if (onBrowseTemplates) onBrowseTemplates();
    else if (onSelectMeme) onSelectMeme(null);
  };

  const viewing = selectedMemeForView;
  const viewingKind = viewing && KINDS[viewing.kind] ? viewing.kind : 'meme';
  const TabIcon = tab === 'all' ? LayoutGrid : KINDS[tab].Icon;

  return (
    <div className="my-gallery mg animate-fade-in">
      <header className="mg-head">
        <h2 className="mg-title">My Studio</h2>
        {galleryReady !== false && items.length > 0 && (
          <p className="mg-sub">{items.length} saved on this device</p>
        )}
      </header>

      {galleryReady === false ? (
        <div className="mg-empty" role="status">
          <h3 className="mg-empty-title">Loading gallery…</h3>
        </div>
      ) : items.length === 0 ? (
        <div className="mg-empty">
          <span className="mg-empty-icon" aria-hidden="true"><LayoutGrid size={26} /></span>
          <h3 className="mg-empty-title">No Saved Memes Yet</h3>
          <p className="mg-empty-text">Memes, stickers, GIFs and videos you save show up here, each under its own tab.</p>
          <button type="button" className="mg-btn mg-btn--primary" onClick={() => make('meme')}>
            Make a meme
          </button>
        </div>
      ) : (
        <>
          <div className="mg-tabs" role="tablist" aria-label="Saved">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                className={`mg-tab ${tab === t ? 'is-active' : ''}`}
                onClick={(e) => {
                  setTab(t);
                  e.currentTarget.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
                }}
              >
                {t === 'all' ? 'All' : KINDS[t].plural}
                <span className="mg-tab-count">{counts[t]}</span>
              </button>
            ))}
          </div>

          {shown.length === 0 ? (
            <div className="mg-empty mg-empty--tab">
              <span className={`mg-empty-icon mg-empty-icon--${tab}`} aria-hidden="true"><TabIcon size={24} /></span>
              <h3 className="mg-empty-title">No {KINDS[tab].plural.toLowerCase()} yet</h3>
              <button type="button" className="mg-btn mg-btn--primary" onClick={() => make(tab)}>
                {KINDS[tab].make}
              </button>
            </div>
          ) : (
            <div className="mg-grid" role="tabpanel" aria-label={tab === 'all' ? 'All' : KINDS[tab].plural}>
              {shown.map((it) => {
                const { Icon, label } = KINDS[it.kind];
                const open = () => (it.video ? setVideoForView(it.video) : setSelectedMemeForView(it.meme));
                const remove = (e) => {
                  e.stopPropagation();
                  if (it.video) onDeleteVideo?.(it.id);
                  else handleDelete(it.id, e);
                };
                return (
                  // The whole tile opens it; the picture is the keyboard's way in.
                  <div key={`${it.kind}-${it.id}`} className={`mg-tile mg-tile--${it.kind}`} onClick={open}>
                    <button type="button" className="mg-tile-pic" aria-label={`Open ${it.name}`}>
                      {it.thumb ? <img src={it.thumb} alt="" decoding="async" loading="lazy" /> : <Icon size={28} aria-hidden="true" />}
                      {tab === 'all' && (
                        <span className={`mg-kind mg-kind--${it.kind}`}><Icon size={12} strokeWidth={2.4} /> {label}</span>
                      )}
                      {it.video && (
                        <span className="mg-tile-time"><Play size={10} fill="currentColor" /> {clock(it.video.durationMs)}</span>
                      )}
                    </button>
                    <div className="mg-tile-info">
                      <div className="mg-tile-text">
                        <h4 className="mg-tile-name" title={it.name}>{it.name}</h4>
                        <span className="mg-tile-date">{day(it.date)}</span>
                      </div>
                      <button
                        type="button"
                        className="mg-tile-delete"
                        onClick={remove}
                        title={`Delete ${label}`}
                        aria-label={`Delete ${it.name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {videoForView && (
        <VideoViewer
          video={videoForView}
          onClose={() => setVideoForView(null)}
          onOpen={(v) => { setVideoForView(null); onOpenVideo?.(v); }}
          onDelete={(id) => { setVideoForView(null); onDeleteVideo?.(id); }}
          onGetFile={onGetVideoFile}
        />
      )}

      {viewing && (
        <Viewer title={viewing.name} kind={viewingKind} onClose={() => setSelectedMemeForView(null)}>
          <div className={`mg-viewer-pic mg-viewer-pic--${viewingKind}`}>
            <img className="mg-viewer-media" src={fullViewUrl || thumbOf(viewing)} alt={viewing.name} decoding="async" />
          </div>
          <div className="mg-viewer-actions">
            {viewingKind !== 'gif' && (
              <button type="button" className="mg-btn mg-btn--primary" onClick={(e) => handleEdit(viewing, e)}>
                <Edit3 size={16} /> Re-Edit
              </button>
            )}
            <button type="button" className={`mg-btn ${viewingKind === 'gif' ? 'mg-btn--primary' : ''}`} onClick={(e) => handleDownload(viewing, e)}>
              <Download size={16} /> Download
            </button>
            <button type="button" className="mg-btn mg-btn--danger" onClick={(e) => handleDelete(viewing.id, e)}>
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </Viewer>
      )}
    </div>
  );
}
