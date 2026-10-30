import { Check, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CanvasEditor from '../CanvasEditor';
import FacePinpointOverlay from '../FacePinpointOverlay';
import { useMemeEditorStore } from './store/useMemeEditorStore';
import { useEditorUiStore } from './store/useEditorUiStore';

// Sheets that edit the selected layer, so they follow the selection.
const LAYER_SHEETS = ['text', 'media'];

// The canvas area: the meme canvas with its overlays (paste toast, background-removal spinner,
// face pinpointing). Tapping the empty space around the canvas deselects.
export default function CanvasStage({
  canvasRef, imageFit, isNativeLayout, layoutDef, isDrawingMode, isRemovingBg,
  onAddDrawing, onDeleteLayer, onUpdateSlotTransform, faceMorph, onDropMedia
}) {
  const captions = useMemeEditorStore((s) => s.captions);
  const stickers = useMemeEditorStore((s) => s.stickers);
  const imageLayers = useMemeEditorStore((s) => s.imageLayers);
  const drawings = useMemeEditorStore((s) => s.drawings);
  const activeLayerId = useMemeEditorStore((s) => s.activeLayerId);
  const setActiveLayerId = useMemeEditorStore((s) => s.setActiveLayerId);
  const activeTemplate = useMemeEditorStore((s) => s.activeTemplate);
  const templateFaceMorph = useMemeEditorStore((s) => s.templateFaceMorph);
  const patchLayer = useMemeEditorStore((s) => s.patchLayer);
  const updateCaptionText = useMemeEditorStore((s) => s.updateCaptionText);
  const placeLayers = useMemeEditorStore((s) => s.placeLayers);
  const pasteToast = useEditorUiStore((s) => s.pasteToast);
  const sheet = useEditorUiStore((s) => s.sheet);
  const openSheet = useEditorUiStore((s) => s.openSheet);
  const closeSheet = useEditorUiStore((s) => s.closeSheet);

  const {
    isHoldingCanvasCompare, isPinpointingFace, setIsPinpointingFace, faceTarget, setFaceTarget,
    handleConfirmPinpoint, originalTemplateImgRef
  } = faceMorph;

  // Tapping around the canvas closes the open sheet, or else deselects.
  const handleWrapperPointerDown = (e) => {
    if (e.target !== e.currentTarget) return;
    if (sheet) closeSheet();
    else if (activeLayerId) setActiveLayerId(null);
  };

  // Selecting on the canvas: with a layer's sheet open, the sheet follows the selection (picking a
  // sticker while editing text switches to the Media sheet). Other sheets (AI & Filters, brushes,
  // background, watermark) work whatever is selected, so they stay.
  const handleSelectLayer = (id) => {
    setActiveLayerId(id || null);
    // Bubble styles are for the caption they opened on.
    if (sheet === 'bubble') closeSheet();
    if (!id || !sheet || !LAYER_SHEETS.includes(sheet)) return;
    // A shape or censor region has no layer sheet: its quick tools float over it.
    if ((drawings || []).some((d) => d.id === id)) {
      closeSheet();
      return;
    }
    const target = captions.some((c) => c.id === id) ? 'text'
      : stickers.some((s) => s.id === id) || imageLayers.some((l) => l.id === id) ? 'media' : sheet;
    if (target !== sheet) openSheet(target);
  };

  return (
    <div
      className="canvas-wrapper"
      onPointerDown={handleWrapperPointerDown}
      // A picture, video or link dropped on the canvas area is added to the meme.
      onDragOver={(e) => {
        if (onDropMedia && [...(e.dataTransfer?.types || [])].some((t) => t === 'Files' || t === 'text/uri-list' || t === 'text/plain')) e.preventDefault();
      }}
      onDrop={(e) => {
        if (!onDropMedia) return;
        e.preventDefault();
        onDropMedia(e.dataTransfer);
      }}
    >
      <div className="canvas-viewport">
        <AnimatePresence>
          {pasteToast && (
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              role="status"
              style={{
                position: 'absolute',
                top: '14px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9999,
                maxWidth: 'calc(100% - 32px)',
                background: pasteToast.error ? 'rgba(220, 38, 38, 0.95)' : 'rgba(16, 185, 129, 0.95)',
                color: '#ffffff',
                padding: '8px 18px',
                borderRadius: '24px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.85rem',
                fontWeight: 700,
                pointerEvents: 'none'
              }}
            >
              {!pasteToast.error && <Check size={16} />} {pasteToast.text || 'Image pasted from clipboard!'}
            </motion.div>
          )}
        </AnimatePresence>

        <CanvasEditor
          ref={canvasRef}
          imageUrl={isHoldingCanvasCompare ? (templateFaceMorph?.cleanOriginalUrl || activeTemplate?.originalUrl) : (activeTemplate?.rawImageUrl || activeTemplate?.imageUrl)}
          imageFit={imageFit}
          isNativeLayout={isNativeLayout}
          layoutDef={layoutDef}
          onUpdateSlotTransform={onUpdateSlotTransform}
          onDeleteLayer={onDeleteLayer}
          onSelectLayer={handleSelectLayer}
          onUpdateCaptionBounds={(id, props) => patchLayer('captions', id, props)}
          onUpdateStickerBounds={(id, props) => patchLayer('stickers', id, props)}
          onUpdateImageLayerBounds={(id, props) => patchLayer('imageLayers', id, props)}
          onUpdateCaptionText={updateCaptionText}
          onUpdateDrawing={(id, props) => patchLayer('drawings', id, props)}
          onMoveLayers={placeLayers}
          onAddDrawing={onAddDrawing}
          isDrawingMode={isDrawingMode}
        />

        {isRemovingBg && (
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            color: '#fff', zIndex: 50, borderRadius: '12px'
          }}>
            <RefreshCw className="spin" style={{ width: 40, height: 40, color: 'var(--primary-accent)', marginBottom: '12px' }} />
            <span style={{ fontSize: '1rem', fontWeight: 600 }}>Removing Background...</span>
            <span style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '4px' }}>This may take a moment</span>
          </div>
        )}

        <FacePinpointOverlay
          isOpen={isPinpointingFace}
          faceTarget={faceTarget}
          onUpdateTarget={setFaceTarget}
          onConfirm={handleConfirmPinpoint}
          onCancel={() => setIsPinpointingFace(false)}
          canvasRef={canvasRef}
          templateImageUrl={originalTemplateImgRef.current || activeTemplate?.originalUrl || activeTemplate?.imageUrl}
        />
      </div>
    </div>
  );
}
