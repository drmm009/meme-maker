// One of Home's shelves of meme templates (Work & Office, Relationships & Life, Reaction & Classic):
// a heading with its icon and See all, then the templates in a row that scrolls sideways.
import type { LucideIcon } from 'lucide-react';
import { ChevronRight, Eye } from 'lucide-react';
import { templateNumericId } from '../../utils/templateOrder';

interface ShelfTemplate {
  id: string;
  name: string;
  imageUrl?: string;
  thumbnailUrl?: string;
}

interface MemeShelfProps<T extends ShelfTemplate> {
  title: string;
  subtitle: string;
  Icon: LucideIcon;
  // The icon badge's colour class (work-badge, heart-badge, react-badge).
  badgeClass: string;
  templates: T[];
  // The made-up view count on each card: [spread, lowest], in thousands, steady per template.
  views: [number, number];
  onSeeAll: () => void;
  onSelect: (template: T) => void;
}

export default function MemeShelf<T extends ShelfTemplate>({ title, subtitle, Icon, badgeClass, templates, views, onSeeAll, onSelect }: MemeShelfProps<T>) {
  const [spread, lowest] = views;
  return (
    <section className="curated-shelf-section">
      <div className="shelf-header-row">
        <div className="shelf-title-left">
          <div className={`shelf-icon-badge ${badgeClass}`}>
            <Icon size={20} />
          </div>
          <div>
            <h3 className="shelf-heading">{title}</h3>
            <span className="shelf-subtext">{subtitle}</span>
          </div>
        </div>
        <button type="button" className="shelf-see-all-btn" onClick={onSeeAll}>
          <span>See all</span>
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="shelf-horizontal-scroll">
        {templates.map((template) => (
          <div key={template.id} className="shelf-meme-card" onClick={() => onSelect(template)}>
            <div className="shelf-card-thumb-wrap">
              <img
                src={template.imageUrl || template.thumbnailUrl}
                alt={template.name}
                loading="lazy"
                className="shelf-card-img"
              />
              <div className="shelf-card-views">
                <Eye size={10} />
                <span>{(templateNumericId(template) % spread) + lowest}K</span>
              </div>
            </div>
            <div className="shelf-card-info">
              <span className="shelf-card-name" title={template.name}>{template.name}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
