import { getNonOverlappingPosition } from '../../../utils/captionLayout';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { BUBBLE_PRESETS } from '../panels/bubblePresets';

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

  const getPresetProps = (styleId) => {
    const p = BUBBLE_PRESETS.find((preset) => preset.id === styleId);
    if (!p) {
      return {
        bgColor: '#007aff',
        textColor: '#ffffff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
        stroke: 'transparent',
        strokeWidth: 0,
        width: 0.65,
      };
    }
    const isComicOrAction = p.category === 'Comic' || p.category === 'Action';
    return {
      bgColor: p.bubbleBg,
      textColor: p.textColor,
      fontFamily: p.fontFamily || (isComicOrAction ? 'Montserrat, sans-serif' : '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif'),
      stroke: p.borderWidth ? p.borderColor : 'transparent',
      strokeWidth: p.borderWidth ? p.borderWidth + 1 : 0,
      width: isComicOrAction ? 0.58 : 0.65,
    };
  };

  // Chat & Speech Bubble Generator
  const handleAddBubble = (data = {}) => {
    const style = typeof data === 'string' ? data : (data.style || 'imessage-send');
    const text = (typeof data === 'object' && data.text) ? data.text : (
      style.startsWith('imessage') || style.startsWith('whatsapp')
        ? 'are you free to hop on a quick 5-min call?'
        : (style === 'shout' || style === 'action-red')
          ? 'OMG NOOO!'
          : (style === 'action-neon')
            ? 'SYSTEM OVERRIDE'
            : (style === 'thought')
              ? 'Thinking...'
              : 'Wait a minute...'
    );

    const maxZ = Math.max(-1, ...captions.map(c => c.zIndex ?? -1), ...stickers.map(s => s.zIndex ?? -1), ...(imageLayers || []).map(i => i.zIndex ?? -1));
    const { bgColor, textColor, fontFamily, stroke, strokeWidth, width } = getPresetProps(style);

    if (activeCaption && activeCaption.bubbleStyle) {
      updateActiveCaptionProps({
        bubbleStyle: style,
        text: text,
        bgColor: bgColor,
        color: textColor,
        stroke: stroke,
        strokeWidth: strokeWidth,
        fontFamily: fontFamily,
        width: width,
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
      fontSize: 42,
      fontFamily: fontFamily,
      width: width,
      zIndex: maxZ + 1,
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
    const { bgColor, textColor, fontFamily, stroke, strokeWidth, width } = getPresetProps(styleId);

    updateActiveCaptionProps({
      bubbleStyle: styleId,
      bgColor: bgColor,
      color: textColor,
      fontFamily: fontFamily,
      stroke: stroke,
      strokeWidth: strokeWidth,
      width: activeCaption.width || width,
    });
  };

  return { handleAddBubble, handleApplyBubbleStyle };
}
