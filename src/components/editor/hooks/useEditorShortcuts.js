import { useContext, useEffect, useRef } from 'react';
import { linkIn } from '../../../utils/imageFromLink';
import { EditorUiStoreContext } from '../store/useEditorUiStore';

const isTypingInField = () => {
  const el = document.activeElement;
  const tag = el?.tagName?.toLowerCase();
  return tag === 'input' || tag === 'textarea' || Boolean(el?.isContentEditable);
};

const ARROW_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

// Layer positions are fractions of the canvas (0..1), so nudges are too.
export const NUDGE_STEP = 0.005;
export const NUDGE_STEP_LARGE = 0.05;

// Maps a keydown to an editor command, or null if the key isn't a shortcut.
export function getShortcutCommand(e, { isMac, hasSelection }) {
  const ctrl = isMac ? e.metaKey : e.ctrlKey;

  if (ctrl && !e.shiftKey && e.key === 'z') return { type: 'undo' };
  if (ctrl && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) return { type: 'redo' };
  if ((e.key === 'Delete' || e.key === 'Backspace') && hasSelection) return { type: 'delete' };
  if (ctrl && e.key === 'd' && hasSelection) return { type: 'duplicate' };
  if (ARROW_KEYS.includes(e.key) && hasSelection) {
    const step = e.shiftKey ? NUDGE_STEP_LARGE : NUDGE_STEP;
    const dx = e.key === 'ArrowLeft' ? -step : (e.key === 'ArrowRight' ? step : 0);
    const dy = e.key === 'ArrowUp' ? -step : (e.key === 'ArrowDown' ? step : 0);
    return { type: 'nudge', dx, dy };
  }
  if ((e.key === ']' || e.key === '}') && hasSelection) {
    return { type: 'order', action: ctrl && e.shiftKey ? 'front' : 'forward' };
  }
  if ((e.key === '[' || e.key === '{') && hasSelection) {
    return { type: 'order', action: ctrl && e.shiftKey ? 'back' : 'backward' };
  }
  if (e.key === 'Escape') return { type: 'deselect' };
  if (e.key === '?') return { type: 'help' };
  return null;
}

// Keyboard shortcuts and image paste for the editor. Listeners attach once;
// the handlers ref always points at the latest render's callbacks.
export function useEditorShortcuts(handlers) {
  const uiStore = useContext(EditorUiStoreContext);
  const uiStoreRef = useRef(uiStore);
  uiStoreRef.current = uiStore;
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const onKeyDown = (e) => {
      if (isTypingInField()) return;
      const h = handlersRef.current;
      const command = getShortcutCommand(e, {
        isMac: navigator.platform?.toUpperCase().includes('MAC'),
        hasSelection: Boolean(h.activeLayerId),
      });
      if (!command) return;
      if (command.type !== 'deselect') e.preventDefault();

      switch (command.type) {
        case 'undo': h.onUndo(); break;
        case 'redo': h.onRedo(); break;
        case 'delete': h.onDelete(); break;
        case 'duplicate': h.onDuplicate(); break;
        case 'nudge': h.onNudge(command.dx, command.dy); break;
        case 'order': h.onMoveLayer(command.action); break;
        case 'deselect': h.onDeselect(); break;
        case 'help':
          if (uiStoreRef.current) {
            uiStoreRef.current.getState().setLibraryTab('shortcuts');
            uiStoreRef.current.getState().openSheet('library');
          }
          h.onHelp?.();
          break;
      }
    };

    const onPaste = (e) => {
      if (isTypingInField()) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type && item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) handlersRef.current.onPasteImage(file);
          return;
        }
      }
      // No picture: a pasted web link to one is added too.
      const link = linkIn(e.clipboardData.getData('text/plain'));
      if (link && handlersRef.current.onPasteLink) {
        e.preventDefault();
        handlersRef.current.onPasteLink(link);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('paste', onPaste);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('paste', onPaste);
    };
  }, []);
}
