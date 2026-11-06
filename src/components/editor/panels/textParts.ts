// A text's settings in parts, each a button on its floating bar (and in the video editor's text
// pill) that opens the text controls with just that part.
export const TEXT_PARTS = { font: 'Font', style: 'Style', color: 'Color' } as const;
export type TextPart = keyof typeof TEXT_PARTS;
// The Color part shows one of these at a time, picked in its header.
export const COLOR_TABS = { color: 'Text', outline: 'Outline', box: 'Box' } as const;
export type ColorTab = keyof typeof COLOR_TABS;
