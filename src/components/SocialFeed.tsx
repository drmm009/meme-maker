// Social: the community's memes as a feed, in the pages' iOS look (pages/iosLook.css, SocialFeed.css).
// A large title with a small Feed switch at the top right (For you, Trending, Hot), a search field, a row of top creators (tap one to see only theirs), then the posts: each a square
// picture card with the creator over its top, and Like (or double-tap the picture), Remix (opens it
// in the editor, App's handleRemixCommunityMeme), Copy link and Download over its foot. Likes are
// remembered on this device.
import { useMemo, useRef, useState } from 'react';
import type { CSSProperties, MouseEvent } from 'react';
import { Check, Download, Heart, Link, Repeat, Search } from 'lucide-react';
import { COMMUNITY_MEMES } from '../data/communityMemes';
import { safeGet, safeSet } from '../utils/storage';
import SegmentedControl from './pages/SegmentedControl';
import SearchField from './pages/SearchField';
import './SocialFeed.css';

interface Creator {
  name: string;
  handle: string;
  // An emoji, shown when there's no photo.
  avatar: string;
  // A profile picture (public/images/avatars/).
  photo?: string;
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
  onCopyLink: (post: CommunityPost) => void;
  onDownload: (post: CommunityPost) => void;
  onRemix: (post: CommunityPost) => void;
}

const POSTS = COMMUNITY_MEMES as CommunityPost[];

const FILTERS = [
  { id: 'all', label: 'For you' },
  { id: 'trending', label: 'Trending' },
  { id: 'hot', label: 'Hot' },
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

// A creator's profile picture, or their emoji when they have none (or it fails to load).
function Avatar({ creator, className }: { creator: Creator; className: string }) {
  const [broken, setBroken] = useState(false);
  return (
    <span className={className} aria-hidden="true">
      {creator.photo && !broken ? (
        <img className="sf-avatar-img" src={creator.photo} alt="" draggable={false} onError={() => setBroken(true)} />
      ) : (
        creator.avatar
      )}
    </span>
  );
}

// One post: the meme as a square, rounded picture card with the creator in a small frosted pill
// at its top left, and along its foot small frosted pills for Like, Remix and Copy link, Download at
// the right, all laid on the picture. The title is the post's name for screen readers only.
function Post({ post, liked, onLike, onCopyLink, onDownload, onRemix }: PostProps) {
  const [burst, setBurst] = useState(0);
  const [src, setSrc] = useState(post.imageUrl);
  const likes = post.likes + (liked ? 1 : 0);
  const like = (e: MouseEvent) => {
    // A double-tap on one of the pills is two taps on that button, not a like.
    if ((e.target as HTMLElement).closest('button')) return;
    if (!liked) onLike(post.id);
    setBurst((b) => b + 1);
  };

  return (
    <article className="sf-post" aria-label={post.title} data-post-id={post.id}>
      <div className="sf-card" onDoubleClick={like}>
        <div className={`sf-meme${post.captionLook ? ` sf-meme--${post.captionLook}` : ''}`}>
          <img
            src={src}
            alt={post.title}
            loading="lazy"
            decoding="async"
            draggable={false}
            onError={() => {
              if (post.fallbackUrl && src !== post.fallbackUrl) setSrc(post.fallbackUrl);
            }}
          />
          {(post.captions || []).map((c, i) => (
            <span key={i} className="sf-meme-caption" style={{ '--y': c.y ?? 0.5 } as CSSProperties}>{c.text}</span>
          ))}
        </div>
        {burst > 0 && <Heart key={burst} className="sf-meme-heart" aria-hidden="true" fill="currentColor" strokeWidth={0} />}

        <header className="sf-post-head">
          <Avatar creator={post.creator} className="sf-avatar" />
          <span className="sf-post-who">
            <span className="sf-post-name">
              <span className="sf-post-name-text">{post.creator.name}</span>
              {post.creator.badge && <span className="sf-badge">{post.creator.badge}</span>}
            </span>
            <span className="sf-post-meta">{post.timestamp}</span>
          </span>
        </header>

        <div className="sf-actions">
          <button
            type="button"
            className={`sf-pill ${liked ? 'is-liked' : ''}`}
            onClick={() => onLike(post.id)}
            aria-pressed={liked}
            aria-label={liked ? 'Unlike' : 'Like'}
          >
            <Heart size={15} fill="currentColor" strokeWidth={liked ? 0 : 2} aria-hidden="true" />
            <span>{compact(likes)}</span>
          </button>
          <button type="button" className="sf-pill" onClick={() => onRemix(post)} aria-label={`Remix ${post.title}`}>
            <Repeat size={14} strokeWidth={2.4} aria-hidden="true" />
            <span>Remix</span>
          </button>
          <button type="button" className="sf-pill sf-pill--round" onClick={() => onCopyLink(post)} aria-label="Copy link" title="Copy link">
            <Link size={14} strokeWidth={2.4} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="sf-pill sf-pill--round sf-pill--end"
            onClick={() => onDownload(post)}
            aria-label="Download"
            title="Download"
          >
            <Download size={14} strokeWidth={2.4} aria-hidden="true" />
          </button>
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

  const copyLink = async (post: CommunityPost) => {
    try {
      await navigator.clipboard.writeText(`"${post.title}" on Meme Studio ${window.location.href}`);
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
        <div className="ios-nav-row sf-nav-row">
          <h1 className="ios-title">Social</h1>
          {/* Which feed: a small switch at the top right. */}
          <SegmentedControl label="Feed" segments={FILTERS} value={filter} onChange={setFilter} className="sf-feed-switch" />
        </div>
        <SearchField value={query} onChange={setQuery} label="Search memes" placeholder="Search memes, creators, #tags" />
      </header>

      <section className="sf-creators" aria-label="Top creators">
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
              <Avatar creator={c} className="sf-creator-avatar" />
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
              onCopyLink={copyLink}
              onDownload={download}
              onRemix={(p) => onRemixMeme?.(p)}
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
