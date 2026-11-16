// Social: the community's memes as a feed, in the pages' iOS look (pages/iosLook.css, SocialFeed.css).
// A large title, a search field and a segmented control (For you, Trending, Hot, Hall of Fame), a
// row of top creators (tap one to see only theirs), then the posts: each a creator line, the meme
// drawn with its captions, and Like (or double-tap the picture), Share, Download and Remix (opens
// it in the editor, App's handleRemixCommunityMeme). Likes are remembered on this device.
import { useMemo, useRef, useState } from 'react';
import { Check, Download, Heart, Repeat, Search, Share } from 'lucide-react';
import { COMMUNITY_MEMES } from '../data/communityMemes';
import { safeGet, safeSet } from '../utils/storage';
import SegmentedControl from './pages/SegmentedControl';
import SearchField from './pages/SearchField';
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
  { id: 'all', label: 'For you' },
  { id: 'trending', label: 'Trending' },
  { id: 'hot', label: 'Hot' },
  { id: 'hall-of-fame', label: 'Hall of Fame' },
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
            <span className="sf-post-name-text">{post.creator.name}</span>
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
          <Heart size={22} fill={liked ? 'currentColor' : 'none'} aria-hidden="true" />
          <span>{compact(likes)}</span>
        </button>
        <span className="sf-action sf-action--static" title="Remixes">
          <Repeat size={20} aria-hidden="true" />
          <span>{compact(post.remixes || 0)}</span>
        </span>
        <button type="button" className="sf-action" onClick={() => onShare(post)} aria-label="Share" title="Share">
          <Share size={20} aria-hidden="true" />
        </button>
        <button type="button" className="sf-action" onClick={() => onDownload(post)} aria-label="Download" title="Download">
          <Download size={20} aria-hidden="true" />
        </button>
        <button type="button" className="ios-btn ios-btn--filled ios-btn--small sf-remix" onClick={() => onRemix(post)} aria-label={`Remix ${post.title}`}>
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
    <div className="sf ios ios-page">
      <header className="sf-nav">
        <h1 className="ios-title">Social</h1>
        <p className="ios-subtitle">Memes from the community. Remix any of them.</p>
        <SearchField value={query} onChange={setQuery} label="Search memes" placeholder="Search memes, creators, #tags" />
        <SegmentedControl label="Feed" segments={FILTERS} value={filter} onChange={setFilter} />
      </header>

      <section className="sf-creators" aria-label="Top creators">
        <h2 className="ios-section-title">Top creators</h2>
        <div className="sf-creator-row">
          {CREATORS.map((c) => (
            <button
              key={c.handle}
              type="button"
              className="sf-creator"
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
          <span>
            Showing memes by <strong>{creatorName}</strong>
          </span>
          <button type="button" className="ios-text-btn" onClick={() => setCreator(null)}>Show all</button>
        </div>
      )}

      {posts.length === 0 ? (
        <div className="ios-empty">
          <Search className="ios-empty-icon" aria-hidden="true" />
          <h2 className="ios-empty-title">No memes found</h2>
          <p className="ios-empty-text">{query.trim() ? `Nothing matches “${query.trim()}”.` : 'Nothing here yet.'} Try another word or filter.</p>
          <button type="button" className="ios-btn ios-btn--gray ios-btn--capsule" onClick={reset}>Reset filters</button>
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
          <Check size={17} strokeWidth={2.6} aria-hidden="true" /> {toast}
        </div>
      )}
    </div>
  );
}
