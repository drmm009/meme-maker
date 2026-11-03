import { isColorDark } from '../../../utils/captionLayout';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';

export function useCanvasFrameActions() {
  const setCanvasBgColor = useMemeEditorStore((s) => s.setCanvasBgColor);
  const setCanvasBgGradient = useMemeEditorStore((s) => s.setCanvasBgGradient);
  const setCanvasHeader = useMemeEditorStore((s) => s.setCanvasHeader);
  const setCanvasFooter = useMemeEditorStore((s) => s.setCanvasFooter);
  const setCaptions = useMemeEditorStore((s) => s.setCaptions);
  const updateWatermark = useEditorUiStore((s) => s.updateWatermark);
  const setCanvasFlipX = useMemeEditorStore((s) => s.setCanvasFlipX);
  const pushHistory = useMemeEditorStore((s) => s.pushHistory);
  const canvasHeader = useMemeEditorStore((s) => s.canvasHeader);
  const canvasBgColor = useMemeEditorStore((s) => s.canvasBgColor);
  const canvasFooter = useMemeEditorStore((s) => s.canvasFooter);

  const handleSetCanvasBgColor = (val) => {
    setCanvasBgColor(val);
    setCanvasBgGradient(null);
    window.dispatchEvent(new CustomEvent('liveCanvasBgColor', { detail: val }));
    const isDark = isColorDark(val);
    const nextTextColor = isDark ? '#ffffff' : '#000000';

    setCanvasHeader(prev => ({ ...prev, bgColor: val }));
    setCanvasFooter(prev => ({ ...prev, bgColor: val }));

    // Auto adapt text color for header / footer captions to ensure contrast against canvas bg
    setCaptions(prev => prev.map(c => {
      if (c.isHeaderCaption || c.isFooterCaption) {
        if (c.color === '#000000' || c.color === '#ffffff' || c.color === 'black' || c.color === 'white') {
          return { ...c, color: nextTextColor, stroke: 'transparent' };
        }
      }
      return c;
    }));
  };

  // A gradient background (two colours, top-left to bottom-right); the bands keep the solid colour.
  const handleSetCanvasBgGradient = (colors) => setCanvasBgGradient(colors);

  const handleWatermarkImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      updateWatermark('imageUrl', ev.target.result);
      updateWatermark('text', ''); // switch to image mode
    };
    reader.readAsDataURL(file);
  };

  // Keyboard shortcuts: Ctrl+Z (undo), Ctrl+Y / Ctrl+Shift+Z (redo), Delete (delete layer), Escape (deselect)
  const handleToggleCanvasFlip = () => {
    setCanvasFlipX((prev) => !prev);
    pushHistory();
  };

  // The header and footer bands: switching one on adds the band alone (in the canvas colour), no
  // text layer with it; switching it off leaves the layers as they are.
  const setBand = (setter, band, on) => {
    setter({ ...band, enabled: on, ...(on && { bgColor: canvasBgColor || '#ffffff' }) });
    pushHistory();
  };
  const handleToggleCanvasHeader = () => setBand(setCanvasHeader, canvasHeader, !canvasHeader.enabled);
  const handleToggleCanvasFooter = () => setBand(setCanvasFooter, canvasFooter, !canvasFooter.enabled);
  // Both on, or both off when both already are.
  const handleToggleCanvasBoth = () => {
    const on = !(canvasHeader.enabled && canvasFooter.enabled);
    const bgColor = canvasBgColor || '#ffffff';
    setCanvasHeader({ ...canvasHeader, enabled: on, ...(on && { bgColor }) });
    setCanvasFooter({ ...canvasFooter, enabled: on, ...(on && { bgColor }) });
    pushHistory();
  };

  return { handleSetCanvasBgColor, handleSetCanvasBgGradient, handleToggleCanvasHeader, handleToggleCanvasFooter, handleToggleCanvasBoth, handleToggleCanvasFlip, handleWatermarkImageUpload };
}
