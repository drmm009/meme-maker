// Home's makers, below the Trending shelf, as cards: Meme video, Stickers, Face swap, AI meme and
// GIF maker (social cards have their own shelf on Home, not a card). Each card has the maker's icon
// on a tile of its own colour, its name, and a line saying what it does. On a phone the first card
// runs the full width and the rest sit two across; a wide screen puts all five in a row
// (homeTools.css).
import { useId } from 'react';
import { ArrowUpRight, Clapperboard, ImagePlay, ScanFace, Scissors, Wand2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import './homeTools.css';

export type ToolAction = 'video' | 'stickers' | 'faceswap' | 'ai' | 'gif';

interface ToolItem {
  action: ToolAction;
  label: string;
  about: string;
  Icon: LucideIcon;
}

const TOOLS: ToolItem[] = [
  { action: 'video', label: 'Meme video', about: 'Trim clips, add captions and sound', Icon: Clapperboard },
  { action: 'stickers', label: 'Stickers', about: 'Cut out a photo in one tap', Icon: Scissors },
  { action: 'faceswap', label: 'Face swap', about: 'Put your face in any meme', Icon: ScanFace },
  { action: 'ai', label: 'AI meme', about: 'Type an idea, get the captions', Icon: Wand2 },
  { action: 'gif', label: 'GIF maker', about: 'Turn a clip into a GIF', Icon: ImagePlay },
];

export default function HomeTools({ onAction }: { onAction: (action: ToolAction) => void }) {
  const id = useId();
  return (
    <nav className="hh-tools" aria-label="Makers">
      {TOOLS.map(({ action, label, about, Icon }) => (
        <button
          key={action}
          type="button"
          className={`hh-tool hh-tool--${action}`}
          onClick={() => onAction(action)}
          aria-label={label}
          aria-describedby={`${id}-${action}`}
        >
          <span className="hh-tool-icon" aria-hidden="true">
            <Icon strokeWidth={2.1} />
          </span>
          <span className="hh-tool-text">
            <span className="hh-tool-label">{label}</span>
            <span className="hh-tool-about" id={`${id}-${action}`}>{about}</span>
          </span>
          <ArrowUpRight className="hh-tool-go" aria-hidden="true" />
        </button>
      ))}
    </nav>
  );
}
