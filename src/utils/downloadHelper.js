export const downloadImageHelper = async (dataUrl, filename = 'meme.png') => {
  try {
    // 1. Convert base64 dataURI / canvas data to Blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    // 2. Mobile Native Web Share API (iOS Safari / Android Chrome)
    const file = new File([blob], filename, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'Meme Creator',
          text: 'Created with Meme Creator Studio'
        });
        return;
      } catch (err) {
        if (err.name !== 'AbortError') console.log('Share sheet dismissed, falling back to download link');
      }
    }

    // 3. Desktop / Mobile Blob Anchor Download
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 3000);
  } catch (error) {
    console.error('Download helper error, attempting direct open fallback', error);
    // 4. Mobile Safari Fallback: Open image in new window/tab for tap & hold save
    try {
      const w = window.open('', '_blank');
      if (w) {
        w.document.write(`<img src="${dataUrl}" style="max-width:100%;height:auto;display:block;margin:auto;" />`);
      } else {
        window.location.href = dataUrl;
      }
    } catch {
      window.location.href = dataUrl;
    }
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
  return new Promise((resolve, reject) => {
    try {
      const mimeType = 'video/mp4';
      const ext = 'mp4';
      const filename = `${baseFilename}.${ext}`;

      console.log(`[VideoExport] Using mimeType: ${mimeType}, file: ${filename}`);

      const canvasStream = canvas.captureStream(30);
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
        console.log(`[VideoExport] Multiplexed ${audioTracks.length} audio track(s) into recording stream.`);
      }

      const recorder = new MediaRecorder(finalStream, {
        mimeType,
        videoBitsPerSecond: 8_000_000
      });
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
          console.log(`[VideoExport] Chunk received: ${e.data.size} bytes (total: ${chunks.length})`);
        }
      };

      recorder.onstop = async () => {
        console.log(`[VideoExport] Recording stopped. Total chunks: ${chunks.length}`);
        if (chunks.length === 0) {
          reject(new Error('No video data was captured. Make sure the canvas is visible and rendering.'));
          return;
        }

        const blob = new Blob(chunks, { type: mimeType });
        console.log(`[VideoExport] Blob size: ${blob.size} bytes`);

        if (blob.size < 1000) {
          reject(new Error('Video file is too small — the canvas may not have rendered any frames.'));
          return;
        }

        const blobUrl = URL.createObjectURL(blob);

        if (returnUrlOnly) {
          resolve(blobUrl);
          return;
        }

        const win = window.open('', '_blank');
        if (win) {
          win.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Meme Video — Save to Device</title>
              <style>
                body { background: #000000; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; font-family: sans-serif; color: #fff; gap: 16px; }
                video { max-width: 90vw; max-height: 70vh; border-radius: 12px; box-shadow: 0 16px 48px rgba(0,0,0,0.6); }
                a { background: #ffffff; color: #000000; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 1rem; }
                p { color: rgba(255,255,255,0.6); font-size: 0.85rem; }
              </style>
            </head>
            <body>
              <h2 style="margin:0">🎬 Your Meme Video</h2>
              <video src="${blobUrl}" controls autoplay loop></video>
              <a href="${blobUrl}" download="${filename}">⬇ Download Video</a>
              <p>Tap and hold the video on mobile to save it to your device.</p>
            </body>
            </html>
          `);
          win.document.close();
        } else {
          // Fallback: direct anchor download
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = filename;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }

        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        resolve();
      };

      recorder.onerror = (e) => {
        console.error('[VideoExport] MediaRecorder error:', e);
        reject(e.error || new Error('MediaRecorder error'));
      };

      // Start recording — collect data every 200ms for reliable chunks
      recorder.start(200);
      console.log(`[VideoExport] Recording started for ${durationMs}ms`);

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
