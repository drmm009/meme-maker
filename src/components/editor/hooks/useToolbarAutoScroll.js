import { useEffect, useRef } from 'react';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';

const scrollToCenter = (el) => el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

// Keeps the relevant item in view in the horizontally scrolling toolbars: the bubble layouts
// from the start, the last used setting, the current font and the current filter. Returns the
// ref for the layer toolbar (ContextToolbar).
export function useToolbarAutoScroll({ activeCaption, activeSticker, activeImageLayer }) {
  const contextToolbarRef = useRef(null);
  const activeTab = useEditorUiStore((s) => s.activeTab);
  const showFontMenu = useEditorUiStore((s) => s.showFontMenu);
  const showTextEffectsMenu = useEditorUiStore((s) => s.showTextEffectsMenu);
  const showTextBlurMenu = useEditorUiStore((s) => s.showTextBlurMenu);
  const showTextBgMenu = useEditorUiStore((s) => s.showTextBgMenu);
  const showBubbleLayouts = useEditorUiStore((s) => s.showBubbleLayouts);
  const lastUsedSettingButton = useEditorUiStore((s) => s.lastUsedSettingButton);
  const filterPreset = useMemeEditorStore((s) => s.imageFilters.preset);

  useEffect(() => {
    if (showBubbleLayouts && contextToolbarRef.current) {
      contextToolbarRef.current.scrollLeft = 0;
    }
  }, [showBubbleLayouts]);

  // Back on the text toolbar (no submenu open), bring the last used setting button into view.
  useEffect(() => {
    if (lastUsedSettingButton && !showFontMenu && !showTextEffectsMenu && !showTextBlurMenu && !showTextBgMenu && !showBubbleLayouts) {
      const timer = setTimeout(() => {
        scrollToCenter(contextToolbarRef.current?.querySelector(`[data-setting-btn="${lastUsedSettingButton}"]`));
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [lastUsedSettingButton, showFontMenu, showTextEffectsMenu, showTextBlurMenu, showTextBgMenu, showBubbleLayouts]);

  const fontFamily = activeCaption?.fontFamily;
  useEffect(() => {
    if (showFontMenu && fontFamily) {
      setTimeout(() => {
        scrollToCenter(document.getElementById('font-item-' + fontFamily.replace(/\\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '')));
      }, 50);
    }
  }, [showFontMenu, fontFamily]);

  useEffect(() => {
    if (!activeCaption && !activeSticker && activeTab === 'filters') {
      const timer = setTimeout(() => {
        const activeFilterId = activeImageLayer ? (activeImageLayer.filterId || 'original') : (filterPreset || 'original');
        scrollToCenter(document.getElementById('filter-item-' + activeFilterId));
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activeTab, activeCaption, activeSticker, activeImageLayer, filterPreset]);

  return contextToolbarRef;
}
