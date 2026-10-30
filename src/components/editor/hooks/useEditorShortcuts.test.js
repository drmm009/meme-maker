import { describe, it, expect } from 'vitest';
import { getShortcutCommand, NUDGE_STEP, NUDGE_STEP_LARGE } from './useEditorShortcuts';
import { forMac } from '../library/shortcutsList';

const key = (k, mods = {}) => ({ key: k, ctrlKey: false, metaKey: false, shiftKey: false, ...mods });
const win = { isMac: false, hasSelection: true };
const mac = { isMac: true, hasSelection: true };
const none = { isMac: false, hasSelection: false };

describe('getShortcutCommand', () => {
  it('maps undo and redo with Ctrl on Windows and Cmd on Mac', () => {
    expect(getShortcutCommand(key('z', { ctrlKey: true }), win)).toEqual({ type: 'undo' });
    expect(getShortcutCommand(key('y', { ctrlKey: true }), win)).toEqual({ type: 'redo' });
    expect(getShortcutCommand(key('z', { ctrlKey: true, shiftKey: true }), win)).toEqual({ type: 'redo' });
    expect(getShortcutCommand(key('z', { metaKey: true }), mac)).toEqual({ type: 'undo' });
    expect(getShortcutCommand(key('z', { ctrlKey: true }), mac)).toBeNull();
  });

  it('undo and redo work without a selection', () => {
    expect(getShortcutCommand(key('z', { ctrlKey: true }), none)).toEqual({ type: 'undo' });
  });

  it('layer commands need a selection', () => {
    for (const e of [key('Delete'), key('Backspace'), key('d', { ctrlKey: true }), key('ArrowUp'), key(']'), key('[')]) {
      expect(getShortcutCommand(e, none)).toBeNull();
    }
    expect(getShortcutCommand(key('Delete'), win)).toEqual({ type: 'delete' });
    expect(getShortcutCommand(key('Backspace'), win)).toEqual({ type: 'delete' });
    expect(getShortcutCommand(key('d', { ctrlKey: true }), win)).toEqual({ type: 'duplicate' });
  });

  it('nudges by a small fraction of the canvas, larger with Shift', () => {
    expect(getShortcutCommand(key('ArrowLeft'), win)).toEqual({ type: 'nudge', dx: -NUDGE_STEP, dy: 0 });
    expect(getShortcutCommand(key('ArrowRight'), win)).toEqual({ type: 'nudge', dx: NUDGE_STEP, dy: 0 });
    expect(getShortcutCommand(key('ArrowUp', { shiftKey: true }), win)).toEqual({ type: 'nudge', dx: 0, dy: -NUDGE_STEP_LARGE });
    expect(getShortcutCommand(key('ArrowDown'), win)).toEqual({ type: 'nudge', dx: 0, dy: NUDGE_STEP });
    // Positions are 0..1, so even a large nudge stays well inside the canvas.
    expect(NUDGE_STEP_LARGE).toBeLessThan(0.1);
  });

  it('brackets change layer order; Ctrl+Shift jumps to front/back', () => {
    expect(getShortcutCommand(key(']'), win)).toEqual({ type: 'order', action: 'forward' });
    expect(getShortcutCommand(key('['), win)).toEqual({ type: 'order', action: 'backward' });
    expect(getShortcutCommand(key('}', { ctrlKey: true, shiftKey: true }), win)).toEqual({ type: 'order', action: 'front' });
    expect(getShortcutCommand(key('{', { ctrlKey: true, shiftKey: true }), win)).toEqual({ type: 'order', action: 'back' });
  });

  it('Escape deselects; other keys do nothing', () => {
    expect(getShortcutCommand(key('Escape'), none)).toEqual({ type: 'deselect' });
    expect(getShortcutCommand(key('a'), win)).toBeNull();
  });

  it('? maps to help without needing a selection or modifier', () => {
    expect(getShortcutCommand(key('?'), none)).toEqual({ type: 'help' });
    expect(getShortcutCommand(key('?'), win)).toEqual({ type: 'help' });
    expect(getShortcutCommand(key('?'), mac)).toEqual({ type: 'help' });
  });

  it('every entry in shortcutsList matches a getShortcutCommand outcome', () => {
    const list = forMac(false);
    const keyFor = (item, isMac) => {
      const mod = isMac ? { metaKey: true } : { ctrlKey: true };
      switch (item.command) {
        case 'undo': return key('z', mod);
        case 'redo': return key('y', mod);
        case 'delete': return key('Delete');
        case 'duplicate': return key('d', mod);
        case 'nudge': return key('ArrowUp');
        case 'order': return item.label.includes('front') ? key('}', { ...mod, shiftKey: true }) : key(']');
        case 'deselect': return key('Escape');
        case 'help': return key('?');
        case null: return null;
        default: throw new Error(`Untested shortcut: ${item.label}`);
      }
    };

    for (const item of list) {
      const e = keyFor(item, false);
      if (!e) continue;
      const cmd = getShortcutCommand(e, { isMac: false, hasSelection: true });
      expect(cmd?.type).toBe(item.command);
    }

    const macList = forMac(true);
    for (const item of macList) {
      const e = keyFor(item, true);
      if (!e) continue;
      const cmd = getShortcutCommand(e, { isMac: true, hasSelection: true });
      expect(cmd?.type).toBe(item.command);
    }

    const listedCommands = new Set(list.map((s) => s.command).filter(Boolean));
    const expected = new Set(['undo', 'redo', 'delete', 'duplicate', 'nudge', 'order', 'deselect', 'help']);
    expect(listedCommands).toEqual(expected);
  });
});
