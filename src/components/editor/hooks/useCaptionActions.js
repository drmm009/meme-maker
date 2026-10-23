import { getNonOverlappingPosition, isColorDark } from '../../../utils/captionLayout';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';

export function useCaptionActions({ activeCaption, handleToggleCanvasHeader }) {
  const canvasHeader = useMemeEditorStore((s) => s.canvasHeader);
  const captions = useMemeEditorStore((s) => s.captions);
  const setCaptions = useMemeEditorStore((s) => s.setCaptions);
  const setActiveLayerId = useMemeEditorStore((s) => s.setActiveLayerId);
  const pushHistory = useMemeEditorStore((s) => s.pushHistory);
  const canvasBgColor = useMemeEditorStore((s) => s.canvasBgColor);
  const stickers = useMemeEditorStore((s) => s.stickers);
  const imageLayers = useMemeEditorStore((s) => s.imageLayers);
  const activeLayerId = useMemeEditorStore((s) => s.activeLayerId);
  const setActiveTab = useEditorUiStore((s) => s.setActiveTab);

  // AI Meme Caption Application
  const handleApplyAiCaption = (captionText, target = 'caption') => {
    if (target === 'header') {
      if (!canvasHeader.enabled) {
        handleToggleCanvasHeader();
      }
      const existing = captions.find(c => c.isHeaderCaption);
      if (existing) {
        const nextCaps = captions.map(c => c.id === existing.id ? { ...c, text: captionText } : c);
        setCaptions(nextCaps);
        setActiveLayerId(existing.id);
        pushHistory();
      } else {
        const newHCap = {
          id: `caption-header-${Date.now()}`,
          text: captionText,
          x: 0.5,
          y: 0.05,
          fontSize: 50,
          fontFamily: 'Montserrat, sans-serif',
          color: isColorDark(canvasBgColor || '#ffffff') ? '#ffffff' : '#000000',
          stroke: 'transparent',
          strokeWidth: 0,
          align: 'center',
          width: 0.92,
          isHeaderCaption: true
        };
        const nextCaps = [newHCap, ...captions];
        setCaptions(nextCaps);
        setActiveLayerId(newHCap.id);
        pushHistory();
      }
    } else {
      // Standard caption
      if (activeCaption) {
        const nextCaps = captions.map(c => c.id === activeCaption.id ? { ...c, text: captionText } : c);
        setCaptions(nextCaps);
        pushHistory();
      } else {
        const pos = getNonOverlappingPosition('caption', captions, stickers, imageLayers);
        const maxZ = Math.max(-1, ...captions.map(c => c.zIndex ?? -1), ...stickers.map(s => s.zIndex ?? -1), ...(imageLayers || []).map(i => i.zIndex ?? -1));
        const newCap = {
          id: `cap-${Date.now()}`,
          text: captionText,
          x: pos.x,
          y: pos.y,
          fontSize: 36,
          fontFamily: 'Montserrat, sans-serif',
          color: '#ffffff',
          stroke: '#000000',
          strokeWidth: 4,
          align: 'center',
          width: 0.85,
          zIndex: maxZ + 1
        };
        const nextCaps = [...captions, newCap];
        setCaptions(nextCaps);
        setActiveLayerId(newCap.id);
        pushHistory();
      }
    }
  };

  // Caption Handlers
  const handleAddCaption = () => {
    const pos = getNonOverlappingPosition('caption', captions, stickers, imageLayers);
    const referenceCap = captions.find(c => c.id === activeLayerId) || (captions.length > 0 ? captions[captions.length - 1] : null);
    const maxZ = Math.max(-1, ...captions.map(c => c.zIndex ?? -1), ...stickers.map(s => s.zIndex ?? -1), ...(imageLayers || []).map(i => i.zIndex ?? -1));
    const newCap = {
      id: `cap-${Date.now()}`,
      text: 'NEW TEXT',
      x: pos.x,
      y: pos.y,
      fontSize: referenceCap ? referenceCap.fontSize : 50,
      color: referenceCap ? referenceCap.color : '#ffffff',
      stroke: referenceCap ? referenceCap.stroke : '#000000',
      align: referenceCap ? referenceCap.align : 'center',
      fontFamily: referenceCap ? referenceCap.fontFamily : 'Impact, sans-serif',
      bgColor: referenceCap ? referenceCap.bgColor : undefined,
      opacity: referenceCap !== null && referenceCap.opacity !== undefined ? referenceCap.opacity : 1,
      rotation: 0,
      zIndex: maxZ + 1
    };
    const nextCaps = [...captions, newCap];
    setCaptions(nextCaps);
    setActiveLayerId(newCap.id);
    pushHistory();
  };

  const handleAddCurvedText = () => {
    if (activeCaption) {
      const current = activeCaption.curve || 0;
      let nextCurve = 40;
      if (current === 0) nextCurve = 40;
      else if (current === 40) nextCurve = 75;
      else if (current === 75) nextCurve = -40;
      else if (current === -40) nextCurve = -75;
      else nextCurve = 0;
      updateActiveCaptionProps({
        curve: nextCurve,
        effect: nextCurve === 0 ? 'flat' : (nextCurve > 0 ? 'arch' : 'smile')
      });
      return;
    }
    const pos = getNonOverlappingPosition('caption', captions, stickers, imageLayers);
    const maxZ = Math.max(-1, ...captions.map(c => c.zIndex ?? -1), ...stickers.map(s => s.zIndex ?? -1), ...(imageLayers || []).map(i => i.zIndex ?? -1));
    const newCap = {
      id: `cap-curved-${Date.now()}`,
      text: 'CURVED TEXT',
      x: pos.x,
      y: pos.y,
      fontSize: 50,
      color: '#ffffff',
      stroke: '#000000',
      align: 'center',
      fontFamily: 'Impact, sans-serif',
      rotation: 0,
      curve: 40,
      effect: 'arch',
      zIndex: maxZ + 1
    };
    const nextCaps = [...captions, newCap];
    setCaptions(nextCaps);
    setActiveLayerId(newCap.id);
    setActiveTab('text');
    pushHistory();
  };

  const handleAddPresetPhrase = (phraseText) => {
    const pos = getNonOverlappingPosition('phrase', captions, stickers, imageLayers);
    const referenceCap = captions.find(c => c.id === activeLayerId) || (captions.length > 0 ? captions[captions.length - 1] : null);
    const maxZ = Math.max(-1, ...captions.map(c => c.zIndex ?? -1), ...stickers.map(s => s.zIndex ?? -1), ...(imageLayers || []).map(i => i.zIndex ?? -1));
    const newCap = {
      id: `cap-${Date.now()}`,
      text: phraseText,
      x: pos.x,
      y: pos.y,
      fontSize: referenceCap ? referenceCap.fontSize : 50,
      color: referenceCap ? referenceCap.color : '#ffffff',
      stroke: referenceCap ? referenceCap.stroke : '#000000',
      align: referenceCap ? referenceCap.align : 'center',
      fontFamily: referenceCap ? referenceCap.fontFamily : 'Impact, sans-serif',
      bgColor: referenceCap ? referenceCap.bgColor : undefined,
      opacity: referenceCap !== null && referenceCap.opacity !== undefined ? referenceCap.opacity : 1,
      rotation: 0,
      width: 0.9,
      zIndex: maxZ + 1
    };
    const nextCaps = [...captions, newCap];
    setCaptions(nextCaps);
    setActiveLayerId(newCap.id);
    pushHistory();
  };

    // Toggle Text Case: ALL CAPS <-> Sentence Case <-> lowercase
  const handleToggleTextCase = () => {
    if (!activeCaption || !activeCaption.text) return;
    const txt = activeCaption.text;
    const isUpper = txt === txt.toUpperCase() && txt !== txt.toLowerCase();
    const isLower = txt === txt.toLowerCase() && txt !== txt.toUpperCase();

    let nextText = txt;
    if (isUpper) {
      nextText = txt.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    } else if (!isLower) {
      nextText = txt.toLowerCase();
    } else {
      nextText = txt.toUpperCase();
    }

    updateActiveCaption('text', nextText);
  };

  // Cycle Text Alignment: center -> left -> right -> center
  const handleCycleTextAlignment = () => {
    if (!activeCaption) return;
    const current = activeCaption.align || 'center';
    const nextAlign = current === 'center' ? 'left' : current === 'left' ? 'right' : 'center';
    updateActiveCaptionProps({ align: nextAlign });
  };

  const updateActiveCaption = (key, value) => {
    if (!activeLayerId) return;
    const nextCaps = captions.map((cap) => {
      if (cap.id === activeLayerId) {
        return { ...cap, [key]: value };
      }
      return cap;
    });
    setCaptions(nextCaps);
    pushHistory();
  };

  const updateActiveCaptionProps = (propsObj) => {
    if (!activeLayerId) return;
    const nextCaps = captions.map((cap) => {
      if (cap.id === activeLayerId) {
        return { ...cap, ...propsObj };
      }
      return cap;
    });
    setCaptions(nextCaps);
    pushHistory();
  };

  const handleSetCaptionBg = (bg) => {
    if (!activeCaption) return;
    if (bg === 'none' || (activeCaption.bgColor === bg && activeCaption.bgStyle !== 'banner')) {
      // Toggle off / reset to transparent background
      const nextColor = (activeCaption.color === '#000000' || activeCaption.color === 'black') ? '#ffffff' : (activeCaption.color || '#ffffff');
      updateActiveCaptionProps({
        bgColor: 'none',
        bgStyle: 'box',
        color: nextColor,
        stroke: '#000000'
      });
    } else if (bg === 'banner') {
      updateActiveCaptionProps({
        bgColor: 'white',
        color: '#000000',
        stroke: 'transparent',
        bgStyle: 'banner',
        align: 'center'
      });
    } else if (bg === 'white') {
      // White Background: crisp black text with transparent stroke
      updateActiveCaptionProps({
        bgColor: 'white',
        color: '#000000',
        stroke: 'transparent',
        bgStyle: 'box'
      });
    } else if (bg === 'black') {
      // Black Background: crisp white text with transparent stroke
      updateActiveCaptionProps({
        bgColor: 'black',
        color: '#ffffff',
        stroke: 'transparent',
        bgStyle: 'box'
      });
    }
  };

  return { handleApplyAiCaption, handleAddCaption, handleAddCurvedText, handleAddPresetPhrase, handleToggleTextCase, handleCycleTextAlignment, updateActiveCaptionProps, handleSetCaptionBg };
}
