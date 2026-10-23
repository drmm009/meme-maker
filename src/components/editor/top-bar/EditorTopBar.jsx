import React from 'react';
import { Undo, Redo, Download, Share2, Copy, ArrowLeft, Save, ChevronDown } from 'lucide-react';
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
      <div className="editor-topbar glass-card flex-between">
        <button className="btn btn-ghost btn-xs back-btn" onClick={onBack}>
          <ArrowLeft className="icon-sm" /> Back
        </button>

        <div className="history-actions flex-gap">
          <button
            className="btn btn-icon btn-xs hover-lift"
            onClick={handleUndo}
            disabled={!canUndo}
            title="Undo"
            style={{ 
              opacity: canUndo ? 1 : 0.4, 
              cursor: canUndo ? 'pointer' : 'not-allowed',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              padding: '8px',
              color: 'currentColor',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Undo className="icon-xs" />
          </button>
          <button
            className="btn btn-icon btn-xs hover-lift"
            onClick={handleRedo}
            disabled={!canRedo}
            title="Redo"
            style={{ 
              opacity: canRedo ? 1 : 0.4, 
              cursor: canRedo ? 'pointer' : 'not-allowed',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              padding: '8px',
              color: 'currentColor',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Redo className="icon-xs" />
          </button>
          <div style={{ display: 'none' }}></div>
        </div>

        <div className="header-actions flex-gap" style={{ display: 'flex', alignItems: 'center' }}>
          <AspectRatioDropdown 
            value={aspectRatio}
            onChange={(val) => {
              setAspectRatio(val);
              pushHistoryDebounced();
            }}
            options={ASPECT_RATIOS}
          />

          <div style={{ position: 'relative' }} ref={exportDropdownRef}>
            <motion.button
              className="btn btn-primary shadow-glow btn-xs"
              whileTap={{ scale: 0.95 }}
              onClick={() => setExportDropdownOpen(prev => !prev)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Download className="icon-xs" />
              <span>Export</span>
              <ChevronDown className="icon-xs" style={{ transition: 'transform 0.2s', transform: exportDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
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
