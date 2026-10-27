import { Check, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CanvasEditor from '../CanvasEditor';
import FacePinpointOverlay from '../FacePinpointOverlay';
import { isSocialCardCaption } from './memeEditorUtils';
import { useMemeEditorStore } from './store/useMemeEditorStore';
import { useEditorUiStore } from './store/useEditorUiStore';

// The canvas area: the meme canvas with its overlays (paste toast, background-removal spinner,
// face pinpointing), plus `children` (the floating layer toolbars). Tapping the empty space
// around the canvas deselects.
export default function CanvasStage({
  canvasRef, imageFit, isNativeLayout, layoutDef, isDrawingMode, isRemovingBg,
  onAddDrawing, onDeleteLayer, onUpdateSlotTransform, faceMorph, children
}) {
  const captions = useMemeEditorStore((s) => s.captions);
  const stickers = useMemeEditorStore((s) => s.stickers);
  const imageLayers = useMemeEditorStore((s) => s.imageLayers);
  const activeLayerId = useMemeEditorStore((s) => s.activeLayerId);
  const setActiveLayerId = useMemeEditorStore((s) => s.setActiveLayerId);
  const activeTemplate = useMemeEditorStore((s) => s.activeTemplate);
  const templateFaceMorph = useMemeEditorStore((s) => s.templateFaceMorph);
  const patchLayer = useMemeEditorStore((s) => s.patchLayer);
  const updateCaptionText = useMemeEditorStore((s) => s.updateCaptionText);
  const pasteToast = useEditorUiStore((s) => s.pasteToast);
  const setActiveTab = useEditorUiStore((s) => s.setActiveTab);
  const setActiveSubmenu = useEditorUiStore((s) => s.setActiveSubmenu);
  const setShowFontMenu = useEditorUiStore((s) => s.setShowFontMenu);
  const setShowTextEffectsMenu = useEditorUiStore((s) => s.setShowTextEffectsMenu);
  const setShowTextBlurMenu = useEditorUiStore((s) => s.setShowTextBlurMenu);
  const setShowTextBgMenu = useEditorUiStore((s) => s.setShowTextBgMenu);
  const setShowBubbleLayouts = useEditorUiStore((s) => s.setShowBubbleLayouts);
  const setShowBubbleBottomSheet = useEditorUiStore((s) => s.setShowBubbleBottomSheet);

  const {
    isHoldingCanvasCompare, isPinpointingFace, setIsPinpointingFace, faceTarget, setFaceTarget,
    handleConfirmPinpoint, originalTemplateImgRef
  } = faceMorph;

  // Tapping around the canvas deselects; leaving a sticker, image or social card goes to Images.
  const handleWrapperPointerDown = (e) => {
    if (e.target !== e.currentTarget || !activeLayerId) return;
    const prevCaption = captions.find((c) => c.id === activeLayerId);
    if (stickers.some((s) => s.id === activeLayerId) || (prevCaption && isSocialCardCaption(prevCaption)) || imageLayers.some((img) => img.id === activeLayerId)) {
      setActiveTab('images');
    }
    setActiveLayerId(null);
  };

  // Selecting on the canvas closes the text submenus; selecting a caption switches to Text.
  const handleSelectLayer = (id) => {
    setShowFontMenu(false);
    setShowTextEffectsMenu(false);
    setShowTextBlurMenu(false);
    setShowTextBgMenu(false);
    setShowBubbleLayouts(false);
    if (id && captions.some((c) => c.id === id)) {
      setActiveTab('text');
    }
    setActiveLayerId(id || null);
    setActiveSubmenu(null);
    setShowBubbleBottomSheet(false);
  };

  return (
    <div className="canvas-wrapper" onPointerDown={handleWrapperPointerDown}>
      <div className="canvas-viewport">
        <AnimatePresence>
          {pasteToast && (
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'absolute',
                top: '14px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9999,
                background: 'rgba(16, 185, 129, 0.95)',
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
              <Check size={16} /> Image pasted from clipboard!
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

      {children}
    </div>
  );
}
