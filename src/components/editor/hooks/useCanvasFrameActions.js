import { isColorDark } from '../../../utils/captionLayout';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';

export function useCanvasFrameActions() {
  const setCanvasBgColor = useMemeEditorStore((s) => s.setCanvasBgColor);
  const setCanvasHeader = useMemeEditorStore((s) => s.setCanvasHeader);
  const setCanvasFooter = useMemeEditorStore((s) => s.setCanvasFooter);
  const setCaptions = useMemeEditorStore((s) => s.setCaptions);
  const updateWatermark = useEditorUiStore((s) => s.updateWatermark);
  const canvasFlipX = useMemeEditorStore((s) => s.canvasFlipX);
  const setCanvasFlipX = useMemeEditorStore((s) => s.setCanvasFlipX);
  const pushHistory = useMemeEditorStore((s) => s.pushHistory);
  const canvasHeader = useMemeEditorStore((s) => s.canvasHeader);
  const canvasBgColor = useMemeEditorStore((s) => s.canvasBgColor);
  const captions = useMemeEditorStore((s) => s.captions);
  const setActiveLayerId = useMemeEditorStore((s) => s.setActiveLayerId);
  const setActiveTab = useEditorUiStore((s) => s.setActiveTab);
  const setActiveSubmenu = useEditorUiStore((s) => s.setActiveSubmenu);
  const activeLayerId = useMemeEditorStore((s) => s.activeLayerId);
  const canvasFooter = useMemeEditorStore((s) => s.canvasFooter);
  const watermark = useEditorUiStore((s) => s.watermark);

  const handleSetCanvasBgColor = (val) => {
    setCanvasBgColor(val);
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
    const nextFlip = !canvasFlipX;
    setCanvasFlipX(nextFlip);
    pushHistory();
  };

  // 1-Tap Modern Meme Header Extension (Canvas extension above meme image with normal caption layer)
  const handleToggleCanvasHeader = () => {
    const nextState = !canvasHeader.enabled;
    const currentBg = canvasBgColor || '#ffffff';
    const isDark = isColorDark(currentBg);
    const nextHeader = {
      ...canvasHeader,
      enabled: nextState,
      bgColor: currentBg
    };
    setCanvasHeader(nextHeader);

    if (nextState) {
      const existingHeaderCap = captions.find(c => c.isHeaderCaption);
      if (existingHeaderCap) {
        setActiveLayerId(existingHeaderCap.id);
        setActiveTab('text');
        setActiveSubmenu(null);
        pushHistory();
      } else {
        const newHeaderCap = {
          id: `caption-header-${Date.now()}`,
          text: 'When you finally solve the bug after 4 hours:',
          x: 0.5,
          y: 0.05,
          fontSize: 50,
          fontFamily: 'Montserrat, sans-serif',
          color: isDark ? '#ffffff' : '#000000',
          stroke: 'transparent',
          strokeWidth: 0,
          align: 'center',
          width: 0.92,
          isHeaderCaption: true
        };
        const nextCaps = [newHeaderCap, ...captions];
        setCaptions(nextCaps);
        setActiveLayerId(newHeaderCap.id);
        setActiveTab('text');
        setActiveSubmenu(null);
        pushHistory();
      }
    } else {
      const headerCap = captions.find(c => c.isHeaderCaption);
      const nextCaps = captions.filter(c => !c.isHeaderCaption);
      setCaptions(nextCaps);
      if (activeLayerId === headerCap?.id) {
        setActiveLayerId(null);
      }
      pushHistory();
    }
  };

  // 1-Tap Modern Meme Footer Extension (Canvas extension below meme image with normal caption layer)
  const handleToggleCanvasFooter = () => {
    const nextState = !canvasFooter.enabled;
    const currentBg = canvasBgColor || '#ffffff';
    const isDark = isColorDark(currentBg);
    const nextFooter = {
      ...canvasFooter,
      enabled: nextState,
      bgColor: currentBg
    };
    setCanvasFooter(nextFooter);

    if (nextState) {
      const existingFooterCap = captions.find(c => c.isFooterCaption);
      if (existingFooterCap) {
        setActiveLayerId(existingFooterCap.id);
        setActiveTab('text');
        setActiveSubmenu(null);
        pushHistory();
      } else {
        const newFooterCap = {
          id: `caption-footer-${Date.now()}`,
          text: '...and then realize you were in the wrong branch',
          x: 0.5,
          y: 0.95,
          fontSize: 50,
          fontFamily: 'Montserrat, sans-serif',
          color: isDark ? '#ffffff' : '#000000',
          stroke: 'transparent',
          strokeWidth: 0,
          align: 'center',
          width: 0.92,
          isFooterCaption: true
        };
        const nextCaps = [...captions, newFooterCap];
        setCaptions(nextCaps);
        setActiveLayerId(newFooterCap.id);
        setActiveTab('text');
        setActiveSubmenu(null);
        pushHistory();
      }
    } else {
      const footerCap = captions.find(c => c.isFooterCaption);
      const nextCaps = captions.filter(c => !c.isFooterCaption);
      setCaptions(nextCaps);
      if (activeLayerId === footerCap?.id) {
        setActiveLayerId(null);
      }
      pushHistory();
    }
  };

  // 1-Tap Toggle Both Modern Header & Footer Extensions
  const handleToggleCanvasBoth = () => {
    const bothAlreadyEnabled = canvasHeader.enabled && canvasFooter.enabled;
    const currentBg = canvasBgColor || '#ffffff';
    const isDark = isColorDark(currentBg);

    if (bothAlreadyEnabled) {
      const nextHeader = {
        ...canvasHeader,
        enabled: false
      };
      const nextFooter = {
        ...canvasFooter,
        enabled: false
      };
      setCanvasHeader(nextHeader);
      setCanvasFooter(nextFooter);

      const headerCap = captions.find(c => c.isHeaderCaption);
      const footerCap = captions.find(c => c.isFooterCaption);
      const nextCaps = captions.filter(c => !c.isHeaderCaption && !c.isFooterCaption);
      setCaptions(nextCaps);
      if (activeLayerId === headerCap?.id || activeLayerId === footerCap?.id) {
        setActiveLayerId(null);
      }
      pushHistory();
    } else {
      const nextHeader = {
        ...canvasHeader,
        enabled: true,
        bgColor: currentBg
      };
      const nextFooter = {
        ...canvasFooter,
        enabled: true,
        bgColor: currentBg
      };
      setCanvasHeader(nextHeader);
      setCanvasFooter(nextFooter);

      let nextCaps = [...captions];
      let targetActiveId = null;

      // Header caption
      let existingHeaderCap = nextCaps.find(c => c.isHeaderCaption);
      if (!existingHeaderCap) {
        existingHeaderCap = {
          id: `caption-header-${Date.now()}`,
          text: 'When you finally solve the bug after 4 hours:',
          x: 0.5,
          y: 0.05,
          fontSize: 50,
          fontFamily: 'Montserrat, sans-serif',
          color: isDark ? '#ffffff' : '#000000',
          stroke: 'transparent',
          strokeWidth: 0,
          align: 'center',
          width: 0.92,
          isHeaderCaption: true
        };
        nextCaps = [existingHeaderCap, ...nextCaps];
      }
      targetActiveId = existingHeaderCap.id;

      // Footer caption
      let existingFooterCap = nextCaps.find(c => c.isFooterCaption);
      if (!existingFooterCap) {
        existingFooterCap = {
          id: `caption-footer-${Date.now() + 1}`,
          text: '...and then realize you were in the wrong branch',
          x: 0.5,
          y: 0.95,
          fontSize: 50,
          fontFamily: 'Montserrat, sans-serif',
          color: isDark ? '#ffffff' : '#000000',
          stroke: 'transparent',
          strokeWidth: 0,
          align: 'center',
          width: 0.92,
          isFooterCaption: true
        };
        nextCaps = [...nextCaps, existingFooterCap];
      }

      setCaptions(nextCaps);
      setActiveLayerId(targetActiveId);
      setActiveTab('text');
      setActiveSubmenu(null);
      pushHistory();
    }
  };

    const handleCycleWatermarkPosition = () => {
    const positions = [
      { id: 'bottom-right', label: 'Bottom Right' },
      { id: 'bottom-left', label: 'Bottom Left' },
      { id: 'top-left', label: 'Top Left' },
      { id: 'top-right', label: 'Top Right' }
    ];
    const currentIndex = positions.findIndex(p => p.id === watermark.position);
    const nextIndex = (currentIndex + 1) % positions.length;
    updateWatermark('position', positions[nextIndex].id);
  };

  return { handleSetCanvasBgColor, handleToggleCanvasHeader, handleToggleCanvasFooter, handleToggleCanvasBoth, handleToggleCanvasFlip, handleWatermarkImageUpload, handleCycleWatermarkPosition };
}
