import { useEffect, useRef, useState } from 'react';
import { useMemeEditorStoreApi } from '../store/useMemeEditorStore';
import { DRAFT_FIELDS, layerCount, loadMemeDraft, restoreDocument, saveMemeDraft } from '../../../utils/memeDraftStore';
import type { MemeDraft, MemeDraftDocument } from '../../../utils/memeDraftStore';
import type { EditorMode } from '../editorModes';

const SAVE_DELAY_MS = 1000;

// What the restore banner shows about a saved draft.
export interface DraftOfferInfo {
  savedAt: number;
  name: string;
  layers: number;
}

type EditorState = Record<string, unknown>;
interface HistoryState {
  pastStates: unknown[];
  futureStates: unknown[];
}
interface EditorStoreApi {
  getState(): EditorState;
  subscribe(fn: (state: EditorState, prev: EditorState) => void): () => void;
  temporal: {
    getState(): HistoryState;
    subscribe(fn: (state: HistoryState, prev: HistoryState) => void): () => void;
  };
}

// Auto-saves the meme after each edit and offers to bring back the previous draft. Only edits
// count (opening the template and the setup on mount don't): saving starts once there is an undo
// step. `restored` skips the offer in a session that is itself a restored draft; `onRestore`
// receives the restored document and its mode. Each editor mode has its own draft: `getMode` is
// the mode now (read on load, and again on every save, as Full editor can change it).
export function useMemeDraft({ restored, onRestore, getMode = () => 'full' }: {
  restored: boolean;
  onRestore: (doc: MemeDraftDocument, mode: EditorMode) => void;
  getMode?: () => EditorMode;
}) {
  const store = useMemeEditorStoreApi() as EditorStoreApi;
  const [offer, setOffer] = useState<DraftOfferInfo | null>(null);
  const savedRef = useRef<MemeDraft | null>(null);
  const editedRef = useRef(false);
  const modeRef = useRef(getMode);
  modeRef.current = getMode;
  // The mode whose draft is on offer.
  const offerModeRef = useRef<EditorMode>('full');

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const save = () => {
      timer = null;
      saveMemeDraft(store.getState(), modeRef.current()).catch((e) => console.warn('[meme draft] save failed', e));
    };

    if (!restored) {
      const mode = modeRef.current();
      offerModeRef.current = mode;
      loadMemeDraft(mode)
        .then((saved) => {
          if (!alive || !saved || editedRef.current) return;
          savedRef.current = saved;
          const template = saved.document.activeTemplate as { name?: string } | undefined;
          setOffer({ savedAt: saved.savedAt, name: template?.name || '', layers: layerCount(saved.document) });
        })
        .catch(() => {});
    }

    const changed = () => {
      const { pastStates, futureStates } = store.temporal.getState();
      if (!pastStates.length && !futureStates.length) return;
      // The first edit starts a new draft, replacing the one on offer.
      if (!editedRef.current) {
        editedRef.current = true;
        savedRef.current = null;
        setOffer(null);
      }
      if (timer) clearTimeout(timer);
      timer = setTimeout(save, SAVE_DELAY_MS);
    };
    const unsubDoc = store.subscribe((s, p) => {
      if (DRAFT_FIELDS.some((k) => s[k] !== p[k])) changed();
    });
    const unsubHistory = store.temporal.subscribe((s, p) => {
      if (s.pastStates !== p.pastStates) changed();
    });

    return () => {
      alive = false;
      unsubDoc();
      unsubHistory();
      if (timer) {
        clearTimeout(timer);
        save();
      }
    };
  }, [store, restored]);

  const restore = () => {
    const saved = savedRef.current;
    if (!saved) return;
    onRestore(restoreDocument(saved, (blob) => URL.createObjectURL(blob)), offerModeRef.current);
  };

  const dismiss = () => {
    savedRef.current = null;
    setOffer(null);
  };

  return { offer, restore, dismiss };
}
