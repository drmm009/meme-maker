import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import CanvasEditor, { TWEET_TREND_PRESETS } from './CanvasEditor';
import { FONTS } from '../data/stickers';
import confetti from 'canvas-confetti';
import {
  Type, Plus, Trash2, Undo, Redo, Download, Share2, Sparkles, Copy, Blend,
  Sliders, Smile, Sticker, ArrowLeft, Save, Check, RefreshCw,
  Image as ImageIcon, Search, X, Upload, RotateCw, ZoomIn, Crop, LayoutGrid, Scissors, Play, Pause, FolderHeart, Droplet, Monitor,
  Highlighter, Palette, Sun, Moon, ChevronDown, ChevronLeft, PencilLine, Move, ArrowDownRight, Wand2,
  Layers, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, Eye, EyeOff, Lock, Unlock, FlipHorizontal,
  PanelTop, PanelBottom, MessageSquare, MessageSquareQuote, Flame, Tv, MessageCircle, Shield, Circle, TrendingDown, Ban,
  AlignLeft, AlignCenter, AlignRight,
  Brush, SunMedium, ImagePlus, LayoutTemplate, Rows3, WandSparkles, ScanFace
} from 'lucide-react';
import AiCaptionModal from './AiCaptionModal';
import MemeStylesModal, { TwitterVerifiedBadge } from './MemeStylesModal';
import FaceMorphModal from './FaceMorphModal';
import BottomSheet from './BottomSheet';
import MemeStickersBottomSheet from './editor/MemeStickersBottomSheet';
import EmojiBottomSheet from './editor/EmojiBottomSheet';
import TemplatePickerBottomSheet from './editor/TemplatePickerBottomSheet';
import PhotoFiltersBottomSheet from './editor/PhotoFiltersBottomSheet';
import BubbleChatBottomSheet from './editor/BubbleChatBottomSheet';
import FacePinpointOverlay from './FacePinpointOverlay';
import { fuseFaceIntoTemplate } from '../utils/faceGraftEngine';
import { detectFaceOnTemplate } from '../utils/faceLandmarkerService';
import { downloadImageHelper, recordCanvasAsVideo } from '../utils/downloadHelper';
import { motion, AnimatePresence } from 'framer-motion';
import { MEME_TEMPLATES, CATEGORIES } from '../data/templates';
import { fetchOpenSourceMemes } from '../services/memeService';
import VideoTrimmer from './VideoTrimmer';
import AspectRatioDropdown from './AspectRatioDropdown';
import { PHOTO_FILTERS } from '../data/photoFilters';
import { removeBackground } from '@imgly/background-removal';
import { safeGet, safeSet } from '../utils/storage';
import { blobToDataURL, dataURLToBlob } from '../utils/galleryStore';
import { useMemeHistory, cloneSnapshot } from '../hooks/useMemeHistory';
import {
  PRESET_PHRASES,
  BUBBLE_LAYOUT_OPTIONS,
  COLOR_SWATCHES,
  DRAW_COLORS,
  getNonOverlappingPosition,
  isColorDark,
} from '../utils/captionLayout';
import './MemeEditor.css';

export const XSocialLogo = ({ size = 16, style = {}, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    aria-hidden="true"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export const TEXT_EFFECTS = [
  {
    id: 'flat',
    name: 'Flat',
    title: 'Flat (Classic standard text)',
    curve: 0,
    renderLabel: () => (
      <span style={{ fontWeight: 800, color: '#ffffff', letterSpacing: '0.3px' }}>
        Flat
      </span>
    )
  },
  {
    id: 'arch',
    name: 'Arch',
    title: 'Arch (Curved upward text)',
    curve: 40,
    renderLabel: () => (
      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#ffffff' }}>
        <span style={{ display: 'inline-block', transform: 'translateY(1.5px)' }}>A</span>
        <span style={{ display: 'inline-block', transform: 'translateY(-1.5px)' }}>r</span>
        <span style={{ display: 'inline-block', transform: 'translateY(-1.5px)' }}>c</span>
        <span style={{ display: 'inline-block', transform: 'translateY(1.5px)' }}>h</span>
      </span>
    )
  },
  {
    id: 'smile',
    name: 'Smile',
    title: 'Smile (Curved downward text)',
    curve: -40,
    renderLabel: () => (
      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#ffffff' }}>
        <span style={{ display: 'inline-block', transform: 'translateY(-1.5px)' }}>S</span>
        <span style={{ display: 'inline-block', transform: 'translateY(0px)' }}>m</span>
        <span style={{ display: 'inline-block', transform: 'translateY(1.8px)' }}>i</span>
        <span style={{ display: 'inline-block', transform: 'translateY(0px)' }}>l</span>
        <span style={{ display: 'inline-block', transform: 'translateY(-1.5px)' }}>e</span>
      </span>
    )
  },
  {
    id: 'shadow',
    name: 'Shadow',
    title: 'Shadow (Bold meme drop shadow)',
    curve: 0,
    renderLabel: () => (
      <span style={{
        fontWeight: 800,
        color: '#ffffff',
        textShadow: '2px 2px 0px #000000, 3px 3px 2px rgba(0,0,0,0.85)',
        letterSpacing: '0.3px'
      }}>
        Shadow
      </span>
    )
  },
  {
    id: 'glow',
    name: 'Glow',
    title: 'Glow (Neon cyan electric aura)',
    curve: 0,
    renderLabel: () => (
      <span style={{
        fontWeight: 800,
        color: '#ffffff',
        textShadow: '0 0 4px #00f0ff, 0 0 10px #00f0ff, 0 0 16px #00f0ff',
        letterSpacing: '0.3px'
      }}>
        Glow
      </span>
    )
  },
  {
    id: 'glitch',
    name: 'Glitch',
    title: 'Glitch (Chromatic aberration red/cyan split)',
    curve: 0,
    renderLabel: () => (
      <span style={{
        fontWeight: 800,
        color: '#ffffff',
        textShadow: '-1.5px 0 #ff0055, 1.5px 0 #00ffff',
        letterSpacing: '0.5px'
      }}>
        Glitch
      </span>
    )
  },
  {
    id: '3d',
    name: '3D',
    title: '3D (Extruded pop layered shadow)',
    curve: 0,
    renderLabel: () => (
      <span style={{
        fontWeight: 800,
        color: '#ffffff',
        textShadow: '1px 1px 0 #ea580c, 2px 2px 0 #c2410c, 3px 3px 0 #000000',
        letterSpacing: '0.5px'
      }}>
        3D
      </span>
    )
  },
  {
    id: 'hollow',
    name: 'Hollow',
    title: 'Hollow (Transparent outline text)',
    curve: 0,
    renderLabel: () => (
      <span style={{
        fontWeight: 900,
        color: 'transparent',
        WebkitTextStroke: '1px #ffffff',
        letterSpacing: '0.5px'
      }}>
        Hollow
      </span>
    )
  }
];

function CanvasColorPicker({ canvasBgColor, setCanvasBgColor }) {
  const [localColor, setLocalColor] = React.useState(canvasBgColor);
  const timerRef = React.useRef(null);

  React.useEffect(() => {
    setLocalColor(canvasBgColor);
  }, [canvasBgColor]);

  const handleChange = (e) => {
    const val = e.target.value;
    setLocalColor(val);
    window.dispatchEvent(new CustomEvent('liveCanvasBgColor', { detail: val }));
    
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setCanvasBgColor(val);
    }, 150); // debounce setting main state
  };

  return (
    <div
      className="btn btn-xs vid-ctx-btn"
      style={{ position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '4px 10px', borderRadius: '10px' }}
      title="Canvas Color"
    >
      <div style={{ width: 14, height: 14, borderRadius: '50%', background: localColor || '#ffffff', border: '2px solid rgba(255,255,255,0.4)' }} />
      <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Canvas Color</span>
      <input type="color" value={localColor || '#ffffff'} onChange={handleChange} style={{ position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
    </div>
  );
}

const secondaryVariants = {
  initial: { opacity: 0, x: 20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] }
  },
  exit: {
    opacity: 0,
    x: -16,
    transition: { duration: 0.12, ease: [0.22, 1, 0.36, 1] }
  }
};

export default function MemeEditor({ template, onBack, onSaveToGallery, theme, onToggleTheme }) {
  const [imageLayers, setImageLayers] = useState(() => {
    return (template?.imageLayers || []).map((img, idx) => ({
      ...img,
      id: img.id || `img-${idx}-${Date.now()}`,
      zIndex: idx
    }));
  });

  const [stickers, setStickers] = useState(() => {
    const baseZ = (template?.imageLayers || []).length;
    return (template?.defaultStickers || template?.stickers || []).map((s, idx) => ({
      ...s,
      id: s.id || `stk-${idx}-${Date.now()}`,
      zIndex: baseZ + idx
    }));
  });

  const [captions, setCaptions] = useState(() => {
    const baseZ = (template?.imageLayers || []).length + (template?.defaultStickers || template?.stickers || []).length;
    let initialCaps = [];
    const rawCaps = template?.defaultCaptions || template?.captions;

    if (rawCaps) {
      initialCaps = rawCaps.map((c, idx) => ({
        fontSize: 50, color: '#ffffff', stroke: '#000000', align: 'center', fontFamily: 'Impact, sans-serif',
        rotation: 0,
        ...c, id: c.id || `cap-${idx}-${Date.now()}`,
        zIndex: baseZ + idx
      }));
    } else if (template?.isNativeLayout && template?.layoutDef) {
      const layoutDef = template.layoutDef;
      const totalSlots = layoutDef.slots;
      const isVert = layoutDef.id === '2-vert' || layoutDef.id === '3-stacked';
      const isHoriz = layoutDef.id === '2-horiz' || layoutDef.id === '3-horiz';
      const isGrid = layoutDef.id === '4-grid';
      const isHybrid = layoutDef.id === '3-hybrid';

      (template.slotImages || []).forEach((img, idx) => {
        if (!img || img === 'TEXT_PANEL') {
          let cx = 0.5, cy = 0.5;
          if (isVert) {
            cy = (idx + 0.5) / totalSlots;
          } else if (isHoriz) {
            cx = (idx + 0.5) / totalSlots;
          } else if (isGrid) {
            cx = ((idx % 2) + 0.5) / 2;
            cy = (Math.floor(idx / 2) + 0.5) / 2;
          } else if (isHybrid) {
            if (idx === 0) {
              cx = 0.5; cy = 0.25;
            } else {
              cx = ((idx - 1) + 0.5) / 2;
              cy = 0.75;
            }
          }
          initialCaps.push({
            text: 'ADD TEXT', x: cx, y: cy, fontSize: 45, color: '#000000', stroke: 'transparent', align: 'center', fontFamily: 'Impact, sans-serif',
            rotation: 0, width: undefined, id: `cap-slot-${idx}-${Date.now()}`,
            zIndex: baseZ + initialCaps.length
          });
        }
      });
    } else {
      initialCaps = [
        { text: 'TOP TEXT', x: 0.5, y: 0.15, fontSize: 50, color: '#ffffff', stroke: '#000000', align: 'center', fontFamily: 'Impact, sans-serif',
          rotation: 0, id: `cap-top-${Date.now()}`, zIndex: baseZ },
        { text: 'BOTTOM TEXT', x: 0.5, y: 0.85, fontSize: 50, color: '#ffffff', stroke: '#000000', align: 'center', fontFamily: 'Impact, sans-serif',
          rotation: 0, id: `cap-bot-${Date.now()}`, zIndex: baseZ + 1 }
      ];
    }
    return initialCaps;
  });

  const [activeLayerId, setActiveLayerId] = useState(null);

  // Native Multi-Panel Layout Support
  const isNativeLayout = template?.isNativeLayout || false;
  const layoutDef = template?.layoutDef || null;
  const [slotImages, setSlotImages] = useState(() => {
    const whitePixelUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=';
    return (template?.slotImages || []).map(img => {
      if (!img || img === 'TEXT_PANEL') return whitePixelUrl;
      return img;
    });
  });
  const [slotTransforms, setSlotTransforms] = useState(template?.slotTransforms || []);

  const [activeTemplate, setActiveTemplate] = useState(template);
  const pickingTemplateRef = useRef(false);

  useEffect(() => {
    setActiveTemplate(template);
    setActiveLayerId(null);
    setActiveTab('text');
  }, [template]);


  const [aspectRatio, setAspectRatio] = useState(template?.aspectRatio || 'original');
  
  const [imageFit, setImageFit] = useState(template?.imageFit || 'contain');

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

  // History stack for Undo / Redo (capped, structuredClone, timer cleanup in hook)
  const buildInitialSnapshot = () => {
    const baseImgZ = 0;
    const initialImageLayers = (template?.imageLayers || []).map((img, idx) => ({
      ...img,
      id: img.id || `img-${idx}-${Date.now()}`,
      zIndex: baseImgZ + idx
    }));

    const baseStkZ = initialImageLayers.length;
    const initialStickers = (template?.defaultStickers || template?.stickers || []).map((s, idx) => ({
      ...s,
      id: s.id || `stk-${idx}-${Date.now()}`,
      zIndex: baseStkZ + idx
    }));

    const baseCapZ = baseStkZ + initialStickers.length;
    const initialCaptions = (template?.defaultCaptions || template?.captions || [
      { text: 'TOP TEXT', x: 0.5, y: 0.15, fontSize: 50, color: '#ffffff', stroke: '#000000', align: 'center', fontFamily: 'Impact, sans-serif',
      rotation: 0 },
      { text: 'BOTTOM TEXT', x: 0.5, y: 0.85, fontSize: 50, color: '#ffffff', stroke: '#000000', align: 'center', fontFamily: 'Impact, sans-serif',
      rotation: 0 }
    ]).map((c, idx) => ({
      color: '#ffffff',
      stroke: '#000000',
      align: 'center',
      fontFamily: 'Impact, sans-serif',
      rotation: 0,
      ...c,
      width: undefined, // Clear template width to force tight hugging initially
      fontSize: c.fontSize || 45, // Respect template font size or fallback to 45px
      id: c.id || `cap-${idx}-${Date.now()}`,
      zIndex: baseCapZ + idx
    }));

    return {
      captions: cloneSnapshot(initialCaptions),
      stickers: cloneSnapshot(initialStickers),
      imageLayers: cloneSnapshot(initialImageLayers),
      canvasHeader: template?.canvasHeader || {
        enabled: false,
        bgColor: '#ffffff',
        height: 140
      },
      canvasFooter: template?.canvasFooter || {
        enabled: false,
        bgColor: '#ffffff',
        height: 140
      },
      demotivational: template?.demotivational || {
        enabled: false,
        title: 'PROCRASTINATION',
        subtitle: 'Hard work pays off in the future, laziness pays off now.'
      },
      canvasFlipX: template?.canvasFlipX || false,
      templateImageUrl: template?.imageUrl || template?.rawImageUrl || null,
      templateFaceMorph: null
    };
  };
  const { history, historyStep, pushSnapshot, pushSnapshotDebounced, undoSnapshot, redoSnapshot } =
    useMemeHistory(buildInitialSnapshot, { limit: 30, debounceMs: 800 });

  const [canvasBgColor, setCanvasBgColor] = useState(template?.canvasBgColor || '#ffffff');
  const [canvasFlipX, setCanvasFlipX] = useState(template?.canvasFlipX || false);

  const [canvasHeader, setCanvasHeader] = useState(() => {
    return template?.canvasHeader || {
      enabled: false,
      bgColor: template?.canvasBgColor || '#ffffff',
      height: 140
    };
  });

  const [canvasFooter, setCanvasFooter] = useState(() => {
    return template?.canvasFooter || {
      enabled: false,
      bgColor: template?.canvasBgColor || '#ffffff',
      height: 140
    };
  });

  const [demotivational, setDemotivational] = useState(() => {
    return template?.demotivational || {
      enabled: false,
      title: 'PROCRASTINATION',
      subtitle: 'Hard work pays off in the future, laziness pays off now.'
    };
  });
  const [showStylesModal, setShowStylesModal] = useState(false);
  const [showFaceMorphModal, setShowFaceMorphModal] = useState(false);
  const [morphTargetLayerId, setMorphTargetLayerId] = useState(null);
  const [morphTargetUrl, setMorphTargetUrl] = useState(null);
  const [isPinpointingFace, setIsPinpointingFace] = useState(false);
  const [faceTarget, setFaceTarget] = useState({ x: 0.5, y: 0.38, radius: 0.14 });
  const [sampledFaceLighting, setSampledFaceLighting] = useState(null);
  const [extractedMemeFace, setExtractedMemeFace] = useState(null);
  const [templateFaceMorph, setTemplateFaceMorph] = useState(null);
  const [isHoldingCanvasCompare, setIsHoldingCanvasCompare] = useState(false);
  const originalTemplateImgRef = useRef(null);

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
  const [showWatermarkMenu, setShowWatermarkMenu] = useState(false);
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showTextEffectsMenu, setShowTextEffectsMenu] = useState(false);
  const showTextCurveMenu = showTextEffectsMenu;
  const setShowTextCurveMenu = setShowTextEffectsMenu;
  const [showTextBlurMenu, setShowTextBlurMenu] = useState(false);
  const [showTextBgMenu, setShowTextBgMenu] = useState(false);
  const [showImageFilterMenu, setShowImageFilterMenu] = useState(false);
  const [showFilterPresets, setShowFilterPresets] = useState(false);
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [showDrawSettings, setShowDrawSettings] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState(null); // 'font' | 'color' | 'align' | 'effects' | 'bg' | 'blur' | 'bubble' | 'tweetTheme' | 'tweetTrend' | 'drawSettings' | 'watermark' | 'canvasBg' | 'banner' | 'filters'
  const handleToggleSubmenu = (menuName) => {
    setActiveSubmenu(prev => prev === menuName ? null : menuName);
    setLastUsedSettingButton(menuName);
  };
  const [pasteToast, setPasteToast] = useState(false);
  const [imageFilters, setImageFilters] = useState({
    preset: 'original',
    brightness: 100,
    contrast: 100,
    saturation: 100,
    grayscale: 0,
    sepia: 0,
    invert: 0,
    hueRotate: 0,
    blur: 0,
    filterString: 'none',
    filterScope: 'all'
  });
  const [filterTarget, setFilterTarget] = useState('canvas'); // 'canvas' | 'layer'

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setActiveLayerId(null);
    setShowDrawSettings(false);
    setShowFontMenu(false);
    setShowTextEffectsMenu(false);
    setShowTextBlurMenu(false);
    setShowTextBgMenu(false);
    setShowFilterPresets(false);
    if (tabId === 'draw') {
      setActiveSubmenu('drawSettings');
    } else if (tabId === 'filters') {
      setActiveSubmenu(null);
    } else if (tabId === 'canvas' || tabId === 'watermark') {
      setActiveSubmenu('canvasBg');
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
  const [isRemovingBg, setIsRemovingBg] = useState(false);

  // Freehand Drawing state
  const [drawings, setDrawings] = useState([]);
  const [drawTool, setDrawTool] = useState(null); // 'brush' | 'eraser' | null (deactivated by default)
  const [brushColor, setBrushColor] = useState('#ff2a5f');
  const [brushSize, setBrushSize] = useState(10);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [exportedImageUri, setExportedImageUri] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showBubbleLayouts, setShowBubbleLayouts] = useState(false);
  const [showHeaderFooterMenu, setShowHeaderFooterMenu] = useState(false);
  const [showTextAlignMenu, setShowTextAlignMenu] = useState(false);
  const [lastUsedSettingButton, setLastUsedSettingButton] = useState(null);
  const contextToolbarRef = useRef(null);
  const [showTweetThemeMenu, setShowTweetThemeMenu] = useState(false);
  const [showTweetTrendMenu, setShowTweetTrendMenu] = useState(false);
  const [exportFormat, setExportFormat] = useState('png'); // 'png' | 'jpeg' | 'webp'
  const [exportQuality, setExportQuality] = useState(0.92);
  const [exportPreset, setExportPreset] = useState('hd'); // 'hd' | 'discord' | 'compact'
  const [exportFileSize, setExportFileSize] = useState(null);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef(null);
  const [directCopyStatus, setDirectCopyStatus] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [exportedVideoUrl, setExportedVideoUrl] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [memeCustomName, setMemeCustomName] = useState('');
  const [isFontPickerOpen, setIsFontPickerOpen] = useState(false);
  const [showVideoTrimmer, setShowVideoTrimmer] = useState(false);
  const [pendingVideoLayer, setPendingVideoLayer] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);

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

  // Close export dropdown when clicking outside
  useEffect(() => {
    if (!exportDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) {
        setExportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [exportDropdownOpen]);

  // Ensure Text tab is active by default when user reaches editor and no layer is auto-selected
  useEffect(() => {
    setActiveLayerId(null);
    setActiveTab('text');
  }, []);

  // Reset tweet toolbar submenus on active layer change
  useEffect(() => {
    setShowTweetThemeMenu(false);
    setShowTweetTrendMenu(false);
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
  // Subscribe-once via ref mirror: the ref always points at the latest closure, so typing
  // and arrow-nudges don't re-attach document listeners on every render.
  const keyHandlerRef = useRef(null);
  keyHandlerRef.current = (e) => {
      // Skip if focus is inside a text input / textarea / contenteditable
      const tag = document.activeElement?.tagName?.toLowerCase();
      const isEditing =
        tag === 'input' ||
        tag === 'textarea' ||
        document.activeElement?.isContentEditable;
      if (isEditing) return;

      const isMac = navigator.platform?.toUpperCase().includes('MAC');
      const ctrl = isMac ? e.metaKey : e.ctrlKey;

      if (ctrl && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      } else if (ctrl && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        handleRedo();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && activeLayerId) {
        e.preventDefault();
        handleDeleteLayer();
      } else if (ctrl && e.key === 'd' && activeLayerId) {
        e.preventDefault();
        handleDuplicateLayer();
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && activeLayerId) {
        e.preventDefault();
        const moveAmount = e.shiftKey ? 10 : 1;
        const dx = e.key === 'ArrowLeft' ? -moveAmount : (e.key === 'ArrowRight' ? moveAmount : 0);
        const dy = e.key === 'ArrowUp' ? -moveAmount : (e.key === 'ArrowDown' ? moveAmount : 0);
        
        const cIdx = captions.findIndex(c => c.id === activeLayerId);
        if (cIdx > -1) {
           const newCaps = [...captions];
           newCaps[cIdx] = { ...newCaps[cIdx], x: newCaps[cIdx].x + dx, y: newCaps[cIdx].y + dy };
           setCaptions(newCaps);
           pushHistoryDebounced(newCaps, stickers, imageLayers, drawings);
        } else {
           const sIdx = stickers.findIndex(s => s.id === activeLayerId);
           if (sIdx > -1) {
             const newStks = [...stickers];
             newStks[sIdx] = { ...newStks[sIdx], x: newStks[sIdx].x + dx, y: newStks[sIdx].y + dy };
             setStickers(newStks);
             pushHistoryDebounced(captions, newStks, imageLayers, drawings);
           } else {
             const iIdx = imageLayers.findIndex(i => i.id === activeLayerId);
             if (iIdx > -1) {
               const newImgs = [...imageLayers];
               newImgs[iIdx] = { ...newImgs[iIdx], x: newImgs[iIdx].x + dx, y: newImgs[iIdx].y + dy };
               setImageLayers(newImgs);
               pushHistoryDebounced(captions, stickers, newImgs, drawings);
             }
           }
        }
      } else if ((e.key === ']' || e.key === '}') && activeLayerId) {
        e.preventDefault();
        if (ctrl && e.shiftKey) {
          moveLayer(activeLayerId, 'front');
        } else {
          moveLayer(activeLayerId, 'forward');
        }
      } else if ((e.key === '[' || e.key === '{') && activeLayerId) {
        e.preventDefault();
        if (ctrl && e.shiftKey) {
          moveLayer(activeLayerId, 'back');
        } else {
          moveLayer(activeLayerId, 'backward');
        }
      } else if (e.key === 'Escape') {
        setActiveLayerId(null);
      }
    };

  useEffect(() => {
    const h = (e) => keyHandlerRef.current?.(e);
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  // Global clipboard paste listener (Ctrl+V image/gif onto canvas) — subscribe once, same pattern
  const pasteHandlerRef = useRef(null);
  pasteHandlerRef.current = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      const isEditing = tag === 'input' || tag === 'textarea' || document.activeElement?.isContentEditable;
      if (isEditing) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type && item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            blobToDataURL(file).then((url) => {
              commitAddImageLayer(url);
              setPasteToast(true);
              setTimeout(() => setPasteToast(false), 2600);
            }).catch((err) => {
              console.error('Failed to convert pasted image to data URL:', err);
            });
          }
          break;
        }
      }
    };

  useEffect(() => {
    const h = (e) => pasteHandlerRef.current?.(e);
    window.addEventListener('paste', h);
    return () => window.removeEventListener('paste', h);
  }, []);

  const pushHistory = (
    newCaptions,
    newStickers,
    newImgLayers = imageLayers,
    newDrawings = drawings,
    newCanvasHeader = canvasHeader,
    newCanvasFooter = canvasFooter,
    newDemotivational = demotivational,
    newCanvasFlipX = canvasFlipX,
    newTemplateImageUrl = (activeTemplate?.rawImageUrl || activeTemplate?.imageUrl || null),
    newTemplateFaceMorph = templateFaceMorph
  ) => {
    pushSnapshot({
      captions: cloneSnapshot(newCaptions),
      stickers: cloneSnapshot(newStickers),
      imageLayers: cloneSnapshot(newImgLayers),
      drawings: cloneSnapshot(newDrawings),
      canvasHeader: cloneSnapshot(newCanvasHeader),
      canvasFooter: cloneSnapshot(newCanvasFooter),
      demotivational: cloneSnapshot(newDemotivational),
      canvasFlipX: Boolean(newCanvasFlipX),
      templateImageUrl: newTemplateImageUrl,
      templateFaceMorph: newTemplateFaceMorph ? cloneSnapshot(newTemplateFaceMorph) : null
    });
  };

  // Debounced version — used for text typing so history isn't pushed on every keypress
  const pushHistoryDebounced = (
    newCaptions,
    newStickers,
    newImgLayers = imageLayers,
    newDrawings = drawings,
    newCanvasHeader = canvasHeader,
    newCanvasFooter = canvasFooter,
    newDemotivational = demotivational,
    newCanvasFlipX = canvasFlipX,
    newTemplateImageUrl = (activeTemplate?.rawImageUrl || activeTemplate?.imageUrl || null),
    newTemplateFaceMorph = templateFaceMorph
  ) => {
    pushSnapshotDebounced({
      captions: cloneSnapshot(newCaptions),
      stickers: cloneSnapshot(newStickers),
      imageLayers: cloneSnapshot(newImgLayers),
      drawings: cloneSnapshot(newDrawings),
      canvasHeader: cloneSnapshot(newCanvasHeader),
      canvasFooter: cloneSnapshot(newCanvasFooter),
      demotivational: cloneSnapshot(newDemotivational),
      canvasFlipX: Boolean(newCanvasFlipX),
      templateImageUrl: newTemplateImageUrl,
      templateFaceMorph: newTemplateFaceMorph ? cloneSnapshot(newTemplateFaceMorph) : null
    });
  };

  const handleToggleCanvasFlip = () => {
    const nextFlip = !canvasFlipX;
    setCanvasFlipX(nextFlip);
    pushHistory(captions, stickers, imageLayers, drawings, canvasHeader, canvasFooter, demotivational, nextFlip);
  };

  const applySnapshot = (snapshot) => {
    setCaptions(cloneSnapshot(snapshot.captions));
    setStickers(cloneSnapshot(snapshot.stickers));
    setImageLayers(cloneSnapshot(snapshot.imageLayers || []));
    setDrawings(cloneSnapshot(snapshot.drawings || []));
    if (snapshot.canvasHeader) {
      setCanvasHeader(cloneSnapshot(snapshot.canvasHeader));
    }
    if (snapshot.canvasFooter) {
      setCanvasFooter(cloneSnapshot(snapshot.canvasFooter));
    }
    if (snapshot.demotivational) {
      setDemotivational(cloneSnapshot(snapshot.demotivational));
    }
    if (snapshot.canvasFlipX !== undefined) {
      setCanvasFlipX(Boolean(snapshot.canvasFlipX));
    }
    if (snapshot.templateImageUrl !== undefined && snapshot.templateImageUrl !== null) {
      setActiveTemplate(prev => ({
        ...prev,
        rawImageUrl: snapshot.templateImageUrl,
        imageUrl: snapshot.templateImageUrl
      }));
    }
    setTemplateFaceMorph(snapshot.templateFaceMorph ? cloneSnapshot(snapshot.templateFaceMorph) : null);
  };

  const handleUndo = () => {
    const snapshot = undoSnapshot();
    if (snapshot) applySnapshot(snapshot);
  };

  const handleRedo = () => {
    const snapshot = redoSnapshot();
    if (snapshot) applySnapshot(snapshot);
  };

  const handleAddDrawing = (newDrawing) => {
    const nextDrawings = [...drawings, newDrawing];
    setDrawings(nextDrawings);
    pushHistory(captions, stickers, imageLayers, nextDrawings);
  };

  const handleClearDrawings = () => {
    setDrawings([]);
    pushHistory(captions, stickers, imageLayers, []);
  };

  const handleUndoDrawing = () => {
    if (drawings.length === 0) return;
    const nextDrawings = drawings.slice(0, -1);
    setDrawings(nextDrawings);
    pushHistory(captions, stickers, imageLayers, nextDrawings);
  };

  const handleOpenSaveModal = () => {
    setActiveLayerId(null);
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.exportCleanImage
        ? canvasRef.current.exportCleanImage('image/png')
        : canvasRef.current.toDataURL('image/png');
      setExportedImageUri(dataUrl);
      const cleaned = cleanTemplateName(template?.name);
      const defaultName = cleaned || (captions[0]?.text && captions[0].text !== 'TOP TEXT' ? captions[0].text : '') || 'My Meme';
      setMemeCustomName(defaultName);
      setIsSaveModalOpen(true);
    }
  };

  const updateExportUriAndSize = (format = exportFormat, quality = exportQuality) => {
    if (!canvasRef.current) return;
    const mimeType = format === 'jpeg' ? 'image/jpeg' : (format === 'webp' ? 'image/webp' : 'image/png');
    const q = format === 'png' ? undefined : quality;
    const dataUrl = canvasRef.current.exportCleanImage
      ? canvasRef.current.exportCleanImage(mimeType, q)
      : canvasRef.current.toDataURL(mimeType, q);
    setExportedImageUri(dataUrl);
    // Base64 size estimation
    const bytes = Math.round((dataUrl.length * 3) / 4);
    setExportFileSize(bytes);
  };

  const handleSelectExportFormat = (fmt) => {
    setExportFormat(fmt);
    updateExportUriAndSize(fmt, exportQuality);
  };

  const handleSelectExportQuality = (q) => {
    setExportQuality(q);
    updateExportUriAndSize(exportFormat, q);
  };

  const handleSelectExportPreset = (preset) => {
    setExportPreset(preset);
    if (preset === 'hd') {
      setExportFormat('png');
      updateExportUriAndSize('png', 1.0);
    } else if (preset === 'discord') {
      setExportFormat('jpeg');
      setExportQuality(0.85);
      updateExportUriAndSize('jpeg', 0.85);
    } else if (preset === 'compact') {
      setExportFormat('webp');
      setExportQuality(0.75);
      updateExportUriAndSize('webp', 0.75);
    }
  };

  const handleExport = () => {
    setActiveLayerId(null);
    setTimeout(() => {
      if (canvasRef.current) {
        updateExportUriAndSize(exportFormat, exportQuality);
        setIsExportModalOpen(true);
      }
    }, 50);
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
    pushHistory(nextCaps, stickers, imageLayers, drawings, canvasHeader, canvasFooter, demotivational);
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

  const handleConvertToBubble = () => {
    if (!activeCaption) return;
    if (activeCaption.bubbleStyle) {
      setShowBubbleLayouts(true);
      return;
    }

    const nextBg = '#007aff';
    const nextColor = '#ffffff';
    const nextFont = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const nextStroke = 'transparent';
    const nextStrokeWidth = 0;
    const nextWidth = activeCaption.width || 0.65;

    updateActiveCaptionProps({
      bubbleStyle: 'imessage-send',
      bgColor: nextBg,
      color: nextColor,
      fontFamily: nextFont,
      stroke: nextStroke,
      strokeWidth: nextStrokeWidth,
      width: nextWidth
    });
    setShowBubbleLayouts(true);
    setShowBubbleBottomSheet(true);
  };

  const handleAddSpeechBubble = handleAddBubble;

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
        pushHistory(nextCaps, stickers, imageLayers, drawings, canvasHeader, canvasFooter);
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
        pushHistory(nextCaps, stickers, imageLayers, drawings, canvasHeader, canvasFooter);
      }
    } else {
      // Standard caption
      if (activeCaption) {
        const nextCaps = captions.map(c => c.id === activeCaption.id ? { ...c, text: captionText } : c);
        setCaptions(nextCaps);
        pushHistory(nextCaps, stickers, imageLayers);
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
        pushHistory(nextCaps, stickers, imageLayers);
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
    pushHistory(nextCaps, stickers, imageLayers);
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
    pushHistory(nextCaps, stickers, imageLayers);
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
    pushHistory(nextCaps, stickers, imageLayers);
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
        pushHistory(captions, stickers, imageLayers, drawings, nextHeader, canvasFooter);
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
        pushHistory(nextCaps, stickers, imageLayers, drawings, nextHeader, canvasFooter);
      }
    } else {
      const headerCap = captions.find(c => c.isHeaderCaption);
      const nextCaps = captions.filter(c => !c.isHeaderCaption);
      setCaptions(nextCaps);
      if (activeLayerId === headerCap?.id) {
        setActiveLayerId(null);
      }
      pushHistory(nextCaps, stickers, imageLayers, drawings, nextHeader, canvasFooter);
    }
  };
  const handleAddModernHeader = handleToggleCanvasHeader;

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
        pushHistory(captions, stickers, imageLayers, drawings, canvasHeader, nextFooter);
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
        pushHistory(nextCaps, stickers, imageLayers, drawings, canvasHeader, nextFooter);
      }
    } else {
      const footerCap = captions.find(c => c.isFooterCaption);
      const nextCaps = captions.filter(c => !c.isFooterCaption);
      setCaptions(nextCaps);
      if (activeLayerId === footerCap?.id) {
        setActiveLayerId(null);
      }
      pushHistory(nextCaps, stickers, imageLayers, drawings, canvasHeader, nextFooter);
    }
  };
  const handleAddModernFooter = handleToggleCanvasFooter;

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
      pushHistory(nextCaps, stickers, imageLayers, drawings, nextHeader, nextFooter);
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
      pushHistory(nextCaps, stickers, imageLayers, drawings, nextHeader, nextFooter);
    }
  };

  // Meme Culture Staples & Social Formats Handlers
  const handleToggleDemotivational = (data = {}) => {
    const willEnable = !demotivational.enabled;
    const titleText = (data.title || demotivational.title || 'PROCRASTINATION').toUpperCase();
    const subtitleText = data.subtitle || demotivational.subtitle || 'Hard work pays off in the future, laziness pays off now.';

    const nextDemo = {
      enabled: willEnable,
      title: titleText,
      subtitle: subtitleText
    };
    setDemotivational(nextDemo);

    if (willEnable) {
      setCanvasBgColor('#000000');
      window.dispatchEvent(new CustomEvent('liveCanvasBgColor', { detail: '#000000' }));

      // Clean existing demotivational captions
      const cleanCaps = captions.filter(c => !c.isDemotivationalTitle && !c.isDemotivationalSubtitle);
      const maxZ = Math.max(-1, ...cleanCaps.map(c => c.zIndex ?? -1), ...stickers.map(s => s.zIndex ?? -1), ...(imageLayers || []).map(i => i.zIndex ?? -1));

      const titleCap = {
        id: `cap-demo-title-${Date.now()}`,
        text: titleText,
        x: 0.5,
        y: 0.82,
        fontSize: 48,
        fontFamily: '"Times New Roman", Times, serif',
        color: '#ffffff',
        stroke: 'transparent',
        strokeWidth: 0,
        align: 'center',
        width: 0.88,
        isDemotivationalTitle: true,
        zIndex: maxZ + 1
      };

      const subtitleCap = {
        id: `cap-demo-sub-${Date.now() + 1}`,
        text: subtitleText,
        x: 0.5,
        y: 0.90,
        fontSize: 22,
        fontFamily: 'Georgia, serif',
        color: '#ffffff',
        stroke: 'transparent',
        strokeWidth: 0,
        align: 'center',
        width: 0.84,
        isDemotivationalSubtitle: true,
        zIndex: maxZ + 2
      };

      const nextCaps = [...cleanCaps, titleCap, subtitleCap];
      setCaptions(nextCaps);
      setActiveLayerId(titleCap.id);
      setActiveTab('text');
      pushHistory(nextCaps, stickers, imageLayers, drawings, canvasHeader, canvasFooter, nextDemo);
    } else {
      const nextCaps = captions.filter(c => !c.isDemotivationalTitle && !c.isDemotivationalSubtitle);
      setCaptions(nextCaps);
      if (activeCaption?.isDemotivationalTitle || activeCaption?.isDemotivationalSubtitle) {
        setActiveLayerId(null);
      }
      pushHistory(nextCaps, stickers, imageLayers, drawings, canvasHeader, canvasFooter, nextDemo);
    }
  };

  const handleAddBreakingNews = (data = {}) => {
    const headline = data.headline || "LOCAL MAN ADMITS HE HAS NO IDEA WHAT HE'S DOING";
    const channel = data.channel || "MEME NEWS 24";
    const ticker = data.ticker || "DEVELOPING STORY - DETAILS TO FOLLOW";
    const maxZ = Math.max(-1, ...captions.map(c => c.zIndex ?? -1), ...stickers.map(s => s.zIndex ?? -1), ...(imageLayers || []).map(i => i.zIndex ?? -1));

    const newCap = {
      id: `cap-news-${Date.now()}`,
      text: headline,
      newsHeadline: headline,
      newsChannel: channel,
      newsTicker: ticker,
      isBreakingNews: true,
      x: 0.5,
      y: 0.88,
      width: 0.96,
      fontSize: 28,
      color: '#facc15',
      stroke: 'transparent',
      strokeWidth: 0,
      zIndex: maxZ + 1
    };

    const nextCaps = [...captions, newCap];
    setCaptions(nextCaps);
    setActiveLayerId(newCap.id);
    setActiveTab('text');
    pushHistory(nextCaps, stickers, imageLayers, drawings, canvasHeader, canvasFooter, demotivational);
  };

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
    setActiveTab('images');
    pushHistory(nextCaps, stickers, imageLayers, drawings, canvasHeader, canvasFooter, demotivational);
  };

  const handleAddChatBubble = (data = {}) => {
    const style = data.style || 'imessage-send';
    const text = data.text || 'are you free to hop on a quick 5-min call?';
    const maxZ = Math.max(-1, ...captions.map(c => c.zIndex ?? -1), ...stickers.map(s => s.zIndex ?? -1), ...(imageLayers || []).map(i => i.zIndex ?? -1));

    let bgColor = '#007aff';
    let textColor = '#ffffff';
    if (style === 'imessage-receive') {
      bgColor = '#e9e9eb';
      textColor = '#000000';
    } else if (style === 'whatsapp-send') {
      bgColor = '#005c4b';
      textColor = '#ffffff';
    } else if (style === 'whatsapp-receive') {
      bgColor = '#202c33';
      textColor = '#ffffff';
    }

    const pos = getNonOverlappingPosition('phrase', captions, stickers, imageLayers);

    const newCap = {
      id: `cap-chat-${Date.now()}`,
      text: text,
      bubbleStyle: style,
      bgColor: bgColor,
      color: textColor,
      stroke: 'transparent',
      strokeWidth: 0,
      x: pos.x,
      y: pos.y,
      fontSize: 26,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      width: 0.72,
      zIndex: maxZ + 1
    };

    const nextCaps = [...captions, newCap];
    setCaptions(nextCaps);
    setActiveLayerId(newCap.id);
    setActiveTab('text');
    pushHistory(nextCaps, stickers, imageLayers, drawings, canvasHeader, canvasFooter, demotivational);
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

  // Horizontal Flip / Mirror for Stickers & Media Overlays
  const handleFlipActiveLayer = () => {
    if (!activeLayerId) return;
    const isStk = stickers.some(s => s.id === activeLayerId);
    const isImg = (imageLayers || []).some(i => i.id === activeLayerId);

    if (isStk) {
      const nextStks = stickers.map(s => s.id === activeLayerId ? { ...s, flipX: !s.flipX } : s);
      setStickers(nextStks);
      pushHistory(captions, nextStks, imageLayers, drawings);
    } else if (isImg) {
      const nextImgs = (imageLayers || []).map(i => i.id === activeLayerId ? { ...i, flipX: !i.flipX } : i);
      setImageLayers(nextImgs);
      pushHistory(captions, stickers, nextImgs, drawings);
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
    pushHistory(nextCaps, stickers);
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
    pushHistory(nextCaps, stickers);
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

  const updateActiveStickerScale = (scaleValue) => {
    if (!activeLayerId) return;
    const nextStickers = stickers.map((stk) => {
      if (stk.id === activeLayerId) {
        return { ...stk, scale: scaleValue };
      }
      return stk;
    });
    setStickers(nextStickers);
    pushHistory(captions, nextStickers);
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
    pushHistory(captions, stickers, nextImgLayers);
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

  const handleStartMorphFace = (explicitTarget = null) => {
    // 1. Identify if a target layer was explicitly passed, or if activeImageLayer / activeSticker is selected
    // Note: React onClick passes a SyntheticEvent (which has nativeEvent/dispatchConfig), so ignore SyntheticEvents!
    let targetLayer = null;
    if (explicitTarget && typeof explicitTarget === 'object' && ('url' in explicitTarget || 'src' in explicitTarget) && !('nativeEvent' in explicitTarget)) {
      targetLayer = explicitTarget;
    } else if (activeImageLayer && (activeImageLayer.url || activeImageLayer.src)) {
      targetLayer = activeImageLayer;
    } else if (activeSticker && (activeSticker.url || activeSticker.src)) {
      targetLayer = activeSticker;
    }

    if (targetLayer) {
      const url = targetLayer.url || targetLayer.src;
      if (url) {
        setMorphTargetLayerId(targetLayer.id);
        setMorphTargetUrl(url);
        setSampledFaceLighting(null);
        setExtractedMemeFace(null);
        setShowFaceMorphModal(true);
        return;
      }
    }

    // 2. Fallback: Targeting background meme template
    setMorphTargetLayerId(null);
    setMorphTargetUrl(null);
    setActiveLayerId(null);
    let lighting = null;
    let patch = null;
    if (canvasRef.current?.sampleFaceLighting) {
      lighting = canvasRef.current.sampleFaceLighting(faceTarget.x, faceTarget.y, faceTarget.radius);
      setSampledFaceLighting(lighting);
    }
    if (canvasRef.current?.extractFacePatch) {
      patch = canvasRef.current.extractFacePatch(faceTarget.x, faceTarget.y, faceTarget.radius, 400);
      setExtractedMemeFace(patch);
    }
    setShowFaceMorphModal(true);
  };

  const handleRetargetFace = () => {
    if (templateFaceMorph?.isLayerSwap) {
      const target = imageLayers.find(l => l.id === templateFaceMorph.layerId) || stickers.find(s => s.id === templateFaceMorph.layerId);
      if (target) {
        handleStartMorphFace(target);
        return;
      }
    }
    setActiveLayerId(null);
    setIsPinpointingFace(true);
  };

  const handleConfirmPinpoint = () => {
    setActiveLayerId(null);
    setIsPinpointingFace(false);
    let lighting = null;
    let patch = null;
    if (canvasRef.current?.sampleFaceLighting) {
      lighting = canvasRef.current.sampleFaceLighting(faceTarget.x, faceTarget.y, faceTarget.radius);
      setSampledFaceLighting(lighting);
    }
    if (canvasRef.current?.extractFacePatch) {
      patch = canvasRef.current.extractFacePatch(faceTarget.x, faceTarget.y, faceTarget.radius, 400);
      setExtractedMemeFace(patch);
    }
    setShowFaceMorphModal(true);
  };

  const handleApplyFaceMorph = async ({
    url,
    originalFaceUrl,
    faceName,
    flipX,
    brightness,
    contrast,
    warmth,
    morphProgress,
    landmarksA,
    landmarksB,
    triangles,
    isNeuralSwap,
    neuralSwappedFullImage
  }) => {
    setShowFaceMorphModal(false);

    // CASE 1: Swapping an image layer or graphic sticker on top of canvas
    if (morphTargetLayerId) {
      const swappedResultUrl = neuralSwappedFullImage || url;
      if (swappedResultUrl) {
        let origUrl = null;
        let nextImgLayers = imageLayers;
        let nextStickers = stickers;
        const isImg = imageLayers.some(l => l.id === morphTargetLayerId);
        if (isImg) {
          nextImgLayers = imageLayers.map((l) => {
            if (l.id === morphTargetLayerId) {
              origUrl = l.originalUrl || l.url;
              return {
                ...l,
                url: swappedResultUrl,
                originalUrl: origUrl
              };
            }
            return l;
          });
          setImageLayers(nextImgLayers);
        } else {
          nextStickers = stickers.map((s) => {
            if (s.id === morphTargetLayerId) {
              origUrl = s.originalUrl || s.url;
              return {
                ...s,
                url: swappedResultUrl,
                originalUrl: origUrl
              };
            }
            return s;
          });
          setStickers(nextStickers);
        }

        const morphState = {
          isLayerSwap: true,
          layerId: morphTargetLayerId,
          cleanOriginalUrl: origUrl,
          photoUrl: originalFaceUrl || url,
          faceName: faceName || 'Face Swap'
        };
        setTemplateFaceMorph(morphState);
        setActiveLayerId(null);
        pushHistory(
          captions,
          nextStickers,
          nextImgLayers,
          drawings,
          canvasHeader,
          canvasFooter,
          demotivational,
          canvasFlipX,
          activeTemplate?.rawImageUrl || activeTemplate?.imageUrl,
          morphState
        );
      }
      setMorphTargetLayerId(null);
      setMorphTargetUrl(null);
      return;
    }

    // CASE 2: Swapping background meme template
    const cleanOriginalUrl = (originalTemplateImgRef.current && !originalTemplateImgRef.current.startsWith('data:'))
      ? originalTemplateImgRef.current
      : (activeTemplate?.originalUrl || (activeTemplate?.imageUrl && !activeTemplate.imageUrl.startsWith('data:') ? activeTemplate.imageUrl : null) || activeTemplate?.imageUrl);
    
    if (!originalTemplateImgRef.current || originalTemplateImgRef.current.startsWith('data:')) {
      originalTemplateImgRef.current = cleanOriginalUrl;
    }

    if (isNeuralSwap && neuralSwappedFullImage) {
      setActiveTemplate(prev => ({
        ...prev,
        rawImageUrl: neuralSwappedFullImage,
        imageUrl: neuralSwappedFullImage,
        originalUrl: prev?.originalUrl || cleanOriginalUrl
      }));

      const morphState = {
        faceTarget: { ...faceTarget },
        photoUrl: originalFaceUrl || url,
        originalFaceUrl: originalFaceUrl || url,
        faceName: faceName || 'AI Neural Swap',
        morphProgress: 1.0,
        warmth: 0,
        brightness: 100,
        contrast: 100,
        flipX: false,
        cleanOriginalUrl,
        isNeuralSwap: true
      };

      setTemplateFaceMorph(morphState);
      setActiveLayerId(null);
      pushHistory(
        captions,
        stickers,
        imageLayers,
        drawings,
        canvasHeader,
        canvasFooter,
        demotivational,
        canvasFlipX,
        neuralSwappedFullImage,
        morphState
      );
      return;
    }

    const baseImg = cleanOriginalUrl;

    const fusedDataUrl = await fuseFaceIntoTemplate({
      baseImg,
      faceTarget,
      photoImg: originalFaceUrl || url,
      morphedPatch: url,
      landmarksA,
      landmarksB,
      triangles,
      morphProgress: morphProgress !== undefined ? morphProgress : 0.85,
      warmth: warmth || 0,
      brightness: brightness || 0,
      flipX: !!flipX
    });

    if (fusedDataUrl) {
      setActiveTemplate(prev => ({
        ...prev,
        rawImageUrl: fusedDataUrl,
        imageUrl: fusedDataUrl,
        originalUrl: prev?.originalUrl || cleanOriginalUrl
      }));

      const morphState = {
        faceTarget: { ...faceTarget },
        photoUrl: url || originalFaceUrl,
        originalFaceUrl: originalFaceUrl || url,
        faceName: faceName || 'Face Morph',
        morphProgress: morphProgress !== undefined ? morphProgress : 0.85,
        warmth: warmth || 0,
        brightness: brightness || 0,
        contrast: contrast || 100,
        flipX: !!flipX,
        cleanOriginalUrl,
        landmarksA,
        landmarksB,
        triangles
      };

      setTemplateFaceMorph(morphState);
      setActiveLayerId(null);
      pushHistory(
        captions,
        stickers,
        imageLayers,
        drawings,
        canvasHeader,
        canvasFooter,
        demotivational,
        canvasFlipX,
        fusedDataUrl,
        morphState
      );
    }
  };

  const handleUpdateTemplateMorphProgress = async (newVal) => {
    if (!templateFaceMorph) return;
    const progress = Math.max(0, Math.min(1, newVal));
    setTemplateFaceMorph(prev => ({ ...prev, morphProgress: progress }));

    const cleanUrl = templateFaceMorph.cleanOriginalUrl || activeTemplate?.originalUrl;
    const fusedDataUrl = await fuseFaceIntoTemplate({
      baseImg: cleanUrl,
      faceTarget: templateFaceMorph.faceTarget,
      photoImg: templateFaceMorph.originalFaceUrl || templateFaceMorph.photoUrl,
      landmarksA: templateFaceMorph.landmarksA,
      landmarksB: templateFaceMorph.landmarksB,
      triangles: templateFaceMorph.triangles,
      morphProgress: progress,
      warmth: templateFaceMorph.warmth || 0,
      brightness: templateFaceMorph.brightness || 0,
      flipX: templateFaceMorph.flipX
    });

    if (fusedDataUrl) {
      setActiveTemplate(prev => ({
        ...prev,
        rawImageUrl: fusedDataUrl,
        imageUrl: fusedDataUrl,
        originalUrl: prev?.originalUrl || cleanUrl
      }));
    }
  };

  const handleChangeFace = () => {
    if (templateFaceMorph?.isLayerSwap) {
      const target = imageLayers.find(l => l.id === templateFaceMorph.layerId) || stickers.find(s => s.id === templateFaceMorph.layerId);
      if (target) {
        handleStartMorphFace(target);
        return;
      }
    }
    setShowFaceMorphModal(true);
  };

  const handleRevertTemplateFace = () => {
    if (!templateFaceMorph) return;
    if (templateFaceMorph.isLayerSwap) {
      const cleanUrl = templateFaceMorph.cleanOriginalUrl;
      let nextImgs = imageLayers;
      let nextStks = stickers;
      if (cleanUrl) {
        nextImgs = imageLayers.map(l => l.id === templateFaceMorph.layerId ? { ...l, url: cleanUrl } : l);
        nextStks = stickers.map(s => s.id === templateFaceMorph.layerId ? { ...s, url: cleanUrl } : s);
        setImageLayers(nextImgs);
        setStickers(nextStks);
      }
      setTemplateFaceMorph(null);
      pushHistory(captions, nextStks, nextImgs, drawings, canvasHeader, canvasFooter, demotivational, canvasFlipX, activeTemplate?.rawImageUrl || activeTemplate?.imageUrl, null);
      return;
    }
    const cleanUrl = templateFaceMorph.cleanOriginalUrl || activeTemplate?.originalUrl;
    if (cleanUrl) {
      setActiveTemplate(prev => ({
        ...prev,
        rawImageUrl: cleanUrl,
        imageUrl: cleanUrl,
        originalUrl: null
      }));
    }
    setTemplateFaceMorph(null);
    pushHistory(captions, stickers, imageLayers, drawings, canvasHeader, canvasFooter, demotivational, canvasFlipX, cleanUrl, null);
  };

  const handleFinalizeTemplateFace = () => {
    if (templateFaceMorph?.isLayerSwap) {
      setTemplateFaceMorph(null);
      pushHistory(captions, stickers, imageLayers, drawings, canvasHeader, canvasFooter, demotivational, canvasFlipX, activeTemplate?.rawImageUrl || activeTemplate?.imageUrl, null);
      return;
    }
    setActiveTemplate(prev => ({
      ...prev,
      originalUrl: null
    }));
    setTemplateFaceMorph(null);
    pushHistory(captions, stickers, imageLayers, drawings, canvasHeader, canvasFooter, demotivational, canvasFlipX, activeTemplate?.rawImageUrl || activeTemplate?.imageUrl, null);
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
    pushHistory(captions, stickers, nextImgLayers);
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
  const commitLayerStack = (orderedList, currentDrawings = drawings, currentCanvasHeader = canvasHeader, currentCanvasFooter = canvasFooter) => {
    orderedList.forEach((item, index) => {
      item.zIndex = index;
    });

    const nextCaps = orderedList.filter(i => i._type === 'caption').map(({ _type, ...rest }) => rest);
    const nextStks = orderedList.filter(i => i._type === 'sticker').map(({ _type, ...rest }) => rest);
    const nextImgs = orderedList.filter(i => i._type === 'imageLayer').map(({ _type, ...rest }) => rest);

    setCaptions(nextCaps);
    setStickers(nextStks);
    setImageLayers(nextImgs);
    pushHistory(nextCaps, nextStks, nextImgs, currentDrawings, currentCanvasHeader, currentCanvasFooter);
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

  const handleZIndex = (dir) => {
    if (!activeLayerId) return;
    moveLayer(activeLayerId, dir === 1 ? 'forward' : 'backward');
  };

  const toggleLayerVisibility = (id) => {
    if (!id) return;
    const isCap = captions.some(c => c.id === id);
    const isStk = stickers.some(s => s.id === id);
    const isImg = imageLayers.some(i => i.id === id);

    let nextCaps = captions;
    let nextStks = stickers;
    let nextImgs = imageLayers;

    if (isCap) {
      nextCaps = captions.map(c => c.id === id ? { ...c, hidden: !c.hidden } : c);
      setCaptions(nextCaps);
    } else if (isStk) {
      nextStks = stickers.map(s => s.id === id ? { ...s, hidden: !s.hidden } : s);
      setStickers(nextStks);
    } else if (isImg) {
      nextImgs = imageLayers.map(i => i.id === id ? { ...i, hidden: !i.hidden } : i);
      setImageLayers(nextImgs);
    }

    if (activeLayerId === id) {
      const target = [...nextCaps, ...nextStks, ...nextImgs].find(i => i.id === id);
      if (target?.hidden) {
        const prevSticker = stickers.find((s) => s.id === id);
        const prevCaption = captions.find((c) => c.id === id);
        const prevImg = imageLayers.find((img) => img.id === id);
        if (prevSticker || (prevCaption && prevCaption.isTweetCard) || prevImg) {
          setActiveTab('images');
        }
        setActiveLayerId(null);
      }
    }

    pushHistory(nextCaps, nextStks, nextImgs, drawings);
  };

  const toggleLayerLock = (id) => {
    if (!id) return;
    const isCap = captions.some(c => c.id === id);
    const isStk = stickers.some(s => s.id === id);
    const isImg = imageLayers.some(i => i.id === id);

    let nextCaps = captions;
    let nextStks = stickers;
    let nextImgs = imageLayers;

    if (isCap) {
      nextCaps = captions.map(c => c.id === id ? { ...c, locked: !c.locked } : c);
      setCaptions(nextCaps);
    } else if (isStk) {
      nextStks = stickers.map(s => s.id === id ? { ...s, locked: !s.locked } : s);
      setStickers(nextStks);
    } else if (isImg) {
      nextImgs = imageLayers.map(i => i.id === id ? { ...i, locked: !i.locked } : i);
      setImageLayers(nextImgs);
    }

    pushHistory(nextCaps, nextStks, nextImgs, drawings);
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
      if (prevSticker || (prevCaption && prevCaption.isTweetCard) || prevImg) {
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
    commitLayerStack(list, drawings, nextHeader, nextFooter);
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

  
  const handleRemoveBackground = async () => {
    const processImg = async (url) => {
      let blob;
      if (typeof url === 'string' && url.startsWith('data:')) {
        blob = dataURLToBlob(url);
      } else {
        const res = await fetch(url);
        blob = await res.blob();
      }
      return await removeBackground(blob);
    };

    if (activeImageLayer) {
        if (activeImageLayer.originalUrl) {
          updateActiveImageLayer({
            url: activeImageLayer.originalUrl,
            originalUrl: null
          });
          return;
        }

        try {
          setIsRemovingBg(true);
          const imgBlob = await processImg(activeImageLayer.url);
          const newUrl = await blobToDataURL(imgBlob);
          updateActiveImageLayer({
            url: newUrl,
            originalUrl: activeImageLayer.url
          });
        } catch (err) {
          console.error('Failed to remove background:', err);
          alert('Failed to remove background: ' + (err.message || err.toString()));
        } finally {
          setIsRemovingBg(false);
        }
    } else if (activeSticker) {
        if (activeSticker.originalUrl) {
          const nextStks = stickers.map((s) => (s.id === activeSticker.id ? { ...s, src: activeSticker.originalUrl, url: activeSticker.originalUrl, originalUrl: null } : s));
          setStickers(nextStks);
          pushHistoryDebounced(captions, nextStks, imageLayers);
          return;
        }

        try {
          setIsRemovingBg(true);
          const oldUrl = activeSticker.url || activeSticker.src;
          const imgBlob = await processImg(oldUrl);
          const newUrl = await blobToDataURL(imgBlob);
          const nextStks = stickers.map((s) => (s.id === activeSticker.id ? { ...s, src: newUrl, url: newUrl, originalUrl: oldUrl } : s));
          setStickers(nextStks);
          pushHistoryDebounced(captions, nextStks, imageLayers);
        } catch (err) {
          console.error('Failed to remove background:', err);
          alert('Failed to remove background: ' + (err.message || err.toString()));
        } finally {
          setIsRemovingBg(false);
        }
    } else if (activeTemplate && (activeTemplate.rawImageUrl || activeTemplate.imageUrl)) {
        if (activeTemplate.originalUrl) {
          setActiveTemplate({ ...activeTemplate, rawImageUrl: activeTemplate.originalUrl, imageUrl: activeTemplate.originalUrl, originalUrl: null });
          return;
        }

        try {
          setIsRemovingBg(true);
          const oldUrl = activeTemplate.rawImageUrl || activeTemplate.imageUrl;
          const imgBlob = await processImg(oldUrl);
          const newUrl = await blobToDataURL(imgBlob);
          setActiveTemplate({ ...activeTemplate, rawImageUrl: newUrl, imageUrl: newUrl, originalUrl: oldUrl });
        } catch (err) {
          console.error('Failed to remove background:', err);
          alert('Failed to remove background: ' + (err.message || err.toString()));
        } finally {
          setIsRemovingBg(false);
        }
    }
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
    pushHistoryDebounced(captions, stickers, nextImg);
  };

  const handleRotateSticker = () => {
    if (!activeSticker) return;
    const nextRot = ((activeSticker.rotation || 0) + 90) % 360;
    const nextStickers = stickers.map(s => s.id === activeSticker.id ? { ...s, rotation: nextRot } : s);
    setStickers(nextStickers);
    pushHistoryDebounced(captions, nextStickers, imageLayers);
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
      pushHistory(captions, nextStickers, imageLayers);
    } else if (activeImageLayer) {
      const nextDieCut = !activeImageLayer.dieCut;
      const nextImg = imageLayers.map(l => l.id === activeImageLayer.id ? {
        ...l,
        dieCut: nextDieCut,
        dieCutColor: l.dieCutColor || color,
        dieCutWidth: l.dieCutWidth || 6
      } : l);
      setImageLayers(nextImg);
      pushHistory(captions, stickers, nextImg);
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
      pushHistory(captions, nextStickers, imageLayers);
    } else if (activeImageLayer) {
      const nextImg = imageLayers.map(l => l.id === activeImageLayer.id ? {
        ...l,
        dieCut: true,
        dieCutColor: color
      } : l);
      setImageLayers(nextImg);
      pushHistory(captions, stickers, nextImg);
    }
  };

  const getContrastStroke = (hex) => {
    if (!hex) return '#000000';
    return hex.toLowerCase() === '#ffffff' ? '#000000' : 'transparent';
  };

  const handleFileUploadSlot = (slotIndex, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        const nextImages = [...slotImages];
        nextImages[slotIndex] = evt.target.result;
        setSlotImages(nextImages);

        const nextTransforms = [...slotTransforms];
        nextTransforms[slotIndex] = { offsetX: 0, offsetY: 0, scale: 1.5 };
        setSlotTransforms(nextTransforms);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const updateSlotTransform = (slotIndex, updateFn) => {
    const nextTransforms = [...slotTransforms];
    const prev = nextTransforms[slotIndex] || { offsetX: 0, offsetY: 0, scale: 1.5 };
    nextTransforms[slotIndex] = updateFn(prev);
    setSlotTransforms(nextTransforms);
  };

  const handleTextPanel = (slotIndex) => {
    // 1. Fill the slot with a 1x1 white transparent image to prevent it from acting as an "empty" slot for hit testing
    const whitePixelUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=';
    
    const nextImages = [...slotImages];
    nextImages[slotIndex] = whitePixelUrl;
    setSlotImages(nextImages);

    // 2. Add a centered text caption for that slot
    const totalSlots = layoutDef.slots;
    const isVert = layoutDef.id === '2-vert' || layoutDef.id === '3-stacked';
    const isHoriz = layoutDef.id === '2-horiz' || layoutDef.id === '3-horiz';
    const isGrid = layoutDef.id === '4-grid';
    const isHybrid = layoutDef.id === '3-hybrid';

    let cx = 0.5;
    let cy = 0.5;

    if (isVert) {
      cy = (slotIndex + 0.5) / totalSlots;
    } else if (isHoriz) {
      cx = (slotIndex + 0.5) / totalSlots;
    } else if (isGrid) {
      cx = (slotIndex % 2 === 0 ? 0.25 : 0.75);
      cy = (Math.floor(slotIndex / 2) === 0 ? 0.25 : 0.75);
    } else if (isHybrid) {
      if (slotIndex === 0) {
        cx = 0.5;
        cy = 0.25;
      } else {
        cx = (slotIndex === 1 ? 0.25 : 0.75);
        cy = 0.75;
      }
    }

    const newCap = {
      id: `cap-${Date.now()}`,
      text: 'ADD TEXT HERE',
      x: cx,
      y: cy,
      fontSize: 45,
      color: '#000000', // Black text for white panel
      stroke: 'transparent',
      align: 'center',
      fontFamily: 'Impact, sans-serif',
      rotation: 0,
      width: undefined
    };
    
    const nextCaps = [...captions, newCap];
    setCaptions(nextCaps);
    setActiveLayerId(newCap.id);
    setActiveTab('text');
    setActiveSlotAction(null);
    pushHistory(nextCaps, stickers);
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
    pushHistory(captions, nextStickers, imageLayers);
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
    pushHistory(captions, nextStickers, imageLayers);
  };

  const activeCaption = captions.find((c) => c.id === activeLayerId);

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
    const isFiltersOpen = (!activeCaption && !activeSticker && activeTab === 'filters') || (activeImageLayer && showImageFilterMenu);
    if (isFiltersOpen) {
      setTimeout(() => {
        const activeFilterId = activeImageLayer ? (activeImageLayer.filterId || 'original') : (imageFilters.preset || 'original');
        const el = document.getElementById('filter-item-' + activeFilterId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }, 50);
    }
  }, [activeTab, activeImageLayer?.id, activeImageLayer?.filterId, imageFilters.preset]);

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

  const handleCycleOpacity = () => {
    if (!activeCaption) return;
    const currentOpacity = activeCaption.opacity !== undefined ? Number(activeCaption.opacity) : 1;
    let nextOpacity = 1;
    if (currentOpacity >= 0.9) nextOpacity = 0.75;
    else if (currentOpacity >= 0.7) nextOpacity = 0.5;
    else if (currentOpacity >= 0.4) nextOpacity = 0.25;
    else nextOpacity = 1;
    updateActiveCaption('opacity', nextOpacity);
  };

  const ASPECT_RATIOS = [
    { value: 'original', label: 'Original Image' },
    { value: '1:1', label: '1:1 (Square)' },
    { value: '4:5', label: '4:5 (Portrait)' },
    { value: '9:16', label: '9:16 (Story)' },
    { value: '16:9', label: '16:9 (Video)' }
  ];

  const handleCycleAspectRatio = () => {
    const currentIndex = ASPECT_RATIOS.findIndex((a) => a.value === aspectRatio);
    const nextIndex = (currentIndex + 1) % ASPECT_RATIOS.length;
    setAspectRatio(ASPECT_RATIOS[nextIndex].value);
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

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // Confetti fallback
    }
  };

  // Detect if meme has any video content (background or overlay layers)
  const isVideoUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    if (url.includes('#type=video')) return true;
    if (url.includes('#type=image')) return false;
    if (url.startsWith('data:video/')) return true;
    if (url.startsWith('data:image/')) return false;
    return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url);
  };
  const hasVideoContent = (
    isVideoUrl(template?.imageUrl) ||
    isVideoUrl(template?.rawImageUrl) ||
    (imageLayers || []).some((l) => isVideoUrl(l.url)) ||
    (slotImages || []).some((s) => isVideoUrl(s)) ||
    (template?.slotImages || []).some((s) => isVideoUrl(s))
  );

  const cleanTemplateName = (rawName) => {
    if (!rawName) return '';
    return rawName
      .replace(/\b\d+x\d+\b/gi, '')
      .replace(/\bGrid\b/gi, '')
      .replace(/\bCustom\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const handlePreview = () => {
    setActiveLayerId(null);
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.exportCleanImage
        ? canvasRef.current.exportCleanImage('image/png')
        : canvasRef.current.toDataURL('image/png');
      setExportedImageUri(dataUrl);

      const cleaned = cleanTemplateName(template?.name);
      const defaultName = cleaned || (captions[0]?.text && captions[0].text !== 'TOP TEXT' ? captions[0].text : '') || 'My Meme';
      setMemeCustomName(defaultName);
      
      setExportedVideoUrl(null);
      setIsPreviewModalOpen(true);
      
      if (hasVideoContent) {
        handleGenerateVideo();
      }
    }
  };

  // Renders canvas to dataURL without handles, then runs the callback action
  const handleQuickExport = (action) => {
    setActiveLayerId(null);
    setExportDropdownOpen(false);
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.exportCleanImage
        ? canvasRef.current.exportCleanImage('image/png')
        : canvasRef.current.toDataURL('image/png');
      setExportedImageUri(dataUrl);
      const cleaned = cleanTemplateName(template?.name);
      const defaultName = cleaned || (captions[0]?.text && captions[0].text !== 'TOP TEXT' ? captions[0].text : '') || 'My Meme';
      setMemeCustomName(defaultName);
      action(dataUrl);
    }
  };

  const handleDirectCopyImage = () => {
    handleQuickExport(async (dataUrl) => {
      try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
        } else {
          await navigator.clipboard.writeText(dataUrl);
        }
        setDirectCopyStatus(true);
        triggerConfetti();
        setTimeout(() => setDirectCopyStatus(false), 2200);
      } catch (e) {
        console.warn('Direct image copy failed, trying writeText fallback:', e);
        try {
          await navigator.clipboard.writeText(dataUrl);
          setDirectCopyStatus(true);
          triggerConfetti();
          setTimeout(() => setDirectCopyStatus(false), 2200);
        } catch (err2) {
          console.error('Direct copy failed completely:', err2);
        }
      }
    });
  };

  const handleConfirmSave = () => {
    const dataUrl = (canvasRef.current?.exportCleanImage ? canvasRef.current.exportCleanImage('image/png') : canvasRef.current?.toDataURL('image/png')) || exportedImageUri;
    if (dataUrl) {
      const finalName = memeCustomName.trim() || 'My Meme';
      onSaveToGallery({
        id: `meme-${Date.now()}`,
        name: finalName,
        imageUrl: dataUrl,
        rawImageUrl: template?.rawImageUrl || template?.imageUrl,
        captions: JSON.parse(JSON.stringify(captions)),
        stickers: JSON.parse(JSON.stringify(stickers)),
        imageLayers: JSON.parse(JSON.stringify(imageLayers)),
        aspectRatio,
        imageFit,
        isNativeLayout,
        layoutDef,
        slotImages,
        slotTransforms,
        createdAt: new Date().toISOString()
      });
      setIsSaved(true);
      triggerConfetti();
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  const handleGenerateVideo = async () => {
    if (hasVideoContent) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (typeof canvas.resetVideoTimestamps === 'function') {
        canvas.resetVideoTimestamps();
      }
      setIsVideoPlaying(true);
      
      await new Promise(resolve => setTimeout(resolve, 200));

      const filename = `meme-video-${template?.id || 'custom'}-${Date.now()}`;
      const videoLayer = (imageLayers || []).find((l) => isVideoUrl(l.url) && (l.trimEnd !== undefined || l.trimStart !== undefined));
      const durationMs = (videoLayer && videoLayer.trimEnd !== undefined)
        ? Math.max((videoLayer.trimEnd - (videoLayer.trimStart || 0)) * 1000, 1000)
        : 6000;
      setIsRecording(true);
      setRecordProgress(0);
      try {
        let mediaElements = [];
        if (typeof canvas.getVideoElements === 'function') {
          mediaElements = canvas.getVideoElements();
        }
        // Pass true for returnUrlOnly
        const videoUrl = await recordCanvasAsVideo(canvas, filename, durationMs, (p) => setRecordProgress(p), mediaElements, true);
        setExportedVideoUrl(videoUrl);
        triggerConfetti();
      } catch (err) {
        console.error('Video export failed:', err);
        alert('Video export failed. Try saving as image instead.');
      } finally {
        setIsRecording(false);
        setRecordProgress(0);
      }
    }
  };

  const handleDownloadImage = async () => {
    if (exportedImageUri) {
      const ext = exportFormat === 'jpeg' ? 'jpg' : exportFormat;
      const filename = `meme-${template?.id || 'custom'}-${Date.now()}.${ext}`;
      await downloadImageHelper(exportedImageUri, filename);
      triggerConfetti();
    }
  };

  const [clipboardCopied, setClipboardCopied] = useState(false);

  const handleCopyToClipboard = async () => {
    if (!exportedImageUri) return;
    try {
      const res = await fetch(exportedImageUri);
      const blob = await res.blob();
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
        // Modern clipboard API — copies actual image, pasteable into Discord/Twitter/etc.
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
      } else {
        // Fallback: copy the data URL as text
        await navigator.clipboard.writeText(exportedImageUri);
      }
      setClipboardCopied(true);
      triggerConfetti();
      setTimeout(() => setClipboardCopied(false), 2500);
    } catch (err) {
      console.warn('Copy to clipboard failed:', err);
    }
  };

  const [shareCopied, setShareCopied] = useState(false);

  const handleShareImage = async () => {
    if (!exportedImageUri) return;
    try {
      // Convert data URL to Blob for Web Share API
      const res = await fetch(exportedImageUri);
      const blob = await res.blob();
      const ext = exportFormat === 'jpeg' ? 'jpg' : exportFormat;
      const mimeType = exportFormat === 'jpeg' ? 'image/jpeg' : (exportFormat === 'webp' ? 'image/webp' : 'image/png');
      const file = new File([blob], `meme-${Date.now()}.${ext}`, { type: mimeType });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        // Native share sheet (mobile / Chrome Android / Safari iOS)
        await navigator.share({
          title: memeCustomName || 'My Meme',
          text: 'Check out this meme I made! 😂',
          files: [file],
        });
        triggerConfetti();
      } else {
        // Desktop fallback: copy data URL to clipboard
        await navigator.clipboard.writeText(exportedImageUri);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2500);
      }
    } catch (err) {
      // User cancelled share or clipboard not available — silently ignore
      if (err.name !== 'AbortError') {
        console.warn('Share failed:', err);
      }
    }
  };
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
                  title={clipboardCopied ? 'Image copied!' : 'Copy image to clipboard — paste into Discord, Twitter, etc.'}
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
            disabled={historyStep <= 0}
            title="Undo"
            style={{ 
              opacity: historyStep <= 0 ? 0.4 : 1, 
              cursor: historyStep <= 0 ? 'not-allowed' : 'pointer',
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
            disabled={historyStep >= history.length - 1}
            title="Redo"
            style={{ 
              opacity: historyStep >= history.length - 1 ? 0.4 : 1, 
              cursor: historyStep >= history.length - 1 ? 'not-allowed' : 'pointer',
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
              pushHistoryDebounced(captions, stickers, imageLayers);
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
                        setDirectCopyStatus(true);
                        triggerConfetti();
                        setTimeout(() => setDirectCopyStatus(false), 2200);
                      } catch(e) { console.warn(e); }
                    }},
                    { icon: <Share2 style={{width:16,height:16}} />, label: 'Share', action: async (uri) => {
                      try {
                        const res = await fetch(uri);
                        const blob = await res.blob();
                        const file = new File([blob], `meme-${Date.now()}.png`, { type: 'image/png' });
                        if (navigator.canShare && navigator.canShare({ files: [file] })) {
                          await navigator.share({ title: memeCustomName || 'My Meme', text: 'Check out this meme! 😂', files: [file] });
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
                if (prevSticker || (prevCaption && prevCaption.isTweetCard) || prevImg) {
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
                    setShowTweetThemeMenu(false);
                    setShowTweetTrendMenu(false);
                    setShowHeaderFooterMenu(false);
                    setShowTextAlignMenu(false);
                    if (!id) {
                      setActiveLayerId(null);
                      setActiveSubmenu(null);
                      setShowBubbleBottomSheet(false);
                      return;
                    }
                    if (window.innerWidth <= 768) {
                      setIsMobileTabsFolded(true);
                    }
                    setActiveLayerId(id);
                    setActiveSubmenu(null);
                    setShowBubbleBottomSheet(false);
                  }}
                  onUpdateCaptionBounds={(id, newProps) => {
                    const nextCaps = captions.map((c) => (c.id === id ? { ...c, ...newProps } : c));
                    setCaptions(nextCaps);
                    pushHistoryDebounced(nextCaps, stickers, imageLayers);
                  }}
                  onUpdateStickerBounds={(id, newProps) => {
                    const nextStk = stickers.map((s) => (s.id === id ? { ...s, ...newProps } : s));
                    setStickers(nextStk);
                    pushHistoryDebounced(captions, nextStk, imageLayers);
                  }}
                  onUpdateImageLayerBounds={(id, newProps) => {
                    const nextImgLayers = imageLayers.map((l) => (l.id === id ? { ...l, ...newProps } : l));
                    setImageLayers(nextImgLayers);
                    pushHistoryDebounced(captions, stickers, nextImgLayers);
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
                      pushHistoryDebounced(nextCaps, stickers, imageLayers);
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
                      pushHistoryDebounced(captions, stickers, imageLayers, drawings, upd, canvasFooter);
                      return upd;
                    });
                  }}
                  canvasFooter={canvasFooter}
                  onUpdateCanvasFooter={(props) => {
                    setCanvasFooter((prev) => {
                      const upd = { ...prev, ...props };
                      pushHistoryDebounced(captions, stickers, imageLayers, drawings, canvasHeader, upd);
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
                      {activeCaption && !activeCaption.isTweetCard && activeSubmenu === 'font' && (
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
                            style={{ width: '100px', accentColor: 'var(--cyber-cyan)' }}
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
                          <Trash2 style={{ width: 15, height: 15, color: '#ffffff' }} />
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

                    {/* 14. Unified Layer Actions Cluster (Rotate / Duplicate / Layers / Delete) - ONLY shown when no toolbar submenu is active */}
                    {(activeCaption || activeSticker || activeImageLayer) && !activeSubmenu && (
                      <motion.div
                        key={`layer-actions-${activeLayerId || 'layer'}`}
                        variants={secondaryVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="sec-bar-layer-actions"
                      >
                        {activeCaption && !activeCaption.isTweetCard && (
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

                        {activeSticker && (
                          <>
                            <button
                              type="button"
                              className={`layer-action-btn layer-action-btn-flip ${activeSticker.flipX ? 'active' : ''}`}
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
                          title="Rotate 90°"
                          aria-label="Rotate 90°"
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
                  {activeCaption && (
                    activeCaption.isTweetCard ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
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

                        {/* 4. Align Button */}
                        <button
                          type="button"
                          data-setting-btn="align"
                          className={`btn btn-xs vid-ctx-btn vid-ctx-btn-align ${activeSubmenu === 'align' ? 'active' : ''}`}
                          title={`Text Alignment: ${activeCaption.align || 'center'}`}
                          onClick={() => handleToggleSubmenu('align')}
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            borderRadius: '8px',
                            background: activeSubmenu === 'align' ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.08)',
                            border: activeSubmenu === 'align' ? '1px solid var(--cyber-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: activeSubmenu === 'align' ? '0 2px 10px rgba(6, 182, 212, 0.4), 0 0 8px rgba(99, 102, 241, 0.4)' : 'none',
                            transition: 'all 0.2s ease',
                            color: '#ffffff',
                            flexShrink: 0
                          }}
                        >
                          {(activeCaption.align === 'left') ? (
                            <AlignLeft style={{ width: 13, height: 13, color: '#ffffff' }} />
                          ) : (activeCaption.align === 'right') ? (
                            <AlignRight style={{ width: 13, height: 13, color: '#ffffff' }} />
                          ) : (
                            <AlignCenter style={{ width: 13, height: 13, color: '#ffffff' }} />
                          )}
                          <span>Align</span>
                        </button>

                        {/* 5. Bg Button */}
                        <button
                          type="button"
                          data-setting-btn="bg"
                          className={`btn btn-xs vid-ctx-btn vid-ctx-btn-bg ${activeSubmenu === 'bg' ? 'active' : ''}`}
                          title="Text Background Box / Banner settings"
                          onClick={() => handleToggleSubmenu('bg')}
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
                          <Highlighter style={{ width: 13, height: 13, color: '#ffffff' }} />
                          <span>Bg</span>
                        </button>

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
                        title={activeSticker.dieCut ? "Die-Cut Border (Active - click to disable, or click color circle to change color)" : "Die-Cut Sticker Border (White Vinyl Outline)"}
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
                        {activeSticker.dieCut && (
                          <span
                            onClick={(e) => e.stopPropagation()}
                            title="Change Die-Cut Border Color"
                            style={{
                              position: 'relative',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 15,
                              height: 15,
                              borderRadius: '50%',
                              border: '2px solid rgba(255,255,255,0.9)',
                              background: activeSticker.dieCutColor || '#ffffff',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                              cursor: 'pointer',
                              overflow: 'hidden',
                              marginLeft: '2px',
                              flexShrink: 0
                            }}
                          >
                            <input
                              type="color"
                              value={activeSticker.dieCutColor || '#ffffff'}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleSetDieCutColor(e.target.value);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                position: 'absolute',
                                opacity: 0,
                                inset: 0,
                                cursor: 'pointer',
                                width: '100%',
                                height: '100%',
                                padding: 0,
                                border: 'none'
                              }}
                            />
                          </span>
                        )}
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

                      <button
                        className="btn btn-xs vid-ctx-btn"
                        onClick={() => setShowStylesModal(true)}
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
                        title="Social & Viral Styles (Tweets, Threads, News, Chat)"
                      >
                        <XSocialLogo size={14} style={{ color: 'var(--cyber-cyan)' }} />
                        <span>Social</span>
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
              className={`tab-btn ${!isElementSelected && activeTab === 'draw' ? 'active' : ''}`}
              onClick={() => {
                handleTabClick('draw');
                setActiveLayerId(null);
                setDrawTool('brush');
              }}
            >
              <PencilLine className="icon-xs" /> <span>Draw</span>
            </button>
            <button
              className={`tab-btn ${!isElementSelected && activeTab === 'images' ? 'active' : ''}`}
              onClick={() => handleTabClick('images')}
            >
              <Copy className="icon-xs" /> <span>Media</span>
            </button>
            <button
              className={`tab-btn ${!isElementSelected && activeTab === 'text' ? 'active' : ''}`}
              onClick={() => handleTabClick('text')}
            >
              <Type className="icon-xs" /> <span>Text</span>
            </button>
            <button
              className={`tab-btn ${!isElementSelected && activeTab === 'filters' ? 'active' : ''}`}
              onClick={() => handleTabClick('filters')}
            >
              <Sparkles className="icon-xs" /> <span>AI/Filters</span>
            </button>
            <button
              className={`tab-btn ${!isElementSelected && (activeTab === 'canvas' || activeTab === 'watermark') ? 'active' : ''}`}
              onClick={() => handleTabClick('canvas')}
            >
              <LayoutGrid className="icon-xs" /> <span>Canvas</span>
            </button>
            
          </div>



            {/* TAB 5: CANVAS & WATERMARK */}
            {!isElementSelected && (activeTab === 'canvas' || activeTab === 'watermark') && (
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
            {!isElementSelected && activeTab === 'draw' && (
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
                    <input type="range" min="2" max="48" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} style={{ flex: 1, margin: '0 4px', minWidth: 0, accentColor: 'var(--cyber-cyan)' }} />
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
          {!isElementSelected && activeTab === 'text' && (
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
                      <span>{activeCaption ? (activeCaption.curve ? `Arc (${activeCaption.curve > 0 ? '+' : ''}${activeCaption.curve}°)` : 'Curve') : 'Curved Text'}</span>
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
                              pushHistory(nextCaps, stickers);
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
                            pushHistory(nextCaps, stickers);
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
                  {(!activeCaption.isBreakingNews && !activeCaption.isTweetCard) && (() => {
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
                          <span style={{ fontSize: '0.9rem', fontWeight: 900 }}>𝕏</span>
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

                  {/* Standard / Demotivational Caption Textarea */}
                  {(!activeCaption.isBreakingNews && !activeCaption.isTweetCard) && (
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
                            pushHistory(captions, stickers, imageLayers, drawings, { ...canvasHeader, bgColor: nextBg }, { ...canvasFooter, bgColor: nextBg });
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
                            pushHistory(captions, stickers, imageLayers, drawings, { ...canvasHeader, bgColor: nextBg }, { ...canvasFooter, bgColor: nextBg });
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
          {!isElementSelected && activeTab === 'images' && (() => {
            const isVideoLayer = activeImageLayer && isVideoUrl(activeImageLayer.url);
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

                  <button
                    type="button"
                    className="btn btn-xs hover-lift"
                    onClick={() => setShowStylesModal(true)}
                    title="Add Tweet Card (Fake Twitter / X Post)"
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: '999px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      whiteSpace: 'nowrap',
                      background: 'rgba(29, 155, 240, 0.15)',
                      border: '1px solid rgba(29, 155, 240, 0.4)',
                      color: '#ffffff'
                    }}
                  >
                    <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#1d9bf0', lineHeight: 1 }}>𝕏</span> Tweet Card
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

                {/* VideoTrimmer Modal — rendered as portal to escape canvas z-index stacking context */}
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
          {!isElementSelected && activeTab === 'filters' && (
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
                              {filterItem.name.replace(' 🔥', '')}
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

      {/* Meme Style Modal (Tweet Card) */}
      <MemeStylesModal
        isOpen={showStylesModal}
        onClose={() => setShowStylesModal(false)}
        onAddTweetCard={handleAddTweetCard}
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
