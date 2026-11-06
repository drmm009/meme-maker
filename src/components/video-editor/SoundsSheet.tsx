import { useEffect, useRef, useState } from 'react';
import { LayoutGrid, Pause, Play, Plus, Search } from 'lucide-react';
import BrowseSheet, { BrowseEmpty } from '../editor/panels/BrowseSheet';
import { SOUND_CATEGORIES, SOUND_EFFECTS } from '../../data/soundEffects';

export interface Sound {
  id: string;
  name: string;
  category: string;
  url: string;
  durationMs?: number;
  icon?: string;
  tags?: string[];
}

const SOUNDS = SOUND_EFFECTS as Sound[];
const CHIPS = SOUND_CATEGORIES.map((c: { id: string; label: string; icon: string }) => (c.id === 'all'
  ? { id: 'all', label: 'All', Icon: LayoutGrid }
  : { id: c.id, label: c.label, icon: c.icon, count: SOUNDS.filter((s) => s.category === c.id).length }));

const matches = (s: Sound, q: string) => s.name.toLowerCase().includes(q) || Boolean(s.tags?.some((t) => t.includes(q)));

// Audio > Sounds: meme sounds by category, each with a preview button; tapping a row adds the sound
// at the playhead.
export default function SoundsSheet({ onPick, onClose }: { onPick: (s: Sound) => void; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [playing, setPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const q = query.trim().toLowerCase();
  const list = SOUNDS.filter((s) => (q ? matches(s, q) : category === 'all' || s.category === category));

  const stop = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    setPlaying(null);
  };
  useEffect(() => () => { audioRef.current?.pause(); }, []);

  const preview = (s: Sound) => {
    if (playing === s.id) { stop(); return; }
    audioRef.current?.pause();
    const audio = new Audio(s.url);
    audioRef.current = audio;
    setPlaying(s.id);
    audio.onended = () => { if (audioRef.current === audio) stop(); };
    audio.play()?.catch?.(() => setPlaying(null));
  };
  const pick = (s: Sound) => {
    stop();
    onPick(s);
    onClose();
  };
  const choose = (id: string) => { setCategory(id); setQuery(''); };

  return (
    <BrowseSheet
      title="All sounds"
      total={SOUNDS.length}
      onClose={() => { stop(); onClose(); }}
      search={{ value: query, onChange: setQuery, placeholder: 'Search bruh, boom, laugh…', label: 'Search sounds' }}
      chips={CHIPS}
      active={query ? null : category}
      onChip={choose}
    >
      {list.length > 0 ? (
        <ul className="ie-browse-section vt-sound-list" aria-label="Sounds">
          {list.map((s) => {
            const on = playing === s.id;
            return (
              <li key={s.id} className="vt-sound">
                <button type="button" className={`vt-sound-play${on ? ' is-on' : ''}`} aria-label={on ? `Stop ${s.name}` : `Play ${s.name}`} aria-pressed={on} onClick={() => preview(s)}>
                  {on ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                </button>
                <button type="button" className="vt-sound-add" aria-label={`Add ${s.name}`} onClick={() => pick(s)}>
                  <span className="vt-sound-icon" aria-hidden="true">{s.icon}</span>
                  <span className="vt-sound-name">{s.name}</span>
                  {s.durationMs != null && <span className="vt-sound-dur">{(s.durationMs / 1000).toFixed(1)}s</span>}
                  <Plus size={18} strokeWidth={2.4} aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <BrowseEmpty Icon={Search} title={`No sounds match “${query.trim()}”`} text="Try a word like “boom” or “laugh”." action={{ label: 'Clear search', onClick: () => setQuery('') }} />
      )}
    </BrowseSheet>
  );
}
