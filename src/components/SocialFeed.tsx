// Social: the community's memes as a feed. A centred title, a search field and filter chips (For
// you, Trending, Hot, Hall of Fame), a row of top creators (tap one to see only theirs), then the
// posts: each a creator line, the meme drawn with its captions, and Like (or double-tap the
// picture), Share, Download and Remix (opens it in the editor, App's handleRemixCommunityMeme).
// Likes are remembered on this device.
import { useMemo, useRef, useState } from 'react';
import { Check, Download, Flame, Heart, Repeat, Search, Share2, Sparkles, Trophy, X } from 'lucide-react';
import { COMMUNITY_MEMES } from '../data/communityMemes';
import { safeGet, safeSet } from '../utils/storage';
import './SocialFeed.css';

interface Creator {
  name: string;
  handle: string;
  avatar: string;
  badge?: string;
}

interface CommunityPost {
  id: string;
  creator: Creator;
  title: string;
  timestamp: string;
  imageUrl: string;
  fallbackUrl?: string;
  likes: number;
  remixes?: number;
  category: string;
  tags: string[];
  captions?: { text: string; y?: number }[];
  // How the captions are drawn when not the default (e.g. 'poster').
  captionLook?: string;
}

interface PostProps {
  post: CommunityPost;
  liked: boolean;
  onLike: (id: string) => void;
  onShare: (post: CommunityPost) => void;
  onDownload: (post: CommunityPost) => void;
  onRemix: (post: CommunityPost) => void;
  onTag: (tag: string) => void;
}

const POSTS = COMMUNITY_MEMES as CommunityPost[];

const FILTERS = [
  { id: 'all', label: 'For you', Icon: Sparkles },
  { id: 'trending', label: 'Trending', Icon: Flame },
  { id: 'hot', label: 'Hot', Icon: Heart },
  { id: 'hall-of-fame', label: 'Hall of Fame', Icon: Trophy },
];

const LIKES_KEY = 'meme_liked_posts';
const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '')}k` : String(n));
const fileName = (title: string) => `${String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'meme'}.jpg`;

const inFilter = (post: CommunityPost, filter: string) =>
  filter === 'all' ||
  (filter === 'trending' && (post.category === 'trending' || post.likes > 400)) ||
  post.category === filter;

const matches = (post: CommunityPost, query: string) => {
  if (!query) return true;
  const q = query.toLowerCase().replace(/^[#@]/, '');
  return (
    post.title.toLowerCase().includes(q) ||
    post.creator.name.toLowerCase().includes(q) ||
    post.creator.handle.toLowerCase().includes(q) ||
    post.tags.some((t) => t.toLowerCase().includes(q))
  );
};

// The community's creators, most-liked first.
const CREATORS = (() => {
  const byHandle = new Map<string, Creator & { likes: number }>();
  for (const p of POSTS) {
    const c = byHandle.get(p.creator.handle) || { ...p.creator, likes: 0 };
    c.likes += p.likes;
    byHandle.set(p.creator.handle, c);
  }
  return [...byHandle.values()].sort((a, b) => b.likes - a.likes);
})();

// One post: the creator, the meme with its captions, its actions, then its title and tags.
function Post({ post, liked, onLike, onShare, onDownload, onRemix, onTag }: PostProps) {
  const [burst, setBurst] = useState(0);
  const likes = post.likes + (liked ? 1 : 0);
  const like = () => {
    if (!liked) onLike(post.id);
    setBurst((b) => b + 1);
  };

  return (
    <article className="sf-post" aria-label={post.title}>
      <header className="sf-post-head">
        <span className="sf-avatar" aria-hidden="true">{post.creator.avatar}</span>
        <div className="sf-post-who">
          <span className="sf-post-name">
            {post.creator.name}
            {post.creator.badge && <span className="sf-badge">{post.creator.badge}</span>}
          </span>
          <span className="sf-post-meta">@{post.creator.handle} · {post.timestamp}</span>
        </div>
      </header>

      <div className={`sf-meme${post.captionLook ? ` sf-meme--${post.captionLook}` : ''}`} onDoubleClick={like}>
        <img
          src={post.imageUrl}
          alt={post.title}
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={(e) => {
            const img = e.currentTarget;
            if (post.fallbackUrl && !img.dataset.fellBack) {
              img.dataset.fellBack = '1';
              img.src = post.fallbackUrl;
            }
          }}
        />
        {(post.captions || []).map((c, i) => (
          <span key={i} className="sf-meme-caption" style={{ top: `${(c.y ?? 0.5) * 100}%` }}>{c.text}</span>
        ))}
        {burst > 0 && <Heart key={burst} className="sf-meme-heart" aria-hidden="true" fill="currentColor" strokeWidth={0} />}
      </div>

      <div className="sf-actions">
        <button
          type="button"
          className={`sf-action ${liked ? 'is-liked' : ''}`}
          onClick={() => onLike(post.id)}
          aria-pressed={liked}
          aria-label={liked ? 'Unlike' : 'Like'}
        >
          <Heart size={21} fill={liked ? 'currentColor' : 'none'} />
          <span>{compact(likes)}</span>
        </button>
        <span className="sf-action sf-action--static" title="Remixes">
          <Repeat size={19} aria-hidden="true" />
          <span>{compact(post.remixes || 0)}</span>
        </span>
        <button type="button" className="sf-action" onClick={() => onShare(post)} aria-label="Share" title="Share">
          <Share2 size={19} />
        </button>
        <button type="button" className="sf-action" onClick={() => onDownload(post)} aria-label="Download" title="Download">
          <Download size={19} />
        </button>
        <button type="button" className="sf-remix" onClick={() => onRemix(post)} aria-label={`Remix ${post.title}`}>
          <Repeat size={16} strokeWidth={2.4} />
          Remix
        </button>
      </div>

      <div className="sf-post-body">
        <h3 className="sf-post-title">{post.title}</h3>
        <div className="sf-tags">
          {post.tags.map((t) => (
            <button key={t} type="button" className="sf-tag" onClick={() => onTag(t)}>#{t}</button>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function SocialFeed({ onRemixMeme }: { onRemixMeme?: (post: CommunityPost) => void }) {
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [creator, setCreator] = useState<string | null>(null);
  const [liked, setLiked] = useState<string[]>(() => {
    const v: unknown = safeGet(LIKES_KEY);
    return Array.isArray(v) ? v : [];
  });
  const [toast, setToast] = useState('');
  const toastTimer = useRef(0);
  const searchRef = useRef<HTMLInputElement>(null);

  const say = (msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 2200);
  };

  const toggleLike = (id: string) => {
    setLiked((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      safeSet(LIKES_KEY, next);
      return next;
    });
  };

  const share = async (post: CommunityPost) => {
    const text = `"${post.title}" on Meme Studio`;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: post.title, text, url });
        return;
      } catch {
        // Cancelled or not allowed: copy the link instead.
      }
    }
    try {
      await navigator.clipboard?.writeText(`${text} ${url}`);
      say('Link copied');
    } catch {
      say('Could not copy the link');
    }
  };

  const download = (post: CommunityPost) => {
    const a = document.createElement('a');
    a.href = post.imageUrl;
    a.download = fileName(post.title);
    document.body.appendChild(a);
    a.click();
    a.remove();
    say('Downloading…');
  };

  const searchTag = (tag: string) => {
    setCreator(null);
    setQuery(`#${tag}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const posts = useMemo(
    () => POSTS.filter((p) => inFilter(p, filter) && matches(p, query.trim()) && (!creator || p.creator.handle === creator)),
    [filter, query, creator]
  );
  const creatorName = creator && CREATORS.find((c) => c.handle === creator)?.name;

  const reset = () => {
    setQuery('');
    setFilter('all');
    setCreator(null);
  };

  return (
    <div className="sf">
      <header className="sf-head">
        <h2 className="sf-title">Social</h2>
        <p className="sf-sub">Memes from the community. Remix any of them.</p>
      </header>

      <div className="sf-search">
        <Search size={18} className="sf-search-icon" aria-hidden="true" />
        <input
          ref={searchRef}
          type="search"
          className="sf-search-input"
          placeholder="Search memes, creators, #tags"
          aria-label="Search memes"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button type="button" className="sf-search-clear" onClick={() => { setQuery(''); searchRef.current?.focus(); }} aria-label="Clear search">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="sf-chips" role="tablist" aria-label="Feed">
        {FILTERS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={filter === id}
            className={`sf-chip ${filter === id ? 'is-active' : ''}`}
            onClick={(e) => {
              setFilter(id);
              e.currentTarget.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
            }}
          >
            <Icon size={15} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      <section className="sf-creators" aria-label="Top creators">
        <h3 className="sf-section-title">Top creators</h3>
        <div className="sf-creator-row">
          {CREATORS.map((c) => (
            <button
              key={c.handle}
              type="button"
              className={`sf-creator ${creator === c.handle ? 'is-active' : ''}`}
              onClick={() => setCreator((cur) => (cur === c.handle ? null : c.handle))}
              aria-pressed={creator === c.handle}
              aria-label={`Show memes by ${c.name}`}
            >
              <span className="sf-creator-avatar" aria-hidden="true">{c.avatar}</span>
              <span className="sf-creator-name">{c.name}</span>
            </button>
          ))}
        </div>
      </section>

      {creatorName && (
        <div className="sf-filtering">
          Showing memes by <strong>{creatorName}</strong>
          <button type="button" onClick={() => setCreator(null)}>Show all</button>
        </div>
      )}

      {posts.length === 0 ? (
        <div className="sf-empty">
          <span className="sf-empty-icon" aria-hidden="true"><Search size={24} /></span>
          <h3 className="sf-empty-title">No memes found</h3>
          <p className="sf-empty-text">{query.trim() ? `Nothing matches "${query.trim()}".` : 'Nothing here yet.'} Try another word or filter.</p>
          <button type="button" className="sf-btn" onClick={reset}>Reset filters</button>
        </div>
      ) : (
        <div className="sf-feed">
          {posts.map((post) => (
            <Post
              key={post.id}
              post={post}
              liked={liked.includes(post.id)}
              onLike={toggleLike}
              onShare={share}
              onDownload={download}
              onRemix={(p) => onRemixMeme?.(p)}
              onTag={searchTag}
            />
          ))}
        </div>
      )}

      {toast && (
        <div className="sf-toast" role="status">
          <Check size={16} aria-hidden="true" /> {toast}
        </div>
      )}
    </div>
  );
}
