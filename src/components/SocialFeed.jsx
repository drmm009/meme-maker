import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  Repeat, 
  Share2, 
  Search, 
  Sparkles, 
  Flame, 
  Trophy, 
  Check, 
  SlidersHorizontal,
  Download,
  Users
} from 'lucide-react';
import { COMMUNITY_MEMES } from '../data/communityMemes';
import { safeGet, safeSet } from '../utils/storage';
import './SocialFeed.css';

export default function SocialFeed({ onRemixMeme, onCreateCustom }) {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [likedPosts, setLikedPosts] = useState(() => {
    return safeGet('meme_liked_posts', ['post-1']);
  });
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  const handleToggleLike = (postId, e) => {
    e?.stopPropagation();
    setLikedPosts((prev) => {
      const isLiked = prev.includes(postId);
      const next = isLiked ? prev.filter((id) => id !== postId) : [...prev, postId];
      safeSet('meme_liked_posts', next);
      return next;
    });
  };

  const handleShare = async (post, e) => {
    e?.stopPropagation();
    const shareData = {
      title: `${post.title} | Meme Studio`,
      text: `Check out this hilarious meme "${post.title}" on Meme Studio!`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        // Fallback to clipboard if user canceled or unsupported
      }
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`).then(() => {
        showToast('Link copied to clipboard!');
      }).catch(() => {
        showToast('Share link ready!');
      });
    } else {
      showToast('Share link ready!');
    }
  };

  const handleDownloadImage = (post, e) => {
    e?.stopPropagation();
    const link = document.createElement('a');
    link.href = post.imageUrl;
    link.download = `${post.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-meme.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloading meme image...');
  };

  const filteredMemes = COMMUNITY_MEMES.filter((post) => {
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'trending' && (post.category === 'trending' || post.likes > 400)) ||
      (activeTab === 'hot' && post.category === 'hot') ||
      (activeTab === 'hall-of-fame' && post.category === 'hall-of-fame');

    const query = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !query ||
      post.title.toLowerCase().includes(query) ||
      post.creator.name.toLowerCase().includes(query) ||
      post.creator.handle.toLowerCase().includes(query) ||
      post.tags.some((t) => t.toLowerCase().includes(query));

    return matchesTab && matchesQuery;
  });

  return (
    <div className="social-feed-container">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            className="social-toast glass-card"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
          >
            <Check size={16} className="text-emerald" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Banner Header */}
      <div className="social-hero-header glass-card">
        <div className="social-hero-badge">
          <Users size={14} />
          <span>COMMUNITY MEME FEED</span>
        </div>
        <h2 className="social-hero-title">
          Trending <span className="text-gradient-sunset">Community Memes</span>
        </h2>
        <p className="social-hero-subtitle">
          Explore viral memes made by fellow creators. Upvote your favorites, share the laughs, or remix any meme directly in the Studio!
        </p>

        {/* Search Bar */}
        <div className="social-search-wrapper">
          <Search size={18} className="social-search-icon" />
          <input
            type="text"
            className="social-search-input"
            placeholder="Search memes, jokes, tags (#developer, #desi)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="social-search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Navigation Tabs */}
        <div className="social-tabs-row">
          <button
            className={`social-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <Sparkles size={15} /> All Feed
          </button>
          <button
            className={`social-tab-btn ${activeTab === 'trending' ? 'active' : ''}`}
            onClick={() => setActiveTab('trending')}
          >
            <Flame size={15} /> Trending
          </button>
          <button
            className={`social-tab-btn ${activeTab === 'hot' ? 'active' : ''}`}
            onClick={() => setActiveTab('hot')}
          >
            <Sparkles size={15} /> Hot
          </button>
          <button
            className={`social-tab-btn ${activeTab === 'hall-of-fame' ? 'active' : ''}`}
            onClick={() => setActiveTab('hall-of-fame')}
          >
            <Trophy size={15} /> Hall of Fame
          </button>
        </div>
      </div>

      {/* Memes Grid */}
      {filteredMemes.length === 0 ? (
        <div className="social-empty-feed glass-card">
          <div className="social-empty-icon">🔍</div>
          <h3>No memes found matching "{searchQuery}"</h3>
          <p>Try searching another keyword or browse all community creations.</p>
          <button
            className="btn btn-primary margin-top"
            onClick={() => {
              setSearchQuery('');
              setActiveTab('all');
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="social-feed-grid">
          {filteredMemes.map((post) => {
            const isLiked = likedPosts.includes(post.id);
            const totalLikes = post.likes + (isLiked ? 1 : 0);

            return (
              <motion.article
                key={post.id}
                className="social-card glass-card"
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
              >
                {/* Creator Header */}
                <div className="social-card-creator">
                  <div className="social-avatar">{post.creator.avatar}</div>
                  <div className="social-creator-info">
                    <div className="social-creator-name-row">
                      <span className="social-creator-name">{post.creator.name}</span>
                      {post.creator.badge && (
                        <span className="social-creator-badge">{post.creator.badge}</span>
                      )}
                    </div>
                    <span className="social-creator-handle">@{post.creator.handle} • {post.timestamp}</span>
                  </div>
                </div>

                {/* Meme Title / Caption */}
                <h3 className="social-card-title">{post.title}</h3>

                {/* Meme Media Display */}
                <div className="social-card-media-wrapper">
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="social-card-image"
                    loading="lazy"
                    onError={(e) => {
                      if (post.fallbackUrl && e.target.src !== post.fallbackUrl) {
                        e.target.src = post.fallbackUrl;
                      }
                    }}
                  />
                </div>

                {/* Tags */}
                <div className="social-card-tags">
                  {post.tags.map((tag) => (
                    <span key={tag} className="social-tag">#{tag}</span>
                  ))}
                </div>

                {/* Action Bar */}
                <div className="social-card-actions">
                  <div className="social-action-buttons-group">
                    <button
                      className={`social-action-btn like-btn ${isLiked ? 'liked' : ''}`}
                      onClick={(e) => handleToggleLike(post.id, e)}
                      title={isLiked ? 'Unlike' : 'Like'}
                    >
                      <Heart size={18} fill={isLiked ? '#ff3b60' : 'none'} stroke={isLiked ? '#ff3b60' : 'currentColor'} />
                      <span>{totalLikes}</span>
                    </button>

                    <button
                      className="social-action-btn share-btn"
                      onClick={(e) => handleShare(post, e)}
                      title="Share meme"
                    >
                      <Share2 size={17} />
                    </button>

                    <button
                      className="social-action-btn download-btn"
                      onClick={(e) => handleDownloadImage(post, e)}
                      title="Download image"
                    >
                      <Download size={17} />
                    </button>
                  </div>

                  {/* Remix in Studio CTA Button */}
                  <button
                    className="social-remix-btn"
                    onClick={() => onRemixMeme?.(post)}
                    title="Remix this meme in Studio"
                  >
                    <Repeat size={15} />
                    <span>Remix</span>
                  </button>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </div>
  );
}
