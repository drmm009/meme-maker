import { Undo2, Redo2, Download, Share2, Copy, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { downloadImageHelper } from '../../../utils/downloadHelper';
import { TopBar } from '../../ui';
import { triggerConfetti } from '../hooks/useExport';
import { useMemeEditorStore, useMemeEditorHistory } from '../store/useMemeEditorStore';

// Back, title, undo/redo and Export (download, copy, share, save to gallery).
export default function EditorTopBar({
  exportDropdownOpen,
  exportDropdownRef,
  handleQuickExport,
  imageFit,
  isNativeLayout,
  layoutDef,
  onBack,
  onSaveToGallery,
  setExportDropdownOpen,
  template,
}) {
  const handleUndo = useMemeEditorStore((s) => s.undo);
  const canUndo = useMemeEditorHistory((s) => s.pastStates.length > 0);
  const handleRedo = useMemeEditorStore((s) => s.redo);
  const canRedo = useMemeEditorHistory((s) => s.futureStates.length > 0);
  const aspectRatio = useMemeEditorStore((s) => s.aspectRatio);
  const captions = useMemeEditorStore((s) => s.captions);
  const stickers = useMemeEditorStore((s) => s.stickers);
  const imageLayers = useMemeEditorStore((s) => s.imageLayers);
  const slotImages = useMemeEditorStore((s) => s.slotImages);
  const slotTransforms = useMemeEditorStore((s) => s.slotTransforms);

  const exportActions = [
    { Icon: Download, label: 'Download PNG', action: (uri) => {
      downloadImageHelper(uri, `meme-${template?.id || 'custom'}-${Date.now()}.png`);
      triggerConfetti();
    } },
    { Icon: Copy, label: 'Copy Image', action: async (uri) => {
      try {
        const blob = await (await fetch(uri)).blob();
        if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        } else {
          await navigator.clipboard.writeText(uri);
        }
        triggerConfetti();
      } catch (e) { console.warn(e); }
    } },
    { Icon: Share2, label: 'Share', action: async (uri, name) => {
      try {
        const blob = await (await fetch(uri)).blob();
        const file = new File([blob], `meme-${Date.now()}.png`, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ title: name, text: 'Check out this meme! 😂', files: [file] });
          triggerConfetti();
        } else {
          await navigator.clipboard.writeText(uri);
        }
      } catch (e) { if (e.name !== 'AbortError') console.warn(e); }
    } },
    { Icon: Save, label: 'Save to Gallery', action: (uri, name) => {
      onSaveToGallery({
        id: `meme-${Date.now()}`,
        name,
        imageUrl: uri,
        rawImageUrl: template?.rawImageUrl || template?.imageUrl,
        captions: JSON.parse(JSON.stringify(captions)),
        stickers: JSON.parse(JSON.stringify(stickers)),
        imageLayers: JSON.parse(JSON.stringify(imageLayers)),
        aspectRatio, imageFit, isNativeLayout, layoutDef, slotImages, slotTransforms,
        createdAt: new Date().toISOString()
      });
      triggerConfetti();
    } },
  ];

  return (
    <TopBar title="Meme Editor" onBack={onBack}>
      <div className="ie-topbar-history">
        <button type="button" className="ui-icon-btn ui-icon-btn--ghost" onClick={handleUndo} disabled={!canUndo} title="Undo" aria-label="Undo">
          <Undo2 size={19} />
        </button>
        <button type="button" className="ui-icon-btn ui-icon-btn--ghost" onClick={handleRedo} disabled={!canRedo} title="Redo" aria-label="Redo">
          <Redo2 size={19} />
        </button>
      </div>
      <div className="ie-export" ref={exportDropdownRef}>
        <button
          type="button"
          className="ui-btn-accent"
          onClick={() => setExportDropdownOpen((prev) => !prev)}
          aria-label="Export"
          aria-expanded={exportDropdownOpen}
        >
          Export
        </button>
        <AnimatePresence>
          {exportDropdownOpen && (
            <motion.div
              className="ie-export-menu"
              role="menu"
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              {exportActions.map(({ Icon, label, action }) => (
                <button key={label} type="button" role="menuitem" className="ie-export-item" onClick={() => handleQuickExport(action)}>
                  <Icon size={16} /> {label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TopBar>
  );
}
