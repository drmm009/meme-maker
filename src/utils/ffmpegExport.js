import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

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
      
      const coreURL = await toBlobURL(new URL('/ffmpeg/ffmpeg-core.js', window.location.origin).href, 'text/javascript');
      const wasmURL = await toBlobURL(new URL('/ffmpeg/ffmpeg-core.wasm', window.location.origin).href, 'application/wasm');

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

import { generateGridImage } from './gridHelper';

export const exportVideoFFmpeg = async (items, durationMs, canvasAspectRatio, canvasDimensions, layoutId, onProgress) => {
  try {
    const ff = await loadFFmpeg();
    ff.on('progress', ({ progress }) => {
      onProgress(progress * 100);
    });

    const durationSec = durationMs / 1000;
    
    // We target 1280x720 canvas in FFmpeg (or scaled by aspect ratio)
    let canvasW = 1280;
    let canvasH = 720;
    if (canvasAspectRatio < 1) {
      canvasH = 1280;
      canvasW = 1280 * canvasAspectRatio;
    } else {
      canvasW = 1280;
      canvasH = 1280 / canvasAspectRatio;
    }
    
    // Ensure even dimensions
    canvasW = Math.trunc(canvasW / 2) * 2;
    canvasH = Math.trunc(canvasH / 2) * 2;
    const konvaRatio = canvasW / (canvasDimensions?.width || 800);

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

    // Write font file for text
    const fontData = await fetchFile('/Roboto-Regular.ttf');
    await ff.writeFile('Roboto-Regular.ttf', fontData);
    filesToDelete.push('Roboto-Regular.ttf');

    const visualItems = items.filter(item => item.type === 'video' || item.type === 'image' || item.type === 'sticker');
    const textItems = items.filter(item => item.type === 'text');

    for (const item of visualItems) {
      if (!item.url) continue;
      const fileData = await fetchFile(item.url);
      if (fileData.byteLength === 0) continue;

      const isVideo = item.type === 'video';
      const fileName = isVideo ? `input_${inputIndex}.mp4` : `input_${inputIndex}.png`;
      await ff.writeFile(fileName, fileData);
      filesToDelete.push(fileName);

      if (!isVideo) {
        command.push('-loop', '1', '-i', fileName);
      } else {
        const trimStartSec = (item.trimStartMs || 0) / 1000;
        if (trimStartSec > 0) {
          command.push('-ss', trimStartSec.toString());
        }
        command.push('-i', fileName);

        if (!item.muted) {
          let videoHasAudio = false;
          try {
            const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
            if (AudioCtxClass) {
              const tempCtx = new AudioCtxClass();
              const decoded = await tempCtx.decodeAudioData(fileData.buffer.slice(0));
              if (decoded && decoded.numberOfChannels > 0 && decoded.length > 0) {
                videoHasAudio = true;
              }
              tempCtx.close().catch(() => {});
            }
          } catch (e) {
            videoHasAudio = false;
          }

          if (videoHasAudio) {
            const startMs = Math.max(0, Math.round(item.startMs || 0));
            const clipDurSec = Math.max(0.1, (item.endMs - item.startMs) / 1000);
            const vol = item.volume !== undefined ? item.volume : 1.0;
            const delayFilter = startMs > 0 ? `,adelay=${startMs}|${startMs}` : '';
            filterComplex += `[${inputIndex}:a]atrim=0:${clipDurSec},asetpts=PTS-STARTPTS,aformat=channel_layouts=stereo:sample_rates=44100${delayFilter},volume=${vol}[aud${inputIndex}];`;
            audioStreams.push(`[aud${inputIndex}]`);
          }
        }
      }

      const startT = item.startMs / 1000;
      const endT = item.endMs / 1000;
      
      const w = Math.round((item.width || 100) * (item.scaleX || item.scale || 1) * konvaRatio);
      const h = Math.round((item.height || 100) * (item.scaleY || item.scale || 1) * konvaRatio);
      const x = Math.round((item.x || 0) * konvaRatio);
      const y = Math.round((item.y || 0) * konvaRatio);

      // Force scale and correctly offset PTS so delayed videos don't expire before their start time
      filterComplex += `[${inputIndex}:v]setpts=PTS-STARTPTS+${startT}/TB,scale=${w}:${h}[vis${inputIndex}];`;
      
      // Removed eof_action=pass so that if the video finishes playing before endT, it holds its last frame (default repeat behavior)
      filterComplex += `[${currentBgIndex === 0 ? '0:v' : `bg${currentBgIndex}`}][vis${inputIndex}]overlay=${x}:${y}:enable='between(t,${startT},${endT})'[bg${currentBgIndex + 1}];`;
      
      currentBgIndex++;
      inputIndex++;
    }

    // Helper to render text into a transparent PNG buffer matching the output resolution
    const renderTextToPNG = async (item, w, h, ratio) => {
      return new Promise((resolve) => {
        const container = document.createElement('div');
        document.body.appendChild(container); // Append temporarily to ensure font loading context
        container.style.display = 'none';

        const stage = new Konva.Stage({ container, width: w, height: h });
        const layer = new Konva.Layer();
        stage.add(layer);

        const textNode = new Konva.Text({
          x: (item.x || 0) * ratio,
          y: (item.y || 0) * ratio,
          text: item.text || 'Sample Text',
          fontSize: (item.fontSize || 32) * ratio,
          fontFamily: item.fontFamily || 'Impact, sans-serif',
          fontStyle: 'bold',
          fill: item.color || '#ffffff',
          stroke: item.stroke || '#000000',
          strokeWidth: (item.strokeWidth || Math.max(2, (item.fontSize || 32) / 25)) * ratio,
          width: item.width ? item.width * ratio : undefined,
          align: item.align || 'center',
          rotation: item.rotation || 0,
          scaleX: 1, 
          scaleY: 1,
          letterSpacing: (-(item.fontSize || 32) * 0.05) * ratio,
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
        document.body.removeChild(container);

        fetch(dataURL)
          .then(res => res.arrayBuffer())
          .then(buffer => resolve(new Uint8Array(buffer)));
      });
    };

    // Add text items via PNG overlay for pixel-perfect font, stroke, and rotation support
    for (const item of textItems) {
      const startT = item.startMs / 1000;
      const endT = item.endMs / 1000;
      
      const fileName = `text_${inputIndex}.png`;
      const pngData = await renderTextToPNG(item, canvasW, canvasH, konvaRatio);
      
      await ff.writeFile(fileName, pngData);
      filesToDelete.push(fileName);
      
      command.push('-loop', '1', '-i', fileName);
      
      filterComplex += `[${currentBgIndex === 0 ? '0:v' : `bg${currentBgIndex}`}][${inputIndex}:v]overlay=0:0:enable='between(t,${startT},${endT})'[bg${currentBgIndex + 1}];`;
      
      currentBgIndex++;
      inputIndex++;
    }

    if (layoutId) {
      const gridDataUrl = generateGridImage(layoutId, canvasW, canvasH);
      if (gridDataUrl) {
        // Fetch the data URL as an ArrayBuffer
        const res = await fetch(gridDataUrl);
        const fileData = new Uint8Array(await res.arrayBuffer());
        
        if (fileData.byteLength > 0) {
          const fileName = `grid_${inputIndex}.png`;
          await ff.writeFile(fileName, fileData);
          filesToDelete.push(fileName);
          
          command.push('-loop', '1', '-i', fileName);
          
          // No need to scale as the grid image is generated exactly at canvasW:canvasH
          filterComplex += `[${currentBgIndex === 0 ? '0:v' : `bg${currentBgIndex}`}][${inputIndex}:v]overlay=0:0[bg${currentBgIndex + 1}];`;
          
          currentBgIndex++;
          inputIndex++;
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

      const trimStartSec = (item.trimStartMs || 0) / 1000;
      if (trimStartSec > 0) {
        command.push('-ss', trimStartSec.toString());
      }
      command.push('-i', fileName);

      if (!item.muted) {
        const startMs = Math.max(0, Math.round(item.startMs || 0));
        const clipDurSec = Math.max(0.05, (item.endMs - item.startMs) / 1000);
        const vol = item.volume !== undefined ? item.volume : 1.0;
        const rate = item.playbackRate || 1;
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
