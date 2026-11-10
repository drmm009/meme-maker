// The Stickers and AI Meme makers' top bar: Back, the maker's title on a tile in its colour (its Home
// tile's), undo and redo in one capsule, and under them a three-step track, the step the work is on
// lit orange and the ones done ticked. Where it stands is also said in words for screen readers.
import { Check, ChevronLeft, Redo2, Scissors, Undo2, Wand2 } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useMemeEditorHistory, useMemeEditorStore } from '../store/useMemeEditorStore';
import { stickerStep } from '../stickerMaker';
import { aiStep } from '../aiMeme';
import './makerTopBar.css';

type Step = 0 | 1 | 2;
type DocState = {
  imageLayers: { originalUrl?: string | null }[];
  activeTemplate: { imageUrl?: unknown; aiPicked?: unknown } | null;
  undo: () => void;
  redo: () => void;
};
type HistoryState = { pastStates: unknown[]; futureStates: unknown[] };
export type MakerBarMode = 'sticker' | 'ai';

const MAKERS: Record<MakerBarMode, { title: string; Icon: LucideIcon; tone: string; steps: string[]; status: string[]; stepOf: (s: DocState) => Step }> = {
  sticker: {
    title: 'Stickers',
    Icon: Scissors,
    tone: '#14c08a',
    steps: ['Photo', 'Style', 'Export'],
    status: ['Add a photo', 'Ready to generate', 'Ready to export'],
    stepOf: (s) => stickerStep(s.imageLayers),
  },
  ai: {
    title: 'AI Meme',
    Icon: Wand2,
    tone: '#8b7bff',
    steps: ['Meme', 'Idea', 'Export'],
    status: ['Pick a meme', 'Pick a meme and an idea', 'Ready to export'],
    stepOf: (s) => aiStep(s.activeTemplate),
  },
};

export default function MakerTopBar({ mode, onBack }: { mode: MakerBarMode; onBack: () => void }) {
  const { title, Icon, tone, steps, status, stepOf } = MAKERS[mode];
  const step = useMemeEditorStore((s: DocState) => stepOf(s));
  const undo = useMemeEditorStore((s: DocState) => s.undo);
  const redo = useMemeEditorStore((s: DocState) => s.redo);
  const canUndo = useMemeEditorHistory((s: HistoryState) => s.pastStates.length > 0);
  const canRedo = useMemeEditorHistory((s: HistoryState) => s.futureStates.length > 0);

  return (
    <header className="mtb" style={{ '--mtb-tone': tone } as CSSProperties}>
      <div className="mtb-row">
        <button type="button" className="mtb-round" onClick={onBack} aria-label="Back" title="Back">
          <ChevronLeft size={22} strokeWidth={2.3} />
        </button>
        <h1 className="mtb-title ui-topbar-title">
          <span className="mtb-tile" aria-hidden="true"><Icon size={15} strokeWidth={2.4} /></span>
          <span>{title}</span>
        </h1>
        <div className="mtb-history">
          <button type="button" className="mtb-history-btn" onClick={undo} disabled={!canUndo} aria-label="Undo" title="Undo">
            <Undo2 size={19} />
          </button>
          <button type="button" className="mtb-history-btn" onClick={redo} disabled={!canRedo} aria-label="Redo" title="Redo">
            <Redo2 size={19} />
          </button>
        </div>
      </div>

      <ol className="mtb-steps" aria-hidden="true">
        {steps.map((label, i) => (
          <li key={label} className={`mtb-step${i < step ? ' is-done' : ''}${i === step ? ' is-now' : ''}`}>
            <span className="mtb-dot">{i < step ? <Check size={11} strokeWidth={3.2} /> : i + 1}</span>
            {label}
          </li>
        ))}
      </ol>
      <p className="mtb-status ui-topbar-subtitle" aria-live="polite">{status[step]}</p>
    </header>
  );
}
