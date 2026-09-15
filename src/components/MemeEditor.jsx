import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ModalPortal from './ModalPortal';
import CanvasEditor from './CanvasEditor';
import { FONTS, STICKERS } from '../data/stickers';
import { GRAPHIC_STICKERS, GRAPHIC_STICKER_CATEGORIES } from '../data/memeStickers';
import confetti from 'canvas-confetti';
import {
  Type, Plus, Trash2, Undo, Redo, Download, Share2, Sparkles,
  Sliders, Smile, Sticker, ArrowLeft, Save, Check, RefreshCw,
  Image as ImageIcon, Search, X, Upload, RotateCw, ZoomIn, Crop, LayoutGrid, Scissors, Play, Pause, FolderHeart, Droplet, Monitor,
  Paintbrush, Eraser, Palette, Sun, Moon
} from 'lucide-react';
import { downloadImageHelper, recordCanvasAsVideo } from '../utils/downloadHelper';
import { motion, AnimatePresence } from 'framer-motion';
import { MEME_TEMPLATES, CATEGORIES } from '../data/templates';
import { fetchOpenSourceMemes } from '../services/memeService';
import VideoTrimmer from './VideoTrimmer';
import AspectRatioDropdown from './AspectRatioDropdown';
import GiphyTab from './GiphyTab';

const PRESET_PHRASES = [
  'WHEN YOU...',
  'NOBODY:',
  'MY BRAIN AT 3 AM:',
  'EXPECTATION vs REALITY',
  'HOW IT STARTED vs HOW IT GOES',
  'ME TRYING TO EXPLAIN:',
  'DEBUGGING CODE LIKE:'
];

const COLOR_SWATCHES = ['#ffffff', '#ffff00', '#a855f7', '#ff0055', '#00ff66', '#000000'];

export default function MemeEditor({ template, onBack, onSaveToGallery, theme, onToggleTheme }) {
  const [captions, setCaptions] = useState(() => {
    let initialCaps = [];
    const rawCaps = template?.defaultCaptions || template?.captions;

    if (rawCaps) {
      initialCaps = rawCaps.map((c, idx) => ({
        fontSize: 50, color: '#ffffff', stroke: '#000000', align: 'center', fontFamily: 'Impact, sans-serif',
      rotation: 0,
        ...c, id: c.id || `cap-${idx}-${Date.now()}`
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
      rotation: 0, width: undefined, id: `cap-slot-${idx}-${Date.now()}`
          });
        }
      });
    } else {
      initialCaps = [
        { text: 'TOP TEXT', x: 0.5, y: 0.15, fontSize: 50, color: '#ffffff', stroke: '#000000', align: 'center', fontFamily: 'Impact, sans-serif',
      rotation: 0, id: `cap-top-${Date.now()}` },
        { text: 'BOTTOM TEXT', x: 0.5, y: 0.85, fontSize: 50, color: '#ffffff', stroke: '#000000', align: 'center', fontFamily: 'Impact, sans-serif',
      rotation: 0, id: `cap-bot-${Date.now()}` }
      ];
    }
    return initialCaps;
  });

  const [stickers, setStickers] = useState(() => {
    return (template?.defaultStickers || template?.stickers || []).map((s, idx) => ({
      ...s,
      id: s.id || `stk-${idx}-${Date.now()}`
    }));
  });

  const [activeLayerId, setActiveLayerId] = useState(null);

  const [imageLayers, setImageLayers] = useState(() => {
    return (template?.imageLayers || []).map((img, idx) => ({
      ...img,
      id: img.id || `img-${idx}-${Date.now()}`
    }));
  });

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

  const [aspectRatio, setAspectRatio] = useState(template?.aspectRatio || 'original');
  const [imageFit, setImageFit] = useState(template?.imageFit || 'contain');

  // Open-source templates for Image Layer / Slot overlay picker
  const [imagePickerTarget, setImagePickerTarget] = useState(null); // 'layer' | { slot: idx }
  const [imagePickerSearch, setImagePickerSearch] = useState('');
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

  const [imagePickerCategory, setImagePickerCategory] = useState('all');

  const filteredImageTemplates = React.useMemo(() => {
    return openSourceTemplates.filter((t) => {
      const q = imagePickerSearch.toLowerCase().trim();
      const matchesSearch = !q ||
        t.name.toLowerCase().includes(q) ||
        (t.category && t.category.toLowerCase().includes(q));

      let matchesCategory = true;
      if (imagePickerCategory === 'trending') {
        matchesCategory = t.trendingScore >= 93;
      } else if (imagePickerCategory !== 'all') {
        matchesCategory = t.category === imagePickerCategory;
      }

      return matchesSearch && matchesCategory;
    });
  }, [openSourceTemplates, imagePickerSearch, imagePickerCategory]);

  const activeImageLayer = imageLayers.find((i) => i.id === activeLayerId);

  // History stack for Undo / Redo
  const [history, setHistory] = useState(() => {
    const initialCaptions = (template?.defaultCaptions || template?.captions || [
      { text: 'TOP TEXT', x: 0.5, y: 0.15, fontSize: 50, color: '#ffffff', stroke: '#000000', align: 'center', fontFamily: 'Impact, sans-serif',
      rotation: 0 },
      { text: 'BOTTOM TEXT', x: 0.5, y: 0.85, fontSize: 50, color: '#ffffff', stroke: '#000000', align: 'center', fontFamily: 'Impact, sans-serif',
      rotation: 0 }
    ]).map((c, idx) => ({
      fontSize: 50,
      color: '#ffffff',
      stroke: '#000000',
      align: 'center',
      fontFamily: 'Impact, sans-serif',
      rotation: 0,
      ...c,
      width: undefined, // Clear template width to force tight hugging initially
      fontSize: 45, // Set default text size to exactly 45px
      id: c.id || `cap-${idx}-${Date.now()}`
    }));

    const initialStickers = (template?.defaultStickers || template?.stickers || []).map((s, idx) => ({
      ...s,
      id: s.id || `stk-${idx}-${Date.now()}`
    }));

    const initialImageLayers = (template?.imageLayers || []).map((img, idx) => ({
      ...img,
      id: img.id || `img-${idx}-${Date.now()}`
    }));

    return [
      {
        captions: JSON.parse(JSON.stringify(initialCaptions)),
        stickers: JSON.parse(JSON.stringify(initialStickers)),
        imageLayers: JSON.parse(JSON.stringify(initialImageLayers))
      }
    ];
  });
  const [historyStep, setHistoryStep] = useState(0);

  const [activeTab, setActiveTab] = useState('text'); // 'text' | 'stickers' | 'images' | 'draw' | 'watermark'
  const [showMemeStickersModal, setShowMemeStickersModal] = useState(false);
  const [showEmojiModal, setShowEmojiModal] = useState(false);
  const [stickerSearchQuery, setStickerSearchQuery] = useState('');
  const [emojiSearchQuery, setEmojiSearchQuery] = useState('');
  const [activeStickerCategory, setActiveStickerCategory] = useState('faces');
  const [activeGraphicStickerCategory, setActiveGraphicStickerCategory] = useState('memes');

  // Freehand Drawing state
  const [drawings, setDrawings] = useState([]);
  const [drawTool, setDrawTool] = useState(null); // 'brush' | 'eraser' | null (deactivated by default)
  const [brushColor, setBrushColor] = useState('#a855f7');
  const [brushSize, setBrushSize] = useState(10);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [exportedImageUri, setExportedImageUri] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
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

  // Watermark state — persisted in localStorage
  const [watermark, setWatermark] = useState(() => {
    try {
      const saved = localStorage.getItem('meme-maker-watermark');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      enabled: false,
      text: '@username',
      imageUrl: null,
      position: 'bottom-right', // 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
      opacity: 0.5,
      size: 24,
      color: '#ffffff'
    };
  });

  // Save watermark config to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('meme-maker-watermark', JSON.stringify(watermark));
    } catch (e) {}
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
  const historyTimerRef = useRef(null);
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

  // Synchronize history snapshot on mount
  useEffect(() => {
    if (captions.length > 0 && activeLayerId === null) {
      setActiveLayerId(captions[0].id);
    }
  }, []);

  const pushHistory = (newCaptions, newStickers, newImgLayers = imageLayers, newDrawings = drawings) => {
    const newSnapshot = {
      captions: JSON.parse(JSON.stringify(newCaptions)),
      stickers: JSON.parse(JSON.stringify(newStickers)),
      imageLayers: JSON.parse(JSON.stringify(newImgLayers)),
      drawings: JSON.parse(JSON.stringify(newDrawings))
    };
    const updatedHistory = history.slice(0, historyStep + 1);
    updatedHistory.push(newSnapshot);
    setHistory(updatedHistory);
    setHistoryStep(updatedHistory.length - 1);
  };

  // Debounced version — used for text typing so history isn't pushed on every keypress
  const pushHistoryDebounced = (newCaptions, newStickers, newImgLayers = imageLayers, newDrawings = drawings) => {
    if (historyTimerRef.current) clearTimeout(historyTimerRef.current);
    historyTimerRef.current = setTimeout(() => {
      pushHistory(newCaptions, newStickers, newImgLayers, newDrawings);
    }, 800);
  };

  const handleUndo = () => {
    if (historyStep > 0) {
      const prevStep = historyStep - 1;
      const snapshot = history[prevStep];
      setCaptions(JSON.parse(JSON.stringify(snapshot.captions)));
      setStickers(JSON.parse(JSON.stringify(snapshot.stickers)));
      setImageLayers(JSON.parse(JSON.stringify(snapshot.imageLayers || [])));
      setDrawings(JSON.parse(JSON.stringify(snapshot.drawings || [])));
      setHistoryStep(prevStep);
    }
  };

  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      const nextStep = historyStep + 1;
      const snapshot = history[nextStep];
      setCaptions(JSON.parse(JSON.stringify(snapshot.captions)));
      setStickers(JSON.parse(JSON.stringify(snapshot.stickers)));
      setImageLayers(JSON.parse(JSON.stringify(snapshot.imageLayers || [])));
      setDrawings(JSON.parse(JSON.stringify(snapshot.drawings || [])));
      setHistoryStep(nextStep);
    }
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
    setTimeout(() => {
      if (canvasRef.current) {
        const dataUrl = canvasRef.current.toDataURL('image/png');
        setExportedImageUri(dataUrl);
        const cleaned = cleanTemplateName(template?.name);
        const defaultName = cleaned || (captions[0]?.text && captions[0].text !== 'TOP TEXT' ? captions[0].text : '') || 'My Meme';
        setMemeCustomName(defaultName);
        setIsSaveModalOpen(true);
      }
    }, 50);
  };

  const handleExport = () => {
    setActiveLayerId(null);
    setTimeout(() => {
      if (canvasRef.current) {
        const dataUrl = canvasRef.current.toDataURL('image/png');
        setExportedImageUri(dataUrl);
        setIsExportModalOpen(true);
      }
    }, 50);
  };

  // Caption Handlers
  const handleAddCaption = () => {
    const newCap = {
      id: `cap-${Date.now()}`,
      text: 'NEW TEXT',
      x: 0.5,
      y: 0.5,
      fontSize: 50,
      color: '#ffffff',
      stroke: '#000000',
      align: 'center',
      fontFamily: 'Impact, sans-serif',
      rotation: 0
    };
    const nextCaps = [...captions, newCap];
    setCaptions(nextCaps);
    setActiveLayerId(newCap.id);
    pushHistory(nextCaps, stickers);
  };

  const handleAddPresetPhrase = (phraseText) => {
    const newCap = {
      id: `cap-${Date.now()}`,
      text: phraseText,
      x: 0.5,
      y: 0.5,
      fontSize: 50,
      color: '#ffffff',
      stroke: '#000000',
      align: 'center',
      fontFamily: 'Impact, sans-serif',
      rotation: 0,
      width: 0.9
    };
    const nextCaps = [...captions, newCap];
    setCaptions(nextCaps);
    setActiveLayerId(newCap.id);
    pushHistory(nextCaps, stickers);
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

  const handleSetCaptionBg = (bg) => {
    if (!activeCaption) return;
    if (bg === 'none' || activeCaption.bgColor === bg) {
      // Toggle off / reset to transparent background
      const nextColor = (activeCaption.color === '#000000' || activeCaption.color === 'black') ? '#ffffff' : (activeCaption.color || '#ffffff');
      updateActiveCaptionProps({
        bgColor: 'none',
        color: nextColor,
        stroke: '#000000'
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
    const newImgLayer = {
      id: `img-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      url: src,
      x: 0.5,
      y: 0.5,
      scale: 1.5,
      rotation: 0,
      fitMode: 'stretch',
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

  const handleFileUploadImageLayer = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    handleAddImageLayer(url);
    e.target.value = '';
  };

  const updateActiveImageLayer = (key, value) => {
    if (!activeLayerId) return;
    const nextImgLayers = imageLayers.map((layer) => {
      if (layer.id === activeLayerId) {
        return { ...layer, [key]: value };
      }
      return layer;
    });
    setImageLayers(nextImgLayers);
    pushHistory(captions, stickers, nextImgLayers);
  };

  const handleDeleteLayer = () => {
    if (!activeLayerId) return;
    const layerIdToRemove = activeLayerId;
    
    // First, immediately clear the active layer to hide the properties panel and force UI update
    setActiveLayerId(null);
    
    // Then compute next state
    const nextCaps = captions.filter((c) => c.id !== layerIdToRemove);
    const nextStickers = stickers.filter((s) => s.id !== layerIdToRemove);
    const nextImgLayers = imageLayers.filter((i) => i.id !== layerIdToRemove);
    
    // Update state
    setCaptions(nextCaps);
    setStickers(nextStickers);
    setImageLayers(nextImgLayers);
    
    // Push history
    pushHistory(nextCaps, nextStickers, nextImgLayers);
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
    const newSticker = {
      id: `stk-${Date.now()}`,
      emoji: stickerObj.emoji,
      x: 0.5,
      y: 0.5,
      scale: 2.5,
      rotation: 0
    };
    const nextStickers = [...stickers, newSticker];
    setStickers(nextStickers);
    setActiveLayerId(newSticker.id);
    setActiveTab('stickers');
    setShowEmojiModal(false);
    pushHistory(captions, nextStickers);
  };

  const handleAddGraphicSticker = (stickerObj) => {
    const newSticker = {
      id: `stk-graphic-${Date.now()}`,
      name: stickerObj.name,
      url: stickerObj.url,
      x: 0.5,
      y: 0.5,
      scale: 2.2,
      rotation: 0
    };
    const nextStickers = [...stickers, newSticker];
    setStickers(nextStickers);
    setActiveLayerId(newSticker.id);
    setActiveTab('stickers');
    setShowMemeStickersModal(false);
    pushHistory(captions, nextStickers);
  };

  const activeCaption = captions.find((c) => c.id === activeLayerId);
  const activeSticker = stickers.find((s) => s.id === activeLayerId);

  const activeFontObj = FONTS.find((f) => f.family === (activeCaption?.fontFamily || 'Impact, sans-serif'))
    || FONTS.find((f) => activeCaption?.fontFamily?.toLowerCase().includes('comic') && f.id.toLowerCase().includes('comic'))
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
    
    // Wait for the canvas to re-render without the active layer selection box
    setTimeout(() => {
      if (canvasRef.current) {
        const dataUrl = canvasRef.current.toDataURL('image/png');
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
    }, 50);
  };

  const handleConfirmSave = () => {
    const dataUrl = exportedImageUri || (canvasRef.current && canvasRef.current.toDataURL('image/png'));
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
      const filename = `meme-${template?.id || 'custom'}-${Date.now()}.png`;
      await downloadImageHelper(exportedImageUri, filename);
      triggerConfetti();
    }
  };


  return (
    <AnimatePresence mode="wait">
      {isExportModalOpen ? (
        <motion.div key="export" className="export-page-container" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}>
          {/* Header */}
          <div className="editor-topbar glass-card flex-between" style={{ gap: '4px' }}>
            <div className="header-left" style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
              <button className="btn btn-ghost btn-xs export-back-btn" onClick={() => setIsExportModalOpen(false)}>
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
              <div className="export-actions">
                <button className={`btn ${isSaved ? 'btn-success' : 'btn-secondary'} hover-lift`} onClick={() => { handleConfirmSave(); }}>
                  {isSaved ? <><Check className="icon-sm" /> <span>Saved to Gallery</span></> : <><Save className="icon-sm" /> <span>Save to Gallery</span></>}
                </button>
                <button className="btn btn-primary shadow-glow" onClick={handleDownloadImage}>
                  <Download className="icon-sm" /> <span>Download PNG</span>
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
        <button className="btn btn-ghost btn-xs" onClick={onBack}>
          <ArrowLeft className="icon-sm" /> Back
        </button>

        <div className="history-actions flex-gap">
          <button
            className="btn btn-icon btn-xs"
            onClick={handleUndo}
            disabled={historyStep <= 0}
            title="Undo"
            style={{ opacity: historyStep <= 0 ? 0.6 : 1, cursor: historyStep <= 0 ? 'not-allowed' : 'pointer', background: historyStep <= 0 ? 'var(--glass-bg)' : '' }}
          >
            <Undo className="icon-xs" />
          </button>
          <button
            className="btn btn-icon btn-xs"
            onClick={handleRedo}
            disabled={historyStep >= history.length - 1}
            title="Redo"
            style={{ opacity: historyStep >= history.length - 1 ? 0.6 : 1, cursor: historyStep >= history.length - 1 ? 'not-allowed' : 'pointer', background: historyStep >= history.length - 1 ? 'var(--glass-bg)' : '' }}
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
              setPadding(0);
              pushHistoryDebounced(captions, stickers, imageLayers);
            }}
            options={ASPECT_RATIOS}
          />

          <motion.button
            className="btn btn-primary shadow-glow btn-xs"
            whileTap={{ scale: 0.95 }}
            onClick={handleExport}
          >
            <Sparkles className="icon-xs" /> Preview
          </motion.button>
        </div>
      </div>
      
      <div className="editor-main" style={{ display: 'flex', flexDirection: window.innerWidth <= 768 ? 'column' : 'row', height: 'calc(100vh - 60px)', overflow: 'hidden', gap: '16px', padding: '12px' }}>


        {/* Editor Workspace Main Area */}
        <div className="editor-workspace" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {/* Canvas Render Area */}
          <div className="canvas-wrapper" style={{ width: '100%', maxHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, overflow: 'hidden' }}>
            <CanvasEditor
              ref={canvasRef}
              template={template}
              imageUrl={template?.rawImageUrl || template?.imageUrl}
            captions={captions}
            stickers={stickers}
            imageLayers={imageLayers}
            aspectRatio={aspectRatio}
            imageFit={imageFit}
            isNativeLayout={isNativeLayout}
            layoutDef={layoutDef}
            slotImages={slotImages}
            slotTransforms={slotTransforms}
            onUpdateSlotTransform={updateSlotTransform}
            activeLayerId={activeLayerId}
            onDeleteLayer={handleDeleteLayer}
            onSelectLayer={(id) => {
              setActiveLayerId(id);
              const stk = stickers.find((s) => s.id === id);
              if (stk) {
                setActiveTab('stickers');
              } else if (imageLayers.some((img) => img.id === id)) {
                setActiveTab('images');
              } else if (id) {
                setActiveTab('text');
              }
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
                const nextCaps = prevCaps.map((c) => (c.id === id ? { ...c, text } : c));
                pushHistoryDebounced(nextCaps, stickers, imageLayers);
                return nextCaps;
              });
            }}
            isVideoPlaying={isVideoPlaying}
            watermark={watermark}
            drawings={drawings}
            onAddDrawing={handleAddDrawing}
            isDrawingMode={activeTab === 'draw' && Boolean(drawTool)}
            drawTool={drawTool}
            brushColor={brushColor}
            brushSize={brushSize}
          />
        </div>
      </div>
        
      {/* Sidebar Controls Tabs */}
        <div className="editor-sidebar glass-card" style={{ width: '370px', flexShrink: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
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
              className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`}
              onClick={() => setActiveTab('text')}
            >
              <Type className="icon-xs" /> Text
            </button>
            <button
              className={`tab-btn ${activeTab === 'stickers' ? 'active' : ''}`}
              onClick={() => setActiveTab('stickers')}
            >
              <Smile className="icon-xs" /> Stickers
            </button>
            <button
              className={`tab-btn ${activeTab === 'images' ? 'active' : ''}`}
              onClick={() => setActiveTab('images')}
            >
              <ImageIcon className="icon-xs" /> Media
            </button>
            <button
              className={`tab-btn ${activeTab === 'draw' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('draw');
                setActiveLayerId(null);
                setDrawTool('brush');
              }}
            >
              <Paintbrush className="icon-xs" /> Draw
            </button>
            <button
              className={`tab-btn ${activeTab === 'watermark' ? 'active' : ''}`}
              onClick={() => setActiveTab('watermark')}
            >
              <Droplet className="icon-xs" /> Watermark
            </button>
          </div>



            {/* TAB 5: WATERMARK */}
            {activeTab === 'watermark' && (
              <div className="tab-content">
                <div className="form-group margin-bottom-md">
                  <div className="flex-between align-center" style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', lineHeight: 1 }}><Droplet className="icon-sm" style={{ transform: 'translateY(1px)' }} /> Watermark</label>
                    <label className="switch">
                      <input type="checkbox" checked={watermark?.enabled || false} onChange={(e) => updateWatermark('enabled', e.target.checked)} />
                      <span className="slider round"></span>
                    </label>
                  </div>
                  
                  {watermark?.enabled && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '8px' }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div className="watermark-text-input" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', userSelect: 'none' }}>@</span>
                          <input 
                            type="text" 
                            placeholder="username" 
                            value={(watermark.text || '').replace(/^@/, '')} 
                            onChange={(e) => {
                              const val = e.target.value.replace(/^@/, '');
                              updateWatermark('text', val ? `@${val}` : '');
                              if (val) updateWatermark('imageUrl', null);
                            }} 
                            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-main)', fontSize: '0.9rem', width: '100%', padding: 0 }} 
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
                          <RefreshCw style={{ width: '15px', height: '15px', flexShrink: 0 }} className="text-cyan" />
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
                {/* Tool Selection: Brush / Pen vs Eraser */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                  <button
                    className={`btn ${drawTool === 'brush' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setDrawTool((prev) => prev === 'brush' ? null : 'brush')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '7px 10px', gap: '6px', borderRadius: '10px', fontSize: '0.78rem' }}
                  >
                    <Paintbrush className="icon-xs" style={{ width: '14px', height: '14px' }} />
                    <span>Brush / Pen</span>
                  </button>
                  <button
                    className={`btn ${drawTool === 'eraser' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setDrawTool((prev) => prev === 'eraser' ? null : 'eraser')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '7px 10px', gap: '6px', borderRadius: '10px', fontSize: '0.78rem' }}
                  >
                    <Eraser className="icon-xs" style={{ width: '14px', height: '14px' }} />
                    <span>Eraser</span>
                  </button>
                </div>

                {/* 1. Stroke / Eraser Thickness */}
                <div style={{ marginBottom: '16px' }}>
                  <div className="flex-between align-center" style={{ marginBottom: '6px', paddingRight: '4px' }}>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      {drawTool === 'eraser' ? 'Eraser Thickness' : 'Stroke Thickness'} ({brushSize}px)
                    </label>
                    <div
                      style={{
                        width: Math.min(26, Math.max(6, brushSize)),
                        height: Math.min(26, Math.max(6, brushSize)),
                        borderRadius: '50%',
                        background: drawTool === 'eraser' ? '#ffffff' : brushColor,
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
                {drawTool !== 'eraser' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', paddingLeft: '4px', paddingRight: '4px', flexWrap: 'wrap' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, whiteSpace: 'nowrap' }}>
                      Brush/Pen Color:
                    </label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {['#a855f7', '#ff3333', '#ffe600', '#ffffff', '#000000'].map((color) => (
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
                            boxShadow: brushColor === color ? `0 0 8px ${color}` : 'none',
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
                )}
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
                {/* + Text Button */}
                <button
                  type="button"
                  className="btn btn-xs btn-primary hover-lift"
                  onClick={handleAddCaption}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '20px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Plus size={15} /> {activeCaption ? 'Text' : 'Add Text'}
                </button>

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
                      className="btn btn-icon btn-xs hover-lift"
                      onClick={handleDeleteLayer}
                      title="Delete Text"
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'rgba(255, 51, 85, 0.12)',
                        border: '1px solid rgba(255, 51, 85, 0.25)',
                        color: '#ff3355',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Trash2 size={14} />
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
                      <label style={{ margin: 0, fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        Font
                      </label>
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
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeFontObj.name.split(' ')[0]}</span>
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

                      {/* Segmented Button Group: None, White, Black */}
                      <div
                        style={{
                          display: 'flex',
                          height: '38px',
                          padding: '3px',
                          borderRadius: '10px',
                          background: 'var(--bg-surface-1)',
                          border: '1px solid var(--glass-border)',
                          gap: '2px',
                          boxSizing: 'border-box'
                        }}
                      >
                        <button
                          type="button"
                          className={`btn btn-xs flex-1 ${(!activeCaption.bgColor || activeCaption.bgColor === 'transparent' || activeCaption.bgColor === 'none') ? 'btn-primary' : 'btn-ghost'}`}
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            borderRadius: '7px',
                            padding: '0 4px',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onClick={() => handleSetCaptionBg('none')}
                        >
                          None
                        </button>
                        <button
                          type="button"
                          className={`btn btn-xs flex-1 ${(activeCaption.bgColor === 'white' || activeCaption.bgColor === '#ffffff') ? 'btn-primary' : 'btn-ghost'}`}
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            borderRadius: '7px',
                            padding: '0 4px',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                          onClick={() => handleSetCaptionBg('white')}
                        >
                          <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#fff', display: 'inline-block' }} />
                          White
                        </button>
                        <button
                          type="button"
                          className={`btn btn-xs flex-1 ${(activeCaption.bgColor === 'black' || activeCaption.bgColor === '#000000') ? 'btn-primary' : 'btn-ghost'}`}
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            borderRadius: '7px',
                            padding: '0 4px',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                          onClick={() => handleSetCaptionBg('black')}
                        >
                          <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#000', border: '1px solid #777', display: 'inline-block' }} />
                          Black
                        </button>
                      </div>
                    </div>
                  </div>
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
                  <span>Tap text on canvas to customize font, size, opacity & colors.</span>
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

          {/* TAB 2: STICKERS & EMOJIS */}
          {activeTab === 'stickers' && (
            <div className="tab-content animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Compact Action Buttons: Sticker & Emoji (+ Delete if a sticker is selected) */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-xs btn-primary hover-lift"
                  onClick={() => {
                    setShowMemeStickersModal(true);
                    setStickerSearchQuery('');
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Sticker className="icon-xs" /> Sticker
                </button>

                <button
                  type="button"
                  className="btn btn-xs btn-secondary hover-lift"
                  onClick={() => {
                    setShowEmojiModal(true);
                    setEmojiSearchQuery('');
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Smile className="icon-xs" /> Emoji
                </button>

                {activeSticker && (
                  <button
                    type="button"
                    className="btn btn-icon btn-xs text-danger hover-lift"
                    onClick={handleDeleteLayer}
                    title="Delete Sticker"
                    style={{ flexShrink: 0 }}
                  >
                    <Trash2 className="icon-xs" />
                  </button>
                )}
              </div>

              {/* Helpful hint or active sticker indicator */}
              {!activeSticker ? (
                <div style={{ textAlign: 'center', padding: '16px 12px', color: 'var(--text-muted)', fontSize: '0.8rem', background: 'var(--bg-surface-1)', borderRadius: '10px', border: '1px dashed var(--glass-border)' }}>
                  Click a button above to choose a sticker or emoji.
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-surface-1)', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {activeSticker.url ? (
                      <img src={activeSticker.url} alt={activeSticker.name || 'Sticker'} style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{activeSticker.emoji}</span>
                    )}
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>
                      {activeSticker.name || 'Selected Sticker'}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Resize via canvas handles
                  </span>
                </div>
              )}
            </div>
          )}
          {/* TAB 3: MEDIA OVERLAY CONTROLS */}
          {activeTab === 'images' && (() => {
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
                      borderRadius: '8px',
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
                    <Upload className="icon-xs" /> Upload Media
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
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <ImageIcon className="icon-xs" /> Pick Template
                  </button>

                  {activeImageLayer && (
                    <button
                      type="button"
                      className="btn btn-icon btn-xs text-danger hover-lift"
                      onClick={handleDeleteLayer}
                      title="Delete Media Layer"
                      style={{ flexShrink: 0 }}
                    >
                      <Trash2 className="icon-xs" />
                    </button>
                  )}
                </div>
                
                {activeImageLayer ? (
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
                ) : (
                  <div style={{ textAlign: 'center', padding: '16px 12px', color: 'var(--text-muted)', fontSize: '0.8rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px dashed var(--glass-border)' }}>
                    Upload an image or pick a template overlay to place on your canvas.
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
          })()}</div>
      </div>



      {/* Meme Stickers & Overlays Modal */}
      {showMemeStickersModal && (
        <ModalPortal>
          <div
            className="modal-backdrop animate-fade-in"
            style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setShowMemeStickersModal(false)}
          >
          <div
            className="modal-content glass-card modal-lg animate-scale-up"
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'relative', width: '90%', maxWidth: '680px', height: '80vh', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            <div className="modal-header flex-between" style={{ alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ margin: '0 auto', color: 'var(--text-main)', textAlign: 'center', flex: 1, paddingLeft: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Sticker size={20} style={{ color: 'var(--cyber-cyan)' }} />
                Choose a Sticker
              </h3>
              <button
                className="btn-close"
                onClick={() => setShowMemeStickersModal(false)}
                title="Close"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="search-bar-wrapper margin-bottom-md" style={{ position: 'relative', marginTop: '12px', marginBottom: '14px' }}>
              <Search className="search-icon" size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Search meme stickers (glasses, hat, bubble, crown)..." 
                value={stickerSearchQuery}
                onChange={(e) => setStickerSearchQuery(e.target.value)}
                className="search-input"
                style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '24px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                onFocus={(e) => e.target.style.borderColor = 'var(--cyber-cyan)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
              />
              {stickerSearchQuery && (
                <button 
                  className="btn-clear-search hover-lift"
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--text-main)', cursor: 'pointer', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => setStickerSearchQuery('')}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '14px', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              {/* Category sidebar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '64px', height: '100%', overflowY: 'auto', paddingRight: '4px', overscrollBehavior: 'contain' }}>
                {GRAPHIC_STICKER_CATEGORIES.map(cat => {
                  const isActive = activeGraphicStickerCategory === cat.id && !stickerSearchQuery;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setActiveGraphicStickerCategory(cat.id);
                        setStickerSearchQuery('');
                      }}
                      style={{
                        padding: '10px 4px',
                        background: isActive ? 'rgba(168, 85, 247, 0.16)' : 'transparent',
                        border: isActive ? '1px solid var(--cyber-cyan)' : '1px solid transparent',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.2s',
                        color: isActive ? 'var(--cyber-cyan)' : 'var(--text-main)'
                      }}
                      title={cat.label}
                    >
                      <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{cat.icon}</span>
                      <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Graphic stickers grid */}
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(74px, 1fr))', gap: '10px', overflowY: 'auto', padding: '4px', alignContent: 'start', overscrollBehavior: 'contain', height: '100%' }}>
                {GRAPHIC_STICKERS.filter(s => {
                  if (stickerSearchQuery.trim()) {
                    const q = stickerSearchQuery.toLowerCase();
                    return s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q) || (s.id && s.id.toLowerCase().includes(q));
                  }
                  return s.category === activeGraphicStickerCategory;
                }).map(stk => (
                  <button
                    key={stk.id}
                    className="graphic-sticker-btn hover-lift"
                    title={stk.name}
                    onClick={() => handleAddGraphicSticker(stk)}
                    style={{
                      background: 'var(--bg-surface-1)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '12px',
                      padding: '8px 4px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      minHeight: '76px',
                      position: 'relative'
                    }}
                  >
                    <img
                      src={stk.url}
                      alt={stk.name}
                      style={{ width: '48px', height: '44px', objectFit: 'contain', pointerEvents: 'none' }}
                      loading="lazy"
                    />
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '68px' }}>
                      {stk.name}
                    </span>
                  </button>
                ))}
                {GRAPHIC_STICKERS.filter(s => {
                  if (stickerSearchQuery.trim()) {
                    const q = stickerSearchQuery.toLowerCase();
                    return s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q) || (s.id && s.id.toLowerCase().includes(q));
                  }
                  return s.category === activeGraphicStickerCategory;
                }).length === 0 && (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', padding: '30px 0' }}>
                    No stickers found matching "{stickerSearchQuery}".
                  </div>
                )}
              </div>
            </div>
          </div>
          </div>
        </ModalPortal>
      )}

      {/* Emoji Stickers Modal */}
      {showEmojiModal && (
        <ModalPortal>
          <div
            className="modal-backdrop animate-fade-in"
            style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setShowEmojiModal(false)}
          >
          <div
            className="modal-content glass-card modal-lg animate-scale-up"
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'relative', width: '90%', maxWidth: '680px', height: '80vh', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            <div className="modal-header flex-between" style={{ alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ margin: '0 auto', color: 'var(--text-main)', textAlign: 'center', flex: 1, paddingLeft: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Smile size={20} style={{ color: 'var(--cyber-cyan)' }} />
                Choose an Emoji
              </h3>
              <button
                className="btn-close"
                onClick={() => setShowEmojiModal(false)}
                title="Close"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="search-bar-wrapper margin-bottom-md" style={{ position: 'relative', marginTop: '12px', marginBottom: '14px' }}>
              <Search className="search-icon" size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Search emojis..." 
                value={emojiSearchQuery}
                onChange={(e) => setEmojiSearchQuery(e.target.value)}
                className="search-input"
                style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '24px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                onFocus={(e) => e.target.style.borderColor = 'var(--cyber-cyan)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
              />
              {emojiSearchQuery && (
                <button 
                  className="btn-clear-search hover-lift"
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--text-main)', cursor: 'pointer', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => setEmojiSearchQuery('')}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '14px', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              {/* Category sidebar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '60px', height: '100%', overflowY: 'auto', paddingRight: '4px', overscrollBehavior: 'contain' }}>
                {[
                  { id: 'faces', icon: '😀', label: 'Faces' },
                  { id: 'gestures', icon: '👋', label: 'Hands' },
                  { id: 'flags', icon: '🏳️‍🌈', label: 'Flags' },
                  { id: 'symbols', icon: '❤️', label: 'Symbols' },
                  { id: 'objects', icon: '💡', label: 'Objects' }
                ].map(cat => {
                  const isActive = activeStickerCategory === cat.id && !emojiSearchQuery;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setActiveStickerCategory(cat.id);
                        setEmojiSearchQuery('');
                      }}
                      style={{
                        padding: '10px 4px',
                        background: isActive ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                        color: isActive ? '#fff' : 'var(--text-main)',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.2s'
                      }}
                      title={cat.label}
                    >
                      <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>{cat.icon}</span>
                      <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'inherit' }}>{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Emoji grid */}
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '10px', overflowY: 'auto', padding: '4px', alignContent: 'start', overscrollBehavior: 'contain', height: '100%' }}>
                {STICKERS.filter(s => {
                  if (emojiSearchQuery.trim()) {
                    const q = emojiSearchQuery.toLowerCase();
                    return s.id.toLowerCase().includes(q) || (s.name && s.name.toLowerCase().includes(q)) || s.emoji.includes(q);
                  }
                  return s.category === activeStickerCategory;
                }).map(s => (
                  <button 
                    key={s.id} 
                    className="sticker-chip-btn hover-lift"
                    title={s.name}
                    onClick={() => handleAddSticker(s)} 
                  >
                    {s.emoji}
                  </button>
                ))}
                {STICKERS.filter(s => {
                  if (emojiSearchQuery.trim()) {
                    const q = emojiSearchQuery.toLowerCase();
                    return s.id.toLowerCase().includes(q) || (s.name && s.name.toLowerCase().includes(q)) || s.emoji.includes(q);
                  }
                  return s.category === activeStickerCategory;
                }).length === 0 && (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>
                    No emojis found matching "{emojiSearchQuery}".
                  </div>
                )}
              </div>
            </div>
          </div>
          </div>
        </ModalPortal>
      )}

      {/* Image Layer Template Picker Modal */}
      {imagePickerTarget !== null && (
        <ModalPortal>
          <div className="modal-backdrop animate-fade-in" onClick={() => setImagePickerTarget(null)}>
          <div 
            className="modal-content glass-card modal-lg animate-scale-up" 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              position: 'relative', 
              width: '90%', 
              maxWidth: '680px', 
              height: '80vh', 
              maxHeight: '85vh', 
              display: 'flex', 
              flexDirection: 'column', 
              overflow: 'hidden' 
            }}
          >
            <div className="modal-header flex-between" style={{ alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ margin: '0 auto', color: 'var(--text-main)', textAlign: 'center', flex: 1, paddingLeft: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <ImageIcon size={20} style={{ color: 'var(--cyber-cyan)' }} />
                Add Template
              </h3>
              <button className="btn-close" onClick={() => setImagePickerTarget(null)} title="Close" aria-label="Close">✕</button>
            </div>

            <div className="picker-search-bar" style={{ position: 'relative', marginBottom: '14px' }}>
              <Search className="search-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder={`Search ${openSourceTemplates.length}+ meme templates...`}
                value={imagePickerSearch}
                onChange={(e) => setImagePickerSearch(e.target.value)}
                className="search-input"
                style={{ paddingLeft: '38px', paddingRight: imagePickerSearch ? '38px' : '14px', height: '42px', width: '100%', boxSizing: 'border-box', borderRadius: '24px' }}
              />
              {imagePickerSearch && (
                <button
                  onClick={() => setImagePickerSearch('')}
                  style={{
                    position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                    background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%',
                    width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-muted)', cursor: 'pointer'
                  }}
                >
                  <X className="icon-xs" style={{ width: '13px', height: '13px' }} />
                </button>
              )}
            </div>

            {/* Category Pills - Horizontal scroll only */}
            <div 
              onWheel={(e) => {
                if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                  e.currentTarget.scrollLeft += e.deltaY;
                }
              }}
              style={{
                display: 'flex',
                flexWrap: 'nowrap',
                alignItems: 'center',
                gap: '8px',
                padding: '2px 4px 12px 4px',
                overflowX: 'auto',
                overflowY: 'hidden',
                flexShrink: 0,
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
                borderBottom: '1px solid var(--glass-border)',
                marginBottom: '10px'
              }}
            >
              {CATEGORIES.map((cat) => {
                const isActive = imagePickerCategory === cat.id && !imagePickerSearch;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setImagePickerCategory(cat.id);
                      setImagePickerSearch('');
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      border: isActive ? '1px solid var(--primary-accent)' : '1px solid var(--glass-border)',
                      background: isActive ? 'var(--primary-gradient)' : 'var(--glass-bg)',
                      color: isActive ? '#ffffff' : 'var(--text-muted)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      boxShadow: isActive ? '0 2px 8px rgba(139, 92, 246, 0.3)' : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            <div 
              className="template-picker-mini" 
              style={{ 
                flex: 1, 
                minHeight: 0, 
                overflowY: 'auto', 
                overflowX: 'hidden', 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', 
                gridAutoRows: 'max-content',
                alignContent: 'start',
                gap: '12px', 
                padding: '8px 4px 16px 4px',
                boxSizing: 'border-box',
                overscrollBehavior: 'contain'
              }}
            >
              {filteredImageTemplates.length > 0 ? (
                filteredImageTemplates.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    className="template-card glass-card hover-lift"
                    style={{
                      minWidth: 0,
                      width: '100%',
                      height: 'auto',
                      minHeight: '165px',
                      padding: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      background: 'var(--bg-surface-1)',
                      border: '1px solid var(--glass-border)',
                      cursor: 'pointer',
                      boxSizing: 'border-box'
                    }}
                    onClick={() => {
                      if (imagePickerTarget === 'layer') {
                        handleAddImageLayer(tmpl.imageUrl);
                      } else if (imagePickerTarget.slot !== undefined) {
                        const nextImages = [...slotImages];
                        nextImages[imagePickerTarget.slot] = tmpl.imageUrl;
                        setSlotImages(nextImages);

                        const nextTransforms = [...slotTransforms];
                        nextTransforms[imagePickerTarget.slot] = { offsetX: 0, offsetY: 0, scale: 1.5 };
                        setSlotTransforms(nextTransforms);
                      }
                      setImagePickerTarget(null);
                      setImagePickerSearch('');
                    }}
                  >
                    <div
                      className="template-image-wrapper"
                      style={{
                        width: '100%',
                        aspectRatio: '1 / 1',
                        height: '130px',
                        minHeight: '120px',
                        position: 'relative',
                        overflow: 'hidden',
                        background: 'rgba(0, 0, 0, 0.4)',
                        flexShrink: 0
                      }}
                    >
                      <img
                        src={tmpl.imageUrl}
                        alt={tmpl.name}
                        loading="lazy"
                        style={{
                          width: '100%',
                          height: '100%',
                          minHeight: '120px',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                      />
                    </div>
                    <div className="template-info" style={{ padding: '6px 8px', minHeight: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxSizing: 'border-box' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, textAlign: 'center', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-main)', width: '100%' }}>{tmpl.name}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  <ImageIcon className="icon-lg" style={{ opacity: 0.4, marginBottom: '8px' }} />
                  <p>No matching templates found for "{imagePickerSearch}"</p>
                </div>
              )}
            </div>
          </div>
          </div>
        </ModalPortal>
      )}
    </div>
      )}
    </AnimatePresence>
  );
}
