// Home's grid view: every template of one kind in columns, more loading as the page scrolls, with a
// way back to the shelves. Shown instead of the shelves when a kind is picked and there is no Explore
// page to go to.
import { Sparkles, Image as ImageIcon, Video, Flame, Star, Drama, Smile, Zap, Eye, Share2 } from 'lucide-react';
import { templateNumericId } from '../../utils/templateOrder';
import TemplateThumb from '../TemplateThumb';

// Compute dynamic, contextual badges so templates show a variety of labels
function getTemplateBadge(template, index = 0) {
  if (!template) return { label: 'Popular', icon: Flame, color: '#ff5e36' };
  if (template.type === 'video') {
    return { label: '', iconOnly: true, icon: Video, color: '#38bdf8' };
  }
  if (template.tag === 'pro') {
    return { label: 'Pro', icon: Zap, color: '#facc15' };
  }
  if (template.category === 'social' || (template.tags && template.tags.includes('social'))) {
    return { label: 'Social', icon: Share2, color: '#38bdf8' };
  }
  if (template.category === 'reaction') {
    return { label: 'Reaction', icon: Smile, color: '#a855f7' };
  }
  if (template.category === 'classic' || (template.trendingScore && template.trendingScore >= 135 && template.trendingScore < 140)) {
    return { label: 'Classic', icon: Drama, color: '#f59e0b' };
  }
  if (template.tag === 'trending' || (template.trendingScore && template.trendingScore >= 140)) {
    return { label: 'Trending', icon: Flame, color: '#ff3b60' };
  }
  if (index % 6 === 4 || (template.trendingScore && template.trendingScore < 30)) {
    return { label: 'New', icon: Sparkles, color: '#10b981' };
  }
  return { label: 'Popular', icon: Flame, color: '#ff5e36' };
}

export default function TemplateGrid({
  onSelectTemplate,
  selectedTag,
  favorites,
  visibleCount,
  setVisibleCount,
  toggleFavorite,
  filteredTemplates,
  PAGE_SIZE,
  sentinelRef,
  masonryColumns,
  handleResetToFeatured,
}) {
  return (
    <div className="grid-browse-container">
      {/* Breadcrumb / Return Pill */}
      <div className="grid-header-actions">
        <button
          type="button"
          className="back-to-featured-btn"
          onClick={handleResetToFeatured}
        >
          <span>← Back to Featured</span>
        </button>
        <div className="grid-results-count">
          {filteredTemplates.length} {filteredTemplates.length === 1 ? 'template' : 'templates'} found
        </div>
      </div>

      {filteredTemplates.length > 0 ? (
        <>
          <div className="template-grid template-masonry-wrapper">
            {masonryColumns.map((colItems, colIdx) => (
              <div key={colIdx} className="template-masonry-col">
                {colItems.map(({ template, originalIndex }) => {
                  const badge = getTemplateBadge(template, originalIndex);
                  const BadgeIcon = badge.icon;
                  return (
                    <div
                      key={template.id}
                      className="template-card"
                      onClick={() => onSelectTemplate(template)}
                    >
                      {/* Top-Left Category Badge */}
                      <span 
                        className={`card-sticker-tag ${badge.iconOnly ? 'card-sticker-icon-only' : ''}`} 
                        style={{ borderColor: `${badge.color}45` }}
                        title={template.type === 'video' ? 'Video Template' : badge.label}
                      >
                        <BadgeIcon size={badge.iconOnly ? 13 : 11} strokeWidth={2.6} style={{ color: badge.color }} />
                        {badge.label ? badge.label : null}
                      </span>

                      {/* Top-Right Favorite Star Button */}
                      <button
                        type="button"
                        className={`card-favorite-btn ${favorites.includes(template.id) ? 'active' : ''}`}
                        onClick={(e) => toggleFavorite(e, template.id)}
                        title={favorites.includes(template.id) ? 'Remove favorite' : 'Add to favorites'}
                        aria-label={favorites.includes(template.id) ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Star 
                          size={13} 
                          fill={favorites.includes(template.id) ? "#facc15" : "none"} 
                          color={favorites.includes(template.id) ? "#facc15" : "rgba(255, 255, 255, 0.72)"} 
                          strokeWidth={favorites.includes(template.id) ? 2.2 : 1.8}
                        />
                      </button>

                      <div 
                        className="template-image-wrapper" 
                        style={{ 
                          position: 'relative', 
                          aspectRatio: (template.width && template.height)
                            ? `${Math.max(0.75, Math.min(1.12, template.width / template.height))}`
                            : '1 / 1'
                        }}
                      >
                        <TemplateThumb
                          src={template.type === 'video' ? template.thumbnailUrl : template.imageUrl}
                          fallbackSrc={template.fallbackUrl}
                          videoUrl={template.type === 'video' ? template.videoUrl : undefined}
                          alt={template.name}
                        />

                        {template.type === 'video' && (
                          <div className="card-video-duration-badge">
                            {typeof template.durationMs === 'number' && Number.isFinite(template.durationMs)
                              ? `${Math.round(template.durationMs / 1000)}s`
                              : 'HD'}
                          </div>
                        )}

                        <div className="card-views-bottom-right-badge">
                          <Eye size={11} />
                          <span>{((templateNumericId(template) % 30) + 12)}K</span>
                        </div>
                      </div>

                      <div className="template-card-footer">
                        <span className="card-footer-title" title={template.name}>{template.name}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {visibleCount < filteredTemplates.length && (
            <div ref={sentinelRef} className="masonry-sentinel">
              <button
                type="button"
                className="studio-pill-btn secondary masonry-load-more-btn"
                onClick={() => setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredTemplates.length))}
              >
                Load more templates ({filteredTemplates.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <ImageIcon className="empty-icon" />
          <h3>No Meme Templates Found</h3>
          <p>
            {selectedTag === 'favorites' 
              ? 'You haven\'t starred any templates yet. Click the star on any meme to save it here!' 
              : 'Try searching for a different keyword or browse all categories!'}
          </p>
          <button
            type="button"
            className="studio-pill-btn primary"
            onClick={handleResetToFeatured}
            style={{ marginTop: '16px' }}
          >
            Back to Featured Memes
          </button>
        </div>
      )}
    </div>
  );
}
