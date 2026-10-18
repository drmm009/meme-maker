import React from 'react';
import BottomSheet from '../BottomSheet';
import { Sparkles, Check, RotateCcw, Image as ImageIcon } from 'lucide-react';
import { PHOTO_FILTERS } from '../../data/photoFilters';

export default function PhotoFiltersBottomSheet({
  isOpen,
  onClose,
  activeImageLayer,
  imageFilters,
  setImageFilters,
  updateActiveImageLayer,
  previewImage
}) {
  const currentPreset = activeImageLayer
    ? (activeImageLayer.filterId || 'original')
    : (imageFilters?.preset || 'original');

  const fallbackImg = 'https://images.unsplash.com/photo-1555685812-4b943f1cb0eb?w=200&q=80';
  const previewSrc = previewImage || fallbackImg;

  const handleSelectFilter = (filterItem) => {
    if (activeImageLayer && updateActiveImageLayer) {
      updateActiveImageLayer({
        filterId: filterItem.id,
        filter: filterItem.filterString,
        filters: filterItem.values
      });
    } else if (setImageFilters) {
      setImageFilters((prev) => ({
        ...prev,
        preset: filterItem.id,
        filterString: filterItem.filterString,
        ...filterItem.values
      }));
    }
  };

  const handleReset = () => {
    const orig = PHOTO_FILTERS[0];
    if (activeImageLayer && updateActiveImageLayer) {
      updateActiveImageLayer({
        filterId: 'original',
        filter: 'none',
        filters: orig.values
      });
    } else if (setImageFilters) {
      setImageFilters((prev) => ({
        ...prev,
        preset: 'original',
        filterString: 'none',
        ...orig.values
      }));
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Photo Filters"
      icon={<Sparkles size={18} style={{ color: 'var(--cyber-cyan)' }} />}
      maxHeight="78vh"
      contentStyle={{ padding: '6px 16px 20px 16px', overflow: 'hidden' }}
    >
      {/* Target & Scope Control Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.04)',
          padding: '8px 12px',
          borderRadius: '12px',
          border: '1px solid var(--glass-border)',
          marginBottom: '10px',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Apply To:</span>
          {activeImageLayer ? (
            <span
              style={{
                fontSize: '0.74rem',
                fontWeight: 600,
                padding: '3px 10px',
                borderRadius: '12px',
                background: 'rgba(6, 182, 212, 0.16)',
                border: '1px solid var(--cyber-cyan)',
                color: 'var(--cyber-cyan)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <ImageIcon size={12} />
              <span>Image Layer</span>
            </span>
          ) : (
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                className={`btn btn-xs ${imageFilters?.filterScope === 'background' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setImageFilters && setImageFilters((prev) => ({ ...prev, filterScope: 'background' }))}
                style={{
                  padding: '4px 10px',
                  fontSize: '0.74rem',
                  borderRadius: '12px',
                  background: imageFilters?.filterScope === 'background' ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  border: imageFilters?.filterScope === 'background' ? '1px solid var(--cyber-cyan)' : '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                Canvas Only
              </button>
              <button
                type="button"
                className={`btn btn-xs ${imageFilters?.filterScope === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setImageFilters && setImageFilters((prev) => ({ ...prev, filterScope: 'all' }))}
                style={{
                  padding: '4px 10px',
                  fontSize: '0.74rem',
                  borderRadius: '12px',
                  background: imageFilters?.filterScope === 'all' ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  border: imageFilters?.filterScope === 'all' ? '1px solid var(--cyber-cyan)' : '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                Entire Meme
              </button>
            </div>
          )}
        </div>

        {currentPreset !== 'original' && (
          <button
            type="button"
            className="btn btn-xs hover-lift"
            onClick={handleReset}
            style={{
              fontSize: '0.74rem',
              padding: '4px 10px',
              color: '#ff4d6d',
              background: 'rgba(255, 77, 109, 0.12)',
              border: '1px solid rgba(255, 77, 109, 0.30)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.18s ease'
            }}
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Visual Filter Presets Grid */}
      <div
        className="photo-filters-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
          gap: '10px',
          overflowY: 'auto',
          padding: '2px 2px 14px 2px',
          alignContent: 'start',
          overscrollBehavior: 'contain',
          flex: 1
        }}
      >
        {PHOTO_FILTERS.map((filterItem) => {
          const isActive = currentPreset === filterItem.id;
          return (
            <button
              key={filterItem.id}
              id={`filter-sheet-item-${filterItem.id}`}
              type="button"
              className="photo-filter-card hover-lift"
              onClick={() => handleSelectFilter(filterItem)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 6px',
                borderRadius: '14px',
                background: isActive
                  ? 'linear-gradient(180deg, rgba(6, 182, 212, 0.16) 0%, rgba(15, 18, 26, 0.85) 100%)'
                  : 'rgba(255, 255, 255, 0.04)',
                border: isActive
                  ? '2px solid var(--cyber-cyan)'
                  : '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: isActive ? '0 0 16px rgba(6, 182, 212, 0.35)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                position: 'relative',
                textAlign: 'center'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {/* Filter Thumbnail */}
              <div
                style={{
                  width: '100%',
                  aspectRatio: '1 / 1',
                  maxWidth: '84px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  position: 'relative',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: isActive ? '1px solid var(--cyber-cyan)' : '1px solid rgba(255, 255, 255, 0.12)'
                }}
              >
                <img
                  src={previewSrc}
                  alt={filterItem.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: filterItem.filterString,
                    display: 'block',
                    pointerEvents: 'none',
                    transform: 'translateZ(0)'
                  }}
                  loading="lazy"
                  crossOrigin="anonymous"
                />

                {/* Active Checkmark Badge */}
                {isActive && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: 'var(--primary-gradient)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.5)'
                    }}
                  >
                    <Check size={12} strokeWidth={3} color="#ffffff" />
                  </div>
                )}

                {/* Filter Badge Pill */}
                {filterItem.badge && !isActive && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '4px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: '0.52rem',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      color: 'rgba(255, 255, 255, 0.95)',
                      background: 'rgba(0, 0, 0, 0.70)',
                      backdropFilter: 'blur(4px)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none'
                    }}
                  >
                    {filterItem.badge}
                  </span>
                )}
              </div>

              {/* Filter Name */}
              <span
                style={{
                  fontSize: '0.74rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.85)',
                  lineHeight: 1.25,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '86px'
                }}
              >
                {filterItem.name}
              </span>
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}
