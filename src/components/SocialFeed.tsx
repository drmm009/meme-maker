// Social: the community's memes as a feed. Search, filter chips, and per post like, share, download
// and Remix (opens it in the editor). In the editors' look (pages/pageLook.css).
import { useEffect, useRef, useState } from 'react';
import type { MouseEvent, SyntheticEvent } from 'react';
import { Heart, Repeat, Share2, Search, Check, Download, X } from 'lucide-react';
import { COMMUNITY_MEMES } from '../data/communityMemes';
import { safeGet, safeSet } from '../utils/storage';
import './pages/pageLook.css';
import './SocialFeed.css';

interface Post {
  id: string;
  creator: { name: string; handle: string; avatar: string; badge?: string };
  title: string;
  timestamp: string;
  imageUrl: string;
  fallbackUrl?: string;
  likes: number;
  category: string;
  tags: string[];
}

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'trending', label: 'Trending' },
  { id: 'hot', label: 'Hot' },
  { id: 'hall-of-fame', label: 'Hall of Fame' }
] as const;
type TabId = (typeof TABS)[number]['id'];

interface SocialFeedProps {
  onRemixMeme?: (post: Post) => void;
}

export default function SocialFeed({ onRemixMeme }: SocialFeedProps) {
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [likedPosts, setLikedPosts] = useState<string[]>(() => (safeGet('meme_liked_posts') as string[] | null) ?? ['post-1']);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMessage(null), 2400);
  };

  const handleToggleLike = (postId: string, e?: MouseEvent) => {
    e?.stopPropagation();
    setLikedPosts((prev) => {
      const next = prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId];
      safeSet('meme_liked_posts', next);
      return next;
    });
  };

  const handleShare = async (post: Post, e?: MouseEvent) => {
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
      } catch {
        // Fall back to the clipboard if the share sheet was cancelled or failed.
      }
    }
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(`${shareData.text} ${shareData.url}`)
        .then(() => showToast('Link copied'))
        .catch(() => showToast('Couldn’t copy the link'));
    } else {
      showToast('Couldn’t copy the link');
    }
  };

  const handleDownloadImage = (post: Post, e?: MouseEvent) => {
    e?.stopPropagation();
    const link = document.createElement('a');
    link.href = post.imageUrl;
    link.download = `${post.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-meme.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloading');
  };

  const query = searchQuery.trim().toLowerCase();
  const filteredMemes = (COMMUNITY_MEMES as Post[]).filter((post) => {
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'trending' && (post.category === 'trending' || post.likes > 400)) ||
      (activeTab === 'hot' && post.category === 'hot') ||
      (activeTab === 'hall-of-fame' && post.category === 'hall-of-fame');
    const matchesQuery =
      !query ||
      post.title.toLowerCase().includes(query) ||
      post.creator.name.toLowerCase().includes(query) ||
      post.creator.handle.toLowerCase().includes(query) ||
      post.tags.some((t) => t.toLowerCase().includes(query));
    return matchesTab && matchesQuery;
  });

  const onImageError = (post: Post) => (e: SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (post.fallbackUrl && !img.src.endsWith(post.fallbackUrl.replace(/^\.\//, ''))) img.src = post.fallbackUrl;
  };

  return (
    <div className="pg sf social-feed-container">
      {toastMessage && (
        <div className="sf-toast" role="status">
          <Check size={16} strokeWidth={2.6} aria-hidden="true" />
          <span>{toastMessage}</span>
        </div>
      )}

      <label className="pg-search sf-search">
        <Search aria-hidden="true" />
        <input
          ref={searchRef}
          type="search"
          placeholder="Search memes, creators, #tags"
          aria-label="Search memes"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            className="sf-clear"
            onClick={() => {
              setSearchQuery('');
              searchRef.current?.focus();
            }}
            aria-label="Clear search"
          >
            <X size={14} strokeWidth={2.6} />
          </button>
        )}
      </label>

      <div className="pg-chips sf-chips" role="tablist" aria-label="Feed">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`pg-chip${activeTab === tab.id ? ' is-on' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredMemes.length === 0 ? (
        <div className="pg-empty sf-empty">
          <Search className="pg-empty-icon" aria-hidden="true" />
          <h3 className="pg-empty-title">{query ? `No memes match “${searchQuery.trim()}”` : 'No memes here yet'}</h3>
          <p className="pg-empty-text">Try another word or go back to the whole feed.</p>
          <button
            type="button"
            className="pg-btn pg-btn--accent"
            onClick={() => {
              setSearchQuery('');
              setActiveTab('all');
            }}
          >
            Show all memes
          </button>
        </div>
      ) : (
        <div className="sf-feed">
          {filteredMemes.map((post) => {
            const isLiked = likedPosts.includes(post.id);
            const totalLikes = post.likes + (isLiked ? 1 : 0);
            return (
              <article key={post.id} className="sf-post">
                <header className="sf-post-head">
                  <span className="sf-avatar" aria-hidden="true">{post.creator.avatar}</span>
                  <span className="sf-who">
                    <span className="sf-name-row">
                      <span className="sf-name">{post.creator.name}</span>
                      {post.creator.badge && <span className="sf-badge">{post.creator.badge}</span>}
                    </span>
                    <span className="sf-handle">@{post.creator.handle} · {post.timestamp}</span>
                  </span>
                </header>

                <h3 className="sf-title">{post.title}</h3>

                <img src={post.imageUrl} alt={post.title} className="sf-image pg-pic" loading="lazy" onError={onImageError(post)} />

                <p className="sf-tags">{post.tags.map((tag) => `#${tag}`).join('  ')}</p>

                <div className="sf-actions">
                  <button
                    type="button"
                    className={`pg-btn sf-like${isLiked ? ' is-on' : ''}`}
                    onClick={(e) => handleToggleLike(post.id, e)}
                    aria-pressed={isLiked}
                    aria-label={`${isLiked ? 'Unlike' : 'Like'}, ${totalLikes} likes`}
                  >
                    <Heart fill={isLiked ? 'currentColor' : 'none'} aria-hidden="true" />
                    <span>{totalLikes}</span>
                  </button>
                  <button type="button" className="pg-btn pg-btn--icon" onClick={(e) => handleShare(post, e)} aria-label="Share meme" title="Share">
                    <Share2 aria-hidden="true" />
                  </button>
                  <button type="button" className="pg-btn pg-btn--icon" onClick={(e) => handleDownloadImage(post, e)} aria-label="Download image" title="Download">
                    <Download aria-hidden="true" />
                  </button>
                  <button type="button" className="pg-btn pg-btn--accent sf-remix" onClick={() => onRemixMeme?.(post)}>
                    <Repeat aria-hidden="true" />
                    Remix
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
