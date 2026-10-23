import React from 'react';
import { Sliders, ArrowLeft, ScanFace } from 'lucide-react';
import { PHOTO_FILTERS } from '../../../data/photoFilters';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';

export default function FiltersTab({
  activeImageLayer,
  handleStartMorphFace,
  template,
}) {
  const activeTab = useEditorUiStore((s) => s.activeTab);
  const setShowFilterPresets = useEditorUiStore((s) => s.setShowFilterPresets);
  const setShowFiltersModal = useEditorUiStore((s) => s.setShowFiltersModal);
  const showFilterPresets = useEditorUiStore((s) => s.showFilterPresets);
  const imageFilters = useMemeEditorStore((s) => s.imageFilters);
  const setImageFilters = useMemeEditorStore((s) => s.setImageFilters);
  const imageLayers = useMemeEditorStore((s) => s.imageLayers);

  return (
    <>
      {activeTab === 'filters' && (
        <div className="tab-content animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* STATE 1: 2 Main Action Buttons / Cards (Shown when !showFilterPresets) */}
          {!showFilterPresets && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', maxWidth: '420px', margin: '0 auto', width: '100%', gap: '10px', justifyContent: 'center' }}>
              {/* 1. Face Swap Action Button */}
              <button
                type="button"
                className="btn hover-lift"
                onClick={() => handleStartMorphFace()}
                style={{
                  padding: '14px 12px',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.18) 0%, rgba(99, 102, 241, 0.18) 100%)',
                  border: '1px solid rgba(6, 182, 212, 0.5)',
                  boxShadow: '0 4px 15px rgba(6, 182, 212, 0.15)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.3) 0%, rgba(99, 102, 241, 0.4) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--cyber-cyan)'
                }}>
                  <ScanFace size={20} style={{ color: 'var(--cyber-cyan)' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>Face Swap</div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.65)' }}>AI Neural Morph</div>
                </div>
              </button>

              {/* 2. Filters Action Button */}
              <button
                type="button"
                className="btn hover-lift"
                onClick={() => setShowFiltersModal(true)}
                style={{
                  padding: '14px 12px',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.18) 0%, rgba(236, 72, 153, 0.18) 100%)',
                  border: '1px solid rgba(249, 115, 22, 0.6)',
                  boxShadow: '0 4px 15px rgba(249, 115, 22, 0.15)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.35) 0%, rgba(236, 72, 153, 0.35) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(249, 115, 22, 0.6)'
                }}>
                  <Sliders size={20} style={{ color: 'var(--accent-orange)' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>Filters</div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.65)' }}>Presets & Adjust</div>
                </div>
              </button>
            </div>
          )}

          {/* STATE 2: Filters Panel with Back Button (Replaces Face Swap & Filters when active) */}
          {showFilterPresets && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Back Navigation Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button
                  type="button"
                  className="btn btn-icon btn-xs btn-secondary hover-lift"
                  onClick={() => setShowFilterPresets(false)}
                  title="Back to AI/Filters"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <ArrowLeft size={16} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sliders size={14} style={{ color: 'var(--accent-orange)' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>Photo Filters</span>
                </div>
                {imageFilters.preset !== 'original' ? (
                  <button
                    type="button"
                    className="btn btn-xs btn-ghost text-red"
                    onClick={() => {
                      setImageFilters(prev => ({
                        ...prev,
                        preset: 'original',
                        filterString: 'none',
                        brightness: 100,
                        contrast: 100,
                        saturation: 100,
                        grayscale: 0,
                        sepia: 0,
                        invert: 0,
                        hueRotate: 0,
                        blur: 0
                      }));
                    }}
                    style={{ fontSize: '0.72rem', padding: '3px 6px' }}
                  >
                    Reset
                  </button>
                ) : <div style={{ width: '40px' }} />}
              </div>
              {/* Scope Selector & Reset */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg-surface-1)',
                padding: '8px 12px',
                borderRadius: '12px',
                border: '1px solid var(--glass-border)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Apply To:</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      className={`btn btn-xs ${imageFilters.filterScope === 'background' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setImageFilters(prev => ({ ...prev, filterScope: 'background' }))}
                      style={{ padding: '3px 8px', fontSize: '0.72rem', borderRadius: '12px' }}
                    >
                      Canvas Only
                    </button>
                    <button
                      type="button"
                      className={`btn btn-xs ${imageFilters.filterScope === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setImageFilters(prev => ({ ...prev, filterScope: 'all' }))}
                      style={{ padding: '3px 8px', fontSize: '0.72rem', borderRadius: '12px' }}
                    >
                      Entire Meme
                    </button>
                  </div>
                </div>
                {imageFilters.preset !== 'original' && (
                  <button
                    type="button"
                    className="btn btn-xs btn-ghost text-red"
                    onClick={() => {
                      setImageFilters(prev => ({
                        ...prev,
                        preset: 'original',
                        filterString: 'none',
                        brightness: 100,
                        contrast: 100,
                        saturation: 100,
                        grayscale: 0,
                        sepia: 0,
                        invert: 0,
                        hueRotate: 0,
                        blur: 0
                      }));
                    }}
                    style={{ fontSize: '0.72rem', padding: '3px 6px' }}
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Filter Presets Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))',
                gap: '8px',
                maxHeight: '260px',
                overflowY: 'auto',
                padding: '4px 2px'
              }}>
                {(() => {
                  let previewImage = 'https://images.unsplash.com/photo-1555685812-4b943f1cb0eb?w=100&q=80';
                  if (activeImageLayer) {
                    previewImage = activeImageLayer.originalUrl || activeImageLayer.url || activeImageLayer.src || previewImage;
                  } else if (imageLayers && imageLayers.length > 0) {
                    previewImage = imageLayers[0].originalUrl || imageLayers[0].url || imageLayers[0].src || previewImage;
                  } else if (template?.imageUrl) {
                    previewImage = template.imageUrl;
                  }

                  return PHOTO_FILTERS.map((filterItem) => {
                    const isFilterActive = (imageFilters.preset || 'original') === filterItem.id;
                    return (
                      <button
                        key={filterItem.id}
                        type="button"
                        className={`btn btn-xs ${isFilterActive ? 'active' : ''}`}
                        onClick={() => {
                          setImageFilters(prev => ({
                            ...prev,
                            preset: filterItem.id,
                            filterString: filterItem.filterString,
                            ...filterItem.values
                          }));
                        }}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          padding: '6px 4px',
                          borderRadius: '12px',
                          background: isFilterActive ? 'rgba(249, 115, 22, 0.2)' : 'var(--bg-surface-1)',
                          border: isFilterActive ? '1.5px solid var(--accent-orange)' : '1px solid var(--glass-border)',
                          cursor: 'pointer',
                          gap: '5px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundImage: `url(${previewImage})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          filter: filterItem.filterString,
                          border: isFilterActive ? '2px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.2)',
                          boxShadow: isFilterActive ? '0 0 8px rgba(249, 115, 22, 0.5)' : 'none'
                        }} />
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: isFilterActive ? 700 : 500,
                          color: isFilterActive ? '#ffffff' : 'var(--text-muted)',
                          textAlign: 'center',
                          lineHeight: 1.1,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '70px'
                        }}>
                          {filterItem.name.replace(' 🔥', '')}
                        </span>
                      </button>
                    );
                  });
                })()}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
