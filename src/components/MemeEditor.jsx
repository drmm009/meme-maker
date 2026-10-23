import { useState, useRef, useEffect } from 'react';
import CanvasEditor from './CanvasEditor';
import { FONTS } from '../data/stickers';
import { Check, RefreshCw } from 'lucide-react';
import FacePinpointOverlay from './FacePinpointOverlay';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchOpenSourceMemes } from '../services/memeService';
import { blobToDataURL } from '../utils/galleryStore';
import { isSocialCardCaption } from './editor/memeEditorUtils';
import { createMemeEditorStore, MemeEditorStoreContext, useMemeEditorStore } from './editor/store/useMemeEditorStore';
import { useEditorShortcuts } from './editor/hooks/useEditorShortcuts';
import { useExport } from './editor/hooks/useExport';
import { useBackgroundRemoval } from './editor/hooks/useBackgroundRemoval';
import { useFaceMorph } from './editor/hooks/useFaceMorph';
import EditorTopBar from './editor/top-bar/EditorTopBar';
import ContextToolbar from './editor/context-toolbars/ContextToolbar';
import SecondaryToolbar from './editor/context-toolbars/SecondaryToolbar';
import EditorModals from './editor/EditorModals';
import EditorSidebar from './editor/EditorSidebar';
import { createEditorUiStore, EditorUiStoreContext, useEditorUiStore } from './editor/store/useEditorUiStore';
import { useDrawingActions } from './editor/hooks/useDrawingActions';
import { useCanvasFrameActions } from './editor/hooks/useCanvasFrameActions';
import { useSocialCardActions } from './editor/hooks/useSocialCardActions';
import { useBubbleActions } from './editor/hooks/useBubbleActions';
import { useCaptionActions } from './editor/hooks/useCaptionActions';
import { useLayerActions } from './editor/hooks/useLayerActions';
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

function MemeEditorContent({ template, onBack, onSaveToGallery, _theme, _onToggleTheme }) {
  // Document state lives in the editor store (see editor/store/useMemeEditorStore.js)
  const imageLayers = useMemeEditorStore((s) => s.imageLayers);
  const setImageLayers = useMemeEditorStore((s) => s.setImageLayers);
  const stickers = useMemeEditorStore((s) => s.stickers);
  const setStickers = useMemeEditorStore((s) => s.setStickers);
  const captions = useMemeEditorStore((s) => s.captions);
  const setCaptions = useMemeEditorStore((s) => s.setCaptions);
  const activeLayerId = useMemeEditorStore((s) => s.activeLayerId);
  const setActiveLayerId = useMemeEditorStore((s) => s.setActiveLayerId);
  const slotImages = useMemeEditorStore((s) => s.slotImages);
  const slotTransforms = useMemeEditorStore((s) => s.slotTransforms);
  const activeTemplate = useMemeEditorStore((s) => s.activeTemplate);
  const setActiveTemplate = useMemeEditorStore((s) => s.setActiveTemplate);
  const aspectRatio = useMemeEditorStore((s) => s.aspectRatio);
  const canvasBgColor = useMemeEditorStore((s) => s.canvasBgColor);
  const canvasFlipX = useMemeEditorStore((s) => s.canvasFlipX);
  const canvasHeader = useMemeEditorStore((s) => s.canvasHeader);
  const setCanvasHeader = useMemeEditorStore((s) => s.setCanvasHeader);
  const canvasFooter = useMemeEditorStore((s) => s.canvasFooter);
  const setCanvasFooter = useMemeEditorStore((s) => s.setCanvasFooter);
  const demotivational = useMemeEditorStore((s) => s.demotivational);
  const templateFaceMorph = useMemeEditorStore((s) => s.templateFaceMorph);
  const imageFilters = useMemeEditorStore((s) => s.imageFilters);
  const drawings = useMemeEditorStore((s) => s.drawings);
  const pushHistoryDebounced = useMemeEditorStore((s) => s.pushHistoryDebounced);
  const handleUndo = useMemeEditorStore((s) => s.undo);
  const handleRedo = useMemeEditorStore((s) => s.redo);
  const nudgeLayer = useMemeEditorStore((s) => s.nudgeLayer);
  const setOpenSourceTemplates = useEditorUiStore((s) => s.setOpenSourceTemplates);
  const setShowStylesModal = useEditorUiStore((s) => s.setShowStylesModal);
  const socialModalPlatform = useEditorUiStore((s) => s.socialModalPlatform);
  const setSocialModalPlatform = useEditorUiStore((s) => s.setSocialModalPlatform);
  const activeTab = useEditorUiStore((s) => s.activeTab);
  const setActiveTab = useEditorUiStore((s) => s.setActiveTab);
  const setIsMobileTabsFolded = useEditorUiStore((s) => s.setIsMobileTabsFolded);
  const showFontMenu = useEditorUiStore((s) => s.showFontMenu);
  const setShowFontMenu = useEditorUiStore((s) => s.setShowFontMenu);
  const showTextEffectsMenu = useEditorUiStore((s) => s.showTextEffectsMenu);
  const setShowTextEffectsMenu = useEditorUiStore((s) => s.setShowTextEffectsMenu);
  const showTextBlurMenu = useEditorUiStore((s) => s.showTextBlurMenu);
  const setShowTextBlurMenu = useEditorUiStore((s) => s.setShowTextBlurMenu);
  const showTextBgMenu = useEditorUiStore((s) => s.showTextBgMenu);
  const setShowTextBgMenu = useEditorUiStore((s) => s.setShowTextBgMenu);
  const setShowFilterPresets = useEditorUiStore((s) => s.setShowFilterPresets);
  const setActiveSubmenu = useEditorUiStore((s) => s.setActiveSubmenu);
  const pasteToast = useEditorUiStore((s) => s.pasteToast);
  const setPasteToast = useEditorUiStore((s) => s.setPasteToast);
  const setShowBubbleBottomSheet = useEditorUiStore((s) => s.setShowBubbleBottomSheet);
  const drawTool = useEditorUiStore((s) => s.drawTool);
  const brushColor = useEditorUiStore((s) => s.brushColor);
  const brushSize = useEditorUiStore((s) => s.brushSize);
  const showBubbleLayouts = useEditorUiStore((s) => s.showBubbleLayouts);
  const setShowBubbleLayouts = useEditorUiStore((s) => s.setShowBubbleLayouts);
  const lastUsedSettingButton = useEditorUiStore((s) => s.lastUsedSettingButton);
  const setLastUsedSettingButton = useEditorUiStore((s) => s.setLastUsedSettingButton);
  const watermark = useEditorUiStore((s) => s.watermark);

  // Native Multi-Panel Layout Support
  const isNativeLayout = template?.isNativeLayout || false;
  const layoutDef = template?.layoutDef || null;

  useEffect(() => {
    setActiveTemplate(template);
    const socialCap = template?.defaultCaptions?.find((c) => isSocialCardCaption(c));
    if (socialCap) {
      setActiveLayerId(socialCap.id);
      if (socialCap.isInstagramCard) setSocialModalPlatform('instagram');
      else if (socialCap.isWhatsAppCard) setSocialModalPlatform('whatsapp');
      else setSocialModalPlatform('tweet');
      setShowStylesModal(true);
    } else {
      setActiveLayerId(null);
    }
    setActiveTab('text');
  }, [template, setActiveTemplate, setActiveLayerId, setActiveTab, setSocialModalPlatform, setShowStylesModal]);


  
  const imageFit = template?.imageFit || 'contain';

  // Open-source templates for Image Layer / Slot overlay picker

  useEffect(() => {
    let isMounted = true;
    fetchOpenSourceMemes().then((data) => {
      if (isMounted && Array.isArray(data) && data.length > 0) {
        setOpenSourceTemplates(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [setOpenSourceTemplates]);

  const activeImageLayer = imageLayers.find((i) => i.id === activeLayerId);
  const activeCaption = captions.find((c) => c.id === activeLayerId);
  const currentEditingSocialCard = (activeCaption && isSocialCardCaption(activeCaption))
    ? activeCaption
    : captions.find(c => {
        if (socialModalPlatform === 'whatsapp') return c.isWhatsAppCard;
        if (socialModalPlatform === 'instagram') return c.isInstagramCard;
        return c.isTweetCard;
      }) || captions.find(c => isSocialCardCaption(c));
  const activeSticker = stickers.find((s) => s.id === activeLayerId);
  const isElementSelected = Boolean(activeLayerId || activeCaption || activeSticker || activeImageLayer);
  const activeFontObj = FONTS.find((f) => f.family === (activeCaption?.fontFamily || 'Impact, sans-serif'))
    || FONTS.find((f) => activeCaption?.fontFamily?.toLowerCase().includes('comic') && f.id.toLowerCase().includes('comic'))
    || FONTS.find((f) => (activeCaption?.fontFamily?.toLowerCase().includes('apple') || activeCaption?.fontFamily?.toLowerCase().includes('system')) && f.id.toLowerCase().includes('apple'))
    || FONTS.find((f) => activeCaption?.fontFamily?.toLowerCase().includes(f.id.toLowerCase()))
    || FONTS[0];


  const { handleOpenSocialModalForActiveCard, handleUpdateSocialCard, handleAddTweetCard, handleAddInstagramCard, handleAddWhatsAppCard } = useSocialCardActions();
  const { handleSetCanvasBgColor, handleToggleCanvasHeader, handleToggleCanvasFooter, handleToggleCanvasBoth, handleToggleCanvasFlip, handleWatermarkImageUpload, handleCycleWatermarkPosition } = useCanvasFrameActions();
  const showTextCurveMenu = showTextEffectsMenu;
  const setShowTextCurveMenu = setShowTextEffectsMenu;

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setActiveLayerId(null);
    setShowFontMenu(false);
    setShowTextEffectsMenu(false);
    setShowTextBlurMenu(false);
    setShowTextBgMenu(false);
    setShowFilterPresets(false);
    if (tabId === 'draw') {
      setActiveSubmenu('drawSettings');
    } else {
      setActiveSubmenu(null);
    }
    if (window.innerWidth <= 768) {
      setIsMobileTabsFolded(true);
    } else {
      setIsMobileTabsFolded(false);
    }
  };

  // Freehand Drawing state
  const contextToolbarRef = useRef(null);
  const isVideoPlaying = true;




  const canvasRef = useRef(null);
  const { exportDropdownOpen, setExportDropdownOpen, exportDropdownRef, handleQuickExport } = useExport({ canvasRef, template });
  const { isRemovingBg, handleRemoveBackground } = useBackgroundRemoval();
  const {
    showFaceMorphModal, setShowFaceMorphModal, morphTargetLayerId, setMorphTargetLayerId,
    morphTargetUrl, setMorphTargetUrl, isPinpointingFace, setIsPinpointingFace, faceTarget, setFaceTarget,
    sampledFaceLighting, extractedMemeFace, isHoldingCanvasCompare, setIsHoldingCanvasCompare,
    originalTemplateImgRef, handleStartMorphFace, handleConfirmPinpoint, handleApplyFaceMorph,
    handleUpdateTemplateMorphProgress, handleChangeFace, handleRevertTemplateFace, handleFinalizeTemplateFace,
  } = useFaceMorph({ canvasRef });
  const watermarkInputRef = useRef(null);
  const watermarkTextInputRef = useRef(null);
  const tabButtonsRef = useRef(null);

  // Auto-scroll active tab into view horizontally
  useEffect(() => {
    if (tabButtonsRef.current) {
      const activeBtn = tabButtonsRef.current.querySelector('.tab-btn.active');
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeTab]);

  // Ensure Text tab is active by default when user reaches editor and no layer is auto-selected
  useEffect(() => {
    setActiveLayerId(null);
    setActiveTab('text');
  }, [setActiveLayerId, setActiveTab]);

  // Reset tweet toolbar submenus on active layer change
  useEffect(() => {
    setLastUsedSettingButton(null);
  }, [activeLayerId, setLastUsedSettingButton]);

  // When bubble layout opens, scroll to the beginning (left)
  useEffect(() => {
    if (showBubbleLayouts && contextToolbarRef.current) {
      contextToolbarRef.current.scrollLeft = 0;
    }
  }, [showBubbleLayouts]);

  // Scroll to last used setting button when returning to text toolbar and keep hover effect
  useEffect(() => {
    if (lastUsedSettingButton && !showFontMenu && !showTextCurveMenu && !showTextBlurMenu && !showTextBgMenu && !showBubbleLayouts) {
      const timer = setTimeout(() => {
        const btn = contextToolbarRef.current?.querySelector(`[data-setting-btn="${lastUsedSettingButton}"]`);
        if (btn) {
          btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [lastUsedSettingButton, showFontMenu, showTextCurveMenu, showTextBlurMenu, showTextBgMenu, showBubbleLayouts]);

  const { handleAddDrawing, handleClearDrawings, handleUndoDrawing } = useDrawingActions();
  const { handleApplyAiCaption, handleAddCaption, handleAddCurvedText, handleAddPresetPhrase, handleToggleTextCase, handleCycleTextAlignment, updateActiveCaption, updateActiveCaptionProps, getActiveTextEffectId, handleApplyTextEffect, handleSetCaptionBg, handleCycleFont } = useCaptionActions({ activeCaption, activeFontObj, handleToggleCanvasHeader });
  const { commitAddImageLayer, handleAddImageLayer, handleFileUploadImageLayer, updateActiveImageLayer, moveLayer, handleDeleteLayer, handleDuplicateLayer, handleRotateLayer, handleFlipActiveLayer, handleToggleDieCutSticker, handleSetDieCutColor, updateSlotTransform, handleAddSticker, handleAddGraphicSticker } = useLayerActions({ activeCaption, activeImageLayer, activeSticker, updateActiveCaptionProps });
  



  const { handleAddBubble, handleApplyBubbleStyle } = useBubbleActions({ activeCaption, updateActiveCaptionProps });

  useEffect(() => {
    if (showFontMenu && activeCaption?.fontFamily) {
      setTimeout(() => {
        const id = 'font-item-' + activeCaption.fontFamily.replace(/\\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }, 50);
    }
  }, [showFontMenu, activeCaption?.fontFamily]);

  useEffect(() => {
    const isFiltersOpen = !activeCaption && !activeSticker && activeTab === 'filters';
    if (isFiltersOpen) {
      const timer = setTimeout(() => {
        const activeFilterId = activeImageLayer ? (activeImageLayer.filterId || 'original') : (imageFilters.preset || 'original');
        const el = document.getElementById('filter-item-' + activeFilterId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activeTab, activeCaption, activeSticker, activeImageLayer, imageFilters.preset]);


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

  const getDockHeight = () => {
    if (aspectRatio === '16:9') return '45vh';
    if (aspectRatio === '1:1') return '40vh';
    if (aspectRatio === '4:5') return '35vh';
    if (aspectRatio === '9:16') return '32vh';
    return '38vh';
  };

  return (
    <div className="meme-editor-container animate-fade-in">
      {/* Editor Top Bar (Mobile-Friendly Compact) */}
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


        {/* Editor Workspace Main Area */}
        <div className="editor-workspace">
          {/* Canvas Render Area */}
          <div
            className="canvas-wrapper"
            onPointerDown={(e) => {
              if (e.target === e.currentTarget && activeLayerId) {
                const prevSticker = stickers.find((s) => s.id === activeLayerId);
                const prevCaption = captions.find((c) => c.id === activeLayerId);
                const prevImg = imageLayers.find((img) => img.id === activeLayerId);
                if (prevSticker || (prevCaption && isSocialCardCaption(prevCaption)) || prevImg) {
                  setActiveTab('images');
                }
                setActiveLayerId(null);
              }
            }}
          >
            {/* Canvas Viewport Area */}
            <div className="canvas-viewport">
                {/* Clipboard Paste Toast */}
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
                  template={activeTemplate}
                  imageUrl={isHoldingCanvasCompare ? (templateFaceMorph?.cleanOriginalUrl || activeTemplate?.originalUrl) : (activeTemplate?.rawImageUrl || activeTemplate?.imageUrl)}
                  captions={captions}
                  stickers={stickers}
                  imageLayers={imageLayers}
                  aspectRatio={aspectRatio}
                  imageFit={imageFit}
                  filters={imageFilters}
                  isNativeLayout={isNativeLayout}
                  layoutDef={layoutDef}
                  slotImages={slotImages}
                  slotTransforms={slotTransforms}
                  onUpdateSlotTransform={updateSlotTransform}
                  activeLayerId={activeLayerId}
                  onDeleteLayer={handleDeleteLayer}
                  onSelectLayer={(id) => {
                    setShowFontMenu(false);
                    setShowTextCurveMenu(false);
                    setShowTextBlurMenu(false);
                    setShowTextBgMenu(false);
                    setShowBubbleLayouts(false);
                    if (!id) {
                      setActiveLayerId(null);
                      setActiveSubmenu(null);
                      setShowBubbleBottomSheet(false);
                      return;
                    }
                    if (window.innerWidth <= 768) {
                      setIsMobileTabsFolded(true);
                    }
                    if (captions.some(c => c.id === id)) {
                      setActiveTab('text');
                    }
                    setActiveLayerId(id);
                    setActiveSubmenu(null);
                    setShowBubbleBottomSheet(false);
                  }}
                  onUpdateCaptionBounds={(id, newProps) => {
                    const nextCaps = captions.map((c) => (c.id === id ? { ...c, ...newProps } : c));
                    setCaptions(nextCaps);
                    pushHistoryDebounced();
                  }}
                  onUpdateStickerBounds={(id, newProps) => {
                    const nextStk = stickers.map((s) => (s.id === id ? { ...s, ...newProps } : s));
                    setStickers(nextStk);
                    pushHistoryDebounced();
                  }}
                  onUpdateImageLayerBounds={(id, newProps) => {
                    const nextImgLayers = imageLayers.map((l) => (l.id === id ? { ...l, ...newProps } : l));
                    setImageLayers(nextImgLayers);
                    pushHistoryDebounced();
                  }}
                  onUpdateCaptionText={(id, text) => {
                    setCaptions((prevCaps) => {
                      const nextCaps = prevCaps.map((c) => {
                        if (c.id === id) {
                          if (typeof text === 'object') {
                            return { ...c, ...text };
                          }
                          const updated = { ...c, text };
                          if (c.isBreakingNews) {
                            updated.newsHeadline = text;
                          }
                          return updated;
                        }
                        return c;
                      });
                      pushHistoryDebounced();
                      return nextCaps;
                    });
                  }}
                  isVideoPlaying={isVideoPlaying}
                  watermark={watermark}
                  canvasBgColor={canvasBgColor}
                  drawings={drawings}
                  onAddDrawing={handleAddDrawing}
                  isDrawingMode={!isElementSelected && activeTab === 'draw' && Boolean(drawTool)}
                  drawTool={drawTool}
                  brushColor={brushColor}
                  brushSize={brushSize}
                  canvasHeader={canvasHeader}
                  onUpdateCanvasHeader={(props) => {
                    setCanvasHeader((prev) => {
                      const upd = { ...prev, ...props };
                      pushHistoryDebounced();
                      return upd;
                    });
                  }}
                  canvasFooter={canvasFooter}
                  onUpdateCanvasFooter={(props) => {
                    setCanvasFooter((prev) => {
                      const upd = { ...prev, ...props };
                      pushHistoryDebounced();
                      return upd;
                    });
                  }}
                  demotivational={demotivational}
                  canvasFlipX={canvasFlipX}
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

              {/* ─── Bottom Toolbars Dock Anchor (Main Toolbar on top of main dock, Layer Toolbar floats above it) ─── */}
              <div className="editor-toolbars-dock-anchor">
                {/* ─── Layer Toolbar (Secondary Toolbar) ─── */}
                <SecondaryToolbar
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

            {/* ─── 2. Main Context Toolbar ─── */}
            <ContextToolbar
              activeCaption={activeCaption}
              activeFontObj={activeFontObj}
              activeImageLayer={activeImageLayer}
              activeSticker={activeSticker}
              contextToolbarRef={contextToolbarRef}
              handleAddBubble={handleAddBubble}
              handleAddCaption={handleAddCaption}
              handleChangeFace={handleChangeFace}
              handleFileUploadImageLayer={handleFileUploadImageLayer}
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
              setShowFaceMorphModal={setShowFaceMorphModal}
              updateActiveCaptionProps={updateActiveCaptionProps}
            />
          </div>

        </div>
      </div>
        
      {/* Sidebar Controls Tabs */}
        <EditorSidebar
          activeCaption={activeCaption}
          activeFontObj={activeFontObj}
          activeImageLayer={activeImageLayer}
          commitAddImageLayer={commitAddImageLayer}
          getActiveTextEffectId={getActiveTextEffectId}
          getDockHeight={getDockHeight}
          handleAddBubble={handleAddBubble}
          handleAddCaption={handleAddCaption}
          handleAddCurvedText={handleAddCurvedText}
          handleAddPresetPhrase={handleAddPresetPhrase}
          handleApplyBubbleStyle={handleApplyBubbleStyle}
          handleApplyTextEffect={handleApplyTextEffect}
          handleChangeFace={handleChangeFace}
          handleClearDrawings={handleClearDrawings}
          handleCycleFont={handleCycleFont}
          handleCycleWatermarkPosition={handleCycleWatermarkPosition}
          handleDeleteLayer={handleDeleteLayer}
          handleFileUploadImageLayer={handleFileUploadImageLayer}
          handleFinalizeTemplateFace={handleFinalizeTemplateFace}
          handleRevertTemplateFace={handleRevertTemplateFace}
          handleSetCanvasBgColor={handleSetCanvasBgColor}
          handleSetCaptionBg={handleSetCaptionBg}
          handleStartMorphFace={handleStartMorphFace}
          handleTabClick={handleTabClick}
          handleToggleCanvasBoth={handleToggleCanvasBoth}
          handleToggleCanvasFlip={handleToggleCanvasFlip}
          handleToggleCanvasFooter={handleToggleCanvasFooter}
          handleToggleCanvasHeader={handleToggleCanvasHeader}
          handleToggleTextCase={handleToggleTextCase}
          handleUndoDrawing={handleUndoDrawing}
          handleUpdateTemplateMorphProgress={handleUpdateTemplateMorphProgress}
          handleWatermarkImageUpload={handleWatermarkImageUpload}
          tabButtonsRef={tabButtonsRef}
          template={template}
          updateActiveCaption={updateActiveCaption}
          updateActiveCaptionProps={updateActiveCaptionProps}
          updateActiveImageLayer={updateActiveImageLayer}
          watermarkInputRef={watermarkInputRef}
          watermarkTextInputRef={watermarkTextInputRef}
        />
      </div>

      {/* Bottom sheets and modals */}
      <EditorModals
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
