// The Stickers maker's top bar: Back, the title on a green Stickers tile (Home's Stickers colour),
// undo and redo in one capsule, and under them a three-step track, Photo · Style · Export, the step
// the sticker is on lit orange and the ones done ticked. Where it stands is also said in words
// (Add a photo, Ready to generate, Ready to export) for screen readers.
import { Check, ChevronLeft, Redo2, Scissors, Undo2 } from 'lucide-react';
import { useMemeEditorHistory, useMemeEditorStore } from '../store/useMemeEditorStore';
import { stickerStep } from '../stickerMaker';
import './stickerTopBar.css';

const STEPS = ['Photo', 'Style', 'Export'] as const;
const STAGE_TEXT = ['Add a photo', 'Ready to generate', 'Ready to export'] as const;

type Layer = { originalUrl?: string | null };
type DocState = { imageLayers: Layer[]; undo: () => void; redo: () => void };
type HistoryState = { pastStates: unknown[]; futureStates: unknown[] };

export default function StickerTopBar({ onBack }: { onBack: () => void }) {
  const step = useMemeEditorStore((s: DocState) => stickerStep(s.imageLayers));
  const undo = useMemeEditorStore((s: DocState) => s.undo);
  const redo = useMemeEditorStore((s: DocState) => s.redo);
  const canUndo = useMemeEditorHistory((s: HistoryState) => s.pastStates.length > 0);
  const canRedo = useMemeEditorHistory((s: HistoryState) => s.futureStates.length > 0);

  return (
    <header className="stb">
      <div className="stb-row">
        <button type="button" className="stb-round" onClick={onBack} aria-label="Back" title="Back">
          <ChevronLeft size={22} strokeWidth={2.3} />
        </button>
        <h1 className="stb-title ui-topbar-title">
          <span className="stb-tile" aria-hidden="true"><Scissors size={15} strokeWidth={2.4} /></span>
          <span>Stickers</span>
        </h1>
        <div className="stb-history">
          <button type="button" className="stb-history-btn" onClick={undo} disabled={!canUndo} aria-label="Undo" title="Undo">
            <Undo2 size={19} />
          </button>
          <button type="button" className="stb-history-btn" onClick={redo} disabled={!canRedo} aria-label="Redo" title="Redo">
            <Redo2 size={19} />
          </button>
        </div>
      </div>

      <ol className="stb-steps" aria-hidden="true">
        {STEPS.map((label, i) => (
          <li key={label} className={`stb-step${i < step ? ' is-done' : ''}${i === step ? ' is-now' : ''}`}>
            <span className="stb-dot">{i < step ? <Check size={11} strokeWidth={3.2} /> : i + 1}</span>
            {label}
          </li>
        ))}
      </ol>
      <p className="stb-status ui-topbar-subtitle" aria-live="polite">{STAGE_TEXT[step]}</p>
    </header>
  );
}
