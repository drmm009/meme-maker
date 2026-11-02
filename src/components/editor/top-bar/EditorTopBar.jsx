import { Undo2, Redo2, History, Maximize2 } from 'lucide-react';
import { TopBar } from '../../ui';
import { useMemeEditorStore, useMemeEditorHistory } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { EDITOR_MODES } from '../editorModes';

// Back, title, undo/redo, History & saved (the list of steps, and memes saved as projects or
// templates) and Export (which opens the Export sheet: format, size, download, share, copy, save
// to gallery). A focused maker shows its own title, and Full editor in History's place (the bar
// stays as wide), which switches to the full editor on the same meme.
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

  return (
    <TopBar title={EDITOR_MODES[mode].title} onBack={onBack}>
      <div className="ie-topbar-history">
        <button type="button" className="ui-icon-btn ui-icon-btn--ghost" onClick={handleUndo} disabled={!canUndo} title="Undo" aria-label="Undo">
          <Undo2 size={19} />
        </button>
        <button type="button" className="ui-icon-btn ui-icon-btn--ghost" onClick={handleRedo} disabled={!canRedo} title="Redo" aria-label="Redo">
          <Redo2 size={19} />
        </button>
        {mode === 'full' ? (
          <button
            type="button"
            className="ui-icon-btn ui-icon-btn--ghost"
            onClick={() => (sheet === 'library' ? closeSheet() : openSheet('library'))}
            title="History & saved memes"
            aria-label="History and saved memes"
            aria-expanded={sheet === 'library'}
          >
            <History size={19} />
          </button>
        ) : (
          <button type="button" className="ui-icon-btn ui-icon-btn--ghost" onClick={openFullEditor} title="Open in the full editor" aria-label="Full editor">
            <Maximize2 size={18} />
          </button>
        )}
      </div>
      <button
        type="button"
        className="ui-btn-accent"
        onClick={() => (sheet === 'export' ? closeSheet() : openSheet('export'))}
        aria-label="Export"
        aria-expanded={sheet === 'export'}
      >
        Export
      </button>
    </TopBar>
  );
}
