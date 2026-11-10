// Home's makers as tiles under the hero carousel, all visible at once: Meme video, Stickers, Face
// swap, Social card, AI meme. In the editors' look: grey cards, plain orange icons.
import { Clapperboard, MessagesSquare, ScanFace, Scissors, Wand2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import './homeTools.css';

export type ToolAction = 'video' | 'stickers' | 'faceswap' | 'social' | 'ai';

const TOOLS: { action: ToolAction; label: string; Icon: LucideIcon }[] = [
  { action: 'video', label: 'Meme video', Icon: Clapperboard },
  { action: 'stickers', label: 'Stickers', Icon: Scissors },
  { action: 'faceswap', label: 'Face swap', Icon: ScanFace },
  { action: 'social', label: 'Social card', Icon: MessagesSquare },
  { action: 'ai', label: 'AI meme', Icon: Wand2 }
];

export default function HomeTools({ onAction }: { onAction: (action: ToolAction) => void }) {
  return (
    <nav className="hh-tools" aria-label="Makers">
      {TOOLS.map(({ action, label, Icon }) => (
        <button key={action} type="button" className="hh-tool" onClick={() => onAction(action)}>
          <Icon className="hh-tool-icon" aria-hidden="true" />
          <span className="hh-tool-label">{label}</span>
        </button>
      ))}
    </nav>
  );
}
