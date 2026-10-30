import { useState, useRef, useEffect } from 'react';
import { createMemeEditorStore, MemeEditorStoreContext, useMemeEditorStore } from './editor/store/useMemeEditorStore';
import { createEditorUiStore, EditorUiStoreContext, useEditorUiStore } from './editor/store/useEditorUiStore';
import { useEditorSetup } from './editor/hooks/useEditorSetup';
import { useActiveLayer } from './editor/hooks/useActiveLayer';
import { useEditorShortcuts } from './editor/hooks/useEditorShortcuts';
import { useExport } from './editor/hooks/useExport';
import { useBackgroundRemoval } from './editor/hooks/useBackgroundRemoval';
import { useFaceMorph } from './editor/hooks/useFaceMorph';
import { useDrawingActions } from './editor/hooks/useDrawingActions';
import { useCanvasFrameActions } from './editor/hooks/useCanvasFrameActions';
import { usePhotoActions } from './editor/hooks/usePhotoActions';
import { useArrangeActions } from './editor/hooks/useArrangeActions';
import { useProjects } from './editor/hooks/useProjects';
import { useMediaInput } from './editor/hooks/useMediaInput';
import { useSocialCardActions } from './editor/hooks/useSocialCardActions';
import { useBubbleActions } from './editor/hooks/useBubbleActions';
import { useCaptionActions } from './editor/hooks/useCaptionActions';
import { useLayerActions } from './editor/hooks/useLayerActions';
import { useMemeDraft } from './editor/hooks/useMemeDraft';
import { useCustomFonts } from './editor/hooks/useCustomFonts';
import EditorTopBar from './editor/top-bar/EditorTopBar';
import CanvasStage from './editor/CanvasStage';
import EditorModals from './editor/EditorModals';
import DraftOffer from './editor/DraftOffer';
import EditorPanels from './editor/panels/EditorPanels';
import LayerToolbar from './editor/panels/LayerToolbar';
import AspectBar from './editor/panels/AspectBar';
import FirstRunTour from './editor/panels/FirstRunTour';
import './ui';
import './MemeEditor.css';

export default function MemeEditor(props) {
  // Restoring a draft starts a fresh editing session on the draft's template and document.
  const [session, setSession] = useState({ id: 0, template: props.template, document: null });
  const restoreDraft = (document) => setSession((s) => ({ id: s.id + 1, template: document.activeTemplate || s.template, document }));
  return <MemeEditorSession key={session.id} {...props} template={session.template} initialDocument={session.document} onRestoreDraft={restoreDraft} />;
}

function MemeEditorSession({ initialDocument, onRestoreDraft, ...props }) {
  const [store] = useState(() => createMemeEditorStore(props.template, initialDocument));
  const [uiStore] = useState(() => createEditorUiStore(props.template));
  useEffect(() => () => store.getState().cancelPendingHistory(), [store]);
  return (
    <MemeEditorStoreContext.Provider value={store}>
      <EditorUiStoreContext.Provider value={uiStore}>
        <MemeEditorContent {...props} restoredDraft={Boolean(initialDocument)} onRestoreDraft={onRestoreDraft} />
      </EditorUiStoreContext.Provider>
    </MemeEditorStoreContext.Provider>
  );
}

// Wires the editor's pieces together. Document state lives in editor/store/useMemeEditorStore.js,
// shared UI state in editor/store/useEditorUiStore.js, edit handlers in editor/hooks/, and the
// panels (dock, sheets, layer toolbar) in editor/panels/ on the shared UI kit (components/ui).
function MemeEditorContent({ template, onBack, onSaveToGallery, restoredDraft, onRestoreDraft }) {
  const activeLayerId = useMemeEditorStore((s) => s.activeLayerId);
  const setActiveLayerId = useMemeEditorStore((s) => s.setActiveLayerId);
  const handleUndo = useMemeEditorStore((s) => s.undo);
  const handleRedo = useMemeEditorStore((s) => s.redo);
  const nudgeLayer = useMemeEditorStore((s) => s.nudgeLayer);
  const dockTab = useEditorUiStore((s) => s.dockTab);
  const drawTool = useEditorUiStore((s) => s.drawTool);

  // Native Multi-Panel Layout Support
  const isNativeLayout = template?.isNativeLayout || false;
  const layoutDef = template?.layoutDef || null;
  const imageFit = template?.imageFit || 'contain';

  useEditorSetup(template);
  const draft = useMemeDraft({ restored: restoredDraft, onRestore: onRestoreDraft });
  useCustomFonts();
  const { activeCaption, activeSticker, activeImageLayer, currentEditingSocialCard } = useActiveLayer();

  const canvasRef = useRef(null);
  const { memeName, canvasSize, exportBlob, exportMotion, motionLoops, saveToGallery } = useExport({ canvasRef, template, onSaveToGallery, imageFit, isNativeLayout, layoutDef });
  const { isRemovingBg, handleRemoveBackground, setPortraitBlur } = useBackgroundRemoval();
  const faceMorph = useFaceMorph({ canvasRef });
  const {
    showFaceMorphModal, setShowFaceMorphModal, morphTargetLayerId, setMorphTargetLayerId,
    morphTargetUrl, setMorphTargetUrl, setIsPinpointingFace, faceTarget,
    sampledFaceLighting, extractedMemeFace, setIsHoldingCanvasCompare,
    originalTemplateImgRef, handleStartMorphFace, handleApplyFaceMorph,
    handleUpdateTemplateMorphProgress, handleChangeFace, handleRevertTemplateFace, handleFinalizeTemplateFace,
  } = faceMorph;

  const { handleOpenSocialModalForActiveCard, handleUpdateSocialCard, handleAddTweetCard, handleAddInstagramCard, handleAddWhatsAppCard } = useSocialCardActions();
  const { handleSetCanvasBgColor, handleSetCanvasBgGradient, handleToggleCanvasHeader, handleToggleCanvasFooter, handleToggleCanvasFlip, handleWatermarkImageUpload } = useCanvasFrameActions();
  const { handleApplyMainPhotoCrop, handleRestoreMainPhoto, handleReplaceImageLayer } = usePhotoActions();
  const { handleAlignLayers, handleDistributeLayers, handleGroupLayers, handleUngroupLayers, handleDeleteLayers } = useArrangeActions({ canvasRef });
  const { listProjects, handleSaveProject, handleOpenProject, handleDeleteProject, handleRenameProject } = useProjects({ canvasRef, onOpen: onRestoreDraft });
  const { handleAddDrawing, handleClearDrawings, handleUndoDrawing } = useDrawingActions();
  const { handleApplyAiCaption, handleAddCaption, handleToggleTextCase, updateActiveCaptionProps, handleSetCaptionBg } = useCaptionActions({ activeCaption, handleToggleCanvasHeader });
  const { commitAddImageLayer, handleAddImageLayer, handleFileUploadImageLayer, updateActiveImageLayer, moveLayer, handleDeleteLayer, handleDuplicateLayer, handleRotateLayer, handleFlipActiveLayer, handleToggleDieCutSticker, handleSetDieCutColor, updateSlotTransform, handleAddSticker, handleAddGraphicSticker } = useLayerActions({ activeCaption, activeImageLayer, activeSticker, updateActiveCaptionProps });
  const { handleAddBubble, handleApplyBubbleStyle } = useBubbleActions({ activeCaption, updateActiveCaptionProps });

  // Everything the panels can do, in one object (see editor/panels/selection.ts).
  const media = useMediaInput({ handleAddImageLayer });

  const actions = {
    handleAddCaption, handleToggleTextCase, updateActiveCaptionProps, handleSetCaptionBg, handleAddBubble, handleApplyBubbleStyle,
    handleOpenSocialModalForActiveCard,
    handleSetCanvasBgColor, handleSetCanvasBgGradient, handleToggleCanvasHeader, handleToggleCanvasFooter, handleToggleCanvasFlip, handleWatermarkImageUpload,
    handleApplyMainPhotoCrop, handleRestoreMainPhoto, handleReplaceImageLayer,
    handleAlignLayers, handleDistributeLayers, handleGroupLayers, handleUngroupLayers, handleDeleteLayers,
    listProjects, handleSaveProject, handleOpenProject, handleDeleteProject, handleRenameProject,
    addMediaLink: media.addLink,
    handleClearDrawings, handleUndoDrawing,
    handleAddImageLayer, handleAddSticker, handleAddGraphicSticker,
    handleFileUploadImageLayer, updateActiveImageLayer, moveLayer, handleDeleteLayer, handleDuplicateLayer, handleRotateLayer,
    handleFlipActiveLayer, handleToggleDieCutSticker, handleSetDieCutColor,
    handleRemoveBackground, setPortraitBlur, isRemovingBg, isNativeLayout, setShowFaceMorphModal, handleStartMorphFace,
    handleUpdateTemplateMorphProgress, handleChangeFace, handleRevertTemplateFace, handleFinalizeTemplateFace, setIsHoldingCanvasCompare,
    memeName, canvasSize, exportBlob, exportMotion, motionLoops, saveToGallery,
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
    onPasteImage: (file) => media.addFile(file, 'Image pasted from clipboard!'),
    onPasteLink: (link) => media.addLink(link).catch(() => {}),
  });

  return (
    <div className="meme-editor-container ui-theme animate-fade-in">
      <EditorTopBar onBack={onBack} />

      {draft.offer && <DraftOffer offer={draft.offer} onRestore={draft.restore} onDismiss={draft.dismiss} />}
      <FirstRunTour />

      <div className="editor-main">
        <AspectBar />
        <div className="editor-workspace">
          <CanvasStage
            canvasRef={canvasRef}
            imageFit={imageFit}
            isNativeLayout={isNativeLayout}
            layoutDef={layoutDef}
            isDrawingMode={dockTab === 'draw' && Boolean(drawTool)}
            isRemovingBg={isRemovingBg}
            onAddDrawing={handleAddDrawing}
            onDeleteLayer={handleDeleteLayer}
            onUpdateSlotTransform={updateSlotTransform}
            faceMorph={faceMorph}
            onDropMedia={media.handleDropMedia}
          >
            <LayerToolbar canvasRef={canvasRef} actions={actions} />
          </CanvasStage>
        </div>

        <EditorPanels actions={actions} />
      </div>

      <EditorModals
        commitAddImageLayer={commitAddImageLayer}
        handleApplyMainPhotoCrop={handleApplyMainPhotoCrop}
        handleRestoreMainPhoto={handleRestoreMainPhoto}
        currentEditingSocialCard={currentEditingSocialCard}
        extractedMemeFace={extractedMemeFace}
        faceTarget={faceTarget}
        handleAddInstagramCard={handleAddInstagramCard}
        handleAddTweetCard={handleAddTweetCard}
        handleAddWhatsAppCard={handleAddWhatsAppCard}
        handleApplyAiCaption={handleApplyAiCaption}
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
      />
    </div>
  );
}
