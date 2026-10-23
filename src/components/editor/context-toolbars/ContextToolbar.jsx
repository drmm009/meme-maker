import { motion, AnimatePresence } from 'framer-motion';
import TabQuickTools from './TabQuickTools';
import FaceMorphToolbar from './FaceMorphToolbar';
import ImageLayerToolbar from './ImageLayerToolbar';
import StickerToolbar from './StickerToolbar';
import CaptionToolbar from './CaptionToolbar';
import { useEditorUiStore } from '../store/useEditorUiStore';

export default function ContextToolbar({
  activeCaption,
  activeFontObj,
  activeImageLayer,
  activeSticker,
  contextToolbarRef,
  handleAddBubble,
  handleAddCaption,
  handleChangeFace,
  handleFileUploadImageLayer,
  handleFinalizeTemplateFace,
  handleFlipActiveLayer,
  handleOpenSocialModalForActiveCard,
  handleRemoveBackground,
  handleRevertTemplateFace,
  handleSetCaptionBg,
  handleStartMorphFace,
  handleToggleDieCutSticker,
  isHoldingCanvasCompare,
  isRemovingBg,
  setIsHoldingCanvasCompare,
  setShowFaceMorphModal,
  updateActiveCaptionProps,
  handleAddCurvedText,
  handleToggleCanvasFlip,
  handleUpdateTemplateMorphProgress,
}) {
  const showBubbleLayouts = useEditorUiStore((s) => s.showBubbleLayouts);

  return (
    <>
      <AnimatePresence>
        {(
          <motion.div
            ref={contextToolbarRef}
            className={`editor-floating-toolbar video-context-toolbar ${showBubbleLayouts ? 'bubble-mode-left' : ''}`}
            initial={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0, marginTop: 0, marginBottom: 0, overflow: 'hidden' }}
            animate={{ opacity: 1, height: 64, paddingTop: 5, paddingBottom: 5, marginTop: 2, marginBottom: 0 }}
            exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0, marginTop: 0, marginBottom: 0, overflow: 'hidden' }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            {/* Text Controls when caption is active */}
            <CaptionToolbar
              activeCaption={activeCaption}
              activeFontObj={activeFontObj}
              handleOpenSocialModalForActiveCard={handleOpenSocialModalForActiveCard}
              handleSetCaptionBg={handleSetCaptionBg}
              updateActiveCaptionProps={updateActiveCaptionProps}
            />

            {/* Sticker controls */}
            <StickerToolbar activeSticker={activeSticker} handleFlipActiveLayer={handleFlipActiveLayer} handleToggleDieCutSticker={handleToggleDieCutSticker} />

            {/* Image Layer controls */}
            <ImageLayerToolbar
              activeImageLayer={activeImageLayer}
              handleRemoveBackground={handleRemoveBackground}
              handleStartMorphFace={handleStartMorphFace}
              isRemovingBg={isRemovingBg}
            />



            {/* ON-TEMPLATE FACE MORPH TOOLBAR */}
            <FaceMorphToolbar
              handleUpdateTemplateMorphProgress={handleUpdateTemplateMorphProgress}
              activeCaption={activeCaption}
              activeImageLayer={activeImageLayer}
              activeSticker={activeSticker}
              handleChangeFace={handleChangeFace}
              handleFinalizeTemplateFace={handleFinalizeTemplateFace}
              handleRevertTemplateFace={handleRevertTemplateFace}
              isHoldingCanvasCompare={isHoldingCanvasCompare}
              setIsHoldingCanvasCompare={setIsHoldingCanvasCompare}
            />

            {/* TAB SPECIFIC TOOLS (when nothing selected and not in template face morph) */}
            {/* TEXT TAB */}
            <TabQuickTools
              activeCaption={activeCaption}
              activeImageLayer={activeImageLayer}
              activeSticker={activeSticker}
              handleAddBubble={handleAddBubble}
              handleAddCaption={handleAddCaption}
              handleAddCurvedText={handleAddCurvedText}
              handleFileUploadImageLayer={handleFileUploadImageLayer}
              handleToggleCanvasFlip={handleToggleCanvasFlip}
              setShowFaceMorphModal={setShowFaceMorphModal}
            />

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
