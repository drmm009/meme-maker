import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import Konva from 'konva';
import { generateGridImage } from './gridHelper';
import { fadeFilter } from './audioFades';
import { chromaKeyFilter } from './chromaKey';
import { gifPaletteFilter, isGifUrl } from './gif';
import { ExportCancelledError, etaSeconds, overallPercent, parseFfmpegTime } from './exportProgress';
import { downloadBlob } from './shareFile';
import { clipPunchTimes, punchFilter } from './zoomPunch';
import { drawOrder } from './layerOrder';
import { filterChain, resolveFilter } from './clipFilters';
import { extensionForType } from './voiceRecorder';
import { transitionFilters } from './clipTransitions';
import { captionFrames, concatList, splitCaptionTrack } from './captionTrack';
import { REST_FRAME, animationSteps, applyTextFrame, shakeExpressions } from './textAnimation';

let ffmpeg = null;
let loadPromise = null;
let cancelRequested = false;

// FFmpeg's chatter (version banner, stream info, a progress line per frame) used to go to console.error
// on every export. The last lines are kept for failures instead.
const RECENT_LOG_LINES = 60;
const recentLog = [];
export const recentFfmpegLog = () => recentLog.slice();

// Stop the running export: FFmpeg's worker is terminated (the next export loads a fresh one).
export const cancelExport = () => {
  cancelRequested = true;
  if (ffmpeg) {
    try { ffmpeg.terminate(); } catch { /* already gone */ }
    ffmpeg = null;
    loadPromise = null;
  }
};

export const loadFFmpeg = async () => {
  if (ffmpeg && ffmpeg.loaded) return ffmpeg;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const ff = new FFmpeg();
      ff.on('log', ({ message }) => {
        // Kept quietly; printed only when a job fails (see recentFfmpegLog).
        recentLog.push(message);
        if (recentLog.length > RECENT_LOG_LINES) recentLog.shift();
      });
      
      const baseUrl = import.meta.env.BASE_URL || './';
      const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
      const coreHref = new URL(`${cleanBase}ffmpeg/ffmpeg-core.js`, window.location.href).href;
      const wasmHref = new URL(`${cleanBase}ffmpeg/ffmpeg-core.wasm`, window.location.href).href;

      try {
        const coreURL = await toBlobURL(coreHref, 'text/javascript');
        const wasmURL = await toBlobURL(wasmHref, 'application/wasm');
        await ff.load({ coreURL, wasmURL });
      } catch (localErr) {
        console.warn('[FFmpeg] Local load failed, falling back to CDN for mobile...', localErr);
        const cdnCore = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js';
        const cdnWasm = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm';
        const coreURL = await toBlobURL(cdnCore, 'text/javascript');
        const wasmURL = await toBlobURL(cdnWasm, 'application/wasm');
        await ff.load({ coreURL, wasmURL });
      }

      ffmpeg = ff;
      return ff;
    } catch (error) {
      loadPromise = null;
      throw error;
    }
  })();

  return loadPromise;
};

// #rrggbb -> FFmpeg 0xRRGGBB (anything else falls back to white).
const ffmpegColor = (hex) => (/^#[0-9a-f]{6}$/i.test(hex || '') ? `0x${hex.slice(1).toUpperCase()}` : 'white');

// format 'gif' renders a silent, palette-optimised GIF instead of an MP4.
export const exportVideoFFmpeg = async (items = [], durationMs = 7000, canvasAspectRatio = 16/9, canvasDimensions = { width: 800, height: 600 }, layoutId = null, onProgress = () => {}, { format = 'mp4', backgroundColor = '#ffffff', download = true, resolution = 720 } = {}) => {
  const isGifOut = format === 'gif';
  try {
    cancelRequested = false;
    // onProgress(percent 0..100, { phase: 'preparing' | 'rendering', etaSec })
    let phaseStart = performance.now();
    const report = (phase, fraction) => onProgress(overallPercent(phase, fraction), { phase, etaSec: etaSeconds(performance.now() - phaseStart, fraction) });
    const checkCancel = () => { if (cancelRequested) throw new ExportCancelledError(); };
    report('preparing', 0);
    const ff = await loadFFmpeg();
    checkCancel();

    const safeDurationMs = (typeof durationMs === 'number' && !isNaN(durationMs) && durationMs > 0) ? durationMs : 7000;
    const durationSec = Math.max(0.1, safeDurationMs / 1000);
    
    // Output canvas: 720p (long side 1280) or 1080p (long side 1920), shaped by the aspect ratio.
    const safeAspect = (typeof canvasAspectRatio === 'number' && !isNaN(canvasAspectRatio) && canvasAspectRatio > 0) ? canvasAspectRatio : (16 / 9);
    const longSide = resolution >= 1080 ? 1920 : 1280;
    let canvasW;
    let canvasH;
    if (safeAspect < 1) {
      canvasH = longSide;
      canvasW = Math.round(longSide * safeAspect);
    } else {
      canvasW = longSide;
      canvasH = Math.round(longSide / safeAspect);
    }
    
    // Ensure even dimensions
    canvasW = Math.max(2, Math.round(canvasW / 2) * 2);
    canvasH = Math.max(2, Math.round(canvasH / 2) * 2);
    const canvasWidthRef = (canvasDimensions && typeof canvasDimensions.width === 'number' && canvasDimensions.width > 0) ? canvasDimensions.width : 800;
    const konvaRatio = canvasW / canvasWidthRef;

    const command = [
      '-f', 'lavfi',
      '-i', `color=c=${ffmpegColor(backgroundColor)}:s=${canvasW}x${canvasH}:d=${durationSec}`,
      '-f', 'lavfi',
      '-i', `anullsrc=r=44100:cl=stereo:d=${durationSec}`
    ];

    let filterComplex = '';
    let currentBgIndex = 0; // Starts from [0:v] which is our white color layer
    let inputIndex = 2; // 0=color, 1=anullsrc
    const audioStreams = [];
    const filesToDelete = [];

    const visualItems = items.filter(item => !item.hidden && (item.type === 'video' || item.type === 'image' || item.type === 'sticker'));
    // Auto captions share one image-sequence input (see captionTrack); other text is one input each.
    const { track: captionTrack, rest: textItems } = splitCaptionTrack(items.filter(item => !item.hidden && item.type === 'text'));

    // Preparing progress: one step per clip as its input is fetched or drawn.
    const prepTotal = Math.max(1, items.filter((i) => !i.hidden && i.type !== 'audio').length + (isGifOut ? 0 : items.filter((i) => !i.hidden && i.type === 'audio').length));
    let prepDone = 0;
    const prepStep = () => {
      checkCancel();
      report('preparing', prepDone / prepTotal);
      prepDone++;
    };

    // One photo, video or sticker: fetch it, scale/position it, overlay it for its time range.
    const addVisual = async (item) => {
      if (!item.url) return;
      
      const isVideo = item.type === 'video';
      // Animated GIF stickers are timed like video (they start playing at the clip's start).
      const isGif = !isVideo && (item.isGif || isGifUrl(item.url));
      
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
        return;
      }
      if (!fileData || fileData.byteLength === 0) return;

      const fileName = isVideo ? `input_${inputIndex}.mp4` : isGif ? `input_${inputIndex}.gif` : `input_${inputIndex}.png`;
      await ff.writeFile(fileName, fileData);
      filesToDelete.push(fileName);

      if (isGif) {
        command.push('-ignore_loop', '0', '-i', fileName);
      } else if (!isVideo) {
        command.push('-loop', '1', '-i', fileName);
      } else {
        const trimStartSec = Math.max(0, (typeof item.trimStartMs === 'number' && !isNaN(item.trimStartMs) ? item.trimStartMs : 0) / 1000);
        if (trimStartSec > 0) {
          command.push('-ss', trimStartSec.toString());
        }
        command.push('-i', fileName);

        if (!item.muted && !isGifOut) {
          let videoHasAudio = false;
          try {
            // Use FFmpeg to quickly check if an audio stream exists in this file
            const ret = await ff.exec(['-i', fileName, '-map', '0:a', '-c', 'copy', '-f', 'null', '-']);
            videoHasAudio = ret === 0;
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
            filterComplex += `[${inputIndex}:a]atrim=0:${sourceTrimSec},asetpts=PTS-STARTPTS,aformat=channel_layouts=stereo:sample_rates=44100${atempo}${fadeFilter(item, timelineDurSec)}${delayFilter},volume=${vol}[aud${inputIndex}];`;
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
      const ptsOffset = isVideo || isGif ? `+${startT}/TB` : '';
      const keyFilter = isVideo ? chromaKeyFilter(item.chromaKey) : '';
      // Transitions at cuts in the main sequence (fade via alpha, zoom, slide as an x offset).
      const transition = isVideo || item.isFreeze ? transitionFilters(items, item, w, h, konvaRatio) : { chain: '', dx: null };
      const overlayPos = transition.dx ? `x='${x}+(${transition.dx})':y=${y}` : `${x}:${y}`;
      // Colour filters on videos and photos (not stickers), after keying like the preview.
      const colourFilter = isVideo || (item.type === 'image' && !isGif) ? filterChain(resolveFilter(item.filter)) : '';
      filterComplex += `[${inputIndex}:v]setpts=(PTS-STARTPTS)/${pbRate}${ptsOffset},scale=${w}:${h}${isVideo ? punchFilter(clipPunchTimes(item), w, h) : ''}${keyFilter}${colourFilter}${transition.chain}[vis${inputIndex}];`;
      filterComplex += `[${currentBgIndex === 0 ? '0:v' : `bg${currentBgIndex}`}][vis${inputIndex}]overlay=${overlayPos}:enable='between(t,${startT},${endT})':eof_action=pass:shortest=0[bg${currentBgIndex + 1}];`;
      
      currentBgIndex++;
      inputIndex++;
    };

    // Helper to render text into a transparent PNG buffer matching the output resolution
    const renderTextToPNG = async (item, w, h, ratio, frame = REST_FRAME) => {
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
          const group = new Konva.Group();

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
            group.add(bgRect);
          }

          group.add(textNode);
          layer.add(group);
          // Animation frame (offsets are in 800-wide stage units, like item.x).
          applyTextFrame(group, textNode, { ...frame, dx: frame.dx * ratio, dy: frame.dy * ratio });
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
          } catch {}
          resolve(new Uint8Array(0));
        }
      });
    };

    // Add text items via PNG overlay for pixel-perfect font, stroke, and rotation support.
    // Animated text is a run of stills (pop, typewriter); shake moves one still with overlay expressions.
    const addText = async (item) => {
      const startT = Math.max(0, (typeof item.startMs === 'number' && !isNaN(item.startMs) ? item.startMs : 0) / 1000);
      const endT = Math.max(startT + 0.05, (typeof item.endMs === 'number' && !isNaN(item.endMs) ? item.endMs : safeDurationMs) / 1000);
      const steps = animationSteps({ ...item, startMs: startT * 1000, endMs: endT * 1000 });
      const shake = item.animation === 'shake' ? shakeExpressions(item, startT, konvaRatio) : null;
      const position = shake ? `x='${shake.x}':y='${shake.y}'` : '0:0';

      for (const [i, step] of steps.entries()) {
        const fromT = (startT + step.fromMs / 1000).toFixed(3);
        const toT = Math.min(endT, startT + step.toMs / 1000).toFixed(3);
        const fileName = `text_${inputIndex}.png`;
        const pngData = await renderTextToPNG(item, canvasW, canvasH, konvaRatio, step.frame);
        if (!pngData || pngData.byteLength === 0) continue;

        await ff.writeFile(fileName, pngData);
        filesToDelete.push(fileName);

        command.push('-loop', '1', '-i', fileName);

        // Steps hand over exactly (gte/lt); the last one runs to the clip's end inclusive.
        const enable = i === steps.length - 1 ? `between(t,${fromT},${toT})` : `gte(t,${fromT})*lt(t,${toT})`;
        filterComplex += `[${currentBgIndex === 0 ? '0:v' : `bg${currentBgIndex}`}][${inputIndex}:v]overlay=${position}:enable='${enable}':eof_action=pass:shortest=0[bg${currentBgIndex + 1}];`;

        currentBgIndex++;
        inputIndex++;
      }
    };

    // Everything visible, bottom to top in the same order as the preview.
    for (const item of drawOrder([...visualItems, ...textItems])) {
      prepStep();
      if (item.type === 'text') await addText(item);
      else await addVisual(item);
    }

    // Auto captions on top: every frame as a full-canvas PNG, played back as one concat input.
    if (captionTrack.length > 0) {
      const frames = captionFrames(captionTrack);
      const files = [];
      for (const [i, f] of frames.entries()) {
        if (i === 0 || frames[i - 1].item !== f.item) prepStep();
        const fileName = `cap_${i}.png`;
        await ff.writeFile(fileName, await renderTextToPNG(f.item, canvasW, canvasH, konvaRatio, f.frame));
        filesToDelete.push(fileName);
        files.push(fileName);
      }
      const blank = 'cap_blank.png';
      await ff.writeFile(blank, await renderTextToPNG({ text: ' ', stroke: 'transparent', color: 'transparent' }, canvasW, canvasH, konvaRatio));
      await ff.writeFile('captions.txt', new TextEncoder().encode(concatList(frames, files, blank, safeDurationMs)));
      filesToDelete.push(blank, 'captions.txt');
      command.push('-f', 'concat', '-safe', '0', '-i', 'captions.txt');
      filterComplex += `[${inputIndex}:v]fps=30,format=rgba[cap${inputIndex}];`;
      filterComplex += `[${currentBgIndex === 0 ? '0:v' : `bg${currentBgIndex}`}][cap${inputIndex}]overlay=0:0:eof_action=pass:shortest=0[bg${currentBgIndex + 1}];`;
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
    const audioItems = items.filter(item => !item.hidden && item.type === 'audio');
    for (const item of audioItems) {
      if (!isGifOut) prepStep();
      if (!item.url || isGifOut) continue;
      let fileData;
      try {
        fileData = await fetchFile(item.url);
      } catch (err) {
        console.warn(`[FFmpeg Export] Could not fetch audio from ${item.url}:`, err);
        continue;
      }
      if (!fileData || fileData.byteLength === 0) continue;

      // Recordings and uploads are blob: URLs with no extension; their stored type names the file.
      let ext = item.mimeType ? extensionForType(item.mimeType) : 'mp3';
      if (item.url && !item.mimeType) {
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
        filterComplex += `[${inputIndex}:a]atrim=0:${clipDurSec},asetpts=PTS-STARTPTS${atempoFilter},aformat=channel_layouts=stereo:sample_rates=44100${fadeFilter(item, clipDurSec / rate)}${delayFilter},volume=${vol}[aud${inputIndex}];`;
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

    let finalVideoMap = currentBgIndex === 0 ? '0:v' : `[bg${currentBgIndex}]`;
    if (isGifOut) {
      filterComplex += `${gifPaletteFilter(currentBgIndex === 0 ? '[0:v]' : finalVideoMap, canvasW, canvasH, '[gifout]')};`;
      finalVideoMap = '[gifout]';
    }
    const finalAudioMap = audioStreams.length > 0 ? '[final_audio]' : '1:a';

    if (filterComplex && filterComplex.endsWith(';')) filterComplex = filterComplex.slice(0, -1);

    if (filterComplex) {
      command.push('-filter_complex', filterComplex);
    }

    const outputFileName = isGifOut ? 'output.gif' : 'output.mp4';

    if (isGifOut) {
      command.push('-map', finalVideoMap, '-loop', '0', '-t', durationSec.toString(), outputFileName);
    } else {
      command.push(
        '-map', finalVideoMap,
        '-map', finalAudioMap, 
        '-c:v', 'libx264',
        // 720p favours speed; 1080p a better encode (slower, smaller for its quality).
        ...(resolution >= 1080 ? ['-preset', 'veryfast', '-crf', '21'] : ['-preset', 'ultrafast']),
        '-c:a', 'aac',
        '-b:a', '192k',
        '-t', durationSec.toString(),
        outputFileName
      );
    }

    if (import.meta.env?.DEV) console.log("[FFmpeg Command]", command.join(' '));
    checkCancel();
    phaseStart = performance.now();
    report('rendering', 0);
    const onLog = ({ message }) => {
      const t = parseFfmpegTime(message);
      if (t !== null) report('rendering', t / durationSec);
    };
    ff.on('log', onLog);
    let retCode;
    try {
      retCode = await ff.exec(command);
    } catch (e) {
      if (cancelRequested) throw new ExportCancelledError();
      throw e;
    } finally {
      try { ff.off('log', onLog); } catch { /* terminated */ }
    }
    if (retCode !== 0) {
      throw new Error(`FFmpeg command failed with code ${retCode}. Check browser console for logs.`);
    }

    report('rendering', 1);

    // Read and clean up
    const data = await ff.readFile(outputFileName);
    const blob = new Blob([data.buffer], { type: isGifOut ? 'image/gif' : 'video/mp4' });
    const fileName = `meme-studio-${Date.now()}.${isGifOut ? 'gif' : 'mp4'}`;

    try {
      if (download) downloadBlob(blob, fileName);
    } finally {
      for (const f of filesToDelete) {
         try { await ff.deleteFile(f); } catch {}
      }
      try { await ff.deleteFile(outputFileName); } catch {}
    }

    // The caller can share or save the file itself (pass download: false).
    return { blob, fileName };
  } catch (error) {
    if (cancelRequested || error instanceof ExportCancelledError) throw new ExportCancelledError();
    console.error('[FFmpeg Export] failed:', error, `\nLast FFmpeg output:\n${recentLog.slice(-20).join('\n')}`);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(typeof error === 'string' ? error : JSON.stringify(error));
    }
  }
};

