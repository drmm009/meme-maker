import React, { useRef, useEffect, useMemo } from 'react';
import { Video, Type, Music, Image as ImageIcon, Smile, Play, Pause } from 'lucide-react';
import { useEditorStore } from '../store/useEditorStore';

const TIMELINE_WIDTH_PX = 1000; // Fixed visual width for the timeline track

// Warm yellow, amber, gold, and orange shades for sound layers (excluding green, red, purple, blue)
const AUDIO_COLORS = [
  '#f59e0b', // 1. Amber Yellow (Default 1st Sound)
  '#f97316', // 2. Vibrant Orange
  '#eab308', // 3. Golden Yellow
  '#fb923c', // 4. Tangerine
  '#d97706', // 5. Caramel Gold
  '#facc15', // 6. Sunflower Yellow
  '#ea580c', // 7. Rust Orange
  '#fbbf24'  // 8. Marigold Yellow
];

export default function Timeline({ items, activeItemId, setActiveItem, onUpdateItem, onRemoveItem, onAddItem }) {
  const { playhead, duration, isPlaying, setPlayhead, setIsPlaying } = useEditorStore();

  const audioColorMap = useMemo(() => {
    const map = new Map();
    const audioList = items ? items.filter(i => i.type === 'audio') : [];
    let nextIndex = 0;

    audioList.forEach(item => {
      const key = (item.url || item.name || item.id || '').trim();
      if (!map.has(key)) {
        map.set(key, AUDIO_COLORS[nextIndex % AUDIO_COLORS.length]);
        nextIndex++;
      }
    });
    return map;
  }, [items]);
  const [draggingItem, setDraggingItem] = React.useState(null);
  const trackContainerRef = useRef(null);
  const isDraggingRef = useRef(false);
  const fileInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const stickerInputRef = useRef(null);
    
  const [showStickerPicker, setShowStickerPicker] = React.useState(false);

  const STICKERS = [
    { id: 'thug-life', emoji: '🕶️' },
    { id: 'fire', emoji: '🔥' },
    { id: '100', emoji: '💯' },
    { id: 'skull', emoji: '💀' },
    { id: 'laugh', emoji: '😂' },
    { id: 'clown', emoji: '🤡' },
    { id: 'crown', emoji: '👑' },
    { id: 'think', emoji: '🤔' },
    { id: 'party', emoji: '🎉' },
    { id: 'exploding', emoji: '🤯' },
    { id: 'approved', emoji: '✅' },
    { id: 'rejected', emoji: '❌' }
  ];

  const handleAddEmojiSticker = (emoji) => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.font = '100px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 64, 64);
    const url = canvas.toDataURL('image/png');
    onAddItem({ type: 'sticker', url, name: emoji + ' Sticker' });
    setShowStickerPicker(false);
  };

  // Playhead animation loop
  useEffect(() => {
    let animationFrameId;
    let lastTime = performance.now();

    const loop = (time) => {
      if (isPlaying) {
        const delta = time - lastTime;
        useEditorStore.setState((state) => {
          const nextPlayhead = state.playhead + delta;
          if (nextPlayhead >= state.duration) {
            return { playhead: state.duration, isPlaying: false };
          }
          return { playhead: nextPlayhead };
        });
      }
      lastTime = time;
      animationFrameId = requestAnimationFrame(loop);
    };

    if (isPlaying) {
      animationFrameId = requestAnimationFrame(loop);
    }
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying]);

  const handlePointerDown = (e) => {
    isDraggingRef.current = true;
    setIsPlaying(false); // Pause when grabbing playhead
    updateScrub(e);
    // Add global listeners for dragging outside container
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;
    updateScrub(e);
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  };

  const updateScrub = (e) => {
    if (!trackContainerRef.current) return;
    const rect = trackContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    setPlayhead(percentage * duration);
  };

  const getPlayheadPosition = () => {
    return (playhead / duration) * 100;
  };

  const handleItemPointerDown = (e, item, action) => {
    e.stopPropagation();
    if (item.type === 'audio' && action !== 'move') return;
    setActiveItem(item.id);
    setDraggingItem({ id: item.id, action, snapMs: null });
    const startX = e.clientX;
    const initialStart = item.startMs;
    const initialEnd = item.endMs;
    const durationLimit = 100000;

    // Collect snap points
    const snapPoints = [0, playhead];
    items.forEach(i => {
      if (i.id !== item.id) {
        snapPoints.push(i.startMs, i.endMs);
      }
    });

    const handleMove = (moveEvent) => {
      if (!trackContainerRef.current) return;
      const rect = trackContainerRef.current.getBoundingClientRect();
      const pixelDelta = moveEvent.clientX - startX;
      const msDelta = (pixelDelta / rect.width) * duration;
      
      const snapThresholdMs = (10 / rect.width) * duration;
      const snapToPoint = (ms) => {
        for (const point of snapPoints) {
          if (Math.abs(ms - point) < snapThresholdMs) return point;
        }
        return ms;
      };

      let currentSnapMs = null;

      if (action === 'move') {
        let newStart = initialStart + msDelta;
        let newEnd = initialEnd + msDelta;
        const itemDur = initialEnd - initialStart;

        let snappedStart = snapToPoint(newStart);
        if (snappedStart !== newStart) {
          newStart = snappedStart;
          newEnd = newStart + itemDur;
          currentSnapMs = snappedStart;
        } else {
          let snappedEnd = snapToPoint(newEnd);
          if (snappedEnd !== newEnd) {
            newEnd = snappedEnd;
            newStart = newEnd - itemDur;
            currentSnapMs = snappedEnd;
          }
        }

        if (newStart < 0) {
          newStart = 0;
          newEnd = itemDur;
          currentSnapMs = 0;
        }
        if (newEnd > durationLimit) {
          newEnd = durationLimit;
          newStart = durationLimit - itemDur;
        }

        setDraggingItem(prev => ({ ...prev, snapMs: currentSnapMs }));
        onUpdateItem(item.id, { startMs: newStart, endMs: newEnd });
      } else if (action === 'resize-left') {
        let newStart = initialStart + msDelta;
        let snappedStart = snapToPoint(newStart);
        if (snappedStart !== newStart) {
          newStart = snappedStart;
          currentSnapMs = snappedStart;
        }
        
        newStart = Math.max(0, Math.min(newStart, initialEnd - 100));
        if (newStart === 0) currentSnapMs = 0;

        const actualDelta = newStart - initialStart;
        const currentTrim = item.trimStartMs || 0;
        setDraggingItem(prev => ({ ...prev, snapMs: currentSnapMs }));
        onUpdateItem(item.id, { 
          startMs: newStart,
          trimStartMs: Math.max(0, currentTrim + actualDelta)
        });
      } else if (action === 'resize-right') {
        let newEnd = initialEnd + msDelta;
        let snappedEnd = snapToPoint(newEnd);
        if (snappedEnd !== newEnd) {
          newEnd = snappedEnd;
          currentSnapMs = snappedEnd;
        }

        newEnd = Math.min(durationLimit, Math.max(initialStart + 100, newEnd));
        setDraggingItem(prev => ({ ...prev, snapMs: currentSnapMs }));
        onUpdateItem(item.id, { endMs: newEnd });
      }
    };

    const handleUp = () => {
      setDraggingItem(null);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };


  const generateThumbnail = (url) => {
    return new Promise((resolve) => {
      let resolved = false;
      const safeResolve = (val) => {
        if (!resolved) {
          resolved = true;
          resolve(val);
        }
      };

      const video = document.createElement('video');
      video.src = url;
      video.crossOrigin = "anonymous";
      video.muted = true;
      
      setTimeout(() => safeResolve(null), 2000);

      const captureFrame = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 160;
          canvas.height = 90;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          safeResolve(canvas.toDataURL('image/jpeg', 0.5));
        } catch (e) {
          safeResolve(null);
        }
      };

      video.onseeked = captureFrame;
      video.onerror = () => safeResolve(null);
      video.onloadeddata = () => {
        if (video.duration > 1) {
          video.currentTime = 1;
        } else {
          captureFrame();
        }
      };
    });
  };

  const handleFileUpload = (e, forceType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');
    
    let type = 'image';
    if (isVideo) type = 'video';
    if (isAudio) type = 'audio';
    if (forceType) type = forceType;
    
    if (type === 'video' || type === 'audio') {
      const media = document.createElement(type);
      media.src = url;
      media.onloadedmetadata = async () => {
        const durationMs = Math.round(media.duration * 1000);
        let thumbnailUrl = null;
        if (type === 'video') {
          thumbnailUrl = await generateThumbnail(url);
        }
        onAddItem({ type, url, durationMs, width: media.videoWidth, height: media.videoHeight, name: file.name, thumbnailUrl });
      };
    } else {
      onAddItem({ type, url, name: file.name });
    }

    
    e.target.value = '';
  };

  const handleAddText = () => {
    onAddItem({ type: 'text', text: 'New Text', durationMs: 3000, name: 'Text Block' });
  };

  const videoItems = items.filter(i => i.type === 'video');
  const imageItems = items.filter(i => i.type === 'image');
  const stickerItems = items.filter(i => i.type === 'sticker');
  const textItems = items.filter(i => i.type === 'text');
  const audioItems = items.filter(i => i.type === 'audio');

  const sections = [
    { id: 'video', icon: <Video size={16} />, onClick: () => fileInputRef.current?.click(), items: videoItems.length > 0 ? videoItems : [null] },
    { id: 'image', icon: <ImageIcon size={16} />, onClick: () => imageInputRef.current?.click(), items: imageItems.length > 0 ? imageItems : [null] },
    { id: 'sticker', icon: <Smile size={16} />, onClick: () => setShowStickerPicker(!showStickerPicker), items: stickerItems.length > 0 ? stickerItems : [null] },
    { id: 'text', icon: <Type size={16} />, onClick: handleAddText, items: textItems.length > 0 ? textItems : [null] },
    { id: 'audio', icon: <Music size={16} />, onClick: () => audioInputRef.current?.click(), items: audioItems.length > 0 ? audioItems : [null] }
  ];

  const rows = [];
  sections.forEach(sec => {
    sec.items.forEach((item, index) => {
      rows.push({
        sectionId: sec.id,
        isFirst: index === 0,
        icon: sec.icon,
        onClick: sec.onClick,
        item: item
      });
    });
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', flex: 1, minHeight: 0 }}>
      {/* Hidden inputs for adding media */}
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="video/*" onChange={e => handleFileUpload(e, 'video')} />
      <input type="file" ref={imageInputRef} style={{ display: 'none' }} accept="image/*" onChange={e => handleFileUpload(e, 'image')} />
      <input type="file" ref={audioInputRef} style={{ display: 'none' }} accept="audio/*" onChange={e => handleFileUpload(e, 'audio')} />

      {/* Sticker Picker Popup */}
      {showStickerPicker && (
        <div style={{ position: 'absolute', left: '80px', bottom: '150px', background: '#222', border: '1px solid #444', borderRadius: '8px', padding: '10px', zIndex: 100, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          {STICKERS.map(s => (
            <button key={s.id} onClick={() => handleAddEmojiSticker(s.emoji)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', padding: '5px', borderRadius: '4px' }}>
              {s.emoji}
            </button>
          ))}
        </div>
      )}

      {/* Top Bar: Play Button + Time Ruler */}
      <div style={{ display: 'flex', position: 'sticky', top: 0, zIndex: 60, background: '#111', borderBottom: '1px solid var(--border-light)' }}>
        
        {/* Play Button Area */}
        <div style={{ width: '64px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
          <button 
            className="btn btn-icon btn-xs" 
            onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }}
            style={{ borderRadius: '50%', width: '28px', height: '28px', background: isPlaying ? 'rgba(239,68,68,0.2)' : 'rgba(204,255,0,0.2)', color: isPlaying ? '#ef4444' : '#a855f7' }}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="icon-xs"/> : <Play className="icon-xs" style={{ marginLeft: '2px' }}/>}
          </button>
        </div>

        {/* Time Ruler */}
        <div 
          ref={trackContainerRef} 
          onPointerDown={handlePointerDown}
          style={{ height: '30px', flex: 1, cursor: 'ew-resize', marginRight: '15px', position: 'relative' }}
        >
        {/* Render numeric scale ticks */}
        {(() => {
          const tickInterval = duration > 30000 ? 10000 : duration > 20000 ? 5000 : 1000;
          const numTicks = Math.ceil(duration / tickInterval) + 1;
          return Array.from({ length: numTicks }).map((_, i) => {
            const tickMs = i * tickInterval;
            const percent = (tickMs / duration) * 100;
            const seconds = tickMs / 1000;
            return (
              <div key={i} style={{ position: 'absolute', left: `${percent}%`, bottom: 0, height: '10px', borderLeft: '1px solid rgba(255,255,255,0.2)' }}>
                <span style={{ position: 'absolute', top: '-18px', left: percent >= 100 ? undefined : '4px', right: percent >= 100 ? '4px' : undefined, fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  {seconds}
                </span>
              </div>
            );
          });
        })()}

        {/* Playhead Marker */}
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${getPlayheadPosition()}%`, width: '2px', background: '#ef4444', zIndex: 50, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '-6px', left: '-5px', width: '12px', height: '12px', background: '#ef4444', borderRadius: '50%', cursor: 'ew-resize' }} />
        </div>
      </div>
      </div>

      {/* Tracks Area (Internally Scrollable) */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflowY: 'auto', position: 'relative' }}>
        
        {/* Left Sidebar for Track Icons */}
        <div style={{ width: '64px', flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.05)' }}>
          {rows.map((row, idx) => (
            <div 
              key={`icon-${idx}`} 
              onClick={row.isFirst ? row.onClick : undefined}
              title={row.isFirst ? `Add ${row.sectionId}` : ''}
              className={row.isFirst ? "timeline-icon-btn" : ""}
              style={{ 
                height: '48px', 
                borderBottom: '1px solid rgba(255,255,255,0.05)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: row.isFirst ? 'var(--text-muted)' : 'transparent',
                cursor: row.isFirst ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                ...(row.isFirst ? {} : { opacity: 0 })
              }}
              onMouseEnter={(e) => { if(row.isFirst) e.currentTarget.style.color = 'var(--text-primary)' }}
              onMouseLeave={(e) => { if(row.isFirst) e.currentTarget.style.color = 'var(--text-muted)' }}
            >
              {row.isFirst ? row.icon : null}
            </div>
          ))}
        </div>

        {/* Right Side: Sequence Tracks */}
        <div 
          className="timeline-tracks" 
          style={{ flex: 1, position: 'relative', touchAction: 'none', marginRight: '15px' }}
        >
          {/* Tracks */}
          <div style={{ position: 'relative', minHeight: '100%', overflow: 'hidden' }}>
            {/* Playhead line overlay over tracks */}
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${getPlayheadPosition()}%`, width: '2px', background: 'rgba(239, 68, 68, 0.5)', zIndex: 40, pointerEvents: 'none' }} />
            
            {/* Alignment Guide Line while dragging */}
            {(() => {
              if (!draggingItem) return null;
              
              if (draggingItem.snapMs !== null && draggingItem.snapMs !== undefined) {
                 const linePercent = (draggingItem.snapMs / duration) * 100;
                 return (
                   <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${linePercent}%`, width: '2px', background: '#fbbf24', zIndex: 40, pointerEvents: 'none' }} />
                 );
              }

              const data = items.find(i => i.id === draggingItem.id);
              if (!data) return null;
              const linePercent = draggingItem.action === 'resize-right' 
                ? (data.endMs / duration) * 100 
                : (data.startMs / duration) * 100;
              return (
                <div style={{ 
                  position: 'absolute', top: 0, bottom: 0, left: `${linePercent}%`, 
                  width: '1px', borderLeft: '1px dashed rgba(255, 255, 255, 0.5)', 
                  zIndex: 35, pointerEvents: 'none' 
                }} />
              );
            })()}

            {rows.map((row, idx) => {
            const item = row.item;
            if (!item) {
              return <div key={`empty-${idx}`} style={{ height: '48px', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'relative', background: 'rgba(255,255,255,0.02)' }} />;
            }

            const leftPercent = (item.startMs / duration) * 100;
            const widthPercent = ((item.endMs - item.startMs) / duration) * 100;
            
            const getItemColor = (sectionId, currentItem) => {
              if (sectionId === 'audio' && currentItem) {
                const key = (currentItem.url || currentItem.name || currentItem.id || '').trim();
                return audioColorMap.get(key) || '#f59e0b';
              }
              switch (sectionId) {
                case 'video': return '#3b82f6';   // blue
                case 'image': return '#8b5cf6';   // purple
                case 'sticker': return '#a855f7'; // pink
                case 'text': return '#10b981';    // emerald
                case 'audio': return '#f59e0b';   // amber
                default: return 'var(--accent)';
              }
            };
            
            return (
              <div key={item.id} style={{ height: '48px', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'relative', background: 'rgba(255,255,255,0.02)' }}>
                  <div
                    key={item.id}
                    onPointerDown={(e) => handleItemPointerDown(e, item, 'move')}
                    style={{
                      position: 'absolute',
                      left: `${leftPercent}%`,
                      width: `${widthPercent}%`,
                      minWidth: '28px',
                      top: '10%',
                      height: '80%',
                      background: getItemColor(row.sectionId, item),
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      cursor: 'grab',
                      display: 'flex',
                      alignItems: 'center',
                      userSelect: 'none',
                      outline: activeItemId === item.id ? '2px solid white' : 'none',
                      boxShadow: activeItemId === item.id ? '0 0 10px rgba(255,255,255,0.5)' : 'none',
                      zIndex: activeItemId === item.id ? 10 : 1
                    }}
                  >
                    {/* Left Handle */}
                    {item.type !== 'audio' && (
                      <div 
                        onPointerDown={(e) => handleItemPointerDown(e, item, 'resize-left')}
                        style={{ 
                          width: '14px', 
                          height: '100%', 
                          background: '#ffffff', 
                          cursor: 'ew-resize', 
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '1px 0 3px rgba(0,0,0,0.2)',
                          borderTopLeftRadius: '4px',
                          borderBottomLeftRadius: '4px'
                        }}
                      >
                        <div style={{ width: '2px', height: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '1px' }} />
                      </div>
                    )}
                    
                    <div style={{ 
                      flex: 1, 
                      minWidth: 0,
                      padding: item.type === 'audio' ? '0 8px' : 0,
                      pointerEvents: 'none', 
                      color: 'white', 
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      overflow: 'hidden',
                      ...(item.thumbnailUrl ? {
                        backgroundImage: `url(${item.thumbnailUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                      } : {})
                      {item.type !== 'image' && item.type !== 'sticker' && (
                        <span style={{ background: item.thumbnailUrl ? 'rgba(0,0,0,0.6)' : 'transparent', padding: '2px 6px', borderRadius: '4px' }}>
                          {item.type === 'audio' ? (item.name || 'AUDIO') : item.type.toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Right Handle */}
                    {item.type !== 'audio' && (
                      <div 
                        onPointerDown={(e) => handleItemPointerDown(e, item, 'resize-right')}
                        style={{ 
                          width: '14px', 
                          height: '100%', 
                          background: '#ffffff', 
                          cursor: 'ew-resize', 
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '-1px 0 3px rgba(0,0,0,0.2)',
                          borderTopRightRadius: '4px',
                          borderBottomRightRadius: '4px'
                        }}
                      >
                        <div style={{ width: '2px', height: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '1px' }} />
                      </div>
                    )}
                  </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  </div>
  );
}

