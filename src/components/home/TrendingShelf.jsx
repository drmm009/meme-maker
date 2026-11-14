// Home's first shelf: the trending memes, the top ones with a rank badge, each with a favourite star.
import { Flame, Star, ChevronRight, Eye } from 'lucide-react';
import { templateNumericId } from '../../utils/templateOrder';

export default function TrendingShelf({
  onSelectTemplate,
  favorites,
  toggleFavorite,
  trendingShelfTemplates,
  handleShelfSeeAll,
}) {
  return (
    <section className="curated-shelf-section">
      <div className="shelf-header-row">
        <div className="shelf-title-left">
          <div className="shelf-icon-badge flame-badge">
            <Flame size={20} />
          </div>
          <div>
            <h3 className="shelf-heading">Trending Memes</h3>
            <span className="shelf-subtext">Updated today</span>
          </div>
        </div>
        <button
          type="button"
          className="shelf-see-all-btn"
          onClick={() => handleShelfSeeAll('all', 'trending')}
        >
          <span>See all</span>
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="shelf-horizontal-scroll">
        {trendingShelfTemplates.map((template, idx) => {
          const rankNumber = idx + 1;
          return (
            <div
              key={template.id}
              className="shelf-meme-card"
              onClick={() => onSelectTemplate(template)}
            >
              {/* Hero Star Ranking Badge for Top 3 Trending Cards */}
              {rankNumber <= 3 && (
                <div
                  className={`shelf-rank-badge rank-${rankNumber}`}
                  title={`Trending #${rankNumber}`}
                  aria-label={`Trending Rank ${rankNumber}`}
                >
                  <svg
                    className="shelf-rank-star-svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient
                        id={`rankStarGrad-${rankNumber}`}
                        x1="12"
                        y1="1.5"
                        x2="12"
                        y2="21"
                        gradientUnits="userSpaceOnUse"
                      >
                        {rankNumber === 1 && (
                          <>
                            <stop offset="0%" stopColor="#ff6b35" />
                            <stop offset="100%" stopColor="#e11d48" />
                          </>
                        )}
                        {rankNumber === 2 && (
                          <>
                            <stop offset="0%" stopColor="#fbbf24" />
                            <stop offset="100%" stopColor="#d97706" />
                          </>
                        )}
                        {rankNumber === 3 && (
                          <>
                            <stop offset="0%" stopColor="#fde047" />
                            <stop offset="100%" stopColor="#ca8a04" />
                          </>
                        )}
                      </linearGradient>
                    </defs>
                    <polygon
                      points="12 1.5 15.2 8 22.3 9 17.1 14 18.4 21 12 17.6 5.6 21 6.9 14 1.7 9 8.8 8 12 1.5"
                      fill={`url(#rankStarGrad-${rankNumber})`}
                      stroke="rgba(255, 255, 255, 0.7)"
                      strokeWidth="1.2"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="shelf-rank-number">{rankNumber}</span>
                </div>
              )}

              <button
                type="button"
                className={`shelf-favorite-btn ${favorites.includes(template.id) ? 'active' : ''}`}
                onClick={(e) => toggleFavorite(e, template.id)}
                title={favorites.includes(template.id) ? 'Remove favorite' : 'Add to favorites'}
                aria-label="Toggle favorite"
              >
                <Star
                  size={12}
                  fill={favorites.includes(template.id) ? "#facc15" : "none"}
                  color={favorites.includes(template.id) ? "#facc15" : "rgba(255, 255, 255, 0.75)"}
                />
              </button>

              <div className="shelf-card-thumb-wrap">
                <img
                  src={template.imageUrl || template.thumbnailUrl}
                  alt={template.name}
                  loading="lazy"
                  decoding="async"
                  className="shelf-card-img"
                  onError={(e) => {
                    if (e.currentTarget.dataset.fbk || !template.fallbackUrl) return;
                    e.currentTarget.dataset.fbk = '1';
                    e.currentTarget.src = template.fallbackUrl;
                  }}
                />
                <div className="shelf-card-views">
                  <Eye size={10} />
                  <span>{((templateNumericId(template) % 30) + 14)}K</span>
                </div>
              </div>

              <div className="shelf-card-info">
                <span className="shelf-card-name" title={template.name}>{template.name}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
