import React, { useRef, useEffect } from 'react';
import { useStore } from 'zustand';
import { Sparkles, Play, Pause, SkipBack, Upload, Download, Monitor, Video, Image as ImageIcon, Type, Music, Trash2, VolumeX, Volume2, Lightbulb, ArrowLeft, Palette, Maximize, Crop, Minimize, Undo, Redo, Sun, Moon } from 'lucide-react';
import Timeline from './Timeline';
import CanvasPreview from './CanvasPreview';
import { useEditorStore } from '../../store/useVideoEditorStore';
import { exportVideoFFmpeg } from '../../utils/ffmpegExport';
import { FONTS } from '../../data/stickers';
import './video-editor.css';
import AspectRatioDropdown from '../AspectRatioDropdown';
import { useAudioPlaybackSync } from './useAudioPlaybackSync';

const getContrastStroke = (hexColor) => {
  if (!hexColor) return '#000000';
  hexColor = hexColor.replace('#', '');
  if (hexColor.length === 3) hexColor = hexColor.split('').map(c => c + c).join('');
  const r = parseInt(hexColor.substr(0, 2), 16) || 0;
  const g = parseInt(hexColor.substr(2, 2), 16) || 0;
  const b = parseInt(hexColor.substr(4, 2), 16) || 0;
  // Relative luminance formula
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance < 0.5 ? '#ffffff' : '#000000';
};

const PlayheadDisplay = () => {
  const playhead = useEditorStore(state => state.playhead);
  const draggingTime = useEditorStore(state => state.draggingTime);
  const activeItemId = useEditorStore(state => state.activeItemId);
  
  if (activeItemId) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div style={{ marginLeft: '16px', fontFamily: 'monospace', fontSize: '1.2rem', color: 'var(--cyber-pink)' }}>
        {((draggingTime !== null ? draggingTime : playhead) / 1000).toFixed(2)}s
      </div>
    </div>
  );
};

const VIDEO_ASPECT_RATIOS = [
  { value: 16/9, label: '16:9 (YouTube)' },
  { value: 9/16, label: '9:16 (TikTok)' },
  { value: 1/1, label: '1:1 (Square)' },
  { value: 4/3, label: '4:3 (Classic)' }
];

export default function VideoEditor({ template, onBack, theme, onToggleTheme }) {
  const { isPlaying, setIsPlaying, addItem, canvasAspectRatio, setCanvasAspectRatio, isExporting, exportProgress, setIsExporting, setExportProgress, activeItemId, removeItem, items, updateItem, clearItems, canvasDimensions, setLayoutSlots, playhead } = useEditorStore();
  
  // Synchronize timeline audio items with playhead & isPlaying
  useAudioPlaybackSync(items, isPlaying, playhead);

  const pastStates = useStore(useEditorStore.temporal, state => state.pastStates);
  const futureStates = useStore(useEditorStore.temporal, state => state.futureStates);
  const undo = useStore(useEditorStore.temporal, state => state.undo);
  const redo = useStore(useEditorStore.temporal, state => state.redo);
  const canvasPreviewRef = useRef(null);

  const activeItem = items.find(i => i.id === activeItemId);

  useEffect(() => {
    const handleGlobalClick = (e) => {
      // If clicking inside the canvas element, Konva handles its own selection logic
      if (e.target.tagName.toLowerCase() === 'canvas') return;
      
      // If clicking on a timeline clip item, let the clip handle its own selection
      if (e.target.closest('.timeline-item-clip')) return;
      
      // If clicking interactive buttons or inputs (e.g., play button, aspect ratio select), do NOT deselect
      if (e.target.closest('button, select, input, textarea')) return;

      // Deselect for any other click (e.g. timeline background, editor background, empty space)
      useEditorStore.getState().setActiveItem(null);
    };

    window.addEventListener('pointerdown', handleGlobalClick);
    return () => window.removeEventListener('pointerdown', handleGlobalClick);
  }, []);

  useEffect(() => {
    // Data Hand-off: when a new template is passed (e.g. from custom layout builder), clear old session and add it
    if (template?.id) {
      clearItems();
      setLayoutSlots(template.slots || []);
      
      // If it's a built-in meme template (not custom), add it as the background
      if (template.category !== 'custom') {
        addItem({ type: 'image', url: template.imageUrl, name: 'Background Template' });
      }

      if (template.mediaItems && template.mediaItems.length > 0) {
        template.mediaItems.forEach((item, idx) => {
          addItem({ 
            type: item.type, 
            url: item.url, 
            name: `Slot ${idx + 1} Media`,
            x: item.x,
            y: item.y,
            width: item.width,
            height: item.height,
            crop: item.crop,
            isPositioned: true
          });
        });
      }

      if (template.width && template.height) {
        useEditorStore.getState().setCanvasAspectRatio(template.width / template.height);
      }
      useEditorStore.getState().setLayoutId(template.layoutId || null);
      if (template.gridUrl) {
        useEditorStore.getState().setGridOverlayUrl(template.gridUrl);
      } else {
        useEditorStore.getState().setGridOverlayUrl(null);
      }
    }
  }, [template?.id]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'Backspace' || e.key === 'Delete') && activeItemId) {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          removeItem(activeItemId);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeItemId, removeItem]);


  const handleExport = async () => {
    try {
      useEditorStore.getState().setActiveItem(null); // Clear selection
      setIsExporting(true);
      setExportProgress(0);

      const state = useEditorStore.getState();
      
      // Calculate exact duration to end on the last element, rather than using timeline visual padding
      const validEndTimes = (state.items || [])
        .map(i => i.endMs)
        .filter(t => typeof t === 'number' && !isNaN(t) && t > 0);
      const maxEndMs = validEndTimes.length > 0 
        ? Math.max(...validEndTimes) 
        : (state.duration || 7000);
        
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
    } catch (err) {
      console.error(err);
      alert("FFmpeg Export failed: " + err.message);
      setIsExporting(false);
    }
  };
  
  return (
    <div className="meme-editor-container animate-fade-in video-editor-container">
      {/* Top Header */}
      <div className="editor-topbar glass-card flex-between">
        <button className="btn btn-ghost btn-xs" onClick={onBack}>
          <ArrowLeft className="icon-sm" /> Back
        </button>

        <div className="history-actions flex-gap">
          <button
            className="btn btn-icon btn-xs"
            onClick={() => undo()}
            disabled={pastStates.length === 0}
            title="Undo"
            style={{ opacity: pastStates.length === 0 ? 0.6 : 1, cursor: pastStates.length === 0 ? 'not-allowed' : 'pointer', background: pastStates.length === 0 ? 'var(--glass-bg)' : '' }}
          >
            <Undo className="icon-xs" />
          </button>
          <button
            className="btn btn-icon btn-xs"
            onClick={() => redo()}
            disabled={futureStates.length === 0}
            title="Redo"
            style={{ opacity: futureStates.length === 0 ? 0.6 : 1, cursor: futureStates.length === 0 ? 'not-allowed' : 'pointer', background: futureStates.length === 0 ? 'var(--glass-bg)' : '' }}
          >
            <Redo className="icon-xs" />
          </button>
          <div style={{ display: 'none' }}></div>
        </div>
        
        <div className="header-actions flex-gap">
          <AspectRatioDropdown 
            value={canvasAspectRatio}
            options={VIDEO_ASPECT_RATIOS}
            onChange={(newRatio) => {
              const store = useEditorStore.getState();
              const oldRatio = store.canvasAspectRatio;
              store.setCanvasAspectRatio(newRatio);
              
              if (store.layoutSlots && store.layoutSlots.length > 0) {
                const oldHeight = 800 / oldRatio;
                const newHeight = 800 / newRatio;
                const scaleY = newHeight / oldHeight;
                
                const newSlots = store.layoutSlots.map(slot => ({
                  ...slot,
                  y: slot.y * scaleY,
                  height: slot.height * scaleY
                }));
                store.setLayoutSlots(newSlots);
              }
            }}
          />

          <button 
            className="btn btn-primary btn-sm shadow-glow" 
            style={{ opacity: isExporting ? 0.5 : 1 }}  
            onClick={handleExport}
            disabled={isExporting}
          >
            <Download className="icon-sm" /> {isExporting ? 'Generating...' : 'Preview'}
          </button>
        </div>
      </div>

      {/* Canvas and Timeline Area (Side by Side on Desktop) */}
      <main 
        className="editor-main video-editor-main" 
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) {
            useEditorStore.getState().setActiveItem(null);
          }
        }}
      >
        <div 
          className="canvas-wrapper glass-card canvas-area video-canvas-area" 
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) {
              useEditorStore.getState().setActiveItem(null);
            }
          }}
        >
          <CanvasPreview ref={canvasPreviewRef} />
          
          {/* Export Overlay */}
          {isExporting && (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.8)', zIndex: 100, borderRadius: 'var(--radius-lg)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              color: 'white'
            }}>
              <h2 style={{ marginBottom: '20px' }}>Rendering Video...</h2>
              <div style={{ width: '80%', height: '10px', background: '#333', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ width: `${exportProgress}%`, height: '100%', background: 'var(--cyber-cyan)', transition: 'width 0.1s linear' }} />
              </div>
              <p style={{ marginTop: '10px' }}>{Math.round(exportProgress)}%</p>
            </div>
          )}
        </div>

        {/* Timeline Area */}
        <section className="tools-panel glass-card timeline-section video-timeline-section">
          <div className="flex-between align-center timeline-controls-wrap" style={{ marginBottom: '16px', position: 'relative' }}>
            <div className="flex-gap align-center">
              <button 
                className="btn btn-icon" 
                onClick={() => useEditorStore.getState().setPlayhead(0)}
                title="Rewind"
              >
                <SkipBack className="icon-sm" />
              </button>
              <button 
                  className={`btn btn-icon ${isPlaying ? 'btn-primary shadow-glow' : ''}`} 
                  onClick={() => {
                    const state = useEditorStore.getState();
                    const actualDuration = state.items.length > 0 ? Math.max(...state.items.map(i => i.endMs)) : state.duration;
                    
                    if (!state.isPlaying) {
                      if (state.playhead >= actualDuration - 10) {
                        state.setPlayhead(0);
                      }
                      state.setIsPlaying(true);
                    } else {
                      setIsPlaying(!isPlaying);
                    }
                  }}
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause className="icon-sm" /> : <Play className="icon-sm" />}
                </button>
                
                <PlayheadDisplay />
              </div>
          
          <div className="flex-gap align-center">
            {activeItem && (
              <>
                {activeItem.type === 'video' && (
                  <>
                    <select 
                      className="input-field glass-card"
                      style={{ width: '80px', padding: '4px 8px', fontSize: '0.85rem' }}
                      value={activeItem.playbackRate || 1}
                      onChange={(e) => updateItem(activeItem.id, { playbackRate: parseFloat(e.target.value) })}
                      title="Playback Speed"
                    >
                      <option value={0.5}>0.5x</option>
                      <option value={1}>1.0x</option>
                      <option value={1.5}>1.5x</option>
                      <option value={2}>2.0x</option>
                    </select>
    
                    <button 
                      className={`btn btn-icon ${activeItem.muted ? 'btn-primary shadow-glow' : ''}`} 
                      onClick={() => updateItem(activeItem.id, { muted: !activeItem.muted })}
                      title="Toggle Mute"
                    >
                      {activeItem.muted ? <VolumeX className="icon-sm" /> : <Volume2 className="icon-sm" />}
                    </button>
                  </>
                )}

                {activeItem.type === 'text' && (
                  <>
                    <button
                      className="btn btn-secondary"
                      title="Tap to change font"
                      onClick={() => {
                        const currentFamily = activeItem.fontFamily || 'Impact, sans-serif';
                        let currentIndex = FONTS.findIndex((f) => f.family === currentFamily);
                        if (currentIndex === -1) {
                          if (currentFamily.toLowerCase().includes('comic')) {
                            currentIndex = FONTS.findIndex(f => f.id.toLowerCase().includes('comic'));
                          } else {
                            currentIndex = FONTS.findIndex(f => currentFamily.toLowerCase().includes(f.id.toLowerCase()));
                          }
                        }
                        const nextIndex = ((currentIndex >= 0 ? currentIndex : 0) + 1) % FONTS.length;
                        updateItem(activeItem.id, { fontFamily: FONTS[nextIndex].family });
                      }}
                      style={{ 
                        fontFamily: activeItem.fontFamily || 'Impact, sans-serif',
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        padding: '4px 10px',
                        maxWidth: '120px',
                        overflow: 'hidden'
                      }}
                    >
                      <Type className="icon-xs text-cyan" />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {(() => {
                          const f = FONTS.find(f => f.family === (activeItem.fontFamily || 'Impact, sans-serif'))
                            || FONTS.find(f => activeItem.fontFamily?.toLowerCase().includes('comic') && f.id.toLowerCase().includes('comic'))
                            || FONTS.find(f => activeItem.fontFamily?.toLowerCase().includes(f.id.toLowerCase()))
                            || FONTS[0];
                          return f.name.split(' ')[0];
                        })()}
                      </span>
                    </button>
                    
                    <div className="btn btn-icon btn-secondary" title="Change Color" style={{ position: 'relative', overflow: 'hidden' }}>
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: activeItem.color || '#ffffff', border: '1px solid rgba(255,255,255,0.5)' }} />
                      <input 
                        type="color" 
                        value={activeItem.color || '#ffffff'}
                        onChange={(e) => {
                          const newColor = e.target.value;
                          updateItem(activeItem.id, { 
                            color: newColor,
                            stroke: getContrastStroke(newColor)
                          });
                        }}
                        style={{ position: 'absolute', opacity: 0, top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                      />
                    </div>

                    <button
                      className="btn btn-secondary"
                      title={
                        activeItem.bgColor === 'white'
                          ? 'Current BG: White (Click for Black)'
                          : activeItem.bgColor === 'black'
                          ? 'Current BG: Black (Click for None)'
                          : 'Current BG: None (Click for White)'
                      }
                      onClick={() => {
                        if (!activeItem.bgColor || activeItem.bgColor === 'none') {
                          updateItem(activeItem.id, {
                            bgColor: 'white',
                            color: '#000000',
                            stroke: 'transparent'
                          });
                        } else if (activeItem.bgColor === 'white') {
                          updateItem(activeItem.id, {
                            bgColor: 'black',
                            color: '#ffffff',
                            stroke: 'transparent'
                          });
                        } else {
                          updateItem(activeItem.id, {
                            bgColor: 'none',
                            color: (activeItem.color === '#000000' || activeItem.color === 'black') ? '#ffffff' : activeItem.color,
                            stroke: '#000000'
                          });
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 12px',
                        height: '32px',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        background: activeItem.bgColor === 'white' ? '#ffffff' : (activeItem.bgColor === 'black' ? '#000000' : 'var(--glass-bg, rgba(255, 255, 255, 0.08))'),
                        color: activeItem.bgColor === 'white' ? '#000000' : (activeItem.bgColor === 'black' ? '#ffffff' : 'var(--text-main)'),
                        border: activeItem.bgColor === 'white' ? '1px solid #ccc' : (activeItem.bgColor === 'black' ? '1px solid #555' : '1px solid var(--glass-border)'),
                        borderRadius: 'var(--radius-sm, 6px)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: activeItem.bgColor === 'white' || activeItem.bgColor === 'black' ? '0 0 8px rgba(168, 85, 247, 0.4)' : 'none'
                      }}
                    >
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '2px',
                          background: activeItem.bgColor === 'white' ? '#000000' : (activeItem.bgColor === 'black' ? '#ffffff' : 'transparent'),
                          border: activeItem.bgColor === 'white' ? '1px solid #333' : (activeItem.bgColor === 'black' ? '1px solid #fff' : '1px dashed rgba(255,255,255,0.6)')
                        }}
                      />
                      BG
                    </button>
                  </>
                )}

                {activeItem.type === 'image' && (
                  <>
                    <div className="divider-vertical"></div>
                    <button 
                      className="btn btn-icon btn-secondary"
                      title="Fit/Contain in Canvas"
                      onClick={() => {
                        const imgRatio = (activeItem.width || 200) / (activeItem.height || 200);
                        const canvasRatio = canvasDimensions.width / canvasDimensions.height;
                        let newScale;
                        if (imgRatio > canvasRatio) {
                          newScale = canvasDimensions.width / (activeItem.width || 200);
                        } else {
                          newScale = canvasDimensions.height / (activeItem.height || 200);
                        }
                        const newW = (activeItem.width || 200) * newScale;
                        const newH = (activeItem.height || 200) * newScale;
                        updateItem(activeItem.id, { 
                          x: (canvasDimensions.width - newW) / 2, 
                          y: (canvasDimensions.height - newH) / 2, 
                          scaleX: newScale,
                          scaleY: newScale
                        });
                      }}
                    >
                      <Minimize className="icon-sm" />
                    </button>
                    <button 
                      className="btn btn-icon btn-secondary"
                      title="Crop/Cover to Canvas"
                      onClick={() => {
                        const imgRatio = (activeItem.width || 200) / (activeItem.height || 200);
                        const canvasRatio = canvasDimensions.width / canvasDimensions.height;
                        let newScale;
                        if (imgRatio > canvasRatio) {
                          newScale = canvasDimensions.height / (activeItem.height || 200);
                        } else {
                          newScale = canvasDimensions.width / (activeItem.width || 200);
                        }
                        const newW = (activeItem.width || 200) * newScale;
                        const newH = (activeItem.height || 200) * newScale;
                        updateItem(activeItem.id, { 
                          x: (canvasDimensions.width - newW) / 2, 
                          y: (canvasDimensions.height - newH) / 2, 
                          scaleX: newScale,
                          scaleY: newScale
                        });
                      }}
                    >
                      <Crop className="icon-sm" />
                    </button>
                    <button 
                      className="btn btn-icon btn-secondary"
                      title="Stretch to Canvas"
                      onClick={() => {
                        updateItem(activeItem.id, { 
                          x: 0, 
                          y: 0, 
                          scaleX: canvasDimensions.width / (activeItem.width || 200),
                          scaleY: canvasDimensions.height / (activeItem.height || 200)
                        });
                      }}
                    >
                      <Maximize className="icon-sm" />
                    </button>
                  </>
                )}

                <button 
                  className="btn btn-icon"
                  style={{ color: '#ff2a5f', borderColor: 'rgba(255, 42, 95, 0.3)' }} 
                  onClick={() => removeItem(activeItemId)}
                  title="Delete Selected Item"
                >
                  <Trash2 className="icon-sm" />
                </button>
              </>
            )}
          </div>
        </div>
        
        <Timeline />
      </section>
      </main>
    </div>
  );
}


