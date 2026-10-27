import { useState, useRef, useEffect } from 'react';
import { blobToDataURL } from '../utils/galleryStore';
import { createMemeEditorStore, MemeEditorStoreContext, useMemeEditorStore } from './editor/store/useMemeEditorStore';
import { createEditorUiStore, EditorUiStoreContext, useEditorUiStore } from './editor/store/useEditorUiStore';
import { useEditorSetup } from './editor/hooks/useEditorSetup';
import { useActiveLayer } from './editor/hooks/useActiveLayer';
import { useToolbarAutoScroll } from './editor/hooks/useToolbarAutoScroll';
import { useEditorShortcuts } from './editor/hooks/useEditorShortcuts';
import { useExport } from './editor/hooks/useExport';
import { useBackgroundRemoval } from './editor/hooks/useBackgroundRemoval';
import { useFaceMorph } from './editor/hooks/useFaceMorph';
import { useDrawingActions } from './editor/hooks/useDrawingActions';
import { useCanvasFrameActions } from './editor/hooks/useCanvasFrameActions';
import { useSocialCardActions } from './editor/hooks/useSocialCardActions';
import { useBubbleActions } from './editor/hooks/useBubbleActions';
import { useCaptionActions } from './editor/hooks/useCaptionActions';
import { useLayerActions } from './editor/hooks/useLayerActions';
import EditorTopBar from './editor/top-bar/EditorTopBar';
import CanvasStage from './editor/CanvasStage';
import ContextToolbar from './editor/context-toolbars/ContextToolbar';
import SecondaryToolbar from './editor/context-toolbars/SecondaryToolbar';
import EditorModals from './editor/EditorModals';
import EditorSidebar from './editor/EditorSidebar';
import './MemeEditor.css';

export default function MemeEditor(props) {
  const [store] = useState(() => createMemeEditorStore(props.template));
  const [uiStore] = useState(() => createEditorUiStore(props.template));
  useEffect(() => () => store.getState().cancelPendingHistory(), [store]);
  return (
    <MemeEditorStoreContext.Provider value={store}>
      <EditorUiStoreContext.Provider value={uiStore}>
        <MemeEditorContent {...props} />
      </EditorUiStoreContext.Provider>
    </MemeEditorStoreContext.Provider>
  );
}

// Wires the editor's pieces together. Document state lives in editor/store/useMemeEditorStore.js,
// shared UI state in editor/store/useEditorUiStore.js, and edit handlers in editor/hooks/.
function MemeEditorContent({ template, onBack, onSaveToGallery }) {
  const activeLayerId = useMemeEditorStore((s) => s.activeLayerId);
  const setActiveLayerId = useMemeEditorStore((s) => s.setActiveLayerId);
  const handleUndo = useMemeEditorStore((s) => s.undo);
  const handleRedo = useMemeEditorStore((s) => s.redo);
  const nudgeLayer = useMemeEditorStore((s) => s.nudgeLayer);
  const activeTab = useEditorUiStore((s) => s.activeTab);
  const setActiveTab = useEditorUiStore((s) => s.setActiveTab);
  const setShowFontMenu = useEditorUiStore((s) => s.setShowFontMenu);
  const setShowTextEffectsMenu = useEditorUiStore((s) => s.setShowTextEffectsMenu);
  const setShowTextBlurMenu = useEditorUiStore((s) => s.setShowTextBlurMenu);
  const setShowTextBgMenu = useEditorUiStore((s) => s.setShowTextBgMenu);
  const setShowFilterPresets = useEditorUiStore((s) => s.setShowFilterPresets);
  const setActiveSubmenu = useEditorUiStore((s) => s.setActiveSubmenu);
  const setPasteToast = useEditorUiStore((s) => s.setPasteToast);
  const drawTool = useEditorUiStore((s) => s.drawTool);

  // Native Multi-Panel Layout Support
  const isNativeLayout = template?.isNativeLayout || false;
  const layoutDef = template?.layoutDef || null;
  const imageFit = template?.imageFit || 'contain';

  useEditorSetup(template);
  const { activeCaption, activeSticker, activeImageLayer, currentEditingSocialCard, isElementSelected, activeFontObj } = useActiveLayer();
  const contextToolbarRef = useToolbarAutoScroll({ activeCaption, activeSticker, activeImageLayer });

  const canvasRef = useRef(null);
  const { exportDropdownOpen, setExportDropdownOpen, exportDropdownRef, handleQuickExport } = useExport({ canvasRef, template });
  const { isRemovingBg, handleRemoveBackground } = useBackgroundRemoval();
  const faceMorph = useFaceMorph({ canvasRef });
  const {
    showFaceMorphModal, setShowFaceMorphModal, morphTargetLayerId, setMorphTargetLayerId,
    morphTargetUrl, setMorphTargetUrl, setIsPinpointingFace, faceTarget,
    sampledFaceLighting, extractedMemeFace, isHoldingCanvasCompare, setIsHoldingCanvasCompare,
    originalTemplateImgRef, handleStartMorphFace, handleApplyFaceMorph,
    handleUpdateTemplateMorphProgress, handleChangeFace, handleRevertTemplateFace, handleFinalizeTemplateFace,
  } = faceMorph;

  const { handleOpenSocialModalForActiveCard, handleUpdateSocialCard, handleAddTweetCard, handleAddInstagramCard, handleAddWhatsAppCard } = useSocialCardActions();
  const { handleSetCanvasBgColor, handleToggleCanvasHeader, handleToggleCanvasFooter, handleToggleCanvasBoth, handleToggleCanvasFlip, handleWatermarkImageUpload } = useCanvasFrameActions();
  const { handleAddDrawing, handleClearDrawings, handleUndoDrawing } = useDrawingActions();
  const { handleApplyAiCaption, handleAddCaption, handleAddPresetPhrase, handleToggleTextCase, handleCycleTextAlignment, updateActiveCaptionProps, handleSetCaptionBg } = useCaptionActions({ activeCaption, handleToggleCanvasHeader });
  const { commitAddImageLayer, handleAddImageLayer, handleFileUploadImageLayer, updateActiveImageLayer, moveLayer, handleDeleteLayer, handleDuplicateLayer, handleRotateLayer, handleFlipActiveLayer, handleToggleDieCutSticker, handleSetDieCutColor, updateSlotTransform, handleAddSticker, handleAddGraphicSticker } = useLayerActions({ activeCaption, activeImageLayer, activeSticker, updateActiveCaptionProps });
  const { handleAddBubble, handleApplyBubbleStyle } = useBubbleActions({ activeCaption, updateActiveCaptionProps });

  // Switching section deselects and closes any open text menu; Draw opens its brush settings.
  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setActiveLayerId(null);
    setShowFontMenu(false);
    setShowTextEffectsMenu(false);
    setShowTextBlurMenu(false);
    setShowTextBgMenu(false);
    setShowFilterPresets(false);
    setActiveSubmenu(tabId === 'draw' ? 'drawSettings' : null);
  };

  useEditorShortcuts({
    activeLayerId,
    onUndo: handleUndo,
    onRedo: handleRedo,
    onDelete: () => handleDeleteLayer(),
    onDuplicate: () => handleDuplicateLayer(),
    onNudge: (dx, dy) => nudgeLayer(activeLayerId, dx, dy),
    onMoveLayer: (action) => moveLayer(activeLayerId, action),
    onDeselect: () => setActiveLayerId(null),
    onPasteImage: (file) => {
      blobToDataURL(file).then((url) => {
        commitAddImageLayer(url);
        setPasteToast(true);
        setTimeout(() => setPasteToast(false), 2600);
      }).catch((err) => {
        console.error('Failed to convert pasted image to data URL:', err);
      });
    },
  });

  return (
    <div className="meme-editor-container animate-fade-in">
      <EditorTopBar
        exportDropdownOpen={exportDropdownOpen}
        exportDropdownRef={exportDropdownRef}
        handleQuickExport={handleQuickExport}
        imageFit={imageFit}
        isNativeLayout={isNativeLayout}
        layoutDef={layoutDef}
        onBack={onBack}
        onSaveToGallery={onSaveToGallery}
        setExportDropdownOpen={setExportDropdownOpen}
        template={template}
      />

      <div className="editor-main">
        <div className="editor-workspace">
          <CanvasStage
            canvasRef={canvasRef}
            imageFit={imageFit}
            isNativeLayout={isNativeLayout}
            layoutDef={layoutDef}
            isDrawingMode={!isElementSelected && activeTab === 'draw' && Boolean(drawTool)}
            isRemovingBg={isRemovingBg}
            onAddDrawing={handleAddDrawing}
            onDeleteLayer={handleDeleteLayer}
            onUpdateSlotTransform={updateSlotTransform}
            faceMorph={faceMorph}
          >
            {/* The selected layer's quick actions and the setting bars float above the bottom deck. */}
            <div className="editor-toolbars-dock-anchor">
              <SecondaryToolbar
                handleSetCanvasBgColor={handleSetCanvasBgColor}
                handleWatermarkImageUpload={handleWatermarkImageUpload}
                handleUndoDrawing={handleUndoDrawing}
                handleAddPresetPhrase={handleAddPresetPhrase}
                activeCaption={activeCaption}
                activeImageLayer={activeImageLayer}
                activeSticker={activeSticker}
                handleClearDrawings={handleClearDrawings}
                handleCycleTextAlignment={handleCycleTextAlignment}
                handleDeleteLayer={handleDeleteLayer}
                handleDuplicateLayer={handleDuplicateLayer}
                handleFlipActiveLayer={handleFlipActiveLayer}
                handleRotateLayer={handleRotateLayer}
                handleSetCaptionBg={handleSetCaptionBg}
                handleSetDieCutColor={handleSetDieCutColor}
                handleToggleCanvasBoth={handleToggleCanvasBoth}
                handleToggleCanvasFooter={handleToggleCanvasFooter}
                handleToggleCanvasHeader={handleToggleCanvasHeader}
                handleToggleTextCase={handleToggleTextCase}
                isElementSelected={isElementSelected}
                moveLayer={moveLayer}
                updateActiveCaptionProps={updateActiveCaptionProps}
                updateActiveImageLayer={updateActiveImageLayer}
              />
            </div>
          </CanvasStage>
        </div>

        <EditorSidebar
          handleTabClick={handleTabClick}
          toolHandlers={{ handleAddBubble, handleAddCaption, handleFileUploadImageLayer, handleToggleCanvasFlip, handleToggleCanvasHeader, handleRemoveBackground, setShowFaceMorphModal }}
          layerTools={(
            <ContextToolbar
              handleUpdateTemplateMorphProgress={handleUpdateTemplateMorphProgress}
              activeCaption={activeCaption}
              activeFontObj={activeFontObj}
              activeImageLayer={activeImageLayer}
              activeSticker={activeSticker}
              contextToolbarRef={contextToolbarRef}
              handleChangeFace={handleChangeFace}
              handleFinalizeTemplateFace={handleFinalizeTemplateFace}
              handleFlipActiveLayer={handleFlipActiveLayer}
              handleOpenSocialModalForActiveCard={handleOpenSocialModalForActiveCard}
              handleRemoveBackground={handleRemoveBackground}
              handleRevertTemplateFace={handleRevertTemplateFace}
              handleSetCaptionBg={handleSetCaptionBg}
              handleStartMorphFace={handleStartMorphFace}
              handleToggleDieCutSticker={handleToggleDieCutSticker}
              isHoldingCanvasCompare={isHoldingCanvasCompare}
              isRemovingBg={isRemovingBg}
              setIsHoldingCanvasCompare={setIsHoldingCanvasCompare}
              updateActiveCaptionProps={updateActiveCaptionProps}
            />
          )}
        />
      </div>

      <EditorModals
        commitAddImageLayer={commitAddImageLayer}
        activeCaption={activeCaption}
        activeImageLayer={activeImageLayer}
        currentEditingSocialCard={currentEditingSocialCard}
        extractedMemeFace={extractedMemeFace}
        faceTarget={faceTarget}
        handleAddGraphicSticker={handleAddGraphicSticker}
        handleAddImageLayer={handleAddImageLayer}
        handleAddInstagramCard={handleAddInstagramCard}
        handleAddSticker={handleAddSticker}
        handleAddTweetCard={handleAddTweetCard}
        handleAddWhatsAppCard={handleAddWhatsAppCard}
        handleApplyAiCaption={handleApplyAiCaption}
        handleApplyBubbleStyle={handleApplyBubbleStyle}
        handleApplyFaceMorph={handleApplyFaceMorph}
        handleUpdateSocialCard={handleUpdateSocialCard}
        morphTargetLayerId={morphTargetLayerId}
        morphTargetUrl={morphTargetUrl}
        originalTemplateImgRef={originalTemplateImgRef}
        sampledFaceLighting={sampledFaceLighting}
        setIsPinpointingFace={setIsPinpointingFace}
        setMorphTargetLayerId={setMorphTargetLayerId}
        setMorphTargetUrl={setMorphTargetUrl}
        setShowFaceMorphModal={setShowFaceMorphModal}
        showFaceMorphModal={showFaceMorphModal}
        template={template}
        updateActiveCaptionProps={updateActiveCaptionProps}
        updateActiveImageLayer={updateActiveImageLayer}
      />
    </div>
  );
}
