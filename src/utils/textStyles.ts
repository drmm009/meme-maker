// Text styles the person saves from the Text sheet, to put on other captions: the font, colours,
// outline, spacing, shadow, gradient, background and size (not the words or the position). Kept in
// localStorage, newest first.
import { safeGet, safeSet } from './storage';

export const TEXT_STYLES_KEY = 'meme-maker-text-styles';
export const MAX_TEXT_STYLES = 12;

export const STYLE_KEYS = [
  'fontFamily', 'fontSize', 'color', 'stroke', 'strokeWidth', 'bold', 'italic', 'underline',
  'letterSpacing', 'lineHeight', 'shadowSize', 'shadowColor', 'gradient', 'bgColor', 'bgStyle', 'align',
  'autoFit', 'maxLines',
] as const;

export type TextStyle = Partial<Record<(typeof STYLE_KEYS)[number], unknown>>;

export interface SavedTextStyle {
  id: string;
  style: TextStyle;
}

// The style part of a caption (keys it has set).
export function styleOf(caption: Record<string, unknown>): TextStyle {
  const style: TextStyle = {};
  for (const key of STYLE_KEYS) if (caption[key] !== undefined) style[key] = caption[key];
  return style;
}

const same = (a: TextStyle, b: TextStyle) => JSON.stringify(a) === JSON.stringify(b);

// `style` added in front; an identical one already saved moves to the front instead.
export function withStyle(list: SavedTextStyle[], style: TextStyle, id: string): SavedTextStyle[] {
  return [{ id, style }, ...list.filter((s) => !same(s.style, style))].slice(0, MAX_TEXT_STYLES);
}

export function loadTextStyles(): SavedTextStyle[] {
  const list: unknown = safeGet(TEXT_STYLES_KEY);
  return Array.isArray(list) ? list.filter((s): s is SavedTextStyle => Boolean(s) && typeof s.id === 'string' && Boolean(s.style) && typeof s.style === 'object') : [];
}

export const saveTextStyles = (list: SavedTextStyle[]): void => {
  safeSet(TEXT_STYLES_KEY, list);
};
