import { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { downloadImageHelper } from '../../../utils/downloadHelper';
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

const mimeTypeFor = (format) => (format === 'jpeg' ? 'image/jpeg' : (format === 'webp' ? 'image/webp' : 'image/png'));

// Renders the canvas without selection handles.
const renderCleanImage = (canvas, mimeType = 'image/png', quality) => (
  canvas.exportCleanImage ? canvas.exportCleanImage(mimeType, quality) : canvas.toDataURL(mimeType, quality)
);

// Export, download, copy, share and save-to-gallery for the meme editor.
export function useExport({ canvasRef, template, onSaveToGallery, layout }) {
  const store = useMemeEditorStoreApi();

  const [exportedImageUri, setExportedImageUri] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('png'); // 'png' | 'jpeg' | 'webp'
  const [exportQuality, setExportQuality] = useState(0.92);
  const [exportPreset, setExportPreset] = useState('hd'); // 'hd' | 'discord' | 'compact'
  const [exportFileSize, setExportFileSize] = useState(null);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef(null);
  const [isSaved, setIsSaved] = useState(false);
  const [memeCustomName, setMemeCustomName] = useState('');
  const [clipboardCopied, setClipboardCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

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

  const updateExportUriAndSize = (format = exportFormat, quality = exportQuality) => {
    if (!canvasRef.current) return;
    const dataUrl = renderCleanImage(canvasRef.current, mimeTypeFor(format), format === 'png' ? undefined : quality);
    setExportedImageUri(dataUrl);
    // Base64 size estimation
    const bytes = Math.round((dataUrl.length * 3) / 4);
    setExportFileSize(bytes);
  };

  const handleSelectExportFormat = (fmt) => {
    setExportFormat(fmt);
    updateExportUriAndSize(fmt, exportQuality);
  };

  const handleSelectExportQuality = (q) => {
    setExportQuality(q);
    updateExportUriAndSize(exportFormat, q);
  };

  const handleSelectExportPreset = (preset) => {
    setExportPreset(preset);
    if (preset === 'hd') {
      setExportFormat('png');
      updateExportUriAndSize('png', 1.0);
    } else if (preset === 'discord') {
      setExportFormat('jpeg');
      setExportQuality(0.85);
      updateExportUriAndSize('jpeg', 0.85);
    } else if (preset === 'compact') {
      setExportFormat('webp');
      setExportQuality(0.75);
      updateExportUriAndSize('webp', 0.75);
    }
  };

  // Renders canvas to dataURL without handles, then runs the callback action
  const handleQuickExport = (action) => {
    store.getState().setActiveLayerId(null);
    setExportDropdownOpen(false);
    if (canvasRef.current) {
      const dataUrl = renderCleanImage(canvasRef.current);
      setExportedImageUri(dataUrl);
      const { captions } = store.getState();
      const cleaned = cleanTemplateName(template?.name);
      const defaultName = cleaned || (captions[0]?.text && captions[0].text !== 'TOP TEXT' ? captions[0].text : '') || 'My Meme';
      setMemeCustomName(defaultName);
      action(dataUrl);
    }
  };

  const handleConfirmSave = () => {
    const dataUrl = (canvasRef.current && renderCleanImage(canvasRef.current)) || exportedImageUri;
    if (dataUrl) {
      const { captions, stickers, imageLayers, aspectRatio, slotImages, slotTransforms } = store.getState();
      const finalName = memeCustomName.trim() || 'My Meme';
      onSaveToGallery({
        id: `meme-${Date.now()}`,
        name: finalName,
        imageUrl: dataUrl,
        rawImageUrl: template?.rawImageUrl || template?.imageUrl,
        captions: JSON.parse(JSON.stringify(captions)),
        stickers: JSON.parse(JSON.stringify(stickers)),
        imageLayers: JSON.parse(JSON.stringify(imageLayers)),
        aspectRatio,
        imageFit: layout.imageFit,
        isNativeLayout: layout.isNativeLayout,
        layoutDef: layout.layoutDef,
        slotImages,
        slotTransforms,
        createdAt: new Date().toISOString()
      });
      setIsSaved(true);
      triggerConfetti();
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  const handleDownloadImage = async () => {
    if (exportedImageUri) {
      const ext = exportFormat === 'jpeg' ? 'jpg' : exportFormat;
      const filename = `meme-${template?.id || 'custom'}-${Date.now()}.${ext}`;
      await downloadImageHelper(exportedImageUri, filename);
      triggerConfetti();
    }
  };

  const handleCopyToClipboard = async () => {
    if (!exportedImageUri) return;
    try {
      const res = await fetch(exportedImageUri);
      const blob = await res.blob();
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
        // Modern clipboard API: copies the actual image, pasteable into Discord/Twitter/etc.
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
      } else {
        // Fallback: copy the data URL as text
        await navigator.clipboard.writeText(exportedImageUri);
      }
      setClipboardCopied(true);
      triggerConfetti();
      setTimeout(() => setClipboardCopied(false), 2500);
    } catch (err) {
      console.warn('Copy to clipboard failed:', err);
    }
  };

  const handleShareImage = async () => {
    if (!exportedImageUri) return;
    try {
      // Convert data URL to Blob for Web Share API
      const res = await fetch(exportedImageUri);
      const blob = await res.blob();
      const ext = exportFormat === 'jpeg' ? 'jpg' : exportFormat;
      const file = new File([blob], `meme-${Date.now()}.${ext}`, { type: mimeTypeFor(exportFormat) });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        // Native share sheet (mobile / Chrome Android / Safari iOS)
        await navigator.share({
          title: memeCustomName || 'My Meme',
          text: 'Check out this meme I made! 😂',
          files: [file],
        });
        triggerConfetti();
      } else {
        // Desktop fallback: copy data URL to clipboard
        await navigator.clipboard.writeText(exportedImageUri);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2500);
      }
    } catch (err) {
      // User cancelled share or clipboard not available: silently ignore
      if (err.name !== 'AbortError') {
        console.warn('Share failed:', err);
      }
    }
  };

  return {
    exportedImageUri,
    isExportModalOpen,
    setIsExportModalOpen,
    exportFormat,
    exportQuality,
    exportPreset,
    exportFileSize,
    exportDropdownOpen,
    setExportDropdownOpen,
    exportDropdownRef,
    isSaved,
    memeCustomName,
    setMemeCustomName,
    clipboardCopied,
    shareCopied,
    handleSelectExportFormat,
    handleSelectExportQuality,
    handleSelectExportPreset,
    handleQuickExport,
    handleConfirmSave,
    handleDownloadImage,
    handleCopyToClipboard,
    handleShareImage,
  };
}
