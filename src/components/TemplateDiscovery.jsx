import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MEME_TEMPLATES } from '../data/templates';
import { VIDEO_MEME_TEMPLATES } from '../data/videoTemplates';
import { fetchOpenSourceMemes } from '../services/memeService';
import {
  Laugh, Code,
  Sparkles, Image as ImageIcon, Video,
  Flame, Star, Drama,
  Smile, Zap, ChevronRight, Eye, Wand2, Share2,
  Briefcase, Heart, ArrowUp, X
} from 'lucide-react';
import { safeGet, safeSet } from '../utils/storage';
import { templateNumericId } from '../utils/templateOrder';
import './TemplateDiscovery.css';
import HomeHero from './home/HomeHero';
import { makerTemplate } from './editor/makers';

const AI_VIBE_MODES = [
  { id: 'roast', icon: Flame, emoji: '🔥', label: 'Roast Mode', prompt: 'Roast my daily morning routine and procrastination' },
  { id: 'sarcastic', icon: Laugh, emoji: '😂', label: 'Sarcastic', prompt: 'When the code works on the first try and you suspect a trap' },
  { id: 'wholesome', icon: Heart, emoji: '🐱', label: 'Wholesome', prompt: 'My cat looking at me with unconditional love and judgment' },
  { id: 'tech', icon: Code, emoji: '🧠', label: 'Tech Humor', prompt: 'Pushing directly to production on a Friday afternoon' },
];

function GraphicAiRobot3D() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="hero-3d-svg ai-robot-3d-svg">
      <defs>
        <linearGradient id="aiOrbGrad" x1="15%" y1="15%" x2="85%" y2="85%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="25%" stopColor="#e0e7ff" />
          <stop offset="60%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#3730a3" />
        </linearGradient>
        <radialGradient id="aiVisorGrad" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#082f49" />
        </radialGradient>
        <linearGradient id="aiRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <filter id="aiGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <g transform="translate(6, 4)">
        <ellipse cx="58" cy="102" rx="24" ry="6" fill="#0f172a" opacity="0.35" filter="blur(4px)" className="ai-motion-shadow" />
        <g className="ai-motion-ring-back">
          <ellipse cx="58" cy="62" rx="42" ry="16" fill="none" stroke="url(#aiRingGrad)" strokeWidth="3" opacity="0.55" strokeDasharray="6 3" transform="rotate(-22 58 62)" />
        </g>
        <g className="ai-motion-character">
          <circle cx="58" cy="58" r="30" fill="url(#aiOrbGrad)" />
          <ellipse cx="50" cy="40" rx="14" ry="6" fill="#ffffff" opacity="0.75" transform="rotate(-30 50 40)" />
          <rect x="36" y="47" width="44" height="22" rx="11" fill="url(#aiVisorGrad)" stroke="#1e1b4b" strokeWidth="1.5" />
          <g className="ai-motion-eyes">
            <ellipse cx="48" cy="57" rx="3.5" ry="4.5" fill="#38bdf8" filter="url(#aiGlow)" />
            <ellipse cx="48" cy="57" rx="2" ry="3" fill="#ffffff" />
            <ellipse cx="68" cy="57" rx="3.5" ry="4.5" fill="#38bdf8" filter="url(#aiGlow)" />
            <ellipse cx="68" cy="57" rx="2" ry="3" fill="#ffffff" />
          </g>
          <path d="M58 28 L58 16" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
          <g className="ai-motion-beacon">
            <circle cx="58" cy="13" r="5" fill="#38bdf8" filter="url(#aiGlow)" />
            <circle cx="58" cy="13" r="2.5" fill="#ffffff" />
          </g>
        </g>
        <g className="ai-motion-ring-front">
          <path d="M20 70 A 42 16 0 0 0 96 54" fill="none" stroke="url(#aiRingGrad)" strokeWidth="3.5" transform="rotate(-22 58 62)" />
        </g>
      </g>
      <g className="ai-motion-sparkles">
        <path d="M102 12 C102 18 97 22 91 22 C97 22 102 26 102 32 C102 26 107 22 113 22 C107 22 102 18 102 12 Z" fill="#38bdf8" />
        <circle cx="102" cy="22" r="1.8" fill="#ffffff" />
        <path d="M110 52 C110 55 107 57 104 57 C107 57 110 59 110 62 C110 59 113 57 116 57 C113 57 110 55 110 52 Z" fill="#c084fc" opacity="0.9" />
        <path d="M78 8 C78 11 75 13 72 13 C75 13 78 15 78 18 C78 15 81 13 84 13 C81 13 78 11 78 8 Z" fill="#facc15" />
        <circle cx="114" cy="38" r="1.5" fill="#ffffff" opacity="0.9" />
      </g>
    </svg>
  );
}




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

export default function TemplateDiscovery({ onSelectTemplate, onCreateCustom, onOpenAiGenerator, onNavigateExplore }) {
  const [selectedTag, setSelectedTag] = useState('featured');
  const [sortBy, setSortBy] = useState('trending');
  const [aiPromptText, setAiPromptText] = useState('');
  const [selectedVibe, setSelectedVibe] = useState(null);

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

  const handleSelectVibe = (vibe) => {
    setSelectedVibe(vibe.id);
    setAiPromptText(vibe.prompt);
    openAiMeme(vibe.prompt);
  };

  const handleOpenAiPrompt = (e) => {
    e?.preventDefault?.();
    openAiMeme(aiPromptText.trim());
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
      {!isGridView && <HomeHero onAction={handleFeatureClick} />}
      {/* Upload (the Create card's second button): a photo or video to start from */}
      <input
        type="file"
        ref={cutoutFileInputRef}
        style={{ display: 'none' }}
        accept="image/*,video/*"
        onChange={handleCutoutImageSelected}
      />

      {/* VIEW MODE 1: FEATURED SHELVES (Default Homescreen) */}
      {!isGridView ? (
        <div className="featured-shelves-container">
          {/* 1. SHELF 1: 🔥 Trending Memes with Cartoon Number Badges */}
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

          {/* 3. AI MEME STUDIO GENERATOR CONTAINER (BELOW TRENDING MEMES) */}
          <div className="hero-banner-wrapper glow-theme-ai ai-studio-generator-wrapper">
            <div className="hero-glow-orb hero-glow-orb-1" aria-hidden="true" />
            <div className="hero-banner ai-studio-banner-card" role="region" aria-label="AI Meme Studio Generator">
              <div className="hero-card-header">
                <div className="hero-text-content">
                  <div className="hero-free-badge badge-cyan">
                    <span className="hero-free-dot dot-cyan" />
                    <span>✨ POWERED BY GEMINI 2.5</span>
                  </div>
                  <h2 className="hero-title">
                    <span className="hero-title-line hero-title-line-1">
                      <span className="hero-title-main">AI Meme Studio</span>
                    </span>
                    <br />
                    <span className="hero-title-line hero-title-line-2">
                      <span className="hero-title-gradient grad-sunset">Prompt Generator</span>
                    </span>
                  </h2>
                </div>

                <div className="hero-rocket-graphic" aria-hidden="true">
                  <GraphicAiRobot3D />
                </div>
              </div>

              {/* Interactive Prompt Input Box (Search Bar UI) */}
              <form onSubmit={handleOpenAiPrompt} className="ai-hero-input-form">
                <div className="ai-hero-input-row">
                  <div className="ai-input-prefix">
                    <Wand2 size={18} className="ai-hero-input-icon" />
                  </div>
                  <input
                    type="text"
                    className="ai-hero-prompt-input"
                    placeholder="Make a meme about Monday morning meetings..."
                    value={aiPromptText}
                    onChange={(e) => setAiPromptText(e.target.value)}
                  />
                  {aiPromptText ? (
                    <button
                      type="button"
                      className="ai-hero-clear-btn"
                      onClick={() => setAiPromptText('')}
                      title="Clear prompt"
                      aria-label="Clear prompt"
                    >
                      <X size={14} />
                    </button>
                  ) : null}
                  <button
                    type="submit"
                    className="ai-hero-submit-btn"
                    title="Generate with AI"
                    aria-label="Generate with AI"
                  >
                    <ArrowUp size={16} strokeWidth={2.6} />
                  </button>
                </div>
              </form>

              {/* Creative Vibe / Style Quick Selector (Placed Below Input Box) */}
              <div className="ai-vibe-modes-row" role="region" aria-label="Creative Vibe Selector">
                <span className="ai-vibe-label">Quick Vibe:</span>
                <div className="ai-vibe-pill-list">
                  {AI_VIBE_MODES.map((vibe) => {
                    const VibeIcon = vibe.icon;
                    return (
                      <button
                        key={vibe.id}
                        type="button"
                        className={`ai-vibe-pill ${selectedVibe === vibe.id ? 'active' : ''}`}
                        onClick={() => handleSelectVibe(vibe)}
                        title={`Generate ${vibe.label} meme`}
                      >
                        {VibeIcon ? <VibeIcon size={14} className="ai-vibe-icon" /> : null}
                        <span className="ai-vibe-name">{vibe.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* SHELF 2: 📱 Social Media Cards Shelf (Twitter, Instagram, WhatsApp) */}
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

          {/* SHELF 3: 💼 Work & Office Memes */}
          <section className="curated-shelf-section">
            <div className="shelf-header-row">
              <div className="shelf-title-left">
                <div className="shelf-icon-badge work-badge">
                  <Briefcase size={20} />
                </div>
                <div>
                  <h3 className="shelf-heading">Work & Office</h3>
                  <span className="shelf-subtext">Relatable 9-to-5 & tech humor</span>
                </div>
              </div>
              <button
                type="button"
                className="shelf-see-all-btn"
                onClick={() => handleShelfSeeAll('all')}
              >
                <span>See all</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="shelf-horizontal-scroll">
              {workShelfTemplates.map((template) => (
                <div
                  key={template.id}
                  className="shelf-meme-card"
                  onClick={() => onSelectTemplate(template)}
                >
                  <div className="shelf-card-thumb-wrap">
                    <img
                      src={template.imageUrl || template.thumbnailUrl}
                      alt={template.name}
                      loading="lazy"
                      className="shelf-card-img"
                    />
                    <div className="shelf-card-views">
                      <Eye size={10} />
                      <span>{((templateNumericId(template) % 25) + 18)}K</span>
                    </div>
                  </div>
                  <div className="shelf-card-info">
                    <span className="shelf-card-name" title={template.name}>{template.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SHELF 4: 💑 Relationships & Dating */}
          <section className="curated-shelf-section">
            <div className="shelf-header-row">
              <div className="shelf-title-left">
                <div className="shelf-icon-badge heart-badge">
                  <Heart size={20} />
                </div>
                <div>
                  <h3 className="shelf-heading">Relationships & Life</h3>
                  <span className="shelf-subtext">Dating, couples & friendships</span>
                </div>
              </div>
              <button
                type="button"
                className="shelf-see-all-btn"
                onClick={() => handleShelfSeeAll('all')}
              >
                <span>See all</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="shelf-horizontal-scroll">
              {relationshipShelfTemplates.map((template) => (
                <div
                  key={template.id}
                  className="shelf-meme-card"
                  onClick={() => onSelectTemplate(template)}
                >
                  <div className="shelf-card-thumb-wrap">
                    <img
                      src={template.imageUrl || template.thumbnailUrl}
                      alt={template.name}
                      loading="lazy"
                      className="shelf-card-img"
                    />
                    <div className="shelf-card-views">
                      <Eye size={10} />
                      <span>{((templateNumericId(template) % 35) + 12)}K</span>
                    </div>
                  </div>
                  <div className="shelf-card-info">
                    <span className="shelf-card-name" title={template.name}>{template.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SHELF 5: ⚡ Reactions & Viral Classics */}
          <section className="curated-shelf-section">
            <div className="shelf-header-row">
              <div className="shelf-title-left">
                <div className="shelf-icon-badge react-badge">
                  <Zap size={20} />
                </div>
                <div>
                  <h3 className="shelf-heading">Reaction & Classic</h3>
                  <span className="shelf-subtext">Timeless internet gold</span>
                </div>
              </div>
              <button
                type="button"
                className="shelf-see-all-btn"
                onClick={() => handleShelfSeeAll('reaction')}
              >
                <span>See all</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="shelf-horizontal-scroll">
              {reactionsShelfTemplates.map((template) => (
                <div
                  key={template.id}
                  className="shelf-meme-card"
                  onClick={() => onSelectTemplate(template)}
                >
                  <div className="shelf-card-thumb-wrap">
                    <img
                      src={template.imageUrl || template.thumbnailUrl}
                      alt={template.name}
                      loading="lazy"
                      className="shelf-card-img"
                    />
                    <div className="shelf-card-views">
                      <Eye size={10} />
                      <span>{((templateNumericId(template) % 28) + 20)}K</span>
                    </div>
                  </div>
                  <div className="shelf-card-info">
                    <span className="shelf-card-name" title={template.name}>{template.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        /* VIEW MODE 2: RESPONSIVE MASONRY GRID VIEW (Search, Category Filters, "See All") */
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
                            <img
                              src={template.type === 'video' ? template.thumbnailUrl : template.imageUrl}
                              alt={template.name}
                              loading="lazy"
                              decoding="async"
                              onError={(e) => {
                                const el = e.currentTarget;
                                if (el.dataset.fbk || !template.fallbackUrl) return;
                                el.dataset.fbk = '1';
                                el.src = template.fallbackUrl;
                              }}
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
      )}
    </div>
  );
}
