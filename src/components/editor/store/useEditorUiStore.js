import { createContext, useContext } from 'react';
import { createStore, useStore } from 'zustand';
import { MEME_TEMPLATES } from '../../../data/templates';
import { safeGet, safeSet } from '../../../utils/storage';
import { isSocialCardCaption } from '../memeEditorUtils';

// UI state shared across the editor's panels: which tab, submenu, menu or
// modal is open, drawing tool settings, the watermark. One store per editor.
// The meme itself lives in useMemeEditorStore; nothing here is undoable.

const WATERMARK_KEY = 'meme-maker-watermark';
const EXPORT_PREFS_KEY = 'meme-maker-export-prefs';
const DEFAULT_EXPORT_PREFS = { format: 'png', quality: 0.9, width: 'full', transparent: false };

const DEFAULT_WATERMARK = {
  enabled: false,
  text: '',
  imageUrl: null,
  position: 'bottom-right', // 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  opacity: 0.5,
  size: 24,
  color: '#ffffff'
};

function loadWatermark() {
  const parsed = safeGet(WATERMARK_KEY, null);
  if (parsed && typeof parsed === 'object') {
    if (parsed.text === '@username') parsed.text = '';
    return parsed;
  }
  return { ...DEFAULT_WATERMARK };
}

function loadExportPrefs() {
  const saved = safeGet(EXPORT_PREFS_KEY, null);
  return saved && typeof saved === 'object' ? { ...DEFAULT_EXPORT_PREFS, ...saved } : { ...DEFAULT_EXPORT_PREFS };
}

function initialSocialModalPlatform(template) {
  const socialCap = template?.defaultCaptions?.find((c) => isSocialCardCaption(c));
  if (socialCap?.isInstagramCard) return 'instagram';
  if (socialCap?.isWhatsAppCard) return 'whatsapp';
  if (socialCap?.isTweetCard) return 'tweet';
  if (template?.id?.includes('instagram')) return 'instagram';
  if (template?.id?.includes('whatsapp')) return 'whatsapp';
  return 'tweet';
}

export function buildInitialUi(template) {
  return {
    activeTab: 'text', // 'text' | 'images' | 'draw' | 'canvas' | 'watermark' | 'filters'
    sheet: null, // the open bottom sheet: 'text' | 'media' | 'draw' | 'canvasColor' | 'watermark' | 'filters' | null
    dockTab: null, // the dock tab whose tool strip shows: 'draw' | 'media' | 'text' | 'fx' | 'canvas' | null
    sheetFocus: null, // what part of the sheet to show: a Text part (TEXT_PARTS) alone, 'size' to scroll the Media sheet to, or null
    activeSubmenu: null, // 'font' | 'color' | 'align' | 'effects' | 'bg' | 'blur' | 'bubble' | 'tweetTheme' | 'tweetTrend' | 'drawSettings' | 'watermark' | 'canvasBg' | 'banner' | 'filters'
    lastUsedSettingButton: null,
    showFontMenu: false,
    showTextEffectsMenu: false,
    showTextBlurMenu: false,
    showTextBgMenu: false,
    showFilterPresets: false,
    showLayerMenu: false,
    showBubbleLayouts: false,
    showStylesModal: Boolean(
      template && (
        template.category === 'social' ||
        template.isSocialTemplate ||
        (template.defaultCaptions && template.defaultCaptions.some((c) => isSocialCardCaption(c)))
      )
    ),
    socialModalPlatform: initialSocialModalPlatform(template),
    showFiltersModal: false,
    showAiModal: false,
    openSourceTemplates: MEME_TEMPLATES,
    pendingVideoLayer: null,
    showPhotoCrop: false, // the main photo's cropper (editor/crop)
    pasteToast: false, // false, or { text, error } shown over the canvas for a moment
    drawTool: null, // 'brush' | 'highlighter' | 'glow' | 'shape' | 'censor' | null
    shapeKind: 'arrow', // 'arrow' | 'ellipse' | 'rect' | 'line'
    shapeFill: false,
    censorMode: 'blur', // 'blur' | 'pixelate' | 'bar'
    censorStrength: 14,
    brushColor: '#ff2a5f',
    brushSize: 10,
    watermark: loadWatermark(),
    customFonts: [], // fonts the person uploaded: [{ family, css }] (utils/customFonts)
    exportPrefs: loadExportPrefs(), // { format: 'png' | 'jpeg' | 'webp', quality: 0.5..1, width: 'full' | 720 | 480 }
    libraryTab: 'history', // 'history' | 'saved' | 'shortcuts'
  };
}

const UI_FIELDS = Object.keys(buildInitialUi(null));

// The dock tab each sheet belongs to: its strip shows above the sheet.
// null: no strip (Export). Sheets not listed (Layers) keep the strip that shows.
const SHEET_TAB = { text: 'text', media: 'media', draw: 'draw', canvasColor: 'canvas', watermark: 'canvas', filters: 'fx', export: null, library: null, mediaLink: 'media', templates: 'media', stickers: 'media', gifs: 'media', emoji: 'media', bubble: 'text' };

// useState-style setter: accepts a value or an updater function.
const fieldSetter = (set, key) => (valueOrUpdater) =>
  set((state) => ({
    [key]: typeof valueOrUpdater === 'function' ? valueOrUpdater(state[key]) : valueOrUpdater
  }));

const setterName = (key) => 'set' + key[0].toUpperCase() + key.slice(1);

export function createEditorUiStore(template) {
  const store = createStore((set) => ({
    ...buildInitialUi(template),
    ...Object.fromEntries(UI_FIELDS.map((key) => [setterName(key), fieldSetter(set, key)])),

    toggleSubmenu: (menuName) => set((state) => ({
      activeSubmenu: state.activeSubmenu === menuName ? null : menuName,
      lastUsedSettingButton: menuName,
    })),

    updateWatermark: (key, value) => set((state) => ({ watermark: { ...state.watermark, [key]: value } })),

    // Every sheet belongs to a dock tab, and opens under that tab's tool strip (scrolled to
    // `focus`). Opening a sheet of another tab stops drawing.
    openSheet: (sheet, focus = null) => set((state) => {
      const tab = sheet in SHEET_TAB ? SHEET_TAB[sheet] : state.dockTab;
      return {
        sheet,
        sheetFocus: focus,
        activeSubmenu: null,
        dockTab: tab,
        drawTool: tab === 'draw' ? state.drawTool : null,
        activeTab: tab === 'draw' ? 'draw' : state.activeTab === 'draw' ? 'text' : state.activeTab,
      };
    }),
    // Closing a sheet keeps its strip (and drawing, after the brush settings).
    closeSheet: () => set({ sheet: null, sheetFocus: null }),

    // A dock tab shows its strip above the dock; tapping it again (leaveDock) closes the strip and
    // its sheet and stops drawing.
    showDockTab: (tab) => set((state) => ({
      dockTab: tab,
      sheet: null,
      sheetFocus: null,
      drawTool: null,
      activeTab: tab === 'draw' ? 'draw' : state.activeTab === 'draw' ? 'text' : state.activeTab,
    })),
    // Drawing: picking a brush turns drawing on and opens its settings (colour, size, clear);
    // closing them keeps drawing; leaving the Draw tab stops it.
    pickDrawTool: (tool) => set({ dockTab: 'draw', drawTool: tool, sheet: 'draw', sheetFocus: null, activeSubmenu: null, activeTab: 'draw' }),
    leaveDock: () => set((state) => ({
      dockTab: null,
      drawTool: null,
      sheet: null,
      sheetFocus: null,
      activeTab: state.activeTab === 'draw' ? 'text' : state.activeTab,
    })),
  }));

  // Keep the watermark settings across sessions.
  store.subscribe((state, prev) => {
    if (state.watermark !== prev.watermark) safeSet(WATERMARK_KEY, state.watermark);
    if (state.exportPrefs !== prev.exportPrefs) safeSet(EXPORT_PREFS_KEY, state.exportPrefs);
  });

  return store;
}

export const EditorUiStoreContext = createContext(null);

export function useEditorUiStore(selector) {
  const store = useContext(EditorUiStoreContext);
  if (!store) throw new Error('useEditorUiStore must be used inside EditorUiStoreContext');
  return useStore(store, selector);
}
