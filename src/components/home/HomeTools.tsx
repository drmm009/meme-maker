// Home's makers under the hero carousel, all visible at once: Meme video, Stickers, Face swap,
// Social card, AI meme, GIF maker. One graphite panel, three across and two down, its cells parted
// by hairlines; in each, the maker's icon in the app's orange on a small dark tile, its name under it.
import { Clapperboard, ImagePlay, MessagesSquare, ScanFace, Scissors, Wand2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import './homeTools.css';

export type ToolAction = 'video' | 'stickers' | 'faceswap' | 'social' | 'ai' | 'gif';

const TOOLS: { action: ToolAction; label: string; Icon: LucideIcon }[] = [
  { action: 'video', label: 'Meme video', Icon: Clapperboard },
  { action: 'stickers', label: 'Stickers', Icon: Scissors },
  { action: 'faceswap', label: 'Face swap', Icon: ScanFace },
  { action: 'social', label: 'Social card', Icon: MessagesSquare },
  { action: 'ai', label: 'AI meme', Icon: Wand2 },
  { action: 'gif', label: 'GIF maker', Icon: ImagePlay },
];

export default function HomeTools({ onAction }: { onAction: (action: ToolAction) => void }) {
  return (
    <nav className="hh-tools" aria-label="Makers">
      {TOOLS.map(({ action, label, Icon }) => (
        <button key={action} type="button" className="hh-tool" onClick={() => onAction(action)} aria-label={label}>
          <span className="hh-tool-icon" aria-hidden="true">
            <Icon strokeWidth={2} />
          </span>
          <span className="hh-tool-label">{label}</span>
        </button>
      ))}
    </nav>
  );
}
