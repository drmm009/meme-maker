import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import CanvasEditor, { TWEET_TREND_PRESETS } from './CanvasEditor';
import { FONTS } from '../data/stickers';
import {
  Type, Plus, Trash2, Undo, Redo, Download, Share2, Sparkles, Copy, Blend,
  Sliders, Settings, Smile, Sticker, ArrowLeft, Save, Check, RefreshCw,
  X, Upload, RotateCw, Crop, LayoutGrid, Droplet,
  Highlighter, Palette, Sun, ChevronDown, PencilLine, ArrowDownRight, Wand2,
  Layers, ArrowUp, ArrowDown, Eye, FlipHorizontal,
  PanelTop, PanelBottom, MessageSquare, MessageSquareQuote, Flame, Tv, MessageCircle, Shield, Ban,
  AlignLeft, AlignCenter, AlignRight,
  Brush, SunMedium, ImagePlus, LayoutTemplate, Rows3, WandSparkles, ScanFace,
  CheckCheck, User
} from 'lucide-react';
import AiCaptionModal from './AiCaptionModal';
import MemeStylesModal, { TwitterVerifiedBadge, InstagramVerifiedBadge, InstagramLogo, WhatsAppLogo, IG_PRESET_IMAGES } from './MemeStylesModal';
import FaceMorphModal from './FaceMorphModal';
import MemeStickersBottomSheet from './editor/MemeStickersBottomSheet';
import EmojiBottomSheet from './editor/EmojiBottomSheet';
import TemplatePickerBottomSheet from './editor/TemplatePickerBottomSheet';
import PhotoFiltersBottomSheet from './editor/PhotoFiltersBottomSheet';
import BubbleChatBottomSheet from './editor/BubbleChatBottomSheet';
import FacePinpointOverlay from './FacePinpointOverlay';
import { downloadImageHelper } from '../utils/downloadHelper';
import { motion, AnimatePresence } from 'framer-motion';
import { MEME_TEMPLATES } from '../data/templates';
import { fetchOpenSourceMemes } from '../services/memeService';
import VideoTrimmer from './VideoTrimmer';
import AspectRatioDropdown from './AspectRatioDropdown';
import { PHOTO_FILTERS } from '../data/photoFilters';
import { safeGet, safeSet } from '../utils/storage';
import { blobToDataURL } from '../utils/galleryStore';
import {
  PRESET_PHRASES,
  BUBBLE_LAYOUT_OPTIONS,
  COLOR_SWATCHES,
  DRAW_COLORS,
  getNonOverlappingPosition,
  isColorDark,
} from '../utils/captionLayout';
import CanvasColorPicker from './editor/CanvasColorPicker';
import { TEXT_EFFECTS, secondaryVariants } from './editor/constants';
import { isSocialCardCaption, getContrastStroke, isVideoUrl } from './editor/memeEditorUtils';
import {
  createMemeEditorStore,
  MemeEditorStoreContext,
  useMemeEditorStore,
  useMemeEditorHistory,
} from './editor/store/useMemeEditorStore';
import { useEditorShortcuts } from './editor/hooks/useEditorShortcuts';
import { useExport, triggerConfetti } from './editor/hooks/useExport';
import { useBackgroundRemoval } from './editor/hooks/useBackgroundRemoval';
import { useFaceMorph } from './editor/hooks/useFaceMorph';
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
  const setAspectRatio = useMemeEditorStore((s) => s.setAspectRatio);
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
  const canUndo = useMemeEditorHistory((s) => s.pastStates.length > 0);
  const canRedo = useMemeEditorHistory((s) => s.futureStates.length > 0);

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

  // Watermark state â€” persisted in localStorage (quota-safe: session state survives write failures)
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
      tweetTime: data.time || '10:42 PM Â· Oct 8, 2026',
      tweetMetrics: data.metrics || (TWEET_TREND_PRESETS?.viral?.text || 'ðŸ’¬ 14.2K    ðŸ” 62.8K    â¤ï¸ 420.5K    ðŸ“Š 18.2M'),
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
    const contactName = data.contactName || 'Mom â¤ï¸';
    const status = data.status || 'online';
    const text = data.text || 'Please remember to eat vegetables and donâ€™t stay up until 4 AM arguing with strangers on the internet.';
    const direction = data.direction || 'received';
    const ticks = data.ticks || 'blue';
    const time = data.time || '11:42 PM';
    const messages = (data.messages && Array.isArray(data.messages) && data.messages.length > 0)
      ? data.messages
      : [
          { id: 'm1', text: text, direction: direction, time: time, ticks: ticks },
          { id: 'm2', text: 'I am eating healthy right now mom! ðŸ‘', direction: 'sent', time: '11:43 PM', ticks: 'blue' },
          { id: 'm3', text: 'Pizza is not a vegetable. I can see your location at Dominoâ€™s.', direction: 'received', time: '11:44 PM', ticks: 'blue' }
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

    const ASPECT_RATIOS = [
    { value: 'original', label: 'Original Image' },
    { value: '1:1', label: '1:1 (Square)' },
    { value: '4:5', label: '4:5 (Portrait)' },
    { value: '9:16', label: '9:16 (Story)' },
    { value: '16:9', label: '16:9 (Video)' }
  ];

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
          {/* Header */}
          <div className="editor-topbar glass-card flex-between" style={{ gap: '4px' }}>
            <div className="header-left" style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
              <button className="btn btn-ghost btn-xs export-back-btn back-btn" onClick={() => setIsExportModalOpen(false)}>
                <ArrowLeft className="icon-sm" /> <span>Back</span>
              </button>
            </div>
            <div className="header-center" style={{ flex: 2, display: 'flex', justifyContent: 'center' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', color: 'var(--cyber-cyan)' }}>
                <span>Preview & Export</span>
              </h2>
            </div>
            <div className="header-right" style={{ flex: 1 }}></div>
          </div>
          <div className="export-content">
            <div className="export-title-panel" style={{ marginBottom: '16px', width: '100%', padding: '0 8px' }}>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px', margin: 0 }}>
                <label style={{ margin: 0, whiteSpace: 'nowrap', fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', textTransform: 'none' }}>Title:</label>
                <input type="text" className="form-input" placeholder="e.g. Funny Cat Meme" value={memeCustomName} onChange={(e) => setMemeCustomName(e.target.value)} style={{ fontSize: '1rem', padding: '10px 14px', flex: 1, margin: 0, borderRadius: '24px' }} />
              </div>
            </div>
            <div className="export-preview-panel">
              {exportedImageUri ? (
                <img src={exportedImageUri} alt="Preview Meme" className="export-preview-img shadow-2xl" />
              ) : (
                <div className="flex-center" style={{ height: '300px', width: '100%' }}>
                  <RefreshCw className="icon-md animate-spin text-muted" />
                </div>
              )}
            </div>
            <div className="export-controls-panel">
              {/* Format & File Size / Discord Optimizer Panel */}
              <div
                style={{
                  background: 'var(--bg-surface-1)',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid var(--glass-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  width: '100%',
                  marginBottom: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Format:</span>
                    <div style={{ display: 'flex', background: 'var(--bg-surface-2)', borderRadius: '8px', padding: '2px', border: '1px solid var(--glass-border)' }}>
                      {['png', 'jpeg', 'webp'].map(fmt => (
                        <button
                          key={fmt}
                          type="button"
                          className={`btn btn-xs ${exportFormat === fmt ? 'btn-primary' : 'btn-ghost'}`}
                          onClick={() => handleSelectExportFormat(fmt)}
                          style={{ fontSize: '0.72rem', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}
                        >
                          {fmt === 'jpeg' ? 'JPG' : fmt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Presets */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      type="button"
                      className={`btn btn-xs ${exportPreset === 'hd' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleSelectExportPreset('hd')}
                      style={{ fontSize: '0.72rem', borderRadius: '8px', padding: '3px 8px' }}
                    >
                      HD Lossless
                    </button>
                    <button
                      type="button"
                      className={`btn btn-xs ${exportPreset === 'discord' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleSelectExportPreset('discord')}
                      title="Optimized to upload under Discord's 8MB limit"
                      style={{ fontSize: '0.72rem', borderRadius: '8px', padding: '3px 8px' }}
                    >
                      Discord &lt;8MB
                    </button>
                    <button
                      type="button"
                      className={`btn btn-xs ${exportPreset === 'compact' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleSelectExportPreset('compact')}
                      title="Fast compressed WebP/JPG"
                      style={{ fontSize: '0.72rem', borderRadius: '8px', padding: '3px 8px' }}
                    >
                      Compact
                    </button>
                  </div>
                </div>

                {/* Quality & Estimated Size Bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  {exportFormat !== 'png' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Quality: {Math.round(exportQuality * 100)}%</span>
                      <input
                        type="range"
                        min="0.3"
                        max="1.0"
                        step="0.05"
                        value={exportQuality}
                        onChange={(e) => handleSelectExportQuality(parseFloat(e.target.value))}
                        style={{ flex: 1, accentColor: 'var(--cyber-cyan)', height: '4px' }}
                      />
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Pixel-perfect sharp graphics & text</span>
                  )}

                  {exportFileSize && (
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--cyber-cyan)', background: 'rgba(6, 182, 212, 0.12)', padding: '2px 8px', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                      Size: {exportFileSize > 1024 * 1024 ? `${(exportFileSize / (1024 * 1024)).toFixed(2)} MB` : `${Math.round(exportFileSize / 1024)} KB`}
                    </span>
                  )}
                </div>
              </div>

              <div className="export-actions">
                <button className={`btn ${isSaved ? 'btn-success' : 'btn-secondary'} hover-lift`} onClick={() => { handleConfirmSave(); }}>
                  {isSaved ? <><Check className="icon-sm" /> <span>Saved to Gallery</span></> : <><Save className="icon-sm" /> <span>Save to Gallery</span></>}
                </button>
                <button className="btn btn-primary shadow-glow" onClick={handleDownloadImage}>
                  <Download className="icon-sm" /> <span>Download {exportFormat.toUpperCase() === 'JPEG' ? 'JPG' : exportFormat.toUpperCase()}</span>
                </button>
                <button
                  className="btn btn-secondary hover-lift"
                  onClick={handleCopyToClipboard}
                  title={clipboardCopied ? 'Image copied!' : 'Copy image to clipboard â€” paste into Discord, Twitter, etc.'}
                  style={{
                    background: clipboardCopied ? 'rgba(34, 197, 94, 0.15)' : undefined,
                    borderColor: clipboardCopied ? 'rgba(34, 197, 94, 0.4)' : undefined,
                    color: clipboardCopied ? '#22c55e' : undefined,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {clipboardCopied ? <Check className="icon-sm" /> : <Copy className="icon-sm" />}
                  <span>{clipboardCopied ? 'Copied!' : 'Copy Image'}</span>
                </button>
                <button
                  className="btn btn-secondary hover-lift"
                  onClick={handleShareImage}
                  title={shareCopied ? 'Copied to clipboard!' : (typeof navigator !== 'undefined' && navigator.canShare ? 'Share' : 'Copy link')}
                  style={{
                    background: shareCopied ? 'rgba(34, 197, 94, 0.15)' : undefined,
                    borderColor: shareCopied ? 'rgba(34, 197, 94, 0.4)' : undefined,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Share2 className="icon-sm" />
                  <span>{shareCopied ? 'Copied!' : 'Share'}</span>
                </button>
              </div>
              <p className="export-help-text">Your meme will be safely stored in your browser's local storage gallery.</p>
            </div>
          </div>
        </motion.div>
      ) : (
    <div className="meme-editor-container animate-fade-in">
      {/* Editor Top Bar (Mobile-Friendly Compact) */}
      <div className="editor-topbar glass-card flex-between">
        <button className="btn btn-ghost btn-xs back-btn" onClick={onBack}>
          <ArrowLeft className="icon-sm" /> Back
        </button>

        <div className="history-actions flex-gap">
          <button
            className="btn btn-icon btn-xs hover-lift"
            onClick={handleUndo}
            disabled={!canUndo}
            title="Undo"
            style={{ 
              opacity: canUndo ? 1 : 0.4, 
              cursor: canUndo ? 'pointer' : 'not-allowed',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              padding: '8px',
              color: 'currentColor',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Undo className="icon-xs" />
          </button>
          <button
            className="btn btn-icon btn-xs hover-lift"
            onClick={handleRedo}
            disabled={!canRedo}
            title="Redo"
            style={{ 
              opacity: canRedo ? 1 : 0.4, 
              cursor: canRedo ? 'pointer' : 'not-allowed',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              padding: '8px',
              color: 'currentColor',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Redo className="icon-xs" />
          </button>
          <div style={{ display: 'none' }}></div>
        </div>

        <div className="header-actions flex-gap" style={{ display: 'flex', alignItems: 'center' }}>
          <AspectRatioDropdown 
            value={aspectRatio}
            onChange={(val) => {
              setAspectRatio(val);
              pushHistoryDebounced();
            }}
            options={ASPECT_RATIOS}
          />

          <div style={{ position: 'relative' }} ref={exportDropdownRef}>
            <motion.button
              className="btn btn-primary shadow-glow btn-xs"
              whileTap={{ scale: 0.95 }}
              onClick={() => setExportDropdownOpen(prev => !prev)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Download className="icon-xs" />
              <span>Export</span>
              <ChevronDown className="icon-xs" style={{ transition: 'transform 0.2s', transform: exportDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </motion.button>

            <AnimatePresence>
              {exportDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    minWidth: '190px',
                    background: 'rgba(18, 18, 26, 0.92)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '14px',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
                    zIndex: 9999,
                    overflow: 'hidden',
                    padding: '6px'
                  }}
                >
                  {[
                    { icon: <Download style={{width:16,height:16}} />, label: 'Download PNG', action: (uri) => {
                      const filename = `meme-${template?.id || 'custom'}-${Date.now()}.png`;
                      downloadImageHelper(uri, filename);
                      triggerConfetti();
                    }},
                    { icon: <Copy style={{width:16,height:16}} />, label: 'Copy Image', action: async (uri) => {
                      try {
                        const res = await fetch(uri);
                        const blob = await res.blob();
                        if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
                          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                        } else {
                          await navigator.clipboard.writeText(uri);
                        }
                        triggerConfetti();
                      } catch(e) { console.warn(e); }
                    }},
                    { icon: <Share2 style={{width:16,height:16}} />, label: 'Share', action: async (uri) => {
                      try {
                        const res = await fetch(uri);
                        const blob = await res.blob();
                        const file = new File([blob], `meme-${Date.now()}.png`, { type: 'image/png' });
                        if (navigator.canShare && navigator.canShare({ files: [file] })) {
                          await navigator.share({ title: memeCustomName || 'My Meme', text: 'Check out this meme! ðŸ˜‚', files: [file] });
                          triggerConfetti();
                        } else {
                          await navigator.clipboard.writeText(uri);
                        }
                      } catch(e) { if (e.name !== 'AbortError') console.warn(e); }
                    }},
                    { icon: <Save style={{width:16,height:16}} />, label: 'Save to Gallery', action: (uri) => {
                      const finalName = memeCustomName.trim() || 'My Meme';
                      onSaveToGallery({
                        id: `meme-${Date.now()}`,
                        name: finalName,
                        imageUrl: uri,
                        rawImageUrl: template?.rawImageUrl || template?.imageUrl,
                        captions: JSON.parse(JSON.stringify(captions)),
                        stickers: JSON.parse(JSON.stringify(stickers)),
                        imageLayers: JSON.parse(JSON.stringify(imageLayers)),
                        aspectRatio, imageFit, isNativeLayout, layoutDef, slotImages, slotTransforms,
                        createdAt: new Date().toISOString()
                      });
                      triggerConfetti();
                    }},
                  ].map(({ icon, label, action }, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuickExport(action)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        width: '100%',
                        padding: '10px 14px',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '10px',
                        color: 'rgba(255,255,255,0.85)',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {icon} {label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
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

              {/* â”€â”€â”€ Bottom Toolbars Dock Anchor (Main Toolbar on top of main dock, Layer Toolbar floats above it) â”€â”€â”€ */}
              <div className="editor-toolbars-dock-anchor">
                {/* â”€â”€â”€ Layer Toolbar (Secondary Toolbar) â”€â”€â”€ */}
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

                    {/* 14. Die-Cut Color Picker â€” Appears on Secondary Toolbar when Die-Cut is active on sticker / emoji */}
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
                        <div className="sec-bar-layer-actions">
                          {activeCaption && !isSocialCardCaption(activeCaption) && (
                            <>
                              <button
                                type="button"
                                className="layer-action-btn layer-action-btn-case"
                                title="Toggle Text Case (ALL CAPS / Sentence case / lowercase)"
                                aria-label="Toggle Text Case"
                                onClick={handleToggleTextCase}
                              >
                                <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.86rem' }}>Aa</span>
                              </button>
                              <div className="layer-action-divider" />

                              <button
                                type="button"
                                className="layer-action-btn layer-action-btn-align"
                                title={`Text Alignment: ${(activeCaption.align || 'center').toUpperCase()} (Click to cycle Left, Center, Right)`}
                                aria-label={`Text Alignment: ${activeCaption.align || 'center'}`}
                                onClick={handleCycleTextAlignment}
                              >
                                {(activeCaption.align === 'left') ? (
                                  <AlignLeft style={{ width: 16, height: 16 }} />
                                ) : (activeCaption.align === 'right') ? (
                                  <AlignRight style={{ width: 16, height: 16 }} />
                                ) : (
                                  <AlignCenter style={{ width: 16, height: 16 }} />
                                )}
                              </button>
                              <div className="layer-action-divider" />
                            </>
                          )}

                          {activeImageLayer && (
                            <>
                              <button
                                type="button"
                                className={`layer-action-btn layer-action-btn-crop ${activeImageLayer.fitMode === 'crop' ? 'active' : ''}`}
                                title={activeImageLayer.fitMode === 'crop' ? 'Exit Crop' : 'Crop'}
                                aria-label={activeImageLayer.fitMode === 'crop' ? 'Exit Crop' : 'Crop'}
                                onClick={() => updateActiveImageLayer('fitMode', activeImageLayer.fitMode === 'crop' ? 'fit' : 'crop')}
                              >
                                <Crop style={{ width: 16, height: 16 }} />
                              </button>
                              <div className="layer-action-divider" />

                              <button
                                type="button"
                                className={`layer-action-btn layer-action-btn-flip ${activeImageLayer.flipX ? 'active' : ''}`}
                                title="Flip Horizontal (Mirror)"
                                aria-label="Flip Horizontal"
                                onClick={handleFlipActiveLayer}
                              >
                                <FlipHorizontal style={{ width: 16, height: 16 }} />
                              </button>
                              <div className="layer-action-divider" />
                            </>
                          )}

                          <button
                            type="button"
                            className="layer-action-btn layer-action-btn-rotate"
                            title="Rotate 90Â°"
                            aria-label="Rotate 90Â°"
                            onClick={handleRotateLayer}
                          >
                            <RotateCw style={{ width: 16, height: 16 }} />
                          </button>

                          <div className="layer-action-divider" />

                          <button
                            type="button"
                            className="layer-action-btn layer-action-btn-duplicate"
                            title="Duplicate Layer"
                            aria-label="Duplicate Layer"
                            onClick={() => handleDuplicateLayer()}
                          >
                            <Copy style={{ width: 16, height: 16 }} />
                          </button>

                          <div className="layer-action-divider" />

                          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                            <button
                              type="button"
                              className={`layer-action-btn layer-action-btn-layers ${showLayerMenu ? 'active' : ''}`}
                              title="Layer Order"
                              aria-label="Layer Order"
                              onClick={() => setShowLayerMenu(!showLayerMenu)}
                            >
                              <Layers style={{ width: 16, height: 16 }} />
                            </button>

                            {showLayerMenu && (
                              <div
                                className="sec-bar-layer-order-popover"
                                style={{
                                  position: 'absolute',
                                  bottom: 'calc(100% + 8px)',
                                  left: '50%',
                                  transform: 'translateX(-50%)'
                                }}
                              >
                                <button
                                  type="button"
                                  className="layer-action-popover-btn"
                                  title="Bring Forward"
                                  aria-label="Bring Forward"
                                  onClick={() => moveLayer(activeLayerId, 'forward')}
                                >
                                  <ArrowUp style={{ width: 14, height: 14 }} />
                                </button>
                                <div className="layer-action-divider" />
                                <button
                                  type="button"
                                  className="layer-action-popover-btn"
                                  title="Send Backward"
                                  aria-label="Send Backward"
                                  onClick={() => moveLayer(activeLayerId, 'backward')}
                                >
                                  <ArrowDown style={{ width: 14, height: 14 }} />
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="layer-action-divider" />

                          <button
                            type="button"
                            className="layer-action-btn layer-action-btn-delete"
                            title="Delete Layer"
                            aria-label="Delete Layer"
                            onClick={() => handleDeleteLayer()}
                          >
                            <Trash2 style={{ width: 16, height: 16 }} />
                          </button>
                        </div>
                      </motion.div>
                    )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>

            {/* â”€â”€â”€ 2. Main Context Toolbar â”€â”€â”€ */}
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
                  {activeCaption && (
                    activeCaption.isTweetCard ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <button
                          type="button"
                          className={`btn btn-xs vid-ctx-btn ${showStylesModal ? 'active' : ''}`}
                          onClick={() => handleOpenSocialModalForActiveCard('tweet')}
                          title="Tweet Card Settings"
                          aria-label="Tweet Card Settings"
                          style={{
                            padding: '4px 8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '8px',
                            flexShrink: 0,
                            background: showStylesModal ? 'rgba(29, 155, 240, 0.45)' : 'rgba(29, 155, 240, 0.22)',
                            border: showStylesModal ? '1.5px solid #1d9bf0' : '1px solid #1d9bf0',
                            boxShadow: showStylesModal ? '0 0 10px rgba(29, 155, 240, 0.5)' : 'none',
                            color: '#ffffff'
                          }}
                        >
                          <Settings style={{ width: 14, height: 14, color: '#1d9bf0' }} />
                        </button>

                        <button
                          type="button"
                          className={`btn btn-xs vid-ctx-btn ${activeCaption.tweetVerified !== false ? 'active' : ''}`}
                          onClick={() => updateActiveCaptionProps({ tweetVerified: activeCaption.tweetVerified === false })}
                          title="Toggle Verified Badge"
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            borderRadius: '8px',
                            flexShrink: 0,
                            background: activeCaption.tweetVerified !== false ? 'rgba(29, 155, 240, 0.28)' : 'rgba(255, 255, 255, 0.08)',
                            border: activeCaption.tweetVerified !== false ? '1px solid #1d9bf0' : '1px solid rgba(255, 255, 255, 0.1)',
                            color: activeCaption.tweetVerified !== false ? '#ffffff' : 'rgba(255, 255, 255, 0.85)'
                          }}
                        >
                          <TwitterVerifiedBadge size={14} color="#ffffff" checkColor={activeCaption.tweetVerified !== false ? "#1d9bf0" : "#0f172a"} />
                          <span>Verified</span>
                        </button>

                        <button
                          type="button"
                          className={`btn btn-xs vid-ctx-btn ${activeSubmenu === 'tweetTheme' ? 'active' : ''}`}
                          onClick={() => handleToggleSubmenu('tweetTheme')}
                          title="Change Theme (Dim, Dark, White)"
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            borderRadius: '8px',
                            flexShrink: 0,
                            background: activeSubmenu === 'tweetTheme' ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.08)',
                            border: activeSubmenu === 'tweetTheme' ? '1px solid var(--cyber-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#ffffff'
                          }}
                        >
                          <Palette style={{ width: 13, height: 13, color: '#ffffff' }} />
                          <span>Theme</span>
                        </button>

                        <button
                          type="button"
                          className={`btn btn-xs vid-ctx-btn ${activeSubmenu === 'tweetTrend' ? 'active' : ''}`}
                          onClick={() => handleToggleSubmenu('tweetTrend')}
                          title="Change Trend Metrics (Viral, Casual, Ratioed)"
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            borderRadius: '8px',
                            flexShrink: 0,
                            background: activeSubmenu === 'tweetTrend' ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.08)',
                            border: activeSubmenu === 'tweetTrend' ? '1px solid var(--cyber-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#ffffff'
                          }}
                        >
                          <Flame style={{ width: 13, height: 13, color: '#ffffff' }} />
                          <span>Trend</span>
                        </button>
                      </div>
                    ) : activeCaption.isInstagramCard ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <button
                          type="button"
                          className={`btn btn-xs vid-ctx-btn ${showStylesModal ? 'active' : ''}`}
                          onClick={() => handleOpenSocialModalForActiveCard('instagram')}
                          title="Instagram Post Settings"
                          aria-label="Instagram Post Settings"
                          style={{
                            padding: '4px 8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '8px',
                            flexShrink: 0,
                            background: showStylesModal ? 'rgba(244, 63, 94, 0.45)' : 'rgba(244, 63, 94, 0.22)',
                            border: showStylesModal ? '1.5px solid #f43f5e' : '1px solid #f43f5e',
                            boxShadow: showStylesModal ? '0 0 10px rgba(244, 63, 94, 0.5)' : 'none',
                            color: '#ffffff'
                          }}
                        >
                          <Settings style={{ width: 14, height: 14, color: '#f43f5e' }} />
                        </button>

                        {/* Custom Post Photo Uploader */}
                        <label
                          className="btn btn-xs vid-ctx-btn"
                          title="Upload Custom Post Photo"
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            borderRadius: '8px',
                            flexShrink: 0,
                            background: 'rgba(255, 94, 54, 0.22)',
                            border: '1px solid #ff5e36',
                            color: '#ffffff',
                            cursor: 'pointer'
                          }}
                        >
                          <Upload style={{ width: 13, height: 13 }} />
                          <span>Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  updateActiveCaptionProps({ igPostImage: ev.target.result });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>

                        <button
                          type="button"
                          className={`btn btn-xs vid-ctx-btn ${activeCaption.igVerified !== false ? 'active' : ''}`}
                          onClick={() => updateActiveCaptionProps({ igVerified: activeCaption.igVerified === false })}
                          title="Toggle Verified Badge"
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            borderRadius: '8px',
                            flexShrink: 0,
                            background: activeCaption.igVerified !== false ? 'rgba(0, 149, 246, 0.28)' : 'rgba(255, 255, 255, 0.08)',
                            border: activeCaption.igVerified !== false ? '1px solid #0095f6' : '1px solid rgba(255, 255, 255, 0.1)',
                            color: activeCaption.igVerified !== false ? '#ffffff' : 'rgba(255, 255, 255, 0.85)'
                          }}
                        >
                          <InstagramVerifiedBadge size={14} />
                          <span>Verified</span>
                        </button>

                        <button
                          type="button"
                          className={`btn btn-xs vid-ctx-btn ${activeCaption.igHasStoryRing !== false ? 'active' : ''}`}
                          onClick={() => updateActiveCaptionProps({ igHasStoryRing: activeCaption.igHasStoryRing === false })}
                          title="Toggle Gradient Story Ring"
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            borderRadius: '8px',
                            flexShrink: 0,
                            background: activeCaption.igHasStoryRing !== false ? 'rgba(244, 63, 94, 0.28)' : 'rgba(255, 255, 255, 0.08)',
                            border: activeCaption.igHasStoryRing !== false ? '1px solid #f43f5e' : '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#ffffff'
                          }}
                        >
                          <div style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
                            border: '1.5px solid #fff'
                          }} />
                          <span>Story Ring</span>
                        </button>

                        <button
                          type="button"
                          className={`btn btn-xs vid-ctx-btn ${activeSubmenu === 'igTheme' ? 'active' : ''}`}
                          onClick={() => handleToggleSubmenu('igTheme')}
                          title="Change Instagram Theme (Dark / Light)"
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            borderRadius: '8px',
                            flexShrink: 0,
                            background: activeSubmenu === 'igTheme' ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.08)',
                            border: activeSubmenu === 'igTheme' ? '1px solid var(--cyber-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#ffffff'
                          }}
                        >
                          <Palette style={{ width: 13, height: 13, color: '#ffffff' }} />
                          <span>Theme</span>
                        </button>
                      </div>
                    ) : activeCaption.isWhatsAppCard ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <button
                          type="button"
                          className={`btn btn-xs vid-ctx-btn ${showStylesModal ? 'active' : ''}`}
                          onClick={() => handleOpenSocialModalForActiveCard('whatsapp')}
                          title="WhatsApp Chat Settings"
                          aria-label="WhatsApp Chat Settings"
                          style={{
                            padding: '4px 8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '8px',
                            flexShrink: 0,
                            background: showStylesModal ? 'rgba(34, 197, 94, 0.45)' : 'rgba(34, 197, 94, 0.22)',
                            border: showStylesModal ? '1.5px solid #22c55e' : '1px solid #22c55e',
                            boxShadow: showStylesModal ? '0 0 10px rgba(34, 197, 94, 0.5)' : 'none',
                            color: '#ffffff'
                          }}
                        >
                          <Settings style={{ width: 14, height: 14, color: '#22c55e' }} />
                        </button>

                        {/* Add Message Button */}
                        <button
                          type="button"
                          className="btn btn-xs vid-ctx-btn"
                          onClick={() => {
                            const curMsgs = activeCaption.waMessages && activeCaption.waMessages.length > 0
                              ? activeCaption.waMessages
                              : [{ id: 'm1', text: activeCaption.text || '', direction: activeCaption.waDirection || 'received', time: activeCaption.waTime || '11:42 PM', ticks: activeCaption.waTicks || 'blue' }];
                            const lastMsg = curMsgs[curMsgs.length - 1];
                            const nextDir = lastMsg?.direction === 'sent' ? 'received' : 'sent';
                            const newMsg = {
                              id: `m_${Date.now()}`,
                              text: nextDir === 'sent' ? 'Sounds great!' : 'Check this out!',
                              direction: nextDir,
                              time: '11:45 PM',
                              ticks: 'blue'
                            };
                            updateActiveCaptionProps({ waMessages: [...curMsgs, newMsg] });
                          }}
                          title="Add New Message to WhatsApp Thread"
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            borderRadius: '8px',
                            flexShrink: 0,
                            background: 'rgba(37, 211, 102, 0.28)',
                            border: '1px solid #25d366',
                            color: '#ffffff'
                          }}
                        >
                          <Plus style={{ width: 13, height: 13 }} />
                          <span>+ Msg</span>
                        </button>

                        <button
                          type="button"
                          className={`btn btn-xs vid-ctx-btn ${activeCaption.waShowHeader !== false ? 'active' : ''}`}
                          onClick={() => updateActiveCaptionProps({ waShowHeader: activeCaption.waShowHeader === false })}
                          title="Toggle WhatsApp Contact Header"
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            borderRadius: '8px',
                            flexShrink: 0,
                            background: activeCaption.waShowHeader !== false ? 'rgba(37, 211, 102, 0.28)' : 'rgba(255, 255, 255, 0.08)',
                            border: activeCaption.waShowHeader !== false ? '1px solid #25d366' : '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#ffffff'
                          }}
                        >
                          <User style={{ width: 13, height: 13 }} />
                          <span>Header</span>
                        </button>

                        {activeCaption.waDirection === 'sent' && (
                          <button
                            type="button"
                            className={`btn btn-xs vid-ctx-btn ${activeSubmenu === 'waTicks' ? 'active' : ''}`}
                            onClick={() => handleToggleSubmenu('waTicks')}
                            title="Change Read Receipt Ticks (Blue / Grey / Single)"
                            style={{
                              padding: '4px 10px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              borderRadius: '8px',
                              flexShrink: 0,
                              background: activeSubmenu === 'waTicks' ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.08)',
                              border: activeSubmenu === 'waTicks' ? '1px solid var(--cyber-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
                              color: '#ffffff'
                            }}
                          >
                            <CheckCheck style={{ width: 13, height: 13, color: '#53bdeb' }} />
                            <span>Ticks</span>
                          </button>
                        )}

                        <button
                          type="button"
                          className={`btn btn-xs vid-ctx-btn ${activeSubmenu === 'waTheme' ? 'active' : ''}`}
                          onClick={() => handleToggleSubmenu('waTheme')}
                          title="Change WhatsApp Theme (Dark / Light)"
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            borderRadius: '8px',
                            flexShrink: 0,
                            background: activeSubmenu === 'waTheme' ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.08)',
                            border: activeSubmenu === 'waTheme' ? '1px solid var(--cyber-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#ffffff'
                          }}
                        >
                          <Palette style={{ width: 13, height: 13, color: '#ffffff' }} />
                          <span>Theme</span>
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        {/* 1. Font Button */}
                        <button
                          type="button"
                          data-setting-btn="font"
                          className={`btn btn-xs vid-ctx-btn vid-ctx-btn-font ${activeSubmenu === 'font' ? 'active' : ''}`}
                          title="Change Font"
                          onClick={() => handleToggleSubmenu('font')}
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            borderRadius: '8px',
                            background: activeSubmenu === 'font' ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.08)',
                            border: activeSubmenu === 'font' ? '1px solid var(--cyber-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: activeSubmenu === 'font' ? '0 2px 10px rgba(6, 182, 212, 0.4), 0 0 8px rgba(99, 102, 241, 0.4)' : 'none',
                            transition: 'all 0.2s ease',
                            color: '#ffffff',
                            flexShrink: 0
                          }}
                        >
                          <Type className="vid-font-icon" style={{ width: 14, height: 14, color: '#ffffff' }} />
                          <span>{activeFontObj ? activeFontObj.id : (activeCaption.fontFamily || 'Impact').split(/[\s,]+/)[0].replace(/^[-'"]+|['"]+$/g, '')}</span>
                        </button>

                        {/* 3. Color Button */}
                        <button
                          type="button"
                          data-setting-btn="color"
                          className={`btn btn-xs vid-ctx-btn vid-ctx-btn-color ${activeSubmenu === 'color' ? 'active' : ''}`}
                          onClick={() => handleToggleSubmenu('color')}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            borderRadius: '8px',
                            background: activeSubmenu === 'color' ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.08)',
                            border: activeSubmenu === 'color' ? '1px solid var(--cyber-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: activeSubmenu === 'color' ? '0 2px 10px rgba(6, 182, 212, 0.4), 0 0 8px rgba(99, 102, 241, 0.4)' : 'none',
                            color: '#ffffff',
                            flexShrink: 0,
                            cursor: 'pointer'
                          }}
                          title="Text Fill Color"
                        >
                          <div
                            className="vid-color-swatch-disc"
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              background: activeCaption.color || '#fff',
                              border: '2px solid rgba(255,255,255,0.85)',
                              boxShadow: `0 0 6px ${activeCaption.color || 'rgba(255,255,255,0.4)'}`
                            }}
                          />
                          <span>Color</span>
                        </button>

                        {/* 4. Box Button */}
                        {(() => {
                          const hasBg = Boolean(activeCaption.bgColor && activeCaption.bgColor !== 'none' && activeCaption.bgColor !== 'transparent');

                          return (
                            <button
                              type="button"
                              data-setting-btn="bg"
                              className={`btn btn-xs vid-ctx-btn vid-ctx-btn-bg ${activeSubmenu === 'bg' ? 'active' : ''}`}
                              title={hasBg ? `Text Box Active (${activeCaption.bgColor}) - Click to toggle options` : "Text Box - Click to apply and change color"}
                              onClick={() => {
                                if (activeSubmenu === 'bg') {
                                  handleToggleSubmenu('bg');
                                } else {
                                  handleToggleSubmenu('bg');
                                  if (!hasBg) {
                                    handleSetCaptionBg('white');
                                  }
                                }
                              }}
                              style={{
                                padding: '4px 10px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                borderRadius: '8px',
                                background: activeSubmenu === 'bg' ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.08)',
                                border: activeSubmenu === 'bg' ? '1px solid var(--cyber-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
                                boxShadow: activeSubmenu === 'bg' ? '0 2px 10px rgba(6, 182, 212, 0.4), 0 0 8px rgba(99, 102, 241, 0.4)' : 'none',
                                transition: 'all 0.2s ease',
                                color: '#ffffff',
                                flexShrink: 0
                              }}
                            >
                              <span
                                className="vid-ctx-bg-badge"
                                style={{
                                  width: 16,
                                  height: 16,
                                  borderRadius: '3.5px',
                                  border: '1.5px solid #ffffff',
                                  background: 'transparent',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxSizing: 'border-box',
                                  flexShrink: 0,
                                  userSelect: 'none'
                                }}
                              >
                                <span
                                  style={{
                                    color: '#ffffff',
                                    fontWeight: 800,
                                    fontSize: '11px',
                                    lineHeight: 1,
                                    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                                    userSelect: 'none'
                                  }}
                                >
                                  A
                                </span>
                              </span>
                              <span>Box</span>
                            </button>
                          );
                        })()}

                        {/* 6. Blur Button */}
                        <button
                          type="button"
                          data-setting-btn="blur"
                          className={`btn btn-xs vid-ctx-btn vid-ctx-btn-blur ${activeSubmenu === 'blur' ? 'active' : ''}`}
                          title="Text Blur & Opacity settings"
                          onClick={() => handleToggleSubmenu('blur')}
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            borderRadius: '8px',
                            background: activeSubmenu === 'blur' ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.08)',
                            border: activeSubmenu === 'blur' ? '1px solid var(--cyber-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: activeSubmenu === 'blur' ? '0 2px 10px rgba(6, 182, 212, 0.4), 0 0 8px rgba(99, 102, 241, 0.4)' : 'none',
                            transition: 'all 0.2s ease',
                            color: '#ffffff',
                            flexShrink: 0
                          }}
                        >
                          <Droplet style={{ width: 13, height: 13, color: '#ffffff' }} />
                          <span>Blur</span>
                        </button>

                        {/* 7. Effects Button */}
                        <button
                          type="button"
                          data-setting-btn="effects"
                          className={`btn btn-xs vid-ctx-btn vid-ctx-btn-effects ${activeSubmenu === 'effects' ? 'active' : ''}`}
                          title="Text Effects (Arch, Smile, Shadow, Glow, Glitch, 3D, Hollow)"
                          onClick={() => handleToggleSubmenu('effects')}
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            borderRadius: '8px',
                            background: (activeSubmenu === 'effects' || (activeCaption.effect && activeCaption.effect !== 'flat') || activeCaption.curve) ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.08)',
                            border: (activeSubmenu === 'effects' || (activeCaption.effect && activeCaption.effect !== 'flat') || activeCaption.curve) ? '1px solid var(--cyber-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: (activeSubmenu === 'effects' || (activeCaption.effect && activeCaption.effect !== 'flat') || activeCaption.curve) ? '0 2px 10px rgba(6, 182, 212, 0.4), 0 0 8px rgba(99, 102, 241, 0.4)' : 'none',
                            transition: 'all 0.2s ease',
                            color: '#ffffff',
                            flexShrink: 0
                          }}
                        >
                          <Wand2 style={{ width: 13, height: 13, color: '#ffffff' }} />
                          <span>Effects</span>
                        </button>

                        {/* 8. Bubble Button - Opens BubbleChatBottomSheet */}
                        <button
                          type="button"
                          data-setting-btn="bubble"
                          className={`btn btn-xs vid-ctx-btn vid-ctx-btn-bubble ${showBubbleBottomSheet ? 'active' : ''}`}
                          title="Chat & Speech Bubbles (iPhone, WhatsApp, Comic)"
                          onClick={() => {
                            setShowBubbleBottomSheet(!showBubbleBottomSheet);
                            setActiveSubmenu(null);
                          }}
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            borderRadius: '8px',
                            flexShrink: 0,
                            background: (showBubbleBottomSheet || activeCaption.bubbleStyle) ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.08)',
                            border: (showBubbleBottomSheet || activeCaption.bubbleStyle) ? '1px solid var(--cyber-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: (showBubbleBottomSheet || activeCaption.bubbleStyle) ? '0 2px 10px rgba(6, 182, 212, 0.4), 0 0 8px rgba(99, 102, 241, 0.4)' : 'none',
                            transition: 'all 0.2s ease',
                            color: '#ffffff'
                          }}
                        >
                          <MessageSquareQuote style={{ width: 13, height: 13, color: '#ffffff' }} />
                          <span>Bubble</span>
                        </button>
                      </div>
                    )
                  )}

                  {/* Sticker controls */}
                  {activeSticker && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <button
                        type="button"
                        className={`btn btn-xs vid-ctx-btn ${activeSticker.flipX ? 'active' : ''}`}
                        title="Flip Horizontal (Mirror)"
                        aria-label="Flip Horizontal"
                        onClick={handleFlipActiveLayer}
                        style={{
                          padding: '4px 10px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          background: activeSticker.flipX ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.08)',
                          border: activeSticker.flipX ? '1px solid var(--cyber-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#ffffff',
                          borderRadius: '8px',
                          flexShrink: 0
                        }}
                      >
                        <FlipHorizontal style={{ width: 14, height: 14 }} />
                        <span>Flip</span>
                      </button>

                      <div
                        role="button"
                        tabIndex={0}
                        className={`btn btn-xs vid-ctx-btn ${activeSticker.dieCut ? 'active' : ''}`}
                        title={activeSticker.dieCut ? "Die-Cut Border (Active - click to disable)" : "Die-Cut Sticker Border (White Vinyl Outline)"}
                        onClick={() => handleToggleDieCutSticker()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleToggleDieCutSticker();
                          }
                        }}
                        style={{
                          padding: '4px 10px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          borderRadius: '8px',
                          background: activeSticker.dieCut ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.08)',
                          color: '#ffffff',
                          flexShrink: 0,
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                      >
                        <Shield style={{ width: 13, height: 13 }} />
                        <span>Die-Cut</span>
                      </div>
                    </div>
                  )}

                  {/* Image Layer controls */}
                  {activeImageLayer && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <button
                        className="btn btn-xs vid-ctx-btn"
                        title="AI Face Swap"
                        onClick={() => handleStartMorphFace(activeImageLayer)}
                        style={{
                          padding: '4px 10px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          borderRadius: '8px',
                          background: 'rgba(255,255,255,0.08)',
                          flexShrink: 0
                        }}
                      >
                        <ScanFace style={{ width: 13, height: 13, color: 'var(--cyber-cyan)' }} />
                        <span>Face Swap</span>
                      </button>

                      <button
                        className="btn btn-xs vid-ctx-btn"
                        title="Magic Eraser (Remove Background)"
                        onClick={handleRemoveBackground}
                        disabled={isRemovingBg}
                        style={{
                          padding: '4px 10px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: isRemovingBg ? 'rgba(255,255,255,0.1)' : 'var(--primary-gradient)',
                          color: '#fff',
                          borderRadius: '8px',
                          flexShrink: 0
                        }}
                      >
                        <Wand2 style={{ width: 13, height: 13 }} className={isRemovingBg ? "spin" : ""} />
                        <span>{activeImageLayer?.originalUrl ? 'Undo BG' : 'BG Eraser'}</span>
                      </button>

                      <button
                        className={`btn btn-xs vid-ctx-btn ${showFiltersModal ? 'active' : ''}`}
                        title="Filters"
                        onClick={() => setShowFiltersModal(true)}
                        style={{
                          padding: '4px 10px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          borderRadius: '8px',
                          background: showFiltersModal ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.08)'
                        }}
                      >
                        <Sparkles style={{ width: 13, height: 13 }} />
                        <span>Filters</span>
                      </button>
                    </div>
                  )}



                  {/* ON-TEMPLATE FACE MORPH TOOLBAR */}
                  {templateFaceMorph && !(activeCaption || activeSticker || activeImageLayer) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <button
                        className="btn btn-xs vid-ctx-btn"
                        title="Pick a different face or photo"
                        onClick={handleChangeFace}
                        style={{
                          padding: '4px 11px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          color: '#ffffff',
                          border: '1px solid var(--glass-border)',
                          flexShrink: 0
                        }}
                      >
                        <RefreshCw style={{ width: 12, height: 12, color: 'var(--cyber-cyan)' }} />
                        <span>Change Face</span>
                      </button>

                      <button
                        className="btn btn-xs vid-ctx-btn"
                        title="Cancel face swap and revert"
                        onClick={handleRevertTemplateFace}
                        style={{
                          padding: '4px 11px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          borderRadius: '8px',
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: '#f87171',
                          border: '1px solid rgba(239, 68, 68, 0.35)',
                          flexShrink: 0
                        }}
                      >
                        <X style={{ width: 12, height: 12 }} />
                        <span>Cancel</span>
                      </button>

                      <button
                        className="btn btn-xs vid-ctx-btn active"
                        title="Accept face swap"
                        onClick={handleFinalizeTemplateFace}
                        style={{
                          padding: '4px 14px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          borderRadius: '8px',
                          background: 'var(--primary-gradient)',
                          color: '#ffffff',
                          border: '1px solid var(--cyber-cyan)',
                          flexShrink: 0
                        }}
                      >
                        <Check style={{ width: 12, height: 12 }} />
                        <span>Done</span>
                      </button>

                      <button
                        className="btn btn-icon btn-xs vid-ctx-btn"
                        title="Hold to see original without face swap"
                        onPointerDown={() => setIsHoldingCanvasCompare(true)}
                        onPointerUp={() => setIsHoldingCanvasCompare(false)}
                        onPointerLeave={() => setIsHoldingCanvasCompare(false)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '8px',
                          background: isHoldingCanvasCompare ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.08)',
                          border: isHoldingCanvasCompare ? '1px solid var(--cyber-cyan)' : '1px solid var(--glass-border)',
                          flexShrink: 0
                        }}
                      >
                        <Eye style={{ width: 14, height: 14, color: isHoldingCanvasCompare ? '#ffffff' : 'var(--cyber-cyan)' }} />
                      </button>
                    </div>
                  )}

                  {/* TAB SPECIFIC TOOLS (when nothing selected and not in template face morph) */}
                  {/* TEXT TAB */}
                  {!(activeCaption || activeSticker || activeImageLayer) && !templateFaceMorph && activeTab === "text" && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                      <button
                        className="btn btn-xs vid-ctx-btn vid-ctx-btn-primary vid-ctx-btn-add-text"
                        data-action="add-text"
                        onClick={handleAddCaption}
                        title="Add Text Caption"
                      >
                        <Plus style={{ width: 14, height: 14, color: '#ffffff' }} /> <span>Add Text</span>
                      </button>

                      <button
                        type="button"
                        data-setting-btn="banner"
                        className={`btn btn-xs vid-ctx-btn vid-ctx-btn-banner ${(canvasHeader.enabled || canvasFooter.enabled || activeSubmenu === 'banner') ? 'active' : ''}`}
                        onClick={() => handleToggleSubmenu('banner')}
                        title="Header & Footer Canvas Extensions (Top / Bottom)"
                      >
                        <Rows3 style={{ width: 13, height: 13, color: '#ffffff' }} />
                        <span>Header / Footer</span>
                      </button>

                      <button
                        type="button"
                        data-setting-btn="bubble"
                        className={`btn btn-xs vid-ctx-btn vid-ctx-btn-bubble ${showBubbleBottomSheet ? 'active' : ''}`}
                        onClick={() => {
                          if (activeCaption) {
                            setShowBubbleBottomSheet(true);
                          } else {
                            handleAddBubble();
                            setShowBubbleBottomSheet(true);
                          }
                          setActiveSubmenu(null);
                        }}
                        title="Add Chat & Speech Bubble (iPhone, WhatsApp, Comic)"
                      >
                        <MessageSquareQuote style={{ width: 13, height: 13, color: '#ffffff' }} /> <span>Bubble</span>
                      </button>

                      <button
                        className="btn btn-xs vid-ctx-btn vid-ctx-btn-ai"
                        data-action="ai-captions"
                        onClick={() => setShowAiModal(true)}
                        title="AI Meme Captions"
                      >
                        <WandSparkles style={{ width: 13, height: 13, color: '#ffffff' }} className="vid-ai-sparkle-icon" /> <span>AI Captions</span>
                      </button>
                    </div>
                  )}

                  {/* IMAGES TAB */}
                  {!(activeCaption || activeSticker || activeImageLayer) && !templateFaceMorph && activeTab === 'images' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <label
                        className="btn btn-xs vid-ctx-btn"
                        style={{
                          padding: '5px 14px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          borderRadius: '12px',
                          flexShrink: 0,
                          cursor: 'pointer',
                          margin: 0
                        }}
                        title="Upload Image or Video"
                      >
                        <ImagePlus style={{ width: 14, height: 14, color: 'var(--cyber-cyan)' }} />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*,video/*"
                          style={{ display: 'none' }}
                          onChange={handleFileUploadImageLayer}
                        />
                      </label>

                      <button
                        className="btn btn-xs vid-ctx-btn"
                        onClick={() => setImagePickerTarget('layer')}
                        style={{
                          padding: '5px 14px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          borderRadius: '12px',
                          flexShrink: 0
                        }}
                        title="Add Image from Templates"
                      >
                        <LayoutTemplate style={{ width: 14, height: 14, color: 'var(--cyber-cyan)' }} />
                        <span>Template</span>
                      </button>

                      <button
                        className="btn btn-xs vid-ctx-btn"
                        onClick={() => setShowMemeStickersModal(true)}
                        style={{
                          padding: '5px 14px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          borderRadius: '12px',
                          flexShrink: 0
                        }}
                        title="Add Meme Stickers"
                      >
                        <Sticker style={{ width: 14, height: 14, color: 'var(--cyber-cyan)' }} />
                        <span>Stickers</span>
                      </button>

                      <button
                        className="btn btn-xs vid-ctx-btn"
                        onClick={() => setShowEmojiModal(true)}
                        style={{
                          padding: '5px 14px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          borderRadius: '12px',
                          flexShrink: 0
                        }}
                        title="Add Emojis"
                      >
                        <Smile style={{ width: 14, height: 14, color: 'var(--cyber-cyan)' }} />
                        <span>Emojis</span>
                      </button>
                    </div>
                  )}

                  {/* DRAW TAB */}
                  {!(activeCaption || activeSticker || activeImageLayer) && activeTab === 'draw' && (
                    <div
                      className="draw-toolbar-group"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        flexShrink: 0,
                        marginInline: 'auto'
                      }}
                    >
                      <button
                        className={`btn btn-xs vid-ctx-btn ${drawTool === 'brush' ? 'active' : ''}`}
                        onClick={() => {
                          setDrawTool('brush');
                          setActiveSubmenu('drawSettings');
                        }}
                        style={{
                          padding: '5px 14px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          borderRadius: '12px',
                          background: drawTool === 'brush' ? 'var(--primary-gradient)' : undefined,
                          color: drawTool === 'brush' ? '#ffffff' : undefined,
                          border: drawTool === 'brush' ? '1px solid var(--cyber-cyan)' : undefined,
                          flexShrink: 0
                        }}
                        title="Brush: Solid clean brush stroke"
                      >
                        <Brush style={{ width: 14, height: 14 }} />
                        <span>Brush</span>
                      </button>

                      <button
                        className={`btn btn-xs vid-ctx-btn ${drawTool === 'highlighter' ? 'active' : ''}`}
                        onClick={() => {
                          setDrawTool('highlighter');
                          setActiveSubmenu('drawSettings');
                        }}
                        style={{
                          padding: '5px 14px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          borderRadius: '12px',
                          background: drawTool === 'highlighter' ? 'var(--primary-gradient)' : undefined,
                          color: drawTool === 'highlighter' ? '#ffffff' : undefined,
                          border: drawTool === 'highlighter' ? '1px solid var(--cyber-cyan)' : undefined,
                          flexShrink: 0
                        }}
                        title="Marker: Translucent highlighter"
                      >
                        <Highlighter style={{ width: 14, height: 14 }} />
                        <span>Marker</span>
                      </button>

                      <button
                        className={`btn btn-xs vid-ctx-btn ${drawTool === 'glow' ? 'active' : ''}`}
                        onClick={() => {
                          setDrawTool('glow');
                          setActiveSubmenu('drawSettings');
                        }}
                        style={{
                          padding: '5px 14px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          borderRadius: '12px',
                          background: drawTool === 'glow' ? 'var(--primary-gradient)' : undefined,
                          color: drawTool === 'glow' ? '#ffffff' : undefined,
                          border: drawTool === 'glow' ? '1px solid var(--cyber-cyan)' : undefined,
                          flexShrink: 0
                        }}
                        title="Glow: Neon laser glow"
                      >
                        <SunMedium style={{ width: 14, height: 14 }} />
                        <span>Glow</span>
                      </button>
                    </div>
                  )}

                  {/* CANVAS TAB */}
                  {!(activeCaption || activeSticker || activeImageLayer) && !templateFaceMorph && (activeTab === 'canvas' || activeTab === 'watermark') && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <button
                        className={`btn btn-xs vid-ctx-btn ${activeSubmenu === 'canvasBg' ? 'active' : ''}`}
                        onClick={() => handleToggleSubmenu('canvasBg')}
                        title="Canvas Color"
                      >
                        <div style={{ width: 14, height: 14, borderRadius: '50%', background: canvasBgColor || '#000000', border: '1.5px solid rgba(255,255,255,0.6)' }} />
                        <span>Canvas Color</span>
                      </button>

                      <button
                        className="btn btn-xs vid-ctx-btn"
                        onClick={() => setCanvasFlipX(prev => !prev)}
                        title="Flip Canvas Horizontal"
                      >
                        <FlipHorizontal style={{ width: 13, height: 13 }} />
                        <span>Flip Canvas</span>
                      </button>

                      {(() => {
                        const isWatermarkActive = Boolean(
                          watermark?.enabled &&
                          (watermark?.text || '').replace(/^@+/, '').trim().length > 0
                        );
                        return (
                          <button
                            className={`btn btn-xs vid-ctx-btn ${(activeSubmenu === 'watermark' || isWatermarkActive) ? 'active' : ''}`}
                            onClick={() => {
                              if (!watermark?.enabled) updateWatermark('enabled', true);
                              handleToggleSubmenu('watermark');
                            }}
                            title="Watermark Settings"
                          >
                            <Droplet style={{ width: 13, height: 13 }} />
                            <span>Watermark</span>
                          </button>
                        );
                      })()}
                    </div>
                  )}

                  {/* FILTERS TAB */}
                  {!(activeCaption || activeSticker || activeImageLayer) && !templateFaceMorph && activeTab === 'filters' && (
                    <div
                      className="filters-toolbar-group"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        flexShrink: 0,
                        marginInline: 'auto'
                      }}
                    >
                      <button
                        className="btn btn-xs vid-ctx-btn"
                        title="Swap faces with another photo using AI"
                        onClick={() => setShowFaceMorphModal(true)}
                        style={{
                          padding: '4px 12px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          borderRadius: '12px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid var(--glass-border)',
                          flexShrink: 0
                        }}
                      >
                        <ScanFace style={{ width: 13, height: 13, color: 'var(--cyber-cyan)' }} />
                        <span>Face Swap</span>
                      </button>

                      <button
                        className={`btn btn-xs vid-ctx-btn ${showFiltersModal ? 'active' : ''}`}
                        title="Photo Filters"
                        onClick={() => setShowFiltersModal(true)}
                        style={{
                          padding: '4px 12px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          borderRadius: '12px',
                          background: showFiltersModal ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.08)',
                          border: showFiltersModal ? '1px solid var(--cyber-cyan)' : '1px solid var(--glass-border)',
                          color: '#ffffff',
                          flexShrink: 0
                        }}
                      >
                        <Sun style={{ width: 13, height: 13, color: '#f59e0b' }} />
                        <span>Filters</span>
                      </button>
                    </div>
                  )}

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
            {(activeTab === 'canvas' || activeTab === 'watermark') && (
              <div className="tab-content">
                {/* Canvas Orientation & Settings */}
                <div className="form-group margin-bottom-md" style={{ background: 'var(--bg-surface-1)', padding: '14px', borderRadius: '14px', border: '1px solid var(--glass-border)', marginBottom: '16px' }}>
                  <label style={{ fontSize: '0.95rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--text-main)' }}>
                    <LayoutGrid className="icon-sm" style={{ color: 'var(--cyber-cyan)' }} /> Canvas &amp; Template
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                      type="button"
                      className={`btn btn-sm ${canvasFlipX ? 'btn-primary' : 'btn-secondary'} hover-lift`}
                      onClick={handleToggleCanvasFlip}
                      title="Flip base template horizontally (Mirror)"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px 10px', fontSize: '0.8rem', fontWeight: 600 }}
                    >
                      <FlipHorizontal size={16} />
                      <span>{canvasFlipX ? 'Flipped' : 'Flip Canvas'}</span>
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CanvasColorPicker canvasBgColor={canvasBgColor} setCanvasBgColor={handleSetCanvasBgColor} />
                    </div>
                  </div>
                </div>
                <div className="form-group margin-bottom-md">
                  <div className="flex-between align-center" style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', lineHeight: 1 }}><Droplet className="icon-sm" style={{ transform: 'translateY(1px)' }} /> Watermark</label>
                    <label className="switch">
                      <input type="checkbox" checked={watermark?.enabled || false} onChange={(e) => updateWatermark('enabled', e.target.checked)} />
                      <span className="slider round watermark-toggle"></span>
                    </label>
                  </div>
                  
                  {watermark?.enabled && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '8px' }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div 
                          className="watermark-unified-box"
                          onClick={() => watermarkTextInputRef.current?.focus()}
                        >
                          <span className="watermark-at-prefix">@</span>
                          <input 
                            ref={watermarkTextInputRef}
                            type="text" 
                            className="watermark-inner-input"
                            placeholder="username" 
                            value={(watermark.text || '').replace(/^@/, '')} 
                            onChange={(e) => {
                              const raw = e.target.value.replace(/^@+/, '');
                              updateWatermark('text', raw ? `@${raw}` : '');
                              if (raw) updateWatermark('imageUrl', null);
                            }} 
                          />
                        </div>
                        <button 
                          type="button"
                          className="watermark-upload-btn" 
                          onClick={() => watermarkInputRef.current?.click()}
                          title="Upload custom watermark logo/image"
                        >
                          <Upload size={18} />
                        </button>
                        <input 
                          ref={watermarkInputRef}
                          type="file" 
                          accept="image/*" 
                          style={{ display: 'none' }} 
                          onChange={handleWatermarkImageUpload} 
                        />
                      </div>
                      
                      {watermark.imageUrl && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Custom Image Active</span>
                          <button className="btn btn-xs btn-ghost text-red" onClick={() => updateWatermark('imageUrl', null)}>Remove</button>
                        </div>
                      )}
                      
                       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', alignItems: 'center' }}>
                         {/* Size Control */}
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                           <label style={{ margin: 0, fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                             Size ({watermark.size}px)
                           </label>
                           <div className="size-control-group flex-between gap-xs" style={{ height: '36px', padding: '0 6px', borderRadius: '10px', background: 'var(--bg-surface-1)', border: '1px solid var(--glass-border)', alignItems: 'center' }}>
                             <button type="button" className="btn btn-xs btn-ghost" style={{ width: '24px', height: '24px', borderRadius: '50%', padding: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0, color: 'var(--text-main)' }} onClick={() => updateWatermark('size', Math.max(12, watermark.size - 2))} title="Decrease size">-</button>
                             <input type="range" min="12" max="64" step="2" style={{ flex: 1, margin: '0 4px', minWidth: 0, accentColor: 'var(--cyber-cyan)' }} value={watermark.size} onChange={(e) => updateWatermark('size', parseInt(e.target.value))} />
                             <button type="button" className="btn btn-xs btn-ghost" style={{ width: '24px', height: '24px', borderRadius: '50%', padding: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0, color: 'var(--text-main)' }} onClick={() => updateWatermark('size', Math.min(64, watermark.size + 2))} title="Increase size">+</button>
                           </div>
                         </div>
                         {/* Opacity Control */}
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                           <label style={{ margin: 0, fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                             Opacity ({Math.round(watermark.opacity * 100)}%)
                           </label>
                           <div className="size-control-group flex-between gap-xs" style={{ height: '36px', padding: '0 6px', borderRadius: '10px', background: 'var(--bg-surface-1)', border: '1px solid var(--glass-border)', alignItems: 'center' }}>
                             <button type="button" className="btn btn-xs btn-ghost" style={{ width: '24px', height: '24px', borderRadius: '50%', padding: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0, color: 'var(--text-main)' }} onClick={() => updateWatermark('opacity', Math.max(0.1, parseFloat((watermark.opacity - 0.1).toFixed(1))))} title="Decrease opacity">-</button>
                             <input type="range" min="0.1" max="1.0" step="0.1" style={{ flex: 1, margin: '0 4px', minWidth: 0, accentColor: 'var(--cyber-cyan)' }} value={watermark.opacity} onChange={(e) => updateWatermark('opacity', parseFloat(e.target.value))} />
                             <button type="button" className="btn btn-xs btn-ghost" style={{ width: '24px', height: '24px', borderRadius: '50%', padding: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0, color: 'var(--text-main)' }} onClick={() => updateWatermark('opacity', Math.min(1.0, parseFloat((watermark.opacity + 0.1).toFixed(1))))} title="Increase opacity">+</button>
                           </div>
                         </div>
                       </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                        <button 
                          className="btn btn-primary" 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between', 
                            width: '145px', 
                            padding: '8px 14px', 
                            fontSize: '0.88rem', 
                            fontWeight: 600,
                            borderRadius: '10px',
                            flexShrink: 0, 
                            whiteSpace: 'nowrap' 
                          }}
                          onClick={handleCycleWatermarkPosition}
                        >
                          <span>
                            {watermark.position === 'top-left' && 'Top Left'}
                            {watermark.position === 'top-right' && 'Top Right'}
                            {watermark.position === 'bottom-left' && 'Bottom Left'}
                            {watermark.position === 'bottom-right' && 'Bottom Right'}
                          </span>
                          <RefreshCw style={{ width: '15px', height: '15px', flexShrink: 0, color: 'inherit' }} />
                        </button>
                        
                        {!watermark.imageUrl && (
                          <div className="compact-inline-swatches" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end', flex: 1, paddingRight: '8px' }}>
                            {COLOR_SWATCHES.filter(c => c !== '#00ff66').map(color => (
                              <div 
                                key={color} 
                                onClick={() => updateWatermark('color', color)}
                                style={{ 
                                  width: '24px', height: '24px', borderRadius: '50%', backgroundColor: color, 
                                  border: watermark.color === color ? '2px solid #a855f7' : '1px solid #444', cursor: 'pointer', flexShrink: 0
                                }} 
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* TAB 4: FREEHAND DRAWING */}
            {activeTab === 'draw' && (
              <div className="tab-content animate-fade-in">
                {/* Tool Selection: 3 Modes (Brush, Marker, Glow) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '14px' }}>
                  <button
                    className={`btn ${drawTool === 'brush' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setDrawTool('brush')}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '7px 4px', gap: '4px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 600 }}
                    title="Solid Brush"
                  >
                    <Brush className="icon-xs" style={{ width: '14px', height: '14px' }} />
                    <span>Brush</span>
                  </button>
                  <button
                    className={`btn ${drawTool === 'highlighter' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setDrawTool('highlighter')}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '7px 4px', gap: '4px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 600 }}
                    title="Highlighter / Translucent Marker"
                  >
                    <Highlighter className="icon-xs" style={{ width: '14px', height: '14px' }} />
                    <span>Marker</span>
                  </button>
                  <button
                    className={`btn ${drawTool === 'glow' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setDrawTool('glow')}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '7px 4px', gap: '4px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 600 }}
                    title="Neon Glow / Laser Line"
                  >
                    <SunMedium className="icon-xs" style={{ width: '14px', height: '14px' }} />
                    <span>Glow</span>
                  </button>
                </div>

                {/* Quick Drawing Actions: Undo Last Stroke & Clear All */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleUndoDrawing}
                    disabled={drawings.length === 0}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', borderRadius: '8px', padding: '6px 10px', fontSize: '0.76rem', opacity: drawings.length === 0 ? 0.4 : 1 }}
                    title="Undo Last Stroke"
                  >
                    <Undo style={{ width: 13, height: 13 }} />
                    <span>Undo Stroke {drawings.length > 0 ? `(${drawings.length})` : ''}</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleClearDrawings}
                    disabled={drawings.length === 0}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', borderRadius: '8px', padding: '6px 10px', fontSize: '0.76rem', color: drawings.length > 0 ? '#ef4444' : undefined, opacity: drawings.length === 0 ? 0.4 : 1 }}
                    title="Clear All Drawings"
                  >
                    <Trash2 style={{ width: 13, height: 13 }} />
                    <span>Clear All</span>
                  </button>
                </div>

                {/* 1. Stroke Thickness */}
                <div style={{ marginBottom: '16px', display: drawTool ? 'block' : 'none' }}>
                  <div className="flex-between align-center" style={{ marginBottom: '6px', paddingRight: '4px' }}>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      Stroke Thickness ({brushSize}px)
                    </label>
                    <div
                      style={{
                        width: Math.min(26, Math.max(6, brushSize)),
                        height: Math.min(26, Math.max(6, brushSize)),
                        borderRadius: '50%',
                        background: brushColor,
                        boxShadow: drawTool === 'glow' ? `0 0 8px ${brushColor}` : 'none',
                        border: '1px solid #ffffff',
                        transition: 'all 0.1s ease',
                        flexShrink: 0
                      }}
                    />
                  </div>
                  <div className="size-control-group flex-between gap-xs" style={{ height: '36px', padding: '0 6px', borderRadius: '10px', background: 'var(--bg-surface-1)', border: '1px solid var(--glass-border)', alignItems: 'center' }}>
                    <button type="button" className="btn btn-xs btn-ghost" style={{ width: '24px', height: '24px', borderRadius: '50%', padding: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0, color: 'var(--text-main)' }} onClick={() => setBrushSize(Math.max(2, brushSize - 2))} title="Decrease size">-</button>
                    <input type="range" min="2" max="48" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} style={{ flex: 1, margin: '0 4px', minWidth: 0, accentColor: 'var(--cyber-cyan)', touchAction: 'none' }} />
                    <button type="button" className="btn btn-xs btn-ghost" style={{ width: '24px', height: '24px', borderRadius: '50%', padding: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0, color: 'var(--text-main)' }} onClick={() => setBrushSize(Math.min(48, brushSize + 2))} title="Increase size">+</button>
                  </div>
                </div>

                {/* 2. Brush Color: Buttons placed directly next to the label */}
                <div style={{ display: drawTool ? 'block' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', paddingLeft: '4px', paddingRight: '4px', flexWrap: 'wrap' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, whiteSpace: 'nowrap' }}>
                      Stroke Color:
                    </label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {DRAW_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          style={{
                            width: '22px',
                            height: '22px',
                            minWidth: '22px',
                            minHeight: '22px',
                            borderRadius: '50%',
                            background: color,
                            border: brushColor === color ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.25)',
                            boxShadow: brushColor === color ? (drawTool === 'glow' ? `0 0 10px ${color}` : `0 0 8px ${color}`) : 'none',
                            cursor: 'pointer',
                            padding: 0,
                            margin: 0,
                            transform: brushColor === color ? 'scale(1.18)' : 'scale(1)',
                            transition: 'transform 0.15s ease'
                          }}
                          onClick={() => setBrushColor(color)}
                        />
                      ))}
                      
                      {/* One Color Palette Button at End */}
                      <label
                        style={{
                          width: '22px',
                          height: '22px',
                          minWidth: '22px',
                          minHeight: '22px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          background: 'linear-gradient(135deg, #ff007f, #00f0ff, #ffe600, #00ff66)',
                          border: '1.5px solid rgba(255,255,255,0.5)',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                          position: 'relative',
                          overflow: 'hidden',
                          padding: 0,
                          margin: 0,
                          transition: 'transform 0.15s ease'
                        }}
                        title="Custom Color Palette"
                      >
                        <Palette style={{ width: '12px', height: '12px', color: '#ffffff', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))', display: 'block', margin: 'auto' }} />
                        <input
                          type="color"
                          value={brushColor}
                          onChange={(e) => setBrushColor(e.target.value)}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            opacity: 0,
                            cursor: 'pointer'
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* TAB 1: TEXT CONTROLS */}
          {activeTab === 'text' && (
            <div className="tab-content animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* TOP ACTION & COLOR TOOLBAR */}
              <div
                className="text-toolbar-row flex-between align-center"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  flexWrap: 'wrap'
                }}
              >
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    {/* + Text Button */}
                    <button
                      type="button"
                      className="btn btn-xs btn-primary hover-lift"
                      onClick={handleAddCaption}
                      style={{
                        padding: "7px 14px",
                        borderRadius: "20px",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                    >
                      <Plus size={15} /> {activeCaption ? "Text" : "Add Text"}
                    </button>

                    {/* Curved / Arc Text Button */}
                    <button
                      type="button"
                      className={`btn btn-xs hover-lift ${(activeCaption?.curve && activeCaption.curve !== 0) ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={handleAddCurvedText}
                      title={activeCaption ? "Toggle or adjust text curve / arc" : "Add curved / arched meme text"}
                      style={{
                        padding: "7px 14px",
                        borderRadius: "20px",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: (activeCaption?.curve && activeCaption.curve !== 0) ? "#ffffff" : "var(--cyber-cyan)" }}>
                        <path d="M4 18C4 11.3726 9.37258 6 16 6H20" />
                        <path d="M16 2L20 6L16 10" />
                      </svg>
                      <span>{activeCaption ? (activeCaption.curve ? `Arc (${activeCaption.curve > 0 ? '+' : ''}${activeCaption.curve}Â°)` : 'Curve') : 'Curved Text'}</span>
                    </button>

                    {/* Unified Header & Footer Segmented Control */}
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '20px',
                        padding: '3px',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        gap: '2px'
                      }}
                    >
                      <button
                        type="button"
                        className={`btn btn-xs hover-lift ${canvasHeader.enabled ? 'active' : ''}`}
                        onClick={handleToggleCanvasHeader}
                        title="Toggle Modern Header Extension (Twitter / Reddit style top canvas extension)"
                        style={{
                          padding: "5px 12px",
                          borderRadius: "16px",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          background: canvasHeader.enabled
                            ? "var(--primary-gradient)"
                            : "transparent",
                          border: canvasHeader.enabled
                            ? "1px solid var(--cyber-cyan)"
                            : "1px solid transparent",
                          color: "#ffffff"
                        }}
                      >
                        <PanelTop size={14} style={{ color: canvasHeader.enabled ? "#ffffff" : "var(--cyber-cyan)" }} />
                        <span>Header</span>
                      </button>
                      <button
                        type="button"
                        className={`btn btn-xs hover-lift ${canvasFooter.enabled ? 'active' : ''}`}
                        onClick={handleToggleCanvasFooter}
                        title="Toggle Modern Footer Extension (Twitter / Reddit style bottom canvas extension)"
                        style={{
                          padding: "5px 12px",
                          borderRadius: "16px",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          background: canvasFooter.enabled
                            ? "var(--primary-gradient)"
                            : "transparent",
                          border: canvasFooter.enabled
                            ? "1px solid var(--cyber-cyan)"
                            : "1px solid transparent",
                          color: "#ffffff"
                        }}
                      >
                        <PanelBottom size={14} style={{ color: canvasFooter.enabled ? "#ffffff" : "var(--cyber-cyan)" }} />
                        <span>Footer</span>
                      </button>
                      <button
                        type="button"
                        className={`btn btn-xs hover-lift ${(canvasHeader.enabled && canvasFooter.enabled) ? 'active' : ''}`}
                        onClick={handleToggleCanvasBoth}
                        title="Toggle Both Header & Footer Extensions"
                        style={{
                          padding: "5px 12px",
                          borderRadius: "16px",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          background: (canvasHeader.enabled && canvasFooter.enabled)
                            ? "var(--primary-gradient)"
                            : "transparent",
                          border: (canvasHeader.enabled && canvasFooter.enabled)
                            ? "1px solid var(--cyber-cyan)"
                            : "1px solid transparent",
                          color: "#ffffff"
                        }}
                      >
                        <Rows3 size={14} style={{ color: (canvasHeader.enabled && canvasFooter.enabled) ? "#ffffff" : "var(--cyber-cyan)" }} />
                        <span>Both</span>
                      </button>
                    </div>

                    {/* Speech & Chat Bubble Button */}
                    <button
                      type="button"
                      className={`btn btn-xs hover-lift ${activeCaption?.bubbleStyle ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => {
                        if (activeCaption) {
                          setShowBubbleBottomSheet(true);
                        } else {
                          handleAddBubble();
                          setShowBubbleBottomSheet(true);
                        }
                      }}
                      title={activeCaption?.bubbleStyle ? "Change Chat or Speech Bubble Layout (iPhone, WhatsApp, Comic)" : "Add Chat or Speech Bubble (iPhone, WhatsApp, Comic)"}
                      style={{ padding: "7px 14px", borderRadius: "20px", fontSize: "0.82rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "6px" }}
                    >
                      <MessageSquare size={15} style={{ color: activeCaption?.bubbleStyle ? "#ffffff" : "var(--cyber-cyan)" }} /> Bubble
                    </button>

                    {/* AI Meme Caption Generator Button */}
                    <button
                      type="button"
                      className="btn btn-xs hover-lift"
                      onClick={() => setShowAiModal(true)}
                      title="Generate AI meme captions or browse funny ideas"
                      style={{
                        padding: "7px 14px",
                        borderRadius: "20px",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "linear-gradient(135deg, rgba(168, 85, 247, 0.35) 0%, rgba(236, 72, 153, 0.35) 100%)",
                        border: "1px solid rgba(236, 72, 153, 0.6)",
                        color: "#ffffff"
                      }}
                    >
                      <WandSparkles size={15} style={{ color: "#ec4899" }} /> AI Captions
                    </button>
                  </div>

                {/* Color Swatches Bar + Delete Button (When activeCaption exists) */}
                {activeCaption && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div
                      className="color-palette-bar"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'var(--bg-surface-1)',
                        padding: '4px 8px',
                        borderRadius: '20px',
                        border: '1px solid var(--glass-border)'
                      }}
                    >
                      {COLOR_SWATCHES.map((hex) => {
                        const isSelected = (activeCaption.color || '#ffffff').toLowerCase() === hex.toLowerCase();
                        return (
                          <button
                            key={hex}
                            type="button"
                            className="color-swatch-circle"
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              backgroundColor: hex,
                              border: isSelected ? '2px solid #ffffff' : '1.5px solid rgba(255, 255, 255, 0.3)',
                              boxShadow: isSelected ? `0 0 10px ${hex}, 0 0 2px #fff` : 'none',
                              transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                              cursor: 'pointer',
                              padding: 0,
                              transition: 'all 0.15s ease'
                            }}
                            onClick={() => {
                              if (!activeLayerId) return;
                              const hasBg = activeCaption.bgColor && activeCaption.bgColor !== 'none' && activeCaption.bgColor !== 'transparent';
                              const strokeColor = hasBg ? 'transparent' : (hex === '#000000' ? '#ffffff' : '#000000');
                              const nextCaps = captions.map((cap) => 
                                cap.id === activeLayerId ? { ...cap, color: hex, stroke: strokeColor } : cap
                              );
                              setCaptions(nextCaps);
                              pushHistory();
                            }}
                            title={hex}
                          />
                        );
                      })}

                      {/* Custom Color Wheel Picker */}
                      <label
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          background: 'conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
                          border: '1.5px solid rgba(255, 255, 255, 0.5)',
                          boxShadow: '0 2px 5px rgba(0, 0, 0, 0.3)',
                          position: 'relative',
                          overflow: 'hidden',
                          margin: 0,
                          padding: 0
                        }}
                        title="Custom Color"
                      >
                        <input
                          type="color"
                          value={activeCaption.color || '#ffffff'}
                          onChange={(e) => {
                            const hex = e.target.value;
                            if (!activeLayerId) return;
                            const hasBg = activeCaption.bgColor && activeCaption.bgColor !== 'none' && activeCaption.bgColor !== 'transparent';
                            const strokeColor = hasBg ? 'transparent' : (hex === '#000000' ? '#ffffff' : '#000000');
                            const nextCaps = captions.map((cap) => 
                              cap.id === activeLayerId ? { ...cap, color: hex, stroke: strokeColor } : cap
                            );
                            setCaptions(nextCaps);
                            pushHistory();
                          }}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            opacity: 0,
                            cursor: 'pointer'
                          }}
                        />
                      </label>
                    </div>

                    {/* Delete Text Layer Button */}
                    <button
                      type="button"
                      className="btn btn-icon btn-xs hover-lift vid-ctx-btn-delete"
                      onClick={() => handleDeleteLayer()}
                      title="Delete Text"
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                        border: '1px solid rgba(255, 255, 255, 0.28)',
                        boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginRight: '8px'
                      }}
                    >
                      <Trash2 size={14} style={{ color: '#ffffff' }} />
                    </button>
                  </div>
                )}
              </div>

              {/* ACTIVE CAPTION CONTROLS */}
              {activeCaption ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* ROW 1: SIZE & OPACITY SIDE BY SIDE */}
                  {(() => {
                    const currentOpacityNum = activeCaption.opacity !== undefined && activeCaption.opacity !== null
                      ? (Number(activeCaption.opacity) > 1 ? Number(activeCaption.opacity) / 100 : Number(activeCaption.opacity))
                      : 1;
                    const opacityPercent = Math.round(currentOpacityNum * 100);

                    return (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '10px',
                          alignItems: 'center'
                        }}
                      >
                        {/* Size Control */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                          <label style={{ margin: 0, fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                            Size ({activeCaption.fontSize || 50}px)
                          </label>
                          <div
                            className="size-control-group flex-between gap-xs"
                            style={{
                              height: '36px',
                              padding: '0 6px',
                              borderRadius: '10px',
                              background: 'var(--bg-surface-1)',
                              border: '1px solid var(--glass-border)',
                              alignItems: 'center'
                            }}
                          >
                            <button
                              type="button"
                              className="btn btn-xs btn-ghost"
                              style={{ width: '24px', height: '24px', borderRadius: '50%', padding: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0, color: 'var(--text-main)' }}
                              onClick={() => updateActiveCaption('fontSize', Math.max(16, (activeCaption.fontSize || 50) - 4))}
                              title="Decrease size"
                            >
                              -
                            </button>
                            <input
                              type="range"
                              min={16}
                              max={250}
                              style={{ flex: 1, margin: '0 4px', minWidth: 0, accentColor: 'var(--cyber-cyan)' }}
                              value={activeCaption.fontSize || 50}
                              onChange={(e) => updateActiveCaption('fontSize', Number(e.target.value))}
                            />
                            <button
                              type="button"
                              className="btn btn-xs btn-ghost"
                              style={{ width: '24px', height: '24px', borderRadius: '50%', padding: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0, color: 'var(--text-main)' }}
                              onClick={() => updateActiveCaption('fontSize', Math.min(250, (activeCaption.fontSize || 50) + 4))}
                              title="Increase size"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Opacity Control */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                          <label style={{ margin: 0, fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                            Opacity
                          </label>
                          <div
                            className="size-control-group flex-between gap-xs"
                            style={{
                              height: '36px',
                              padding: '0 6px',
                              borderRadius: '10px',
                              background: 'var(--bg-surface-1)',
                              border: '1px solid var(--glass-border)',
                              alignItems: 'center'
                            }}
                          >
                            <button
                              type="button"
                              className="btn btn-xs btn-ghost"
                              style={{ width: '24px', height: '24px', borderRadius: '50%', padding: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0, color: 'var(--text-main)' }}
                              onClick={() => updateActiveCaption('opacity', Math.max(10, opacityPercent - 5) / 100)}
                              title="Decrease opacity"
                            >
                              -
                            </button>
                            <input
                              type="range"
                              min={10}
                              max={100}
                              step={1}
                              style={{ flex: 1, margin: '0 4px', minWidth: 0, accentColor: 'var(--cyber-cyan)' }}
                              value={opacityPercent}
                              onChange={(e) => updateActiveCaption('opacity', Number(e.target.value) / 100)}
                            />
                            <button
                              type="button"
                              className="btn btn-xs btn-ghost"
                              style={{ width: '24px', height: '24px', borderRadius: '50%', padding: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0, color: 'var(--text-main)' }}
                              onClick={() => updateActiveCaption('opacity', Math.min(100, opacityPercent + 5) / 100)}
                              title="Increase opacity"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ROW 2: FONT SELECTION & BACKGROUND TOGGLES (SIDE-BY-SIDE) */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '10px',
                      alignItems: 'end'
                    }}
                  >
                    {/* Font Selector Card */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                      <div className="flex-between align-center" style={{ minHeight: '16px' }}>
                        <label style={{ margin: 0, fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                          Font
                        </label>
                        <button
                          type="button"
                          className="btn btn-xs btn-ghost"
                          onClick={handleToggleTextCase}
                          title="Toggle Text Case (ALL CAPS / Sentence case / lowercase)"
                          style={{ padding: '0 6px', height: '18px', fontSize: '0.7rem', fontWeight: 700, borderRadius: '6px', color: 'var(--cyber-cyan)' }}
                        >
                          Aa Case
                        </button>
                      </div>
                      <button
                        type="button"
                        className="btn btn-xs btn-secondary font-cycle-btn hover-lift"
                        style={{
                          fontFamily: activeFontObj.family,
                          width: '100%',
                          padding: '0 8px',
                          height: '38px',
                          borderRadius: '10px',
                          fontSize: '0.82rem',
                          background: 'var(--bg-surface-1)',
                          border: '1px solid var(--glass-border)',
                          color: 'var(--text-main)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          boxSizing: 'border-box'
                        }}
                        onClick={handleCycleFont}
                        title="Click to cycle font"
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <Type size={13} style={{ color: 'var(--cyber-cyan)', flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeFontObj.id || activeFontObj.name.split(' ')[0]}</span>
                        </span>
                        <RefreshCw size={12} style={{ color: 'var(--cyber-cyan)', flexShrink: 0, opacity: 0.8 }} />
                      </button>
                    </div>

                    {/* Background Segmented Pill */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                      <div className="flex-between align-center" style={{ minHeight: '16px' }}>
                        <label style={{ margin: 0, fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                          Background
                        </label>
                      </div>

                      {/* Segmented Button Group: None, White, Black, Banner */}
                      <div
                        style={{
                          display: 'flex',
                          height: '38px',
                          padding: 0,
                          borderRadius: '10px',
                          background: 'transparent',
                          border: 'none',
                          gap: '4px',
                          boxSizing: 'border-box'
                        }}
                      >
                        <button
                          type="button"
                          className={`btn btn-xs flex-1 ${(!activeCaption.bgColor || activeCaption.bgColor === 'transparent' || activeCaption.bgColor === 'none') ? 'btn-primary' : 'btn-ghost'}`}
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            borderRadius: '999px',
                            padding: '0 2px',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: (!activeCaption.bgColor || activeCaption.bgColor === 'transparent' || activeCaption.bgColor === 'none') ? undefined : 'var(--bg-surface-1)',
                            border: 'none'
                          }}
                          onClick={() => handleSetCaptionBg('none')}
                        >
                          None
                        </button>
                        <button
                          type="button"
                          className={`btn btn-xs flex-1 ${activeCaption.bgColor === 'white' ? 'btn-primary' : 'btn-ghost'}`}
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            borderRadius: '999px',
                            padding: '0 2px',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '3px',
                            background: activeCaption.bgColor === 'white' ? undefined : 'var(--bg-surface-1)',
                            border: 'none'
                          }}
                          onClick={() => handleSetCaptionBg('white')}
                        >
                          White
                        </button>
                        <button
                          type="button"
                          className={`btn btn-xs flex-1 ${(activeCaption.bgColor === 'black' || activeCaption.bgColor === '#000000') ? 'btn-primary' : 'btn-ghost'}`}
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            borderRadius: '999px',
                            padding: '0 2px',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '3px',
                            background: (activeCaption.bgColor === 'black' || activeCaption.bgColor === '#000000') ? undefined : 'var(--bg-surface-1)',
                            border: 'none'
                          }}
                          onClick={() => handleSetCaptionBg('black')}
                        >
                          Dark
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ROW: ALIGNMENT & TEXT CASE */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '10px',
                      alignItems: 'center'
                    }}
                  >
                    {/* Alignment Control */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                      <label style={{ margin: 0, fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        Alignment
                      </label>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          background: 'var(--bg-surface-1)',
                          borderRadius: '10px',
                          padding: '3px',
                          border: '1px solid var(--glass-border)',
                          gap: '3px',
                          height: '36px'
                        }}
                      >
                        <button
                          type="button"
                          className={`btn btn-xs flex-1 ${(activeCaption.align === 'left') ? 'btn-primary' : 'btn-ghost'}`}
                          onClick={() => updateActiveCaption('align', 'left')}
                          style={{
                            borderRadius: '7px',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            background: activeCaption.align === 'left' ? 'var(--primary-gradient)' : 'transparent',
                            border: 'none',
                            color: '#ffffff'
                          }}
                          title="Align Left"
                        >
                          <AlignLeft size={13} />
                          <span>Left</span>
                        </button>
                        <button
                          type="button"
                          className={`btn btn-xs flex-1 ${(activeCaption.align === 'center' || !activeCaption.align) ? 'btn-primary' : 'btn-ghost'}`}
                          onClick={() => updateActiveCaption('align', 'center')}
                          style={{
                            borderRadius: '7px',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            background: (activeCaption.align === 'center' || !activeCaption.align) ? 'var(--primary-gradient)' : 'transparent',
                            border: 'none',
                            color: '#ffffff'
                          }}
                          title="Align Center"
                        >
                          <AlignCenter size={13} />
                          <span>Center</span>
                        </button>
                        <button
                          type="button"
                          className={`btn btn-xs flex-1 ${(activeCaption.align === 'right') ? 'btn-primary' : 'btn-ghost'}`}
                          onClick={() => updateActiveCaption('align', 'right')}
                          style={{
                            borderRadius: '7px',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            background: activeCaption.align === 'right' ? 'var(--primary-gradient)' : 'transparent',
                            border: 'none',
                            color: '#ffffff'
                          }}
                          title="Align Right"
                        >
                          <AlignRight size={13} />
                          <span>Right</span>
                        </button>
                      </div>
                    </div>

                    {/* Case Control */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                      <label style={{ margin: 0, fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        Text Case
                      </label>
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary hover-lift"
                        onClick={handleToggleTextCase}
                        style={{
                          height: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          borderRadius: '10px',
                          fontSize: '0.8rem',
                          fontWeight: 700
                        }}
                      >
                        <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>Aa</span>
                        <span>Toggle Case</span>
                      </button>
                    </div>
                  </div>

                  {/* ROW 3: TEXT EFFECTS CONTROL */}
                  {(!activeCaption.isBreakingNews && !isSocialCardCaption(activeCaption)) && (() => {
                    const currentEffect = getActiveTextEffectId(activeCaption);
                    return (
                      <div
                        style={{
                          background: 'var(--bg-surface-1)',
                          padding: '10px 12px',
                          borderRadius: '12px',
                          border: '1px solid var(--glass-border)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}
                      >
                        <div className="flex-between align-center">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Sparkles style={{ width: 14, height: 14, color: "var(--cyber-cyan)" }} />
                            <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)' }}>Text Effects</span>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: (currentEffect !== 'flat') ? 'var(--cyber-cyan)' : 'var(--text-muted)', textTransform: 'capitalize' }}>
                              {currentEffect}
                            </span>
                          </div>
                          {currentEffect !== 'flat' && (
                            <button
                              type="button"
                              className="btn btn-xs btn-ghost"
                              onClick={() => handleApplyTextEffect('flat')}
                              style={{ fontSize: '0.68rem', padding: '1px 6px', height: '18px', color: 'var(--text-muted)' }}
                            >
                              Reset Flat
                            </button>
                          )}
                        </div>

                        {/* Preset Effect Buttons with stylized labels */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' }}>
                          {TEXT_EFFECTS.map((eff) => {
                            const isActive = currentEffect === eff.id;
                            return (
                              <button
                                key={eff.id}
                                type="button"
                                className={`btn btn-xs ${isActive ? 'btn-primary' : 'btn-ghost'}`}
                                style={{
                                  fontSize: '0.72rem',
                                  padding: '5px 2px',
                                  borderRadius: '6px',
                                  border: isActive ? '1px solid var(--cyber-cyan)' : '1px solid var(--glass-border)',
                                  background: isActive ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.05)',
                                  boxShadow: isActive ? '0 0 10px rgba(6, 182, 212, 0.4)' : 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  height: '28px'
                                }}
                                onClick={() => handleApplyTextEffect(eff.id)}
                                title={eff.title}
                              >
                                {eff.renderLabel()}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Bubble Style Switcher (if this is a speech or chat bubble) */}
                  {activeCaption.bubbleStyle && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                      <div className="flex-between align-center">
                        <label style={{ margin: 0, fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                          Bubble Layout & Style
                        </label>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                        {BUBBLE_LAYOUT_OPTIONS.map(style => (
                          <button
                            key={style.id}
                            type="button"
                            className={`btn btn-xs bubble-layout-btn bubble-layout-btn-${style.id} ${activeCaption.bubbleStyle === style.id ? 'bubble-active' : ''}`}
                            style={{ fontSize: '0.68rem', padding: '5px 2px' }}
                            onClick={() => handleApplyBubbleStyle(style.id)}
                            title={`Switch to ${style.label} bubble`}
                          >
                            {style.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Breaking News Chyron Customizer */}
                  {activeCaption.isBreakingNews && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        background: 'var(--bg-surface-1)',
                        padding: '10px',
                        borderRadius: '10px',
                        border: '1px solid var(--glass-border)',
                        marginTop: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Tv size={14} style={{ color: '#ef4444' }} />
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>TV Chyron Overlay</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Channel / Bug</label>
                          <input
                            type="text"
                            className="form-input"
                            value={activeCaption.newsChannel || 'BREAKING NEWS'}
                            onChange={(e) => updateActiveCaption('newsChannel', e.target.value)}
                            style={{ width: '100%', fontSize: '0.8rem', padding: '4px 8px' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Bottom Ticker</label>
                          <input
                            type="text"
                            className="form-input"
                            value={activeCaption.newsTicker || 'DEVELOPING STORY - DETAILS TO FOLLOW'}
                            onChange={(e) => updateActiveCaption('newsTicker', e.target.value)}
                            style={{ width: '100%', fontSize: '0.8rem', padding: '4px 8px' }}
                          />
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Headline</label>
                        <input
                          type="text"
                          className="form-input"
                          value={activeCaption.newsHeadline || activeCaption.text || ''}
                          onChange={(e) => updateActiveCaptionProps({ text: e.target.value, newsHeadline: e.target.value })}
                          style={{ width: '100%', fontSize: '0.82rem', padding: '4px 8px' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Fake Tweet Post Customizer */}
                  {activeCaption.isTweetCard && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        background: 'var(--bg-surface-1)',
                        padding: '10px',
                        borderRadius: '10px',
                        border: '1px solid var(--glass-border)',
                        marginTop: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 900 }}>ð•</span>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>X / Tweet Card</span>
                        </div>
                        <div style={{ display: 'flex', gap: '3px' }}>
                          {['dark', 'dim', 'light'].map((th) => (
                            <button
                              key={th}
                              type="button"
                              className={`btn btn-xs ${(activeCaption.tweetTheme || 'dark') === th ? 'btn-primary' : 'btn-ghost'}`}
                              onClick={() => {
                                const newColor = th === 'light' ? '#0f1419' : '#ffffff';
                                updateActiveCaptionProps({ tweetTheme: th, color: newColor });
                              }}
                              style={{ fontSize: '0.65rem', padding: '2px 6px', textTransform: 'capitalize' }}
                            >
                              {th}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Display Name</label>
                          <input
                            type="text"
                            className="form-input"
                            value={activeCaption.tweetName || 'Elon Musk'}
                            onChange={(e) => updateActiveCaption('tweetName', e.target.value)}
                            style={{ width: '100%', fontSize: '0.8rem', padding: '4px 8px' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Handle</label>
                          <input
                            type="text"
                            className="form-input"
                            value={activeCaption.tweetHandle || '@elonmusk'}
                            onChange={(e) => updateActiveCaption('tweetHandle', e.target.value)}
                            style={{ width: '100%', fontSize: '0.8rem', padding: '4px 8px' }}
                          />
                        </div>
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>Tweet Content</label>
                          <label style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: '#38bdf8' }}>
                            <input
                              type="checkbox"
                              checked={activeCaption.tweetVerified !== false}
                              onChange={(e) => updateActiveCaption('tweetVerified', e.target.checked)}
                            />
                            Verified
                          </label>
                        </div>
                        <textarea
                          className="form-input"
                          rows={2}
                          value={activeCaption.text || ''}
                          onChange={(e) => updateActiveCaption('text', e.target.value)}
                          style={{ width: '100%', fontSize: '0.82rem', padding: '4px 8px', resize: 'vertical' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Fake Instagram Post Customizer */}
                  {activeCaption.isInstagramCard && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        background: 'var(--bg-surface-1)',
                        padding: '10px',
                        borderRadius: '10px',
                        border: '1px solid var(--glass-border)',
                        marginTop: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <InstagramLogo size={16} />
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>Instagram Card</span>
                        </div>
                        <div style={{ display: 'flex', gap: '3px' }}>
                          {['dark', 'light'].map((th) => (
                            <button
                              key={th}
                              type="button"
                              className={`btn btn-xs ${(activeCaption.igTheme || 'dark') === th ? 'btn-primary' : 'btn-ghost'}`}
                              onClick={() => {
                                const newColor = th === 'light' ? '#262626' : '#f5f5f5';
                                updateActiveCaptionProps({ igTheme: th, color: newColor });
                              }}
                              style={{ fontSize: '0.65rem', padding: '2px 6px', textTransform: 'capitalize' }}
                            >
                              {th}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Post Photo Uploader & Presets */}
                      <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '0.70rem', fontWeight: 700, color: '#ff5e36' }}>Post Photo</span>
                          <label
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 600,
                              color: '#ffffff',
                              background: 'rgba(255, 94, 54, 0.25)',
                              border: '1px solid #ff5e36',
                              borderRadius: '6px',
                              padding: '2px 8px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Upload size={11} />
                            <span>Upload Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (ev) => {
                                    updateActiveCaptionProps({ igPostImage: ev.target.result });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        </div>

                        {/* Preset Photo Chips */}
                        <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '2px' }}>
                          {IG_PRESET_IMAGES && Object.entries(IG_PRESET_IMAGES).map(([key, src]) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => updateActiveCaptionProps({ igPostImage: src })}
                              style={{
                                padding: '2px 7px',
                                borderRadius: '6px',
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                textTransform: 'capitalize',
                                background: activeCaption.igPostImage === src ? 'rgba(255,94,54,0.3)' : 'rgba(255,255,255,0.06)',
                                border: activeCaption.igPostImage === src ? '1px solid #ff5e36' : '1px solid transparent',
                                color: activeCaption.igPostImage === src ? '#ff5e36' : 'rgba(255,255,255,0.7)',
                                cursor: 'pointer'
                              }}
                            >
                              {key}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Username</label>
                          <input
                            type="text"
                            className="form-input"
                            value={activeCaption.igUsername || 'zuck'}
                            onChange={(e) => updateActiveCaption('igUsername', e.target.value)}
                            style={{ width: '100%', fontSize: '0.8rem', padding: '4px 8px' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Subtitle / Audio</label>
                          <input
                            type="text"
                            className="form-input"
                            value={activeCaption.igSubtitle || 'Original audio'}
                            onChange={(e) => updateActiveCaption('igSubtitle', e.target.value)}
                            style={{ width: '100%', fontSize: '0.8rem', padding: '4px 8px' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <label style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: '#38bdf8' }}>
                          <input
                            type="checkbox"
                            checked={activeCaption.igVerified !== false}
                            onChange={(e) => updateActiveCaption('igVerified', e.target.checked)}
                          />
                          Verified Rosette
                        </label>
                        <label style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: '#f43f5e' }}>
                          <input
                            type="checkbox"
                            checked={activeCaption.igHasStoryRing !== false}
                            onChange={(e) => updateActiveCaption('igHasStoryRing', e.target.checked)}
                          />
                          Story Ring
                        </label>
                      </div>

                      {/* Likes Count + Timestamp (2-col grid) */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Likes Count</label>
                          <input
                            type="text"
                            className="form-input"
                            value={activeCaption.igLikesCount || '1,583'}
                            onChange={(e) => updateActiveCaption('igLikesCount', e.target.value)}
                            style={{ width: '100%', fontSize: '0.8rem', padding: '4px 8px' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Timestamp</label>
                          <input
                            type="text"
                            className="form-input"
                            value={activeCaption.igTime || '28 September'}
                            onChange={(e) => updateActiveCaption('igTime', e.target.value)}
                            style={{ width: '100%', fontSize: '0.8rem', padding: '4px 8px' }}
                          />
                        </div>
                      </div>

                      {/* Comments Count + Reposts Count */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Comments Count</label>
                          <input
                            type="text"
                            className="form-input"
                            value={activeCaption.igCommentsCount ?? '15'}
                            onChange={(e) => updateActiveCaption('igCommentsCount', e.target.value)}
                            placeholder="e.g. 15"
                            style={{ width: '100%', fontSize: '0.8rem', padding: '4px 8px' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Reposts Count</label>
                          <input
                            type="text"
                            className="form-input"
                            value={activeCaption.igRepostsCount ?? '15'}
                            onChange={(e) => updateActiveCaption('igRepostsCount', e.target.value)}
                            placeholder="e.g. 15"
                            style={{ width: '100%', fontSize: '0.8rem', padding: '4px 8px' }}
                          />
                        </div>
                      </div>

                      {/* Shares Count + Follow Text */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Shares Count</label>
                          <input
                            type="text"
                            className="form-input"
                            value={activeCaption.igSharesCount ?? '295'}
                            onChange={(e) => updateActiveCaption('igSharesCount', e.target.value)}
                            placeholder="e.g. 295"
                            style={{ width: '100%', fontSize: '0.8rem', padding: '4px 8px' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Follow Text</label>
                          <input
                            type="text"
                            className="form-input"
                            value={activeCaption.igFollowText || 'Follow'}
                            onChange={(e) => updateActiveCaption('igFollowText', e.target.value)}
                            placeholder="e.g. Follow"
                            style={{ width: '100%', fontSize: '0.8rem', padding: '4px 8px' }}
                          />
                        </div>
                      </div>

                      {/* Top / Pinned Comment */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '8px' }}>
                        <div>
                          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Top Commenter</label>
                          <input
                            type="text"
                            className="form-input"
                            value={activeCaption.igTopCommentUser || ''}
                            onChange={(e) => updateActiveCaption('igTopCommentUser', e.target.value)}
                            placeholder="e.g. cristiano"
                            style={{ width: '100%', fontSize: '0.8rem', padding: '4px 8px' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Comment Text</label>
                          <input
                            type="text"
                            className="form-input"
                            value={activeCaption.igTopCommentText || ''}
                            onChange={(e) => updateActiveCaption('igTopCommentText', e.target.value)}
                            placeholder="e.g. AGI when? ðŸ˜‚ðŸ‘"
                            style={{ width: '100%', fontSize: '0.8rem', padding: '4px 8px' }}
                          />
                        </div>
                      </div>

                      {/* Caption (Below Likes) */}
                      <div>
                        <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Caption (Below Likes)</label>
                        <textarea
                          className="form-input"
                          rows={2}
                          value={activeCaption.text || ''}
                          onChange={(e) => updateActiveCaption('text', e.target.value)}
                          style={{ width: '100%', fontSize: '0.82rem', padding: '4px 8px', resize: 'vertical' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Fake WhatsApp Message Customizer (Modern iOS Multi-Message) */}
                  {activeCaption.isWhatsAppCard && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        background: 'var(--bg-surface-1)',
                        padding: '10px',
                        borderRadius: '10px',
                        border: '1px solid var(--glass-border)',
                        marginTop: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <WhatsAppLogo size={16} />
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>iOS WhatsApp Card</span>
                        </div>
                        <div style={{ display: 'flex', gap: '3px' }}>
                          {['dark', 'light'].map((th) => (
                            <button
                              key={th}
                              type="button"
                              className={`btn btn-xs ${(activeCaption.waTheme || 'dark') === th ? 'btn-primary' : 'btn-ghost'}`}
                              onClick={() => updateActiveCaptionProps({ waTheme: th })}
                              style={{ fontSize: '0.65rem', padding: '2px 6px', textTransform: 'capitalize' }}
                            >
                              {th}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Contact Name</label>
                          <input
                            type="text"
                            className="form-input"
                            value={activeCaption.waContactName || 'Mom â¤ï¸'}
                            onChange={(e) => updateActiveCaption('waContactName', e.target.value)}
                            style={{ width: '100%', fontSize: '0.8rem', padding: '4px 8px' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Status</label>
                          <input
                            type="text"
                            className="form-input"
                            value={activeCaption.waStatus || 'online'}
                            onChange={(e) => updateActiveCaption('waStatus', e.target.value)}
                            style={{ width: '100%', fontSize: '0.8rem', padding: '4px 8px' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: '#22c55e' }}>
                          <input
                            type="checkbox"
                            checked={activeCaption.waShowHeader !== false}
                            onChange={(e) => updateActiveCaption('waShowHeader', e.target.checked)}
                          />
                          Show iOS Header
                        </label>

                        <button
                          type="button"
                          onClick={() => {
                            const curMsgs = activeCaption.waMessages && activeCaption.waMessages.length > 0
                              ? activeCaption.waMessages
                              : [{ id: 'm1', text: activeCaption.text || '', direction: activeCaption.waDirection || 'received', time: activeCaption.waTime || '11:42 PM', ticks: activeCaption.waTicks || 'blue' }];
                            const lastMsg = curMsgs[curMsgs.length - 1];
                            const nextDir = lastMsg?.direction === 'sent' ? 'received' : 'sent';
                            const newMsg = {
                              id: `m_${Date.now()}`,
                              text: nextDir === 'sent' ? 'Sure thing! ðŸ‘' : 'Sounds good!',
                              direction: nextDir,
                              time: '11:45 PM',
                              ticks: 'blue'
                            };
                            updateActiveCaptionProps({ waMessages: [...curMsgs, newMsg] });
                          }}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'rgba(37, 211, 102, 0.2)',
                            border: '1px solid #25d366',
                            color: '#25d366',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Plus size={11} />
                          <span>Add Message</span>
                        </button>
                      </div>

                      {/* Multi-Message Conversation Editor */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '240px', overflowY: 'auto' }}>
                        {((activeCaption.waMessages && activeCaption.waMessages.length > 0)
                          ? activeCaption.waMessages
                          : [{ id: 'm1', text: activeCaption.text || '', direction: activeCaption.waDirection || 'received', time: activeCaption.waTime || '11:42 PM', ticks: activeCaption.waTicks || 'blue' }]
                        ).map((msg, index, arr) => {
                          const isSent = msg.direction === 'sent';
                          return (
                            <div
                              key={msg.id || index}
                              style={{
                                padding: '6px 8px',
                                borderRadius: '8px',
                                background: 'rgba(0, 0, 0, 0.3)',
                                border: isSent ? '1px solid rgba(37, 211, 102, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '5px'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontSize: '0.66rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>#{index + 1}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = arr.map((m, i) => i === index ? { ...m, direction: isSent ? 'received' : 'sent' } : m);
                                      updateActiveCaptionProps({ waMessages: updated, text: updated[0].text, waDirection: updated[0].direction });
                                    }}
                                    style={{
                                      padding: '1px 6px',
                                      borderRadius: '999px',
                                      fontSize: '0.64rem',
                                      fontWeight: 700,
                                      background: isSent ? 'rgba(37, 211, 102, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                                      border: isSent ? '1px solid #25d366' : '1px solid rgba(255, 255, 255, 0.2)',
                                      color: isSent ? '#25d366' : '#ffffff',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    {isSent ? 'Sent (Green)' : 'Received (Slate)'}
                                  </button>
                                </div>

                                {arr.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = arr.filter((_, i) => i !== index);
                                      updateActiveCaptionProps({ waMessages: updated, text: updated[0].text, waDirection: updated[0].direction });
                                    }}
                                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '1px 4px' }}
                                    title="Delete Message"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </div>

                              <textarea
                                className="form-input"
                                rows={2}
                                value={msg.text || ''}
                                onChange={(e) => {
                                  const updated = arr.map((m, i) => i === index ? { ...m, text: e.target.value } : m);
                                  updateActiveCaptionProps({ waMessages: updated, text: updated[0].text });
                                }}
                                style={{ width: '100%', fontSize: '0.78rem', padding: '3px 6px', resize: 'vertical' }}
                              />

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span style={{ fontSize: '0.64rem', color: 'rgba(255,255,255,0.4)' }}>Time:</span>
                                  <input
                                    type="text"
                                    value={msg.time || '11:42 PM'}
                                    onChange={(e) => {
                                      const updated = arr.map((m, i) => i === index ? { ...m, time: e.target.value } : m);
                                      updateActiveCaptionProps({ waMessages: updated });
                                    }}
                                    style={{ width: '75px', fontSize: '0.72rem', padding: '2px 4px' }}
                                    className="form-input"
                                  />
                                </div>

                                {isSent && (
                                  <div style={{ display: 'flex', gap: '3px' }}>
                                    {['blue', 'grey', 'single'].map((t) => (
                                      <button
                                        key={t}
                                        type="button"
                                        onClick={() => {
                                          const updated = arr.map((m, i) => i === index ? { ...m, ticks: t } : m);
                                          updateActiveCaptionProps({ waMessages: updated });
                                        }}
                                        style={{
                                          padding: '1px 5px',
                                          borderRadius: '4px',
                                          fontSize: '0.62rem',
                                          background: (msg.ticks || 'blue') === t ? 'rgba(83, 189, 235, 0.25)' : 'rgba(255,255,255,0.06)',
                                          border: (msg.ticks || 'blue') === t ? '1px solid #53bdeb' : '1px solid transparent',
                                          color: (msg.ticks || 'blue') === t ? '#53bdeb' : 'rgba(255,255,255,0.5)',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        {t === 'blue' ? 'âœ“âœ“' : t === 'grey' ? 'âœ“âœ“' : 'âœ“'}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Standard / Demotivational Caption Textarea */}
                  {(!activeCaption.isBreakingNews && !isSocialCardCaption(activeCaption)) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                      <div className="flex-between align-center">
                        <label style={{ margin: 0, fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                          {activeCaption.isDemotivationalTitle ? 'Demotivational Title' : (activeCaption.isDemotivationalSubtitle ? 'Demotivational Subtitle' : 'Caption Text')}
                        </label>
                      </div>
                      <textarea
                        className="form-input"
                        rows={2}
                        value={activeCaption.text || ''}
                        onChange={(e) => updateActiveCaption('text', e.target.value)}
                        placeholder="Enter text..."
                        style={{ width: '100%', fontSize: '0.85rem', resize: 'vertical' }}
                      />
                    </div>
                  )}
                </div>
              ) : (canvasHeader.enabled || canvasFooter.enabled) ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {canvasHeader.enabled && (
                    <div
                      style={{
                        padding: '10px 14px',
                        background: 'var(--bg-surface-1)',
                        borderRadius: '10px',
                        border: '1px dashed var(--glass-border)',
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <PanelTop size={15} style={{ color: 'var(--cyber-cyan)' }} />
                        <span>Header Extension is active.</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn btn-xs btn-secondary"
                          onClick={() => {
                            const isDark = isColorDark(canvasBgColor || '#ffffff');
                            const nextBg = isDark ? '#ffffff' : '#000000';
                            handleSetCanvasBgColor(nextBg);
                            pushHistory();
                          }}
                          style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Toggle Canvas & Header Theme (Light / Dark)"
                        >
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: canvasBgColor || '#ffffff', border: '1px solid #fff' }} />
                          <span>{isColorDark(canvasBgColor || '#ffffff') ? 'Dark' : 'Light'}</span>
                        </button>
                        <div
                          style={{ position: 'relative', overflow: 'hidden', width: 22, height: 22, borderRadius: '6px', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: canvasBgColor || '#ffffff', cursor: 'pointer', flexShrink: 0 }}
                          title="Pick Custom Canvas Background Color"
                        >
                          <input
                            type="color"
                            value={canvasBgColor || '#ffffff'}
                            onChange={(e) => {
                              handleSetCanvasBgColor(e.target.value);
                            }}
                            style={{ position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                          />
                        </div>
                        <button
                          type="button"
                          className="btn btn-xs btn-primary"
                          onClick={() => {
                            const hCap = captions.find(c => c.isHeaderCaption);
                            if (hCap) {
                              setActiveLayerId(hCap.id);
                              setActiveSubmenu(null);
                            } else {
                              handleToggleCanvasHeader();
                            }
                          }}
                          style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '12px' }}
                        >
                          Select Text
                        </button>
                      </div>
                    </div>
                  )}

                  {canvasFooter.enabled && (
                    <div
                      style={{
                        padding: '10px 14px',
                        background: 'var(--bg-surface-1)',
                        borderRadius: '10px',
                        border: '1px dashed var(--glass-border)',
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <PanelBottom size={15} style={{ color: 'var(--cyber-cyan)' }} />
                        <span>Footer Extension is active.</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn btn-xs btn-secondary"
                          onClick={() => {
                            const isDark = isColorDark(canvasBgColor || '#ffffff');
                            const nextBg = isDark ? '#ffffff' : '#000000';
                            handleSetCanvasBgColor(nextBg);
                            pushHistory();
                          }}
                          style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Toggle Canvas & Footer Theme (Light / Dark)"
                        >
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: canvasBgColor || '#ffffff', border: '1px solid #fff' }} />
                          <span>{isColorDark(canvasBgColor || '#ffffff') ? 'Dark' : 'Light'}</span>
                        </button>
                        <div
                          style={{ position: 'relative', overflow: 'hidden', width: 22, height: 22, borderRadius: '6px', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: canvasBgColor || '#ffffff', cursor: 'pointer', flexShrink: 0 }}
                          title="Pick Custom Canvas Background Color"
                        >
                          <input
                            type="color"
                            value={canvasBgColor || '#ffffff'}
                            onChange={(e) => {
                              handleSetCanvasBgColor(e.target.value);
                            }}
                            style={{ position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                          />
                        </div>
                        <button
                          type="button"
                          className="btn btn-xs btn-primary"
                          onClick={() => {
                            const fCap = captions.find(c => c.isFooterCaption);
                            if (fCap) {
                              setActiveLayerId(fCap.id);
                              setActiveSubmenu(null);
                            } else {
                              handleToggleCanvasFooter();
                            }
                          }}
                          style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '12px' }}
                        >
                          Select Text
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* EMPTY STATE (When no caption is selected) */
                <div
                  style={{
                    padding: '12px 14px',
                    background: 'var(--bg-surface-1)',
                    borderRadius: '10px',
                    border: '1px dashed var(--glass-border)',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Type size={15} style={{ color: 'var(--cyber-cyan)', opacity: 0.8 }} />
                  <span>Tap text, header, or footer on canvas to customize font, size, opacity & colors.</span>
                </div>
              )}

              {/* QUICK PHRASES SECTION */}
              <div className="preset-phrases-section" style={{ marginTop: '2px' }}>
                <div className="flex-between align-center" style={{ marginBottom: '6px' }}>
                  <label className="form-field-label" style={{ margin: 0, fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Sparkles size={12} style={{ color: 'var(--cyber-cyan)' }} /> Quick Phrases
                  </label>
                </div>
                <div className="preset-chips-scroll" style={{ paddingBottom: '4px' }}>
                  {PRESET_PHRASES.map((phrase) => (
                    <button
                      key={phrase}
                      className="phrase-chip hover-lift"
                      onClick={() => handleAddPresetPhrase(phrase)}
                      style={{
                        background: 'var(--bg-surface-1)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '16px',
                        padding: '4px 12px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--text-main)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      + {phrase}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}


          {/* TAB 3: MEDIA OVERLAY CONTROLS */}
          {activeTab === 'images' && (() => {
            return (
              <div className="tab-content animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Header Action Buttons: Upload Media | Pick Template (+ Delete if media layer selected) */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <label
                    className="btn btn-xs btn-primary hover-lift"
                    title="Upload Image or Video"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '999px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      margin: 0,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <ImagePlus className="icon-xs" /> Upload Media
                    <input
                      type="file"
                      accept="image/*,video/*"
                      style={{ display: 'none' }}
                      onChange={handleFileUploadImageLayer}
                    />
                  </label>


                  <button
                    type="button"
                    className="btn btn-xs btn-secondary hover-lift"
                    onClick={() => setImagePickerTarget('layer')}
                    title="Add template as an overlay image"
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: '999px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <Plus className="icon-xs" /> Add Overlay
                  </button>
                  {activeImageLayer && (
                    <button
                      type="button"
                      className="btn btn-icon btn-xs hover-lift vid-ctx-btn-delete"
                      onClick={() => handleDeleteLayer()}
                      title="Delete Media Layer"
                      style={{
                        flexShrink: 0,
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                        color: '#ffffff',
                        border: '1px solid rgba(255, 255, 255, 0.28)',
                        boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
                      }}
                    >
                      <Trash2 className="icon-xs" style={{ color: '#ffffff' }} />
                    </button>
                  )}
                </div>

                {templateFaceMorph && (
                  <div className="form-group margin-bottom-sm glass-card" style={{ padding: '10px 14px', borderRadius: '14px', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Smile size={14} style={{ color: 'var(--cyber-cyan)' }} />
                        {templateFaceMorph.faceName || 'Face Morph'}
                      </span>
                      <button
                        type="button"
                        className="btn btn-xs btn-ghost"
                        onClick={handleChangeFace}
                        style={{ fontSize: '0.7rem', color: 'var(--cyber-cyan)', padding: '2px 8px', borderRadius: '6px' }}
                      >
                        Change Face
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 600 }}>
                        <span style={{ color: 'var(--text-muted)' }}>Morph Intensity / Blend</span>
                        <span style={{ color: 'var(--cyber-cyan)' }}>
                          {Math.round((templateFaceMorph.morphProgress !== undefined ? templateFaceMorph.morphProgress : 0.85) * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={templateFaceMorph.morphProgress !== undefined ? templateFaceMorph.morphProgress : 0.85}
                        onChange={(e) => handleUpdateTemplateMorphProgress(parseFloat(e.target.value))}
                        style={{ accentColor: 'var(--cyber-cyan)', height: '4px' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn btn-xs hover-lift"
                        onClick={handleFinalizeTemplateFace}
                        title="Fuse face permanently into the meme template"
                        style={{
                          flex: 1,
                          padding: '6px 10px',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px',
                          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(6, 182, 212, 0.35))',
                          border: '1px solid rgba(52, 211, 153, 0.8)',
                          color: '#34d399',
                          boxShadow: '0 0 10px rgba(16, 185, 129, 0.2)'
                        }}
                      >
                        <Check size={13} /> Fuse Permanently
                      </button>

                      <button
                        type="button"
                        className="btn btn-xs hover-lift"
                        onClick={handleRevertTemplateFace}
                        title="Revert template face to original"
                        style={{
                          padding: '6px 10px',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          color: '#f87171'
                        }}
                      >
                        <X size={13} /> Revert
                      </button>
                    </div>
                  </div>
                )}
                
                {activeImageLayer && (
                  <div className="form-group margin-bottom-sm glass-card" style={{ padding: '8px 12px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Media Fit Mode</label>
                    <div className="size-control-group" style={{ display: 'flex', gap: '4px', width: '100%' }}>
                      <button 
                        className={`btn btn-xs ${activeImageLayer.fitMode === 'fit' || !activeImageLayer.fitMode ? 'btn-primary' : 'btn-secondary'}`} 
                        style={{ flex: 1 }}
                        onClick={() => updateActiveImageLayer('fitMode', 'fit')}
                      >
                        Fit
                      </button>
                      <button 
                        className={`btn btn-xs ${activeImageLayer.fitMode === 'crop' ? 'btn-primary' : 'btn-secondary'}`} 
                        style={{ flex: 1 }}
                        onClick={() => updateActiveImageLayer('fitMode', 'crop')}
                      >
                        Crop
                      </button>
                      <button 
                        className={`btn btn-xs ${activeImageLayer.fitMode === 'stretch' ? 'btn-primary' : 'btn-secondary'}`} 
                        style={{ flex: 1 }}
                        onClick={() => updateActiveImageLayer('fitMode', 'stretch')}
                      >
                        Stretch
                      </button>
                    </div>
                  </div>
                )}

                {/* VideoTrimmer Modal â€” rendered as portal to escape canvas z-index stacking context */}
                {pendingVideoLayer && createPortal(
                  <VideoTrimmer
                    videoUrl={pendingVideoLayer}
                    trimStart={0}
                    trimEnd={null}
                    onApply={(start, end) => {
                      commitAddImageLayer(pendingVideoLayer, start, end);
                      setPendingVideoLayer(null);
                    }}
                    onClose={() => setPendingVideoLayer(null)}
                  />,
                  document.body
                )}
              </div>
            );
          })()}

          {/* TAB 4: AI / FILTERS */}
          {activeTab === 'filters' && (
            <div className="tab-content animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* STATE 1: 2 Main Action Buttons / Cards (Shown when !showFilterPresets) */}
              {!showFilterPresets && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', maxWidth: '420px', margin: '0 auto', width: '100%', gap: '10px', justifyContent: 'center' }}>
                  {/* 1. Face Swap Action Button */}
                  <button
                    type="button"
                    className="btn hover-lift"
                    onClick={() => handleStartMorphFace()}
                    style={{
                      padding: '14px 12px',
                      borderRadius: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.18) 0%, rgba(99, 102, 241, 0.18) 100%)',
                      border: '1px solid rgba(6, 182, 212, 0.5)',
                      boxShadow: '0 4px 15px rgba(6, 182, 212, 0.15)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.3) 0%, rgba(99, 102, 241, 0.4) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--cyber-cyan)'
                    }}>
                      <ScanFace size={20} style={{ color: 'var(--cyber-cyan)' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>Face Swap</div>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.65)' }}>AI Neural Morph</div>
                    </div>
                  </button>

                  {/* 2. Filters Action Button */}
                  <button
                    type="button"
                    className="btn hover-lift"
                    onClick={() => setShowFiltersModal(true)}
                    style={{
                      padding: '14px 12px',
                      borderRadius: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.18) 0%, rgba(236, 72, 153, 0.18) 100%)',
                      border: '1px solid rgba(249, 115, 22, 0.6)',
                      boxShadow: '0 4px 15px rgba(249, 115, 22, 0.15)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.35) 0%, rgba(236, 72, 153, 0.35) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(249, 115, 22, 0.6)'
                    }}>
                      <Sliders size={20} style={{ color: 'var(--accent-orange)' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>Filters</div>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.65)' }}>Presets & Adjust</div>
                    </div>
                  </button>
                </div>
              )}

              {/* STATE 2: Filters Panel with Back Button (Replaces Face Swap & Filters when active) */}
              {showFilterPresets && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Back Navigation Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <button
                      type="button"
                      className="btn btn-icon btn-xs btn-secondary hover-lift"
                      onClick={() => setShowFilterPresets(false)}
                      title="Back to AI/Filters"
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sliders size={14} style={{ color: 'var(--accent-orange)' }} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>Photo Filters</span>
                    </div>
                    {imageFilters.preset !== 'original' ? (
                      <button
                        type="button"
                        className="btn btn-xs btn-ghost text-red"
                        onClick={() => {
                          setImageFilters(prev => ({
                            ...prev,
                            preset: 'original',
                            filterString: 'none',
                            brightness: 100,
                            contrast: 100,
                            saturation: 100,
                            grayscale: 0,
                            sepia: 0,
                            invert: 0,
                            hueRotate: 0,
                            blur: 0
                          }));
                        }}
                        style={{ fontSize: '0.72rem', padding: '3px 6px' }}
                      >
                        Reset
                      </button>
                    ) : <div style={{ width: '40px' }} />}
                  </div>
                  {/* Scope Selector & Reset */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--bg-surface-1)',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    border: '1px solid var(--glass-border)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Apply To:</span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          type="button"
                          className={`btn btn-xs ${imageFilters.filterScope === 'background' ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => setImageFilters(prev => ({ ...prev, filterScope: 'background' }))}
                          style={{ padding: '3px 8px', fontSize: '0.72rem', borderRadius: '12px' }}
                        >
                          Canvas Only
                        </button>
                        <button
                          type="button"
                          className={`btn btn-xs ${imageFilters.filterScope === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => setImageFilters(prev => ({ ...prev, filterScope: 'all' }))}
                          style={{ padding: '3px 8px', fontSize: '0.72rem', borderRadius: '12px' }}
                        >
                          Entire Meme
                        </button>
                      </div>
                    </div>
                    {imageFilters.preset !== 'original' && (
                      <button
                        type="button"
                        className="btn btn-xs btn-ghost text-red"
                        onClick={() => {
                          setImageFilters(prev => ({
                            ...prev,
                            preset: 'original',
                            filterString: 'none',
                            brightness: 100,
                            contrast: 100,
                            saturation: 100,
                            grayscale: 0,
                            sepia: 0,
                            invert: 0,
                            hueRotate: 0,
                            blur: 0
                          }));
                        }}
                        style={{ fontSize: '0.72rem', padding: '3px 6px' }}
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  {/* Filter Presets Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))',
                    gap: '8px',
                    maxHeight: '260px',
                    overflowY: 'auto',
                    padding: '4px 2px'
                  }}>
                    {(() => {
                      let previewImage = 'https://images.unsplash.com/photo-1555685812-4b943f1cb0eb?w=100&q=80';
                      if (activeImageLayer) {
                        previewImage = activeImageLayer.originalUrl || activeImageLayer.url || activeImageLayer.src || previewImage;
                      } else if (imageLayers && imageLayers.length > 0) {
                        previewImage = imageLayers[0].originalUrl || imageLayers[0].url || imageLayers[0].src || previewImage;
                      } else if (template?.imageUrl) {
                        previewImage = template.imageUrl;
                      }

                      return PHOTO_FILTERS.map((filterItem) => {
                        const isFilterActive = (imageFilters.preset || 'original') === filterItem.id;
                        return (
                          <button
                            key={filterItem.id}
                            type="button"
                            className={`btn btn-xs ${isFilterActive ? 'active' : ''}`}
                            onClick={() => {
                              setImageFilters(prev => ({
                                ...prev,
                                preset: filterItem.id,
                                filterString: filterItem.filterString,
                                ...filterItem.values
                              }));
                            }}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              padding: '6px 4px',
                              borderRadius: '12px',
                              background: isFilterActive ? 'rgba(249, 115, 22, 0.2)' : 'var(--bg-surface-1)',
                              border: isFilterActive ? '1.5px solid var(--accent-orange)' : '1px solid var(--glass-border)',
                              cursor: 'pointer',
                              gap: '5px',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              backgroundImage: `url(${previewImage})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              filter: filterItem.filterString,
                              border: isFilterActive ? '2px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.2)',
                              boxShadow: isFilterActive ? '0 0 8px rgba(249, 115, 22, 0.5)' : 'none'
                            }} />
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: isFilterActive ? 700 : 500,
                              color: isFilterActive ? '#ffffff' : 'var(--text-muted)',
                              textAlign: 'center',
                              lineHeight: 1.1,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '70px'
                            }}>
                              {filterItem.name.replace(' ðŸ”¥', '')}
                            </span>
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}
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
