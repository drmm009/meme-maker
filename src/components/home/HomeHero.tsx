// Home's top: one Create card (start a meme, or upload a photo or video) and the app's other makers
// as a grid of tiles, all visible at once. In the editors' look: grey cards, plain orange icons,
// a solid orange primary button.
import { ArrowRight, Clapperboard, MessagesSquare, ScanFace, Scissors, Upload, Wand2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import './homeHero.css';

export type HeroAction = 'custom' | 'upload' | 'video' | 'stickers' | 'faceswap' | 'social' | 'ai';

const TOOLS: { action: HeroAction; label: string; Icon: LucideIcon }[] = [
  { action: 'video', label: 'Meme video', Icon: Clapperboard },
  { action: 'stickers', label: 'Stickers', Icon: Scissors },
  { action: 'faceswap', label: 'Face swap', Icon: ScanFace },
  { action: 'social', label: 'Social card', Icon: MessagesSquare },
  { action: 'ai', label: 'AI meme', Icon: Wand2 }
];

// Real templates fanned out on the Create card.
const FAN = ['./images/James-Doakes-Staring-1024x890.webp', './images/drake-smile.jpg', './images/akshay-kumar-disguised-reaction-1024x955.jpg'];

export default function HomeHero({ onAction }: { onAction: (action: HeroAction) => void }) {
  return (
    <section className="hh" aria-label="Create">
      <div className="hh-create">
        <div className="hh-create-top">
          <div className="hh-create-text">
            <h2 className="hh-title">Make a meme</h2>
            <p className="hh-sub">Pick a layout or start from a blank canvas.</p>
          </div>
          <div className="hh-fan" aria-hidden="true">
            {FAN.map((src, i) => (
              <img key={src} src={src} alt="" className={`hh-fan-pic hh-fan-pic--${i}`} decoding="async" />
            ))}
          </div>
        </div>
        <div className="hh-create-actions">
          <button type="button" className="hh-btn hh-btn--accent" onClick={() => onAction('custom')}>
            Start creating
            <ArrowRight aria-hidden="true" />
          </button>
          <button type="button" className="hh-btn" onClick={() => onAction('upload')} title="Upload a photo or video">
            <Upload aria-hidden="true" />
            Upload
          </button>
        </div>
      </div>

      <div className="hh-tools">
        {TOOLS.map(({ action, label, Icon }) => (
          <button key={action} type="button" className="hh-tool" onClick={() => onAction(action)}>
            <Icon className="hh-tool-icon" aria-hidden="true" />
            <span className="hh-tool-label">{label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
