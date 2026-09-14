import React, { useState, useRef, useEffect } from 'react';
import { Music, Play, Pause, Plus, Search, X, Volume2, Check } from 'lucide-react';
import { SOUND_CATEGORIES, SOUND_EFFECTS } from '../../data/soundEffects';
import { useEditorStore } from '../../store/useVideoEditorStore';
import ModalPortal from '../ModalPortal';

export const AudioModal = ({ isOpen, onClose }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingId, setPlayingId] = useState(null);
  const [recentlyAddedId, setRecentlyAddedId] = useState(null);

  const previewAudioRef = useRef(null);

  // Stop preview playback when modal is closed
  useEffect(() => {
    if (!isOpen) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
      setPlayingId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTogglePreview = (sound, e) => {
    e.stopPropagation();

    if (playingId === sound.id) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      setPlayingId(null);
      return;
    }

    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }

    const audio = new Audio(sound.url);
    previewAudioRef.current = audio;
    setPlayingId(sound.id);

    audio.play().catch(err => {
      console.warn('Audio preview play prevented:', err);
      setPlayingId(null);
    });

    audio.onended = () => {
      setPlayingId(null);
      previewAudioRef.current = null;
    };
  };

  const handleAddSound = (sound) => {
    const store = useEditorStore.getState();
    const playhead = store.playhead || 0;
    const durationMs = sound.durationMs || 3000;

    store.addItem({
      type: 'audio',
      url: sound.url,
      name: sound.name,
      durationMs: durationMs,
      icon: sound.icon
    });

    setRecentlyAddedId(sound.id);
    setTimeout(() => {
      setRecentlyAddedId(null);
      onClose();
    }, 450);
  };

  const filteredSounds = SOUND_EFFECTS.filter((sound) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchesName = sound.name.toLowerCase().includes(q);
      const matchesTags = sound.tags && sound.tags.some(tag => tag.toLowerCase().includes(q));
      return matchesName || matchesTags;
    }
    if (activeCategory === 'all') return true;
    return sound.category === activeCategory;
  });

  return (
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
        onClick={onClose}
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
        {/* Modal Header */}
        <div className="modal-header flex-between" style={{ alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ margin: '0 auto', color: '#fff', textAlign: 'center', flex: 1, paddingLeft: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Music size={20} style={{ color: 'var(--cyber-cyan)' }} />
            Add Sound Effect
          </h3>
          <button className="btn-close" onClick={onClose} title="Close">✕</button>
        </div>

        {/* Search Bar */}
        <div className="picker-search-bar" style={{ position: 'relative', marginBottom: '12px' }}>
          <Search className="search-icon" size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search sounds (faah, laugh, vine boom, oof...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            style={{ paddingLeft: '40px', paddingRight: searchQuery ? '38px' : '14px', height: '42px', width: '100%', boxSizing: 'border-box', borderRadius: '24px' }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%',
                width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-muted)', cursor: 'pointer'
              }}
              title="Clear search"
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
            marginBottom: '12px'
          }}
        >
          {SOUND_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id && !searchQuery;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setSearchQuery('');
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: isActive ? '1px solid var(--cyber-cyan)' : '1px solid var(--glass-border)',
                  background: isActive ? 'rgba(168, 85, 247, 0.15)' : 'var(--bg-surface-1)',
                  color: isActive ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sounds List / Grid - vertical scrolling */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '4px 4px 12px 4px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
          gap: '10px',
          alignContent: 'start',
          boxSizing: 'border-box'
        }}>
          {filteredSounds.length === 0 ? (
            <div style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '40px 20px',
              color: 'var(--text-muted)'
            }}>
              <Volume2 size={36} style={{ opacity: 0.3, marginBottom: '10px' }} />
              <p style={{ margin: 0, fontSize: '0.9rem' }}>No sound effects found matching "{searchQuery}"</p>
            </div>
          ) : (
            filteredSounds.map((sound) => {
              const isPlaying = playingId === sound.id;
              const isAdded = recentlyAddedId === sound.id;
              const durationSec = (sound.durationMs / 1000).toFixed(1);

              return (
                <div
                  key={sound.id}
                  className="hover-lift"
                  onClick={() => handleAddSound(sound)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minWidth: 0,
                    boxSizing: 'border-box',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: isPlaying ? 'rgba(168, 85, 247, 0.1)' : 'var(--bg-surface-1)',
                    border: isPlaying ? '1px solid var(--cyber-cyan)' : '1px solid var(--glass-border)',
                    boxShadow: isPlaying ? '0 0 15px rgba(168, 85, 247, 0.2)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                    {/* Preview Play/Stop Button */}
                    <button
                      type="button"
                      onClick={(e) => handleTogglePreview(sound, e)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: isPlaying ? 'var(--cyber-cyan)' : 'var(--bg-surface-1)',
                        border: 'none',
                        color: isPlaying ? '#000' : 'var(--text-main)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0,
                        transition: 'transform 0.15s ease, background 0.15s ease'
                      }}
                      title={isPlaying ? "Stop preview" : "Listen preview"}
                    >
                      {isPlaying ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: '2px' }} />}
                    </button>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '1rem', lineHeight: 1 }}>{sound.icon}</span>
                        <span style={{
                          fontSize: '0.88rem',
                          fontWeight: 600,
                          color: '#fff',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {sound.name}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {durationSec}s
                      </span>
                    </div>
                  </div>

                  {/* Add Button */}
                  <button
                    type="button"
                    className={`btn btn-xs ${isAdded ? 'btn-primary' : 'btn-secondary'} hover-lift`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddSound(sound);
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      flexShrink: 0,
                      marginLeft: '8px',
                      transition: 'all 0.2s ease'
                    }}
                    title="Add sound to timeline"
                  >
                    {isAdded ? (
                      <>
                        <Check size={13} /> Added!
                      </>
                    ) : (
                      <>
                        <Plus size={13} /> Add
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  </ModalPortal>
);
};

export default AudioModal;
