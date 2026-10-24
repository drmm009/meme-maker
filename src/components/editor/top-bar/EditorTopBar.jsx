import React from 'react';
import { Undo2, Redo2, Download, Share2, Copy, X, Save, Share } from 'lucide-react';
import { downloadImageHelper } from '../../../utils/downloadHelper';
import { motion, AnimatePresence } from 'framer-motion';
import AspectRatioDropdown from '../../AspectRatioDropdown';
import { triggerConfetti } from '../hooks/useExport';
import { useMemeEditorStore, useMemeEditorHistory } from '../store/useMemeEditorStore';

const ASPECT_RATIOS = [
  { value: 'original', label: 'Original Image' },
  { value: '1:1', label: '1:1 (Square)' },
  { value: '4:5', label: '4:5 (Portrait)' },
  { value: '9:16', label: '9:16 (Story)' },
  { value: '16:9', label: '16:9 (Video)' }
];

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
  const setAspectRatio = useMemeEditorStore((s) => s.setAspectRatio);
  const pushHistoryDebounced = useMemeEditorStore((s) => s.pushHistoryDebounced);
  const captions = useMemeEditorStore((s) => s.captions);
  const stickers = useMemeEditorStore((s) => s.stickers);
  const imageLayers = useMemeEditorStore((s) => s.imageLayers);
  const slotImages = useMemeEditorStore((s) => s.slotImages);
  const slotTransforms = useMemeEditorStore((s) => s.slotTransforms);

  return (
    <>
      {/* Same layout as the video editor's: close, aspect ratio, history and export. */}
      <div className="ie-topbar">
        <button type="button" className="ie-fab" onClick={onBack} aria-label="Back" title="Back">
          <X size={18} strokeWidth={2.5} />
        </button>

        <div className="ie-topbar-center">
          <AspectRatioDropdown
            value={aspectRatio}
            onChange={(val) => {
              setAspectRatio(val);
              pushHistoryDebounced();
            }}
            options={ASPECT_RATIOS}
          />
        </div>

        <div className="ie-topbar-right">
          <button type="button" className="ie-icon-btn" onClick={handleUndo} disabled={!canUndo} title="Undo" aria-label="Undo">
            <Undo2 size={20} />
          </button>
          <button type="button" className="ie-icon-btn" onClick={handleRedo} disabled={!canRedo} title="Redo" aria-label="Redo">
            <Redo2 size={20} />
          </button>

          <div className="ie-export" ref={exportDropdownRef}>
            <motion.button
              type="button"
              className="ie-fab ie-fab--export"
              whileTap={{ scale: 0.92 }}
              onClick={() => setExportDropdownOpen(prev => !prev)}
              aria-label="Export"
              aria-expanded={exportDropdownOpen}
              title="Export"
            >
              <Share size={17} strokeWidth={2.4} />
            </motion.button>

            <AnimatePresence>
              {exportDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    minWidth: '190px',
                    background: 'rgba(18, 18, 26, 0.92)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '14px',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
                    zIndex: 9999,
                    overflow: 'hidden',
                    padding: '6px'
                  }}
                >
                  {[
                    { icon: <Download style={{width:16,height:16}} />, label: 'Download PNG', action: (uri) => {
                      const filename = `meme-${template?.id || 'custom'}-${Date.now()}.png`;
                      downloadImageHelper(uri, filename);
                      triggerConfetti();
                    }},
                    { icon: <Copy style={{width:16,height:16}} />, label: 'Copy Image', action: async (uri) => {
                      try {
                        const res = await fetch(uri);
                        const blob = await res.blob();
                        if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
                          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                        } else {
                          await navigator.clipboard.writeText(uri);
                        }
                        triggerConfetti();
                      } catch(e) { console.warn(e); }
                    }},
                    { icon: <Share2 style={{width:16,height:16}} />, label: 'Share', action: async (uri, name) => {
                      try {
                        const res = await fetch(uri);
                        const blob = await res.blob();
                        const file = new File([blob], `meme-${Date.now()}.png`, { type: 'image/png' });
                        if (navigator.canShare && navigator.canShare({ files: [file] })) {
                          await navigator.share({ title: name, text: 'Check out this meme! 😂', files: [file] });
                          triggerConfetti();
                        } else {
                          await navigator.clipboard.writeText(uri);
                        }
                      } catch(e) { if (e.name !== 'AbortError') console.warn(e); }
                    }},
                    { icon: <Save style={{width:16,height:16}} />, label: 'Save to Gallery', action: (uri, name) => {
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
                    }},
                  ].map(({ icon, label, action }, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuickExport(action)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        width: '100%',
                        padding: '10px 14px',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '10px',
                        color: 'rgba(255,255,255,0.85)',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {icon} {label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}
