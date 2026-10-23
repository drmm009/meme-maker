// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { createEditorUiStore } from './useEditorUiStore';

describe('createEditorUiStore', () => {
  beforeEach(() => localStorage.clear());

  it('starts on the Text tab with menus closed', () => {
    const s = createEditorUiStore({ id: 't' }).getState();
    expect(s.activeTab).toBe('text');
    expect(s.activeSubmenu).toBeNull();
    expect(s.showStylesModal).toBe(false);
    expect(s.socialModalPlatform).toBe('tweet');
  });

  it('opens the social card studio for social templates', () => {
    const s = createEditorUiStore({ defaultCaptions: [{ id: 'w', isWhatsAppCard: true }] }).getState();
    expect(s.showStylesModal).toBe(true);
    expect(s.socialModalPlatform).toBe('whatsapp');
  });

  it('toggleSubmenu opens, closes and remembers the last button', () => {
    const store = createEditorUiStore(null);
    store.getState().toggleSubmenu('color');
    expect(store.getState()).toMatchObject({ activeSubmenu: 'color', lastUsedSettingButton: 'color' });
    store.getState().toggleSubmenu('color');
    expect(store.getState().activeSubmenu).toBeNull();
    store.getState().toggleSubmenu('font');
    expect(store.getState().activeSubmenu).toBe('font');
  });

  it('saves watermark changes and loads them in the next editor', () => {
    const store = createEditorUiStore(null);
    store.getState().updateWatermark('text', '@me');
    store.getState().updateWatermark('enabled', true);
    expect(JSON.parse(localStorage.getItem('meme-maker-watermark'))).toMatchObject({ text: '@me', enabled: true });
    expect(createEditorUiStore(null).getState().watermark).toMatchObject({ text: '@me', enabled: true });
  });

  it('setters accept a value or an updater', () => {
    const store = createEditorUiStore(null);
    store.getState().setBrushSize(14);
    store.getState().setBrushSize((v) => v + 2);
    expect(store.getState().brushSize).toBe(16);
  });
});
