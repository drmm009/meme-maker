import React, { useEffect, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { X, Share, Play, Pause, Undo2, Redo2, ChevronUp, ChevronDown, Download, Copy, Check, History, ImagePlay, LoaderCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CanvasPreview from './CanvasPreview';
import TimelinePanel from './timeline/TimelinePanel';
import ToolRail from './ToolRail';
import AddMedia from './AddMedia';
import ExportReadyCard from './ExportReadyCard';
import { useEditorStore } from '../../store/useVideoEditorStore';
import { exportVideoFFmpeg, cancelExport } from '../../utils/ffmpegExport';
import { ExportCancelledError, formatEta } from '../../utils/exportProgress';
import AspectRatioDropdown from '../AspectRatioDropdown';
import { useAudioPlaybackSync } from './useAudioPlaybackSync';
import { usePlaybackLoop, togglePlayback } from './usePlaybackLoop';
import { useVideoDraft } from './useVideoDraft';
import { formatClock, getContentEnd } from './timeline/timelineMath';
import './video-editor.css';

const VIDEO_ASPECT_RATIOS = [
  { value: 16 / 9, label: '16:9' },
  { value: 9 / 16, label: '9:16' },
  { value: 1 / 1, label: '1:1' },
  { value: 4 / 3, label: '4:3' },
];

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

export default function VideoEditor({ template, onBack }) {
  const isPlaying = useEditorStore((s) => s.isPlaying);
  const canvasAspectRatio = useEditorStore((s) => s.canvasAspectRatio);
  const isExporting = useEditorStore((s) => s.isExporting);
  const exportProgress = useEditorStore((s) => s.exportProgress);
  const hasItems = useEditorStore((s) => s.items.length > 0);
  const busy = useEditorStore((s) => s.busy);
  const canUndo = useStore(useEditorStore.temporal, (s) => s.pastStates.length > 0);
  const canRedo = useStore(useEditorStore.temporal, (s) => s.futureStates.length > 0);
  const { undo, redo } = useEditorStore.temporal.getState();

  const [mode, setMode] = useState('edit');
  const [menuOpen, setMenuOpen] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [exportFormat, setExportFormat] = useState('mp4');
  const [exportInfo, setExportInfo] = useState({ phase: 'preparing', etaSec: null });
  const [exported, setExported] = useState(null); // { blob, fileName } of the last finished export
  const addRef = useRef(null);
  const menuRef = useRef(null);

  usePlaybackLoop();

  // Template hand-off
  useEffect(() => {
    if (!template?.id) return;
    const store = useEditorStore.getState();
    store.clearItems();
    store.setLayoutSlots(template.slots || []);
    if (template.category === 'custom') return;
    if (template.type === 'video') {
      store.addItem({
        type: 'video', url: template.videoUrl, thumbnailUrl: template.thumbnailUrl, name: template.name,
        durationMs: template.durationMs || 10000, width: template.width, height: template.height
      });
      (template.defaultCaptions || []).forEach((cap) => store.addItem({ type: 'text', ...cap }));
    } else {
      store.addItem({ type: 'image', url: template.imageUrl, name: template.name });
    }
  }, [template?.id]);

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

  const handleExport = async (format = 'mp4') => {
    setMenuOpen(false);
    setExportFormat(format);
    setExportInfo({ phase: 'preparing', etaSec: null });
    const store = useEditorStore.getState();
    store.setIsExporting(true);
    store.setExportProgress(0);
    try {
      const result = await exportVideoFFmpeg(
        store.items || [],
        getContentEnd(store.items || [], store.duration || 7000),
        store.canvasAspectRatio || 16 / 9,
        store.canvasDimensions || { width: 800, height: 600 },
        store.layoutId,
        (progress, info) => {
          useEditorStore.getState().setExportProgress(progress);
          if (info) setExportInfo(info);
        },
        { format, backgroundColor: store.backgroundColor, download: false }
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

  const deselectOnBackground = (e) => {
    if (e.target === e.currentTarget) useEditorStore.getState().setActiveItem(null);
  };

  return (
    <div className={`vt-editor is-${mode}`}>
      <AudioSync />

      <section className="vt-stage" onPointerDown={deselectOnBackground}>
        <div
          className="vt-stage-frame video-canvas-area"
          style={{ '--canvas-aspect-ratio': canvasAspectRatio }}
          onPointerDown={deselectOnBackground}
        >
          <CanvasPreview />
          {!hasItems && (
            <button type="button" className="vt-stage-empty" onClick={() => addRef.current?.open('video')}>
              <span className="vt-stage-empty-icon"><Play size={22} /></span>
              <span className="vt-stage-empty-title">Start with a video or photo</span>
              <span className="vt-stage-empty-sub">Or add text, stickers and sounds from the tools below.</span>
            </button>
          )}
          {mode === 'edit' && (
            <button type="button" className="vt-collapse" onClick={() => setMode('preview')} aria-label="Full screen preview">
              <ChevronDown size={22} strokeWidth={2.5} />
            </button>
          )}
        </div>

        <button type="button" className="vt-fab vt-fab--close" onClick={onBack} aria-label="Close editor">
          <X size={22} strokeWidth={2.5} />
        </button>

        <div className="vt-ratio">
          <AspectRatioDropdown value={canvasAspectRatio} options={VIDEO_ASPECT_RATIOS} onChange={changeAspectRatio} />
        </div>

        <div className="vt-export" ref={menuRef}>
          <button
            type="button"
            className="vt-fab vt-fab--export"
            onClick={() => setMenuOpen((o) => !o)}
            disabled={isExporting || Boolean(busy)}
            aria-label="Export"
            aria-expanded={menuOpen}
          >
            {exportDone ? <Check size={22} strokeWidth={2.5} /> : <Share size={21} strokeWidth={2.4} />}
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
                <button type="button" className="vt-menu-item" onClick={() => handleExport('mp4')}><Download size={16} /> Export video</button>
                <button type="button" className="vt-menu-item" onClick={() => handleExport('gif')}><ImagePlay size={16} /> Export GIF</button>
                <button type="button" className="vt-menu-item" onClick={() => { setMenuOpen(false); copyFrame(); }}><Copy size={16} /> Copy frame</button>
              </motion.div>
            )}
          </AnimatePresence>
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

        {mode === 'preview' && (
          <button type="button" className="vt-edit-handle" onClick={() => setMode('edit')}>
            <span>Edit</span>
            <ChevronUp size={20} strokeWidth={2.5} />
          </button>
        )}

        {exported && !isExporting && <ExportReadyCard result={exported} onClose={() => setExported(null)} />}

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
          {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" style={{ marginLeft: 3 }} />}
        </button>
        <div className="vt-history">
          <button type="button" className="vt-icon-btn" onClick={() => undo()} disabled={!canUndo} aria-label="Undo"><Undo2 size={24} /></button>
          <button type="button" className="vt-icon-btn" onClick={() => redo()} disabled={!canRedo} aria-label="Redo"><Redo2 size={24} /></button>
        </div>
      </div>

      <div className="vt-timeline-wrap" aria-hidden={mode !== 'edit'}>
        <TimelinePanel onAddVideo={() => addRef.current?.open('video')} />
      </div>

      <ToolRail onAdd={(kind) => addRef.current?.open(kind)} />
      <AddMedia ref={addRef} />
    </div>
  );
}
