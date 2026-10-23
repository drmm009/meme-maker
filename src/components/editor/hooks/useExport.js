import { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { cleanTemplateName } from '../memeEditorUtils';
import { useMemeEditorStoreApi } from '../store/useMemeEditorStore';

export const triggerConfetti = () => {
  try {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 }
    });
  } catch {
    // Confetti fallback
  }
};

// Renders the canvas without selection handles.
const renderCleanImage = (canvas) => (
  canvas.exportCleanImage ? canvas.exportCleanImage('image/png') : canvas.toDataURL('image/png')
);

// State and actions for the editor's Export menu.
export function useExport({ canvasRef, template }) {
  const store = useMemeEditorStoreApi();
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef(null);

  // Close export dropdown when clicking outside
  useEffect(() => {
    if (!exportDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) {
        setExportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [exportDropdownOpen]);

  // Renders the canvas to a PNG data URL without handles, then runs
  // action(dataUrl, name) with a default name for the meme.
  const handleQuickExport = (action) => {
    store.getState().setActiveLayerId(null);
    setExportDropdownOpen(false);
    if (canvasRef.current) {
      const dataUrl = renderCleanImage(canvasRef.current);
      const { captions } = store.getState();
      const cleaned = cleanTemplateName(template?.name);
      const name = cleaned || (captions[0]?.text && captions[0].text !== 'TOP TEXT' ? captions[0].text : '') || 'My Meme';
      action(dataUrl, name);
    }
  };

  return { exportDropdownOpen, setExportDropdownOpen, exportDropdownRef, handleQuickExport };
}
