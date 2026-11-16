// Home's makers, below the Trending shelf: Meme video, Stickers, Face swap, AI meme and GIF maker,
// as five compact tiles (social cards have their own shelf on Home, not a tile): each a flat grey tile
// with the maker's icon on a soft disc in its own colour over its name. The names stay short so
// two lines at most; there are no tags or arrows (homeTools.css).
import { Clapperboard, ImagePlay, ScanFace, Scissors, Wand2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import './homeTools.css';

export type ToolAction = 'video' | 'stickers' | 'faceswap' | 'ai' | 'gif';

interface ToolItem {
  action: ToolAction;
  label: string;
  Icon: LucideIcon;
}

const TOOLS: ToolItem[] = [
  { action: 'video', label: 'Meme video', Icon: Clapperboard },
  { action: 'stickers', label: 'Stickers', Icon: Scissors },
  { action: 'faceswap', label: 'Face swap', Icon: ScanFace },
  { action: 'ai', label: 'AI meme', Icon: Wand2 },
  { action: 'gif', label: 'GIF maker', Icon: ImagePlay },
];

export default function HomeTools({ onAction }: { onAction: (action: ToolAction) => void }) {
  return (
    <nav className="hh-tools" aria-label="Makers">
      {TOOLS.map(({ action, label, Icon }) => (
        <button key={action} type="button" className={`hh-tool hh-tool--${action}`} onClick={() => onAction(action)} aria-label={label}>
          <span className="hh-tool-icon" aria-hidden="true">
            <Icon strokeWidth={2} />
          </span>
          <span className="hh-tool-label">{label}</span>
        </button>
      ))}
    </nav>
  );
}
