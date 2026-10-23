import { useState, useRef, useEffect } from 'react';
import CanvasEditor, { TWEET_TREND_PRESETS } from './CanvasEditor';
import { FONTS } from '../data/stickers';
import {
  Type, Trash2, Sparkles, Copy, Blend, Smile, Check, RefreshCw, LayoutGrid, PencilLine,
  ArrowDownRight, PanelTop, PanelBottom, Flame, Tv, MessageCircle, Ban, AlignLeft,
  AlignCenter, AlignRight, Rows3
} from 'lucide-react';
import AiCaptionModal from './AiCaptionModal';
import MemeStylesModal, { IG_PRESET_IMAGES } from './MemeStylesModal';
import FaceMorphModal from './FaceMorphModal';
import MemeStickersBottomSheet from './editor/MemeStickersBottomSheet';
import EmojiBottomSheet from './editor/EmojiBottomSheet';
import TemplatePickerBottomSheet from './editor/TemplatePickerBottomSheet';
import PhotoFiltersBottomSheet from './editor/PhotoFiltersBottomSheet';
import BubbleChatBottomSheet from './editor/BubbleChatBottomSheet';
import FacePinpointOverlay from './FacePinpointOverlay';
import { motion, AnimatePresence } from 'framer-motion';
import { MEME_TEMPLATES } from '../data/templates';
import { fetchOpenSourceMemes } from '../services/memeService';
import { safeGet, safeSet } from '../utils/storage';
import { blobToDataURL } from '../utils/galleryStore';
import { COLOR_SWATCHES, DRAW_COLORS, getNonOverlappingPosition, isColorDark } from '../utils/captionLayout';
import { TEXT_EFFECTS, secondaryVariants } from './editor/constants';
import { isSocialCardCaption, getContrastStroke, isVideoUrl } from './editor/memeEditorUtils';
import { createMemeEditorStore, MemeEditorStoreContext, useMemeEditorStore } from './editor/store/useMemeEditorStore';
import { useEditorShortcuts } from './editor/hooks/useEditorShortcuts';
import { useExport } from './editor/hooks/useExport';
import { useBackgroundRemoval } from './editor/hooks/useBackgroundRemoval';
import { useFaceMorph } from './editor/hooks/useFaceMorph';
import ExportPage from './editor/top-bar/ExportPage';
import EditorTopBar from './editor/top-bar/EditorTopBar';
import FiltersTab from './editor/tabs/FiltersTab';
import MediaTab from './editor/tabs/MediaTab';
import DrawTab from './editor/tabs/DrawTab';
import CanvasTab from './editor/tabs/CanvasTab';
import TextTab from './editor/tabs/TextTab';
import TabQuickTools from './editor/context-toolbars/TabQuickTools';
import FaceMorphToolbar from './editor/context-toolbars/FaceMorphToolbar';
import ImageLayerToolbar from './editor/context-toolbars/ImageLayerToolbar';
import StickerToolbar from './editor/context-toolbars/StickerToolbar';
import CaptionToolbar from './editor/context-toolbars/CaptionToolbar';
import LayerActionsBar from './editor/context-toolbars/secondary/LayerActionsBar';
import './MemeEditor.css';

export default function MemeEditor(props) {
  const [store] = useState(() => createMemeEditorStore(props.template));
  useEffect(() => () => store.getState().cancelPendingHistory(), [store]);
  return (
    <MemeEditorStoreContext.Provider value={store}>
      <MemeEditorContent {...props} />
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
  const setSlotImages = useMemeEditorStore((s) => s.setSlotImages);
  const slotTransforms = useMemeEditorStore((s) => s.slotTransforms);
  const setSlotTransforms = useMemeEditorStore((s) => s.setSlotTransforms);
  const activeTemplate = useMemeEditorStore((s) => s.activeTemplate);
  const setActiveTemplate = useMemeEditorStore((s) => s.setActiveTemplate);
  const aspectRatio = useMemeEditorStore((s) => s.aspectRatio);
  const canvasBgColor = useMemeEditorStore((s) => s.canvasBgColor);
  const setCanvasBgColor = useMemeEditorStore((s) => s.setCanvasBgColor);
  const canvasFlipX = useMemeEditorStore((s) => s.canvasFlipX);
  const setCanvasFlipX = useMemeEditorStore((s) => s.setCanvasFlipX);
  const canvasHeader = useMemeEditorStore((s) => s.canvasHeader);
  const setCanvasHeader = useMemeEditorStore((s) => s.setCanvasHeader);
  const canvasFooter = useMemeEditorStore((s) => s.canvasFooter);
  const setCanvasFooter = useMemeEditorStore((s) => s.setCanvasFooter);
  const demotivational = useMemeEditorStore((s) => s.demotivational);
  const templateFaceMorph = useMemeEditorStore((s) => s.templateFaceMorph);
  const imageFilters = useMemeEditorStore((s) => s.imageFilters);
  const setImageFilters = useMemeEditorStore((s) => s.setImageFilters);
  const drawings = useMemeEditorStore((s) => s.drawings);
  const setDrawings = useMemeEditorStore((s) => s.setDrawings);
  const pushHistory = useMemeEditorStore((s) => s.pushHistory);
  const pushHistoryDebounced = useMemeEditorStore((s) => s.pushHistoryDebounced);
  const handleUndo = useMemeEditorStore((s) => s.undo);
  const handleRedo = useMemeEditorStore((s) => s.redo);
  const nudgeLayer = useMemeEditorStore((s) => s.nudgeLayer);

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
  }, [template, setActiveTemplate, setActiveLayerId]);


  
  const imageFit = template?.imageFit || 'contain';

  // Open-source templates for Image Layer / Slot overlay picker
  const [imagePickerTarget, setImagePickerTarget] = useState(null); // 'layer' | 'replaceTemplate' | { slot: idx }
  const [openSourceTemplates, setOpenSourceTemplates] = useState(MEME_TEMPLATES);

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
  }, []);

  const activeImageLayer = imageLayers.find((i) => i.id === activeLayerId);


  const [showStylesModal, setShowStylesModal] = useState(() => {
    return Boolean(
      template && (
        template.category === 'social' ||
        template.isSocialTemplate ||
        (template.defaultCaptions && template.defaultCaptions.some((c) => isSocialCardCaption(c)))
      )
    );
  });
  const [socialModalPlatform, setSocialModalPlatform] = useState(() => {
    const socialCap = template?.defaultCaptions?.find((c) => isSocialCardCaption(c));
    if (socialCap?.isInstagramCard) return 'instagram';
    if (socialCap?.isWhatsAppCard) return 'whatsapp';
    if (socialCap?.isTweetCard) return 'tweet';
    if (template?.id?.includes('instagram')) return 'instagram';
    if (template?.id?.includes('whatsapp')) return 'whatsapp';
    return 'tweet';
  });
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

  const [activeTab, setActiveTab] = useState('text'); // 'text' | 'stickers' | 'images' | 'draw' | 'watermark'
  const [isMobileTabsFolded, setIsMobileTabsFolded] = useState(true);
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showTextEffectsMenu, setShowTextEffectsMenu] = useState(false);
  const showTextCurveMenu = showTextEffectsMenu;
  const setShowTextCurveMenu = setShowTextEffectsMenu;
  const [showTextBlurMenu, setShowTextBlurMenu] = useState(false);
  const [showTextBgMenu, setShowTextBgMenu] = useState(false);
  const [showFilterPresets, setShowFilterPresets] = useState(false);
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState(null); // 'font' | 'color' | 'align' | 'effects' | 'bg' | 'blur' | 'bubble' | 'tweetTheme' | 'tweetTrend' | 'drawSettings' | 'watermark' | 'canvasBg' | 'banner' | 'filters'
  const handleToggleSubmenu = (menuName) => {
    setActiveSubmenu(prev => prev === menuName ? null : menuName);
    setLastUsedSettingButton(menuName);
  };
  const [pasteToast, setPasteToast] = useState(false);

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
  const [showMemeStickersModal, setShowMemeStickersModal] = useState(false);
  const [showEmojiModal, setShowEmojiModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showBubbleBottomSheet, setShowBubbleBottomSheet] = useState(false);

  // Freehand Drawing state
  const [drawTool, setDrawTool] = useState(null); // 'brush' | 'eraser' | null (deactivated by default)
  const [brushColor, setBrushColor] = useState('#ff2a5f');
  const [brushSize, setBrushSize] = useState(10);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showBubbleLayouts, setShowBubbleLayouts] = useState(false);
  const [lastUsedSettingButton, setLastUsedSettingButton] = useState(null);
  const contextToolbarRef = useRef(null);
  const [pendingVideoLayer, setPendingVideoLayer] = useState(null);
  const isVideoPlaying = true;

  // Watermark state — persisted in localStorage (quota-safe: session state survives write failures)
  const [watermark, setWatermark] = useState(() => {
    const parsed = safeGet('meme-maker-watermark', null);
    if (parsed && typeof parsed === 'object') {
      if (parsed.text === '@username') parsed.text = '';
      return parsed;
    }
    return {
      enabled: false,
      text: '',
      imageUrl: null,
      position: 'bottom-right', // 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
      opacity: 0.5,
      size: 24,
      color: '#ffffff'
    };
  });

  // Save watermark config to localStorage whenever it changes
  useEffect(() => {
    safeSet('meme-maker-watermark', watermark);
  }, [watermark]);

  const updateWatermark = (key, value) => {
    setWatermark(prev => ({ ...prev, [key]: value }));
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

  const canvasRef = useRef(null);
  const {
    exportedImageUri, isExportModalOpen, setIsExportModalOpen,
    exportFormat, exportQuality, exportPreset, exportFileSize,
    exportDropdownOpen, setExportDropdownOpen, exportDropdownRef,
    isSaved, memeCustomName, setMemeCustomName, clipboardCopied, shareCopied,
    handleSelectExportFormat, handleSelectExportQuality, handleSelectExportPreset,
    handleQuickExport, handleConfirmSave, handleDownloadImage, handleCopyToClipboard, handleShareImage,
  } = useExport({ canvasRef, template, onSaveToGallery, layout: { imageFit, isNativeLayout, layoutDef } });
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
  }, [setActiveLayerId]);

  // Reset tweet toolbar submenus on active layer change
  useEffect(() => {
    setLastUsedSettingButton(null);
  }, [activeLayerId]);

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

  // Keyboard shortcuts: Ctrl+Z (undo), Ctrl+Y / Ctrl+Shift+Z (redo), Delete (delete layer), Escape (deselect)
  const handleToggleCanvasFlip = () => {
    const nextFlip = !canvasFlipX;
    setCanvasFlipX(nextFlip);
    pushHistory();
  };

  const handleAddDrawing = (newDrawing) => {
    const nextDrawings = [...drawings, newDrawing];
    setDrawings(nextDrawings);
    pushHistory();
  };

  const handleClearDrawings = () => {
    setDrawings([]);
    pushHistory();
  };

  const handleUndoDrawing = () => {
    if (drawings.length === 0) return;
    const nextDrawings = drawings.slice(0, -1);
    setDrawings(nextDrawings);
    pushHistory();
  };

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
    <AnimatePresence mode="wait">
      {isExportModalOpen ? (
        <motion.div key="export" className="export-page-container" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}>
          <ExportPage
            clipboardCopied={clipboardCopied}
            exportFileSize={exportFileSize}
            exportFormat={exportFormat}
            exportPreset={exportPreset}
            exportQuality={exportQuality}
            exportedImageUri={exportedImageUri}
            handleConfirmSave={handleConfirmSave}
            handleCopyToClipboard={handleCopyToClipboard}
            handleDownloadImage={handleDownloadImage}
            handleSelectExportFormat={handleSelectExportFormat}
            handleSelectExportPreset={handleSelectExportPreset}
            handleSelectExportQuality={handleSelectExportQuality}
            handleShareImage={handleShareImage}
            isSaved={isSaved}
            memeCustomName={memeCustomName}
            setIsExportModalOpen={setIsExportModalOpen}
            setMemeCustomName={setMemeCustomName}
            shareCopied={shareCopied}
          />
        </motion.div>
      ) : (
    <div className="meme-editor-container animate-fade-in">
      {/* Editor Top Bar (Mobile-Friendly Compact) */}
      <EditorTopBar
        exportDropdownOpen={exportDropdownOpen}
        exportDropdownRef={exportDropdownRef}
        handleQuickExport={handleQuickExport}
        imageFit={imageFit}
        isNativeLayout={isNativeLayout}
        layoutDef={layoutDef}
        memeCustomName={memeCustomName}
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
                <AnimatePresence>
                {Boolean(
                  Boolean(activeCaption || activeSticker || activeImageLayer) ||
                  (!isElementSelected && activeTab === 'draw' && (activeSubmenu === 'drawSettings' || Boolean(drawTool))) ||
                  (!isElementSelected && (activeTab === 'canvas' || activeTab === 'watermark') && (activeSubmenu === 'watermark' || activeSubmenu === 'canvasBg')) ||
                  (!isElementSelected && activeTab === 'text' && activeSubmenu === 'banner')
                ) && (
                  <motion.div
                    className="editor-secondary-toolbar"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {/* 1. Caption Font Submenu */}
                      {activeCaption && !isSocialCardCaption(activeCaption) && activeSubmenu === 'font' && (
                        <motion.div
                          key={`cap-font-${activeCaption.id}`}
                          variants={secondaryVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
                        >
                          {FONTS.map(f => (
                            <button
                              key={f.id || f.family}
                              id={`font-item-${f.family.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '')}`}
                              className={`btn btn-xs vid-ctx-btn ${activeCaption.fontFamily === f.family ? 'active' : ''}`}
                              style={{
                                fontFamily: f.family,
                                whiteSpace: 'nowrap'
                              }}
                              onClick={() => {
                                updateActiveCaptionProps({ fontFamily: f.family });
                              }}
                            >
                              {f.name}
                            </button>
                          ))}
                        </motion.div>
                      )}

                      {/* 2. Caption Color Submenu */}
                      {activeCaption && activeSubmenu === 'color' && (
                        <motion.div
                          key={`cap-color-${activeCaption.id}`}
                          variants={secondaryVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          className="sec-bar-btn-container"
                        >
                          {COLOR_SWATCHES.map(c => {
                            const isSelected = (activeCaption.color || '#ffffff').toLowerCase() === c.toLowerCase();
                            return (
                              <button
                                key={c}
                                type="button"
                                className={`color-swatch-btn ${isSelected ? 'active' : ''}`}
                                title={`Text color ${c}`}
                                onClick={() => updateActiveCaptionProps({ color: c, stroke: getContrastStroke(c) })}
                                style={{
                                  width: 22,
                                  height: 22,
                                  borderRadius: '50%',
                                  backgroundColor: c,
                                  border: isSelected ? '2px solid var(--cyber-cyan)' : '1.5px solid rgba(255,255,255,0.3)',
                                  boxShadow: isSelected ? '0 0 8px rgba(6, 182, 212, 0.6)' : 'none',
                                  transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                                  cursor: 'pointer',
                                  flexShrink: 0,
                                  padding: 0,
                                  transition: 'all 0.15s ease'
                                }}
                              />
                            );
                          })}
                          <div className="vid-ctx-divider" style={{ width: 1, height: 20, margin: '0 4px', flexShrink: 0 }} />
                          <div
                            title="Custom text color"
                            style={{
                              position: 'relative',
                              width: 22,
                              height: 22,
                              borderRadius: '50%',
                              background: 'conic-gradient(from 180deg at 50% 50%, #ff0055, #ffaa00, #00ff66, #00bbff, #aa00ff, #ff0055)',
                              border: '1.5px solid rgba(255, 255, 255, 0.35)',
                              cursor: 'pointer',
                              overflow: 'hidden',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            <input
                              type="color"
                              value={activeCaption.color || '#ffffff'}
                              onChange={(e) => {
                                const hex = e.target.value;
                                updateActiveCaptionProps({ color: hex, stroke: getContrastStroke(hex) });
                              }}
                              style={{ position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                            />
                          </div>
                        </motion.div>
                      )}

                      {/* 3. Caption Alignment Submenu */}
                      {activeCaption && activeSubmenu === 'align' && (
                        <motion.div
                          key={`cap-align-${activeCaption.id}`}
                          variants={secondaryVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
                        >
                          <button
                            type="button"
                            className={`btn btn-xs vid-ctx-btn ${activeCaption.align === 'left' ? 'active' : ''}`}
                            onClick={() => updateActiveCaptionProps({ align: 'left' })}
                          >
                            <AlignLeft style={{ width: 14, height: 14 }} />
                            <span>Left</span>
                          </button>
                          <button
                            type="button"
                            className={`btn btn-xs vid-ctx-btn ${(!activeCaption.align || activeCaption.align === 'center') ? 'active' : ''}`}
                            onClick={() => updateActiveCaptionProps({ align: 'center' })}
                          >
                            <AlignCenter style={{ width: 14, height: 14 }} />
                            <span>Center</span>
                          </button>
                          <button
                            type="button"
                            className={`btn btn-xs vid-ctx-btn ${activeCaption.align === 'right' ? 'active' : ''}`}
                            onClick={() => updateActiveCaptionProps({ align: 'right' })}
                          >
                            <AlignRight style={{ width: 14, height: 14 }} />
                            <span>Right</span>
                          </button>
                        </motion.div>
                      )}

                      {/* 4. Caption Effects Submenu */}
                      {activeCaption && activeSubmenu === 'effects' && (
                        <motion.div
                          key={`cap-effects-${activeCaption.id}`}
                          variants={secondaryVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
                        >
                          {TEXT_EFFECTS.map(effect => {
                            const isSelected = activeCaption.effect ? activeCaption.effect === effect.id : (effect.id === 'flat' && !activeCaption.curve);
                            return (
                              <button
                                key={effect.id}
                                type="button"
                                className={`btn btn-xs vid-ctx-btn ${isSelected ? 'active' : ''}`}
                                onClick={() => {
                                  updateActiveCaptionProps({
                                    effect: effect.id,
                                    curve: effect.curve || 0
                                  });
                                }}
                                title={effect.title}
                                style={{
                                  padding: '4px 12px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  flexShrink: 0
                                }}
                              >
                                {effect.renderLabel()}
                              </button>
                            );
                          })}
                        </motion.div>
                      )}

                    {/* 5. Caption Background Submenu */}
                    {activeCaption && activeSubmenu === 'bg' && (() => {
                      const isNone = !activeCaption.bgColor || activeCaption.bgColor === 'none' || activeCaption.bgColor === 'transparent';
                      const isBlack = activeCaption.bgColor === '#000000' || activeCaption.bgColor === 'rgba(0,0,0,0.75)';
                      const isWhite = activeCaption.bgColor === '#ffffff' || activeCaption.bgColor === 'rgba(255,255,255,0.9)';
                      const isBanner = activeCaption.bgStyle === 'banner';
                      const isCustom = !isNone && !isBlack && !isWhite && !isBanner;

                      return (
                        <motion.div
                          key={`cap-bg-${activeCaption.id}`}
                          variants={secondaryVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}
                        >
                          <div className="sec-bar-btn-container">
                            <button
                              type="button"
                              className={`color-swatch-btn ${isNone ? 'active' : ''}`}
                              onClick={() => handleSetCaptionBg('none')}
                              title="No background"
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: '50%',
                                border: isNone ? '2px solid var(--cyber-cyan)' : '1.5px solid rgba(255, 255, 255, 0.25)',
                                background: isNone ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                                boxShadow: isNone ? '0 0 8px rgba(6, 182, 212, 0.5)' : 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 0,
                                cursor: 'pointer',
                                transform: isNone ? 'scale(1.1)' : 'scale(1)',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <Ban style={{ width: 12, height: 12, color: isNone ? 'var(--cyber-cyan)' : 'rgba(255, 255, 255, 0.6)' }} />
                            </button>

                            <button
                              type="button"
                              className={`color-swatch-btn ${isBlack ? 'active' : ''}`}
                              onClick={() => handleSetCaptionBg('black')}
                              title="Black background"
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: '50%',
                                backgroundColor: '#000000',
                                border: isBlack ? '2px solid var(--cyber-cyan)' : '1.5px solid rgba(255, 255, 255, 0.35)',
                                boxShadow: isBlack ? '0 0 8px rgba(6, 182, 212, 0.5)' : 'none',
                                padding: 0,
                                cursor: 'pointer',
                                transform: isBlack ? 'scale(1.1)' : 'scale(1)',
                                transition: 'all 0.15s ease'
                              }}
                            />

                            <button
                              type="button"
                              className={`color-swatch-btn ${isWhite ? 'active' : ''}`}
                              onClick={() => handleSetCaptionBg('white')}
                              title="White background"
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: '50%',
                                backgroundColor: '#ffffff',
                                border: isWhite ? '2px solid var(--cyber-cyan)' : '1.5px solid rgba(255, 255, 255, 0.35)',
                                boxShadow: isWhite ? '0 0 8px rgba(6, 182, 212, 0.5)' : 'none',
                                padding: 0,
                                cursor: 'pointer',
                                transform: isWhite ? 'scale(1.1)' : 'scale(1)',
                                transition: 'all 0.15s ease'
                              }}
                            />

                            <div
                              title="Custom background color"
                              style={{
                                position: 'relative',
                                width: 22,
                                height: 22,
                                borderRadius: '50%',
                                background: isCustom
                                  ? activeCaption.bgColor
                                  : 'conic-gradient(from 180deg at 50% 50%, #ff0055, #ffaa00, #00ff66, #00bbff, #aa00ff, #ff0055)',
                                border: isCustom ? '2px solid var(--cyber-cyan)' : '1.5px solid rgba(255, 255, 255, 0.35)',
                                boxShadow: isCustom ? '0 0 8px rgba(6, 182, 212, 0.5)' : 'none',
                                transform: isCustom ? 'scale(1.1)' : 'scale(1)',
                                cursor: 'pointer',
                                overflow: 'hidden',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <input
                                type="color"
                                value={isCustom ? activeCaption.bgColor : '#ffffff'}
                                onChange={(e) => {
                                  const hex = e.target.value;
                                  updateActiveCaptionProps({ bgColor: hex, bgStyle: 'box' });
                                }}
                                style={{
                                  position: 'absolute',
                                  opacity: 0,
                                  inset: 0,
                                  cursor: 'pointer',
                                  width: '100%',
                                  height: '100%'
                                }}
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            className={`btn btn-xs vid-ctx-btn ${isBanner ? 'active' : ''}`}
                            onClick={() => {
                              if (isBanner) {
                                updateActiveCaptionProps({ bgStyle: 'box' });
                              } else if (!activeCaption.bgColor || activeCaption.bgColor === 'none' || activeCaption.bgColor === 'transparent') {
                                handleSetCaptionBg('banner');
                              } else {
                                updateActiveCaptionProps({ bgStyle: 'banner' });
                              }
                            }}
                            title={isBanner ? "Full-width Banner active (Click to return to box)" : "Toggle full-width Banner"}
                          >
                            <PanelTop style={{ width: 13, height: 13 }} />
                            <span>Banner</span>
                          </button>
                        </motion.div>
                      );
                    })()}

                    {/* 6. Caption Opacity Submenu */}
                    {activeCaption && activeSubmenu === 'blur' && (
                      <motion.div
                        key={`cap-blur-${activeCaption.id}`}
                        variants={secondaryVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}
                      >
                        <div className="sec-bar-btn-container">
                          <Blend style={{ width: 14, height: 14, opacity: 0.8 }} />
                          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Opacity</span>
                          <input
                            type="range"
                            min="0.1"
                            max="1"
                            step="0.05"
                            value={activeCaption.opacity !== undefined ? activeCaption.opacity : 1}
                            onChange={(e) => updateActiveCaptionProps({ opacity: parseFloat(e.target.value) })}
                            style={{ width: '100px', accentColor: 'var(--cyber-cyan)', touchAction: 'none' }}
                          />
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--cyber-cyan)', minWidth: '28px' }}>
                            {Math.round((activeCaption.opacity !== undefined ? activeCaption.opacity : 1) * 100)}%
                          </span>
                        </div>
                      </motion.div>
                    )}

                    {/* 8. Tweet Card Theme & Trend Submenu */}
                    {activeCaption?.isTweetCard && activeSubmenu === 'tweetTheme' && (
                      <motion.div
                        key={`cap-tweetTheme-${activeCaption.id}`}
                        variants={secondaryVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
                      >
                        {['dark', 'dim', 'light'].map((th) => (
                          <button
                            key={th}
                            type="button"
                            className={`btn btn-xs vid-ctx-btn ${(activeCaption.tweetTheme || 'dark') === th ? 'active' : ''}`}
                            onClick={() => updateActiveCaptionProps({ tweetTheme: th })}
                            style={{ padding: '4px 12px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize' }}
                          >
                            {th}
                          </button>
                        ))}
                      </motion.div>
                    )}
                    {activeCaption?.isTweetCard && activeSubmenu === 'tweetTrend' && (
                      <motion.div
                        key={`cap-tweetTrend-${activeCaption.id}`}
                        variants={secondaryVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
                      >
                        {[
                          { label: '#1 Trending', value: 'viral', icon: <Flame style={{ width: 12, height: 12 }} /> },
                          { label: 'Technology', value: 'tech', icon: <Tv style={{ width: 12, height: 12 }} /> },
                          { label: 'Memes', value: 'meme', icon: <Smile style={{ width: 12, height: 12 }} /> },
                          { label: 'Casual', value: 'casual', icon: <MessageCircle style={{ width: 12, height: 12 }} /> }
                        ].map((tr) => (
                          <button
                            key={tr.value}
                            type="button"
                            className={`btn btn-xs vid-ctx-btn ${(activeCaption.tweetTrendRank || 'viral') === tr.value ? 'active' : ''}`}
                            onClick={() => {
                              const preset = TWEET_TREND_PRESETS?.[tr.value];
                              if (preset) {
                                updateActiveCaptionProps({
                                  tweetTrendRank: tr.value,
                                  tweetMetrics: preset.text,
                                  tweetTopic: preset.topic
                                });
                              }
                            }}
                            style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            {tr.icon}
                            <span>{tr.label}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}

                    {/* 8b. Instagram Card Theme Submenu */}
                    {activeCaption?.isInstagramCard && activeSubmenu === 'igTheme' && (
                      <motion.div
                        key={`cap-igTheme-${activeCaption.id}`}
                        variants={secondaryVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
                      >
                        {['dark', 'light'].map((th) => (
                          <button
                            key={th}
                            type="button"
                            className={`btn btn-xs vid-ctx-btn ${(activeCaption.igTheme || 'dark') === th ? 'active' : ''}`}
                            onClick={() => {
                              const newColor = th === 'light' ? '#262626' : '#f5f5f5';
                              updateActiveCaptionProps({ igTheme: th, color: newColor });
                            }}
                            style={{ padding: '4px 12px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize' }}
                          >
                            {th}
                          </button>
                        ))}
                      </motion.div>
                    )}

                    {/* 8c. WhatsApp Card Submenus */}
                    {activeCaption?.isWhatsAppCard && activeSubmenu === 'waTheme' && (
                      <motion.div
                        key={`cap-waTheme-${activeCaption.id}`}
                        variants={secondaryVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
                      >
                        {['dark', 'light'].map((th) => (
                          <button
                            key={th}
                            type="button"
                            className={`btn btn-xs vid-ctx-btn ${(activeCaption.waTheme || 'dark') === th ? 'active' : ''}`}
                            onClick={() => updateActiveCaptionProps({ waTheme: th })}
                            style={{ padding: '4px 12px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize' }}
                          >
                            {th}
                          </button>
                        ))}
                      </motion.div>
                    )}
                    {activeCaption?.isWhatsAppCard && activeSubmenu === 'waTicks' && (
                      <motion.div
                        key={`cap-waTicks-${activeCaption.id}`}
                        variants={secondaryVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
                      >
                        {[
                          { label: 'Blue Double (Read)', value: 'blue' },
                          { label: 'Grey Double (Delivered)', value: 'grey' },
                          { label: 'Single (Sent)', value: 'single' }
                        ].map((item) => (
                          <button
                            key={item.value}
                            type="button"
                            className={`btn btn-xs vid-ctx-btn ${(activeCaption.waTicks || 'blue') === item.value ? 'active' : ''}`}
                            onClick={() => updateActiveCaptionProps({ waTicks: item.value })}
                            style={{ padding: '4px 12px', fontSize: '0.75rem', fontWeight: 600 }}
                          >
                            {item.label}
                          </button>
                        ))}
                      </motion.div>
                    )}

                    {/* 9. Draw Tool Colors & Size Submenu */}
                    {!isElementSelected && activeTab === 'draw' && (
                      <motion.div
                        key={`draw-${drawTool || 'brush'}`}
                        variants={secondaryVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}
                      >
                        <div className="sec-bar-btn-container" style={{ padding: '0 6px', gap: '4px' }}>
                          {DRAW_COLORS.map((c) => {
                            const isSelected = brushColor === c;
                            return (
                              <button
                                key={c}
                                type="button"
                                className={`color-swatch-btn ${isSelected ? 'active' : ''}`}
                                title={`Set color ${c}`}
                                onClick={() => setBrushColor(c)}
                                style={{
                                  width: 17.5,
                                  height: 17.5,
                                  borderRadius: '50%',
                                  background: c,
                                  border: isSelected ? '2px solid var(--cyber-cyan)' : '1px solid rgba(255,255,255,0.4)',
                                  transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                                  boxShadow: isSelected ? (drawTool === 'glow' ? `0 0 10px ${c}` : '0 0 6px rgba(6,182,212,0.6)') : 'none',
                                  cursor: 'pointer',
                                  padding: 0,
                                  transition: 'all 0.15s ease'
                                }}
                              />
                            );
                          })}
                          <div
                            title="Custom brush color"
                            style={{
                              position: 'relative',
                              width: 17.5,
                              height: 17.5,
                              borderRadius: '50%',
                              background: 'conic-gradient(from 180deg at 50% 50%, #ff0055, #ffaa00, #00ff66, #00bbff, #aa00ff, #ff0055)',
                              border: '1px solid rgba(255,255,255,0.4)',
                              cursor: 'pointer',
                              overflow: 'hidden',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            <input
                              type="color"
                              value={brushColor}
                              onChange={(e) => setBrushColor(e.target.value)}
                              style={{ position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                            />
                          </div>
                        </div>

                        {/* Size Slider for Draw Tools (Neutral Glass Pill) */}
                        <div className="sec-bar-accent-slider">
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              border: '1.5px solid currentColor',
                              opacity: 0.6,
                              boxSizing: 'border-box',
                              flexShrink: 0
                            }}
                            title="Min stroke size"
                          />
                          <input
                            type="range"
                            min="2"
                            max="50"
                            value={brushSize}
                            onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
                            title={`Size: ${brushSize}px`}
                            style={{ touchAction: 'none' }}
                          />
                          <div
                            style={{
                              width: 14,
                              height: 14,
                              borderRadius: '50%',
                              border: '1.5px solid currentColor',
                              opacity: 0.6,
                              boxSizing: 'border-box',
                              flexShrink: 0
                            }}
                            title="Max stroke size"
                          />
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'inherit', minWidth: '22px' }}>{brushSize}px</span>
                        </div>

                        <button
                          type="button"
                          className="btn btn-icon btn-xs vid-ctx-btn vid-ctx-btn-delete"
                          onClick={handleClearDrawings}
                          disabled={drawings.length === 0}
                          style={{
                            width: 36,
                            height: 36,
                            minWidth: 36,
                            minHeight: 36,
                            borderRadius: '50%',
                            padding: 0,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            background: drawings.length > 0 ? 'linear-gradient(135deg, #ef4444, #dc2626)' : undefined,
                            border: drawings.length > 0 ? '1px solid rgba(255, 255, 255, 0.28)' : undefined,
                            boxShadow: drawings.length > 0 ? '0 2px 10px rgba(239, 68, 68, 0.45)' : undefined,
                            opacity: drawings.length === 0 ? 0.35 : 1,
                            cursor: drawings.length === 0 ? 'not-allowed' : 'pointer',
                            color: '#ffffff'
                          }}
                          title={drawings.length > 0 ? `Clear all drawings (${drawings.length})` : 'Clear drawings'}
                          aria-label="Clear all drawings"
                        >
                          <Trash2 style={{ width: 14, height: 14, color: '#ffffff' }} />
                        </button>
                      </motion.div>
                    )}

                    {/* 10. Watermark Controls Submenu */}
                    {!isElementSelected && (activeTab === 'canvas' || activeTab === 'watermark') && activeSubmenu === 'watermark' && (
                      <motion.div
                        key="canvas-watermark"
                        variants={secondaryVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
                      >
                        <button
                          className="btn btn-icon btn-xs vid-ctx-btn"
                          style={{ position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Watermark Color"
                        >
                          <div style={{ width: 18, height: 18, borderRadius: '50%', background: watermark?.color || '#ffffff', border: '2px solid rgba(255,255,255,0.4)' }} />
                          <input type="color" value={watermark?.color || '#ffffff'} onChange={(e) => updateWatermark('color', e.target.value)} style={{ position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
                        </button>

                        <input
                          type="text"
                          value={(watermark?.text || '').replace(/^@/, '')}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/^@+/, '');
                            updateWatermark('text', raw ? `@${raw}` : '');
                            if (raw) updateWatermark('imageUrl', null);
                          }}
                          placeholder="username"
                          className="sec-bar-btn-container"
                          style={{ color: '#fff', padding: '0 12px', fontSize: '0.8rem', width: '105px', outline: 'none' }}
                        />

                        <button
                          className="btn btn-icon btn-xs vid-ctx-btn"
                          onClick={() => {
                            const sizes = [12, 16, 24, 32, 48];
                            const nextIdx = (sizes.indexOf(watermark?.size || 24) + 1) % sizes.length;
                            updateWatermark('size', sizes[nextIdx]);
                          }}
                          title="Size"
                        >
                          <Type style={{ width: 15, height: 15, transform: `scale(${(watermark?.size || 24) / 24})`, transition: 'transform 0.2s' }} />
                        </button>

                        <button
                          className="btn btn-icon btn-xs vid-ctx-btn"
                          onClick={() => {
                            const ops = [1, 0.75, 0.5, 0.25];
                            const nextIdx = (ops.indexOf(watermark?.opacity || 0.5) + 1) % ops.length;
                            updateWatermark('opacity', ops[nextIdx]);
                          }}
                          title="Opacity"
                        >
                          <Blend style={{ width: 15, height: 15, opacity: watermark?.opacity || 0.5, transition: 'opacity 0.2s' }} />
                        </button>

                        <button
                          className="btn btn-icon btn-xs vid-ctx-btn"
                          onClick={() => {
                            const pos = ['bottom-right', 'bottom-left', 'top-left', 'top-right'];
                            const nextIdx = (pos.indexOf(watermark?.position || 'bottom-right') + 1) % pos.length;
                            updateWatermark('position', pos[nextIdx]);
                          }}
                          title="Position"
                        >
                          <ArrowDownRight 
                            style={{ 
                              width: 15, 
                              height: 15, 
                              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              transform: `rotate(${
                                watermark?.position === 'bottom-left' ? 90 :
                                watermark?.position === 'top-left' ? 180 :
                                watermark?.position === 'top-right' ? 270 :
                                0
                              }deg)`
                            }} 
                          />
                        </button>
                      </motion.div>
                    )}

                    {/* 11. Canvas Color Submenu */}
                    {!isElementSelected && (activeTab === 'canvas' || activeTab === 'watermark') && activeSubmenu === 'canvasBg' && (
                      <motion.div
                        key="canvas-bg-swatches"
                        variants={secondaryVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="sec-bar-btn-container"
                      >
                        {['#000000', '#ffffff', '#1e293b', '#0f172a', '#ff0055', '#00f0ff', 'transparent'].map((c) => (
                          <button
                            key={c}
                            type="button"
                            className={`color-swatch-btn ${canvasBgColor === c ? 'active' : ''}`}
                            title={c === 'transparent' ? 'Transparent' : `Canvas background ${c}`}
                            onClick={() => setCanvasBgColor(c)}
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: '50%',
                              backgroundColor: c === 'transparent' ? 'rgba(255,255,255,0.1)' : c,
                              border: canvasBgColor === c ? '2px solid var(--cyber-cyan)' : '1.5px solid rgba(255,255,255,0.3)',
                              boxShadow: canvasBgColor === c ? '0 0 8px rgba(6, 182, 212, 0.5)' : 'none',
                              cursor: 'pointer',
                              flexShrink: 0,
                              padding: 0
                            }}
                          />
                        ))}
                        <div
                          title="Custom canvas color"
                          style={{
                            position: 'relative',
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            background: 'conic-gradient(from 180deg at 50% 50%, #ff0055, #ffaa00, #00ff66, #00bbff, #aa00ff, #ff0055)',
                            border: '1.5px solid rgba(255, 255, 255, 0.35)',
                            cursor: 'pointer',
                            overflow: 'hidden',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          <input
                            type="color"
                            value={canvasBgColor || '#000000'}
                            onChange={(e) => setCanvasBgColor(e.target.value)}
                            style={{ position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                          />
                        </div>
                      </motion.div>
                    )}

                    {/* 13. Header / Footer Extension Submenu */}
                    {!isElementSelected && activeTab === 'text' && activeSubmenu === 'banner' && (
                      <motion.div
                        key="canvas-banner"
                        variants={secondaryVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
                      >
                        <button
                          type="button"
                          className={`btn btn-xs vid-ctx-btn ${canvasHeader.enabled ? 'active' : ''}`}
                          onClick={handleToggleCanvasHeader}
                          title="Toggle Header Extension"
                          style={{
                            padding: '4px 12px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            borderRadius: '8px',
                            flexShrink: 0,
                            background: canvasHeader.enabled ? 'var(--primary-gradient)' : undefined,
                            border: canvasHeader.enabled ? '1px solid var(--cyber-cyan)' : undefined,
                            color: canvasHeader.enabled ? '#ffffff' : undefined
                          }}
                        >
                          <PanelTop style={{ width: 13, height: 13 }} />
                          <span>Header</span>
                        </button>
                        <button
                          type="button"
                          className={`btn btn-xs vid-ctx-btn ${canvasFooter.enabled ? 'active' : ''}`}
                          onClick={handleToggleCanvasFooter}
                          title="Toggle Footer Extension"
                          style={{
                            padding: '4px 12px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            borderRadius: '8px',
                            flexShrink: 0,
                            background: canvasFooter.enabled ? 'var(--primary-gradient)' : undefined,
                            border: canvasFooter.enabled ? '1px solid var(--cyber-cyan)' : undefined,
                            color: canvasFooter.enabled ? '#ffffff' : undefined
                          }}
                        >
                          <PanelBottom style={{ width: 13, height: 13 }} />
                          <span>Footer</span>
                        </button>
                        <button
                          type="button"
                          className={`btn btn-xs vid-ctx-btn ${(canvasHeader.enabled && canvasFooter.enabled) ? 'active' : ''}`}
                          onClick={handleToggleCanvasBoth}
                          title="Toggle Both Header & Footer Extensions"
                          style={{
                            padding: '4px 12px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            borderRadius: '8px',
                            flexShrink: 0,
                            background: (canvasHeader.enabled && canvasFooter.enabled) ? 'var(--primary-gradient)' : undefined,
                            border: (canvasHeader.enabled && canvasFooter.enabled) ? '1px solid var(--cyber-cyan)' : undefined,
                            color: (canvasHeader.enabled && canvasFooter.enabled) ? '#ffffff' : undefined
                          }}
                        >
                          <Rows3 style={{ width: 13, height: 13 }} />
                          <span>Both</span>
                        </button>
                      </motion.div>
                    )}

                    {/* 14. Die-Cut Color Picker — Appears on Secondary Toolbar when Die-Cut is active on sticker / emoji */}
                    {activeSticker && activeSticker.dieCut && !activeSubmenu && (
                      <motion.div
                        key={`stk-diecut-${activeSticker.id}`}
                        variants={secondaryVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="sec-bar-btn-container"
                      >
                        {COLOR_SWATCHES.map((c) => {
                          const isSelected = (activeSticker.dieCutColor || '#ffffff').toLowerCase() === c.toLowerCase();
                          return (
                            <button
                              key={c}
                              type="button"
                              className={`color-swatch-btn ${isSelected ? 'active' : ''}`}
                              title={`Die-cut border color ${c}`}
                              onClick={() => handleSetDieCutColor(c)}
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: '50%',
                                backgroundColor: c,
                                border: isSelected ? '2px solid var(--cyber-cyan)' : '1.5px solid rgba(255,255,255,0.3)',
                                boxShadow: isSelected ? '0 0 8px rgba(6, 182, 212, 0.6)' : 'none',
                                transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                                cursor: 'pointer',
                                flexShrink: 0,
                                padding: 0,
                                transition: 'all 0.15s ease'
                              }}
                            />
                          );
                        })}
                        <div className="vid-ctx-divider" style={{ width: 1, height: 20, margin: '0 4px', flexShrink: 0 }} />
                        <div
                          title="Custom die-cut border color"
                          style={{
                            position: 'relative',
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            background: 'conic-gradient(from 180deg at 50% 50%, #ff0055, #ffaa00, #00ff66, #00bbff, #aa00ff, #ff0055)',
                            border: '1.5px solid rgba(255, 255, 255, 0.35)',
                            cursor: 'pointer',
                            overflow: 'hidden',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          <input
                            type="color"
                            value={activeSticker.dieCutColor || '#ffffff'}
                            onChange={(e) => handleSetDieCutColor(e.target.value)}
                            style={{ position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                          />
                        </div>
                      </motion.div>
                    )}

                    {/* 15. Unified Layer Actions Cluster (Rotate / Duplicate / Layers / Delete) */}
                    {(activeCaption || (activeSticker && !activeSticker.dieCut) || activeImageLayer) && !activeSubmenu && (
                      <motion.div
                        key={`layer-actions-${activeLayerId || 'layer'}`}
                        variants={secondaryVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
                      >
                        <LayerActionsBar
                          activeCaption={activeCaption}
                          activeImageLayer={activeImageLayer}
                          handleCycleTextAlignment={handleCycleTextAlignment}
                          handleDeleteLayer={handleDeleteLayer}
                          handleDuplicateLayer={handleDuplicateLayer}
                          handleFlipActiveLayer={handleFlipActiveLayer}
                          handleRotateLayer={handleRotateLayer}
                          handleToggleTextCase={handleToggleTextCase}
                          moveLayer={moveLayer}
                          setShowLayerMenu={setShowLayerMenu}
                          showLayerMenu={showLayerMenu}
                          updateActiveImageLayer={updateActiveImageLayer}
                        />
                      </motion.div>
                    )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>

            {/* ─── 2. Main Context Toolbar ─── */}
            <AnimatePresence>
              {((activeCaption || activeSticker || activeImageLayer || templateFaceMorph) || (isMobileTabsFolded && !activeCaption && !activeSticker && !activeImageLayer)) && (isMobileTabsFolded || templateFaceMorph) && (
                <motion.div
                  ref={contextToolbarRef}
                  className={`editor-floating-toolbar video-context-toolbar ${showBubbleLayouts ? 'bubble-mode-left' : ''}`}
                  initial={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0, marginTop: 0, marginBottom: 0, overflow: 'hidden' }}
                  animate={{ opacity: 1, height: 64, paddingTop: 5, paddingBottom: 5, marginTop: 2, marginBottom: 0 }}
                  exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0, marginTop: 0, marginBottom: 0, overflow: 'hidden' }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                  {/* Text Controls when caption is active */}
                  <CaptionToolbar
                    activeCaption={activeCaption}
                    activeFontObj={activeFontObj}
                    activeSubmenu={activeSubmenu}
                    handleOpenSocialModalForActiveCard={handleOpenSocialModalForActiveCard}
                    handleSetCaptionBg={handleSetCaptionBg}
                    handleToggleSubmenu={handleToggleSubmenu}
                    setActiveSubmenu={setActiveSubmenu}
                    setShowBubbleBottomSheet={setShowBubbleBottomSheet}
                    showBubbleBottomSheet={showBubbleBottomSheet}
                    showStylesModal={showStylesModal}
                    updateActiveCaptionProps={updateActiveCaptionProps}
                  />

                  {/* Sticker controls */}
                  <StickerToolbar activeSticker={activeSticker} handleFlipActiveLayer={handleFlipActiveLayer} handleToggleDieCutSticker={handleToggleDieCutSticker} />

                  {/* Image Layer controls */}
                  <ImageLayerToolbar
                    activeImageLayer={activeImageLayer}
                    handleRemoveBackground={handleRemoveBackground}
                    handleStartMorphFace={handleStartMorphFace}
                    isRemovingBg={isRemovingBg}
                    setShowFiltersModal={setShowFiltersModal}
                    showFiltersModal={showFiltersModal}
                  />



                  {/* ON-TEMPLATE FACE MORPH TOOLBAR */}
                  <FaceMorphToolbar
                    activeCaption={activeCaption}
                    activeImageLayer={activeImageLayer}
                    activeSticker={activeSticker}
                    handleChangeFace={handleChangeFace}
                    handleFinalizeTemplateFace={handleFinalizeTemplateFace}
                    handleRevertTemplateFace={handleRevertTemplateFace}
                    isHoldingCanvasCompare={isHoldingCanvasCompare}
                    setIsHoldingCanvasCompare={setIsHoldingCanvasCompare}
                  />

                  {/* TAB SPECIFIC TOOLS (when nothing selected and not in template face morph) */}
                  {/* TEXT TAB */}
                  <TabQuickTools
                    activeCaption={activeCaption}
                    activeImageLayer={activeImageLayer}
                    activeSticker={activeSticker}
                    activeSubmenu={activeSubmenu}
                    activeTab={activeTab}
                    drawTool={drawTool}
                    handleAddBubble={handleAddBubble}
                    handleAddCaption={handleAddCaption}
                    handleFileUploadImageLayer={handleFileUploadImageLayer}
                    handleToggleSubmenu={handleToggleSubmenu}
                    setActiveSubmenu={setActiveSubmenu}
                    setDrawTool={setDrawTool}
                    setImagePickerTarget={setImagePickerTarget}
                    setShowAiModal={setShowAiModal}
                    setShowBubbleBottomSheet={setShowBubbleBottomSheet}
                    setShowEmojiModal={setShowEmojiModal}
                    setShowFaceMorphModal={setShowFaceMorphModal}
                    setShowFiltersModal={setShowFiltersModal}
                    setShowMemeStickersModal={setShowMemeStickersModal}
                    showBubbleBottomSheet={showBubbleBottomSheet}
                    showFiltersModal={showFiltersModal}
                    updateWatermark={updateWatermark}
                    watermark={watermark}
                  />

                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
        
      {/* Sidebar Controls Tabs */}
        <div 
          className={`editor-sidebar glass-card ${isMobileTabsFolded ? 'folded' : ''}`}
          style={{ '--dock-height': getDockHeight() }}
        >
          <div 
            ref={tabButtonsRef}
            className="tab-buttons"
            onWheel={(e) => {
              if (e.deltaY !== 0) {
                e.currentTarget.scrollLeft += e.deltaY;
              }
            }}
          >
            <button
              className={`tab-btn ${activeTab === 'draw' ? 'active' : ''}`}
              onClick={() => {
                handleTabClick('draw');
                setActiveLayerId(null);
                setDrawTool('brush');
              }}
            >
              <PencilLine className="icon-xs" /> <span>Draw</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'images' ? 'active' : ''}`}
              onClick={() => handleTabClick('images')}
            >
              <Copy className="icon-xs" /> <span>Media</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`}
              onClick={() => handleTabClick('text')}
            >
              <Type className="icon-xs" /> <span>Text</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'filters' ? 'active' : ''}`}
              onClick={() => handleTabClick('filters')}
            >
              <Sparkles className="icon-xs" /> <span>AI/Filters</span>
            </button>
            <button
              className={`tab-btn ${(activeTab === 'canvas' || activeTab === 'watermark') ? 'active' : ''}`}
              onClick={() => handleTabClick('canvas')}
            >
              <LayoutGrid className="icon-xs" /> <span>Canvas</span>
            </button>
            
          </div>



            {/* TAB 5: CANVAS & WATERMARK */}
            <CanvasTab
              activeTab={activeTab}
              handleCycleWatermarkPosition={handleCycleWatermarkPosition}
              handleSetCanvasBgColor={handleSetCanvasBgColor}
              handleToggleCanvasFlip={handleToggleCanvasFlip}
              handleWatermarkImageUpload={handleWatermarkImageUpload}
              updateWatermark={updateWatermark}
              watermark={watermark}
              watermarkInputRef={watermarkInputRef}
              watermarkTextInputRef={watermarkTextInputRef}
            />
            {/* TAB 4: FREEHAND DRAWING */}
            <DrawTab
              activeTab={activeTab}
              brushColor={brushColor}
              brushSize={brushSize}
              drawTool={drawTool}
              handleClearDrawings={handleClearDrawings}
              handleUndoDrawing={handleUndoDrawing}
              setBrushColor={setBrushColor}
              setBrushSize={setBrushSize}
              setDrawTool={setDrawTool}
            />

          {/* TAB 1: TEXT CONTROLS */}
          <TextTab
            activeCaption={activeCaption}
            activeFontObj={activeFontObj}
            activeTab={activeTab}
            getActiveTextEffectId={getActiveTextEffectId}
            handleAddBubble={handleAddBubble}
            handleAddCaption={handleAddCaption}
            handleAddCurvedText={handleAddCurvedText}
            handleAddPresetPhrase={handleAddPresetPhrase}
            handleApplyBubbleStyle={handleApplyBubbleStyle}
            handleApplyTextEffect={handleApplyTextEffect}
            handleCycleFont={handleCycleFont}
            handleDeleteLayer={handleDeleteLayer}
            handleSetCanvasBgColor={handleSetCanvasBgColor}
            handleSetCaptionBg={handleSetCaptionBg}
            handleToggleCanvasBoth={handleToggleCanvasBoth}
            handleToggleCanvasFooter={handleToggleCanvasFooter}
            handleToggleCanvasHeader={handleToggleCanvasHeader}
            handleToggleTextCase={handleToggleTextCase}
            setActiveSubmenu={setActiveSubmenu}
            setShowAiModal={setShowAiModal}
            setShowBubbleBottomSheet={setShowBubbleBottomSheet}
            updateActiveCaption={updateActiveCaption}
            updateActiveCaptionProps={updateActiveCaptionProps}
          />


          {/* TAB 3: MEDIA OVERLAY CONTROLS */}
          <MediaTab
            activeImageLayer={activeImageLayer}
            activeTab={activeTab}
            commitAddImageLayer={commitAddImageLayer}
            handleChangeFace={handleChangeFace}
            handleDeleteLayer={handleDeleteLayer}
            handleFileUploadImageLayer={handleFileUploadImageLayer}
            handleFinalizeTemplateFace={handleFinalizeTemplateFace}
            handleRevertTemplateFace={handleRevertTemplateFace}
            handleUpdateTemplateMorphProgress={handleUpdateTemplateMorphProgress}
            pendingVideoLayer={pendingVideoLayer}
            setImagePickerTarget={setImagePickerTarget}
            setPendingVideoLayer={setPendingVideoLayer}
            updateActiveImageLayer={updateActiveImageLayer}
          />

          {/* TAB 4: AI / FILTERS */}
          <FiltersTab
            activeImageLayer={activeImageLayer}
            activeTab={activeTab}
            handleStartMorphFace={handleStartMorphFace}
            setShowFilterPresets={setShowFilterPresets}
            setShowFiltersModal={setShowFiltersModal}
            showFilterPresets={showFilterPresets}
            template={template}
          />
        </div>
      </div>



      {/* Meme Stickers & Overlays Bottom Sheet */}
      <MemeStickersBottomSheet
        isOpen={showMemeStickersModal}
        onClose={() => setShowMemeStickersModal(false)}
        onSelectSticker={(sticker) => handleAddGraphicSticker(sticker)}
      />

      {/* Emoji Stickers Bottom Sheet */}
      <EmojiBottomSheet
        isOpen={showEmojiModal}
        onClose={() => setShowEmojiModal(false)}
        onSelectEmoji={(emoji) => handleAddSticker(emoji)}
      />

      {/* Image Layer Template Picker Bottom Sheet */}
      <TemplatePickerBottomSheet
        isOpen={imagePickerTarget !== null}
        onClose={() => setImagePickerTarget(null)}
        templates={openSourceTemplates}
        onSelectTemplate={(tmpl) => {
          if (imagePickerTarget?.slot !== undefined) {
            const nextImages = [...slotImages];
            nextImages[imagePickerTarget.slot] = tmpl.imageUrl;
            setSlotImages(nextImages);

            const nextTransforms = [...slotTransforms];
            nextTransforms[imagePickerTarget.slot] = { offsetX: 0, offsetY: 0, scale: 1.5 };
            setSlotTransforms(nextTransforms);
          } else {
            handleAddImageLayer(tmpl.imageUrl);
          }
          setImagePickerTarget(null);
        }}
      />

      {/* Photo Filters Bottom Sheet */}
      <PhotoFiltersBottomSheet
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        activeImageLayer={activeImageLayer}
        imageFilters={imageFilters}
        setImageFilters={setImageFilters}
        updateActiveImageLayer={updateActiveImageLayer}
        previewImage={(() => {
          if (activeImageLayer) {
            return activeImageLayer.originalUrl || activeImageLayer.url || activeImageLayer.src;
          }
          if (imageLayers && imageLayers.length > 0) {
            return imageLayers[0].originalUrl || imageLayers[0].url || imageLayers[0].src;
          }
          return activeTemplate?.imageUrl || template?.imageUrl;
        })()}
      />

      {/* Bubble Chat & Speech Layouts Bottom Sheet */}
      <BubbleChatBottomSheet
        isOpen={showBubbleBottomSheet}
        onClose={() => setShowBubbleBottomSheet(false)}
        activeCaption={activeCaption}
        onApplyBubbleStyle={handleApplyBubbleStyle}
        onRemoveBubbleStyle={() => updateActiveCaptionProps({ bubbleStyle: null })}
      />


      {/* AI Meme Caption Generator Modal */}
      <AiCaptionModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        onApplyCaption={handleApplyAiCaption}
        templateName={template?.name}
      />

      {/* Meme Style Modal (Unified Social Cards Studio) */}
      <MemeStylesModal
        isOpen={showStylesModal}
        onClose={() => setShowStylesModal(false)}
        initialPlatform={socialModalPlatform}
        cardData={currentEditingSocialCard || null}
        onUpdateCard={handleUpdateSocialCard}
        onAddTweetCard={handleAddTweetCard}
        onAddInstagramCard={handleAddInstagramCard}
        onAddWhatsAppCard={handleAddWhatsAppCard}
      />

      {/* Face Morph & Swap Studio Modal */}
      {showFaceMorphModal && (
        <FaceMorphModal
          isOpen={showFaceMorphModal}
          onClose={() => {
            setShowFaceMorphModal(false);
            setMorphTargetLayerId(null);
            setMorphTargetUrl(null);
          }}
          onApplyFaceMorph={handleApplyFaceMorph}
          onOpenPinpoint={() => setIsPinpointingFace(true)}
          initialLighting={sampledFaceLighting}
          memeFacePatch={extractedMemeFace}
          memeTemplateUrl={
            morphTargetUrl ||
            (morphTargetLayerId
              ? (imageLayers.find((l) => l.id === morphTargetLayerId)?.url || stickers.find((s) => s.id === morphTargetLayerId)?.url)
              : (originalTemplateImgRef.current || activeTemplate?.originalUrl || activeTemplate?.imageUrl))
          }
          faceTarget={morphTargetLayerId ? null : faceTarget}
          targetLabel={morphTargetLayerId ? "Selected Image Layer" : null}
        />
      )}

    </div>
      )}
    </AnimatePresence>
  );
}
