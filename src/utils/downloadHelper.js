import { dataURLToBlob } from './galleryStore';

// Saves a picture: `dataUrl` is a Blob, a data: URL or any other URL.
export const downloadImageHelper = async (dataUrl, filename = 'meme.png') => {
  try {
    let blob;
    if (typeof Blob !== 'undefined' && dataUrl instanceof Blob) {
      blob = dataUrl;
    } else if (typeof dataUrl === 'string' && dataUrl.startsWith('data:')) {
      blob = dataURLToBlob(dataUrl);
    } else {
      const response = await fetch(dataUrl);
      blob = await response.blob();
    }
    const blobUrl = URL.createObjectURL(blob);

    // 1. Mobile Native Web Share API (iOS Safari / Android Chrome)
    const file = new File([blob], filename, { type: blob.type || 'image/png' });
    if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'Meme Creator',
          text: 'Created with Meme Creator Studio'
        });
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        return;
      } catch (err) {
        if (err.name !== 'AbortError') console.log('Share sheet dismissed, falling back to download link');
      }
    }

    // 2. Desktop / Mobile Blob Anchor Download
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 60000);
    window.addEventListener('pagehide', () => URL.revokeObjectURL(blobUrl), { once: true });
  } catch (error) {
    console.error('Download helper error:', error);
  }
};

