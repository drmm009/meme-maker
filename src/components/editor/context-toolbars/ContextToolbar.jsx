import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TabQuickTools from './TabQuickTools';
import FaceMorphToolbar from './FaceMorphToolbar';
import ImageLayerToolbar from './ImageLayerToolbar';
import StickerToolbar from './StickerToolbar';
import CaptionToolbar from './CaptionToolbar';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
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
}) {
  const activeSubmenu = useEditorUiStore((s) => s.activeSubmenu);
  const activeTab = useEditorUiStore((s) => s.activeTab);
  const drawTool = useEditorUiStore((s) => s.drawTool);
  const handleToggleSubmenu = useEditorUiStore((s) => s.toggleSubmenu);
  const isMobileTabsFolded = useEditorUiStore((s) => s.isMobileTabsFolded);
  const setActiveSubmenu = useEditorUiStore((s) => s.setActiveSubmenu);
  const setDrawTool = useEditorUiStore((s) => s.setDrawTool);
  const setImagePickerTarget = useEditorUiStore((s) => s.setImagePickerTarget);
  const setShowAiModal = useEditorUiStore((s) => s.setShowAiModal);
  const setShowBubbleBottomSheet = useEditorUiStore((s) => s.setShowBubbleBottomSheet);
  const setShowEmojiModal = useEditorUiStore((s) => s.setShowEmojiModal);
  const setShowFiltersModal = useEditorUiStore((s) => s.setShowFiltersModal);
  const setShowMemeStickersModal = useEditorUiStore((s) => s.setShowMemeStickersModal);
  const showBubbleBottomSheet = useEditorUiStore((s) => s.showBubbleBottomSheet);
  const showBubbleLayouts = useEditorUiStore((s) => s.showBubbleLayouts);
  const showFiltersModal = useEditorUiStore((s) => s.showFiltersModal);
  const showStylesModal = useEditorUiStore((s) => s.showStylesModal);
  const updateWatermark = useEditorUiStore((s) => s.updateWatermark);
  const watermark = useEditorUiStore((s) => s.watermark);
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
