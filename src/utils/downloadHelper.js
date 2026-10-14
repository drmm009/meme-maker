import { dataURLToBlob } from './galleryStore';

export const downloadImageHelper = async (dataUrl, filename = 'meme.png') => {
  try {
    let blob;
    if (typeof dataUrl === 'string' && dataUrl.startsWith('data:')) {
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

/**
 * recordCanvasAsVideo
 * Records a live canvas element using MediaRecorder + captureStream().
 * Tries MP4 (H.264) first for native Windows/macOS compatibility,
 * falls back to WebM VP9 → VP8 → plain WebM.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {string}            baseFilename  — e.g. 'meme-video-1234' (no extension)
 * @param {number}            durationMs    — recording duration in ms (default 6000)
 * @param {Function}          onProgress    — optional callback(progress 0-1)
 * @returns {Promise<void>}
 */
export const recordCanvasAsVideo = (canvas, baseFilename = 'meme-video', durationMs = 6000, onProgress, mediaElements = [], returnUrlOnly = false) => {
  const DEV = import.meta.env?.DEV;
  return new Promise((resolve, reject) => {
    try {
      const mimeCandidates = [
        { mime: 'video/mp4;codecs=avc1', ext: 'mp4' },
        { mime: 'video/mp4', ext: 'mp4' },
        { mime: 'video/webm;codecs=vp9,opus', ext: 'webm' },
        { mime: 'video/webm;codecs=vp8,opus', ext: 'webm' },
        { mime: 'video/webm', ext: 'webm' },
      ];
      let chosen = mimeCandidates.find(c => typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported(c.mime));
      const mimeType = chosen ? chosen.mime : '';
      const ext = chosen ? chosen.ext : 'mp4';
      const filename = `${baseFilename}.${ext}`;

      const canvasStream = canvas.captureStream ? canvas.captureStream(30) : (canvas.mozCaptureStream ? canvas.mozCaptureStream(30) : null);
      if (!canvasStream) {
        reject(new Error('Canvas video recording is not supported on this browser or device.'));
        return;
      }
      const audioTracks = [];
      
      mediaElements.forEach(el => {
        try {
          const ms = el.captureStream ? el.captureStream() : (el.mozCaptureStream ? el.mozCaptureStream() : null);
          if (ms) {
            ms.getAudioTracks().forEach(t => audioTracks.push(t));
          }
        } catch (e) {
          console.warn('[VideoExport] Could not capture audio from video element', e);
        }
      });

      let finalStream = canvasStream;
      if (audioTracks.length > 0) {
        finalStream = new MediaStream([
          ...canvasStream.getVideoTracks(),
          ...audioTracks
        ]);
        if (DEV) console.log(`[VideoExport] Multiplexed ${audioTracks.length} audio track(s) into recording stream.`);
      }

      const recorderOptions = {
        videoBitsPerSecond: 8_000_000
      };
      if (mimeType) {
        recorderOptions.mimeType = mimeType;
      }

      const recorder = new MediaRecorder(finalStream, recorderOptions);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
          if (DEV) console.log(`[VideoExport] Chunk received: ${e.data.size} bytes (total: ${chunks.length})`);
        }
      };

      recorder.onstop = async () => {
        if (DEV) console.log(`[VideoExport] Recording stopped. Total chunks: ${chunks.length}`);
        if (chunks.length === 0) {
          reject(new Error('No video data was captured. Make sure the canvas is visible and rendering.'));
          return;
        }

        const blob = new Blob(chunks, { type: mimeType });
        if (DEV) console.log(`[VideoExport] Blob size: ${blob.size} bytes`);

        if (blob.size < 1000) {
          reject(new Error('Video file is too small — the canvas may not have rendered any frames.'));
          return;
        }

        const blobUrl = URL.createObjectURL(blob);

        if (returnUrlOnly) {
          resolve(blobUrl);
          return;
        }

        const videoFile = new File([blob], filename, { type: mimeType || 'video/mp4' });
        if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [videoFile] })) {
          navigator.share({
            files: [videoFile],
            title: 'Meme Video',
            text: 'Created with Meme Creator Studio'
          }).catch((err) => {
            if (err.name !== 'AbortError') console.log('Video share dismissed, triggering anchor download');
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          });
        } else {
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = filename;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }

        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        window.addEventListener('pagehide', () => URL.revokeObjectURL(blobUrl), { once: true });
        resolve(blobUrl);
      };

      recorder.onerror = (e) => {
        console.error('[VideoExport] MediaRecorder error:', e);
        reject(e.error || new Error('MediaRecorder error'));
      };

      // Start recording — collect data every 200ms for reliable chunks
      recorder.start(200);
      if (DEV) console.log(`[VideoExport] Recording started for ${durationMs}ms`);

      // Progress ticker + stop after duration
      const startTime = Date.now();
      const tick = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / durationMs, 1);
        if (onProgress) onProgress(progress);

        if (elapsed >= durationMs) {
          clearInterval(tick);
          // Request any remaining buffered data before stopping
          if (recorder.state === 'recording') {
            recorder.requestData();
            setTimeout(() => {
              if (recorder.state === 'recording') recorder.stop();
            }, 250);
          }
        }
      }, 100);

    } catch (err) {
      console.error('[VideoExport] Setup error:', err);
      reject(err);
    }
  });
};
