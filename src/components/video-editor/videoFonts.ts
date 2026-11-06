import { create } from 'zustand';
import { loadCustomFonts } from '../../utils/customFonts';
import type { CustomFont } from '../../utils/customFonts';
import { refreshTextFonts } from '../../utils/textBitmap';

// The fonts people uploaded (in either editor), for the video editor's text sheets.
export const useVideoFonts = create<{ fonts: CustomFont[] }>(() => ({ fonts: [] }));

// A new list (one just uploaded): text using them is drawn again.
export const setVideoFonts = (fonts: CustomFont[]): void => {
  useVideoFonts.setState({ fonts });
  refreshTextFonts();
};

// Registers the kept fonts with the page, once as the editor opens.
export const loadVideoFonts = (): Promise<void> => loadCustomFonts().then(setVideoFonts).catch(() => {});
