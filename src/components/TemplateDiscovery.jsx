import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MEME_TEMPLATES } from '../data/templates';
import { VIDEO_MEME_TEMPLATES } from '../data/videoTemplates';
import { fetchOpenSourceMemes } from '../services/memeService';
import { Zap, Briefcase, Heart } from 'lucide-react';
import HeroCarousel from './home/HeroCarousel';
import TrendingShelf from './home/TrendingShelf';
import AiMemePrompt from './home/AiMemePrompt';
import SocialShelf from './home/SocialShelf';
import MemeShelf from './home/MemeShelf';
import TemplateGrid from './home/TemplateGrid';
import { safeGet, safeSet } from '../utils/storage';
import { templateNumericId } from '../utils/templateOrder';
import './TemplateDiscovery.css';
import HomeTools from './home/HomeTools';
import { makerTemplate } from './editor/makers';

export default function TemplateDiscovery({ onSelectTemplate, onCreateCustom, onOpenAiGenerator, onNavigateExplore, onOpenGifMaker }) {
  const [selectedTag, setSelectedTag] = useState('featured');
  const [sortBy, setSortBy] = useState('trending');

  // Favorites persistence
  const [favorites, setFavorites] = useState(() => {
    const saved = safeGet('meme_favorite_templates', []);
    return Array.isArray(saved) ? saved : [];
  });

  // Responsive columns count

  const [columnsCount, setColumnsCount] = useState(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 1200) return 4;
      if (window.innerWidth >= 680) return 3;
      return 2;
    }
    return 2;
  });

  useEffect(() => {
    const updateDimensions = () => {
      const w = window.innerWidth;
      if (w >= 1200) setColumnsCount(4);
      else if (w >= 680) setColumnsCount(3);
      else setColumnsCount(2);
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const toggleFavorite = (e, templateId) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = prev.includes(templateId)
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId];
      safeSet('meme_favorite_templates', next);
      return next;
    });
  };

    // Template List with dynamic fetch
  const [templatesList, setTemplatesList] = useState(() => [...MEME_TEMPLATES, ...VIDEO_MEME_TEMPLATES]);

  useEffect(() => {
    let isCancelled = false;
    fetchOpenSourceMemes().then((online) => {
      if (!isCancelled && Array.isArray(online) && online.length > 0) {
        setTemplatesList([...online, ...VIDEO_MEME_TEMPLATES]);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, []);

  // Filtered Templates for Masonry Grid View
  const filteredTemplates = useMemo(() => {
    return templatesList.filter((template) => {
      if (selectedTag === 'featured' || selectedTag === 'all') return true;
      if (selectedTag === 'favorites') return favorites.includes(template.id);
      if (selectedTag === 'social') {
        return template.category === 'social' || (template.tags && template.tags.includes('social'));
      }
      if (selectedTag === 'images') return template.type !== 'video';
      if (selectedTag === 'videos') return template.type === 'video';
      if (selectedTag === 'reaction') {
        return template.category === 'reaction' || (template.tags && template.tags.includes('reaction'));
      }
      if (selectedTag === 'classics') {
        return template.category === 'classic' || (template.tags && template.tags.includes('classic'));
      }
      if (selectedTag === 'multi-panel') {
        return template.category === 'multi-panel' || (template.tags && template.tags.includes('multi-panel'));
      }

      return template.category === selectedTag;
    }).sort((a, b) => {
      if (sortBy === 'popular') return (b.trendingScore || 0) - (a.trendingScore || 0);
      if (sortBy === 'newest') return templateNumericId(b) - templateNumericId(a);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return (b.trendingScore || 0) - (a.trendingScore || 0);
    });
  }, [templatesList, selectedTag, sortBy, favorites]);

  // Curated Shelves Data
  const trendingShelfTemplates = useMemo(() => {
    return templatesList
      .filter(t => t.category !== 'social' && !(t.tags && t.tags.includes('social')))
      .sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0))
      .slice(0, 14);
  }, [templatesList]);

  const socialShelfTemplates = useMemo(() => {
    return templatesList.filter(t => t.category === 'social' || (t.tags && t.tags.includes('social'))).slice(0, 6);
  }, [templatesList]);

  const workShelfTemplates = useMemo(() => {
    const workKeywords = [
      'meeting', 'fine', 'skeleton', 'clown', 'bernie', 'same picture', 'paid', 
      'lenny', 'harold', 'brain', 'homies', 'scientist', 'kermit'
    ];
    return templatesList.filter(t => 
      t.category !== 'social' && (
        workKeywords.some(k => t.name.toLowerCase().includes(k)) ||
        (t.tags && t.tags.some(tag => workKeywords.some(k => tag.toLowerCase().includes(k))))
      )
    ).slice(0, 10);
  }, [templatesList]);

  const relationshipShelfTemplates = useMemo(() => {
    const relKeywords = ['boyfriend', 'cat', 'thinking about other', 'padme', 'friendship ended', 'drake', 'buttons', 'couple'];
    return templatesList.filter(t => 
      t.category !== 'social' && (
        relKeywords.some(k => t.name.toLowerCase().includes(k)) ||
        (t.tags && t.tags.some(tag => relKeywords.some(k => tag.toLowerCase().includes(k))))
      )
    ).slice(0, 10);
  }, [templatesList]);

  const reactionsShelfTemplates = useMemo(() => {
    const reactKeywords = ['hotline', 'disaster', 'change my mind', 'spiderman pointing', 'pikachu', 'roll safe', 'simply', 'batman'];
    return templatesList.filter(t => 
      t.category !== 'social' && (
        t.category === 'reaction' ||
        reactKeywords.some(k => t.name.toLowerCase().includes(k)) ||
        (t.tags && t.tags.some(tag => reactKeywords.some(k => tag.toLowerCase().includes(k))))
      )
    ).slice(0, 10);
  }, [templatesList]);

  // Determine active view mode: Shelves vs Grid
  const isGridView = selectedTag !== 'featured';

  // Pagination for grid
  const PAGE_SIZE = 24;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef(null);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedTag, sortBy]);

  const displayedTemplates = useMemo(() => {
    return filteredTemplates.slice(0, visibleCount);
  }, [filteredTemplates, visibleCount]);

  useEffect(() => {
    if (visibleCount >= filteredTemplates.length) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    if (typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0] && entries[0].isIntersecting) {
            setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredTemplates.length));
          }
        },
        { rootMargin: '400px 0px' }
      );
      observer.observe(sentinel);
      return () => observer.disconnect();
    }
  }, [visibleCount, filteredTemplates.length]);

  const masonryColumns = useMemo(() => {
    const cols = Array.from({ length: columnsCount }, () => []);
    displayedTemplates.forEach((template, index) => {
      cols[index % columnsCount].push({ template, originalIndex: index });
    });
    return cols;
  }, [displayedTemplates, columnsCount]);

  // The AI Meme maker, on the first image meme, its prompt screen starting from `prompt` (or the
  // AI caption generator when there's no editor to open).
  const openAiMeme = (prompt = '') => {
    const template = makerTemplate('ai', templatesList, prompt);
    if (onSelectTemplate && template) onSelectTemplate(template);
    else if (onOpenAiGenerator) onOpenAiGenerator(prompt);
  };

  const handleShelfSeeAll = (tagId, sortOption = 'trending') => {
    if (onNavigateExplore) {
      onNavigateExplore(tagId);
    } else {
      setSelectedTag(tagId);
      setSortBy(sortOption);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const cutoutFileInputRef = useRef(null);

  const handleCutoutImageSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (dataUrl && onSelectTemplate) {
        onSelectTemplate({
          id: `upload-${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, '') || (isVideo ? 'Uploaded Video' : 'Uploaded Meme'),
          imageUrl: dataUrl,
          rawImageUrl: dataUrl,
          videoUrl: isVideo ? dataUrl : undefined,
          type: isVideo ? 'video' : 'image',
          category: 'custom',
          width: 800,
          height: 800
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleFeatureClick = (feature) => {
    const actionKey = typeof feature === 'string' ? feature : (feature?.action || feature?.id);
    if (actionKey === 'stickers' || actionKey === 'faceswap') {
      // The Stickers maker (a blank see-through square) or the Face Swap maker (editor/makers.ts).
      const template = makerTemplate(actionKey === 'stickers' ? 'sticker' : 'faceswap', templatesList);
      if (onSelectTemplate && template) onSelectTemplate(template);
    } else if (actionKey === 'video') {
      if (onCreateCustom) onCreateCustom('video');
    } else if (actionKey === 'custom') {
      if (onCreateCustom) onCreateCustom('image');
    } else if (actionKey === 'social') {
      const cardTemplate = makerTemplate('social', templatesList);
      if (onSelectTemplate && cardTemplate) {
        onSelectTemplate(cardTemplate);
      } else {
        setSelectedTag('social');
      }
    } else if (actionKey === 'ai') {
      openAiMeme();
    } else if (actionKey === 'gif') {
      if (onOpenGifMaker) onOpenGifMaker();
    } else if (actionKey === 'upload') {
      cutoutFileInputRef.current?.click();
    }
  };

  const handleResetToFeatured = () => {
    setSelectedTag('featured');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="template-discovery animate-fade-in">
      {/* 1. STUDIO FEATURES: Flagship Hero Banner Carousel (ON TOP OF HOMESCREEN) */}
      {!isGridView && (
        <HeroCarousel onAction={handleFeatureClick} uploadInputRef={cutoutFileInputRef} onUploadSelected={handleCutoutImageSelected} />
      )}

      {/* The makers as tiles under the carousel, all visible at once */}
      {!isGridView && <HomeTools onAction={handleFeatureClick} />}

      {/* VIEW MODE 1: FEATURED SHELVES (Default Homescreen) */}
      {!isGridView ? (
        <div className="featured-shelves-container">
          {/* 1. SHELF 1: 🔥 Trending Memes with Cartoon Number Badges */}
          <TrendingShelf
            onSelectTemplate={onSelectTemplate}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            trendingShelfTemplates={trendingShelfTemplates}
            handleShelfSeeAll={handleShelfSeeAll}
          />

          {/* 3. AI MEME STUDIO GENERATOR CONTAINER (BELOW TRENDING MEMES) */}
          <AiMemePrompt onOpen={openAiMeme} />

          {/* SHELF 2: 📱 Social Media Cards Shelf (Twitter, Instagram, WhatsApp) */}
          <SocialShelf
            onSelectTemplate={onSelectTemplate}
            socialShelfTemplates={socialShelfTemplates}
            handleShelfSeeAll={handleShelfSeeAll}
          />

          {/* SHELF 3: 💼 Work & Office Memes */}
          <MemeShelf
            title="Work & Office"
            subtitle="Relatable 9-to-5 & tech humor"
            Icon={Briefcase}
            badgeClass="work-badge"
            templates={workShelfTemplates}
            views={[25, 18]}
            onSeeAll={() => handleShelfSeeAll('all')}
            onSelect={onSelectTemplate}
          />

          {/* SHELF 4: 💑 Relationships & Dating */}
          <MemeShelf
            title="Relationships & Life"
            subtitle="Dating, couples & friendships"
            Icon={Heart}
            badgeClass="heart-badge"
            templates={relationshipShelfTemplates}
            views={[35, 12]}
            onSeeAll={() => handleShelfSeeAll('all')}
            onSelect={onSelectTemplate}
          />

          {/* SHELF 5: ⚡ Reactions & Viral Classics */}
          <MemeShelf
            title="Reaction & Classic"
            subtitle="Timeless internet gold"
            Icon={Zap}
            badgeClass="react-badge"
            templates={reactionsShelfTemplates}
            views={[28, 20]}
            onSeeAll={() => handleShelfSeeAll('reaction')}
            onSelect={onSelectTemplate}
          />
        </div>
      ) : (
        /* VIEW MODE 2: RESPONSIVE MASONRY GRID VIEW (Search, Category Filters, "See All") */
        <TemplateGrid
          onSelectTemplate={onSelectTemplate}
          selectedTag={selectedTag}
          favorites={favorites}
          visibleCount={visibleCount}
          setVisibleCount={setVisibleCount}
          toggleFavorite={toggleFavorite}
          filteredTemplates={filteredTemplates}
          PAGE_SIZE={PAGE_SIZE}
          sentinelRef={sentinelRef}
          masonryColumns={masonryColumns}
          handleResetToFeatured={handleResetToFeatured}
        />
      )}
    </div>
  );
}
