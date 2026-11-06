import React, { useEffect, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { X, Share, Play, Pause, Undo2, Redo2, ChevronLeft, ChevronUp, ChevronDown, Copy, Check, History, ImagePlay, LoaderCircle, FolderHeart, SquarePlay } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CanvasPreview from './CanvasPreview';
import TimelinePanel from './timeline/TimelinePanel';
import ToolRail from './ToolRail';
import AddMedia from './AddMedia';
import ExportReadyCard from './ExportReadyCard';
import StartPrompt from './StartPrompt';
import { useEditorStore } from '../../store/useVideoEditorStore';
import { exportVideoFFmpeg, cancelExport } from '../../utils/ffmpegExport';
import { ExportCancelledError, formatEta } from '../../utils/exportProgress';
import SizeMenu from '../ui/SizeMenu';
import { useAudioPlaybackSync } from './useAudioPlaybackSync';
import { usePlaybackLoop, togglePlayback } from './usePlaybackLoop';
import { useVideoDraft } from './useVideoDraft';
import { loadSavedVideo, restoreProject, saveVideoToStudio } from '../../utils/videoDraftStore';
import { formatClock, getContentEnd } from './timeline/timelineMath';
import { withWatermark } from '../../utils/brandCard';
import { loadVideoFonts } from './videoFonts';
import { DEFAULT_TEXT_LOOK } from '../../utils/textBitmap';
import '../ui/ui.css';
import './video-editor.css';

// The canvas shapes, named like the image editor's (where each fits), with an outline w x h.
const VIDEO_SIZES = [
  { value: '1:1', ratio: 1, label: '1:1', name: 'Facebook', sub: '1:1', title: 'Square', w: 22, h: 22 },
  { value: '4:3', ratio: 4 / 3, label: '4:3', name: 'Classic', sub: '4:3', title: 'Classic', w: 24, h: 18 },
  { value: '9:16', ratio: 9 / 16, label: '9:16', name: 'Reels & TikTok', sub: '9:16', title: 'Story', w: 16, h: 28 },
  { value: '16:9', ratio: 16 / 9, label: '16:9', name: 'YouTube', sub: '16:9', title: 'Video', w: 30, h: 17 },
];
const sizeOf = (ratio) => VIDEO_SIZES.find((s) => Math.abs(s.ratio - ratio) < 0.01)?.value ?? null;

// Kept in their own components so the per-frame playhead updates don't re-render the editor.
function AudioSync() {
  const items = useEditorStore((s) => s.items);
  useAudioPlaybackSync(items);
  return null;
}

function Clock() {
  const playhead = useEditorStore((s) => s.draggingTime ?? s.playhead);
  const end = useEditorStore((s) => getContentEnd(s.items, 0));
  return (
    <div className="vt-clock">
      <span className="vt-clock-now">{formatClock(playhead)}</span>
      <span className="vt-clock-total"> / {formatClock(end)}</span>
    </div>
  );
}

const timeAgo = (ms) => {
  const min = Math.round((Date.now() - ms) / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
};

const changeAspectRatio = (newRatio) => {
  const store = useEditorStore.getState();
  const oldRatio = store.canvasAspectRatio;
  store.setCanvasAspectRatio(newRatio);
  if (store.layoutSlots?.length) {
    const scaleY = (800 / newRatio) / (800 / oldRatio);
    store.setLayoutSlots(store.layoutSlots.map((slot) => ({ ...slot, y: slot.y * scaleY, height: slot.height * scaleY })));
  }
};

const copyFrame = () => {
  const el = document.querySelector('.video-canvas-area canvas');
  el?.toBlob(async (blob) => {
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    } catch (e) {
      console.warn(e);
    }
  });
};

// A small still of the preview for the video's card in My Studio (the selection box hidden first).
const frameThumbnail = async (maxSide = 320) => {
  useEditorStore.getState().setActiveItem(null);
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const src = document.querySelector('.video-canvas-area canvas');
  if (!src?.width) return '';
  const scale = Math.min(1, maxSide / Math.max(src.width, src.height));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(src.width * scale));
  c.height = Math.max(1, Math.round(src.height * scale));
  try {
    c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.75);
  } catch {
    return '';
  }
};

export default function VideoEditor({ template, onBack, onSaved }) {
  const isPlaying = useEditorStore((s) => s.isPlaying);
  const canvasAspectRatio = useEditorStore((s) => s.canvasAspectRatio);
  const isExporting = useEditorStore((s) => s.isExporting);
  const exportProgress = useEditorStore((s) => s.exportProgress);
  const hasItems = useEditorStore((s) => s.items.length > 0);
  const busy = useEditorStore((s) => s.busy);
  const canUndo = useStore(useEditorStore.temporal, (s) => s.pastStates.length > 0);
  const canRedo = useStore(useEditorStore.temporal, (s) => s.futureStates.length > 0);
  const { undo, redo } = useEditorStore.temporal.getState();

  // The timeline starts closed; the Edit button beside play opens it.
  const [mode, setMode] = useState('preview');
  const [menuOpen, setMenuOpen] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [exportFormat, setExportFormat] = useState('mp4');
  const [exportInfo, setExportInfo] = useState({ phase: 'preparing', etaSec: null });
  const [exported, setExported] = useState(null); // { blob, fileName } of the last finished export
  const addRef = useRef(null);
  const menuRef = useRef(null);
  // The My Studio video this editor saves over (opened from My Studio, or saved once already).
  const savedIdRef = useRef(null);

  usePlaybackLoop();

  // Fonts people uploaded (in either editor): registered with the page for the text sheets' font
  // list, then the text drawn again in them.
  useEffect(() => {
    loadVideoFonts();
  }, []);

  // Template hand-off: runs once per template (reading the latest one through a ref).
  const templateRef = useRef(template);
  templateRef.current = template;
  const templateId = template?.id;
  useEffect(() => {
    const template = templateRef.current;
    if (!template?.id) return;
    const store = useEditorStore.getState();
    store.clearItems();
    store.setLayoutSlots(template.slots || []);
    savedIdRef.current = template.savedVideoId || null;
    if (template.savedVideoId) {
      // A video from My Studio: its project, with its files given fresh URLs.
      loadSavedVideo(template.savedVideoId).then((saved) => {
        if (!saved) return;
        const project = restoreProject(saved.video, saved.media, (blob) => URL.createObjectURL(blob));
        useEditorStore.setState({ watermark: null, ...project, playhead: 0, isPlaying: false, activeItemId: null });
        useEditorStore.temporal.getState().clear();
      }).catch((e) => console.warn('[video] could not open the saved video', e));
      return;
    }
    if (template.category === 'custom') return;
    if (template.type === 'video') {
      store.addItem({
        type: 'video', url: template.videoUrl, thumbnailUrl: template.thumbnailUrl, name: template.name,
        durationMs: template.durationMs || 10000, width: template.width, height: template.height
      });
      // Template captions give their words and size; the outline and font are the usual ones.
      (template.defaultCaptions || []).forEach((cap) => store.addItem({ type: 'text', ...DEFAULT_TEXT_LOOK, ...cap }));
    } else {
      store.addItem({ type: 'image', url: template.imageUrl, name: template.name });
    }
  }, [templateId]);

  const draft = useVideoDraft();

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDown = (e) => { if (!menuRef.current?.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [menuOpen]);

  // Space plays/pauses, Delete removes the selected clip (not while typing).
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayback();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        const { activeItemId, removeItem } = useEditorStore.getState();
        if (activeItemId) removeItem(activeItemId);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleExport = async (format = 'mp4', resolution = 720) => {
    setMenuOpen(false);
    setExportFormat(format);
    setExportInfo({ phase: 'preparing', etaSec: null });
    const store = useEditorStore.getState();
    store.setIsExporting(true);
    store.setExportProgress(0);
    try {
      const endMs = getContentEnd(store.items || [], store.duration || 7000);
      const result = await exportVideoFFmpeg(
        withWatermark(store.items || [], store.watermark, endMs, store.canvasAspectRatio || 16 / 9),
        endMs,
        store.canvasAspectRatio || 16 / 9,
        store.canvasDimensions || { width: 800, height: 600 },
        store.layoutId,
        (progress, info) => {
          useEditorStore.getState().setExportProgress(progress);
          if (info) setExportInfo(info);
        },
        { format, resolution, backgroundColor: store.backgroundColor, layoutSlots: store.layoutSlots, download: false }
      );
      setExported(result);
      setExportDone(true);
      setTimeout(() => setExportDone(false), 3000);
    } catch (err) {
      if (!(err instanceof ExportCancelledError)) {
        console.error(err);
        alert('Export failed: ' + err.message);
      }
    } finally {
      useEditorStore.getState().setIsExporting(false);
      useEditorStore.getState().setExportProgress(0);
    }
  };

  // Saves the project (and the exported file, from the ready card) to My Studio, over the same
  // video when this one was saved or opened from there before.
  const saveToStudio = async (exportBlob = null) => {
    setMenuOpen(false);
    const store = useEditorStore.getState();
    if (!store.items.length) return;
    store.setBusy('Saving to My Studio…');
    try {
      const meta = await saveVideoToStudio(useEditorStore.getState(), {
        id: savedIdRef.current,
        thumbnail: await frameThumbnail(),
        durationMs: getContentEnd(store.items, 0),
        exportBlob,
      });
      savedIdRef.current = meta.id;
      onSaved?.(meta);
      useEditorStore.getState().setBusy('Saved to My Studio');
    } catch (e) {
      console.error(e);
      useEditorStore.getState().setBusy('Couldn’t save. Try again.');
    }
    setTimeout(() => {
      const { busy, setBusy } = useEditorStore.getState();
      if (busy && !busy.endsWith('…')) setBusy(null);
    }, 2200);
  };

  const deselectOnBackground = (e) => {
    if (e.target === e.currentTarget) useEditorStore.getState().setActiveItem(null);
  };

  return (
    <div className={`vt-editor ui-theme is-${mode}`}>
      <AudioSync />

      <section className="vt-stage" onPointerDown={deselectOnBackground}>
        <div
          className="vt-stage-frame video-canvas-area"
          style={{ '--canvas-aspect-ratio': canvasAspectRatio }}
          onPointerDown={deselectOnBackground}
        >
          <CanvasPreview>
            {!hasItems && mode === 'preview' && <StartPrompt onPick={(kind) => addRef.current?.open(kind)} />}
          </CanvasPreview>
        </div>

        <button type="button" className="ui-icon-btn ui-topbar-back vt-back" onClick={onBack} aria-label="Back" title="Back">
          <ChevronLeft size={22} strokeWidth={2.3} />
        </button>

        {/* Undo and redo, then the canvas size (while the timeline is closed), then Export. */}
        <div className="vt-top-actions">
          <div className="vt-history">
            <button type="button" className="vt-icon-btn" onClick={() => undo()} disabled={!canUndo} aria-label="Undo" title="Undo"><Undo2 size={19} /></button>
            <button type="button" className="vt-icon-btn" onClick={() => redo()} disabled={!canRedo} aria-label="Redo" title="Redo"><Redo2 size={19} /></button>
          </div>
          {mode === 'preview' && (
            <div className="vt-ratio">
              <SizeMenu sizes={VIDEO_SIZES} value={sizeOf(canvasAspectRatio)} onPick={(v) => changeAspectRatio(VIDEO_SIZES.find((s) => s.value === v).ratio)} />
            </div>
          )}
          <div className="vt-export" ref={menuRef}>
            <button
              type="button"
              className="ui-btn-accent vt-export-btn"
              onClick={() => setMenuOpen((o) => !o)}
              disabled={isExporting || Boolean(busy)}
              aria-label="Export"
              aria-expanded={menuOpen}
            >
              {exportDone ? <Check size={17} strokeWidth={2.5} aria-hidden="true" /> : <Share size={16} strokeWidth={2.4} aria-hidden="true" />}
              Export
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  className="vt-menu"
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                >
                  {/* What to export as, then keeping the project and grabbing a still. */}
                  <p className="vt-menu-head">Export as</p>
                  <button type="button" className="vt-menu-item" onClick={() => handleExport('mp4', 720)}>
                    <SquarePlay size={17} /> <span className="vt-menu-label">Video<small>720p · faster</small></span>
                  </button>
                  <button type="button" className="vt-menu-item" onClick={() => handleExport('mp4', 1080)}>
                    <SquarePlay size={17} /> <span className="vt-menu-label">Video HD<small>1080p · sharper, slower</small></span>
                  </button>
                  <button type="button" className="vt-menu-item" onClick={() => handleExport('gif')}>
                    <ImagePlay size={17} /> <span className="vt-menu-label">GIF<small>Loops, no sound</small></span>
                  </button>
                  <div className="vt-menu-divider" role="separator" />
                  <button type="button" className="vt-menu-item" onClick={() => saveToStudio()}>
                    <FolderHeart size={17} /> <span className="vt-menu-label">Save to My Studio<small>Keep editing later</small></span>
                  </button>
                  <button type="button" className="vt-menu-item" onClick={() => { setMenuOpen(false); copyFrame(); }}><Copy size={17} /> Copy this frame</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {busy && (
          <div className="vt-busy" role="status">
            {/…$/.test(busy) && <LoaderCircle size={16} className="vt-spin" aria-hidden="true" />}
            <span>{busy}</span>
          </div>
        )}

        {draft.offer && (
          <div className="vt-draft" role="status">
            <History size={16} aria-hidden="true" />
            <span className="vt-draft-text">
              Continue your last video?
              <small>{draft.offer.clips} {draft.offer.clips === 1 ? 'clip' : 'clips'} · {timeAgo(draft.offer.savedAt)}</small>
            </span>
            <button type="button" className="vt-draft-restore" onClick={draft.restore}>Restore</button>
            <button type="button" className="vt-draft-close" onClick={draft.dismiss} aria-label="Dismiss"><X size={16} /></button>
          </div>
        )}

        {exported && !isExporting && <ExportReadyCard result={exported} onClose={() => setExported(null)} onSaveToStudio={() => saveToStudio(exported.blob)} />}

        {isExporting && (
          <div className="vt-export-overlay" role="status">
            <div className="vt-export-ring" style={{ '--p': Math.round(exportProgress) }}>
              <span>{Math.round(exportProgress)}%</span>
            </div>
            <p className="vt-export-phase">
              {exportInfo.phase === 'preparing'
                ? 'Preparing your media…'
                : exportFormat === 'gif' ? 'Making your GIF…' : 'Rendering your video…'}
            </p>
            <p className="vt-export-eta">{formatEta(exportInfo.etaSec) || ' '}</p>
            <button type="button" className="vt-export-cancel" onClick={cancelExport}>Cancel</button>
          </div>
        )}
      </section>

      <div className="vt-transport">
        <Clock />
        <button type="button" className="vt-play" onClick={togglePlayback} aria-label={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" style={{ marginLeft: 2 }} />}
        </button>
        {/* Opens the timeline up out of the bottom bar, and puts it away again. */}
        <button type="button" className="vt-mode-btn" onClick={() => setMode(mode === 'edit' ? 'preview' : 'edit')} aria-expanded={mode === 'edit'}>
          <span>{mode === 'edit' ? 'Done' : 'Edit'}</span>
          {mode === 'edit' ? <ChevronDown size={19} strokeWidth={2.5} aria-hidden="true" /> : <ChevronUp size={19} strokeWidth={2.5} aria-hidden="true" />}
        </button>
      </div>

      <div className="vt-timeline-wrap" aria-hidden={mode !== 'edit'}>
        <TimelinePanel onAddVideo={() => addRef.current?.open('video')} />
      </div>

      <ToolRail onAdd={(kind) => addRef.current?.open(kind)} />
      <AddMedia ref={addRef} />
    </div>
  );
}
