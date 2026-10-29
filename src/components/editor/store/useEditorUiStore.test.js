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

  it('opens one sheet at a time', () => {
    const store = createEditorUiStore(null);
    store.getState().openSheet('text', 'font');
    expect(store.getState()).toMatchObject({ sheet: 'text', sheetFocus: 'font', drawTool: null });
    store.getState().closeSheet();
    expect(store.getState()).toMatchObject({ sheet: null, sheetFocus: null });
  });

  it('Draw: the strip first, a brush turns drawing on, closing its settings keeps drawing', () => {
    const store = createEditorUiStore(null);
    store.getState().showDockTab('draw');
    expect(store.getState()).toMatchObject({ dockTab: 'draw', drawTool: null, sheet: null });
    store.getState().pickDrawTool('glow');
    expect(store.getState()).toMatchObject({ dockTab: 'draw', drawTool: 'glow', sheet: 'draw', activeTab: 'draw' });
    store.getState().closeSheet();
    expect(store.getState()).toMatchObject({ dockTab: 'draw', drawTool: 'glow', sheet: null });
    store.getState().leaveDock();
    expect(store.getState()).toMatchObject({ dockTab: null, drawTool: null, activeTab: 'text' });
    // Opening another tab's sheet switches to that tab's strip and stops drawing.
    store.getState().pickDrawTool('brush');
    store.getState().openSheet('text');
    expect(store.getState()).toMatchObject({ dockTab: 'text', drawTool: null, sheet: 'text' });
  });

  it('every sheet opens under the strip of its tab; leaving the tab closes both', () => {
    const store = createEditorUiStore(null);
    store.getState().openSheet('filters');
    expect(store.getState()).toMatchObject({ dockTab: 'fx', sheet: 'filters' });
    store.getState().showDockTab('canvas');
    store.getState().openSheet('watermark');
    expect(store.getState()).toMatchObject({ dockTab: 'canvas', sheet: 'watermark', drawTool: null });
    store.getState().closeSheet();
    expect(store.getState()).toMatchObject({ dockTab: 'canvas', sheet: null });
    store.getState().openSheet('canvasColor');
    store.getState().leaveDock();
    expect(store.getState()).toMatchObject({ dockTab: null, sheet: null });
  });

  it('setters accept a value or an updater', () => {
    const store = createEditorUiStore(null);
    store.getState().setBrushSize(14);
    store.getState().setBrushSize((v) => v + 2);
    expect(store.getState().brushSize).toBe(16);
  });
});
