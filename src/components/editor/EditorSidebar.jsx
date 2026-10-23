import React from 'react';
import { Type, Sparkles, Copy, LayoutGrid, PencilLine } from 'lucide-react';
import FiltersTab from './tabs/FiltersTab';
import MediaTab from './tabs/MediaTab';
import DrawTab from './tabs/DrawTab';
import CanvasTab from './tabs/CanvasTab';
import TextTab from './tabs/TextTab';
import { useMemeEditorStore } from './store/useMemeEditorStore';
import { useEditorUiStore } from './store/useEditorUiStore';

export default function EditorSidebar({
  activeCaption,
  activeFontObj,
  activeImageLayer,
  commitAddImageLayer,
  getActiveTextEffectId,
  getDockHeight,
  handleAddBubble,
  handleAddCaption,
  handleAddCurvedText,
  handleAddPresetPhrase,
  handleApplyBubbleStyle,
  handleApplyTextEffect,
  handleChangeFace,
  handleClearDrawings,
  handleCycleFont,
  handleCycleWatermarkPosition,
  handleDeleteLayer,
  handleFileUploadImageLayer,
  handleFinalizeTemplateFace,
  handleRevertTemplateFace,
  handleSetCanvasBgColor,
  handleSetCaptionBg,
  handleStartMorphFace,
  handleTabClick,
  handleToggleCanvasBoth,
  handleToggleCanvasFlip,
  handleToggleCanvasFooter,
  handleToggleCanvasHeader,
  handleToggleTextCase,
  handleUndoDrawing,
  handleUpdateTemplateMorphProgress,
  handleWatermarkImageUpload,
  tabButtonsRef,
  template,
  updateActiveCaption,
  updateActiveCaptionProps,
  updateActiveImageLayer,
  watermarkInputRef,
  watermarkTextInputRef,
}) {
  const activeTab = useEditorUiStore((s) => s.activeTab);
  const brushColor = useEditorUiStore((s) => s.brushColor);
  const brushSize = useEditorUiStore((s) => s.brushSize);
  const drawTool = useEditorUiStore((s) => s.drawTool);
  const isMobileTabsFolded = useEditorUiStore((s) => s.isMobileTabsFolded);
  const pendingVideoLayer = useEditorUiStore((s) => s.pendingVideoLayer);
  const setActiveSubmenu = useEditorUiStore((s) => s.setActiveSubmenu);
  const setBrushColor = useEditorUiStore((s) => s.setBrushColor);
  const setBrushSize = useEditorUiStore((s) => s.setBrushSize);
  const setDrawTool = useEditorUiStore((s) => s.setDrawTool);
  const setImagePickerTarget = useEditorUiStore((s) => s.setImagePickerTarget);
  const setPendingVideoLayer = useEditorUiStore((s) => s.setPendingVideoLayer);
  const setShowAiModal = useEditorUiStore((s) => s.setShowAiModal);
  const setShowBubbleBottomSheet = useEditorUiStore((s) => s.setShowBubbleBottomSheet);
  const setShowFilterPresets = useEditorUiStore((s) => s.setShowFilterPresets);
  const setShowFiltersModal = useEditorUiStore((s) => s.setShowFiltersModal);
  const showFilterPresets = useEditorUiStore((s) => s.showFilterPresets);
  const updateWatermark = useEditorUiStore((s) => s.updateWatermark);
  const watermark = useEditorUiStore((s) => s.watermark);
  const setActiveLayerId = useMemeEditorStore((s) => s.setActiveLayerId);

  return (
    <>
      <div 
        className={`editor-sidebar glass-card ${isMobileTabsFolded ? 'folded' : ''}`}
        style={{ '--dock-height': getDockHeight() }}
      >
        <div 
          ref={tabButtonsRef}
          className="tab-buttons"
          onWheel={(e) => {
            if (e.deltaY !== 0) {
              e.currentTarget.scrollLeft += e.deltaY;
            }
          }}
        >
          <button
            className={`tab-btn ${activeTab === 'draw' ? 'active' : ''}`}
            onClick={() => {
              handleTabClick('draw');
              setActiveLayerId(null);
              setDrawTool('brush');
            }}
          >
            <PencilLine className="icon-xs" /> <span>Draw</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'images' ? 'active' : ''}`}
            onClick={() => handleTabClick('images')}
          >
            <Copy className="icon-xs" /> <span>Media</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`}
            onClick={() => handleTabClick('text')}
          >
            <Type className="icon-xs" /> <span>Text</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'filters' ? 'active' : ''}`}
            onClick={() => handleTabClick('filters')}
          >
            <Sparkles className="icon-xs" /> <span>AI/Filters</span>
          </button>
          <button
            className={`tab-btn ${(activeTab === 'canvas' || activeTab === 'watermark') ? 'active' : ''}`}
            onClick={() => handleTabClick('canvas')}
          >
            <LayoutGrid className="icon-xs" /> <span>Canvas</span>
          </button>

        </div>



          {/* TAB 5: CANVAS & WATERMARK */}
          <CanvasTab
            activeTab={activeTab}
            handleCycleWatermarkPosition={handleCycleWatermarkPosition}
            handleSetCanvasBgColor={handleSetCanvasBgColor}
            handleToggleCanvasFlip={handleToggleCanvasFlip}
            handleWatermarkImageUpload={handleWatermarkImageUpload}
            updateWatermark={updateWatermark}
            watermark={watermark}
            watermarkInputRef={watermarkInputRef}
            watermarkTextInputRef={watermarkTextInputRef}
          />
          {/* TAB 4: FREEHAND DRAWING */}
          <DrawTab
            activeTab={activeTab}
            brushColor={brushColor}
            brushSize={brushSize}
            drawTool={drawTool}
            handleClearDrawings={handleClearDrawings}
            handleUndoDrawing={handleUndoDrawing}
            setBrushColor={setBrushColor}
            setBrushSize={setBrushSize}
            setDrawTool={setDrawTool}
          />

        {/* TAB 1: TEXT CONTROLS */}
        <TextTab
          activeCaption={activeCaption}
          activeFontObj={activeFontObj}
          activeTab={activeTab}
          getActiveTextEffectId={getActiveTextEffectId}
          handleAddBubble={handleAddBubble}
          handleAddCaption={handleAddCaption}
          handleAddCurvedText={handleAddCurvedText}
          handleAddPresetPhrase={handleAddPresetPhrase}
          handleApplyBubbleStyle={handleApplyBubbleStyle}
          handleApplyTextEffect={handleApplyTextEffect}
          handleCycleFont={handleCycleFont}
          handleDeleteLayer={handleDeleteLayer}
          handleSetCanvasBgColor={handleSetCanvasBgColor}
          handleSetCaptionBg={handleSetCaptionBg}
          handleToggleCanvasBoth={handleToggleCanvasBoth}
          handleToggleCanvasFooter={handleToggleCanvasFooter}
          handleToggleCanvasHeader={handleToggleCanvasHeader}
          handleToggleTextCase={handleToggleTextCase}
          setActiveSubmenu={setActiveSubmenu}
          setShowAiModal={setShowAiModal}
          setShowBubbleBottomSheet={setShowBubbleBottomSheet}
          updateActiveCaption={updateActiveCaption}
          updateActiveCaptionProps={updateActiveCaptionProps}
        />


        {/* TAB 3: MEDIA OVERLAY CONTROLS */}
        <MediaTab
          activeImageLayer={activeImageLayer}
          activeTab={activeTab}
          commitAddImageLayer={commitAddImageLayer}
          handleChangeFace={handleChangeFace}
          handleDeleteLayer={handleDeleteLayer}
          handleFileUploadImageLayer={handleFileUploadImageLayer}
          handleFinalizeTemplateFace={handleFinalizeTemplateFace}
          handleRevertTemplateFace={handleRevertTemplateFace}
          handleUpdateTemplateMorphProgress={handleUpdateTemplateMorphProgress}
          pendingVideoLayer={pendingVideoLayer}
          setImagePickerTarget={setImagePickerTarget}
          setPendingVideoLayer={setPendingVideoLayer}
          updateActiveImageLayer={updateActiveImageLayer}
        />

        {/* TAB 4: AI / FILTERS */}
        <FiltersTab
          activeImageLayer={activeImageLayer}
          activeTab={activeTab}
          handleStartMorphFace={handleStartMorphFace}
          setShowFilterPresets={setShowFilterPresets}
          setShowFiltersModal={setShowFiltersModal}
          showFilterPresets={showFilterPresets}
          template={template}
        />
      </div>
    </>
  );
}
