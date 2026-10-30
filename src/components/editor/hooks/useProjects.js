import { useMemeEditorStoreApi } from '../store/useMemeEditorStore';
import { deleteMemeProject, listMemeProjects, loadMemeProject, restoreDocument, saveMemeProject } from '../../../utils/memeDraftStore';

const THUMB_W = 240;

// Memes saved on purpose (utils/memeDraftStore's projects): save the current one as a project or a
// template, open one (a fresh editor session on it, like restoring the draft), delete one.
export function useProjects({ canvasRef, onOpen }) {
  const store = useMemeEditorStoreApi();

  const thumb = () => {
    const canvas = canvasRef.current;
    const src = canvas?.exportCleanCanvas ? canvas.exportCleanCanvas() : canvas;
    if (!src?.width) return '';
    const out = document.createElement('canvas');
    out.width = THUMB_W;
    out.height = Math.max(1, Math.round((src.height * THUMB_W) / src.width));
    const ctx = out.getContext('2d');
    if (!ctx) return '';
    ctx.drawImage(src, 0, 0, out.width, out.height);
    try {
      return out.toDataURL('image/jpeg', 0.8);
    } catch {
      return '';
    }
  };

  const handleSaveProject = (kind, name) => saveMemeProject(store.getState(), { kind, name: name.trim() || 'My meme', thumb: thumb() });

  const handleOpenProject = async (id) => {
    const project = await loadMemeProject(id);
    if (project) onOpen(restoreDocument(project, (blob) => URL.createObjectURL(blob)));
  };

  return { listProjects: listMemeProjects, handleSaveProject, handleOpenProject, handleDeleteProject: deleteMemeProject };
}
