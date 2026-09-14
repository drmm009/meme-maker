import React, { useRef, useEffect } from 'react';
import { Sparkles, Play, Pause, SkipBack, Upload, Download, Monitor, Video, Image as ImageIcon, Type, Music, Trash2, VolumeX, Volume2, ArrowLeft } from 'lucide-react';
import Timeline from './components/Timeline';
import CanvasPreview from './components/CanvasPreview';
import { useEditorStore } from './store/useEditorStore';
import { exportVideoFFmpeg } from './utils/ffmpegExport';
import './index.css';

function App() {
  const { isPlaying, setIsPlaying, playhead, addItem, canvasAspectRatio, setCanvasAspectRatio, isExporting, exportProgress, setIsExporting, setExportProgress, activeItemId, removeItem, items, updateItem } = useEditorStore();
  const canvasPreviewRef = useRef(null);

  const activeItem = items.find(i => i.id === activeItemId);

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
      const maxEndMs = state.items.length > 0 
        ? Math.max(...state.items.map(i => i.endMs)) 
        : 1000; // Fallback to 1 second if empty
        
      await exportVideoFFmpeg(
        state.items, 
        maxEndMs, 
        state.canvasAspectRatio, 
        state.canvasDimensions,
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
    <div className="app-container">
      {/* Top Header */}
      <header className="app-header">
        <div className="app-brand">
          <Sparkles className="text-accent" size={24} color="#3b82f6" />
          <span>Pro Editor</span>
        </div>
        
        <div className="header-actions">
          <div className="aspect-ratio-picker">
            <Monitor size={16} color="var(--text-muted)" />
            <select 
              value={canvasAspectRatio} 
              onChange={(e) => setCanvasAspectRatio(Number(e.target.value))}
              className="aspect-ratio-select"
            >
              <option value={16/9}>16:9 (YouTube)</option>
              <option value={9/16}>9:16 (TikTok)</option>
              <option value={1/1}>1:1 (Square)</option>
              <option value={4/3}>4:3 (Classic)</option>
            </select>
          </div>

          <button 
            className="export-btn flex-center" 
            style={{ opacity: isExporting ? 0.5 : 1 }}  
            onClick={handleExport}
            disabled={isExporting}
          >
            <Download size={18} /> {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </header>

      {/* Canvas Area */}
      <main className="canvas-area">
        <CanvasPreview ref={canvasPreviewRef} />
        
        {/* Export Overlay */}
        {isExporting && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', zIndex: 100,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            color: 'white'
          }}>
            <h2 style={{ marginBottom: '20px' }}>Rendering Video...</h2>
            <div style={{ width: '80%', height: '10px', background: '#333', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ width: `${exportProgress}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.1s linear' }} />
            </div>
            <p style={{ marginTop: '10px' }}>{Math.round(exportProgress)}%</p>
          </div>
        )}
      </main>

      {/* Timeline Area */}
      <section className="timeline-area">
        <div className="timeline-controls">
          <button 
            className="tool-btn" 
            style={{ width: '32px', height: '32px', padding: 0, justifyContent: 'center' }}
            onClick={() => useEditorStore.getState().setPlayhead(0)}
          >
            <SkipBack size={16} />
          </button>
          <button 
            className="tool-btn" 
            style={{ width: '32px', height: '32px', padding: 0, justifyContent: 'center', background: isPlaying ? 'var(--bg-surface)' : 'var(--accent)', color: 'white' }}
            onClick={() => {
              const state = useEditorStore.getState();
              if (!state.isPlaying && state.playhead >= state.duration - 10) {
                state.setPlayhead(0);
                state.setIsPlaying(true);
              } else {
                setIsPlaying(!isPlaying);
              }
            }}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          
          <div style={{ marginLeft: '16px', fontFamily: 'monospace', fontSize: '1.2rem' }}>
            {(playhead / 1000).toFixed(2)}s
          </div>

          {items.length === 0 && (
            <div style={{ marginLeft: '24px', color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', animation: 'pulse 2s infinite', opacity: 0.8 }}>
              <ArrowLeft size={16} />
              <span>Add video, image, text or stickers from the buttons on the left</span>
            </div>
          )}
          
          {/* Item Controls on far right */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {activeItem && (
              <>
                <select 
                  style={{ background: 'var(--bg-surface)', color: 'white', border: '1px solid var(--border-light)', borderRadius: '4px', padding: '4px 8px', fontSize: '0.85rem' }}
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
                  className="tool-btn" 
                  style={{ width: '32px', height: '32px', padding: 0, justifyContent: 'center' }} 
                  onClick={() => updateItem(activeItem.id, { muted: !activeItem.muted })}
                  title="Toggle Mute"
                >
                  {activeItem.muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>

                <button 
                  className="tool-btn" 
                  style={{ width: '32px', height: '32px', padding: 0, justifyContent: 'center', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }} 
                  onClick={() => removeItem(activeItemId)}
                  title="Delete Selected Item"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>
        
        <Timeline />
      </section>
    </div>
  );
}

export default App;
