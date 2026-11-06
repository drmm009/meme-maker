import { getNonOverlappingPosition } from '../../../utils/captionLayout';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { captionBgPatch } from '../panels/captionBox';

export function useCaptionActions({ activeCaption }) {
  const captions = useMemeEditorStore((s) => s.captions);
  const setCaptions = useMemeEditorStore((s) => s.setCaptions);
  const setActiveLayerId = useMemeEditorStore((s) => s.setActiveLayerId);
  const pushHistory = useMemeEditorStore((s) => s.pushHistory);
  const stickers = useMemeEditorStore((s) => s.stickers);
  const imageLayers = useMemeEditorStore((s) => s.imageLayers);
  const activeLayerId = useMemeEditorStore((s) => s.activeLayerId);
  const setActiveTab = useEditorUiStore((s) => s.setActiveTab);

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
    if (!activeCaption || !['none', 'white', 'black', 'banner'].includes(bg)) return;
    updateActiveCaptionProps(captionBgPatch(activeCaption, bg));
  };

  return { handleAddCaption, handleAddCurvedText, handleAddPresetPhrase, handleToggleTextCase, handleCycleTextAlignment, updateActiveCaptionProps, handleSetCaptionBg };
}
