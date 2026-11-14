// Home's shelf of social cards (tweet, Instagram post, WhatsApp chat), each tagged with its platform.
import { ChevronRight, Share2 } from 'lucide-react';

export default function SocialShelf({
  onSelectTemplate,
  socialShelfTemplates,
  handleShelfSeeAll,
}) {
  return (
    <section className="curated-shelf-section">
      <div className="shelf-header-row">
        <div className="shelf-title-left">
          <div className="shelf-icon-badge social-badge">
            <Share2 size={20} />
          </div>
          <div>
            <h3 className="shelf-heading">Social Media Cards</h3>
            <span className="shelf-subtext">Twitter, WhatsApp & Instagram</span>
          </div>
        </div>
        <button
          type="button"
          className="shelf-see-all-btn"
          onClick={() => handleShelfSeeAll('social')}
        >
          <span>See all</span>
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="shelf-horizontal-scroll">
        {socialShelfTemplates.map((template) => {
          const isTweet = template.id?.includes('tweet');
          const isInsta = template.id?.includes('instagram');
          const isWa = template.id?.includes('whatsapp');
          const tagLabel = isTweet ? '𝕏 Post' : isInsta ? 'IG Post' : isWa ? 'WA Chat' : 'Interactive';
          const cardClass = isTweet ? 'social-card-x' : isInsta ? 'social-card-ig' : isWa ? 'social-card-wa' : '';

          return (
            <div
              key={template.id}
              className={`shelf-meme-card social-shelf-card ${cardClass}`}
              onClick={() => onSelectTemplate(template)}
            >
              <span className="social-card-tag">{tagLabel}</span>
              <div className="shelf-card-thumb-wrap">
                <img
                  src={template.imageUrl || template.thumbnailUrl}
                  alt={template.name}
                  loading="lazy"
                  className="shelf-card-img"
                />
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
