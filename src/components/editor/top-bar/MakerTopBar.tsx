// The Stickers and AI Meme makers' top bar (MakerBar): the maker's title on a tile in its colour (its
// Home tile's), undo and redo in one capsule, and its three steps, from the editor's state.
import { Redo2, Scissors, Undo2, Wand2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import MakerBar from './MakerBar';
import { useMemeEditorHistory, useMemeEditorStore } from '../store/useMemeEditorStore';
import { stickerStep } from '../stickerMaker';
import { aiStep } from '../aiMeme';

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
    <MakerBar title={title} Icon={Icon} tone={tone} steps={steps} step={step} status={status[step]} onBack={onBack}>
      {mode !== 'sticker' && (
        <div className="mtb-history">
          <button type="button" className="mtb-history-btn" onClick={undo} disabled={!canUndo} aria-label="Undo" title="Undo">
            <Undo2 size={19} />
          </button>
          <button type="button" className="mtb-history-btn" onClick={redo} disabled={!canRedo} aria-label="Redo" title="Redo">
            <Redo2 size={19} />
          </button>
        </div>
      )}
    </MakerBar>
  );
}
