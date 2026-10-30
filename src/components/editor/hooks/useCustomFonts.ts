import { useEffect } from 'react';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { loadCustomFonts } from '../../../utils/customFonts';
import type { CustomFont } from '../../../utils/customFonts';

// Repaints the meme (render/renderScene keeps this hook on window), e.g. once a font has loaded.
export const redrawCanvas = () => (window as Window & { __memeCanvasForceRender?: () => void }).__memeCanvasForceRender?.();

// Loads a caption font if the page hasn't yet (web and uploaded fonts load on first use), then
// repaints so the canvas shows it instead of the fallback.
export function ensureFontLoaded(css: string): void {
  if (typeof document === 'undefined' || !document.fonts?.load) return;
  document.fonts.load(`bold 48px ${css}`).then(redrawCanvas).catch(() => {});
}

// On opening the editor: register the fonts people uploaded before, and repaint when the page's
// web fonts are ready (captions may already use them).
export function useCustomFonts(): void {
  const setCustomFonts = useEditorUiStore((s: { setCustomFonts: (fonts: CustomFont[]) => void }) => s.setCustomFonts);
  useEffect(() => {
    let alive = true;
    loadCustomFonts()
      .then((fonts) => {
        if (!alive) return;
        setCustomFonts(fonts);
        redrawCanvas();
      })
      .catch(() => {});
    document.fonts?.ready?.then(() => alive && redrawCanvas());
    return () => {
      alive = false;
    };
  }, [setCustomFonts]);
}
