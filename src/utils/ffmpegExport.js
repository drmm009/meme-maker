import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import Konva from 'konva';
import { generateGridImage } from './gridHelper';

let ffmpeg = null;
let loadPromise = null;

export const loadFFmpeg = async () => {
  if (ffmpeg && ffmpeg.loaded) return ffmpeg;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const ff = new FFmpeg();
      ff.on('log', ({ message }) => {
        console.error('[FFmpeg Log]', message);
      });
      
      const baseUrl = import.meta.env.BASE_URL || './';
      const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
      const coreHref = new URL(`${cleanBase}ffmpeg/ffmpeg-core.js`, window.location.href).href;
      const wasmHref = new URL(`${cleanBase}ffmpeg/ffmpeg-core.wasm`, window.location.href).href;

      const coreURL = await toBlobURL(coreHref, 'text/javascript');
      const wasmURL = await toBlobURL(wasmHref, 'application/wasm');

      await ff.load({ coreURL, wasmURL });
      ffmpeg = ff;
      return ff;
    } catch (error) {
      loadPromise = null;
      throw error;
    }
  })();

  return loadPromise;
};

export const exportVideoFFmpeg = async (items = [], durationMs = 7000, canvasAspectRatio = 16/9, canvasDimensions = { width: 800, height: 600 }, layoutId = null, onProgress = () => {}) => {
  try {
    const ff = await loadFFmpeg();
    ff.on('progress', ({ progress }) => {
      // Clamp progress between 0 and 100
      let p = Math.max(0, Math.min(progress * 100, 100));
      onProgress(p);
    });

    const safeDurationMs = (typeof durationMs === 'number' && !isNaN(durationMs) && durationMs > 0) ? durationMs : 7000;
    const durationSec = Math.max(0.1, safeDurationMs / 1000);
    
    // Target 1280x720 canvas in FFmpeg (or scaled by aspect ratio)
    const safeAspect = (typeof canvasAspectRatio === 'number' && !isNaN(canvasAspectRatio) && canvasAspectRatio > 0) ? canvasAspectRatio : (16 / 9);
    let canvasW = 1280;
    let canvasH = 720;
    if (safeAspect < 1) {
      canvasH = 1280;
      canvasW = Math.round(1280 * safeAspect);
    } else {
      canvasW = 1280;
      canvasH = Math.round(1280 / safeAspect);
    }
    
    // Ensure even dimensions
    canvasW = Math.max(2, Math.round(canvasW / 2) * 2);
    canvasH = Math.max(2, Math.round(canvasH / 2) * 2);
    const canvasWidthRef = (canvasDimensions && typeof canvasDimensions.width === 'number' && canvasDimensions.width > 0) ? canvasDimensions.width : 800;
    const konvaRatio = canvasW / canvasWidthRef;

    const command = [
      '-f', 'lavfi',
      '-i', `color=c=white:s=${canvasW}x${canvasH}:d=${durationSec}`,
      '-f', 'lavfi',
      '-i', `anullsrc=r=44100:cl=stereo:d=${durationSec}`
    ];

    let filterComplex = '';
    let currentBgIndex = 0; // Starts from [0:v] which is our white color layer
    let inputIndex = 2; // 0=color, 1=anullsrc
    const audioStreams = [];
    const filesToDelete = [];

    const visualItems = items.filter(item => item.type === 'video' || item.type === 'image' || item.type === 'sticker');
    const textItems = items.filter(item => item.type === 'text');

    for (const item of visualItems) {
      if (!item.url) continue;
      
      const isVideo = item.type === 'video';
      
      const rawW = (item.width || 100) * (item.scaleX || item.scale || 1) * konvaRatio;
      const rawH = (item.height || 100) * (item.scaleY || item.scale || 1) * konvaRatio;
      const w = Math.max(2, Math.round(rawW / 2) * 2);
      const h = Math.max(2, Math.round(rawH / 2) * 2);

      let fileData;
      try {
        if (!isVideo && (item.url.startsWith('data:image/svg') || item.url.toLowerCase().endsWith('.svg'))) {
          // Rasterize SVGs to PNG because FFmpeg WASM doesn't support SVG decoding natively
          fileData = await new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = w;
              canvas.height = h;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, w, h);
              canvas.toBlob(blob => {
                if (blob) {
                  blob.arrayBuffer().then(buf => resolve(new Uint8Array(buf))).catch(() => resolve(null));
                } else {
                  resolve(null);
                }
              }, 'image/png');
            };
            img.onerror = () => resolve(null);
            img.src = item.url;
          });
        } else {
          fileData = await fetchFile(item.url);
        }
      } catch (err) {
        console.warn(`[FFmpeg Export] Could not fetch visual item from ${item.url}:`, err);
        continue;
      }
      if (!fileData || fileData.byteLength === 0) continue;

      const fileName = isVideo ? `input_${inputIndex}.mp4` : `input_${inputIndex}.png`;
      await ff.writeFile(fileName, fileData);
      filesToDelete.push(fileName);

      if (!isVideo) {
        command.push('-loop', '1', '-i', fileName);
      } else {
        const trimStartSec = Math.max(0, (typeof item.trimStartMs === 'number' && !isNaN(item.trimStartMs) ? item.trimStartMs : 0) / 1000);
        if (trimStartSec > 0) {
          command.push('-ss', trimStartSec.toString());
        }
        command.push('-i', fileName);

        if (!item.muted) {
          let videoHasAudio = false;
          try {
            // Use FFmpeg to quickly check if an audio stream exists in this file
            const ret = await ff.exec(['-i', fileName, '-map', '0:a', '-c', 'copy', '-f', 'null', '-']);
            if (ret === 0) {
              videoHasAudio = true;
            } else {
              console.log(`[FFmpeg Export] No audio stream found in ${fileName}`);
            }
          } catch (e) {
            videoHasAudio = false;
            console.warn(`[FFmpeg Export] FFmpeg probe for audio failed:`, e);
          }

          if (videoHasAudio) {
            const startMs = Math.max(0, Math.round(typeof item.startMs === 'number' && !isNaN(item.startMs) ? item.startMs : 0));
            const rawEnd = typeof item.endMs === 'number' && !isNaN(item.endMs) ? item.endMs : (startMs + 3000);
            const timelineDurSec = Math.max(0.1, (rawEnd - startMs) / 1000);
            const pbRate = typeof item.playbackRate === 'number' && !isNaN(item.playbackRate) ? item.playbackRate : 1.0;
            const sourceTrimSec = timelineDurSec * pbRate;
            const vol = (typeof item.volume === 'number' && !isNaN(item.volume)) ? item.volume : 1.0;
            const atempo = pbRate !== 1.0 ? `,atempo=${pbRate}` : '';
            const delayFilter = startMs > 0 ? `,adelay=${startMs}|${startMs}` : '';
            filterComplex += `[${inputIndex}:a]atrim=0:${sourceTrimSec},asetpts=PTS-STARTPTS,aformat=channel_layouts=stereo:sample_rates=44100${atempo}${delayFilter},volume=${vol}[aud${inputIndex}];`;
            audioStreams.push(`[aud${inputIndex}]`);
          }
        }
      }

      const startT = Math.max(0, (typeof item.startMs === 'number' && !isNaN(item.startMs) ? item.startMs : 0) / 1000);
      const endT = Math.max(startT + 0.05, (typeof item.endMs === 'number' && !isNaN(item.endMs) ? item.endMs : safeDurationMs) / 1000);
      
      const x = Math.round((typeof item.x === 'number' && !isNaN(item.x) ? item.x : 0) * konvaRatio);
      const y = Math.round((typeof item.y === 'number' && !isNaN(item.y) ? item.y : 0) * konvaRatio);

      // Force scale and correctly offset PTS for videos so they don't expire before their start time.
      // Images/stickers loop infinitely and do not need a PTS offset, which saves massive memory buffering.
      const pbRate = typeof item.playbackRate === 'number' && !isNaN(item.playbackRate) ? item.playbackRate : 1.0;
      const ptsOffset = isVideo ? `+${startT}/TB` : '';
      filterComplex += `[${inputIndex}:v]setpts=(PTS-STARTPTS)/${pbRate}${ptsOffset},scale=${w}:${h}[vis${inputIndex}];`;
      filterComplex += `[${currentBgIndex === 0 ? '0:v' : `bg${currentBgIndex}`}][vis${inputIndex}]overlay=${x}:${y}:enable='between(t,${startT},${endT})':eof_action=pass:shortest=0[bg${currentBgIndex + 1}];`;
      
      currentBgIndex++;
      inputIndex++;
    }

    // Helper to render text into a transparent PNG buffer matching the output resolution
    const renderTextToPNG = async (item, w, h, ratio) => {
      return new Promise((resolve) => {
        try {
          const container = document.createElement('div');
          container.style.position = 'absolute';
          container.style.left = '-9999px';
          container.style.top = '-9999px';
          container.style.width = `${w}px`;
          container.style.height = `${h}px`;
          document.body.appendChild(container);

          const stage = new Konva.Stage({ container, width: w, height: h });
          const layer = new Konva.Layer();
          stage.add(layer);

          const textX = (typeof item.x === 'number' && !isNaN(item.x) ? item.x : 0) * ratio;
          const textY = (typeof item.y === 'number' && !isNaN(item.y) ? item.y : 0) * ratio;
          const fontSize = Math.max(10, (typeof item.fontSize === 'number' && !isNaN(item.fontSize) ? item.fontSize : 32) * ratio);

          const textNode = new Konva.Text({
            x: textX,
            y: textY,
            text: item.text || 'Sample Text',
            fontSize: fontSize,
            fontFamily: item.fontFamily || 'Impact, sans-serif',
            fontStyle: 'bold',
            fill: item.color || '#ffffff',
            stroke: item.stroke || '#000000',
            strokeWidth: (typeof item.strokeWidth === 'number' && !isNaN(item.strokeWidth) ? item.strokeWidth : Math.max(2, fontSize / 25)) * ratio,
            width: item.width ? item.width * ratio : undefined,
            align: item.align || 'center',
            rotation: item.rotation || 0,
            scaleX: 1, 
            scaleY: 1,
            letterSpacing: (-fontSize * 0.05) * ratio,
            lineJoin: 'miter',
            miterLimit: 2,
          });

          if (item.bgColor && item.bgColor !== 'none' && item.bgColor !== 'transparent') {
            const bgFill = item.bgColor === 'white' ? '#ffffff' : (item.bgColor === 'black' ? '#000000' : item.bgColor);
            const bgRect = new Konva.Rect({
              x: textX - 8 * ratio,
              y: textY - 4 * ratio,
              width: textNode.width() + 16 * ratio,
              height: textNode.height() + 8 * ratio,
              fill: bgFill,
              cornerRadius: 6 * ratio,
              rotation: item.rotation || 0,
            });
            layer.add(bgRect);
          }

          layer.add(textNode);
          layer.draw();

          const dataURL = stage.toDataURL({ pixelRatio: 1 });
          stage.destroy();
          if (container.parentNode) {
            container.parentNode.removeChild(container);
          }

          fetch(dataURL)
            .then(res => res.arrayBuffer())
            .then(buffer => resolve(new Uint8Array(buffer)))
            .catch(() => resolve(new Uint8Array(0)));
        } catch (err) {
          console.error('[renderTextToPNG] Konva render error:', err);
          // Canvas 2D fallback
          try {
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              const textX = (typeof item.x === 'number' && !isNaN(item.x) ? item.x : 0) * ratio;
              const textY = (typeof item.y === 'number' && !isNaN(item.y) ? item.y : 0) * ratio;
              const fontSize = Math.max(10, (typeof item.fontSize === 'number' && !isNaN(item.fontSize) ? item.fontSize : 32) * ratio);
              ctx.font = `bold ${fontSize}px ${item.fontFamily || 'Impact, sans-serif'}`;
              ctx.fillStyle = item.color || '#ffffff';
              ctx.strokeStyle = item.stroke || '#000000';
              ctx.lineWidth = Math.max(2, fontSize / 25) * ratio;
              ctx.strokeText(item.text || '', textX, textY + fontSize);
              ctx.fillText(item.text || '', textX, textY + fontSize);
              canvas.toBlob(blob => {
                if (blob) {
                  blob.arrayBuffer().then(buf => resolve(new Uint8Array(buf))).catch(() => resolve(new Uint8Array(0)));
                } else {
                  resolve(new Uint8Array(0));
                }
              });
              return;
            }
          } catch (e2) {}
          resolve(new Uint8Array(0));
        }
      });
    };

    // Add text items via PNG overlay for pixel-perfect font, stroke, and rotation support
    for (const item of textItems) {
      const startT = Math.max(0, (typeof item.startMs === 'number' && !isNaN(item.startMs) ? item.startMs : 0) / 1000);
      const endT = Math.max(startT + 0.05, (typeof item.endMs === 'number' && !isNaN(item.endMs) ? item.endMs : safeDurationMs) / 1000);
      
      const fileName = `text_${inputIndex}.png`;
      const pngData = await renderTextToPNG(item, canvasW, canvasH, konvaRatio);
      if (!pngData || pngData.byteLength === 0) continue;
      
      await ff.writeFile(fileName, pngData);
      filesToDelete.push(fileName);
      
      command.push('-loop', '1', '-i', fileName);
      
      filterComplex += `[${currentBgIndex === 0 ? '0:v' : `bg${currentBgIndex}`}][${inputIndex}:v]overlay=0:0:enable='between(t,${startT},${endT})':eof_action=pass:shortest=0[bg${currentBgIndex + 1}];`;
      
      currentBgIndex++;
      inputIndex++;
    }

    if (layoutId) {
      const gridDataUrl = generateGridImage(layoutId, canvasW, canvasH);
      if (gridDataUrl) {
        try {
          const res = await fetch(gridDataUrl);
          const fileData = new Uint8Array(await res.arrayBuffer());
          
          if (fileData.byteLength > 0) {
            const fileName = `grid_${inputIndex}.png`;
            await ff.writeFile(fileName, fileData);
            filesToDelete.push(fileName);
            
            command.push('-loop', '1', '-i', fileName);
            filterComplex += `[${currentBgIndex === 0 ? '0:v' : `bg${currentBgIndex}`}][${inputIndex}:v]overlay=0:0:eof_action=pass:shortest=0[bg${currentBgIndex + 1}];`;
            
            currentBgIndex++;
            inputIndex++;
          }
        } catch (err) {
          console.warn('[FFmpeg Export] Grid layout generation skipped:', err);
        }
      }
    }

    // Process standalone audio items (sound effects, background music, audio clips)
    const audioItems = items.filter(item => item.type === 'audio');
    for (const item of audioItems) {
      if (!item.url) continue;
      let fileData;
      try {
        fileData = await fetchFile(item.url);
      } catch (err) {
        console.warn(`[FFmpeg Export] Could not fetch audio from ${item.url}:`, err);
        continue;
      }
      if (!fileData || fileData.byteLength === 0) continue;

      let ext = 'mp3';
      if (item.url) {
        const match = item.url.match(/\.(mp3|wav|ogg|m4a|aac|webm)(\?.*)?$/i);
        if (match) ext = match[1].toLowerCase();
      }

      const fileName = `audio_${inputIndex}.${ext}`;
      await ff.writeFile(fileName, fileData);
      filesToDelete.push(fileName);

      const trimStartSec = Math.max(0, (typeof item.trimStartMs === 'number' && !isNaN(item.trimStartMs) ? item.trimStartMs : 0) / 1000);
      if (trimStartSec > 0) {
        command.push('-ss', trimStartSec.toString());
      }
      command.push('-i', fileName);

      if (!item.muted) {
        const startMs = Math.max(0, Math.round(typeof item.startMs === 'number' && !isNaN(item.startMs) ? item.startMs : 0));
        const rawEnd = typeof item.endMs === 'number' && !isNaN(item.endMs) ? item.endMs : (startMs + 3000);
        const clipDurSec = Math.max(0.05, (rawEnd - startMs) / 1000);
        const vol = (typeof item.volume === 'number' && !isNaN(item.volume)) ? item.volume : 1.0;
        const rate = (typeof item.playbackRate === 'number' && !isNaN(item.playbackRate)) ? item.playbackRate : 1;
        let atempoFilter = '';
        if (rate !== 1 && rate >= 0.5 && rate <= 2.0) {
          atempoFilter = `,atempo=${rate}`;
        }
        const delayFilter = startMs > 0 ? `,adelay=${startMs}|${startMs}` : '';
        filterComplex += `[${inputIndex}:a]atrim=0:${clipDurSec},asetpts=PTS-STARTPTS${atempoFilter},aformat=channel_layouts=stereo:sample_rates=44100${delayFilter},volume=${vol}[aud${inputIndex}];`;
        audioStreams.push(`[aud${inputIndex}]`);
      }

      inputIndex++;
    }

    // Mix all audio streams with base silence track to preserve duration and prevent cutoffs
    if (audioStreams.length > 0) {
      const allAudioInputs = ['[1:a]', ...audioStreams].join('');
      const mixCount = 1 + audioStreams.length;
      filterComplex += `${allAudioInputs}amix=inputs=${mixCount}:duration=first:dropout_transition=0,volume=${mixCount}[final_audio];`;
    }

    const finalVideoMap = currentBgIndex === 0 ? '0:v' : `[bg${currentBgIndex}]`;
    const finalAudioMap = audioStreams.length > 0 ? '[final_audio]' : '1:a';

    if (filterComplex && filterComplex.endsWith(';')) filterComplex = filterComplex.slice(0, -1);

    if (filterComplex) {
      command.push('-filter_complex', filterComplex);
    }

    const outputFileName = 'output.mp4';

    command.push(
      '-map', finalVideoMap,
      '-map', finalAudioMap, 
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-t', durationSec.toString(),
      outputFileName
    );

    console.error("[FFmpeg Command]", command.join(' '));
    const retCode = await ff.exec(command);
    if (retCode !== 0) {
      throw new Error(`FFmpeg command failed with code ${retCode}. Check browser console for logs.`);
    }

    // Read and clean up
    const data = await ff.readFile(outputFileName);
    const blob = new Blob([data.buffer], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);

    for (const f of filesToDelete) {
       try { await ff.deleteFile(f); } catch(e){}
    }
    try { await ff.deleteFile(outputFileName); } catch(e){}

    const a = document.createElement('a');
    a.href = url;
    a.download = `pro-edit-ffmpeg-${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Clean up VFS
    for (const f of filesToDelete) {
      try { await ff.deleteFile(f); } catch (e) {}
    }
    try { await ff.deleteFile(outputFileName); } catch (e) {}

    return true;
  } catch (error) {
    console.error("FFmpeg Export Error Detailed:", error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(typeof error === 'string' ? error : JSON.stringify(error));
    }
  }
};

