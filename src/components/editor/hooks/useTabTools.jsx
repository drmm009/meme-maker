import { Plus, Share2, Flame, Wand2, PanelTop, Smile, Sticker, Droplet, Highlighter, Sun, FlipHorizontal, MessageSquareQuote, Brush, SunMedium, ImagePlus, LayoutTemplate, Rows3, WandSparkles, ScanFace } from 'lucide-react';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { PHOTO_FILTERS } from '../../../data/photoFilters';

const DEEP_FRIED = PHOTO_FILTERS.find((f) => f.id === 'deep-fried');
const ORIGINAL = PHOTO_FILTERS[0];

// The editor's tools by section (the editor's activeTab): the bottom bar's chips, the "+" search and
// orbit pick from these.
// Each tool: { id, label, title, keywords, Icon, active?, onClick } or, for file pickers, { accept, onFile }.
export function useTabTools({
  handleAddBubble,
  handleAddCaption,
  handleFileUploadImageLayer,
  handleToggleCanvasFlip,
  handleToggleCanvasHeader,
  handleRemoveBackground,
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
  const imageFilters = useMemeEditorStore((s) => s.imageFilters);
  const setImageFilters = useMemeEditorStore((s) => s.setImageFilters);
  const pushHistory = useMemeEditorStore((s) => s.pushHistory);
  const bgRemoved = useMemeEditorStore((s) => Boolean(s.activeTemplate?.originalUrl));
  const setShowStylesModal = useEditorUiStore((s) => s.setShowStylesModal);
  const setSocialModalPlatform = useEditorUiStore((s) => s.setSocialModalPlatform);

  const deepFried = imageFilters?.preset === 'deep-fried';
  // Same patch the filters sheet applies for a preset.
  const toggleDeepFry = () => {
    const f = deepFried ? ORIGINAL : DEEP_FRIED;
    setImageFilters((prev) => ({ ...prev, preset: f.id, filterString: f.filterString, ...f.values }));
    pushHistory();
  };

  const pickDrawTool = (tool) => { setDrawTool(tool); setActiveSubmenu('drawSettings'); };
  const watermarkOn = Boolean(watermark?.enabled && (watermark?.text || '').replace(/^@+/, '').trim().length > 0);
  const CanvasSwatch = ({ size = 20 }) => (
    <span className="ie-swatch" style={{ width: size - 4, height: size - 4, background: canvasBgColor || '#000000' }} />
  );

  return {
    text: [
      { id: 'add-text', keywords: 'caption impact words top bottom', label: 'Add Text', title: 'Add Text Caption', Icon: Plus, onClick: handleAddCaption },
      { id: 'ai', keywords: 'generate funny caption gemini roast', label: 'AI Captions', title: 'AI Meme Captions', Icon: WandSparkles, onClick: () => setShowAiModal(true) },
      { id: 'bubble', keywords: 'chat speech imessage whatsapp comic tweet instagram social card', label: 'Bubble', title: 'Add Chat & Speech Bubble', Icon: MessageSquareQuote, active: showBubbleBottomSheet, onClick: () => { handleAddBubble(); setShowBubbleBottomSheet(true); setActiveSubmenu(null); } },
      { id: 'social', keywords: 'fake tweet twitter x instagram whatsapp post chat ratioed', label: 'Social Card', title: 'Fake Tweet, Instagram or WhatsApp card', Icon: Share2, onClick: () => { setSocialModalPlatform('tweet'); setShowStylesModal(true); } },
      { id: 'banner', keywords: 'white band top bottom header footer', label: 'Header/Footer', title: 'Header & Footer bands', Icon: Rows3, active: canvasHeader.enabled || canvasFooter.enabled || activeSubmenu === 'banner', onClick: () => toggleSubmenu('banner') },
    ],
    images: [
      { id: 'stickers', keywords: 'meme sticker', label: 'Stickers', title: 'Add Meme Stickers', Icon: Sticker, onClick: () => setShowMemeStickersModal(true) },
      { id: 'emojis', keywords: 'emoji smiley', label: 'Emojis', title: 'Add Emojis', Icon: Smile, onClick: () => setShowEmojiModal(true) },
      { id: 'upload', keywords: 'image video photo gallery layer', label: 'Photo', title: 'Upload Image or Video', Icon: ImagePlus, accept: 'image/*,video/*', onFile: handleFileUploadImageLayer },
      { id: 'template', keywords: 'meme image layer', label: 'Template', title: 'Add Image from Templates', Icon: LayoutTemplate, onClick: () => setImagePickerTarget('layer') },
    ],
    draw: [
      { id: 'brush', keywords: 'draw pen paint', label: 'Brush', title: 'Brush: solid stroke', Icon: Brush, active: drawTool === 'brush', onClick: () => pickDrawTool('brush') },
      { id: 'highlighter', keywords: 'draw marker highlight', label: 'Marker', title: 'Marker: translucent highlighter', Icon: Highlighter, active: drawTool === 'highlighter', onClick: () => pickDrawTool('highlighter') },
      { id: 'glow', keywords: 'draw neon', label: 'Glow', title: 'Glow: neon stroke', Icon: SunMedium, active: drawTool === 'glow', onClick: () => pickDrawTool('glow') },
    ],
    filters: [
      { id: 'face-swap', keywords: 'face swap morph ai', label: 'Face Swap', title: 'Swap faces with another photo using AI', Icon: ScanFace, onClick: () => setShowFaceMorphModal(true) },
      { id: 'deep-fry', keywords: 'deep fry fried filter crunchy saturate', label: 'Deep-Fry', title: 'Deep-fried filter', Icon: Flame, active: deepFried, onClick: toggleDeepFry },
      { id: 'remove-bg', keywords: 'remove background cutout magic eraser', label: bgRemoved ? 'Restore BG' : 'Remove BG', title: 'Remove the meme background', Icon: Wand2, active: bgRemoved, onClick: () => handleRemoveBackground() },
      { id: 'photo-filters', keywords: 'filter deep fry adjust brightness', label: 'Filters', title: 'Photo Filters', Icon: Sun, active: showFiltersModal, onClick: () => setShowFiltersModal(true) },
    ],
    canvas: [
      { id: 'canvas-bg', keywords: 'background colour color', label: 'Color', title: 'Canvas Color', Icon: CanvasSwatch, active: activeSubmenu === 'canvasBg', onClick: () => toggleSubmenu('canvasBg') },
      { id: 'top-band', keywords: 'white band header top caption', label: 'Top Band', title: 'White band above the meme', Icon: PanelTop, active: canvasHeader.enabled, onClick: handleToggleCanvasHeader },
      { id: 'flip', keywords: 'mirror flip canvas', label: 'Flip', title: 'Flip Canvas Horizontal', Icon: FlipHorizontal, onClick: handleToggleCanvasFlip },
      { id: 'watermark', keywords: 'logo username signature', label: 'Watermark', title: 'Watermark Settings', Icon: Droplet, active: activeSubmenu === 'watermark' || watermarkOn, onClick: () => { if (!watermark?.enabled) updateWatermark('enabled', true); toggleSubmenu('watermark'); } },
    ],
  };
}
