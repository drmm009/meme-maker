// The AI Meme and Face Swap makers' top section (MakerBar; the Stickers maker draws its own in
// StickerStudio): the maker's tagline and title in its colour, undo and redo in one capsule, and its
// steps, from the editor's state.
import { Redo2, ScanFace, Scissors, Undo2, Wand2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import MakerBar from './MakerBar';
import { MAKER_TONES } from './makerTones';
import type { MakerBarMode } from './makerTones';
import { useMemeEditorHistory, useMemeEditorStore } from '../store/useMemeEditorStore';
import { stickerStep } from '../stickerMaker';
import { aiStep } from '../aiMeme';

type Step = 0 | 1 | 2;
type DocState = {
  imageLayers: { originalUrl?: string | null }[];
  activeTemplate: { imageUrl?: unknown; aiPicked?: unknown; faceSwap?: unknown } | null;
  undo: () => void;
  redo: () => void;
};
type HistoryState = { pastStates: unknown[]; futureStates: unknown[] };

const MAKERS: Record<MakerBarMode, { title: string; lead?: string; tagline: string; Icon: LucideIcon; steps: string[]; status: string[]; stepOf: (s: DocState) => Step }> = {
  sticker: {
    title: 'Stickers',
    lead: 'Create Custom ',
    tagline: 'AI Sticker Studio',
    Icon: Scissors,
    steps: ['Photo', 'Style', 'Export'],
    status: ['Add a photo', 'Ready to generate', 'Ready to export'],
    stepOf: (s) => stickerStep(s.imageLayers),
  },
  ai: {
    title: 'AI Meme',
    lead: 'Create an ',
    tagline: 'AI Meme Studio',
    Icon: Wand2,
    // No step track on its page; where it stands is still said in words (status).
    steps: [],
    status: ['Pick a meme', 'Pick a meme and an idea', 'Ready to export'],
    stepOf: (s) => aiStep(s.activeTemplate),
  },
  // No step track: the page itself shows the two pictures and the swap.
  faceswap: {
    title: 'Face Swap',
    lead: 'Instant ',
    tagline: 'AI Face Studio',
    Icon: ScanFace,
    steps: [],
    status: ['Pick a face and a picture', 'Ready to export'],
    stepOf: (s) => (s.activeTemplate?.faceSwap ? 1 : 0),
  },
};

export default function MakerTopBar({ mode, onBack }: { mode: MakerBarMode; onBack: () => void }) {
  const { title, lead, tagline, Icon, steps, status, stepOf } = MAKERS[mode];
  const tone = MAKER_TONES[mode];
  const step = useMemeEditorStore((s: DocState) => stepOf(s));
  const undo = useMemeEditorStore((s: DocState) => s.undo);
  const redo = useMemeEditorStore((s: DocState) => s.redo);
  const canUndo = useMemeEditorHistory((s: HistoryState) => s.pastStates.length > 0);
  const canRedo = useMemeEditorHistory((s: HistoryState) => s.futureStates.length > 0);

  return (
    <MakerBar title={title} lead={lead} tagline={tagline} Icon={Icon} tone={tone} steps={steps} step={step} status={status[step]} onBack={onBack}>
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
