import { Plus, Spline, Quote, Smile, Sticker, Droplet, Highlighter, Sun, FlipHorizontal, MessageSquareQuote, Brush, SunMedium, ImagePlus, LayoutTemplate, Rows3, WandSparkles, ScanFace } from 'lucide-react';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';

// The tools behind each dock tab, shown in the dock when the tab is open.
// Each tool: { id, label, title, Icon, active?, onClick } or, for file pickers, { accept, onFile }.
export function useTabTools({
  handleAddBubble,
  handleAddCaption,
  handleAddCurvedText,
  handleFileUploadImageLayer,
  handleToggleCanvasFlip,
  setShowFaceMorphModal,
}) {
  const activeSubmenu = useEditorUiStore((s) => s.activeSubmenu);
  const drawTool = useEditorUiStore((s) => s.drawTool);
  const toggleSubmenu = useEditorUiStore((s) => s.toggleSubmenu);
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
  const canvasHeader = useMemeEditorStore((s) => s.canvasHeader);
  const canvasFooter = useMemeEditorStore((s) => s.canvasFooter);
  const canvasBgColor = useMemeEditorStore((s) => s.canvasBgColor);

  const pickDrawTool = (tool) => { setDrawTool(tool); setActiveSubmenu('drawSettings'); };
  const watermarkOn = Boolean(watermark?.enabled && (watermark?.text || '').replace(/^@+/, '').trim().length > 0);
  const CanvasSwatch = ({ size = 20 }) => (
    <span className="ie-swatch" style={{ width: size - 4, height: size - 4, background: canvasBgColor || '#000000' }} />
  );

  return {
    text: [
      { id: 'add-text', label: 'Add Text', title: 'Add Text Caption', Icon: Plus, onClick: handleAddCaption },
      { id: 'curved', label: 'Curved', title: 'Add Curved Text', Icon: Spline, onClick: handleAddCurvedText },
      { id: 'phrases', label: 'Phrases', title: 'Quick Phrases', Icon: Quote, active: activeSubmenu === 'phrases', onClick: () => toggleSubmenu('phrases') },
      { id: 'banner', label: 'Header/Footer', title: 'Header & Footer bands', Icon: Rows3, active: canvasHeader.enabled || canvasFooter.enabled || activeSubmenu === 'banner', onClick: () => toggleSubmenu('banner') },
      { id: 'bubble', label: 'Bubble', title: 'Add Chat & Speech Bubble', Icon: MessageSquareQuote, active: showBubbleBottomSheet, onClick: () => { handleAddBubble(); setShowBubbleBottomSheet(true); setActiveSubmenu(null); } },
      { id: 'ai', label: 'AI Captions', title: 'AI Meme Captions', Icon: WandSparkles, onClick: () => setShowAiModal(true) },
    ],
    images: [
      { id: 'upload', label: 'Upload', title: 'Upload Image or Video', Icon: ImagePlus, accept: 'image/*,video/*', onFile: handleFileUploadImageLayer },
      { id: 'template', label: 'Template', title: 'Add Image from Templates', Icon: LayoutTemplate, onClick: () => setImagePickerTarget('layer') },
      { id: 'stickers', label: 'Stickers', title: 'Add Meme Stickers', Icon: Sticker, onClick: () => setShowMemeStickersModal(true) },
      { id: 'emojis', label: 'Emojis', title: 'Add Emojis', Icon: Smile, onClick: () => setShowEmojiModal(true) },
    ],
    draw: [
      { id: 'brush', label: 'Brush', title: 'Brush: solid stroke', Icon: Brush, active: drawTool === 'brush', onClick: () => pickDrawTool('brush') },
      { id: 'highlighter', label: 'Marker', title: 'Marker: translucent highlighter', Icon: Highlighter, active: drawTool === 'highlighter', onClick: () => pickDrawTool('highlighter') },
      { id: 'glow', label: 'Glow', title: 'Glow: neon stroke', Icon: SunMedium, active: drawTool === 'glow', onClick: () => pickDrawTool('glow') },
    ],
    filters: [
      { id: 'face-swap', label: 'Face Swap', title: 'Swap faces with another photo using AI', Icon: ScanFace, onClick: () => setShowFaceMorphModal(true) },
      { id: 'photo-filters', label: 'Filters', title: 'Photo Filters', Icon: Sun, active: showFiltersModal, onClick: () => setShowFiltersModal(true) },
    ],
    canvas: [
      { id: 'canvas-bg', label: 'Color', title: 'Canvas Color', Icon: CanvasSwatch, active: activeSubmenu === 'canvasBg', onClick: () => toggleSubmenu('canvasBg') },
      { id: 'flip', label: 'Flip', title: 'Flip Canvas Horizontal', Icon: FlipHorizontal, onClick: handleToggleCanvasFlip },
      { id: 'watermark', label: 'Watermark', title: 'Watermark Settings', Icon: Droplet, active: activeSubmenu === 'watermark' || watermarkOn, onClick: () => { if (!watermark?.enabled) updateWatermark('enabled', true); toggleSubmenu('watermark'); } },
    ],
  };
}
