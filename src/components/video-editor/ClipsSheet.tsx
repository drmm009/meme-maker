import { useMemo, useState } from 'react';
import { Clapperboard, LayoutGrid, Play, Search } from 'lucide-react';
import BrowseSheet, { BrowseEmpty, ResultsHead, Shelf, Thumb } from '../editor/panels/BrowseSheet';
import { VIDEO_MEME_TEMPLATES } from '../../data/videoTemplates';

export interface VideoClip {
  id: string;
  name: string;
  category: string;
  videoUrl: string;
  thumbnailUrl: string;
  durationMs: number;
  width?: number;
  height?: number;
}

const CLIPS = VIDEO_MEME_TEMPLATES as VideoClip[];
const CATEGORIES = [...new Set(CLIPS.map((c) => c.category))].map((id) => ({ id, label: id, items: CLIPS.filter((c) => c.category === id) }));
const SHELF_SIZE = 10;

function ClipCard({ clip, onPick }: { clip: VideoClip; onPick: (c: VideoClip) => void }) {
  return (
    <button type="button" className="ie-browse-item ie-card" aria-label={clip.name} onClick={() => onPick(clip)}>
      <span className="vt-clip-thumb">
        <Thumb src={clip.thumbnailUrl} className="ie-card-media vt-clip-media" />
        <span className="vt-clip-play" aria-hidden="true"><Play size={14} fill="currentColor" /></span>
        <span className="vt-clip-dur">{Math.max(1, Math.round(clip.durationMs / 1000))}s</span>
      </span>
      <span className="ie-card-name">{clip.name}</span>
    </button>
  );
}

// Media > Clips: meme video clips laid out like the image editor's Templates, a shelf per category
// (Trending first) with See all; a category or a search shows a grid. A pick adds the clip.
export default function ClipsSheet({ onPick, onClose }: { onPick: (c: VideoClip) => void; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const q = query.trim().toLowerCase();
  const browsing = !q && category === 'all';
  const list = useMemo(
    () => (browsing ? [] : q ? CLIPS.filter((c) => c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)) : CATEGORIES.find((c) => c.id === category)?.items ?? []),
    [browsing, q, category],
  );

  const pick = (c: VideoClip) => {
    onPick(c);
    onClose();
  };
  const choose = (id: string) => { setCategory(id); setQuery(''); };

  return (
    <BrowseSheet
      title="Clips"
      total={CLIPS.length}
      onClose={onClose}
      search={{ value: query, onChange: setQuery, placeholder: 'Search clips', label: 'Search clips' }}
      chips={[{ id: 'all', label: 'All', Icon: LayoutGrid }, ...CATEGORIES.map(({ id, label, items }) => ({ id, label, count: items.length }))]}
      active={query ? null : category}
      onChip={choose}
    >
      {browsing && CATEGORIES.map((s) => (
        <Shelf key={s.id} label={s.label} Icon={Clapperboard} color="var(--ui-accent)" onSeeAll={s.items.length > SHELF_SIZE ? () => choose(s.id) : undefined}>
          {s.items.slice(0, SHELF_SIZE).map((c) => <div key={c.id} className="ie-shelf-card vt-clip-card"><ClipCard clip={c} onPick={pick} /></div>)}
        </Shelf>
      ))}

      {!browsing && (
        <ResultsHead backLabel="All clips" summary={q ? `${list.length} for “${query.trim()}”` : `${category} · ${list.length}`} onBack={() => choose('all')} />
      )}

      {list.length > 0 && (
        <section className="ie-browse-section" aria-label="Results">
          <div className="ie-card-grid vt-clip-grid">
            {list.map((c) => <div key={c.id} className="ie-grid-card"><ClipCard clip={c} onPick={pick} /></div>)}
          </div>
        </section>
      )}

      {!browsing && !list.length && (
        <BrowseEmpty Icon={Search} title={`No clips match “${query.trim()}”`} text="Try a shorter word, or a meme’s nickname." action={{ label: 'Clear search', onClick: () => setQuery('') }} />
      )}
    </BrowseSheet>
  );
}
