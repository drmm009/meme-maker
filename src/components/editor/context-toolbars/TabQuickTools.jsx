import React from 'react';
import { Plus, Spline, Quote, Smile, Sticker, Droplet, Highlighter, Sun, FlipHorizontal, MessageSquareQuote, Brush, SunMedium, ImagePlus, LayoutTemplate, Rows3, WandSparkles, ScanFace } from 'lucide-react';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';

export default function TabQuickTools({
  activeCaption,
  activeImageLayer,
  activeSticker,
  handleAddBubble,
  handleAddCaption,
  handleAddCurvedText,
  handleFileUploadImageLayer,
  handleToggleCanvasFlip,
  setShowFaceMorphModal,
}) {
  const activeSubmenu = useEditorUiStore((s) => s.activeSubmenu);
  const activeTab = useEditorUiStore((s) => s.activeTab);
  const drawTool = useEditorUiStore((s) => s.drawTool);
  const handleToggleSubmenu = useEditorUiStore((s) => s.toggleSubmenu);
  const setActiveSubmenu = useEditorUiStore((s) => s.setActiveSubmenu);
  const setDrawTool = useEditorUiStore((s) => s.setDrawTool);
  const setImagePickerTarget = useEditorUiStore((s) => s.setImagePickerTarget);
  const setShowAiModal = useEditorUiStore((s) => s.setShowAiModal);
  const setShowBubbleBottomSheet = useEditorUiStore((s) => s.setShowBubbleBottomSheet);
  const setShowEmojiModal = useEditorUiStore((s) => s.setShowEmojiModal);
  const setShowFiltersModal = useEditorUiStore((s) => s.setShowFiltersModal);
  const setShowMemeStickersModal = useEditorUiStore((s) => s.setShowMemeStickersModal);
  const showBubbleBottomSheet = useEditorUiStore((s) => s.showBubbleBottomSheet);
  const showFiltersModal = useEditorUiStore((s) => s.showFiltersModal);
  const updateWatermark = useEditorUiStore((s) => s.updateWatermark);
  const watermark = useEditorUiStore((s) => s.watermark);
  const templateFaceMorph = useMemeEditorStore((s) => s.templateFaceMorph);
  const canvasHeader = useMemeEditorStore((s) => s.canvasHeader);
  const canvasFooter = useMemeEditorStore((s) => s.canvasFooter);
  const canvasBgColor = useMemeEditorStore((s) => s.canvasBgColor);

  return (
    <>
      {!(activeCaption || activeSticker || activeImageLayer) && !templateFaceMorph && activeTab === "text" && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          <button
            className="btn btn-xs vid-ctx-btn vid-ctx-btn-primary vid-ctx-btn-add-text"
            data-action="add-text"
            onClick={handleAddCaption}
            title="Add Text Caption"
          >
            <Plus style={{ width: 14, height: 14, color: '#ffffff' }} /> <span>Add Text</span>
          </button>

          <button
            type="button"
            className="btn btn-xs vid-ctx-btn"
            onClick={handleAddCurvedText}
            title="Add Curved Text"
          >
            <Spline style={{ width: 13, height: 13, color: '#ffffff' }} /> <span>Curved</span>
          </button>

          <button
            type="button"
            data-setting-btn="phrases"
            className={`btn btn-xs vid-ctx-btn ${activeSubmenu === 'phrases' ? 'active' : ''}`}
            onClick={() => handleToggleSubmenu('phrases')}
            title="Quick Phrases"
          >
            <Quote style={{ width: 13, height: 13, color: '#ffffff' }} /> <span>Phrases</span>
          </button>

          <button
            type="button"
            data-setting-btn="banner"
            className={`btn btn-xs vid-ctx-btn vid-ctx-btn-banner ${(canvasHeader.enabled || canvasFooter.enabled || activeSubmenu === 'banner') ? 'active' : ''}`}
            onClick={() => handleToggleSubmenu('banner')}
            title="Header & Footer Canvas Extensions (Top / Bottom)"
          >
            <Rows3 style={{ width: 13, height: 13, color: '#ffffff' }} />
            <span>Header / Footer</span>
          </button>

          <button
            type="button"
            data-setting-btn="bubble"
            className={`btn btn-xs vid-ctx-btn vid-ctx-btn-bubble ${showBubbleBottomSheet ? 'active' : ''}`}
            onClick={() => {
              if (activeCaption) {
                setShowBubbleBottomSheet(true);
              } else {
                handleAddBubble();
                setShowBubbleBottomSheet(true);
              }
              setActiveSubmenu(null);
            }}
            title="Add Chat & Speech Bubble (iPhone, WhatsApp, Comic)"
          >
            <MessageSquareQuote style={{ width: 13, height: 13, color: '#ffffff' }} /> <span>Bubble</span>
          </button>

          <button
            className="btn btn-xs vid-ctx-btn vid-ctx-btn-ai"
            data-action="ai-captions"
            onClick={() => setShowAiModal(true)}
            title="AI Meme Captions"
          >
            <WandSparkles style={{ width: 13, height: 13, color: '#ffffff' }} className="vid-ai-sparkle-icon" /> <span>AI Captions</span>
          </button>
        </div>
      )}

      {/* IMAGES TAB */}
      {!(activeCaption || activeSticker || activeImageLayer) && !templateFaceMorph && activeTab === 'images' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <label
            className="btn btn-xs vid-ctx-btn"
            style={{
              padding: '5px 14px',
              fontSize: '0.8rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '12px',
              flexShrink: 0,
              cursor: 'pointer',
              margin: 0
            }}
            title="Upload Image or Video"
          >
            <ImagePlus style={{ width: 14, height: 14, color: 'var(--cyber-cyan)' }} />
            <span>Upload</span>
            <input
              type="file"
              accept="image/*,video/*"
              style={{ display: 'none' }}
              onChange={handleFileUploadImageLayer}
            />
          </label>

          <button
            className="btn btn-xs vid-ctx-btn"
            onClick={() => setImagePickerTarget('layer')}
            style={{
              padding: '5px 14px',
              fontSize: '0.8rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '12px',
              flexShrink: 0
            }}
            title="Add Image from Templates"
          >
            <LayoutTemplate style={{ width: 14, height: 14, color: 'var(--cyber-cyan)' }} />
            <span>Template</span>
          </button>

          <button
            className="btn btn-xs vid-ctx-btn"
            onClick={() => setShowMemeStickersModal(true)}
            style={{
              padding: '5px 14px',
              fontSize: '0.8rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '12px',
              flexShrink: 0
            }}
            title="Add Meme Stickers"
          >
            <Sticker style={{ width: 14, height: 14, color: 'var(--cyber-cyan)' }} />
            <span>Stickers</span>
          </button>

          <button
            className="btn btn-xs vid-ctx-btn"
            onClick={() => setShowEmojiModal(true)}
            style={{
              padding: '5px 14px',
              fontSize: '0.8rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '12px',
              flexShrink: 0
            }}
            title="Add Emojis"
          >
            <Smile style={{ width: 14, height: 14, color: 'var(--cyber-cyan)' }} />
            <span>Emojis</span>
          </button>
        </div>
      )}

      {/* DRAW TAB */}
      {!(activeCaption || activeSticker || activeImageLayer) && activeTab === 'draw' && (
        <div
          className="draw-toolbar-group"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            flexShrink: 0,
            marginInline: 'auto'
          }}
        >
          <button
            className={`btn btn-xs vid-ctx-btn ${drawTool === 'brush' ? 'active' : ''}`}
            onClick={() => {
              setDrawTool('brush');
              setActiveSubmenu('drawSettings');
            }}
            style={{
              padding: '5px 14px',
              fontSize: '0.8rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '12px',
              background: drawTool === 'brush' ? 'var(--primary-gradient)' : undefined,
              color: drawTool === 'brush' ? '#ffffff' : undefined,
              border: drawTool === 'brush' ? '1px solid var(--cyber-cyan)' : undefined,
              flexShrink: 0
            }}
            title="Brush: Solid clean brush stroke"
          >
            <Brush style={{ width: 14, height: 14 }} />
            <span>Brush</span>
          </button>

          <button
            className={`btn btn-xs vid-ctx-btn ${drawTool === 'highlighter' ? 'active' : ''}`}
            onClick={() => {
              setDrawTool('highlighter');
              setActiveSubmenu('drawSettings');
            }}
            style={{
              padding: '5px 14px',
              fontSize: '0.8rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '12px',
              background: drawTool === 'highlighter' ? 'var(--primary-gradient)' : undefined,
              color: drawTool === 'highlighter' ? '#ffffff' : undefined,
              border: drawTool === 'highlighter' ? '1px solid var(--cyber-cyan)' : undefined,
              flexShrink: 0
            }}
            title="Marker: Translucent highlighter"
          >
            <Highlighter style={{ width: 14, height: 14 }} />
            <span>Marker</span>
          </button>

          <button
            className={`btn btn-xs vid-ctx-btn ${drawTool === 'glow' ? 'active' : ''}`}
            onClick={() => {
              setDrawTool('glow');
              setActiveSubmenu('drawSettings');
            }}
            style={{
              padding: '5px 14px',
              fontSize: '0.8rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '12px',
              background: drawTool === 'glow' ? 'var(--primary-gradient)' : undefined,
              color: drawTool === 'glow' ? '#ffffff' : undefined,
              border: drawTool === 'glow' ? '1px solid var(--cyber-cyan)' : undefined,
              flexShrink: 0
            }}
            title="Glow: Neon laser glow"
          >
            <SunMedium style={{ width: 14, height: 14 }} />
            <span>Glow</span>
          </button>
        </div>
      )}

      {/* CANVAS TAB */}
      {!(activeCaption || activeSticker || activeImageLayer) && !templateFaceMorph && (activeTab === 'canvas' || activeTab === 'watermark') && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button
            className={`btn btn-xs vid-ctx-btn ${activeSubmenu === 'canvasBg' ? 'active' : ''}`}
            onClick={() => handleToggleSubmenu('canvasBg')}
            title="Canvas Color"
          >
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: canvasBgColor || '#000000', border: '1.5px solid rgba(255,255,255,0.6)' }} />
            <span>Canvas Color</span>
          </button>

          <button
            className="btn btn-xs vid-ctx-btn"
            onClick={handleToggleCanvasFlip}
            title="Flip Canvas Horizontal"
          >
            <FlipHorizontal style={{ width: 13, height: 13 }} />
            <span>Flip Canvas</span>
          </button>

          {(() => {
            const isWatermarkActive = Boolean(
              watermark?.enabled &&
              (watermark?.text || '').replace(/^@+/, '').trim().length > 0
            );
            return (
              <button
                className={`btn btn-xs vid-ctx-btn ${(activeSubmenu === 'watermark' || isWatermarkActive) ? 'active' : ''}`}
                onClick={() => {
                  if (!watermark?.enabled) updateWatermark('enabled', true);
                  handleToggleSubmenu('watermark');
                }}
                title="Watermark Settings"
              >
                <Droplet style={{ width: 13, height: 13 }} />
                <span>Watermark</span>
              </button>
            );
          })()}
        </div>
      )}

      {/* FILTERS TAB */}
      {!(activeCaption || activeSticker || activeImageLayer) && !templateFaceMorph && activeTab === 'filters' && (
        <div
          className="filters-toolbar-group"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            flexShrink: 0,
            marginInline: 'auto'
          }}
        >
          <button
            className="btn btn-xs vid-ctx-btn"
            title="Swap faces with another photo using AI"
            onClick={() => setShowFaceMorphModal(true)}
            style={{
              padding: '4px 12px',
              fontSize: '0.75rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--glass-border)',
              flexShrink: 0
            }}
          >
            <ScanFace style={{ width: 13, height: 13, color: 'var(--cyber-cyan)' }} />
            <span>Face Swap</span>
          </button>

          <button
            className={`btn btn-xs vid-ctx-btn ${showFiltersModal ? 'active' : ''}`}
            title="Photo Filters"
            onClick={() => setShowFiltersModal(true)}
            style={{
              padding: '4px 12px',
              fontSize: '0.75rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '12px',
              background: showFiltersModal ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.08)',
              border: showFiltersModal ? '1px solid var(--cyber-cyan)' : '1px solid var(--glass-border)',
              color: '#ffffff',
              flexShrink: 0
            }}
          >
            <Sun style={{ width: 13, height: 13, color: '#f59e0b' }} />
            <span>Filters</span>
          </button>
        </div>
      )}
    </>
  );
}
