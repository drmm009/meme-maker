import { Type, Copy, PenLine, WandSparkles } from 'lucide-react';
import { ToolDock } from '../../ui';
import type { DockItem } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { useSelection, SHEET_FOR_KIND } from './selection';
import type { EditorActions } from './selection';
import TextSheet from './TextSheet';
import StickerSheet from './StickerSheet';
import MediaSheet from './MediaSheet';
import DrawSheet from './DrawSheet';
import FxSheet from './FxSheet';
import FaceSwapSheet from './FaceSwapSheet';
import './panels.css';

// A round sticker face with its corner peeling (lucide's sticker is square).
function StickerIcon({ size = 24, strokeWidth = 2 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21a9 9 0 1 1 9-9" />
      <path d="M21 12c-4.5 0-9 3.5-9 9" />
      <path d="M9 10h.01" />
      <path d="M14.5 10h.01" />
      <path d="M9.5 14.2c.9.7 2 .9 3 .4" />
    </svg>
  );
}

const DOCK: DockItem[] = [
  { id: 'text', label: 'Text', Icon: Type, title: 'Text' },
  { id: 'sticker', label: 'Sticker', Icon: StickerIcon, title: 'Stickers and emoji' },
  { id: 'media', label: 'Media', Icon: Copy, title: 'Photos, videos and cutouts' },
  { id: 'draw', label: 'Draw', Icon: PenLine, title: 'Draw on the meme' },
  { id: 'fx', label: 'Fx', Icon: WandSparkles, title: 'Photo grading and effects' },
];

const SHEETS = { text: TextSheet, sticker: StickerSheet, media: MediaSheet, draw: DrawSheet, fx: FxSheet };

// The bottom of the editor: the section dock, or the open section's sheet in its place.
export default function EditorPanels({ actions }: { actions: EditorActions }) {
  const sheet: keyof typeof SHEETS | null = useEditorUiStore((s: { sheet: keyof typeof SHEETS | null }) => s.sheet);
  const openSheet = useEditorUiStore((s: { openSheet: (sheet: string, focus?: string | null) => void }) => s.openSheet);
  const closeSheet = useEditorUiStore((s: { closeSheet: () => void }) => s.closeSheet);
  const setActiveLayerId = useMemeEditorStore((s: { setActiveLayerId: (id: string | null) => void }) => s.setActiveLayerId);
  const faceMorph = useMemeEditorStore((s: { templateFaceMorph: { morphProgress?: number } | null }) => s.templateFaceMorph);
  const { kind } = useSelection();

  if (faceMorph && !kind) {
    return (
      <div className="ie-panels ie-panels--sheet">
        <FaceSwapSheet morphProgress={faceMorph.morphProgress} actions={actions} />
      </div>
    );
  }

  const SheetComponent = sheet ? SHEETS[sheet] : null;
  if (SheetComponent) {
    return (
      <div className="ie-panels ie-panels--sheet">
        <SheetComponent actions={actions} onClose={closeSheet} />
      </div>
    );
  }

  return (
    <div className="ie-panels">
      <ToolDock
        ariaLabel="Editor tools"
        items={DOCK}
        active={kind ? SHEET_FOR_KIND[kind] : null}
        onSelect={(id) => {
          if (id === 'draw') setActiveLayerId(null);
          openSheet(id);
        }}
      />
    </div>
  );
}
