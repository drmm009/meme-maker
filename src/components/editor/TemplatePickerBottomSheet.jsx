import React, { useState, useMemo, useRef } from 'react';
import BottomSheet from '../BottomSheet';
import { Image as ImageIcon, Search, X } from 'lucide-react';
import { MEME_TEMPLATES } from '../../data/templates';
import { safeGet } from '../../utils/storage';

export const TEMPLATE_TAGS = [
  { id: 'all', label: 'All' },
  { id: 'social', label: 'Social Media' },
  { id: 'images', label: 'Images' },
  { id: 'reaction', label: 'Reactions' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'classics', label: 'Classics' },
  { id: 'multi-panel', label: 'Multi-Panel' },
];

export const CATEGORIES = TEMPLATE_TAGS;

export default function TemplatePickerBottomSheet({
  isOpen,
  onClose,
  templates = MEME_TEMPLATES,
  onSelectTemplate
}) {
  const [imagePickerSearch, setImagePickerSearch] = useState('');
  const [imagePickerCategory, setImagePickerCategory] = useState('all');
  const pickingTemplateRef = useRef(false);

  const [favorites] = useState(() => {
    const saved = safeGet('meme_favorite_templates', []);
    return Array.isArray(saved) ? saved : [];
  });

  const templateList = templates && templates.length > 0 ? templates : MEME_TEMPLATES;

  const filteredImageTemplates = useMemo(() => {
    return templateList
      .filter((template) => {
        // Exclude video templates - this picker is strictly for images
        if (template.type === 'video' || template.mediaType === 'video') {
          return false;
        }

        // Search query filter
        const q = imagePickerSearch.toLowerCase().trim();
        const matchesSearch =
          !q ||
          (template.name && template.name.toLowerCase().includes(q)) ||
          (template.category && template.category.toLowerCase().includes(q)) ||
          (template.tags && template.tags.some((tag) => tag.toLowerCase().includes(q)));

        // Category tag filter (matching TemplateDiscovery logic)
        let matchesTag = true;
        if (imagePickerCategory === 'social') {
          matchesTag = template.category === 'social' || template.category === 'social media' || (template.tags && template.tags.includes('social'));
        } else if (imagePickerCategory === 'all' || imagePickerCategory === 'images') {
          matchesTag = true;
        } else if (imagePickerCategory === 'reaction') {
          matchesTag = template.category === 'reaction';
        } else if (imagePickerCategory === 'favorites') {
          matchesTag = favorites.includes(template.id);
        } else if (imagePickerCategory === 'classics' || imagePickerCategory === 'classic') {
          matchesTag = template.category === 'classic' || template.category === 'popular';
        } else if (imagePickerCategory === 'multi-panel') {
          matchesTag = template.category === 'multi-panel';
        } else if (imagePickerCategory === 'desi') {
          matchesTag = template.category === 'desi';
        }

        return matchesSearch && matchesTag;
      })
      .sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0));
  }, [templateList, imagePickerSearch, imagePickerCategory, favorites]);

  const handleCardClick = (tmpl) => {
    if (pickingTemplateRef.current) return;
    pickingTemplateRef.current = true;
    setTimeout(() => {
      pickingTemplateRef.current = false;
    }, 400);

    onSelectTemplate(tmpl);
    setImagePickerSearch('');
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Add Template"
      icon={<ImageIcon size={17} strokeWidth={2.4} />}
      height="min(82vh, 700px)"
      maxHeight="min(82vh, 700px)"
      contentStyle={{ padding: '6px 16px 18px 16px', overflow: 'hidden' }}
    >
      {/* Search Bar */}
      <div className="bs-search-bar">
        <Search className="bs-search-icon" size={16} />
        <input
          type="text"
          placeholder={`Search ${templateList.length}+ meme templates...`}
          value={imagePickerSearch}
          onChange={(e) => setImagePickerSearch(e.target.value)}
          className="bs-search-input"
          autoFocus={false}
        />
        {imagePickerSearch && (
          <button
            type="button"
            className="bs-clear-search-btn"
            onClick={() => setImagePickerSearch('')}
            aria-label="Clear search"
          >
            <X size={13} strokeWidth={2.4} />
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div
        className="bs-category-bar"
        onWheel={(e) => {
          if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            e.currentTarget.scrollLeft += e.deltaY;
          }
        }}
      >
        {TEMPLATE_TAGS.map((cat) => {
          const isActive = imagePickerCategory === cat.id && !imagePickerSearch;
          return (
            <button
              key={cat.id}
              type="button"
              className={`bs-category-btn ${isActive ? 'active' : ''}`}
              onClick={() => {
                setImagePickerCategory(cat.id);
                setImagePickerSearch('');
              }}
            >
              <span>{cat.label}</span>
              {cat.id === 'favorites' && favorites.length > 0 && (
                <span className="bs-category-count-badge">{favorites.length}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Templates Grid */}
      <div className="template-picker-mini bs-template-grid">
        {filteredImageTemplates.length > 0 ? (
          filteredImageTemplates.map((tmpl) => (
            <div
              key={tmpl.id}
              className="template-card glass-card hover-lift bs-template-card"
              onClick={() => handleCardClick(tmpl)}
            >
              <div className="bs-template-thumb-wrap">
                <img
                  src={tmpl.imageUrl}
                  alt={tmpl.name}
                  loading="lazy"
                />
              </div>
              <div className="bs-template-info">
                <span className="bs-template-title">{tmpl.name}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="bs-empty-state">
            <ImageIcon size={32} strokeWidth={1.5} style={{ opacity: 0.4 }} />
            <span>
              {imagePickerCategory === 'favorites' && !imagePickerSearch
                ? "You haven't starred any templates yet. Star templates on the home screen to access them quickly here!"
                : `No matching templates found for "${imagePickerSearch || imagePickerCategory}"`}
            </span>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
