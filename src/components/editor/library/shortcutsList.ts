// The image editor's keyboard shortcuts: keys and their labels, customized for Mac (⌘ / ⇧) or other OSes.

export interface ShortcutItem {
  keys: string[];
  label: string;
  command?: 'undo' | 'redo' | 'delete' | 'duplicate' | 'nudge' | 'order' | 'deselect' | 'help' | null;
}

export function forMac(isMac: boolean): ShortcutItem[] {
  const mod = isMac ? '⌘' : 'Ctrl';
  const shift = isMac ? '⇧' : 'Shift';

  return [
    { keys: [`${mod} + Z`], label: 'Undo', command: 'undo' },
    { keys: [`${mod} + Y`, `${mod} + ${shift} + Z`], label: 'Redo', command: 'redo' },
    { keys: ['Delete', 'Backspace'], label: 'Delete the selected layer', command: 'delete' },
    { keys: [`${mod} + D`], label: 'Duplicate the selected layer', command: 'duplicate' },
    { keys: ['Arrow keys'], label: 'Nudge the selected layer (Shift + arrows: bigger steps)', command: 'nudge' },
    { keys: [']', '['], label: 'Bring forward / send backward', command: 'order' },
    { keys: [`${mod} + ${shift} + ]`, `${mod} + ${shift} + [`], label: 'Bring to front / send to back', command: 'order' },
    { keys: ['Esc'], label: 'Deselect', command: 'deselect' },
    { keys: [`${mod} + V`], label: 'Paste a picture, or a link to one', command: null },
    { keys: ['?'], label: 'Show this list', command: 'help' },
  ];
}

export const shortcutsList = forMac(false);
export default forMac;
