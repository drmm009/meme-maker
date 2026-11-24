// Home's makers, below the Trending shelf: a heading in Home's shelf style ("Make your own"), then
// Meme video, Stickers, Face swap, AI meme and GIF maker as photo cards, as the Creator sheet's Image
// and Video (social cards have their own shelf on Home, not a card). Each is a meme picture filling
// the card, the maker's icon on a frosted badge in its corner, its name and a line saying what it
// does on a dark fade at the foot; Meme video also has the VIDEO · 0:12 pill with bobbing sound bars.
// Laid out as a bento grid: Meme video a big tall card, the rest smaller around it (homeTools.css).
import { useId } from 'react';
import { Clapperboard, ImagePlay, ScanFace, Scissors, Sparkles, Wand2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import './homeTools.css';

export type ToolAction = 'video' | 'stickers' | 'faceswap' | 'ai' | 'gif';

interface ToolItem {
  action: ToolAction;
  label: string;
  about: string;
  Icon: LucideIcon;
  // A meme picture of its kind, filling the card (public/images).
  picture: string;
}

const TOOLS: ToolItem[] = [
  { action: 'video', label: 'Meme video', about: 'Trim clips, add captions and sound', Icon: Clapperboard, picture: './images/Magnus-Carlsen-table-slam-1024x419.webp' },
  { action: 'stickers', label: 'Stickers', about: 'Cut out a photo in one tap', Icon: Scissors, picture: './images/aura-farming-kid.webp' },
  { action: 'faceswap', label: 'Face swap', about: 'Put your face in any meme', Icon: ScanFace, picture: './images/akshay-kumar-disguised-reaction-1024x955.jpg' },
  { action: 'ai', label: 'AI meme', about: 'Type an idea, get the captions', Icon: Wand2, picture: './images/drake-smile.jpg' },
  { action: 'gif', label: 'GIF maker', about: 'Turn a clip into a GIF', Icon: ImagePlay, picture: './images/Akshay-Kumar-Dance-at-Baraat-1024x428.webp' },
];

export default function HomeTools({ onAction }: { onAction: (action: ToolAction) => void }) {
  const id = useId();
  return (
    <section className="hh-makers">
      <div className="shelf-header-row">
        <div className="shelf-title-left">
          <div className="shelf-icon-badge" aria-hidden="true">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="shelf-heading">Make your own</h3>
            <span className="shelf-subtext">Videos, stickers, GIFs and more</span>
          </div>
        </div>
      </div>

      <nav className="hh-tools" aria-label="Makers">
        {TOOLS.map(({ action, label, about, Icon, picture }) => (
          <button
            key={action}
            type="button"
            className={`hh-tool hh-tool--${action}`}
            onClick={() => onAction(action)}
            aria-label={label}
            aria-describedby={`${id}-${action}`}
          >
            <img className="hh-tool-picture" src={picture} alt="" draggable={false} decoding="async" />
            <span className="hh-tool-icon" aria-hidden="true">
              <Icon strokeWidth={2.2} />
            </span>
            {action === 'video' && (
              <span className="hh-tool-pill" aria-hidden="true">
                <span className="hh-bars"><i /><i /><i /></span>
                VIDEO · 0:12
              </span>
            )}
            <span className="hh-tool-text">
              <span className="hh-tool-label">{label}</span>
              <span className="hh-tool-about" id={`${id}-${action}`}>{about}</span>
            </span>
          </button>
        ))}
      </nav>
    </section>
  );
}
