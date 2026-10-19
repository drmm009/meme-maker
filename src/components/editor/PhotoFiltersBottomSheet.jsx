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
      icon={<Sparkles size={17} strokeWidth={2.4} />}
      maxHeight="78vh"
      contentStyle={{ padding: '6px 16px 20px 16px', overflow: 'hidden' }}
    >
      {/* Target & Scope Control Bar */}
      <div className="bs-control-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="bs-control-label">Apply To:</span>
          {activeImageLayer ? (
            <span className="bs-active-tag">
              <ImageIcon size={12} strokeWidth={2.4} />
              <span>Image Layer</span>
            </span>
          ) : (
            <div className="bs-scope-group">
              <button
                type="button"
                className={`bs-scope-pill ${imageFilters?.filterScope === 'background' ? 'active' : ''}`}
                onClick={() => setImageFilters && setImageFilters((prev) => ({ ...prev, filterScope: 'background' }))}
              >
                Canvas Only
              </button>
              <button
                type="button"
                className={`bs-scope-pill ${imageFilters?.filterScope === 'all' ? 'active' : ''}`}
                onClick={() => setImageFilters && setImageFilters((prev) => ({ ...prev, filterScope: 'all' }))}
              >
                Entire Meme
              </button>
            </div>
          )}
        </div>

        {currentPreset !== 'original' && (
          <button
            type="button"
            className="bs-reset-action-btn hover-lift"
            onClick={handleReset}
          >
            <RotateCcw size={12} strokeWidth={2.4} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Visual Filter Presets Grid */}
      <div className="photo-filters-grid bs-filter-grid">
        {PHOTO_FILTERS.map((filterItem) => {
          const isActive = currentPreset === filterItem.id;
          return (
            <button
              key={filterItem.id}
              id={`filter-sheet-item-${filterItem.id}`}
              type="button"
              className={`photo-filter-card bs-filter-card hover-lift ${isActive ? 'active' : ''}`}
              onClick={() => handleSelectFilter(filterItem)}
            >
              {/* Filter Thumbnail */}
              <div className="bs-filter-thumb">
                <img
                  src={previewSrc}
                  alt={filterItem.name}
                  style={{
                    filter: filterItem.filterString,
                  }}
                  loading="lazy"
                  crossOrigin="anonymous"
                />

                {/* Active Checkmark Badge */}
                {isActive && (
                  <div className="bs-check-badge">
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}

                {/* Filter Badge Pill */}
                {filterItem.badge && !isActive && (
                  <span className="bs-filter-badge-pill">
                    {filterItem.badge}
                  </span>
                )}
              </div>

              {/* Filter Name */}
              <span className="bs-filter-name">
                {filterItem.name}
              </span>
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}
