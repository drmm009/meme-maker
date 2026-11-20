import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Download, Palette, Redo2, Undo2, Wand2 } from 'lucide-react';
import { createMemeEditorStore, MemeEditorStoreContext, useMemeEditorStore, useMemeEditorHistory } from './editor/store/useMemeEditorStore';
import { createEditorUiStore, EditorUiStoreContext, useEditorUiStore, useEditorUiStoreApi } from './editor/store/useEditorUiStore';
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
import { useStickerMaker } from './editor/hooks/useStickerMaker';
import { useCustomFonts } from './editor/hooks/useCustomFonts';
import EditorTopBar from './editor/top-bar/EditorTopBar';
import MakerTopBar from './editor/top-bar/MakerTopBar';
import { MAKER_TONES } from './editor/top-bar/makerTones';
import { aiRestart, opensOnPrompt } from './editor/aiMeme';
import CanvasStage from './editor/CanvasStage';
import EditorModals from './editor/EditorModals';
import DraftOffer from './editor/DraftOffer';
import EditorPanels from './editor/panels/EditorPanels';
import AspectBar from './editor/panels/AspectBar';
import FirstRunTour from './editor/panels/FirstRunTour';
import { isDrawingOn } from './editor/panels/drawTools';
import './ui';
import './MemeEditor.css';

export default function MemeEditor(props) {
  // Restoring a draft starts a fresh editing session on the draft's template and document, in the
  // draft's mode (a saved project opens in the full editor).
  const [session, setSession] = useState({ id: 0, template: props.template, document: null });
  const restoreDraft = (document, mode = 'full') => setSession((s) => ({ id: s.id + 1, template: { ...(document.activeTemplate || s.template), editorMode: mode }, document }));
  // A focused maker's other meme (Face Swap's Meme, Social Card's card type) starts it afresh on
  // that template, same mode, without offering back the meme just left.
  const changeMeme = (template, mode) => setSession((s) => ({ id: s.id + 1, template: { ...template, editorMode: mode }, document: null, changed: true }));
  return <MemeEditorSession key={session.id} {...props} template={session.template} initialDocument={session.document} changedMeme={Boolean(session.changed)} onRestoreDraft={restoreDraft} onChangeMeme={changeMeme} />;
}

function MemeEditorSession({ initialDocument, changedMeme, onRestoreDraft, ...props }) {
  const [store] = useState(() => createMemeEditorStore(props.template, initialDocument));
  const [uiStore] = useState(() => createEditorUiStore(props.template));
  useEffect(() => () => store.getState().cancelPendingHistory(), [store]);
  return (
    <MemeEditorStoreContext.Provider value={store}>
      <EditorUiStoreContext.Provider value={uiStore}>
        <MemeEditorContent {...props} restoredDraft={Boolean(initialDocument)} changedMeme={changedMeme} onRestoreDraft={onRestoreDraft} />
      </EditorUiStoreContext.Provider>
    </MemeEditorStoreContext.Provider>
  );
}

// Wires the editor's pieces together. Document state lives in editor/store/useMemeEditorStore.js,
// shared UI state in editor/store/useEditorUiStore.js, edit handlers in editor/hooks/, and the
// panels (dock, sheets, layer toolbar) in editor/panels/ on the shared UI kit (components/ui).
function MemeEditorContent({ template, onBack, onSaveToGallery, restoredDraft, changedMeme, onRestoreDraft, onChangeMeme }) {
  const activeLayerId = useMemeEditorStore((s) => s.activeLayerId);
  const setActiveLayerId = useMemeEditorStore((s) => s.setActiveLayerId);
  const handleUndo = useMemeEditorStore((s) => s.undo);
  const handleRedo = useMemeEditorStore((s) => s.redo);
  const nudgeLayer = useMemeEditorStore((s) => s.nudgeLayer);
  const dockTab = useEditorUiStore((s) => s.dockTab);
  const mode = useEditorUiStore((s) => s.mode);
  const drawTool = useEditorUiStore((s) => s.drawTool);
  const openFullEditor = useEditorUiStore((s) => s.openFullEditor);

  // Native Multi-Panel Layout Support
  const isNativeLayout = template?.isNativeLayout || false;
  const layoutDef = template?.layoutDef || null;
  const imageFit = template?.imageFit || 'contain';

  useEditorSetup(template);
  const uiStore = useEditorUiStoreApi();
  const draft = useMemeDraft({ restored: restoredDraft || changedMeme, onRestore: onRestoreDraft, getMode: () => uiStore.getState().mode });
  useCustomFonts();
  const { activeCaption, activeSticker, activeImageLayer } = useActiveLayer();

  const canvasRef = useRef(null);
  const { memeName, canvasSize, exportBlob, exportMotion, motionLoops, saveToGallery } = useExport({ canvasRef, template, onSaveToGallery, imageFit, isNativeLayout, layoutDef });
  const { isRemovingBg, isBlurringBg, handleRemoveBackground, handleApplyBackgroundBlur, setPortraitBlur } = useBackgroundRemoval();
  const patchLayer = useMemeEditorStore((s) => s.patchLayer);
  const imageLayers = useMemeEditorStore((s) => s.imageLayers || []);
  const isStickerMode = mode === 'sticker';
  const isStickerPage = isStickerMode && (!imageLayers.some((l) => Boolean(l.originalUrl)) || isRemovingBg);
  // The AI Meme maker's page (before its meme is made) draws its own header, as the Stickers page does.
  const activeTemplate = useMemeEditorStore((s) => s.activeTemplate);
  const isAiPage = mode === 'ai' && opensOnPrompt(activeTemplate);
  // And once its meme is made, its editing page has the Stickers editing page's header too.
  const isAiEdit = mode === 'ai' && !isAiPage;
  const sheet = useEditorUiStore((s) => s.sheet);
  // The sticker editing screen's Export, in its header: opens the export sheet, or closes it.
  const toggleExport = () => {
    const ui = uiStore.getState();
    if (ui.sheet === 'export') ui.closeSheet();
    else ui.openSheet('export');
  };
  const canUndo = useMemeEditorHistory((s) => s.pastStates.length > 0);
  const canRedo = useMemeEditorHistory((s) => s.futureStates.length > 0);
  const showTopBar = !isStickerMode && mode !== 'ai';
  const hasMakerBar = mode === 'ai' || mode === 'faceswap';

  const handleStickerStepBack = () => {
    const layerWithOriginal = imageLayers.find((l) => Boolean(l.originalUrl));
    if (layerWithOriginal) {
      patchLayer('imageLayers', layerWithOriginal.id, {
        url: layerWithOriginal.originalUrl,
        originalUrl: null,
      });
    } else if (onBack) {
      onBack();
    }
  };
  const { generate: handleGenerateSticker, setDieCut: handleStickerDieCut, setStyle: handleStickerStyle } = useStickerMaker({ removeBackground: handleRemoveBackground });
  const faceMorph = useFaceMorph({ canvasRef });
  const {
    showFaceMorphModal, setShowFaceMorphModal, morphTargetLayerId, setMorphTargetLayerId,
    morphTargetUrl, setMorphTargetUrl, setIsPinpointingFace, faceTarget,
    sampledFaceLighting, extractedMemeFace, setIsHoldingCanvasCompare,
    originalTemplateImgRef, handleStartMorphFace, handleApplyFaceMorph,
    handleUpdateTemplateMorphProgress, handleChangeFace, handleRevertTemplateFace, handleFinalizeTemplateFace,
  } = faceMorph;

  const { handleAddTweetCard, handleAddInstagramCard, handleAddWhatsAppCard } = useSocialCardActions();
  const { handleSetCanvasBgColor, handleSetCanvasBgGradient, handleToggleCanvasHeader, handleToggleCanvasFooter, handleToggleCanvasFlip, handleWatermarkImageUpload } = useCanvasFrameActions();
  const { handleApplyMainPhotoCrop, handleRestoreMainPhoto, handleReplaceImageLayer, handleApplyLayerCrop, handleRestoreLayerPhoto } = usePhotoActions();
  const { handleAlignLayers, handleDistributeLayers, handleGroupLayers, handleUngroupLayers, handleDeleteLayers } = useArrangeActions({ canvasRef });
  const { listProjects, handleSaveProject, handleOpenProject, handleDeleteProject, handleRenameProject } = useProjects({ canvasRef, onOpen: onRestoreDraft });
  const { handleAddDrawing, handleClearDrawings, handleUndoDrawing } = useDrawingActions();
  const { handleAddCaption, handleToggleTextCase, updateActiveCaptionProps, handleSetCaptionBg } = useCaptionActions({ activeCaption });
  const { commitAddImageLayer, handleAddImageLayer, handleFileUploadImageLayer, handleFitImageToPanel, updateActiveImageLayer, moveLayer, handleDeleteLayer, handleDuplicateLayer, handleRotateLayer, handleFlipActiveLayer, handleToggleDieCutSticker, handleSetDieCutColor, updateSlotTransform, handleAddSticker, handleAddGraphicSticker } = useLayerActions({ activeCaption, activeImageLayer, activeSticker, updateActiveCaptionProps, canvasRef });
  const { handleAddBubble, handleApplyBubbleStyle } = useBubbleActions({ activeCaption, updateActiveCaptionProps });

  // Everything the panels can do, in one object (see editor/panels/selection.ts).
  const media = useMediaInput({ handleAddImageLayer });

  const actions = {
    handleAddCaption, handleToggleTextCase, updateActiveCaptionProps, handleSetCaptionBg, handleAddBubble, handleApplyBubbleStyle,
    handleAddTweetCard, handleAddInstagramCard, handleAddWhatsAppCard,
    handleSetCanvasBgColor, handleSetCanvasBgGradient, handleToggleCanvasHeader, handleToggleCanvasFooter, handleToggleCanvasFlip, handleWatermarkImageUpload,
    handleApplyMainPhotoCrop, handleRestoreMainPhoto, handleReplaceImageLayer,
    handleAlignLayers, handleDistributeLayers, handleGroupLayers, handleUngroupLayers, handleDeleteLayers,
    listProjects, handleSaveProject, handleOpenProject, handleDeleteProject, handleRenameProject,
    addMediaLink: media.addLink,
    handleClearDrawings, handleUndoDrawing,
    handleAddImageLayer, handleAddSticker, handleAddGraphicSticker,
    handleFileUploadImageLayer, updateActiveImageLayer, moveLayer, handleDeleteLayer, handleDuplicateLayer, handleRotateLayer,
    handleFitImageToPanel, handleFlipActiveLayer, handleToggleDieCutSticker, handleSetDieCutColor,
    handleRemoveBackground, handleApplyBackgroundBlur, setPortraitBlur, isRemovingBg, isBlurringBg, isNativeLayout, setShowFaceMorphModal, handleStartMorphFace,
    handleUpdateTemplateMorphProgress, handleChangeFace, handleRevertTemplateFace, handleFinalizeTemplateFace, setIsHoldingCanvasCompare,
    handleChangeMeme: (t) => onChangeMeme(t, uiStore.getState().mode),
    handleGenerateSticker, handleStickerDieCut, handleStickerStyle,
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
    <div
      className={`meme-editor-container ui-theme animate-fade-in ${isStickerMode ? 'meme-editor--sticker-mode' : ''} ${isStickerPage ? 'meme-editor--sticker-page' : ''} ${isAiPage ? 'meme-editor--ai-page' : ''} ${isAiEdit ? 'meme-editor--ai-edit' : ''} ${hasMakerBar ? 'maker-glow' : ''}`}
      style={hasMakerBar ? { '--maker-tone': MAKER_TONES[mode] } : undefined}
    >
      {/* The AI Meme and Face Swap makers have their own top section, on a page that glows in their colour. Sticker mode is a unified single unit without top bar */}
      {showTopBar ? (
        hasMakerBar ? <MakerTopBar mode={mode} onBack={onBack} /> : <EditorTopBar onBack={onBack} />
      ) : null}

      {/* The Stickers maker's editing screen (after Generate), stickerStudioPage.css: Back (to its
          page) on the left, undo and redo in one capsule in the middle, Export on the right. The
          title and where it stands are said for screen readers only. */}
      {isStickerMode && !isStickerPage && (
        <header className="sst-header sst-header--edit">
          <button type="button" className="sst-back" onClick={handleStickerStepBack} aria-label="Back" title="Back">
            <ChevronLeft size={22} strokeWidth={2.4} />
          </button>
          <div className="sst-history" role="group" aria-label="History">
            <button type="button" onClick={handleUndo} disabled={!canUndo} aria-label="Undo" title="Undo"><Undo2 size={19} strokeWidth={2.2} /></button>
            <button type="button" onClick={handleRedo} disabled={!canRedo} aria-label="Redo" title="Redo"><Redo2 size={19} strokeWidth={2.2} /></button>
          </div>
          <button type="button" className="sst-export" onClick={toggleExport} aria-pressed={sheet === 'export'}>
            <Download size={17} strokeWidth={2.4} aria-hidden="true" />
            Export
          </button>
          <h1 className="sst-status ui-topbar-title">Sticker Studio</h1>
          <p className="sst-status ui-topbar-subtitle" aria-live="polite">Ready to export</p>
        </header>
      )}

      {/* The AI Meme maker's editing page: Back to its page (the same meme, idea and vibe), the title,
          and undo and redo on the right. */}
      {isAiEdit && (
        <header className="ie-stk-header ie-stk-header--step3 ie-aim-edit-header">
          <button
            type="button"
            className="ie-stk-back-btn"
            onClick={() => actions.handleChangeMeme(aiRestart(activeTemplate))}
            aria-label="Back"
            title="Back"
          >
            <ChevronLeft size={22} strokeWidth={2.4} />
          </button>
          <div className="ie-stk-header-main">
            <h1 className="ie-stk-title ui-topbar-title">
              <Wand2 size={16} strokeWidth={2.4} className="ie-aim-title-icon" aria-hidden="true" />
              <span>AI Meme Studio</span>
            </h1>
          </div>
          <div className="ie-aim-history">
            <button type="button" onClick={handleUndo} disabled={!canUndo} aria-label="Undo" title="Undo"><Undo2 size={19} /></button>
            <button type="button" onClick={handleRedo} disabled={!canRedo} aria-label="Redo" title="Redo"><Redo2 size={19} /></button>
          </div>
          <p className="ie-stk-status ui-topbar-subtitle" aria-live="polite">
            Ready to export
          </p>
        </header>
      )}

      {draft.offer && <DraftOffer offer={draft.offer} onRestore={draft.restore} onDismiss={draft.dismiss} />}
      {/* The tour explains the full editor's tabs; the makers explain themselves. */}
      {mode === 'full' && <FirstRunTour />}

      <div className="editor-main">
        <AspectBar />
        <div className="editor-workspace">
          <CanvasStage
            canvasRef={canvasRef}
            imageFit={imageFit}
            isNativeLayout={isNativeLayout}
            layoutDef={layoutDef}
            isDrawingMode={isDrawingOn(dockTab, drawTool)}
            isRemovingBg={isRemovingBg}
            isBlurringBg={isBlurringBg}
            onAddDrawing={handleAddDrawing}
            onDeleteLayer={handleDeleteLayer}
            onUpdateSlotTransform={updateSlotTransform}
            faceMorph={faceMorph}
            onDropMedia={media.handleDropMedia}
            onAddPhoto={handleFileUploadImageLayer}
          />
          {/* The AI meme's board carries Move to editor as a pill on its corner. */}
          {isAiEdit && (
            <button type="button" className="ie-stk-pill-btn ie-stk-to-editor" onClick={openFullEditor} title="Keep editing in the full editor">
              <Palette size={14} aria-hidden="true" />
              <span className="ie-stk-pill-text">Move to editor</span>
            </button>
          )}
        </div>

        <EditorPanels actions={actions} onBack={onBack} />
      </div>

      <EditorModals
        commitAddImageLayer={commitAddImageLayer}
        handleApplyMainPhotoCrop={handleApplyMainPhotoCrop}
        handleRestoreMainPhoto={handleRestoreMainPhoto}
        handleApplyLayerCrop={handleApplyLayerCrop}
        handleRestoreLayerPhoto={handleRestoreLayerPhoto}
        stickerMode={isStickerMode}
        extractedMemeFace={extractedMemeFace}
        faceTarget={faceTarget}
        handleApplyFaceMorph={handleApplyFaceMorph}
        morphTargetLayerId={morphTargetLayerId}
        morphTargetUrl={morphTargetUrl}
        originalTemplateImgRef={originalTemplateImgRef}
        sampledFaceLighting={sampledFaceLighting}
        setIsPinpointingFace={setIsPinpointingFace}
        setMorphTargetLayerId={setMorphTargetLayerId}
        setMorphTargetUrl={setMorphTargetUrl}
        setShowFaceMorphModal={setShowFaceMorphModal}
        showFaceMorphModal={showFaceMorphModal}
      />
    </div>
  );
}
