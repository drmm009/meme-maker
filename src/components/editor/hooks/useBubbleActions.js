import { getNonOverlappingPosition } from '../../../utils/captionLayout';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';

export function useBubbleActions({ activeCaption, updateActiveCaptionProps }) {
  const captions = useMemeEditorStore((s) => s.captions);
  const stickers = useMemeEditorStore((s) => s.stickers);
  const imageLayers = useMemeEditorStore((s) => s.imageLayers);
  const setShowBubbleLayouts = useEditorUiStore((s) => s.setShowBubbleLayouts);
  const setCaptions = useMemeEditorStore((s) => s.setCaptions);
  const setActiveLayerId = useMemeEditorStore((s) => s.setActiveLayerId);
  const setActiveTab = useEditorUiStore((s) => s.setActiveTab);
  const openSheet = useEditorUiStore((s) => s.openSheet);
  const pushHistory = useMemeEditorStore((s) => s.pushHistory);

    // Chat & Speech Bubble Generator (iPhone, WhatsApp, Comic)
  const handleAddBubble = (data = {}) => {
    const style = typeof data === 'string' ? data : (data.style || 'imessage-send');
    const text = (typeof data === 'object' && data.text) ? data.text : (
      style.startsWith('imessage') || style.startsWith('whatsapp')
        ? 'are you free to hop on a quick 5-min call?'
        : 'Wait a minute...'
    );

    const maxZ = Math.max(-1, ...captions.map(c => c.zIndex ?? -1), ...stickers.map(s => s.zIndex ?? -1), ...(imageLayers || []).map(i => i.zIndex ?? -1));

    let bgColor = '#007aff';
    let textColor = '#ffffff';
    let fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    let stroke = 'transparent';
    let strokeWidth = 0;
    let width = 0.65;

    if (style === 'imessage-send') {
      bgColor = '#007aff';
      textColor = '#ffffff';
    } else if (style === 'imessage-receive') {
      bgColor = '#e9e9eb';
      textColor = '#000000';
    } else if (style === 'whatsapp-send') {
      bgColor = '#005c4b';
      textColor = '#ffffff';
    } else if (style === 'whatsapp-receive') {
      bgColor = '#202c33';
      textColor = '#ffffff';
    } else if (style === 'speech-left' || style === 'speech-right') {
      bgColor = '#ffffff';
      textColor = '#000000';
      fontFamily = 'Montserrat, sans-serif';
      stroke = '#000000';
      strokeWidth = 3;
      width = 0.55;
    } else if (style === 'thought') {
      bgColor = '#ffffff';
      textColor = '#000000';
      fontFamily = 'Montserrat, sans-serif';
      stroke = '#000000';
      strokeWidth = 3;
      width = 0.55;
    } else if (style === 'shout') {
      bgColor = '#ffe600';
      textColor = '#000000';
      fontFamily = 'Impact, sans-serif';
      stroke = '#000000';
      strokeWidth = 3;
      width = 0.60;
    }

    if (activeCaption && activeCaption.bubbleStyle) {
      updateActiveCaptionProps({
        bubbleStyle: style,
        text: text,
        bgColor: bgColor,
        color: textColor,
        stroke: stroke,
        strokeWidth: strokeWidth,
        fontFamily: fontFamily,
        width: width
      });
      setShowBubbleLayouts(true);
      return;
    }

    const pos = getNonOverlappingPosition('phrase', captions, stickers, imageLayers);

    const newCap = {
      id: `bubble-${Date.now()}`,
      text: text,
      bubbleStyle: style,
      bgColor: bgColor,
      color: textColor,
      stroke: stroke,
      strokeWidth: strokeWidth,
      align: 'center',
      x: pos.x,
      y: pos.y,
      fontSize: 26,
      fontFamily: fontFamily,
      width: width,
      zIndex: maxZ + 1
    };

    const nextCaps = [...captions, newCap];
    setCaptions(nextCaps);
    setActiveLayerId(newCap.id);
    setActiveTab('text');
    setShowBubbleLayouts(true);
    openSheet('bubble');
    pushHistory();
  };

  const handleApplyBubbleStyle = (styleId) => {
    if (!activeCaption) {
      handleAddBubble(styleId);
      return;
    }
    let nextBg = activeCaption.bgColor;
    let nextColor = activeCaption.color;
    let nextFont = activeCaption.fontFamily;
    let nextStroke = 'transparent';
    let nextStrokeWidth = 0;
    let nextWidth = activeCaption.width || 0.65;

    if (styleId === 'imessage-send') {
      nextBg = '#007aff';
      nextColor = '#ffffff';
      nextFont = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      nextStroke = 'transparent';
      nextStrokeWidth = 0;
      nextWidth = 0.65;
    } else if (styleId === 'imessage-receive') {
      nextBg = '#e9e9eb';
      nextColor = '#000000';
      nextFont = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      nextStroke = 'transparent';
      nextStrokeWidth = 0;
      nextWidth = 0.65;
    } else if (styleId === 'whatsapp-send') {
      nextBg = '#005c4b';
      nextColor = '#ffffff';
      nextFont = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      nextStroke = 'transparent';
      nextStrokeWidth = 0;
      nextWidth = 0.65;
    } else if (styleId === 'whatsapp-receive') {
      nextBg = '#202c33';
      nextColor = '#ffffff';
      nextFont = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      nextStroke = 'transparent';
      nextStrokeWidth = 0;
      nextWidth = 0.65;
    } else if (styleId === 'speech-left' || styleId === 'speech-right') {
      nextBg = '#ffffff';
      nextColor = '#000000';
      nextFont = 'Montserrat, sans-serif';
      nextStroke = '#000000';
      nextStrokeWidth = 3;
      nextWidth = 0.55;
    } else if (styleId === 'thought') {
      nextBg = '#ffffff';
      nextColor = '#000000';
      nextFont = 'Montserrat, sans-serif';
      nextStroke = '#000000';
      nextStrokeWidth = 3;
      nextWidth = 0.55;
    } else if (styleId === 'shout') {
      nextBg = '#ffe600';
      nextColor = '#000000';
      nextFont = 'Impact, sans-serif';
      nextStroke = '#000000';
      nextStrokeWidth = 3;
      nextWidth = 0.60;
    }

    updateActiveCaptionProps({
      bubbleStyle: styleId,
      bgColor: nextBg,
      color: nextColor,
      fontFamily: nextFont,
      stroke: nextStroke,
      strokeWidth: nextStrokeWidth,
      width: nextWidth
    });
  };

  return { handleAddBubble, handleApplyBubbleStyle };
}
