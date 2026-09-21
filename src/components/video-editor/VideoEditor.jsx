import React, { useRef, useEffect, useState } from 'react';
import { useStore } from 'zustand';
import {
  Play, Pause, SkipBack, Download, Trash2, VolumeX, Volume2,
  ArrowLeft, Maximize, Crop, Minimize, Undo, Redo,
  ChevronDown, ChevronUp, Type, Share2, Copy, Save, Check,
  Video as VideoIcon
} from 'lucide-react';
import Timeline from './Timeline';
import CanvasPreview from './CanvasPreview';
import { useEditorStore } from '../../store/useVideoEditorStore';
import { exportVideoFFmpeg } from '../../utils/ffmpegExport';
import { FONTS } from '../../data/stickers';
import './video-editor.css';
import AspectRatioDropdown from '../AspectRatioDropdown';
import { useAudioPlaybackSync } from './useAudioPlaybackSync';
import { motion, AnimatePresence } from 'framer-motion';

const getContrastStroke = (hexColor) => {
  if (!hexColor) return '#000000';
  hexColor = hexColor.replace('#', '');
  if (hexColor.length === 3) hexColor = hexColor.split('').map(c => c + c).join('');
  const r = parseInt(hexColor.substr(0, 2), 16) || 0;
  const g = parseInt(hexColor.substr(2, 2), 16) || 0;
  const b = parseInt(hexColor.substr(4, 2), 16) || 0;
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance < 0.5 ? '#ffffff' : '#000000';
};

const PlayheadDisplay = ({ isTimelineFolded }) => {
  const playhead = useEditorStore(state => state.playhead);
  const draggingTime = useEditorStore(state => state.draggingTime);
  const activeItemId = useEditorStore(state => state.activeItemId);
  
  // Only vanish if an item is selected AND the timeline is not folded.
  if (activeItemId && !isTimelineFolded) return null;
  return (
    <div style={{
      fontFamily: '"SF Mono", "Roboto Mono", monospace',
      fontSize: '0.85rem',
      fontWeight: 500,
      color: '#e2e8f0', // soft white
      background: 'transparent',
      padding: '0',
      letterSpacing: '0.05em',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '60px'
    }}>
      <span style={{ color: 'var(--cyber-cyan, #67e8f9)', marginRight: '2px' }}>
        {((draggingTime !== null ? draggingTime : playhead) / 1000).toFixed(2)}
      </span>
      <span style={{ opacity: 0.5, fontSize: '0.75rem' }}>s</span>
    </div>
  );
};

const VIDEO_ASPECT_RATIOS = [
  { value: 16/9, label: '16:9' },
  { value: 9/16, label: '9:16' },
  { value: 1/1,  label: '1:1'  },
  { value: 4/3,  label: '4:3'  },
];

export default function VideoEditor({ template, onBack, theme, onToggleTheme }) {
  const {
    isPlaying, setIsPlaying, addItem, canvasAspectRatio, setCanvasAspectRatio,
    isExporting, exportProgress, setIsExporting, setExportProgress,
    activeItemId, removeItem, items, updateItem, clearItems,
    canvasDimensions, setLayoutSlots, playhead
  } = useEditorStore();

  useAudioPlaybackSync(items, isPlaying, playhead);

  const pastStates   = useStore(useEditorStore.temporal, s => s.pastStates);
  const futureStates = useStore(useEditorStore.temporal, s => s.futureStates);
  const undo         = useStore(useEditorStore.temporal, s => s.undo);
  const redo         = useStore(useEditorStore.temporal, s => s.redo);

  const canvasPreviewRef   = useRef(null);
  const exportDropdownRef  = useRef(null);

  const [isTimelineFolded, setIsTimelineFolded]   = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [exportDone, setExportDone]               = useState(false);

  const activeItem = items.find(i => i.id === activeItemId);

  // Close export dropdown on outside click
  useEffect(() => {
    if (!exportDropdownOpen) return;
    const handler = (e) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) {
        setExportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [exportDropdownOpen]);

  // Deselect items on global click (non-canvas, non-timeline)
  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (e.target.tagName.toLowerCase() === 'canvas') return;
      if (e.target.closest('.timeline-item-clip')) return;
      if (e.target.closest('button, select, input, textarea')) return;
      useEditorStore.getState().setActiveItem(null);
    };
    window.addEventListener('pointerdown', handleGlobalClick);
    return () => window.removeEventListener('pointerdown', handleGlobalClick);
  }, []);

  // Template hand-off
  useEffect(() => {
    if (template?.id) {
      clearItems();
      setLayoutSlots(template.slots || []);
      if (template.category !== 'custom') {
        if (template.type === 'video') {
          addItem({
            type: 'video',
            url: template.videoUrl,
            thumbnailUrl: template.thumbnailUrl,
            name: template.name,
            durationMs: template.durationMs || 10000,
            width: template.width,
            height: template.height
          });
          // Add default captions if the template ships with them
          if (template.defaultCaptions && template.defaultCaptions.length > 0) {
            template.defaultCaptions.forEach(cap => addItem({ type: 'text', ...cap }));
          }
        } else {
          addItem({ type: 'image', url: template.imageUrl, name: template.name });
        }
      }
    }
  }, [template?.id]);

  const handleExport = async () => {
    setExportDropdownOpen(false);
    setIsExporting(true);
    setExportProgress(0);
    try {
      const state = useEditorStore.getState();
      const validEndTimes = (state.items || []).map(i => i.endMs).filter(t => typeof t === 'number' && !isNaN(t) && t > 0);
      const maxEndMs = validEndTimes.length > 0 ? Math.max(...validEndTimes) : (state.duration || 7000);
      await exportVideoFFmpeg(
        state.items || [],
        maxEndMs,
        state.canvasAspectRatio || (16 / 9),
        state.canvasDimensions || { width: 800, height: 600 },
        state.layoutId,
        (progress) => setExportProgress(progress)
      );
      setIsExporting(false);
      setExportProgress(0);
      setExportDone(true);
      setTimeout(() => setExportDone(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Export failed: ' + err.message);
      setIsExporting(false);
    }
  };

  // Glass button style matching MemeEditor undo/redo
  const glassIconBtn = (disabled) => ({
    opacity: disabled ? 0.4 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    padding: '8px',
    color: 'currentColor',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  });

  const mobileCanvasHeightVh = Math.min(52, Math.max(28, Math.round(45 / Math.max(0.3, canvasAspectRatio))));

  return (
    <div className="meme-editor-container animate-fade-in video-editor-container">

      {/* ── Top Header ─────────────────────────────── */}
      <div className="editor-topbar glass-card flex-between">

        {/* Left: Back + Undo/Redo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="btn btn-ghost btn-xs" onClick={onBack}>
            <ArrowLeft className="icon-sm" /> <span className="desktop-only">Back</span>
          </button>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className="btn btn-icon btn-xs hover-lift"
              onClick={() => undo()}
              disabled={pastStates.length === 0}
              title="Undo"
              style={glassIconBtn(pastStates.length === 0)}
            >
              <Undo className="icon-xs" />
            </button>
            <button
              className="btn btn-icon btn-xs hover-lift"
              onClick={() => redo()}
              disabled={futureStates.length === 0}
              title="Redo"
              style={glassIconBtn(futureStates.length === 0)}
            >
              <Redo className="icon-xs" />
            </button>
          </div>
        </div>

        {/* Center: Title */}
        <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <VideoIcon style={{ width: 16, height: 16, color: 'var(--cyber-cyan, #67e8f9)' }} />
          <span style={{ fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.03em', color: 'var(--text-main)' }}>
            Video Editor
          </span>
        </div>

        {/* Right: Aspect Ratio + Export Dropdown */}
        <div className="header-actions flex-gap" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AspectRatioDropdown
            value={canvasAspectRatio}
            options={VIDEO_ASPECT_RATIOS}
            onChange={(newRatio) => {
              const store = useEditorStore.getState();
              const oldRatio = store.canvasAspectRatio;
              store.setCanvasAspectRatio(newRatio);
              if (store.layoutSlots && store.layoutSlots.length > 0) {
                const scaleY = (800 / newRatio) / (800 / oldRatio);
                store.setLayoutSlots(store.layoutSlots.map(slot => ({
                  ...slot,
                  y: slot.y * scaleY,
                  height: slot.height * scaleY
                })));
              }
            }}
          />

          {/* Export Dropdown */}
          <div style={{ position: 'relative' }} ref={exportDropdownRef}>
            <motion.button
              className="btn btn-primary shadow-glow btn-xs"
              whileTap={{ scale: 0.95 }}
              onClick={() => setExportDropdownOpen(p => !p)}
              disabled={isExporting}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: isExporting ? 0.6 : 1 }}
            >
              {exportDone ? <Check className="icon-xs" /> : <Download className="icon-xs" />}
              <span>{isExporting ? `${Math.round(exportProgress)}%` : exportDone ? 'Done!' : 'Export'}</span>
              <ChevronDown className="icon-xs" style={{ transition: 'transform 0.2s', transform: exportDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </motion.button>

            <AnimatePresence>
              {exportDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    minWidth: '190px',
                    background: 'rgba(14, 14, 22, 0.95)',
                    backdropFilter: 'blur(24px)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '14px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
                    zIndex: 9999,
                    overflow: 'hidden',
                    padding: '6px'
                  }}
                >
                  {[
                    { icon: <Download style={{ width: 15, height: 15 }} />, label: 'Export Video', action: handleExport },
                    { icon: <Copy    style={{ width: 15, height: 15 }} />, label: 'Copy Frame',  action: async () => {
                      setExportDropdownOpen(false);
                      const canvas = canvasPreviewRef.current?.getStream ? null : null;
                      // fallback: grab current canvas snapshot
                      const el = document.querySelector('.video-canvas-area canvas');
                      if (el) {
                        el.toBlob(async (blob) => {
                          try {
                            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                          } catch(e) { console.warn(e); }
                        });
                      }
                    }},
                    { icon: <Share2  style={{ width: 15, height: 15 }} />, label: 'Share',       action: () => { setExportDropdownOpen(false); handleExport(); } },
                  ].map(({ icon, label, action }, i) => (
                    <button
                      key={i}
                      onClick={action}
                      className="vid-export-menu-item"
                    >
                      {icon} {label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Main Area ───────────────────────────────── */}
      <main
        className="editor-main video-editor-main"
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) useEditorStore.getState().setActiveItem(null);
        }}
      >

        {/* Canvas Area */}
        <div
          className="canvas-wrapper canvas-area video-canvas-area"
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) useEditorStore.getState().setActiveItem(null);
          }}
          style={{
            flex: Math.max(0.4, Math.min(1.5, canvasAspectRatio)),
            '--canvas-aspect-ratio': canvasAspectRatio,
            position: 'relative'
          }}
        >
          {/* Floating Context Toolbar */}
          <AnimatePresence>
            {activeItem && isTimelineFolded && (
              <motion.div
                className={`video-context-toolbar ${canvasAspectRatio < 1 ? 'portrait' : ''}`}
                initial={{ opacity: 0, y: -10, x: '-50%' }}
                animate={{ opacity: 1, y: 0, x: '-50%' }}
                exit={{ opacity: 0, y: -10, x: '-50%' }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                {/* Video controls */}
                {activeItem.type === 'video' && (<>
                  <select
                    className="vid-ctx-select"
                    value={activeItem.playbackRate || 1}
                    onChange={(e) => updateItem(activeItem.id, { playbackRate: parseFloat(e.target.value) })}
                    title="Speed"
                  >
                    <option value={0.5}>0.5×</option>
                    <option value={1}>1×</option>
                    <option value={1.5}>1.5×</option>
                    <option value={2}>2×</option>
                  </select>
                  <button
                    className={`btn btn-icon btn-xs vid-ctx-btn ${activeItem.muted ? 'active' : ''}`}
                    onClick={() => updateItem(activeItem.id, { muted: !activeItem.muted })}
                    title={activeItem.muted ? 'Unmute' : 'Mute'}
                  >
                    {activeItem.muted ? <VolumeX style={{ width: 14, height: 14 }} /> : <Volume2 style={{ width: 14, height: 14 }} />}
                  </button>
                </>)}

                {/* Text controls */}
                {activeItem.type === 'text' && (<>
                  <button
                    className="btn btn-xs vid-ctx-btn vid-ctx-btn-font"
                    title="Next Font"
                    onClick={() => {
                      const current = activeItem.fontFamily || 'Impact, sans-serif';
                      let idx = FONTS.findIndex(f => f.family === current);
                      if (idx === -1) idx = 0;
                      const next = FONTS[(idx + 1) % FONTS.length];
                      updateItem(activeItem.id, { fontFamily: next.family });
                    }}
                    style={{ fontFamily: activeItem.fontFamily, fontSize: '0.75rem', padding: '4px 10px', maxWidth: 90, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}
                  >
                    <Type className="vid-font-icon" style={{ width: 12, height: 12, marginRight: 4, flexShrink: 0 }} />
                    <span className="vid-font-label">{(FONTS.find(f => f.family === activeItem.fontFamily) || FONTS[0]).name.split(' ')[0]}</span>
                  </button>

                  <div className="vid-ctx-btn" style={{ position: 'relative', overflow: 'hidden', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: activeItem.color || '#fff', border: '1.5px solid rgba(255,255,255,0.4)' }} />
                    <input
                      type="color"
                      value={activeItem.color || '#ffffff'}
                      onChange={e => updateItem(activeItem.id, { color: e.target.value, stroke: getContrastStroke(e.target.value) })}
                      style={{ position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer' }}
                    />
                  </div>

                  <button
                    className="btn btn-xs vid-ctx-btn"
                    title="Toggle BG"
                    onClick={() => {
                      if (!activeItem.bgColor || activeItem.bgColor === 'none') {
                        updateItem(activeItem.id, { bgColor: 'white', color: '#000000', stroke: 'transparent' });
                      } else if (activeItem.bgColor === 'white') {
                        updateItem(activeItem.id, { bgColor: 'black', color: '#ffffff', stroke: 'transparent' });
                      } else {
                        updateItem(activeItem.id, { bgColor: 'none', color: activeItem.color === '#000000' ? '#ffffff' : activeItem.color, stroke: '#000000' });
                      }
                    }}
                    style={{
                      padding: '4px 8px',
                      fontSize: '0.72rem',
                      background: activeItem.bgColor === 'white' ? '#fff' : activeItem.bgColor === 'black' ? '#000' : undefined,
                      color: activeItem.bgColor === 'white' ? '#000' : activeItem.bgColor === 'black' ? '#fff' : undefined,
                    }}
                  >
                    BG
                  </button>
                </>)}

                {/* Image controls */}
                {activeItem.type === 'image' && (<>
                  <button
                    className="btn btn-icon btn-xs vid-ctx-btn"
                    title="Fit"
                    onClick={() => {
                      const ir = (activeItem.width||200)/(activeItem.height||200);
                      const cr = canvasDimensions.width/canvasDimensions.height;
                      const s = ir > cr ? canvasDimensions.width/(activeItem.width||200) : canvasDimensions.height/(activeItem.height||200);
                      const w = (activeItem.width||200)*s, h = (activeItem.height||200)*s;
                      updateItem(activeItem.id, { x:(canvasDimensions.width-w)/2, y:(canvasDimensions.height-h)/2, scaleX:s, scaleY:s });
                    }}
                  ><Minimize style={{ width:14,height:14 }} /></button>
                  <button
                    className="btn btn-icon btn-xs vid-ctx-btn"
                    title="Crop/Cover"
                    onClick={() => {
                      const ir = (activeItem.width||200)/(activeItem.height||200);
                      const cr = canvasDimensions.width/canvasDimensions.height;
                      const s = ir > cr ? canvasDimensions.height/(activeItem.height||200) : canvasDimensions.width/(activeItem.width||200);
                      const w = (activeItem.width||200)*s, h = (activeItem.height||200)*s;
                      updateItem(activeItem.id, { x:(canvasDimensions.width-w)/2, y:(canvasDimensions.height-h)/2, scaleX:s, scaleY:s });
                    }}
                  ><Crop style={{ width:14,height:14 }} /></button>
                  <button
                    className="btn btn-icon btn-xs vid-ctx-btn"
                    title="Stretch"
                    onClick={() => updateItem(activeItem.id, {
                      x:0, y:0,
                      scaleX: canvasDimensions.width/(activeItem.width||200),
                      scaleY: canvasDimensions.height/(activeItem.height||200)
                    })}
                  ><Maximize style={{ width:14,height:14 }} /></button>
                </>)}

                {/* Shared Duplicate / Delete */}
                <div className="vid-ctx-divider" style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.2)', margin: '0 4px' }} />
                <button
                  className="btn btn-icon btn-xs vid-ctx-btn"
                  title="Duplicate"
                  onClick={() => {
                    const newItem = { ...activeItem, id: Date.now().toString(), x: (activeItem.x || 0) + 20, y: (activeItem.y || 0) + 20 };
                    useEditorStore.getState().addItem(newItem);
                  }}
                ><Copy style={{ width:14,height:14 }} /></button>
                <button
                  className="btn btn-icon btn-xs vid-ctx-btn vid-ctx-btn-delete"
                  style={{ background: 'rgba(239, 68, 68, 0.85)', color: '#ffffff', border: '1px solid rgba(239, 68, 68, 1)' }}
                  title="Delete"
                  onClick={() => {
                    useEditorStore.getState().removeItem(activeItem.id);
                    useEditorStore.getState().setActiveItem(null);
                  }}
                ><Trash2 style={{ width:14,height:14 }} /></button>
              </motion.div>
            )}
          </AnimatePresence>

          <CanvasPreview ref={canvasPreviewRef} />

          {/* Export Overlay */}
          {isExporting && (
            <div className="vid-export-overlay">
              <div className="vid-export-overlay-inner">
                <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px' }}>Rendering Video…</div>
                <div className="vid-export-progress-track">
                  <div className="vid-export-progress-fill" style={{ width: `${exportProgress}%` }} />
                </div>
                <div style={{ marginTop: '8px', fontSize: '0.85rem', opacity: 0.7 }}>{Math.round(exportProgress)}%</div>
              </div>
            </div>
          )}
        </div>

        {/* ── Timeline / Dock ─────────────────────────── */}
        <section
          className={`tools-panel glass-card timeline-section video-timeline-section${isTimelineFolded ? ' folded' : ''}`}
          style={{ flex: Math.max(0.5, Math.min(2, 1 / canvasAspectRatio)) }}
        >


          {/* Timeline content — hidden when folded on mobile */}
          <div className="timeline-content-wrap">
            {/* Playback Controls */}
            <div className="timeline-controls-wrap" style={isTimelineFolded ? { justifyContent: 'center' } : undefined}>
              <div className="vid-playback-group">
                <button
                  className="btn btn-icon vid-play-btn"
                  onClick={() => useEditorStore.getState().setPlayhead(0)}
                  title="Rewind"
                >
                  <SkipBack className="icon-sm" />
                </button>
                <button
                  className={`btn btn-icon vid-play-btn ${isPlaying ? 'playing' : ''}`}
                  onClick={() => {
                    const state = useEditorStore.getState();
                    const actualDuration = state.items.length > 0
                      ? Math.max(...state.items.map(i => i.endMs))
                      : state.duration;
                    if (!state.isPlaying) {
                      if (state.playhead >= actualDuration - 10) state.setPlayhead(0);
                      state.setIsPlaying(true);
                    } else {
                      setIsPlaying(!isPlaying);
                    }
                  }}
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="icon-sm" /> : <Play className="icon-sm" />}
                </button>
                <PlayheadDisplay isTimelineFolded={isTimelineFolded} />
              </div>

              {(!activeItem || isTimelineFolded) && (
                <button 
                  className="btn btn-icon vid-play-btn mobile-only-flex"
                  onClick={() => setIsTimelineFolded(p => !p)}
                  title={isTimelineFolded ? "Unfold Timeline" : "Fold Timeline"}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {isTimelineFolded ? <ChevronUp className="icon-sm" /> : <ChevronDown className="icon-sm" />}
                </button>
              )}

              {/* Active item property controls (desktop / unfolded) */}
              {activeItem && !isTimelineFolded && (
                <div className="flex-gap align-center" style={{ flexWrap: 'wrap' }}>
                  {activeItem.type === 'video' && (<>
                    <select
                      className="input-field glass-card"
                      style={{ width: '72px', padding: '4px 6px', fontSize: '0.82rem' }}
                      value={activeItem.playbackRate || 1}
                      onChange={e => updateItem(activeItem.id, { playbackRate: parseFloat(e.target.value) })}
                      title="Speed"
                    >
                      <option value={0.5}>0.5×</option>
                      <option value={1}>1×</option>
                      <option value={1.5}>1.5×</option>
                      <option value={2}>2×</option>
                    </select>
                    <button
                      className={`btn btn-icon ${activeItem.muted ? 'btn-primary shadow-glow' : ''}`}
                      onClick={() => updateItem(activeItem.id, { muted: !activeItem.muted })}
                      title={activeItem.muted ? 'Unmute' : 'Mute'}
                    >
                      {activeItem.muted ? <VolumeX className="icon-sm" /> : <Volume2 className="icon-sm" />}
                    </button>
                  </>)}

                  {activeItem.type === 'text' && (<>
                    <button
                      className="btn btn-secondary"
                      style={{ fontFamily: activeItem.fontFamily, padding: '4px 10px', maxWidth: 120, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}
                      onClick={() => {
                        const current = activeItem.fontFamily || 'Impact, sans-serif';
                        let idx = FONTS.findIndex(f => f.family === current);
                        if (idx === -1) idx = 0;
                        updateItem(activeItem.id, { fontFamily: FONTS[(idx + 1) % FONTS.length].family });
                      }}
                    >
                      <Type className="icon-xs" style={{ marginRight: 4 }} />
                      {(FONTS.find(f => f.family === activeItem.fontFamily) || FONTS[0]).name.split(' ')[0]}
                    </button>
                    <div className="btn btn-icon btn-secondary" style={{ position: 'relative', overflow: 'hidden' }}>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', background: activeItem.color || '#fff', border: '1px solid rgba(255,255,255,0.5)' }} />
                      <input
                        type="color"
                        value={activeItem.color || '#ffffff'}
                        onChange={e => updateItem(activeItem.id, { color: e.target.value, stroke: getContrastStroke(e.target.value) })}
                        style={{ position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer' }}
                      />
                    </div>
                  </>)}

                  {activeItem.type === 'image' && (<>
                    <button className="btn btn-icon btn-secondary" title="Fit"
                      onClick={() => {
                        const ir=(activeItem.width||200)/(activeItem.height||200), cr=canvasDimensions.width/canvasDimensions.height;
                        const s=ir>cr?canvasDimensions.width/(activeItem.width||200):canvasDimensions.height/(activeItem.height||200);
                        const w=(activeItem.width||200)*s,h=(activeItem.height||200)*s;
                        updateItem(activeItem.id,{x:(canvasDimensions.width-w)/2,y:(canvasDimensions.height-h)/2,scaleX:s,scaleY:s});
                      }}><Minimize className="icon-sm"/></button>
                    <button className="btn btn-icon btn-secondary" title="Cover"
                      onClick={() => {
                        const ir=(activeItem.width||200)/(activeItem.height||200),cr=canvasDimensions.width/canvasDimensions.height;
                        const s=ir>cr?canvasDimensions.height/(activeItem.height||200):canvasDimensions.width/(activeItem.width||200);
                        const w=(activeItem.width||200)*s,h=(activeItem.height||200)*s;
                        updateItem(activeItem.id,{x:(canvasDimensions.width-w)/2,y:(canvasDimensions.height-h)/2,scaleX:s,scaleY:s});
                      }}><Crop className="icon-sm"/></button>
                    <button className="btn btn-icon btn-secondary" title="Stretch"
                      onClick={() => updateItem(activeItem.id,{x:0,y:0,scaleX:canvasDimensions.width/(activeItem.width||200),scaleY:canvasDimensions.height/(activeItem.height||200)})}
                    ><Maximize className="icon-sm"/></button>
                  </>)}

                  <button
                    className="btn btn-icon"
                    style={{ color: '#ff2a5f', borderColor: 'rgba(255,42,95,0.3)' }}
                    onClick={() => removeItem(activeItemId)}
                    title="Delete"
                  >
                    <Trash2 className="icon-sm" />
                  </button>
                </div>
              )}
            </div>

            {/* Timeline tracks */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              flex: isTimelineFolded ? '0 0 0px' : '1 1 0%',
              minHeight: 0,
              overflow: 'hidden',
              opacity: isTimelineFolded ? 0 : 1,
              pointerEvents: isTimelineFolded ? 'none' : 'auto',
              visibility: isTimelineFolded ? 'hidden' : 'visible'
            }}>
              <Timeline />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
