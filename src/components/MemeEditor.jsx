import { useState, useRef, useEffect } from 'react';
import CanvasEditor, { TWEET_TREND_PRESETS } from './CanvasEditor';
import { FONTS } from '../data/stickers';
import { Check, RefreshCw } from 'lucide-react';
import { IG_PRESET_IMAGES } from './MemeStylesModal';
import FacePinpointOverlay from './FacePinpointOverlay';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchOpenSourceMemes } from '../services/memeService';
import { blobToDataURL } from '../utils/galleryStore';
import { getNonOverlappingPosition, isColorDark } from '../utils/captionLayout';
import { isSocialCardCaption, isVideoUrl } from './editor/memeEditorUtils';
import { createMemeEditorStore, MemeEditorStoreContext, useMemeEditorStore } from './editor/store/useMemeEditorStore';
import { useEditorShortcuts } from './editor/hooks/useEditorShortcuts';
import { useExport } from './editor/hooks/useExport';
import { useBackgroundRemoval } from './editor/hooks/useBackgroundRemoval';
import { useFaceMorph } from './editor/hooks/useFaceMorph';
import EditorTopBar from './editor/top-bar/EditorTopBar';
import ContextToolbar from './editor/context-toolbars/ContextToolbar';
import SecondaryToolbar from './editor/context-toolbars/SecondaryToolbar';
import EditorModals from './editor/EditorModals';
import EditorSidebar from './editor/EditorSidebar';
import { createEditorUiStore, EditorUiStoreContext, useEditorUiStore } from './editor/store/useEditorUiStore';
import { useDrawingActions } from './editor/hooks/useDrawingActions';
import { useCanvasFrameActions } from './editor/hooks/useCanvasFrameActions';
import './MemeEditor.css';

export default function MemeEditor(props) {
  const [store] = useState(() => createMemeEditorStore(props.template));
  const [uiStore] = useState(() => createEditorUiStore(props.template));
  useEffect(() => () => store.getState().cancelPendingHistory(), [store]);
  return (
    <MemeEditorStoreContext.Provider value={store}>
      <EditorUiStoreContext.Provider value={uiStore}>
        <MemeEditorContent {...props} />
      </EditorUiStoreContext.Provider>
    </MemeEditorStoreContext.Provider>
  );
}

function MemeEditorContent({ template, onBack, onSaveToGallery, _theme, _onToggleTheme }) {
  // Document state lives in the editor store (see editor/store/useMemeEditorStore.js)
  const imageLayers = useMemeEditorStore((s) => s.imageLayers);
  const setImageLayers = useMemeEditorStore((s) => s.setImageLayers);
  const stickers = useMemeEditorStore((s) => s.stickers);
  const setStickers = useMemeEditorStore((s) => s.setStickers);
  const captions = useMemeEditorStore((s) => s.captions);
  const setCaptions = useMemeEditorStore((s) => s.setCaptions);
  const activeLayerId = useMemeEditorStore((s) => s.activeLayerId);
  const setActiveLayerId = useMemeEditorStore((s) => s.setActiveLayerId);
  const slotImages = useMemeEditorStore((s) => s.slotImages);
  const slotTransforms = useMemeEditorStore((s) => s.slotTransforms);
  const setSlotTransforms = useMemeEditorStore((s) => s.setSlotTransforms);
  const activeTemplate = useMemeEditorStore((s) => s.activeTemplate);
  const setActiveTemplate = useMemeEditorStore((s) => s.setActiveTemplate);
  const aspectRatio = useMemeEditorStore((s) => s.aspectRatio);
  const canvasBgColor = useMemeEditorStore((s) => s.canvasBgColor);
  const canvasFlipX = useMemeEditorStore((s) => s.canvasFlipX);
  const canvasHeader = useMemeEditorStore((s) => s.canvasHeader);
  const setCanvasHeader = useMemeEditorStore((s) => s.setCanvasHeader);
  const canvasFooter = useMemeEditorStore((s) => s.canvasFooter);
  const setCanvasFooter = useMemeEditorStore((s) => s.setCanvasFooter);
  const demotivational = useMemeEditorStore((s) => s.demotivational);
  const templateFaceMorph = useMemeEditorStore((s) => s.templateFaceMorph);
  const imageFilters = useMemeEditorStore((s) => s.imageFilters);
  const drawings = useMemeEditorStore((s) => s.drawings);
  const pushHistory = useMemeEditorStore((s) => s.pushHistory);
  const pushHistoryDebounced = useMemeEditorStore((s) => s.pushHistoryDebounced);
  const handleUndo = useMemeEditorStore((s) => s.undo);
  const handleRedo = useMemeEditorStore((s) => s.redo);
  const nudgeLayer = useMemeEditorStore((s) => s.nudgeLayer);
  const imagePickerTarget = useEditorUiStore((s) => s.imagePickerTarget);
  const setImagePickerTarget = useEditorUiStore((s) => s.setImagePickerTarget);
  const openSourceTemplates = useEditorUiStore((s) => s.openSourceTemplates);
  const setOpenSourceTemplates = useEditorUiStore((s) => s.setOpenSourceTemplates);
  const showStylesModal = useEditorUiStore((s) => s.showStylesModal);
  const setShowStylesModal = useEditorUiStore((s) => s.setShowStylesModal);
  const socialModalPlatform = useEditorUiStore((s) => s.socialModalPlatform);
  const setSocialModalPlatform = useEditorUiStore((s) => s.setSocialModalPlatform);
  const activeTab = useEditorUiStore((s) => s.activeTab);
  const setActiveTab = useEditorUiStore((s) => s.setActiveTab);
  const isMobileTabsFolded = useEditorUiStore((s) => s.isMobileTabsFolded);
  const setIsMobileTabsFolded = useEditorUiStore((s) => s.setIsMobileTabsFolded);
  const showFontMenu = useEditorUiStore((s) => s.showFontMenu);
  const setShowFontMenu = useEditorUiStore((s) => s.setShowFontMenu);
  const showTextEffectsMenu = useEditorUiStore((s) => s.showTextEffectsMenu);
  const setShowTextEffectsMenu = useEditorUiStore((s) => s.setShowTextEffectsMenu);
  const showTextBlurMenu = useEditorUiStore((s) => s.showTextBlurMenu);
  const setShowTextBlurMenu = useEditorUiStore((s) => s.setShowTextBlurMenu);
  const showTextBgMenu = useEditorUiStore((s) => s.showTextBgMenu);
  const setShowTextBgMenu = useEditorUiStore((s) => s.setShowTextBgMenu);
  const showFilterPresets = useEditorUiStore((s) => s.showFilterPresets);
  const setShowFilterPresets = useEditorUiStore((s) => s.setShowFilterPresets);
  const showLayerMenu = useEditorUiStore((s) => s.showLayerMenu);
  const setShowLayerMenu = useEditorUiStore((s) => s.setShowLayerMenu);
  const activeSubmenu = useEditorUiStore((s) => s.activeSubmenu);
  const setActiveSubmenu = useEditorUiStore((s) => s.setActiveSubmenu);
  const pasteToast = useEditorUiStore((s) => s.pasteToast);
  const setPasteToast = useEditorUiStore((s) => s.setPasteToast);
  const showMemeStickersModal = useEditorUiStore((s) => s.showMemeStickersModal);
  const setShowMemeStickersModal = useEditorUiStore((s) => s.setShowMemeStickersModal);
  const showEmojiModal = useEditorUiStore((s) => s.showEmojiModal);
  const setShowEmojiModal = useEditorUiStore((s) => s.setShowEmojiModal);
  const showFiltersModal = useEditorUiStore((s) => s.showFiltersModal);
  const setShowFiltersModal = useEditorUiStore((s) => s.setShowFiltersModal);
  const showBubbleBottomSheet = useEditorUiStore((s) => s.showBubbleBottomSheet);
  const setShowBubbleBottomSheet = useEditorUiStore((s) => s.setShowBubbleBottomSheet);
  const drawTool = useEditorUiStore((s) => s.drawTool);
  const setDrawTool = useEditorUiStore((s) => s.setDrawTool);
  const brushColor = useEditorUiStore((s) => s.brushColor);
  const setBrushColor = useEditorUiStore((s) => s.setBrushColor);
  const brushSize = useEditorUiStore((s) => s.brushSize);
  const setBrushSize = useEditorUiStore((s) => s.setBrushSize);
  const showAiModal = useEditorUiStore((s) => s.showAiModal);
  const setShowAiModal = useEditorUiStore((s) => s.setShowAiModal);
  const showBubbleLayouts = useEditorUiStore((s) => s.showBubbleLayouts);
  const setShowBubbleLayouts = useEditorUiStore((s) => s.setShowBubbleLayouts);
  const lastUsedSettingButton = useEditorUiStore((s) => s.lastUsedSettingButton);
  const setLastUsedSettingButton = useEditorUiStore((s) => s.setLastUsedSettingButton);
  const pendingVideoLayer = useEditorUiStore((s) => s.pendingVideoLayer);
  const setPendingVideoLayer = useEditorUiStore((s) => s.setPendingVideoLayer);
  const watermark = useEditorUiStore((s) => s.watermark);
  const handleToggleSubmenu = useEditorUiStore((s) => s.toggleSubmenu);
  const updateWatermark = useEditorUiStore((s) => s.updateWatermark);

  // Native Multi-Panel Layout Support
  const isNativeLayout = template?.isNativeLayout || false;
  const layoutDef = template?.layoutDef || null;

  useEffect(() => {
    setActiveTemplate(template);
    const socialCap = template?.defaultCaptions?.find((c) => isSocialCardCaption(c));
    if (socialCap) {
      setActiveLayerId(socialCap.id);
      if (socialCap.isInstagramCard) setSocialModalPlatform('instagram');
      else if (socialCap.isWhatsAppCard) setSocialModalPlatform('whatsapp');
      else setSocialModalPlatform('tweet');
      setShowStylesModal(true);
    } else {
      setActiveLayerId(null);
    }
    setActiveTab('text');
  }, [template, setActiveTemplate, setActiveLayerId, setActiveTab, setSocialModalPlatform, setShowStylesModal]);


  
  const imageFit = template?.imageFit || 'contain';

  // Open-source templates for Image Layer / Slot overlay picker

  useEffect(() => {
    let isMounted = true;
    fetchOpenSourceMemes().then((data) => {
      if (isMounted && Array.isArray(data) && data.length > 0) {
        setOpenSourceTemplates(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [setOpenSourceTemplates]);

  const activeImageLayer = imageLayers.find((i) => i.id === activeLayerId);


    const handleOpenSocialModalForActiveCard = (targetPlatform) => {
    let platform = targetPlatform;
    const currentActiveCap = captions.find((c) => c.id === activeLayerId);
    const targetCap = (currentActiveCap && isSocialCardCaption(currentActiveCap))
      ? currentActiveCap
      : captions.find(c => {
          if (targetPlatform === 'whatsapp') return c.isWhatsAppCard;
          if (targetPlatform === 'instagram') return c.isInstagramCard;
          return c.isTweetCard;
        }) || captions.find(c => isSocialCardCaption(c));

    if (targetCap) {
      setActiveLayerId(targetCap.id);
      if (!platform) {
        if (targetCap.isInstagramCard) platform = 'instagram';
        else if (targetCap.isWhatsAppCard) platform = 'whatsapp';
        else platform = 'tweet';
      }
    }
    const finalPlatform = platform || 'tweet';
    if (showStylesModal && socialModalPlatform === finalPlatform) {
      setShowStylesModal(false);
    } else {
      setSocialModalPlatform(finalPlatform);
      setShowStylesModal(true);
    }
  };

  const handleUpdateSocialCard = (data = {}) => {
    const currentActiveCap = captions.find((c) => c.id === activeLayerId);
    const targetCap = (currentActiveCap && isSocialCardCaption(currentActiveCap))
      ? currentActiveCap
      : captions.find(c => {
          if (socialModalPlatform === 'whatsapp') return c.isWhatsAppCard;
          if (socialModalPlatform === 'instagram') return c.isInstagramCard;
          return c.isTweetCard;
        }) || captions.find(c => isSocialCardCaption(c));

    if (!targetCap) return;
    const targetId = targetCap.id;

    let updates = {};
    if (targetCap.isTweetCard) {
      updates = {
        text: data.text !== undefined ? data.text : targetCap.text,
        tweetName: data.name !== undefined ? data.name : targetCap.tweetName,
        tweetHandle: data.handle !== undefined ? data.handle : targetCap.tweetHandle,
        tweetVerified: data.verified !== undefined ? data.verified : targetCap.tweetVerified,
        tweetTheme: data.theme || targetCap.tweetTheme,
        tweetAvatarBg: data.avatarBg || targetCap.tweetAvatarBg,
        tweetTime: data.time || targetCap.tweetTime,
        tweetMetrics: data.metrics || targetCap.tweetMetrics
      };
    } else if (targetCap.isInstagramCard) {
      updates = {
        text: data.text !== undefined ? data.text : targetCap.text,
        igUsername: data.username !== undefined ? data.username : targetCap.igUsername,
        igSubtitle: data.subtitle !== undefined ? data.subtitle : targetCap.igSubtitle,
        igVerified: data.verified !== undefined ? data.verified : targetCap.igVerified,
        igHasStoryRing: data.hasStoryRing !== undefined ? data.hasStoryRing : targetCap.igHasStoryRing,
        igLikesCount: data.likesCount !== undefined ? data.likesCount : targetCap.igLikesCount,
        igLikesText: data.likesText !== undefined ? data.likesText : targetCap.igLikesText,
        igCommentsCount: data.commentsCount !== undefined ? data.commentsCount : targetCap.igCommentsCount,
        igRepostsCount: data.repostsCount !== undefined ? data.repostsCount : targetCap.igRepostsCount,
        igSharesCount: data.sharesCount !== undefined ? data.sharesCount : targetCap.igSharesCount,
        igFollowText: data.followText !== undefined ? data.followText : targetCap.igFollowText,
        topCommentUser: data.topCommentUser !== undefined ? data.topCommentUser : targetCap.topCommentUser,
        topCommentText: data.topCommentText !== undefined ? data.topCommentText : targetCap.topCommentText,
        igPostImage: data.postImage !== undefined ? data.postImage : targetCap.igPostImage,
        igTheme: data.theme || targetCap.igTheme,
        igTime: data.time || targetCap.igTime,
        color: (data.theme || targetCap.igTheme) === 'light' ? '#262626' : '#f5f5f5'
      };
    } else if (targetCap.isWhatsAppCard) {
      updates = {
        text: data.messages?.[0]?.text || data.text || targetCap.text,
        waContactName: data.contactName || data.name || targetCap.waContactName,
        waStatus: data.status !== undefined ? data.status : targetCap.waStatus,
        waMessages: data.messages && Array.isArray(data.messages) ? data.messages : targetCap.waMessages,
        waTheme: data.theme || targetCap.waTheme,
        waShowHeader: data.showHeader !== undefined ? data.showHeader : targetCap.waShowHeader,
        waShowFooter: data.showFooter !== undefined ? data.showFooter : targetCap.waShowFooter,
        waShowDoodles: data.showDoodles !== undefined ? data.showDoodles : targetCap.waShowDoodles,
        waDatePill: data.datePill !== undefined ? data.datePill : targetCap.waDatePill,
        waAvatarBg: data.avatarBg || targetCap.waAvatarBg
      };
    }

    const nextCaps = captions.map((cap) => {
      if (cap.id === targetId) {
        return { ...cap, ...updates };
      }
      return cap;
    });
    setCaptions(nextCaps);
    pushHistory();
    setActiveLayerId(targetId);
    setShowStylesModal(false);
  };

  const { handleSetCanvasBgColor, handleToggleCanvasHeader, handleToggleCanvasFooter, handleToggleCanvasBoth, handleToggleCanvasFlip, handleWatermarkImageUpload, handleCycleWatermarkPosition } = useCanvasFrameActions();
  const showTextCurveMenu = showTextEffectsMenu;
  const setShowTextCurveMenu = setShowTextEffectsMenu;

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setActiveLayerId(null);
    setShowFontMenu(false);
    setShowTextEffectsMenu(false);
    setShowTextBlurMenu(false);
    setShowTextBgMenu(false);
    setShowFilterPresets(false);
    if (tabId === 'draw') {
      setActiveSubmenu('drawSettings');
    } else {
      setActiveSubmenu(null);
    }
    if (window.innerWidth <= 768) {
      setIsMobileTabsFolded(true);
    } else {
      setIsMobileTabsFolded(false);
    }
  };

  // Freehand Drawing state
  const contextToolbarRef = useRef(null);
  const isVideoPlaying = true;




  const canvasRef = useRef(null);
  const { exportDropdownOpen, setExportDropdownOpen, exportDropdownRef, handleQuickExport } = useExport({ canvasRef, template });
  const { isRemovingBg, handleRemoveBackground } = useBackgroundRemoval();
  const {
    showFaceMorphModal, setShowFaceMorphModal, morphTargetLayerId, setMorphTargetLayerId,
    morphTargetUrl, setMorphTargetUrl, isPinpointingFace, setIsPinpointingFace, faceTarget, setFaceTarget,
    sampledFaceLighting, extractedMemeFace, isHoldingCanvasCompare, setIsHoldingCanvasCompare,
    originalTemplateImgRef, handleStartMorphFace, handleConfirmPinpoint, handleApplyFaceMorph,
    handleUpdateTemplateMorphProgress, handleChangeFace, handleRevertTemplateFace, handleFinalizeTemplateFace,
  } = useFaceMorph({ canvasRef });
  const watermarkInputRef = useRef(null);
  const watermarkTextInputRef = useRef(null);
  const tabButtonsRef = useRef(null);

  // Auto-scroll active tab into view horizontally
  useEffect(() => {
    if (tabButtonsRef.current) {
      const activeBtn = tabButtonsRef.current.querySelector('.tab-btn.active');
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeTab]);

  // Ensure Text tab is active by default when user reaches editor and no layer is auto-selected
  useEffect(() => {
    setActiveLayerId(null);
    setActiveTab('text');
  }, [setActiveLayerId, setActiveTab]);

  // Reset tweet toolbar submenus on active layer change
  useEffect(() => {
    setLastUsedSettingButton(null);
  }, [activeLayerId, setLastUsedSettingButton]);

  // When bubble layout opens, scroll to the beginning (left)
  useEffect(() => {
    if (showBubbleLayouts && contextToolbarRef.current) {
      contextToolbarRef.current.scrollLeft = 0;
    }
  }, [showBubbleLayouts]);

  // Scroll to last used setting button when returning to text toolbar and keep hover effect
  useEffect(() => {
    if (lastUsedSettingButton && !showFontMenu && !showTextCurveMenu && !showTextBlurMenu && !showTextBgMenu && !showBubbleLayouts) {
      const timer = setTimeout(() => {
        const btn = contextToolbarRef.current?.querySelector(`[data-setting-btn="${lastUsedSettingButton}"]`);
        if (btn) {
          btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [lastUsedSettingButton, showFontMenu, showTextCurveMenu, showTextBlurMenu, showTextBgMenu, showBubbleLayouts]);

  const { handleAddDrawing, handleClearDrawings, handleUndoDrawing } = useDrawingActions();
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
    setShowBubbleBottomSheet(true);
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

  // Meme Culture Staples & Social Formats Handlers
      const handleAddTweetCard = (data = {}) => {
    const name = data.name || 'Elon Musk';
    const handle = data.handle || '@elonmusk';
    const text = data.text || 'thinking about deleting the database and moving to the woods';
    const verified = data.verified !== false;
    const theme = data.theme || 'dark';
    const maxZ = Math.max(-1, ...captions.map(c => c.zIndex ?? -1), ...stickers.map(s => s.zIndex ?? -1), ...(imageLayers || []).map(i => i.zIndex ?? -1));

    const newCap = {
      id: `cap-tweet-${Date.now()}`,
      text: text,
      tweetName: name,
      tweetHandle: handle,
      tweetVerified: verified,
      tweetTheme: theme,
      tweetTime: data.time || '10:42 PM · Oct 8, 2026',
      tweetMetrics: data.metrics || (TWEET_TREND_PRESETS?.viral?.text || '💬 14.2K    🔁 62.8K    ❤️ 420.5K    📊 18.2M'),
      tweetMetricsId: 'viral',
      tweetTrendRank: 'viral',
      tweetTopic: TWEET_TREND_PRESETS?.viral?.topic || 'Trending in World',
      isTweetCard: true,
      x: 0.5,
      y: 0.5,
      width: 0.88,
      fontSize: 18,
      color: theme === 'light' ? '#0f1419' : '#ffffff',
      stroke: 'transparent',
      strokeWidth: 0,
      zIndex: maxZ + 1
    };

    const nextCaps = [...captions, newCap];
    setCaptions(nextCaps);
    setActiveLayerId(newCap.id);
    setActiveSubmenu(null);
    setActiveTab('text');
    pushHistory();
  };

  const handleAddInstagramCard = (data = {}) => {
    const username = data.username || 'inc42.media';
    const subtitle = data.subtitle || 'Suggested for you';
    const text = data.text || 'Remember Tanmay Bhat from the AIB... more';
    const verified = data.verified !== false;
    const hasStoryRing = data.hasStoryRing !== false;
    const likesText = data.likesText || '';
    const likesCount = data.likesCount || '1,583';
    const commentsCount = data.commentsCount || '15';
    const repostsCount = data.repostsCount || '15';
    const sharesCount = data.sharesCount || '295';
    const followText = data.followText || 'Follow';
    const postImage = data.postImage || IG_PRESET_IMAGES?.inc42 || null;
    const time = data.time || '28 September';
    const theme = data.theme || 'light';
    const topCommentUser = data.topCommentUser || '';
    const topCommentText = data.topCommentText || '';
    const showTranslation = data.showTranslation === true;
    const maxZ = Math.max(-1, ...captions.map(c => c.zIndex ?? -1), ...stickers.map(s => s.zIndex ?? -1), ...(imageLayers || []).map(i => i.zIndex ?? -1));

    const newCap = {
      id: `cap-ig-${Date.now()}`,
      text: text,
      igUsername: username,
      igSubtitle: subtitle,
      igVerified: verified,
      igHasStoryRing: hasStoryRing,
      igLikesText: likesText,
      igLikesCount: likesCount,
      igCommentsCount: commentsCount,
      igRepostsCount: repostsCount,
      igSharesCount: sharesCount,
      igFollowText: followText,
      igTopCommentUser: topCommentUser,
      igTopCommentText: topCommentText,
      igShowTranslation: showTranslation,
      igPostImage: postImage,
      igTime: time,
      igTheme: theme,
      isInstagramCard: true,
      x: 0.5,
      y: 0.5,
      width: 0.70,
      fontSize: 15,
      color: theme === 'light' ? '#000000' : '#f5f5f5',
      stroke: 'transparent',
      strokeWidth: 0,
      zIndex: maxZ + 1
    };

    const nextCaps = [...captions, newCap];
    setCaptions(nextCaps);
    setActiveLayerId(newCap.id);
    setActiveSubmenu(null);
    setActiveTab('text');
    pushHistory();
  };

  const handleAddWhatsAppCard = (data = {}) => {
    const contactName = data.contactName || 'Mom ❤️';
    const status = data.status || 'online';
    const text = data.text || 'Please remember to eat vegetables and don’t stay up until 4 AM arguing with strangers on the internet.';
    const direction = data.direction || 'received';
    const ticks = data.ticks || 'blue';
    const time = data.time || '11:42 PM';
    const messages = (data.messages && Array.isArray(data.messages) && data.messages.length > 0)
      ? data.messages
      : [
          { id: 'm1', text: text, direction: direction, time: time, ticks: ticks },
          { id: 'm2', text: 'I am eating healthy right now mom! 👍', direction: 'sent', time: '11:43 PM', ticks: 'blue' },
          { id: 'm3', text: 'Pizza is not a vegetable. I can see your location at Domino’s.', direction: 'received', time: '11:44 PM', ticks: 'blue' }
        ];
    const theme = data.theme || 'dark';
    const showHeader = data.showHeader !== false;
    const showFooter = data.showFooter !== false;
    const showDoodles = data.showDoodles !== false;
    const datePill = data.datePill || 'Yesterday';
    const avatarBg = data.avatarBg || '#202c33';
    const maxZ = Math.max(-1, ...captions.map(c => c.zIndex ?? -1), ...stickers.map(s => s.zIndex ?? -1), ...(imageLayers || []).map(i => i.zIndex ?? -1));

    const newCap = {
      id: `cap-wa-${Date.now()}`,
      text: messages[0]?.text || text,
      waContactName: contactName,
      waStatus: status,
      waDirection: messages[0]?.direction || direction,
      waTicks: ticks,
      waTime: time,
      waTheme: theme,
      waShowHeader: showHeader,
      waShowFooter: showFooter,
      waShowDoodles: showDoodles,
      waDatePill: datePill,
      waAvatarBg: avatarBg,
      waMessages: messages,
      isWhatsAppCard: true,
      x: 0.5,
      y: 0.5,
      width: 0.88,
      fontSize: 14.5,
      color: '#ffffff',
      stroke: 'transparent',
      strokeWidth: 0,
      zIndex: maxZ + 1
    };

    const nextCaps = [...captions, newCap];
    setCaptions(nextCaps);
    setActiveLayerId(newCap.id);
    setActiveSubmenu(null);
    setActiveTab('text');
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

  // Horizontal Flip / Mirror for Stickers & Media Overlays
  const handleFlipActiveLayer = () => {
    if (!activeLayerId) return;
    const isStk = stickers.some(s => s.id === activeLayerId);
    const isImg = (imageLayers || []).some(i => i.id === activeLayerId);

    if (isStk) {
      const nextStks = stickers.map(s => s.id === activeLayerId ? { ...s, flipX: !s.flipX } : s);
      setStickers(nextStks);
      pushHistory();
    } else if (isImg) {
      const nextImgs = (imageLayers || []).map(i => i.id === activeLayerId ? { ...i, flipX: !i.flipX } : i);
      setImageLayers(nextImgs);
      pushHistory();
    }
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

  const getActiveTextEffectId = (cap) => {
    if (!cap) return 'flat';
    if (cap.effect) return cap.effect;
    if (cap.curve > 0) return 'arch';
    if (cap.curve < 0) return 'smile';
    return 'flat';
  };

  const handleApplyTextEffect = (effectId) => {
    if (!activeCaption) return;
    const current = getActiveTextEffectId(activeCaption);

    // Clicking active effect toggles back to flat
    if (current === effectId && effectId !== 'flat') {
      updateActiveCaptionProps({ curve: 0, effect: 'flat' });
      return;
    }

    if (effectId === 'flat') {
      updateActiveCaptionProps({ curve: 0, effect: 'flat' });
    } else if (effectId === 'arch') {
      updateActiveCaptionProps({ curve: 40, effect: 'arch' });
    } else if (effectId === 'smile') {
      updateActiveCaptionProps({ curve: -40, effect: 'smile' });
    } else {
      updateActiveCaptionProps({ curve: 0, effect: effectId });
    }
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

    const commitAddImageLayer = (src, trimStart, trimEnd) => {
    const pos = getNonOverlappingPosition('image', captions, stickers, imageLayers);
    const maxZ = Math.max(-1, ...captions.map(c => c.zIndex ?? -1), ...stickers.map(s => s.zIndex ?? -1), ...(imageLayers || []).map(i => i.zIndex ?? -1));
    const newImgLayer = {
      id: `img-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      url: src,
      x: pos.x,
      y: pos.y,
      scale: 1.5,
      rotation: 0,
      fitMode: 'stretch',
      zIndex: maxZ + 1,
      ...(trimStart !== undefined ? { trimStart } : {}),
      ...(trimEnd !== undefined ? { trimEnd } : {})
    };
    const nextImgLayers = [...imageLayers, newImgLayer];
    setImageLayers(nextImgLayers);
    setActiveLayerId(newImgLayer.id);
    setActiveTab('images');
    pushHistory();
  };

  const handleAddImageLayer = (src) => {
    if (isVideoUrl(src)) {
      setPendingVideoLayer(src);
    } else {
      commitAddImageLayer(src);
    }
  };

  const handleFileUploadImageLayer = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await blobToDataURL(file);
      handleAddImageLayer(url);
    } catch (err) {
      console.error('Failed to read image file:', err);
    } finally {
      e.target.value = '';
    }
  };

  const updateActiveImageLayer = (key, value) => {
    if (!activeLayerId) return;
    const nextImgLayers = imageLayers.map((layer) => {
      if (layer.id === activeLayerId) {
        if (typeof key === 'object') {
          return { ...layer, ...key };
        }
        return { ...layer, [key]: value };
      }
      return layer;
    });
    setImageLayers(nextImgLayers);
    pushHistory();
  };

  // Get all layers sorted in ascending visual stack order (0 = back, length-1 = front)
  const getOrderedLayers = (caps = captions, stks = stickers, imgs = imageLayers) => {
    const list = [
      ...(imgs || []).map(l => ({ ...l, _type: 'imageLayer', zIndex: l.zIndex ?? 0 })),
      ...(stks || []).map(s => ({ ...s, _type: 'sticker', zIndex: s.zIndex ?? 0 })),
      ...(caps || []).map(c => ({ ...c, _type: 'caption', zIndex: c.zIndex ?? 0 }))
    ];
    list.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
    return list;
  };

  // Re-indexes list and applies state + history
  const commitLayerStack = (orderedList) => {
    orderedList.forEach((item, index) => {
      item.zIndex = index;
    });

    const nextCaps = orderedList.filter(i => i._type === 'caption').map(({ _type, ...rest }) => rest);
    const nextStks = orderedList.filter(i => i._type === 'sticker').map(({ _type, ...rest }) => rest);
    const nextImgs = orderedList.filter(i => i._type === 'imageLayer').map(({ _type, ...rest }) => rest);

    setCaptions(nextCaps);
    setStickers(nextStks);
    setImageLayers(nextImgs);
    pushHistory();
  };

  const moveLayer = (id, action) => {
    if (!id) return;
    const list = getOrderedLayers();
    const idx = list.findIndex(i => i.id === id);
    if (idx === -1) return;

    if (action === 'forward') {
      if (idx >= list.length - 1) return;
      const temp = list[idx];
      list[idx] = list[idx + 1];
      list[idx + 1] = temp;
    } else if (action === 'backward') {
      if (idx <= 0) return;
      const temp = list[idx];
      list[idx] = list[idx - 1];
      list[idx - 1] = temp;
    } else if (action === 'front') {
      if (idx >= list.length - 1) return;
      const [item] = list.splice(idx, 1);
      list.push(item);
    } else if (action === 'back') {
      if (idx <= 0) return;
      const [item] = list.splice(idx, 1);
      list.unshift(item);
    }

    commitLayerStack(list);
  };

        const handleDeleteLayer = (targetId) => {
    const idToDelete = (typeof targetId === 'string' && targetId) ? targetId : activeLayerId;
    if (!idToDelete) return;
    const capToDelete = captions.find(c => c.id === idToDelete);
    const isHeader = capToDelete?.isHeaderCaption || idToDelete === 'header' || (activeCaption?.isHeaderCaption && idToDelete === activeCaption?.id);
    const isFooter = capToDelete?.isFooterCaption || idToDelete === 'footer' || (activeCaption?.isFooterCaption && idToDelete === activeCaption?.id);

    let nextHeader = canvasHeader;
    if (isHeader) {
      nextHeader = { ...canvasHeader, enabled: false };
      setCanvasHeader(nextHeader);
    }
    let nextFooter = canvasFooter;
    if (isFooter) {
      nextFooter = { ...canvasFooter, enabled: false };
      setCanvasFooter(nextFooter);
    }
    if (activeLayerId === idToDelete || (isHeader && activeCaption?.isHeaderCaption) || (isFooter && activeCaption?.isFooterCaption)) {
      const prevSticker = stickers.find((s) => s.id === idToDelete);
      const prevCaption = captions.find((c) => c.id === idToDelete);
      const prevImg = imageLayers.find((img) => img.id === idToDelete);
      if (prevSticker || (prevCaption && isSocialCardCaption(prevCaption)) || prevImg) {
        setActiveTab('images');
      }
      setActiveLayerId(null);
    }
    const list = getOrderedLayers().filter(i => {
      if (i.id === idToDelete) return false;
      if (isHeader && (i.isHeaderCaption || i.id === capToDelete?.id)) return false;
      if (isFooter && (i.isFooterCaption || i.id === capToDelete?.id)) return false;
      return true;
    });
    commitLayerStack(list);
  };

  const handleDuplicateLayer = (targetId) => {
    const idToDup = (typeof targetId === 'string' && targetId) ? targetId : activeLayerId;
    if (!idToDup) return;
    const list = getOrderedLayers();
    const idx = list.findIndex(i => i.id === idToDup);
    if (idx === -1) return;

    const source = list[idx];
    const newId = `${source._type === 'caption' ? 'cap' : source._type === 'sticker' ? 'stk' : 'img'}-${Date.now()}`;
    const clone = {
      ...source,
      id: newId,
      x: Math.min(0.9, (source.x || 0.5) + 0.04),
      y: Math.min(0.9, (source.y || 0.5) + 0.04)
    };

    list.splice(idx + 1, 0, clone);
    commitLayerStack(list);
    setActiveLayerId(newId);
  };

  



  const handleRotateLayer = () => {
    if (activeCaption) {
      const nextRot = ((activeCaption.rotation || 0) + 90) % 360;
      updateActiveCaptionProps({ rotation: nextRot });
    } else if (activeSticker) {
      handleRotateSticker();
    } else if (activeImageLayer) {
      handleRotateImageLayer();
    }
  };

  const handleRotateImageLayer = () => {
    if (!activeImageLayer) return;
    const nextRot = ((activeImageLayer.rotation || 0) + 90) % 360;
    const nextImg = imageLayers.map(l => l.id === activeImageLayer.id ? { ...l, rotation: nextRot } : l);
    setImageLayers(nextImg);
    pushHistoryDebounced();
  };

  const handleRotateSticker = () => {
    if (!activeSticker) return;
    const nextRot = ((activeSticker.rotation || 0) + 90) % 360;
    const nextStickers = stickers.map(s => s.id === activeSticker.id ? { ...s, rotation: nextRot } : s);
    setStickers(nextStickers);
    pushHistoryDebounced();
  };

  const handleToggleDieCutSticker = (color = '#ffffff') => {
    if (activeSticker) {
      const nextDieCut = !activeSticker.dieCut;
      const nextStickers = stickers.map(s => s.id === activeSticker.id ? {
        ...s,
        dieCut: nextDieCut,
        dieCutColor: s.dieCutColor || color,
        dieCutWidth: s.dieCutWidth || 6
      } : s);
      setStickers(nextStickers);
      pushHistory();
    } else if (activeImageLayer) {
      const nextDieCut = !activeImageLayer.dieCut;
      const nextImg = imageLayers.map(l => l.id === activeImageLayer.id ? {
        ...l,
        dieCut: nextDieCut,
        dieCutColor: l.dieCutColor || color,
        dieCutWidth: l.dieCutWidth || 6
      } : l);
      setImageLayers(nextImg);
      pushHistory();
    }
  };

  const handleSetDieCutColor = (color) => {
    if (activeSticker) {
      const nextStickers = stickers.map(s => s.id === activeSticker.id ? {
        ...s,
        dieCut: true,
        dieCutColor: color
      } : s);
      setStickers(nextStickers);
      pushHistoryDebounced();
    } else if (activeImageLayer) {
      const nextImg = imageLayers.map(l => l.id === activeImageLayer.id ? {
        ...l,
        dieCut: true,
        dieCutColor: color
      } : l);
      setImageLayers(nextImg);
      pushHistoryDebounced();
    }
  };

    const updateSlotTransform = (slotIndex, updateFn) => {
    const nextTransforms = [...slotTransforms];
    const prev = nextTransforms[slotIndex] || { offsetX: 0, offsetY: 0, scale: 1.5 };
    nextTransforms[slotIndex] = updateFn(prev);
    setSlotTransforms(nextTransforms);
  };

    // Emoji & Sticker Handlers
  const handleAddSticker = (stickerObj) => {
    const pos = getNonOverlappingPosition('sticker', captions, stickers, imageLayers);
    const maxZ = Math.max(-1, ...captions.map(c => c.zIndex ?? -1), ...stickers.map(s => s.zIndex ?? -1), ...(imageLayers || []).map(i => i.zIndex ?? -1));
    const newSticker = {
      id: `stk-${Date.now()}`,
      emoji: stickerObj.emoji,
      x: pos.x,
      y: pos.y,
      scale: 2.5,
      rotation: 0,
      zIndex: maxZ + 1
    };
    const nextStickers = [...stickers, newSticker];
    setStickers(nextStickers);
    setActiveLayerId(newSticker.id);
    setActiveTab('images');
    setShowEmojiModal(false);
    pushHistory();
  };

  const handleAddGraphicSticker = (stickerObj) => {
    const pos = getNonOverlappingPosition('sticker', captions, stickers, imageLayers);
    const maxZ = Math.max(-1, ...captions.map(c => c.zIndex ?? -1), ...stickers.map(s => s.zIndex ?? -1), ...(imageLayers || []).map(i => i.zIndex ?? -1));
    const newSticker = {
      id: `stk-graphic-${Date.now()}`,
      name: stickerObj.name,
      url: stickerObj.url,
      x: pos.x,
      y: pos.y,
      scale: 2.2,
      rotation: 0,
      zIndex: maxZ + 1
    };
    const nextStickers = [...stickers, newSticker];
    setStickers(nextStickers);
    setActiveLayerId(newSticker.id);
    setActiveTab('images');
    setShowMemeStickersModal(false);
    pushHistory();
  };

  const activeCaption = captions.find((c) => c.id === activeLayerId);
  const currentEditingSocialCard = (activeCaption && isSocialCardCaption(activeCaption))
    ? activeCaption
    : captions.find(c => {
        if (socialModalPlatform === 'whatsapp') return c.isWhatsAppCard;
        if (socialModalPlatform === 'instagram') return c.isInstagramCard;
        return c.isTweetCard;
      }) || captions.find(c => isSocialCardCaption(c));

  useEffect(() => {
    if (showFontMenu && activeCaption?.fontFamily) {
      setTimeout(() => {
        const id = 'font-item-' + activeCaption.fontFamily.replace(/\\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }, 50);
    }
  }, [showFontMenu, activeCaption?.fontFamily]);
  const activeSticker = stickers.find((s) => s.id === activeLayerId);
  const isElementSelected = Boolean(activeLayerId || activeCaption || activeSticker || activeImageLayer);

  useEffect(() => {
    const isFiltersOpen = !activeCaption && !activeSticker && activeTab === 'filters';
    if (isFiltersOpen) {
      const timer = setTimeout(() => {
        const activeFilterId = activeImageLayer ? (activeImageLayer.filterId || 'original') : (imageFilters.preset || 'original');
        const el = document.getElementById('filter-item-' + activeFilterId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activeTab, activeCaption, activeSticker, activeImageLayer, imageFilters.preset]);

  const activeFontObj = FONTS.find((f) => f.family === (activeCaption?.fontFamily || 'Impact, sans-serif'))
    || FONTS.find((f) => activeCaption?.fontFamily?.toLowerCase().includes('comic') && f.id.toLowerCase().includes('comic'))
    || FONTS.find((f) => (activeCaption?.fontFamily?.toLowerCase().includes('apple') || activeCaption?.fontFamily?.toLowerCase().includes('system')) && f.id.toLowerCase().includes('apple'))
    || FONTS.find((f) => activeCaption?.fontFamily?.toLowerCase().includes(f.id.toLowerCase()))
    || FONTS[0];

  const handleCycleFont = () => {
    if (!activeCaption) return;
    const currentFamily = activeCaption.fontFamily || 'Impact, sans-serif';
    let currentIndex = FONTS.findIndex((f) => f.family === currentFamily);
    if (currentIndex === -1) {
      currentIndex = FONTS.findIndex((f) => f.id === activeFontObj.id);
    }
    const nextIndex = ((currentIndex >= 0 ? currentIndex : 0) + 1) % FONTS.length;
    updateActiveCaption('fontFamily', FONTS[nextIndex].family);
  };

  useEditorShortcuts({
    activeLayerId,
    onUndo: handleUndo,
    onRedo: handleRedo,
    onDelete: () => handleDeleteLayer(),
    onDuplicate: () => handleDuplicateLayer(),
    onNudge: (dx, dy) => nudgeLayer(activeLayerId, dx, dy),
    onMoveLayer: (action) => moveLayer(activeLayerId, action),
    onDeselect: () => setActiveLayerId(null),
    onPasteImage: (file) => {
      blobToDataURL(file).then((url) => {
        commitAddImageLayer(url);
        setPasteToast(true);
        setTimeout(() => setPasteToast(false), 2600);
      }).catch((err) => {
        console.error('Failed to convert pasted image to data URL:', err);
      });
    },
  });

  const getDockHeight = () => {
    if (aspectRatio === '16:9') return '45vh';
    if (aspectRatio === '1:1') return '40vh';
    if (aspectRatio === '4:5') return '35vh';
    if (aspectRatio === '9:16') return '32vh';
    return '38vh';
  };

  return (
    <div className="meme-editor-container animate-fade-in">
      {/* Editor Top Bar (Mobile-Friendly Compact) */}
      <EditorTopBar
        exportDropdownOpen={exportDropdownOpen}
        exportDropdownRef={exportDropdownRef}
        handleQuickExport={handleQuickExport}
        imageFit={imageFit}
        isNativeLayout={isNativeLayout}
        layoutDef={layoutDef}
        onBack={onBack}
        onSaveToGallery={onSaveToGallery}
        setExportDropdownOpen={setExportDropdownOpen}
        template={template}
      />
      
      <div className="editor-main">


        {/* Editor Workspace Main Area */}
        <div className="editor-workspace">
          {/* Canvas Render Area */}
          <div
            className="canvas-wrapper"
            onPointerDown={(e) => {
              if (e.target === e.currentTarget && activeLayerId) {
                const prevSticker = stickers.find((s) => s.id === activeLayerId);
                const prevCaption = captions.find((c) => c.id === activeLayerId);
                const prevImg = imageLayers.find((img) => img.id === activeLayerId);
                if (prevSticker || (prevCaption && isSocialCardCaption(prevCaption)) || prevImg) {
                  setActiveTab('images');
                }
                setActiveLayerId(null);
              }
            }}
          >
            {/* Canvas Viewport Area */}
            <div className="canvas-viewport">
                {/* Clipboard Paste Toast */}
                <AnimatePresence>
                  {pasteToast && (
                    <motion.div
                      initial={{ opacity: 0, y: -16, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -16, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        position: 'absolute',
                        top: '14px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 9999,
                        background: 'rgba(16, 185, 129, 0.95)',
                        color: '#ffffff',
                        padding: '8px 18px',
                        borderRadius: '24px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        pointerEvents: 'none'
                      }}
                    >
                      <Check size={16} /> Image pasted from clipboard!
                    </motion.div>
                  )}
                </AnimatePresence>

                <CanvasEditor
                  ref={canvasRef}
                  template={activeTemplate}
                  imageUrl={isHoldingCanvasCompare ? (templateFaceMorph?.cleanOriginalUrl || activeTemplate?.originalUrl) : (activeTemplate?.rawImageUrl || activeTemplate?.imageUrl)}
                  captions={captions}
                  stickers={stickers}
                  imageLayers={imageLayers}
                  aspectRatio={aspectRatio}
                  imageFit={imageFit}
                  filters={imageFilters}
                  isNativeLayout={isNativeLayout}
                  layoutDef={layoutDef}
                  slotImages={slotImages}
                  slotTransforms={slotTransforms}
                  onUpdateSlotTransform={updateSlotTransform}
                  activeLayerId={activeLayerId}
                  onDeleteLayer={handleDeleteLayer}
                  onSelectLayer={(id) => {
                    setShowFontMenu(false);
                    setShowTextCurveMenu(false);
                    setShowTextBlurMenu(false);
                    setShowTextBgMenu(false);
                    setShowBubbleLayouts(false);
                    if (!id) {
                      setActiveLayerId(null);
                      setActiveSubmenu(null);
                      setShowBubbleBottomSheet(false);
                      return;
                    }
                    if (window.innerWidth <= 768) {
                      setIsMobileTabsFolded(true);
                    }
                    if (captions.some(c => c.id === id)) {
                      setActiveTab('text');
                    }
                    setActiveLayerId(id);
                    setActiveSubmenu(null);
                    setShowBubbleBottomSheet(false);
                  }}
                  onUpdateCaptionBounds={(id, newProps) => {
                    const nextCaps = captions.map((c) => (c.id === id ? { ...c, ...newProps } : c));
                    setCaptions(nextCaps);
                    pushHistoryDebounced();
                  }}
                  onUpdateStickerBounds={(id, newProps) => {
                    const nextStk = stickers.map((s) => (s.id === id ? { ...s, ...newProps } : s));
                    setStickers(nextStk);
                    pushHistoryDebounced();
                  }}
                  onUpdateImageLayerBounds={(id, newProps) => {
                    const nextImgLayers = imageLayers.map((l) => (l.id === id ? { ...l, ...newProps } : l));
                    setImageLayers(nextImgLayers);
                    pushHistoryDebounced();
                  }}
                  onUpdateCaptionText={(id, text) => {
                    setCaptions((prevCaps) => {
                      const nextCaps = prevCaps.map((c) => {
                        if (c.id === id) {
                          if (typeof text === 'object') {
                            return { ...c, ...text };
                          }
                          const updated = { ...c, text };
                          if (c.isBreakingNews) {
                            updated.newsHeadline = text;
                          }
                          return updated;
                        }
                        return c;
                      });
                      pushHistoryDebounced();
                      return nextCaps;
                    });
                  }}
                  isVideoPlaying={isVideoPlaying}
                  watermark={watermark}
                  canvasBgColor={canvasBgColor}
                  drawings={drawings}
                  onAddDrawing={handleAddDrawing}
                  isDrawingMode={!isElementSelected && activeTab === 'draw' && Boolean(drawTool)}
                  drawTool={drawTool}
                  brushColor={brushColor}
                  brushSize={brushSize}
                  canvasHeader={canvasHeader}
                  onUpdateCanvasHeader={(props) => {
                    setCanvasHeader((prev) => {
                      const upd = { ...prev, ...props };
                      pushHistoryDebounced();
                      return upd;
                    });
                  }}
                  canvasFooter={canvasFooter}
                  onUpdateCanvasFooter={(props) => {
                    setCanvasFooter((prev) => {
                      const upd = { ...prev, ...props };
                      pushHistoryDebounced();
                      return upd;
                    });
                  }}
                  demotivational={demotivational}
                  canvasFlipX={canvasFlipX}
                />

                {isRemovingBg && (
                  <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                    color: '#fff', zIndex: 50, borderRadius: '12px'
                  }}>
                    <RefreshCw className="spin" style={{ width: 40, height: 40, color: 'var(--primary-accent)', marginBottom: '12px' }} />
                    <span style={{ fontSize: '1rem', fontWeight: 600 }}>Removing Background...</span>
                    <span style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '4px' }}>This may take a moment</span>
                  </div>
                )}

                <FacePinpointOverlay
                  isOpen={isPinpointingFace}
                  faceTarget={faceTarget}
                  onUpdateTarget={setFaceTarget}
                  onConfirm={handleConfirmPinpoint}
                  onCancel={() => setIsPinpointingFace(false)}
                  canvasRef={canvasRef}
                  templateImageUrl={originalTemplateImgRef.current || activeTemplate?.originalUrl || activeTemplate?.imageUrl}
                />
              </div>

              {/* ─── Bottom Toolbars Dock Anchor (Main Toolbar on top of main dock, Layer Toolbar floats above it) ─── */}
              <div className="editor-toolbars-dock-anchor">
                {/* ─── Layer Toolbar (Secondary Toolbar) ─── */}
                <SecondaryToolbar
                  activeCaption={activeCaption}
                  activeImageLayer={activeImageLayer}
                  activeSticker={activeSticker}
                  activeSubmenu={activeSubmenu}
                  activeTab={activeTab}
                  brushColor={brushColor}
                  brushSize={brushSize}
                  drawTool={drawTool}
                  handleClearDrawings={handleClearDrawings}
                  handleCycleTextAlignment={handleCycleTextAlignment}
                  handleDeleteLayer={handleDeleteLayer}
                  handleDuplicateLayer={handleDuplicateLayer}
                  handleFlipActiveLayer={handleFlipActiveLayer}
                  handleRotateLayer={handleRotateLayer}
                  handleSetCaptionBg={handleSetCaptionBg}
                  handleSetDieCutColor={handleSetDieCutColor}
                  handleToggleCanvasBoth={handleToggleCanvasBoth}
                  handleToggleCanvasFooter={handleToggleCanvasFooter}
                  handleToggleCanvasHeader={handleToggleCanvasHeader}
                  handleToggleTextCase={handleToggleTextCase}
                  isElementSelected={isElementSelected}
                  moveLayer={moveLayer}
                  setBrushColor={setBrushColor}
                  setBrushSize={setBrushSize}
                  setShowLayerMenu={setShowLayerMenu}
                  showLayerMenu={showLayerMenu}
                  updateActiveCaptionProps={updateActiveCaptionProps}
                  updateActiveImageLayer={updateActiveImageLayer}
                  updateWatermark={updateWatermark}
                  watermark={watermark}
                />

            {/* ─── 2. Main Context Toolbar ─── */}
            <ContextToolbar
              activeCaption={activeCaption}
              activeFontObj={activeFontObj}
              activeImageLayer={activeImageLayer}
              activeSticker={activeSticker}
              activeSubmenu={activeSubmenu}
              activeTab={activeTab}
              contextToolbarRef={contextToolbarRef}
              drawTool={drawTool}
              handleAddBubble={handleAddBubble}
              handleAddCaption={handleAddCaption}
              handleChangeFace={handleChangeFace}
              handleFileUploadImageLayer={handleFileUploadImageLayer}
              handleFinalizeTemplateFace={handleFinalizeTemplateFace}
              handleFlipActiveLayer={handleFlipActiveLayer}
              handleOpenSocialModalForActiveCard={handleOpenSocialModalForActiveCard}
              handleRemoveBackground={handleRemoveBackground}
              handleRevertTemplateFace={handleRevertTemplateFace}
              handleSetCaptionBg={handleSetCaptionBg}
              handleStartMorphFace={handleStartMorphFace}
              handleToggleDieCutSticker={handleToggleDieCutSticker}
              handleToggleSubmenu={handleToggleSubmenu}
              isHoldingCanvasCompare={isHoldingCanvasCompare}
              isMobileTabsFolded={isMobileTabsFolded}
              isRemovingBg={isRemovingBg}
              setActiveSubmenu={setActiveSubmenu}
              setDrawTool={setDrawTool}
              setImagePickerTarget={setImagePickerTarget}
              setIsHoldingCanvasCompare={setIsHoldingCanvasCompare}
              setShowAiModal={setShowAiModal}
              setShowBubbleBottomSheet={setShowBubbleBottomSheet}
              setShowEmojiModal={setShowEmojiModal}
              setShowFaceMorphModal={setShowFaceMorphModal}
              setShowFiltersModal={setShowFiltersModal}
              setShowMemeStickersModal={setShowMemeStickersModal}
              showBubbleBottomSheet={showBubbleBottomSheet}
              showBubbleLayouts={showBubbleLayouts}
              showFiltersModal={showFiltersModal}
              showStylesModal={showStylesModal}
              updateActiveCaptionProps={updateActiveCaptionProps}
              updateWatermark={updateWatermark}
              watermark={watermark}
            />
          </div>

        </div>
      </div>
        
      {/* Sidebar Controls Tabs */}
        <EditorSidebar
          activeCaption={activeCaption}
          activeFontObj={activeFontObj}
          activeImageLayer={activeImageLayer}
          activeTab={activeTab}
          brushColor={brushColor}
          brushSize={brushSize}
          commitAddImageLayer={commitAddImageLayer}
          drawTool={drawTool}
          getActiveTextEffectId={getActiveTextEffectId}
          getDockHeight={getDockHeight}
          handleAddBubble={handleAddBubble}
          handleAddCaption={handleAddCaption}
          handleAddCurvedText={handleAddCurvedText}
          handleAddPresetPhrase={handleAddPresetPhrase}
          handleApplyBubbleStyle={handleApplyBubbleStyle}
          handleApplyTextEffect={handleApplyTextEffect}
          handleChangeFace={handleChangeFace}
          handleClearDrawings={handleClearDrawings}
          handleCycleFont={handleCycleFont}
          handleCycleWatermarkPosition={handleCycleWatermarkPosition}
          handleDeleteLayer={handleDeleteLayer}
          handleFileUploadImageLayer={handleFileUploadImageLayer}
          handleFinalizeTemplateFace={handleFinalizeTemplateFace}
          handleRevertTemplateFace={handleRevertTemplateFace}
          handleSetCanvasBgColor={handleSetCanvasBgColor}
          handleSetCaptionBg={handleSetCaptionBg}
          handleStartMorphFace={handleStartMorphFace}
          handleTabClick={handleTabClick}
          handleToggleCanvasBoth={handleToggleCanvasBoth}
          handleToggleCanvasFlip={handleToggleCanvasFlip}
          handleToggleCanvasFooter={handleToggleCanvasFooter}
          handleToggleCanvasHeader={handleToggleCanvasHeader}
          handleToggleTextCase={handleToggleTextCase}
          handleUndoDrawing={handleUndoDrawing}
          handleUpdateTemplateMorphProgress={handleUpdateTemplateMorphProgress}
          handleWatermarkImageUpload={handleWatermarkImageUpload}
          isMobileTabsFolded={isMobileTabsFolded}
          pendingVideoLayer={pendingVideoLayer}
          setActiveSubmenu={setActiveSubmenu}
          setBrushColor={setBrushColor}
          setBrushSize={setBrushSize}
          setDrawTool={setDrawTool}
          setImagePickerTarget={setImagePickerTarget}
          setPendingVideoLayer={setPendingVideoLayer}
          setShowAiModal={setShowAiModal}
          setShowBubbleBottomSheet={setShowBubbleBottomSheet}
          setShowFilterPresets={setShowFilterPresets}
          setShowFiltersModal={setShowFiltersModal}
          showFilterPresets={showFilterPresets}
          tabButtonsRef={tabButtonsRef}
          template={template}
          updateActiveCaption={updateActiveCaption}
          updateActiveCaptionProps={updateActiveCaptionProps}
          updateActiveImageLayer={updateActiveImageLayer}
          updateWatermark={updateWatermark}
          watermark={watermark}
          watermarkInputRef={watermarkInputRef}
          watermarkTextInputRef={watermarkTextInputRef}
        />
      </div>

      {/* Bottom sheets and modals */}
      <EditorModals
        activeCaption={activeCaption}
        activeImageLayer={activeImageLayer}
        currentEditingSocialCard={currentEditingSocialCard}
        extractedMemeFace={extractedMemeFace}
        faceTarget={faceTarget}
        handleAddGraphicSticker={handleAddGraphicSticker}
        handleAddImageLayer={handleAddImageLayer}
        handleAddInstagramCard={handleAddInstagramCard}
        handleAddSticker={handleAddSticker}
        handleAddTweetCard={handleAddTweetCard}
        handleAddWhatsAppCard={handleAddWhatsAppCard}
        handleApplyAiCaption={handleApplyAiCaption}
        handleApplyBubbleStyle={handleApplyBubbleStyle}
        handleApplyFaceMorph={handleApplyFaceMorph}
        handleUpdateSocialCard={handleUpdateSocialCard}
        imagePickerTarget={imagePickerTarget}
        morphTargetLayerId={morphTargetLayerId}
        morphTargetUrl={morphTargetUrl}
        openSourceTemplates={openSourceTemplates}
        originalTemplateImgRef={originalTemplateImgRef}
        sampledFaceLighting={sampledFaceLighting}
        setImagePickerTarget={setImagePickerTarget}
        setIsPinpointingFace={setIsPinpointingFace}
        setMorphTargetLayerId={setMorphTargetLayerId}
        setMorphTargetUrl={setMorphTargetUrl}
        setShowAiModal={setShowAiModal}
        setShowBubbleBottomSheet={setShowBubbleBottomSheet}
        setShowEmojiModal={setShowEmojiModal}
        setShowFaceMorphModal={setShowFaceMorphModal}
        setShowFiltersModal={setShowFiltersModal}
        setShowMemeStickersModal={setShowMemeStickersModal}
        setShowStylesModal={setShowStylesModal}
        showAiModal={showAiModal}
        showBubbleBottomSheet={showBubbleBottomSheet}
        showEmojiModal={showEmojiModal}
        showFaceMorphModal={showFaceMorphModal}
        showFiltersModal={showFiltersModal}
        showMemeStickersModal={showMemeStickersModal}
        showStylesModal={showStylesModal}
        socialModalPlatform={socialModalPlatform}
        template={template}
        updateActiveCaptionProps={updateActiveCaptionProps}
        updateActiveImageLayer={updateActiveImageLayer}
      />

    </div>
  );
}
