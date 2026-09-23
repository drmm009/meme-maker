import React, { useRef, useEffect, useMemo } from 'react';
import { Video, Type, Music, Image as ImageIcon, Smile, UploadCloud, LayoutTemplate, Search, X, Sticker } from 'lucide-react';
import { useEditorStore } from '../../store/useVideoEditorStore';
import { useShallow } from 'zustand/react/shallow';
import { STICKERS } from '../../data/stickers';
import { GRAPHIC_STICKERS, GRAPHIC_STICKER_CATEGORIES } from '../../data/memeStickers';
import { MEME_TEMPLATES, CATEGORIES } from '../../data/templates';
import { fetchOpenSourceMemes } from '../../services/memeService';
import AudioModal from './AudioModal';
import VideoTemplateModal from './VideoTemplateModal';
import ModalPortal from '../ModalPortal';

const TIMELINE_WIDTH_PX = 1000; // Fixed visual width for the timeline track

// Distinct warm shades of yellow, amber, gold, and orange for sound layers
// Excludes green (text), red, purple (image), and blue (video)
const AUDIO_PALETTES = [
  // 1. Classic Amber Yellow (Default 1st Sound)
  { background: 'linear-gradient(90deg, #92400e, #f59e0b)', color: '#fef08a', glow: 'rgba(245, 158, 11, 0.6)', border: '#fcd34d' },
  // 2. Bright Vibrant Orange
  { background: 'linear-gradient(90deg, #c2410c, #f97316)', color: '#ffedd5', glow: 'rgba(249, 115, 22, 0.6)', border: '#fdba74' },
  // 3. Bright Canary / Golden Yellow
  { background: 'linear-gradient(90deg, #ca8a04, #eab308)', color: '#fef9c3', glow: 'rgba(234, 179, 8, 0.6)', border: '#fde047' },
  // 4. Warm Tangerine / Honey
  { background: 'linear-gradient(90deg, #d97706, #fb923c)', color: '#fff7ed', glow: 'rgba(251, 146, 60, 0.6)', border: '#fed7aa' },
  // 5. Deep Caramel Gold
  { background: 'linear-gradient(90deg, #78350f, #d97706)', color: '#fef3c7', glow: 'rgba(217, 119, 6, 0.6)', border: '#fde68a' },
  // 6. Radiant Sunflower / Butterscotch Yellow
  { background: 'linear-gradient(90deg, #854d0e, #facc15)', color: '#fefce8', glow: 'rgba(250, 204, 21, 0.6)', border: '#fef08a' },
  // 7. Dark Amber / Rust Orange
  { background: 'linear-gradient(90deg, #7c2d12, #ea580c)', color: '#ffedd5', glow: 'rgba(234, 88, 12, 0.6)', border: '#fdba74' },
  // 8. Marigold Yellow
  { background: 'linear-gradient(90deg, #b45309, #fbbf24)', color: '#fef3c7', glow: 'rgba(251, 191, 36, 0.6)', border: '#fde68a' },
  // 9. Warm Apricot Gold
  { background: 'linear-gradient(90deg, #a16207, #f59e0b)', color: '#fffbeb', glow: 'rgba(245, 158, 11, 0.6)', border: '#fde68a' },
  // 10. Deep Ochre / Burnt Orange
  { background: 'linear-gradient(90deg, #9a3412, #f97316)', color: '#ffedd5', glow: 'rgba(249, 115, 22, 0.6)', border: '#fdba74' }
];

const PlayheadMarker = ({duration}) => {
  const [pos, setPos] = React.useState(() => (useEditorStore.getState().playhead/duration)*100);
  React.useEffect(() => {
    return useEditorStore.subscribe((state) => setPos((state.playhead/duration)*100));
  }, [duration]);
  return (
    <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${pos}%`, width: '1px', background: 'var(--cyber-pink)', zIndex: 50, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', top: '-6px', left: '-4.5px', width: '10px', height: '10px', background: 'var(--cyber-pink)', borderRadius: '50%', boxShadow: '0 0 8px var(--cyber-pink)', cursor: 'ew-resize' }} />
    </div>
  );
};

const PlayheadOverlayLine = ({duration}) => {
  const [pos, setPos] = React.useState(() => (useEditorStore.getState().playhead/duration)*100);
  React.useEffect(() => {
    return useEditorStore.subscribe((state) => setPos((state.playhead/duration)*100));
  }, [duration]);
  return <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${pos}%`, width: '2px', background: 'var(--cyber-pink)', zIndex: 40, pointerEvents: 'none' }} />;
};

export default function Timeline() {
  const { duration, isPlaying, setPlayhead, setIsPlaying, items, activeItemId, setActiveItem } = useEditorStore(
    useShallow(state => ({
      duration: state.duration,
      isPlaying: state.isPlaying,
      setPlayhead: state.setPlayhead,
      setIsPlaying: state.setIsPlaying,
      items: state.items,
      activeItemId: state.activeItemId,
      setActiveItem: state.setActiveItem
    }))
  );

  // Map each distinct sound on the timeline to a consistent shade
  // The first sound encountered is ALWAYS assigned Index 0 (original default yellow)
  const audioPaletteMap = useMemo(() => {
    const map = new Map();
    const audioList = items.filter(i => i.type === 'audio');
    let nextIndex = 0;

    audioList.forEach(item => {
      const key = (item.url || item.name || item.id || '').trim();
      if (!map.has(key)) {
        map.set(key, AUDIO_PALETTES[nextIndex % AUDIO_PALETTES.length]);
        nextIndex++;
      }
    });

    return map;
  }, [items]);
  const [draggingItem, setDraggingItem] = React.useState(null);
  const trackContainerRef = useRef(null);
  const trackRectRef = useRef(null);
  const isDraggingRef = useRef(false);
  const fileInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const stickerInputRef = useRef(null);
    
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  const [emojiCategory, setEmojiCategory] = React.useState('faces');
  const [emojiSearchQuery, setEmojiSearchQuery] = React.useState('');

  const [showGraphicStickerPicker, setShowGraphicStickerPicker] = React.useState(false);
  const [graphicStickerCategory, setGraphicStickerCategory] = React.useState(GRAPHIC_STICKER_CATEGORIES[0]?.id || 'memes');
  const [graphicStickerSearchQuery, setGraphicStickerSearchQuery] = React.useState('');

  const [showAudioModal, setShowAudioModal] = React.useState(false);
  const [dropdownOpen, setDropdownOpen] = React.useState(null);
  const [showImageTemplatePicker, setShowImageTemplatePicker] = React.useState(false);
  const [showVideoTemplatePicker, setShowVideoTemplatePicker] = React.useState(false);
  const [templateSearchQuery, setTemplateSearchQuery] = React.useState('');
  const [templateCategory, setTemplateCategory] = React.useState('all');
  const [templateList, setTemplateList] = React.useState(MEME_TEMPLATES);

  React.useEffect(() => {
    let isMounted = true;
    fetchOpenSourceMemes().then((data) => {
      if (isMounted && Array.isArray(data) && data.length > 0) {
        setTemplateList(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  React.useEffect(() => {
    const handleClickOutside = () => setDropdownOpen(null);
    if (dropdownOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [dropdownOpen]);
  
  const filteredTemplates = React.useMemo(() => {
    return templateList.filter((tmpl) => {
      const q = templateSearchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        tmpl.name.toLowerCase().includes(q) ||
        (tmpl.category && tmpl.category.toLowerCase().includes(q));

      let matchesCategory = true;
      if (templateCategory === 'trending') {
        matchesCategory = tmpl.trendingScore >= 93;
      } else if (templateCategory !== 'all') {
        matchesCategory = tmpl.category === templateCategory;
      }

      return matchesSearch && matchesCategory;
    });
  }, [templateList, templateSearchQuery, templateCategory]);

  const handleAddEmoji = (emoji) => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.font = '96px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 64, 64);
    const url = canvas.toDataURL();
    useEditorStore.getState().addItem({ type: 'sticker', url, name: emoji + ' Emoji' });
    setShowEmojiPicker(false);
  };

  const handleAddGraphicSticker = (stickerObj) => {
    useEditorStore.getState().addItem({ 
      type: 'sticker', 
      url: stickerObj.url, 
      name: stickerObj.name || 'Sticker' 
    });
    setShowGraphicStickerPicker(false);
  };

  // Playhead animation loop
  useEffect(() => {
    let lastTime = performance.now();
    let animationFrameId;

    const loop = (time) => {
      const delta = time - lastTime;
      lastTime = time;

      if (useEditorStore.getState().isPlaying) {
        useEditorStore.setState((state) => {
          const nextPlayhead = state.playhead + delta;
          
          // Determine the actual end time based on the last item in the timeline
          const actualDuration = state.items.length > 0 
            ? Math.max(...state.items.map(i => i.endMs)) 
            : state.duration;

          if (nextPlayhead >= actualDuration) {
            return { playhead: actualDuration, isPlaying: false };
          }
          return { playhead: nextPlayhead };
        });
      }
      animationFrameId = requestAnimationFrame(loop);
    }

    if (isPlaying) {
      lastTime = performance.now();
      animationFrameId = requestAnimationFrame(loop);
    }
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying]);

  const handlePointerDown = (e) => {
    isDraggingRef.current = true;
    if (trackContainerRef.current) {
      trackRectRef.current = trackContainerRef.current.getBoundingClientRect();
    }
    setIsPlaying(false); // Pause when grabbing playhead
    updateScrub(e, true);
    // Add global listeners for dragging outside container
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;
    updateScrub(e, false);
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
    trackRectRef.current = null;
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  };

  const updateScrub = (e, forceMeasure = false) => {
    if (!trackContainerRef.current) return;
    const rect = forceMeasure ? trackContainerRef.current.getBoundingClientRect() : (trackRectRef.current || trackContainerRef.current.getBoundingClientRect());
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    setPlayhead(percentage * duration);
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
    const snapPoints = [0, useEditorStore.getState().playhead];
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
        useEditorStore.getState().updateItem(item.id, { startMs: newStart, endMs: newEnd });
        useEditorStore.getState().setDraggingTime(currentSnapMs !== null ? currentSnapMs : newStart);
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
        useEditorStore.getState().updateItem(item.id, { 
          startMs: newStart,
          trimStartMs: Math.max(0, currentTrim + actualDelta)
        });
        useEditorStore.getState().setDraggingTime(currentSnapMs !== null ? currentSnapMs : newStart);
      } else if (action === 'resize-right') {
        let newEnd = initialEnd + msDelta;
        let snappedEnd = snapToPoint(newEnd);
        if (snappedEnd !== newEnd) {
          newEnd = snappedEnd;
          currentSnapMs = snappedEnd;
        }

        newEnd = Math.min(durationLimit, Math.max(initialStart + 100, newEnd));
        setDraggingItem(prev => ({ ...prev, snapMs: currentSnapMs }));
        useEditorStore.getState().updateItem(item.id, { endMs: newEnd });
        useEditorStore.getState().setDraggingTime(currentSnapMs !== null ? currentSnapMs : newEnd);
      }
    };

    const handleUp = () => {
      setDraggingItem(null);
      useEditorStore.getState().setDraggingTime(null);
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
        useEditorStore.getState().addItem({ type, url, durationMs, width: media.videoWidth, height: media.videoHeight, name: file.name, thumbnailUrl });
      };
    } else {
      useEditorStore.getState().addItem({ type, url, name: file.name });
    }

    
    e.target.value = '';
  };

  const handleAddText = () => {
    useEditorStore.getState().addItem({ 
      type: 'text', 
      text: 'NEW TEXT', 
      durationMs: 3000, 
      name: 'Text Block',
      color: '#ffffff',
      stroke: '#000000',
      fontSize: 100
    });
  };

  const videoItems = items.filter(i => i.type === 'video');
  const imageItems = items.filter(i => i.type === 'image');
  const stickerItems = items.filter(i => i.type === 'sticker');
  const textItems = items.filter(i => i.type === 'text');
  const audioItems = items.filter(i => i.type === 'audio');

  const sections = [
    { id: 'video', color: '#ff2a5f', icon: <Video size={16} />, onClick: () => setDropdownOpen(prev => prev === 'video' ? null : 'video'), items: videoItems.length > 0 ? videoItems : [null] },
    { id: 'image', color: '#a855f7', icon: <ImageIcon size={16} />, onClick: () => setDropdownOpen(prev => prev === 'image' ? null : 'image'), items: imageItems.length > 0 ? imageItems : [null] },
    { id: 'audio', color: '#10b981', icon: <Music size={16} />, onClick: () => setDropdownOpen(prev => prev === 'audio' ? null : 'audio'), items: audioItems.length > 0 ? audioItems : [null] },
    { id: 'text', color: '#a855f7', icon: <Type size={16} />, onClick: handleAddText, items: textItems.length > 0 ? textItems : [null] },
    { id: 'sticker', color: '#fbbf24', icon: <Smile size={16} />, onClick: () => setDropdownOpen(prev => prev === 'sticker' ? null : 'sticker'), items: stickerItems.length > 0 ? stickerItems : [null] }
  ];

  const rows = [];
  sections.forEach(sec => {
    sec.items.forEach((item, index) => {
      rows.push({
        sectionId: sec.id,
        isFirst: index === 0,
        icon: sec.icon,
        color: sec.color,
        onClick: sec.onClick,
        item: item
      });
    });
  });

  const getThemeColorVars = (sectionId) => {
    switch (sectionId) {
      case 'video': return { '--btn-theme-hex': '#3b82f6', '--btn-theme-rgb': '59, 130, 246' }; // blue
      case 'image': return { '--btn-theme-hex': '#8b5cf6', '--btn-theme-rgb': '166, 124, 30' }; // purple
      case 'sticker': return { '--btn-theme-hex': '#a855f7', '--btn-theme-rgb': '201, 162, 39' }; // pink
      case 'text': return { '--btn-theme-hex': '#10b981', '--btn-theme-rgb': '16, 185, 129' }; // emerald
      case 'audio': return { '--btn-theme-hex': '#f59e0b', '--btn-theme-rgb': '245, 158, 11' }; // amber
      default: return { '--btn-theme-hex': 'var(--cyber-cyan)', '--btn-theme-rgb': '201, 162, 39' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', flex: 1, minHeight: 0 }}>
      {/* Hidden inputs for adding media */}
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="video/*" onChange={e => handleFileUpload(e, 'video')} />
      <input type="file" ref={imageInputRef} style={{ display: 'none' }} accept="image/*" onChange={e => handleFileUpload(e, 'image')} />
      <input type="file" ref={audioInputRef} style={{ display: 'none' }} accept="audio/*" onChange={e => handleFileUpload(e, 'audio')} />

      {/* Time Ruler (Sticky at Top) */}
      <div 
        ref={trackContainerRef} 
        onPointerDown={handlePointerDown}
        style={{ height: '30px', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'sticky', top: 0, zIndex: 50, background: '#111', cursor: 'ew-resize', touchAction: 'none', flexShrink: 0, marginLeft: '64px', marginRight: '15px' }}
      >
        {/* Render numeric scale ticks */}
        {(() => {
          const tickInterval = duration > 30000 ? 10000 : duration > 20000 ? 5000 : 1000;
          const numTicks = Math.ceil(duration / tickInterval) + 1;
          return Array.from({ length: numTicks }).map((_, i) => {
            const tickMs = i * tickInterval;
            
            // Prevent ticks from spilling outside the timeline container
            if (tickMs > duration) return null;
            
            const percent = (tickMs / duration) * 100;
            const seconds = tickMs / 1000;
            return (
              <div key={i} style={{ position: 'absolute', left: `${percent}%`, bottom: 0, height: '10px', borderLeft: '1px solid rgba(255,255,255,0.15)' }}>
                <span style={{ position: 'absolute', top: '-18px', left: percent >= 100 ? undefined : '4px', right: percent >= 100 ? '4px' : undefined, fontSize: '0.65rem', fontWeight: 500, color: 'rgba(255,255,255,0.4)' }}>
                  {seconds}
                </span>
              </div>
            );
          });
        })()}

        {/* Playhead Marker */}
        <PlayheadMarker duration={duration} />
      </div>

      {/* Tracks Area (Internally Scrollable) */}
      <div className="timeline-scroll-area" style={{ display: 'flex', flex: 1, minHeight: 0, overflowY: 'auto', position: 'relative', touchAction: 'pan-y' }}>
        
        {/* Left Sidebar for Track Icons */}
        <div style={{ width: '64px', flexShrink: 0, borderRight: '1px solid var(--glass-border)' }}>
          {rows.map((row, idx) => (
            <div 
              key={`icon-${idx}`} 
              onClick={row.isFirst ? (e) => {
                e.stopPropagation();
                row.onClick();
              } : undefined}
              title={row.isFirst ? `Add ${row.sectionId}` : ''}
              style={{ 
                height: '48px', 
                borderBottom: '1px solid var(--glass-border)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                cursor: row.isFirst ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                position: 'relative',
                ...(row.isFirst ? {} : { opacity: 0 })
              }}
            >
              {row.isFirst ? (
                <>
                  <div 
                    className="btn btn-timeline-add flex-center"
                    style={getThemeColorVars(row.sectionId)}
                  >
                    {row.icon}
                  </div>
                  
                  {dropdownOpen === row.sectionId && (row.sectionId === 'video' || row.sectionId === 'image') && (
                    <div className="glass-card animate-fade-in" style={{ position: 'absolute', top: row.sectionId === 'image' ? '-22px' : '12px', left: '100%', zIndex: 1000, display: 'flex', flexDirection: 'column', padding: '8px', gap: '4px', minWidth: '160px', marginLeft: '8px' }} onClick={e => e.stopPropagation()}>
                      <button 
                        className="btn timeline-dropdown-btn timeline-dropdown-btn-custom" 
                        onClick={() => {
                          setDropdownOpen(null);
                          if (row.sectionId === 'video') fileInputRef.current?.click();
                          else imageInputRef.current?.click();
                        }}
                      >
                        <UploadCloud size={16} />
                        Upload {row.sectionId}
                      </button>
                      <button 
                        className="btn timeline-dropdown-btn timeline-dropdown-btn-custom" 
                        onClick={() => {
                          setDropdownOpen(null);
                          if (row.sectionId === 'image') {
                            setShowImageTemplatePicker(true);
                          } else {
                            setShowVideoTemplatePicker(true);
                          }
                        }}
                      >
                        <LayoutTemplate size={16} />
                        Add Template
                      </button>
                    </div>
                  )}

                  {dropdownOpen === row.sectionId && row.sectionId === 'sticker' && (
                    <div className="glass-card animate-fade-in" style={{ position: 'absolute', bottom: '12px', left: '100%', zIndex: 1000, display: 'flex', flexDirection: 'column', padding: '8px', gap: '4px', minWidth: '160px', marginLeft: '8px' }} onClick={e => e.stopPropagation()}>
                      <button 
                        className="btn timeline-dropdown-btn timeline-dropdown-btn-custom" 
                        onClick={() => {
                          setDropdownOpen(null);
                          setShowGraphicStickerPicker(true);
                        }}
                      >
                        <Sticker size={16} />
                        Stickers
                      </button>
                      <button 
                        className="btn timeline-dropdown-btn timeline-dropdown-btn-custom" 
                        onClick={() => {
                          setDropdownOpen(null);
                          setShowEmojiPicker(true);
                        }}
                      >
                        <Smile size={16} />
                        Emoji
                      </button>
                    </div>
                  )}

                  {dropdownOpen === row.sectionId && row.sectionId === 'audio' && (
                    <div className="glass-card animate-fade-in" style={{ position: 'absolute', top: '-22px', left: '100%', zIndex: 1000, display: 'flex', flexDirection: 'column', padding: '8px', gap: '4px', minWidth: '160px', marginLeft: '8px' }} onClick={e => e.stopPropagation()}>
                      <button 
                        className="btn timeline-dropdown-btn timeline-dropdown-btn-custom" 
                        onClick={() => {
                          setDropdownOpen(null);
                          audioInputRef.current?.click();
                        }}
                      >
                        <UploadCloud size={16} />
                        Upload Audio
                      </button>
                      <button 
                        className="btn timeline-dropdown-btn timeline-dropdown-btn-custom" 
                        onClick={() => {
                          setDropdownOpen(null);
                          setShowAudioModal(true);
                        }}
                      >
                        <Music size={16} />
                        Add Sound
                      </button>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          ))}
        </div>

        {/* Right Side: Sequence Tracks */}
        <div 
          className="timeline-tracks" 
          style={{ flex: 1, position: 'relative', touchAction: 'pan-y', marginRight: '15px' }}
        >
          {/* Tracks */}
          <div style={{ position: 'relative', minHeight: '100%', overflow: 'visible' }}>
            {/* Playhead line overlay over tracks */}
            <PlayheadOverlayLine duration={duration} />
            
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
                  width: '1px', borderLeft: '1px dashed var(--cyber-cyan)', 
                  zIndex: 35, pointerEvents: 'none' 
                }} />
              );
            })()}

            {rows.map((row, idx) => {
            const item = row.item;
            if (!item) {
              return <div key={`empty-${idx}`} style={{ height: '48px', borderBottom: '1px solid var(--glass-border)', position: 'relative', background: 'rgba(255,255,255,0.02)' }} />;
            }

            const leftPercent = (item.startMs / duration) * 100;
            const widthPercent = ((item.endMs - item.startMs) / duration) * 100;
            
            const getItemStyle = (sectionId, currentItem) => {
              if (sectionId === 'audio' && currentItem) {
                const key = (currentItem.url || currentItem.name || currentItem.id || '').trim();
                return audioPaletteMap.get(key) || AUDIO_PALETTES[0];
              }
              switch (sectionId) {
                case 'video': return { background: 'linear-gradient(90deg, #1e40af, #3b82f6)', color: '#bfdbfe', glow: 'rgba(59, 130, 246, 0.6)' }; 
                case 'image': return { background: 'linear-gradient(90deg, #2c3e44, #8b5cf6)', color: '#d8e6e9', glow: 'rgba(139, 92, 246, 0.6)' }; 
                case 'sticker': return { background: 'linear-gradient(90deg, #9d174d, #a855f7)', color: '#fbcfe8', glow: 'rgba(168, 85, 247, 0.6)' }; 
                case 'text': return { background: 'linear-gradient(90deg, #065f46, #10b981)', color: '#a7f3d0', glow: 'rgba(16, 185, 129, 0.6)' };  
                case 'audio': return AUDIO_PALETTES[0];  
                default: return { background: 'var(--accent)', color: 'white', glow: 'rgba(255,255,255,0.5)' };
              }
            };
            const itemTheme = getItemStyle(row.sectionId, item);
            
            return (
              <div key={item.id} style={{ height: '48px', borderBottom: '1px solid var(--glass-border)', position: 'relative', background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                  <div
                    key={item.id}
                    onPointerDown={(e) => handleItemPointerDown(e, item, 'move')}
                    style={{
                      position: 'absolute',
                      left: `${leftPercent}%`,
                      width: `${widthPercent}%`,
                      minWidth: '28px',
                      top: '12%',
                      height: '76%',
                      background: itemTheme.background,
                      color: itemTheme.color || 'white',
                      border: item.type === 'audio' && itemTheme.border ? `1px solid ${itemTheme.border}44` : 'none',
                      borderRadius: '6px',
                      fontSize: '0.65rem',
                      letterSpacing: '0.05em',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      cursor: 'grab',
                      display: 'flex',
                      alignItems: 'center',
                      userSelect: 'none',
                      boxShadow: activeItemId === item.id 
                        ? `0 0 0 2px #fff, 0 0 15px ${itemTheme.glow}, 0 4px 6px rgba(0,0,0,0.5)` 
                        : `0 4px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2), 0 0 8px ${itemTheme.glow || 'transparent'}`,
                      transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                      zIndex: activeItemId === item.id ? 10 : 1
                    }}
                  >
                    {/* Left Handle - Hidden for audio clips so sound remains fixed length and cannot be trimmed or extended */}
                    {item.type !== 'audio' && (
                      <div 
                        onPointerDown={(e) => handleItemPointerDown(e, item, 'resize-left')}
                        style={{ 
                          width: '14px', 
                          height: '100%', 
                          background: 'rgba(0,0,0,0.15)',
                          backdropFilter: 'blur(2px)',
                          cursor: 'ew-resize', 
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRight: '1px solid rgba(255,255,255,0.1)',
                          transition: 'background 0.2s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.15)'}
                      >
                        <div style={{ width: '2px', height: '14px', background: 'rgba(255,255,255,0.6)', borderRadius: '1px' }} />
                      </div>
                    )}
                    
                    <div style={{ 
                      flex: 1, 
                      minWidth: 0,
                      padding: item.type === 'audio' ? '0 10px' : 0,
                      pointerEvents: 'none', 
                      color: 'inherit', 
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      overflow: 'hidden',
                      ...( (item.type === 'video' ? item.thumbnailUrl : ((item.type === 'image' || item.type === 'sticker') ? item.url : null)) ? {
                        backgroundImage: `url(${item.type === 'video' ? item.thumbnailUrl : item.url})`,
                        backgroundSize: item.type === 'sticker' ? 'contain' : 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                      } : {})
                    }}>
                      {item.type !== 'image' && item.type !== 'sticker' && (
                        <span style={{ 
                          background: item.type === 'video' && item.thumbnailUrl ? 'rgba(0,0,0,0.6)' : 'transparent', 
                          padding: '2px 8px', 
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          maxWidth: '90%',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {item.type === 'audio' ? (
                            item.icon ? (
                              <span style={{ fontSize: '0.85rem', lineHeight: 1, flexShrink: 0 }}>{item.icon}</span>
                            ) : (
                              <Music size={12} strokeWidth={2.5} style={{ flexShrink: 0 }} />
                            )
                          ) : (
                            row.icon && React.cloneElement(row.icon, { size: 12, strokeWidth: 2.5, style: { flexShrink: 0 } })
                          )}
                          <span style={{ 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis',
                            fontSize: 'inherit',
                            lineHeight: 1
                          }}>
                            {item.type === 'text' 
                              ? `"${item.text}"` 
                              : item.type === 'audio'
                                ? (item.name || 'Audio')
                                : item.type.toUpperCase()
                            }
                          </span>
                        </span>
                      )}
                    </div>

                    {/* Right Handle - Hidden for audio clips so sound remains fixed length and cannot be trimmed or extended */}
                    {item.type !== 'audio' && (
                      <div 
                        onPointerDown={(e) => handleItemPointerDown(e, item, 'resize-right')}
                        style={{ 
                          width: '14px', 
                          height: '100%', 
                          background: 'rgba(0,0,0,0.15)',
                          backdropFilter: 'blur(2px)',
                          cursor: 'ew-resize', 
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderLeft: '1px solid rgba(255,255,255,0.1)',
                          transition: 'background 0.2s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.15)'}
                      >
                        <div style={{ width: '2px', height: '14px', background: 'rgba(255,255,255,0.6)', borderRadius: '1px' }} />
                      </div>
                    )}
                  </div>
              </div>
            );
          })}

          {/* End of content blur overlay */}
          {(() => {
            const actualDuration = items.length > 0 ? Math.max(...items.map(i => i.endMs)) : 0;
            if (actualDuration >= duration) return null;
            
            const startPercent = (actualDuration / duration) * 100;
            const widthPercent = 100 - startPercent;
            
            return (
              <div style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${startPercent}%`,
                width: `${widthPercent}%`,
                background: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(1px)',
                zIndex: 30, // Above tracks but below playhead/drag indicators
                pointerEvents: 'none'
              }} />
            );
          })()}
        </div>
      </div>
    </div>

    {showGraphicStickerPicker && (
      <ModalPortal>
        <div
          className="modal-backdrop animate-fade-in"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            padding: '16px'
          }}
          onClick={() => setShowGraphicStickerPicker(false)}
        >
        <div
          className="modal-content glass-card modal-lg animate-scale-up"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            width: '90%',
            maxWidth: '680px',
            height: '80vh',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <div className="modal-header flex-between" style={{ alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ margin: '0 auto', color: 'var(--text-main)', textAlign: 'center', flex: 1, paddingLeft: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Sticker size={20} style={{ color: 'var(--cyber-cyan)' }} />
              Choose a Sticker
            </h3>
            <button
              className="btn-close"
              onClick={() => setShowGraphicStickerPicker(false)}
              title="Close"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="search-bar-wrapper margin-bottom-md" style={{ position: 'relative', marginTop: '12px', marginBottom: '14px' }}>
            <Search className="search-icon" size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search meme stickers (glasses, hat, bubble, crown)..." 
              value={graphicStickerSearchQuery}
              onChange={(e) => setGraphicStickerSearchQuery(e.target.value)}
              className="search-input"
              style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '24px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
              onFocus={(e) => e.target.style.borderColor = 'var(--cyber-cyan)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
            />
            {graphicStickerSearchQuery && (
              <button 
                className="btn-clear-search hover-lift"
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--text-main)', cursor: 'pointer', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => setGraphicStickerSearchQuery('')}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '14px', flex: 1, minHeight: 0, overflow: 'hidden' }}>
            {/* Category sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '64px', height: '100%', overflowY: 'auto', paddingRight: '4px', overscrollBehavior: 'contain' }}>
              {GRAPHIC_STICKER_CATEGORIES.map(cat => {
                const isActive = graphicStickerCategory === cat.id && !graphicStickerSearchQuery;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setGraphicStickerCategory(cat.id);
                      setGraphicStickerSearchQuery('');
                    }}
                    style={{
                      padding: '10px 4px',
                      background: isActive ? 'rgba(168, 85, 247, 0.16)' : 'transparent',
                      border: isActive ? '1px solid var(--cyber-cyan)' : '1px solid transparent',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s',
                      color: isActive ? 'var(--cyber-cyan)' : 'var(--text-main)'
                    }}
                    title={cat.label}
                  >
                    <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{cat.icon}</span>
                    <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Graphic stickers grid */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(74px, 1fr))', gap: '10px', overflowY: 'auto', padding: '4px', alignContent: 'start', overscrollBehavior: 'contain', height: '100%' }}>
              {GRAPHIC_STICKERS.filter(s => {
                if (graphicStickerSearchQuery.trim()) {
                  const q = graphicStickerSearchQuery.toLowerCase();
                  return s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q) || (s.id && s.id.toLowerCase().includes(q));
                }
                return s.category === graphicStickerCategory;
              }).map(stk => (
                <button
                  key={stk.id}
                  className="graphic-sticker-btn hover-lift"
                  title={stk.name}
                  onClick={() => handleAddGraphicSticker(stk)}
                  style={{
                    background: 'var(--bg-surface-1)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '12px',
                    padding: '8px 4px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    minHeight: '76px',
                    position: 'relative'
                  }}
                >
                  <img
                    src={stk.url}
                    alt={stk.name}
                    style={{ width: '48px', height: '44px', objectFit: 'contain', pointerEvents: 'none' }}
                    loading="lazy"
                  />
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '68px' }}>
                    {stk.name}
                  </span>
                </button>
              ))}
              {GRAPHIC_STICKERS.filter(s => {
                if (graphicStickerSearchQuery.trim()) {
                  const q = graphicStickerSearchQuery.toLowerCase();
                  return s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q) || (s.id && s.id.toLowerCase().includes(q));
                }
                return s.category === graphicStickerCategory;
              }).length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', padding: '30px 0' }}>
                  No stickers found matching "{graphicStickerSearchQuery}".
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      </ModalPortal>
    )}

    {showEmojiPicker && (
      <ModalPortal>
        <div
          className="modal-backdrop animate-fade-in"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            padding: '16px'
          }}
          onClick={() => setShowEmojiPicker(false)}
        >
        <div
          className="modal-content glass-card modal-lg animate-scale-up"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            width: '90%',
            maxWidth: '680px',
            height: '80vh',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <div className="modal-header flex-between" style={{ alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ margin: '0 auto', color: 'var(--text-main)', textAlign: 'center', flex: 1, paddingLeft: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Smile size={20} style={{ color: 'var(--cyber-cyan)' }} />
              Choose an Emoji
            </h3>
            <button className="btn-close" onClick={() => setShowEmojiPicker(false)} title="Close" aria-label="Close">✕</button>
          </div>
          <div className="search-bar-wrapper margin-bottom-md" style={{ position: 'relative', marginTop: '16px', marginBottom: '16px' }}>
            <Search className="search-icon" size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search emojis..." 
              value={emojiSearchQuery}
              onChange={(e) => setEmojiSearchQuery(e.target.value)}
              className="search-input"
              style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '24px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={(e) => e.target.style.borderColor = 'var(--cyber-cyan)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
            />
            {emojiSearchQuery && (
              <button 
                className="btn-clear-search hover-lift"
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--text-main)', cursor: 'pointer', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => setEmojiSearchQuery('')}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '60px', height: '100%', overflowY: 'auto', paddingRight: '4px', overscrollBehavior: 'contain' }}>
              {[
                { id: 'faces', icon: '😀', label: 'Faces' },
                { id: 'gestures', icon: '👋', label: 'Hands' },
                { id: 'flags', icon: '🏳️‍🌈', label: 'Flags' },
                { id: 'symbols', icon: '❤️', label: 'Symbols' },
                { id: 'objects', icon: '💡', label: 'Objects' }
              ].map(cat => {
                const isActive = emojiCategory === cat.id && !emojiSearchQuery;
                return (
                <button
                  key={cat.id}
                  onClick={() => { setEmojiCategory(cat.id); setEmojiSearchQuery(''); }}
                  style={{
                    padding: '10px 4px',
                    background: isActive ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                    color: isActive ? '#fff' : 'var(--text-main)',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s',
                    opacity: 1
                  }}
                  title={cat.label}
                >
                  <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>{cat.icon}</span>
                  <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'inherit' }}>{cat.label}</span>
                </button>
              )})}
            </div>

            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '12px', overflowY: 'auto', padding: '4px', alignContent: 'start', overscrollBehavior: 'contain', height: '100%' }}>
              {STICKERS.filter(s => {
                if (emojiSearchQuery.trim()) {
                  const q = emojiSearchQuery.toLowerCase();
                  return s.id.includes(q) || (s.name && s.name.toLowerCase().includes(q)) || s.emoji.includes(q);
                }
                return s.category === emojiCategory;
              }).map(s => (
                <button 
                  key={s.id} 
                  className="sticker-chip-btn hover-lift"
                  title={s.name}
                  onClick={() => {
                    handleAddEmoji(s.emoji);
                  }} 
                >
                  {s.emoji}
                </button>
              ))}
              {STICKERS.filter(s => {
                if (emojiSearchQuery.trim()) {
                  const q = emojiSearchQuery.toLowerCase();
                  return s.id.includes(q) || (s.name && s.name.toLowerCase().includes(q)) || s.emoji.includes(q);
                }
                return s.category === emojiCategory;
              }).length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>
                  No emojis found.
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      </ModalPortal>
    )}
    {showImageTemplatePicker && (
      <ModalPortal>
        <div
          className="modal-backdrop animate-fade-in"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            padding: '16px'
          }}
          onClick={() => setShowImageTemplatePicker(false)}
        >
        <div
          className="modal-content glass-card modal-lg animate-scale-up"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            width: '90%',
            maxWidth: '680px',
            height: '80vh',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <div className="modal-header flex-between" style={{ alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ margin: '0 auto', color: 'var(--text-main)', textAlign: 'center', flex: 1, paddingLeft: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <ImageIcon size={20} style={{ color: 'var(--cyber-cyan)' }} />
              Add Template
            </h3>
            <button className="btn-close" onClick={() => setShowImageTemplatePicker(false)} title="Close" aria-label="Close">✕</button>
          </div>

          <div className="picker-search-bar" style={{ position: 'relative', marginBottom: '14px' }}>
            <Search className="search-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder={`Search ${templateList.length}+ meme templates...`}
              value={templateSearchQuery}
              onChange={(e) => setTemplateSearchQuery(e.target.value)}
              className="search-input"
              style={{ paddingLeft: '38px', paddingRight: templateSearchQuery ? '38px' : '14px', height: '42px', width: '100%', boxSizing: 'border-box', borderRadius: '24px' }}
            />
            {templateSearchQuery && (
              <button
                onClick={() => setTemplateSearchQuery('')}
                style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%',
                  width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-muted)', cursor: 'pointer'
                }}
              >
                <X className="icon-xs" style={{ width: '13px', height: '13px' }} />
              </button>
            )}
          </div>

          {/* Category Pills - Horizontal scroll only */}
          <div 
            onWheel={(e) => {
              if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                e.currentTarget.scrollLeft += e.deltaY;
              }
            }}
            style={{
              display: 'flex',
              flexWrap: 'nowrap',
              alignItems: 'center',
              gap: '8px',
              padding: '2px 4px 12px 4px',
              overflowX: 'auto',
              overflowY: 'hidden',
              flexShrink: 0,
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
              borderBottom: '1px solid var(--glass-border)',
              marginBottom: '10px'
            }}
          >
            {CATEGORIES.map((cat) => {
              const isActive = templateCategory === cat.id && !templateSearchQuery;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setTemplateCategory(cat.id);
                    setTemplateSearchQuery('');
                  }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    border: isActive ? '1px solid var(--primary-accent)' : '1px solid var(--glass-border)',
                    background: isActive ? 'var(--primary-gradient)' : 'var(--glass-bg)',
                    color: isActive ? '#ffffff' : 'var(--text-muted)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    boxShadow: isActive ? '0 2px 8px rgba(139, 92, 246, 0.3)' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          <div 
            className="template-picker-mini" 
            style={{ 
              flex: 1, 
              minHeight: 0, 
              overflowY: 'auto', 
              overflowX: 'hidden', 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', 
              gridAutoRows: 'max-content',
              alignContent: 'start',
              gap: '12px', 
              padding: '8px 4px 16px 4px',
              boxSizing: 'border-box',
              overscrollBehavior: 'contain'
            }}
          >
            {filteredTemplates.length > 0 ? (
              filteredTemplates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="template-card glass-card hover-lift"
                  style={{
                    minWidth: 0,
                    width: '100%',
                    height: 'auto',
                    minHeight: '165px',
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: 'var(--bg-surface-1)',
                    border: '1px solid var(--glass-border)',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                  onClick={() => {
                    useEditorStore.getState().addItem({
                      type: 'image',
                      startMs: useEditorStore.getState().playhead,
                      endMs: useEditorStore.getState().playhead + 3000,
                      url: tmpl.imageUrl,
                    });
                    setShowImageTemplatePicker(false);
                    setTemplateSearchQuery('');
                  }}
                >
                  <div
                    className="template-image-wrapper"
                    style={{
                      width: '100%',
                      aspectRatio: '1 / 1',
                      height: '130px',
                      minHeight: '120px',
                      position: 'relative',
                      overflow: 'hidden',
                      background: 'rgba(0, 0, 0, 0.4)',
                      flexShrink: 0
                    }}
                  >
                    <img
                      src={tmpl.imageUrl}
                      alt={tmpl.name}
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: '100%',
                        minHeight: '120px',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                      onError={(e) => {
                        if (tmpl.rawImageUrl && e.currentTarget.src !== tmpl.rawImageUrl) {
                          e.currentTarget.src = tmpl.rawImageUrl;
                        }
                      }}
                    />
                  </div>
                  <div className="template-info" style={{ padding: '6px 8px', minHeight: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxSizing: 'border-box' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, textAlign: 'center', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-main)', width: '100%' }}>
                      {tmpl.name}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>
                No templates found matching "{templateSearchQuery}".
              </div>
            )}
          </div>
        </div>
        </div>
      </ModalPortal>
    )}

    {/* Sound Effects & Soundtrack Library Modal */}
    <AudioModal
      isOpen={showAudioModal}
      onClose={() => setShowAudioModal(false)}
    />

    <VideoTemplateModal
      isOpen={showVideoTemplatePicker}
      onClose={() => setShowVideoTemplatePicker(false)}
      onSelect={(template) => {
        useEditorStore.getState().addItem({
          type: 'video',
          startMs: useEditorStore.getState().playhead,
          endMs: useEditorStore.getState().playhead + template.durationMs,
          url: template.videoUrl,
          thumbnailUrl: template.thumbnailUrl,
          name: template.name,
          width: template.width,
          height: template.height
        });
      }}
    />
  </div>
  );
}

