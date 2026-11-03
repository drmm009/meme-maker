import { createContext, useContext } from 'react';
import { createStore, useStore } from 'zustand';
import { MEME_TEMPLATES } from '../../../data/templates';
import { safeGet, safeSet } from '../../../utils/storage';
import { isSocialCardCaption } from '../memeEditorUtils';
import { EDITOR_MODES, editorModeOf } from '../editorModes';
import { stickerExportPrefs } from '../stickerMaker';

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
  const mode = editorModeOf(template);
  const social = Boolean(
    template && (
      template.category === 'social' ||
      template.isSocialTemplate ||
      (template.defaultCaptions && template.defaultCaptions.some((c) => isSocialCardCaption(c)))
    )
  );
  return {
    mode, // the full editor or one focused maker (editor/editorModes.ts): its title and dock tabs
    activeTab: 'text', // 'text' | 'images' | 'draw' | 'canvas' | 'watermark' | 'filters'
    // A social card opens its studio, or in the Social Card maker its Details form.
    // A maker opens on its first step: the card form, or the face swap page until a swap is made.
    sheet: social && mode === 'social' ? 'card' : mode === 'faceswap' && !template?.faceSwap ? 'faceSwap' : null, // the open bottom sheet: 'text' | 'media' | 'draw' | 'canvasColor' | 'watermark' | 'filters' | null
    dockTab: EDITOR_MODES[mode].startTab, // the dock tab whose tool strip shows: 'draw' | 'media' | 'text' | 'fx' | 'canvas' | null
    sheetFromPill: false, // the open sheet came from the layer tools pill, which then stays above it
    sheetFocus: null, // what part of the sheet to show: one Text part's sections (TEXT_PARTS), 'size' to scroll the Media sheet to, or null
    activeSubmenu: null, // 'font' | 'color' | 'align' | 'effects' | 'bg' | 'blur' | 'bubble' | 'tweetTheme' | 'tweetTrend' | 'drawSettings' | 'watermark' | 'canvasBg' | 'banner' | 'filters'
    lastUsedSettingButton: null,
    showFontMenu: false,
    showTextEffectsMenu: false,
    showTextBlurMenu: false,
    showTextBgMenu: false,
    showFilterPresets: false,
    showLayerMenu: false,
    showBubbleLayouts: false,
    showStylesModal: social && mode !== 'social',
    socialModalPlatform: initialSocialModalPlatform(template),
    showFiltersModal: false,
    showAiModal: false,
    openSourceTemplates: MEME_TEMPLATES,
    pendingVideoLayer: null,
    showPhotoCrop: false, // the main photo's cropper (editor/crop)
    cropLayerId: null, // a photo layer open in the same cropper
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
    stickerDieCut: true, // the Stickers maker's Die-cut: a white outline on cut-out photos
    stickerStyle: 'classic', // the Stickers maker's style for the next cut-out (STICKER_STYLES)
    aiIdea: String(template?.aiPrompt || ''), // the AI Meme page's idea and vibe (AI_MEME_CATEGORIES), kept from its template
    aiVibe: String(template?.aiCategory || 'all'),
    // A sticker exports see-through (stickerMaker.ts); only the full editor's choices are remembered.
    exportPrefs: mode === 'sticker' ? stickerExportPrefs(loadExportPrefs()) : loadExportPrefs(), // { format: 'png' | 'jpeg' | 'webp', quality: 0.5..1, width: 'full' | 720 | 480 }
    libraryTab: 'history', // 'history' | 'saved' | 'shortcuts'
  };
}

const UI_FIELDS = Object.keys(buildInitialUi(null));

// The dock tab each sheet belongs to: its strip shows above the sheet.
// null: no strip (Export). Sheets not listed (Layers) keep the strip that shows.
const SHEET_TAB = { text: 'text', media: 'media', draw: 'draw', canvasColor: 'canvas', watermark: 'canvas', header: 'canvas', footer: 'canvas', filters: 'fx', background: 'fx', export: null, library: null, mediaLink: 'media', templates: 'media', memes: 'swap', card: 'card', cardLook: 'card', faceSwap: 'swap', stickers: 'media', gifs: 'media', emoji: 'media', bubble: 'text', diecut: 'media' };

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

    // A focused maker's Full editor: every dock tab, on the same meme (the document store is untouched).
    // A maker's own tab (Sticker, Face Swap) isn't in the full editor's dock: start on its first tab.
    openFullEditor: () => set((state) => ({
      mode: 'full',
      dockTab: EDITOR_MODES.full.dock.includes(state.dockTab) ? state.dockTab : EDITOR_MODES.full.startTab,
    })),

    updateWatermark: (key, value) => set((state) => ({ watermark: { ...state.watermark, [key]: value } })),

    // Every sheet belongs to a dock tab, and opens under that tab's tool strip (scrolled to
    // `focus`), or under the layer tools pill when it came from there. Opening a sheet of another
    // tab stops drawing. A focused maker without that tab (Stickers' Gallery, the Templates sheet)
    // keeps its own.
    openSheet: (sheet, focus = null, fromPill = false) => set((state) => {
      const owner = sheet in SHEET_TAB ? SHEET_TAB[sheet] : state.dockTab;
      const tab = state.mode === 'sticker' ? 'sticker' : (owner && !EDITOR_MODES[state.mode].dock.includes(owner) ? state.dockTab : owner);
      return {
        sheet,
        sheetFocus: focus,
        sheetFromPill: fromPill,
        activeSubmenu: null,
        dockTab: tab,
        drawTool: tab === 'draw' ? state.drawTool : null,
        activeTab: tab === 'draw' ? 'draw' : state.activeTab === 'draw' ? 'text' : state.activeTab,
      };
    }),
    // Closing a sheet keeps its strip (and drawing, after the brush settings).
    closeSheet: () => set((state) => ({
      sheet: null,
      sheetFocus: null,
      sheetFromPill: false,
      dockTab: state.dockTab || (state.mode === 'sticker' ? 'sticker' : null),
    })),

    // A dock tab shows its strip above the dock; tapping it again (leaveDock) closes the strip and
    // its sheet and stops drawing.
    showDockTab: (tab) => set((state) => ({
      dockTab: tab,
      sheet: null,
      sheetFocus: null,
      sheetFromPill: false,
      drawTool: null,
      activeTab: tab === 'draw' ? 'draw' : state.activeTab === 'draw' ? 'text' : state.activeTab,
    })),
    // Drawing: picking a brush turns drawing on and opens its settings (colour, size, clear);
    // closing them keeps drawing; leaving the Draw tab stops it.
    pickDrawTool: (tool) => set((state) => (
      state.drawTool === tool && state.sheet === 'draw'
        ? { sheet: null, sheetFocus: null }
        : { dockTab: 'draw', drawTool: tool, sheet: 'draw', sheetFocus: null, sheetFromPill: false, activeSubmenu: null, activeTab: 'draw' }
    )),
    leaveDock: () => set((state) => ({
      dockTab: null,
      drawTool: null,
      sheet: null,
      sheetFocus: null,
      sheetFromPill: false,
      activeTab: state.activeTab === 'draw' ? 'text' : state.activeTab,
    })),
  }));

  // Keep the watermark settings across sessions.
  store.subscribe((state, prev) => {
    if (state.watermark !== prev.watermark) safeSet(WATERMARK_KEY, state.watermark);
    if (state.exportPrefs !== prev.exportPrefs && state.mode === 'full') safeSet(EXPORT_PREFS_KEY, state.exportPrefs);
  });

  return store;
}

export const EditorUiStoreContext = createContext(null);

export function useEditorUiStore(selector) {
  const store = useContext(EditorUiStoreContext);
  if (!store) throw new Error('useEditorUiStore must be used inside EditorUiStoreContext');
  return useStore(store, selector);
}

// The store itself, for reading the UI state at a moment rather than subscribing to it.
export function useEditorUiStoreApi() {
  const store = useContext(EditorUiStoreContext);
  if (!store) throw new Error('useEditorUiStoreApi must be used inside EditorUiStoreContext');
  return store;
}
