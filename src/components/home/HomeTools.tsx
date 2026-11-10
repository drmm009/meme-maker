// Home's makers as tiles under the hero carousel, all visible at once: Meme video, Stickers, Face
// swap, Social card, AI meme. Each in its own colour (its carousel slide's), the icon in a squircle
// of it, a faint wash of it in the tile's corner, and one line saying what it does.
import { Clapperboard, MessagesSquare, ScanFace, Scissors, Wand2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CSSProperties } from 'react';
import './homeTools.css';

export type ToolAction = 'video' | 'stickers' | 'faceswap' | 'social' | 'ai';

const TOOLS: { action: ToolAction; label: string; sub: string; tone: string; Icon: LucideIcon }[] = [
  { action: 'video', label: 'Meme video', sub: 'Trim, sound, captions', tone: '#1fb6e8', Icon: Clapperboard },
  { action: 'stickers', label: 'Stickers', sub: 'Cut out any photo', tone: '#14c08a', Icon: Scissors },
  { action: 'faceswap', label: 'Face swap', sub: 'Your face, any meme', tone: '#f5a524', Icon: ScanFace },
  { action: 'social', label: 'Social card', sub: 'Tweet or chat', tone: '#ec4899', Icon: MessagesSquare },
  { action: 'ai', label: 'AI meme', sub: 'From a prompt', tone: '#8b7bff', Icon: Wand2 }
];

export default function HomeTools({ onAction }: { onAction: (action: ToolAction) => void }) {
  return (
    <nav className="hh-tools" aria-label="Makers">
      {TOOLS.map(({ action, label, sub, tone, Icon }) => (
        <button
          key={action}
          type="button"
          className="hh-tool"
          style={{ '--tone': tone } as CSSProperties}
          onClick={() => onAction(action)}
          aria-label={label}
        >
          <span className="hh-tool-icon" aria-hidden="true">
            <Icon strokeWidth={2.2} />
          </span>
          <span className="hh-tool-text">
            <span className="hh-tool-label">{label}</span>
            <span className="hh-tool-sub">{sub}</span>
          </span>
        </button>
      ))}
    </nav>
  );
}
