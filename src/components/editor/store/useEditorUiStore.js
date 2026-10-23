import { createContext, useContext } from 'react';
import { createStore, useStore } from 'zustand';
import { MEME_TEMPLATES } from '../../../data/templates';
import { safeGet, safeSet } from '../../../utils/storage';
import { isSocialCardCaption } from '../memeEditorUtils';

// UI state shared across the editor's panels: which tab, submenu, menu or
// modal is open, drawing tool settings, the watermark. One store per editor.
// The meme itself lives in useMemeEditorStore; nothing here is undoable.

const WATERMARK_KEY = 'meme-maker-watermark';

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
    activeSubmenu: null, // 'font' | 'color' | 'align' | 'effects' | 'bg' | 'blur' | 'bubble' | 'tweetTheme' | 'tweetTrend' | 'drawSettings' | 'watermark' | 'canvasBg' | 'banner' | 'filters'
    lastUsedSettingButton: null,
    isMobileTabsFolded: true,
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
    showMemeStickersModal: false,
    showEmojiModal: false,
    showFiltersModal: false,
    showBubbleBottomSheet: false,
    showAiModal: false,
    imagePickerTarget: null, // 'layer' | 'replaceTemplate' | { slot: idx }
    openSourceTemplates: MEME_TEMPLATES,
    pendingVideoLayer: null,
    pasteToast: false,
    drawTool: null, // 'brush' | 'marker' | 'glow' | null
    brushColor: '#ff2a5f',
    brushSize: 10,
    watermark: loadWatermark(),
  };
}

const UI_FIELDS = Object.keys(buildInitialUi(null));

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
  }));

  // Keep the watermark settings across sessions.
  store.subscribe((state, prev) => {
    if (state.watermark !== prev.watermark) safeSet(WATERMARK_KEY, state.watermark);
  });

  return store;
}

export const EditorUiStoreContext = createContext(null);

export function useEditorUiStore(selector) {
  const store = useContext(EditorUiStoreContext);
  if (!store) throw new Error('useEditorUiStore must be used inside EditorUiStoreContext');
  return useStore(store, selector);
}
