import { Undo2, Redo2, Maximize2, Sticker, ScanFace, Wand2 } from 'lucide-react';
import { TopBar } from '../../ui';
import { useMemeEditorStore, useMemeEditorHistory } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { EDITOR_MODES } from '../editorModes';
import SizeMenu from './SizeMenu';

// Back, undo/redo, the canvas size for a tall canvas (SizeMenu; a short one has the bar above it) and
// Export (which opens the Export sheet: format, size, download, share, copy, save to gallery); the full
// editor has no title, so the meme gets the room. The Social Card maker shows its own title, and Full
// editor, which switches to the full editor on the same meme. The Stickers, AI Meme and Face Swap
// makers have their title with an icon, a line under it saying where the work stands, and only
// undo/redo (Export is in their dock).
const MAKER_ICONS = { sticker: Sticker, faceswap: ScanFace, ai: Wand2 };

export default function EditorTopBar({ onBack }) {
  const handleUndo = useMemeEditorStore((s) => s.undo);
  const canUndo = useMemeEditorHistory((s) => s.pastStates.length > 0);
  const handleRedo = useMemeEditorStore((s) => s.redo);
  const canRedo = useMemeEditorHistory((s) => s.futureStates.length > 0);
  const sheet = useEditorUiStore((s) => s.sheet);
  const openSheet = useEditorUiStore((s) => s.openSheet);
  const closeSheet = useEditorUiStore((s) => s.closeSheet);
  const mode = useEditorUiStore((s) => s.mode);
  const openFullEditor = useEditorUiStore((s) => s.openFullEditor);
  const canvasTall = useEditorUiStore((s) => s.canvasTall);
  // The Stickers maker says under its title where the sticker stands.
  const stickerStage = useMemeEditorStore((s) => (!s.imageLayers.length ? 'Add a photo'
    : s.imageLayers.every((l) => l.originalUrl) ? 'Ready to export' : 'Ready to generate'));
  // And the Face Swap maker whether the swap is made.
  const swapStage = useMemeEditorStore((s) => (s.activeTemplate?.faceSwap ? 'Ready to export' : 'Pick a face and a picture'));
  // And the AI Meme maker whether Generate has made it.
  const aiStage = useMemeEditorStore((s) => (s.activeTemplate?.aiPicked ? 'Ready to export' : 'Pick a meme and an idea'));
  const MakerIcon = MAKER_ICONS[mode];

  const title = MakerIcon ? (
    <span className="ie-topbar-sticker-title">
      <MakerIcon size={18} strokeWidth={2.4} className="ie-topbar-sticker-icon" aria-hidden="true" />
      {EDITOR_MODES[mode].title}
    </span>
  ) : (
    EDITOR_MODES[mode].title
  );

  return (
    <TopBar title={mode === 'full' ? null : title} subtitle={mode === 'sticker' ? stickerStage : mode === 'faceswap' ? swapStage : mode === 'ai' ? aiStage : null} onBack={onBack}>
      {MakerIcon ? (
        <div className="ie-topbar-history ie-topbar-history--capsule">
          <button type="button" className="ui-icon-btn ui-icon-btn--ghost" onClick={handleUndo} disabled={!canUndo} title="Undo" aria-label="Undo">
            <Undo2 size={19} />
          </button>
          <button type="button" className="ui-icon-btn ui-icon-btn--ghost" onClick={handleRedo} disabled={!canRedo} title="Redo" aria-label="Redo">
            <Redo2 size={19} />
          </button>
        </div>
      ) : (
        <>
          <div className="ie-topbar-history">
            <button type="button" className="ui-icon-btn ui-icon-btn--ghost" onClick={handleUndo} disabled={!canUndo} title="Undo" aria-label="Undo">
              <Undo2 size={19} />
            </button>
            <button type="button" className="ui-icon-btn ui-icon-btn--ghost" onClick={handleRedo} disabled={!canRedo} title="Redo" aria-label="Redo">
              <Redo2 size={19} />
            </button>
            {mode !== 'full' && (
              <button type="button" className="ui-icon-btn ui-icon-btn--ghost" onClick={openFullEditor} title="Open in the full editor" aria-label="Full editor">
                <Maximize2 size={18} />
              </button>
            )}
          </div>
          {canvasTall && <SizeMenu />}
          <button
            type="button"
            className="ui-btn-accent"
            onClick={() => (sheet === 'export' ? closeSheet() : openSheet('export'))}
            aria-label="Export"
            aria-expanded={sheet === 'export'}
          >
            Export
          </button>
        </>
      )}
    </TopBar>
  );
}
