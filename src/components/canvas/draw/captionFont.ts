import type { MemeCaption } from '../../../model/memeDocument';

// The canvas font for a caption. Captions are bold unless `bold` is false; measuring, hit testing
// and drawing all use this so a caption's box always fits its text.
export const captionFont = (
  cap: Pick<MemeCaption, 'bold' | 'italic' | 'fontFamily'>,
  fontSize: number,
  fallbackFamily = 'Impact, sans-serif'
): string => `${cap.italic ? 'italic ' : ''}${cap.bold === false ? 'normal' : 'bold'} ${fontSize}px ${cap.fontFamily || fallbackFamily}`;

// Where a line's underline sits: from x for width, at y (the line's middle) plus this much, this thick.
export const underlineMetrics = (fontSize: number) => ({
  offset: fontSize * 0.42,
  thickness: Math.max(2, fontSize / 14),
});
