import { useEffect, useRef, useState } from 'react';
import { useEditorStore } from '../../store/useVideoEditorStore';
import { loadVideoDraft, restoreProject, saveVideoDraft } from '../../utils/videoDraftStore';

const SAVE_DELAY_MS = 700;

const projectChanged = (s, p) =>
  s.items !== p.items || s.canvasAspectRatio !== p.canvasAspectRatio || s.layoutSlots !== p.layoutSlots;

// Auto-saves the project after each edit and offers to bring back the previous draft.
// Call it after the template hand-off so the hand-off itself doesn't count as an edit.
export function useVideoDraft() {
  const [offer, setOffer] = useState(null); // { savedAt, clips } of a draft that can be restored
  const savedRef = useRef(null);
  const editedRef = useRef(false);

  useEffect(() => {
    let alive = true;
    let timer = null;
    const save = () => {
      timer = null;
      const state = useEditorStore.getState();
      if (state.items.length) saveVideoDraft(state).catch((e) => console.warn('[video draft] save failed', e));
    };

    loadVideoDraft()
      .then((saved) => {
        if (!alive || !saved || editedRef.current) return;
        savedRef.current = saved;
        setOffer({ savedAt: saved.draft.savedAt, clips: saved.draft.project.items.length });
      })
      .catch(() => {});

    const unsub = useEditorStore.subscribe((s, p) => {
      if (!projectChanged(s, p)) return;
      // The first edit starts a new draft, replacing the one on offer.
      editedRef.current = true;
      savedRef.current = null;
      setOffer(null);
      clearTimeout(timer);
      timer = setTimeout(save, SAVE_DELAY_MS);
    });

    return () => {
      alive = false;
      unsub();
      if (timer) { clearTimeout(timer); save(); }
    };
  }, []);

  const restore = () => {
    const saved = savedRef.current;
    if (!saved) return;
    const project = restoreProject(saved.draft, saved.media, (blob) => URL.createObjectURL(blob));
    useEditorStore.setState({ ...project, playhead: 0, isPlaying: false, activeItemId: null });
    useEditorStore.temporal.getState().clear();
  };

  const dismiss = () => {
    savedRef.current = null;
    setOffer(null);
  };

  return { offer, restore, dismiss };
}
