import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TabQuickTools from './TabQuickTools';
import FaceMorphToolbar from './FaceMorphToolbar';
import ImageLayerToolbar from './ImageLayerToolbar';
import StickerToolbar from './StickerToolbar';
import CaptionToolbar from './CaptionToolbar';
import { useMemeEditorStore } from '../store/useMemeEditorStore';

export default function ContextToolbar({
  activeCaption,
  activeFontObj,
  activeImageLayer,
  activeSticker,
  activeSubmenu,
  activeTab,
  contextToolbarRef,
  drawTool,
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
  handleToggleSubmenu,
  isHoldingCanvasCompare,
  isMobileTabsFolded,
  isRemovingBg,
  setActiveSubmenu,
  setDrawTool,
  setImagePickerTarget,
  setIsHoldingCanvasCompare,
  setShowAiModal,
  setShowBubbleBottomSheet,
  setShowEmojiModal,
  setShowFaceMorphModal,
  setShowFiltersModal,
  setShowMemeStickersModal,
  showBubbleBottomSheet,
  showBubbleLayouts,
  showFiltersModal,
  showStylesModal,
  updateActiveCaptionProps,
  updateWatermark,
  watermark,
}) {
  const templateFaceMorph = useMemeEditorStore((s) => s.templateFaceMorph);

  return (
    <>
      <AnimatePresence>
        {((activeCaption || activeSticker || activeImageLayer || templateFaceMorph) || (isMobileTabsFolded && !activeCaption && !activeSticker && !activeImageLayer)) && (isMobileTabsFolded || templateFaceMorph) && (
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
              activeSubmenu={activeSubmenu}
              handleOpenSocialModalForActiveCard={handleOpenSocialModalForActiveCard}
              handleSetCaptionBg={handleSetCaptionBg}
              handleToggleSubmenu={handleToggleSubmenu}
              setActiveSubmenu={setActiveSubmenu}
              setShowBubbleBottomSheet={setShowBubbleBottomSheet}
              showBubbleBottomSheet={showBubbleBottomSheet}
              showStylesModal={showStylesModal}
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
              setShowFiltersModal={setShowFiltersModal}
              showFiltersModal={showFiltersModal}
            />



            {/* ON-TEMPLATE FACE MORPH TOOLBAR */}
            <FaceMorphToolbar
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
              activeSubmenu={activeSubmenu}
              activeTab={activeTab}
              drawTool={drawTool}
              handleAddBubble={handleAddBubble}
              handleAddCaption={handleAddCaption}
              handleFileUploadImageLayer={handleFileUploadImageLayer}
              handleToggleSubmenu={handleToggleSubmenu}
              setActiveSubmenu={setActiveSubmenu}
              setDrawTool={setDrawTool}
              setImagePickerTarget={setImagePickerTarget}
              setShowAiModal={setShowAiModal}
              setShowBubbleBottomSheet={setShowBubbleBottomSheet}
              setShowEmojiModal={setShowEmojiModal}
              setShowFaceMorphModal={setShowFaceMorphModal}
              setShowFiltersModal={setShowFiltersModal}
              setShowMemeStickersModal={setShowMemeStickersModal}
              showBubbleBottomSheet={showBubbleBottomSheet}
              showFiltersModal={showFiltersModal}
              updateWatermark={updateWatermark}
              watermark={watermark}
            />

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
