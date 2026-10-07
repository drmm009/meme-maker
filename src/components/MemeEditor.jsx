import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ModalPortal from './ModalPortal';
import CanvasEditor from './CanvasEditor';
import { FONTS, STICKERS } from '../data/stickers';
import { GRAPHIC_STICKERS, GRAPHIC_STICKER_CATEGORIES } from '../data/memeStickers';
import confetti from 'canvas-confetti';
import {
  Type, Plus, Trash2, Undo, Redo, Download, Share2, Sparkles, Copy, Blend,
  Sliders, Smile, Sticker, ArrowLeft, Save, Check, RefreshCw,
  Image as ImageIcon, Search, X, Upload, RotateCw, ZoomIn, Crop, LayoutGrid, Scissors, Play, Pause, FolderHeart, Droplet, Monitor,
  Paintbrush, Eraser, Palette, Sun, Moon, ChevronDown, ChevronLeft, PencilLine, Move, ArrowDownRight, Quote, Wand2,
  Layers, ArrowUp, ArrowDown
} from 'lucide-react';
import { downloadImageHelper, recordCanvasAsVideo } from '../utils/downloadHelper';
import { motion, AnimatePresence } from 'framer-motion';
import { MEME_TEMPLATES, CATEGORIES } from '../data/templates';
import { fetchOpenSourceMemes } from '../services/memeService';
import VideoTrimmer from './VideoTrimmer';
import AspectRatioDropdown from './AspectRatioDropdown';
import GiphyTab from './GiphyTab';
import { PHOTO_FILTERS } from '../data/photoFilters';
import { removeBackground } from '@imgly/background-removal';
import './MemeEditor.css';

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

// Calculates a default canvas position (normalized 0..1) that avoids overlapping existing elements
const getNonOverlappingPosition = (type, captions = [], stickers = [], imageLayers = []) => {
  // Estimated normalized width and height per element type
  let newW = 0.38;
  let newH = 0.12;
  if (type === 'phrase') {
    newW = 0.55;
    newH = 0.14;
  } else if (type === 'sticker' || type === 'emoji') {
    newW = 0.20;
    newH = 0.20;
  } else if (type === 'image') {
    newW = 0.28;
    newH = 0.28;
  }

  // Collect all existing elements on canvas with normalized bounds
  const existing = [
    ...captions.map((c) => ({
      x: typeof c.x === 'number' ? c.x : 0.5,
      y: typeof c.y === 'number' ? c.y : 0.5,
      w: c.width ? Math.min(Math.max(c.width, 0.35), 0.8) : 0.38,
      h: (c.fontSize || 50) > 60 ? 0.15 : 0.12
    })),
    ...stickers.map((s) => ({
      x: typeof s.x === 'number' ? s.x : 0.5,
      y: typeof s.y === 'number' ? s.y : 0.5,
      w: 0.20,
      h: 0.20
    })),
    ...imageLayers.map((img) => ({
      x: typeof img.x === 'number' ? img.x : 0.5,
      y: typeof img.y === 'number' ? img.y : 0.5,
      w: 0.28,
      h: 0.28
    }))
  ];

  const checkOverlap = (cx, cy, w, h, items, margin = 0.03) => {
    for (const it of items) {
      const minDx = (w + it.w) / 2 + margin;
      const minDy = (h + it.h) / 2 + margin;
      if (Math.abs(cx - it.x) < minDx && Math.abs(cy - it.y) < minDy) {
        return true;
      }
    }
    return false;
  };

  // If canvas is completely empty, default to center
  if (existing.length === 0) {
    return { x: 0.5, y: 0.5 };
  }

  // 1. If center is completely free, use center
  if (!checkOverlap(0.5, 0.5, newW, newH, existing, 0.03)) {
    return { x: 0.5, y: 0.5 };
  }

  // 2. Safe boundaries inside canvas
  const minX = Math.max(0.18, newW / 2 + 0.04);
  const maxX = Math.min(0.82, 1 - (newW / 2 + 0.04));
  const minY = Math.max(0.18, newH / 2 + 0.04);
  const maxY = Math.min(0.82, 1 - (newH / 2 + 0.04));

  // Build grid of candidate coordinates
  const candidates = [];
  const step = 0.05;
  for (let y = minY; y <= maxY + 0.001; y += step) {
    for (let x = minX; x <= maxX + 0.001; x += step) {
      const px = Number(x.toFixed(3));
      const py = Number(y.toFixed(3));
      const dist = Math.hypot(px - 0.5, (py - 0.5) * 1.05);
      candidates.push({ x: px, y: py, dist });
    }
  }

  // Sort candidates by closeness to center
  candidates.sort((a, b) => a.dist - b.dist);

  // Pass 1: standard margin (comfortable spacing)
  for (const cand of candidates) {
    if (!checkOverlap(cand.x, cand.y, newW, newH, existing, 0.03)) {
      return { x: cand.x, y: cand.y };
    }
  }

  // Pass 2: tighter margin
  for (const cand of candidates) {
    if (!checkOverlap(cand.x, cand.y, newW, newH, existing, 0.01)) {
      return { x: cand.x, y: cand.y };
    }
  }

  // Pass 3: least crowded point (maximize minimum distance to any existing element)
  let bestCand = null;
  let maxMinDist = -1;
  for (const cand of candidates) {
    let minDist = Infinity;
    for (const it of existing) {
      const d = Math.hypot(cand.x - it.x, cand.y - it.y);
      if (d < minDist) minDist = d;
    }
    if (minDist > maxMinDist) {
      maxMinDist = minDist;
      bestCand = cand;
    }
  }

  if (bestCand) {
    return { x: bestCand.x, y: bestCand.y };
  }

  const offset = (existing.length % 5) * 0.06;
  return {
    x: Number(Math.min(0.8, Math.max(0.2, 0.5 + offset)).toFixed(3)),
    y: Number(Math.min(0.8, Math.max(0.2, 0.5 + offset)).toFixed(3))
  };
};


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
      style={{ position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '4px 10px' }}
      title="Canvas Color"
    >
      <div style={{ width: 14, height: 14, borderRadius: '50%', background: localColor || '#ffffff', border: '2px solid rgba(255,255,255,0.4)' }} />
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff' }}>Canvas Color</span>
      <input type="color" value={localColor || '#ffffff'} onChange={handleChange} style={{ position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
    </div>
  );
}

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

  const [activeTemplate, setActiveTemplate] = useState(template);
  const pickingTemplateRef = useRef(false);

  useEffect(() => {
    setActiveTemplate(template);
  }, [template]);


  const [aspectRatio, setAspectRatio] = useState(template?.aspectRatio || 'original');
  
  const [imageFit, setImageFit] = useState(template?.imageFit || 'contain');

  // Open-source templates for Image Layer / Slot overlay picker
  const [imagePickerTarget, setImagePickerTarget] = useState(null); // 'layer' | 'replaceTemplate' | { slot: idx }
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
  const [isMobileTabsFolded, setIsMobileTabsFolded] = useState(true);
  const [showWatermarkMenu, setShowWatermarkMenu] = useState(false);
  const [canvasBgColor, setCanvasBgColor] = useState('#ffffff');
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showOpacityMenu, setShowOpacityMenu] = useState(false);
  const [showImageFilterMenu, setShowImageFilterMenu] = useState(false);
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [showQuickPhrasesMenu, setShowQuickPhrasesMenu] = useState(false);
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
    if (window.innerWidth <= 768) {
      setIsMobileTabsFolded(true);
    } else {
      setIsMobileTabsFolded(false);
    }
  };
  const [showMemeStickersModal, setShowMemeStickersModal] = useState(false);
  const [showEmojiModal, setShowEmojiModal] = useState(false);
  const [stickerSearchQuery, setStickerSearchQuery] = useState('');
  const [emojiSearchQuery, setEmojiSearchQuery] = useState('');
  const [activeStickerCategory, setActiveStickerCategory] = useState('faces');
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [activeGraphicStickerCategory, setActiveGraphicStickerCategory] = useState('memes');

  // Freehand Drawing state
  const [drawings, setDrawings] = useState([]);
  const [drawTool, setDrawTool] = useState(null); // 'brush' | 'eraser' | null (deactivated by default)
  const [brushColor, setBrushColor] = useState('#a855f7');
  const [brushSize, setBrushSize] = useState(10);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [exportedImageUri, setExportedImageUri] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef(null);
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
  const watermarkTextInputRef = useRef(null);
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

  // Synchronize history snapshot on mount
  useEffect(() => {
    if (captions.length > 0 && activeLayerId === null) {
      setActiveLayerId(captions[0].id);
    }
  }, []);

  // Keyboard shortcuts: Ctrl+Z (undo), Ctrl+Y / Ctrl+Shift+Z (redo), Delete (delete layer), Escape (deselect)
  useEffect(() => {
    const handleKeyDown = (e) => {
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
      } else if (e.key === 'Escape') {
        setActiveLayerId(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [historyStep, history, activeLayerId, captions, stickers, imageLayers, drawings]);

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
    const pos = getNonOverlappingPosition('caption', captions, stickers, imageLayers);
    const referenceCap = captions.find(c => c.id === activeLayerId) || (captions.length > 0 ? captions[captions.length - 1] : null);
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
      rotation: 0
    };
    const nextCaps = [...captions, newCap];
    setCaptions(nextCaps);
    setActiveLayerId(newCap.id);
    pushHistory(nextCaps, stickers, imageLayers);
  };

  const handleAddPresetPhrase = (phraseText) => {
    const pos = getNonOverlappingPosition('phrase', captions, stickers, imageLayers);
    const referenceCap = captions.find(c => c.id === activeLayerId) || (captions.length > 0 ? captions[captions.length - 1] : null);
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
      width: 0.9
    };
    const nextCaps = [...captions, newCap];
    setCaptions(nextCaps);
    setActiveLayerId(newCap.id);
    pushHistory(nextCaps, stickers, imageLayers);
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
    const pos = getNonOverlappingPosition('image', captions, stickers, imageLayers);
    const newImgLayer = {
      id: `img-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      url: src,
      x: pos.x,
      y: pos.y,
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

  const handleZIndex = (dir) => {
    if (!activeLayerId) return;

    const isSticker = stickers.some(s => s.id === activeLayerId);
    const isCap = captions.some(c => c.id === activeLayerId);
    const isImg = (imageLayers || []).some(img => img.id === activeLayerId);

    if (isSticker) {
      const idx = stickers.findIndex(s => s.id === activeLayerId);
      if (idx !== -1) {
        const nextStickers = [...stickers];
        nextStickers[idx] = { ...nextStickers[idx], zIndex: (nextStickers[idx].zIndex || 0) + dir };
        setStickers(nextStickers);
        pushHistory(captions, nextStickers, imageLayers, drawings);
      }
    } else if (isCap) {
      const idx = captions.findIndex(c => c.id === activeLayerId);
      if (idx !== -1) {
        const nextCaps = [...captions];
        nextCaps[idx] = { ...nextCaps[idx], zIndex: (nextCaps[idx].zIndex || 0) + dir };
        setCaptions(nextCaps);
        pushHistory(nextCaps, stickers, imageLayers, drawings);
      }
    } else if (isImg) {
      const idx = (imageLayers || []).findIndex(img => img.id === activeLayerId);
      if (idx !== -1) {
        const nextImgLayers = [...imageLayers];
        nextImgLayers[idx] = { ...nextImgLayers[idx], zIndex: (nextImgLayers[idx].zIndex || 0) + dir };
        setImageLayers(nextImgLayers);
        pushHistory(captions, stickers, nextImgLayers, drawings);
      }
    }
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

  
  const handleRemoveBackground = async () => {
    const processImg = async (url) => {
       const res = await fetch(url);
       const blob = await res.blob();
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
          const newUrl = URL.createObjectURL(imgBlob);
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
          const newUrl = URL.createObjectURL(imgBlob);
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
          const newUrl = URL.createObjectURL(imgBlob);
          setActiveTemplate({ ...activeTemplate, rawImageUrl: newUrl, imageUrl: newUrl, originalUrl: oldUrl });
        } catch (err) {
          console.error('Failed to remove background:', err);
          alert('Failed to remove background: ' + (err.message || err.toString()));
        } finally {
          setIsRemovingBg(false);
        }
    }
  };

  const handleDuplicateLayer = () => {
    if (!activeLayerId) return;
    if (activeCaption) {
      const newCap = {
        ...activeCaption,
        id: `cap-${Date.now()}`,
        x: (activeCaption.x || 0.5) + 0.05,
        y: (activeCaption.y || 0.5) + 0.05
      };
      const nextCaps = [...captions, newCap];
      setCaptions(nextCaps);
      setActiveLayerId(newCap.id);
      pushHistory(nextCaps, stickers, imageLayers);
    } else if (activeSticker) {
      const newStk = {
        ...activeSticker,
        id: `stk-${Date.now()}`,
        x: (activeSticker.x || 0.5) + 0.05,
        y: (activeSticker.y || 0.5) + 0.05
      };
      const nextStk = [...stickers, newStk];
      setStickers(nextStk);
      setActiveLayerId(newStk.id);
      pushHistory(captions, nextStk, imageLayers);
    } else if (activeImageLayer) {
      const newImg = {
        ...activeImageLayer,
        id: `layer-${Date.now()}`,
        x: (activeImageLayer.x || 0.5) + 0.05,
        y: (activeImageLayer.y || 0.5) + 0.05
      };
      const nextImg = [...imageLayers, newImg];
      setImageLayers(nextImg);
      setActiveLayerId(newImg.id);
      pushHistory(captions, stickers, nextImg);
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
    const newSticker = {
      id: `stk-${Date.now()}`,
      emoji: stickerObj.emoji,
      x: pos.x,
      y: pos.y,
      scale: 2.5,
      rotation: 0
    };
    const nextStickers = [...stickers, newSticker];
    setStickers(nextStickers);
    setActiveLayerId(newSticker.id);
    setActiveTab('stickers');
    setShowEmojiModal(false);
    pushHistory(captions, nextStickers, imageLayers);
  };

  const handleAddGraphicSticker = (stickerObj) => {
    const pos = getNonOverlappingPosition('sticker', captions, stickers, imageLayers);
    const newSticker = {
      id: `stk-graphic-${Date.now()}`,
      name: stickerObj.name,
      url: stickerObj.url,
      x: pos.x,
      y: pos.y,
      scale: 2.2,
      rotation: 0
    };
    const nextStickers = [...stickers, newSticker];
    setStickers(nextStickers);
    setActiveLayerId(newSticker.id);
    setActiveTab('stickers');
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

  // Renders canvas to dataURL first, then runs the callback action
  const handleQuickExport = (action) => {
    setActiveLayerId(null);
    setExportDropdownOpen(false);
    setTimeout(async () => {
      if (canvasRef.current) {
        const dataUrl = canvasRef.current.toDataURL('image/png');
        setExportedImageUri(dataUrl);
        const cleaned = cleanTemplateName(template?.name);
        const defaultName = cleaned || (captions[0]?.text && captions[0].text !== 'TOP TEXT' ? captions[0].text : '') || 'My Meme';
        setMemeCustomName(defaultName);
        // Small delay so state update flushes
        await new Promise(r => setTimeout(r, 30));
        action(dataUrl);
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
      const file = new File([blob], `meme-${Date.now()}.png`, { type: 'image/png' });

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
              <div className="export-actions">
                <button className={`btn ${isSaved ? 'btn-success' : 'btn-secondary'} hover-lift`} onClick={() => { handleConfirmSave(); }}>
                  {isSaved ? <><Check className="icon-sm" /> <span>Saved to Gallery</span></> : <><Save className="icon-sm" /> <span>Save to Gallery</span></>}
                </button>
                <button className="btn btn-primary shadow-glow" onClick={handleDownloadImage}>
                  <Download className="icon-sm" /> <span>Download PNG</span>
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
                        triggerConfetti();
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
          <div className="canvas-wrapper">
            {/* Floating Context Toolbar whenever dock container is folded */}
            <AnimatePresence>
              {((activeCaption || activeSticker || activeImageLayer) || (isMobileTabsFolded && !activeCaption && !activeSticker && !activeImageLayer)) && isMobileTabsFolded && (
                <motion.div
                  className={`editor-floating-toolbar video-context-toolbar`}
                  initial={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0, marginTop: 0, marginBottom: 0, overflow: 'hidden' }}
                  animate={{ opacity: 1, height: 46, paddingTop: 5, paddingBottom: 0, marginTop: 2, marginBottom: 0 }}
                  exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0, marginTop: 0, marginBottom: 0, overflow: 'hidden' }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                  {/* Text controls */}
                  {activeCaption && showFontMenu && (
                    <>
                      <button onClick={() => setShowFontMenu(false)} className="btn btn-icon btn-xs vid-ctx-btn" >
                        <ArrowLeft style={{ width: 14, height: 14 }} />
                      </button>
                      <div className="vid-ctx-divider"  />
                      {FONTS.map(f => (
                        <button
                          key={f.id || f.family}
                          id={`font-item-${f.family.replace(/\\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '')}`}
                          className={`btn btn-xs vid-ctx-btn ${activeCaption.fontFamily === f.family ? 'active' : ''}`}
                          style={{
                            fontFamily: f.family,
                            whiteSpace: 'nowrap'
                          }}
                          onClick={() => {
                            updateActiveCaption('fontFamily', f.family);
                            setShowFontMenu(false);
                          }}
                        >
                          {f.name.split(' ')[0]}
                        </button>
                      ))}
                    </>
                  )}
                  {activeCaption && showOpacityMenu && (
                    <>
                      <button onClick={() => setShowOpacityMenu(false)} className="btn btn-icon btn-xs vid-ctx-btn" >
                        <ArrowLeft style={{ width: 16, height: 16 }} />
                      </button>
                      <div className="vid-ctx-divider"  />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 8px', width: '160px' }}>
                        <Droplet style={{ width: 14, height: 14, color: '#fff', flexShrink: 0 }} />
                        <input
                          type="range"
                          className="range range-xs"
                          min="0"
                          max="1"
                          step="0.05"
                          value={activeCaption.opacity !== undefined ? activeCaption.opacity : 1}
                          onChange={(e) => updateActiveCaptionProps({ opacity: parseFloat(e.target.value) })}
                          title="Text Opacity"
                          style={{ '--range-shdw': 'var(--primary-gradient)' }}
                        />
                        <span style={{ fontSize: '11px', fontWeight: 600, minWidth: '30px', textAlign: 'right' }}>
                          {Math.round((activeCaption.opacity !== undefined ? Number(activeCaption.opacity) : 1) * 100)}%
                        </span>
                      </div>
                    </>
                  )}
                  {activeCaption && !showFontMenu && !showOpacityMenu && (
                    <>
                      <button
                        className="btn btn-xs vid-ctx-btn vid-ctx-btn-font"
                        title="Change Font"
                        onClick={() => setShowFontMenu(true)}
                      >
                        <Type className="vid-font-icon" style={{ width: 16, height: 16 }} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff' }}>{(activeCaption.fontFamily || 'Anton').split(/[\s,]+/)[0].replace(/['"]/g, '')}</span>
                      </button>

                      <div
                        className="btn btn-xs vid-ctx-btn"
                        style={{
                          position: 'relative',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        title="Text Color"
                      >
                        <div
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: '50%',
                            background: activeCaption.color || '#fff',
                            border: '2px solid rgba(255,255,255,0.4)',
                          }}
                        />
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff' }}>Color</span>
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

                      <button
                        className={`btn btn-xs vid-ctx-btn ${activeCaption.bgColor && activeCaption.bgColor !== 'none' && activeCaption.bgColor !== 'transparent' ? 'active' : ''}`}
                        title="Toggle Background"
                        onClick={() => {
                          if (!activeCaption.bgColor || activeCaption.bgColor === 'none') {
                            handleSetCaptionBg('white');
                          } else if (activeCaption.bgColor === 'white') {
                            handleSetCaptionBg('black');
                          } else {
                            handleSetCaptionBg('none');
                          }
                        }}
                      >
                        BG
                      </button>

                      <button
                        className="btn btn-xs vid-ctx-btn"
                        title="Text Opacity"
                        onClick={() => setShowOpacityMenu(true)}
                        style={{ padding: '0 8px', fontSize: '11px', fontWeight: 600, flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Droplet style={{ width: 12, height: 12 }} /> Blur
                      </button>
                      
                    </>
                  )}

                  {/* Sticker / Emoji controls */}
                  {activeSticker && (
                    <>
                    <button
                      className="btn btn-icon btn-xs vid-ctx-btn"
                      title="Rotate 90°"
                      onClick={handleRotateSticker}
                    >
                      <RotateCw style={{ width: 14, height: 14 }} />
                      </button>
                      
                    </>
                  )}

                  {/* Image controls */}
                  {activeImageLayer && !showImageFilterMenu && (
                    <>
                      <button
                        className="btn btn-xs vid-ctx-btn"
                        title="Filters"
                        onClick={() => setShowImageFilterMenu(true)}
                        style={{ padding: '0 8px', fontSize: '11px', fontWeight: 600, flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Sparkles style={{ width: 14, height: 14 }} /> Filters
                      </button>
                      <button
                        className="btn btn-xs vid-ctx-btn"
                        title="Magic Eraser (Remove Background)"
                        onClick={handleRemoveBackground}
                        disabled={isRemovingBg}
                        style={{ padding: '0 8px', fontSize: '11px', fontWeight: 600, flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px', background: isRemovingBg ? 'rgba(255,255,255,0.1)' : 'var(--primary-gradient)', color: '#fff', border: 'none' }}
                      >
                        <Wand2 style={{ width: 14, height: 14 }} className={isRemovingBg ? "spin" : ""} /> {activeImageLayer?.originalUrl ? 'Undo BG' : 'BG Eraser'}
                      </button>
                      <button
                        className={`btn btn-xs vid-ctx-btn ${activeImageLayer.fitMode === 'crop' ? 'active' : ''}`}
                        title="Crop"
                        onClick={() => updateActiveImageLayer('fitMode', activeImageLayer.fitMode === 'crop' ? 'fit' : 'crop')}
                      >
                        <Crop style={{ width: 14, height: 14 }} /> Crop
                      </button>

                      
                      <button
                        className="btn btn-icon btn-xs vid-ctx-btn"
                        title="Duplicate"
                        onClick={handleDuplicateLayer}
                      >
                        <Copy style={{ width: 14, height: 14 }} />
                      </button>
                      <div className="vid-ctx-divider"  />
                      <button
                        className={`btn btn-icon btn-xs vid-ctx-btn ${showLayerMenu ? 'active' : ''}`}
                        title="Layer Management"
                        onClick={() => setShowLayerMenu(!showLayerMenu)}
                      >
                        <Layers style={{ width: 14, height: 14 }} />
                      </button>
                      
                      {showLayerMenu && (
                        <div style={{ display: 'flex' }}>
                          <button
                            className="btn btn-icon btn-xs vid-ctx-btn"
                            title="Bring Forward"
                            onClick={() => handleZIndex(1)}
                            style={{ marginRight: '2px' }}
                          >
                            <ArrowUp style={{ width: 14, height: 14 }} />
                          </button>
                          <button
                            className="btn btn-icon btn-xs vid-ctx-btn"
                            title="Send Backward"
                            onClick={() => handleZIndex(-1)}
                          >
                            <ArrowDown style={{ width: 14, height: 14 }} />
                          </button>
                        </div>
                      )}
                      <button
                        className="btn btn-icon btn-xs vid-ctx-btn vid-ctx-btn-delete"
                        style={{ background: 'rgba(239, 68, 68, 0.85)', color: '#ffffff', border: '1px solid rgba(239, 68, 68, 1)' }}
                        title="Delete"
                        onClick={handleDeleteLayer}
                      >
                        <Trash2 style={{ width: 14, height: 14 }} />
                      </button>
                    </>
                  )}

                  {/* Shared Duplicate / Delete */}
                  {((activeCaption && !showFontMenu && !showOpacityMenu) || activeSticker) && (
                    <>
                      <button
                        className="btn btn-icon btn-xs vid-ctx-btn"
                        title="Duplicate"
                        onClick={handleDuplicateLayer}
                      >
                        <Copy style={{ width: 14, height: 14 }} />
                      </button>
                      <div className="vid-ctx-divider"  />
                      <button
                        className={`btn btn-icon btn-xs vid-ctx-btn ${showLayerMenu ? 'active' : ''}`}
                        title="Layer Management"
                        onClick={() => setShowLayerMenu(!showLayerMenu)}
                      >
                        <Layers style={{ width: 14, height: 14 }} />
                      </button>
                      
                      {showLayerMenu && (
                        <div style={{ display: 'flex' }}>
                          <button
                            className="btn btn-icon btn-xs vid-ctx-btn"
                            title="Bring Forward"
                            onClick={() => handleZIndex(1)}
                            style={{ marginRight: '2px' }}
                          >
                            <ArrowUp style={{ width: 14, height: 14 }} />
                          </button>
                          <button
                            className="btn btn-icon btn-xs vid-ctx-btn"
                            title="Send Backward"
                            onClick={() => handleZIndex(-1)}
                          >
                            <ArrowDown style={{ width: 14, height: 14 }} />
                          </button>
                        </div>
                      )}
                      <button
                        className="btn btn-icon btn-xs vid-ctx-btn vid-ctx-btn-delete"
                        style={{ background: 'rgba(239, 68, 68, 0.85)', color: '#ffffff', border: '1px solid rgba(239, 68, 68, 1)' }}
                        title="Delete"
                        onClick={handleDeleteLayer}
                      >
                        <Trash2 style={{ width: 14, height: 14 }} />
                      </button>
                    </>
                  )}

                  {/* TAB SPECIFIC TOOLS (when nothing selected) */}
                  {!showQuickPhrasesMenu && !(activeCaption || activeSticker || activeImageLayer) && activeTab === "text" && (
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <button
                        className="btn btn-xs vid-ctx-btn"
                        onClick={handleAddCaption}
                        style={{ padding: "4px 8px", fontSize: "0.75rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}
                      >
                        <Plus style={{ width: 14, height: 14 }} /> Add Text
                      </button>
                      
                      <div className="vid-ctx-divider"  />

                      <button
                        className="btn btn-xs vid-ctx-btn"
                        onClick={() => setShowQuickPhrasesMenu(true)}
                        style={{ padding: "4px 8px", fontSize: "0.75rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}
                      >
                        <Quote style={{ width: 14, height: 14 }} /> Quick Phrases
                      </button>
                    </div>
                  )}
                  {showQuickPhrasesMenu && !(activeCaption || activeSticker || activeImageLayer) && activeTab === "text" && (
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", width: "100%", overflowX: "auto", paddingBottom: "4px", scrollbarWidth: "none" }}>
                      <button onClick={() => setShowQuickPhrasesMenu(false)} className="btn btn-icon btn-xs vid-ctx-btn" >
                        <ArrowLeft style={{ width: 14, height: 14 }} />
                      </button>
                      <div className="vid-ctx-divider"  />
                      {PRESET_PHRASES.map(phrase => (
                        <button
                          key={phrase}
                          className="btn btn-xs vid-ctx-btn"
                          onClick={() => { handleAddPresetPhrase(phrase); setShowQuickPhrasesMenu(false); }}
                          style={{ flexShrink: 0, padding: "4px 10px", fontSize: "0.75rem", fontWeight: 600, whiteSpace: "nowrap", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.1)" }}
                        >
                          {phrase}
                        </button>
                      ))}
                    </div>
                  )}
                  {!(activeCaption || activeSticker || activeImageLayer) && activeTab === 'images' && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', width: '100%', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
                      <label
                        className="btn btn-xs vid-ctx-btn"
                        style={{ flexShrink: 0, padding: '4px 8px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', margin: 0 }}
                      >
                        <Upload style={{ width: 14, height: 14 }} /> Upload
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
                        style={{ flexShrink: 0, padding: '4px 8px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <LayoutGrid style={{ width: 14, height: 14 }} /> Template
                      </button>
                      <div className="vid-ctx-divider" style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.2)', margin: '0 4px', flexShrink: 0 }} />
                      <button
                        className="btn btn-icon btn-xs vid-ctx-btn"
                        onClick={() => setShowMemeStickersModal(true)}
                        title="Add Sticker"
                      >
                        <Sticker style={{ width: 16, height: 16 }} />
                      </button>
                      <button
                        className="btn btn-icon btn-xs vid-ctx-btn"
                        onClick={() => setShowEmojiModal(true)}
                        title="Add Emoji"
                      >
                        <Smile style={{ width: 16, height: 16 }} />
                      </button>
                    </div>
                  )}

                  {!(activeCaption || activeSticker || activeImageLayer) && activeTab === 'draw' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%' }}>
                      <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: '999px', padding: '2px', gap: '2px', flexShrink: 0 }}>
                        <button
                          className={`btn btn-icon btn-xs vid-ctx-btn ${drawTool === 'brush' ? 'active' : ''}`}
                          onClick={() => setDrawTool('brush')}
                          style={{ margin: 0, border: 'none', background: drawTool === 'brush' ? 'var(--primary-gradient)' : 'transparent' }}
                          title="Brush"
                        >
                          <Paintbrush style={{ width: 16, height: 16 }} />
                        </button>
                        <button
                          className={`btn btn-icon btn-xs vid-ctx-btn ${drawTool === 'eraser' ? 'active' : ''}`}
                          onClick={() => setDrawTool('eraser')}
                          style={{ margin: 0, border: 'none', background: drawTool === 'eraser' ? 'var(--primary-gradient)' : 'transparent' }}
                          title="Eraser"
                        >
                          <Eraser style={{ width: 16, height: 16 }} />
                        </button>
                      </div>
                      
                      <div className="vid-ctx-divider" style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.2)', margin: '0 4px', flexShrink: 0 }} />

                      {drawTool !== 'eraser' && (
                        <div
                          className="btn btn-icon btn-xs vid-ctx-btn"
                          style={{
                            position: 'relative',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title="Brush Color"
                        >
                          <div
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              background: brushColor || '#fff',
                              border: '2px solid rgba(255,255,255,0.4)',
                            }}
                          />
                          <input 
                            type="color" 
                            value={brushColor} 
                            onChange={(e) => setBrushColor(e.target.value)} 
                            style={{ position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer', width: '100%', height: '100%' }} 
                          />
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, margin: '0 4px', minWidth: 60 }}>
                        {drawTool !== 'eraser' && (
                          <div style={{ width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <div style={{ width: `${Math.max(2, (brushSize / 50) * 14)}px`, height: `${Math.max(2, (brushSize / 50) * 14)}px`, borderRadius: '50%', background: brushColor, transition: 'all 0.1s' }} />
                          </div>
                        )}
                        <input 
                          type="range" 
                          min="1" max="50" 
                          value={brushSize} 
                          onChange={(e) => setBrushSize(parseInt(e.target.value))}
                          style={{ width: '100%', minWidth: '40px' }}
                        />
                      </div>
                      
                      <div className="vid-ctx-divider" style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.2)', margin: '0 4px', flexShrink: 0 }} />
                      <button
                        className="btn btn-icon btn-xs vid-ctx-btn vid-ctx-btn-delete"
                        onClick={() => setDrawings([])}
                        title="Clear Drawing"
                        style={{ flexShrink: 0 }}
                      >
                        <Trash2 style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  )}

                  {!(activeCaption || activeSticker || activeImageLayer) && activeTab === 'watermark' && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', width: '100%', flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: '2px', scrollbarWidth: 'none' }}>
                      {!showWatermarkMenu ? (
                        <>
                          <CanvasColorPicker canvasBgColor={canvasBgColor} setCanvasBgColor={setCanvasBgColor} />

                          <div className="vid-ctx-divider"  />
                          
                          <button
                            className="btn btn-xs vid-ctx-btn"
                            onClick={() => {
                                setShowWatermarkMenu(true);
                                if (!watermark?.enabled) updateWatermark('enabled', true);
                            }}
                            style={{ padding: '4px 8px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Droplet style={{ width: 14, height: 14 }} /> Watermark
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => setShowWatermarkMenu(false)} className="btn btn-icon btn-xs vid-ctx-btn" >
                            <ArrowLeft style={{ width: 16, height: 16 }} />
                          </button>
                          <div className="vid-ctx-divider"  />
                          
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
                            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '0 16px', borderRadius: '999px', fontSize: '0.85rem', width: '105px', outline: 'none', height: '40px', boxSizing: 'border-box' }}
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
                            <Type style={{ width: 16, height: 16, transform: `scale(${(watermark?.size || 24) / 24})`, transition: 'transform 0.2s' }} />
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
                            <Blend style={{ width: 16, height: 16, opacity: watermark?.opacity || 0.5, transition: 'opacity 0.2s' }} />
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
                                width: 16, 
                                height: 16, 
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
                        </>
                      )}
                    </div>
                  )}

                  {((!activeCaption && !activeSticker && activeTab === 'filters') || (activeImageLayer && showImageFilterMenu)) && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '6px', width: '100%', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>

                      {activeImageLayer && showImageFilterMenu && (
                        <>
                          <button onClick={() => setShowImageFilterMenu(false)} className="btn btn-icon btn-xs vid-ctx-btn" >
                            <ArrowLeft style={{ width: 16, height: 16 }} />
                          </button>
                          <div className="vid-ctx-divider"  />
                        </>
                      )}

                      {!activeImageLayer && activeTab === 'filters' && (
                        <>
                          <button
                            className="btn btn-xs vid-ctx-btn"
                            title={imageFilters.filterScope === 'background' ? "Filter Canvas Only" : "Filter Entire Meme (Canvas + Elements)"}
                            onClick={() => {
                              setImageFilters(prev => ({
                                ...prev,
                                filterScope: prev.filterScope === 'background' ? 'all' : 'background'
                              }));
                            }}
                            style={{
                              flexShrink: 0,
                              padding: '5px 12px',
                              borderRadius: '20px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: imageFilters.filterScope === 'background' ? 'rgba(255, 255, 255, 0.08)' : 'var(--primary-gradient)',
                              color: '#fff',
                              border: imageFilters.filterScope === 'background' ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(249, 115, 22, 0.5)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <Layers style={{ width: 13, height: 13 }} />
                            <span>{imageFilters.filterScope === 'background' ? 'Canvas Only' : 'All Elements'}</span>
                          </button>
                          <div className="vid-ctx-divider" />
                        </>
                      )}

                      {(() => {
                        let previewImage = 'https://images.unsplash.com/photo-1555685812-4b943f1cb0eb?w=100&q=80'; // fallback
                        if (activeImageLayer) {
                          previewImage = activeImageLayer.originalUrl || activeImageLayer.url || activeImageLayer.src || previewImage;
                        } else if (imageLayers && imageLayers.length > 0) {
                          previewImage = imageLayers[0].originalUrl || imageLayers[0].url || imageLayers[0].src || previewImage;
                        }

                        return PHOTO_FILTERS.map((filterItem) => {
                          const isFilterActive = activeImageLayer 
                            ? (activeImageLayer.filterId || 'original') === filterItem.id
                            : (imageFilters.preset || 'original') === filterItem.id;
                          return (
                            <button
                              key={filterItem.id}
                              id={`filter-item-${filterItem.id}`}
                              className={`btn btn-xs vid-ctx-btn ${isFilterActive ? 'active' : ''}`}
                              onClick={() => {
                                if (activeImageLayer) {
                                  updateActiveImageLayer({
                                    filterId: filterItem.id,
                                    filter: filterItem.filterString,
                                    filters: filterItem.values
                                  });
                                  setShowImageFilterMenu(false);
                                } else {
                                  setImageFilters(prev => ({
                                    ...prev,
                                    preset: filterItem.id,
                                    filterString: filterItem.filterString,
                                    ...filterItem.values
                                  }));
                                }
                              }}
                              style={{ 
                                flexShrink: 0, 
                                padding: '4px 10px 4px 4px', 
                                borderRadius: '20px',
                                background: isFilterActive ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.05)', 
                                border: isFilterActive ? '1px solid rgba(249, 115, 22, 0.5)' : '1px solid rgba(255,255,255,0.1)',
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: '8px',
                                width: 'auto',
                                overflow: 'hidden'
                              }}
                            >
                              <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                backgroundImage: `url(${previewImage})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                filter: filterItem.filterString,
                                flexShrink: 0
                              }} />
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>
                                {filterItem.name}
                              </span>
                            </button>
                          );
                        });
                      })()}
                    </div>
                  )}

                </motion.div>
              )}
            </AnimatePresence>


            

            <CanvasEditor
              ref={canvasRef}
              template={activeTemplate}
              imageUrl={activeTemplate?.rawImageUrl || activeTemplate?.imageUrl}
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
              canvasBgColor={canvasBgColor}
            drawings={drawings}
            onAddDrawing={handleAddDrawing}
            isDrawingMode={activeTab === 'draw' && Boolean(drawTool)}
            drawTool={drawTool}
            brushColor={brushColor}
            brushSize={brushSize}
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
              <Sparkles className="icon-xs" /> <span>Filters</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'watermark' ? 'active' : ''}`}
              onClick={() => handleTabClick('watermark')}
            >
              <LayoutGrid className="icon-xs" /> <span>Canvas</span>
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
                <div style={{ marginBottom: '16px', display: drawTool ? 'block' : 'none' }}>
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
                <div style={{ display: drawTool === 'brush' ? 'block' : 'none' }}>
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
                {!showQuickPhrasesMenu ? (
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
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

                    {/* Quick Phrases Button */}
                    <button type="button" className="btn btn-xs btn-secondary hover-lift" onClick={() => setShowQuickPhrasesMenu(true)} style={{ padding: "7px 14px", borderRadius: "20px", fontSize: "0.82rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <Quote size={15} /> Quick Phrases
                    </button>
                  </div>
                ) : (
                  <div className="animate-fade-in" style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "4px", scrollbarWidth: "none", width: "100%", alignItems: "center" }}>
                    <button type="button" className="btn btn-icon btn-xs btn-secondary hover-lift" onClick={() => setShowQuickPhrasesMenu(false)} style={{ flexShrink: 0, borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <ArrowLeft size={16} />
                    </button>
                    <div  />
                    {PRESET_PHRASES.map(phrase => (
                      <button
                        key={phrase}
                        type="button"
                        className="btn btn-xs btn-secondary hover-lift"
                        onClick={() => { handleAddPresetPhrase(phrase); setShowQuickPhrasesMenu(false); }}
                        style={{ flexShrink: 0, padding: "6px 12px", fontSize: "0.78rem", borderRadius: "14px", whiteSpace: "nowrap", fontWeight: 600 }}
                      >
                        {phrase}
                      </button>
                    ))}
                  </div>
                )}

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
                        background: 'rgba(239, 68, 68, 0.85)',
                        border: '1px solid rgba(239, 68, 68, 1)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginRight: '8px'
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
                          padding: 0,
                          borderRadius: '10px',
                          background: 'transparent',
                          border: 'none',
                          gap: '6px',
                          boxSizing: 'border-box'
                        }}
                      >
                        <button
                          type="button"
                          className={`btn btn-xs flex-1 ${(!activeCaption.bgColor || activeCaption.bgColor === 'transparent' || activeCaption.bgColor === 'none') ? 'btn-primary' : 'btn-ghost'}`}
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            borderRadius: '999px',
                            padding: '0 4px',
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
                          className={`btn btn-xs flex-1 ${(activeCaption.bgColor === 'white' || activeCaption.bgColor === '#ffffff') ? 'btn-primary' : 'btn-ghost'}`}
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            borderRadius: '999px',
                            padding: '0 4px',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            background: (activeCaption.bgColor === 'white' || activeCaption.bgColor === '#ffffff') ? undefined : 'var(--bg-surface-1)',
                            border: 'none'
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
                            borderRadius: '999px',
                            padding: '0 4px',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            background: (activeCaption.bgColor === 'black' || activeCaption.bgColor === '#000000') ? undefined : 'var(--bg-surface-1)',
                            border: 'none'
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
                      className="btn btn-icon btn-xs text-danger hover-lift"
                      onClick={handleDeleteLayer}
                      title="Delete Media Layer"
                      style={{ flexShrink: 0, background: 'rgba(239, 68, 68, 0.85)', color: '#ffffff', border: '1px solid rgba(239, 68, 68, 1)' }}
                    >
                      <Trash2 className="icon-xs" />
                    </button>
                  )}
                </div>
                
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
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', overflowY: 'auto', padding: '4px', alignContent: 'start', overscrollBehavior: 'contain', height: '100%' }}>
                {STICKERS.filter(s => {
                  if (emojiSearchQuery.trim()) {
                    const q = emojiSearchQuery.toLowerCase();
                    return s.id.toLowerCase().includes(q) || (s.name && s.name.toLowerCase().includes(q)) || s.emoji.includes(q);
                  }
                  return s.category === activeStickerCategory;
                }).map(s => (
                  <button 
                    key={s.id} 
                    className="hover-lift"
                    title={s.name}
                    onClick={() => handleAddSticker(s)}
                    style={{ background: 'none', border: 'none', fontSize: '2.2rem', cursor: 'pointer', padding: '4px', textAlign: 'center', transition: 'transform 0.15s' }}
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
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <ImageIcon size={20} style={{ color: 'var(--cyber-cyan)' }} />
                <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.05rem', fontWeight: 600 }}>
                  Add Template
                </h3>
              </div>
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
                      if (pickingTemplateRef.current) return;
                      pickingTemplateRef.current = true;
                      setTimeout(() => { pickingTemplateRef.current = false; }, 400);

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
