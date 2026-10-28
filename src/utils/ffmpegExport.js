import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import Konva from 'konva';
import { generateGridImage } from './gridHelper';
import { isGifUrl } from './gif';
import { ExportCancelledError, etaSeconds, overallPercent, parseFfmpegTime } from './exportProgress';
import { downloadBlob } from './shareFile';
import { drawOrder } from './layerOrder';
import { captionFrames, concatList, splitCaptionTrack } from './captionTrack';
import { REST_FRAME, applyTextFrame } from './textAnimation';
import { audioExtension, createExportGraph, outputSize, textStills, visualSize } from './exportGraph';
import { hasTextBox, textAttrs, textBoxAttrs } from './textLayer';

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

// FFmpeg WASM can't decode SVG, so SVG stickers are drawn to a w x h PNG first (null on failure).
const rasterizeSvg = (url, w, h) => new Promise((resolve) => {
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
  img.src = url;
});

// Text drawn with Konva into a transparent w x h PNG, at one animation frame, from the same
// definitions as the preview (textLayer). `ratio` converts the 800-wide preview to the output.
// Empty on failure.
const renderTextToPNG = (item, w, h, ratio, frame = REST_FRAME) => new Promise((resolve) => {
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

    const textNode = new Konva.Text({ ...textAttrs(item, ratio), scaleX: 1, scaleY: 1 });
    if (hasTextBox(item)) {
      group.add(new Konva.Rect(textBoxAttrs(item, { x: textNode.x(), y: textNode.y(), width: textNode.width(), height: textNode.height() }, ratio)));
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
        const a = textAttrs(item, ratio);
        ctx.font = `bold ${a.fontSize}px ${a.fontFamily}`;
        ctx.fillStyle = a.fill;
        ctx.strokeStyle = a.stroke;
        ctx.lineWidth = a.strokeWidth;
        ctx.strokeText(a.text, a.x, a.y + a.fontSize);
        ctx.fillText(a.text, a.x, a.y + a.fontSize);
        canvas.toBlob(blob => {
          if (blob) {
            blob.arrayBuffer().then(buf => resolve(new Uint8Array(buf))).catch(() => resolve(new Uint8Array(0)));
          } else {
            resolve(new Uint8Array(0));
          }
        });
        return;
      }
    } catch { /* fall through to empty */ }
    resolve(new Uint8Array(0));
  }
});

// The whole render in FFmpeg: fetches each clip into FFmpeg's file system and hands it to the
// command builder (exportGraph), then runs FFmpeg. Used for GIFs, and for MP4s when the browser
// can't encode them itself.
const exportWithFFmpeg = async (items = [], durationMs = 7000, canvasAspectRatio = 16/9, canvasDimensions = { width: 800, height: 600 }, layoutId = null, onProgress = () => {}, { format = 'mp4', backgroundColor = '#ffffff', download = true, resolution = 720 } = {}) => {
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
    const { width: canvasW, height: canvasH } = outputSize(canvasAspectRatio, resolution);
    const canvasWidthRef = (canvasDimensions && typeof canvasDimensions.width === 'number' && canvasDimensions.width > 0) ? canvasDimensions.width : 800;
    const konvaRatio = canvasW / canvasWidthRef;

    const graph = createExportGraph({ width: canvasW, height: canvasH, durationMs: safeDurationMs, backgroundColor, gifOut: isGifOut });
    const filesToDelete = [];
    const writeFile = async (name, data) => {
      await ff.writeFile(name, data);
      filesToDelete.push(name);
    };

    const visualItems = items.filter(item => !item.hidden && (item.type === 'video' || item.type === 'image' || item.type === 'sticker'));
    // Auto captions share one image-sequence input (see captionTrack); other text is one input each.
    const { track: captionTrack, rest: textItems } = splitCaptionTrack(items.filter(item => !item.hidden && item.type === 'text'));
    const audioItems = items.filter(item => !item.hidden && item.type === 'audio');

    // Preparing progress: one step per clip as its input is fetched or drawn.
    const prepTotal = Math.max(1, items.filter((i) => !i.hidden && i.type !== 'audio').length + (isGifOut ? 0 : audioItems.length));
    let prepDone = 0;
    const prepStep = () => {
      checkCancel();
      report('preparing', prepDone / prepTotal);
      prepDone++;
    };

    // One photo, video or sticker. Clips that fail to load are left out.
    const addVisual = async (item) => {
      if (!item.url) return;
      const isVideo = item.type === 'video';
      // Animated GIF stickers are timed like video (they start playing at the clip's start).
      const isGif = !isVideo && (item.isGif || isGifUrl(item.url));

      let fileData;
      try {
        if (!isVideo && (item.url.startsWith('data:image/svg') || item.url.toLowerCase().endsWith('.svg'))) {
          const { w, h } = visualSize(item, konvaRatio);
          fileData = await rasterizeSvg(item.url, w, h);
        } else {
          fileData = await fetchFile(item.url);
        }
      } catch (err) {
        console.warn(`[FFmpeg Export] Could not fetch visual item from ${item.url}:`, err);
        return;
      }
      if (!fileData || fileData.byteLength === 0) return;

      const n = graph.nextIndex;
      const fileName = isVideo ? `input_${n}.mp4` : isGif ? `input_${n}.gif` : `input_${n}.png`;
      await writeFile(fileName, fileData);

      let hasAudio = false;
      if (isVideo && !item.muted && !isGifOut) {
        try {
          // Use FFmpeg to quickly check if an audio stream exists in this file
          hasAudio = await ff.exec(['-i', fileName, '-map', '0:a', '-c', 'copy', '-f', 'null', '-']) === 0;
        } catch (e) {
          console.warn(`[FFmpeg Export] FFmpeg probe for audio failed:`, e);
        }
      }
      graph.addVisual(item, { fileName, kind: isVideo ? 'video' : isGif ? 'gif' : 'still', hasAudio, ratio: konvaRatio, items });
    };

    // Text goes in as full-canvas PNGs for exact fonts, stroke and rotation; animated text is a run
    // of stills (pop, typewriter) or one still moved by overlay expressions (shake).
    const addText = async (item) => {
      for (const still of textStills(item, safeDurationMs, konvaRatio)) {
        const fileName = `text_${graph.nextIndex}.png`;
        const pngData = await renderTextToPNG(item, canvasW, canvasH, konvaRatio, still.frame);
        if (!pngData || pngData.byteLength === 0) continue;
        await writeFile(fileName, pngData);
        graph.addStill(fileName, still.position, still.enable);
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
        await writeFile(fileName, await renderTextToPNG(f.item, canvasW, canvasH, konvaRatio, f.frame));
        files.push(fileName);
      }
      const blank = 'cap_blank.png';
      await writeFile(blank, await renderTextToPNG({ text: ' ', stroke: 'transparent', color: 'transparent' }, canvasW, canvasH, konvaRatio));
      await writeFile('captions.txt', new TextEncoder().encode(concatList(frames, files, blank, safeDurationMs)));
      graph.addCaptionTrack('captions.txt');
    }

    // The multi-panel layout's divider lines, over everything.
    const gridDataUrl = layoutId ? generateGridImage(layoutId, canvasW, canvasH) : null;
    if (gridDataUrl) {
      try {
        const res = await fetch(gridDataUrl);
        const fileData = new Uint8Array(await res.arrayBuffer());
        if (fileData.byteLength > 0) {
          const fileName = `grid_${graph.nextIndex}.png`;
          await writeFile(fileName, fileData);
          graph.addStill(fileName);
        }
      } catch (err) {
        console.warn('[FFmpeg Export] Grid layout generation skipped:', err);
      }
    }

    // Standalone sounds (effects, music, voiceovers). GIFs are silent.
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
      const fileName = `audio_${graph.nextIndex}.${audioExtension(item)}`;
      await writeFile(fileName, fileData);
      graph.addAudio(item, fileName);
    }

    const { command, outputFileName, durationSec } = graph.finish({ resolution });

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
         try { await ff.deleteFile(f); } catch { /* already gone */ }
      }
      try { await ff.deleteFile(outputFileName); } catch { /* already gone */ }
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

const safeDuration = (ms) => ((typeof ms === 'number' && !isNaN(ms) && ms > 0) ? ms : 7000);

// The finished file, saved straight away unless the caller shares or saves it itself.
const deliver = (data, download) => {
  const blob = new Blob([data], { type: 'video/mp4' });
  const fileName = `meme-studio-${Date.now()}.mp4`;
  if (download) downloadBlob(blob, fileName);
  return { blob, fileName };
};

// Mixes the clips' sound onto an encoded, silent picture with FFmpeg (the picture is copied, not
// re-encoded). onProgress gets 0..1 through the mix.
const mixSound = async (picture, sounds, { width, height, durationMs, onProgress, checkCancel }) => {
  const ff = await loadFFmpeg();
  checkCancel();
  const graph = createExportGraph({ width, height, durationMs, encodedVideo: 'picture.mp4' });
  const files = [];
  const write = async (name, data) => {
    await ff.writeFile(name, data);
    files.push(name);
  };
  try {
    await write('picture.mp4', picture);
    for (const item of sounds) {
      checkCancel();
      let data;
      try {
        data = await fetchFile(item.url);
      } catch (err) {
        console.warn(`[export] Could not fetch the sound of ${item.url}:`, err);
        continue;
      }
      if (!data || data.byteLength === 0) continue;
      if (item.type === 'video') {
        const name = `input_${graph.nextIndex}.mp4`;
        await write(name, data);
        let hasAudio = false;
        try {
          hasAudio = await ff.exec(['-i', name, '-map', '0:a', '-c', 'copy', '-f', 'null', '-']) === 0;
        } catch { /* no sound track */ }
        if (hasAudio) graph.addVideoSoundtrack(item, name);
      } else {
        // Recordings and uploads are blob: URLs with no extension; their stored type names the file.
        const name = `audio_${graph.nextIndex}.${audioExtension(item)}`;
        await write(name, data);
        graph.addAudio(item, name);
      }
    }
    const { command, outputFileName, durationSec } = graph.finish();
    if (import.meta.env?.DEV) console.log('[FFmpeg mix]', command.join(' '));
    const onLog = ({ message }) => {
      const t = parseFfmpegTime(message);
      if (t !== null) onProgress(t / durationSec);
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
    if (retCode !== 0) throw new Error(`FFmpeg sound mix failed with code ${retCode}`);
    files.push(outputFileName);
    return await ff.readFile(outputFileName);
  } finally {
    for (const f of files) {
      try { await ff.deleteFile(f); } catch { /* already gone */ }
    }
  }
};

// MP4 drawn frame by frame with the preview's own renderer and encoded by the browser
// (webCodecsExport), with the sound mixed in by FFmpeg (skipped, with FFmpeg never loaded, when
// the project is silent).
const exportWithWebCodecs = async (items, durationMs, canvasAspectRatio, layoutId, onProgress, { backgroundColor = '#ffffff', download = true, resolution = 720, layoutSlots = [] } = {}) => {
  cancelRequested = false;
  let phaseStart = performance.now();
  const report = (phase, fraction) => onProgress(overallPercent(phase, fraction), { phase, etaSec: etaSeconds(performance.now() - phaseStart, fraction) });
  const checkCancel = () => { if (cancelRequested) throw new ExportCancelledError(); };
  report('preparing', 0);

  const safeDurationMs = safeDuration(durationMs);
  const aspect = (typeof canvasAspectRatio === 'number' && canvasAspectRatio > 0) ? canvasAspectRatio : 16 / 9;
  const { width, height } = outputSize(aspect, resolution);
  const sounds = items.filter((i) => !i.hidden && !i.muted && i.url && (i.type === 'video' || i.type === 'audio'));
  // With sound to mix, drawing the picture is most of the work and the mix the last 10%.
  const pictureShare = sounds.length ? 0.9 : 1;

  const { encodeProjectVideo } = await import('./webCodecsExport');
  const picture = await encodeProjectVideo({
    items, width, height, aspect, durationMs: safeDurationMs, backgroundColor, layoutId, layoutSlots,
    onLoaded: () => {
      report('preparing', 1);
      phaseStart = performance.now();
    },
    onFrame: (done, total) => report('rendering', (done / total) * pictureShare),
    isCancelled: () => cancelRequested,
  });
  checkCancel();
  const file = sounds.length
    ? await mixSound(picture, sounds, {
      width, height, durationMs: safeDurationMs, checkCancel,
      onProgress: (f) => report('rendering', pictureShare + (1 - pictureShare) * Math.min(1, f)),
    })
    : picture;
  report('rendering', 1);
  return deliver(file, download);
};

// Renders the project to an MP4 (or, with format 'gif', a silent palette-optimised GIF) and returns
// { blob, fileName }. MP4s are drawn frame by frame with the preview's own renderer and encoded by
// the browser (WebCodecs) when it can; otherwise, or if that fails part-way, FFmpeg renders the
// whole thing. Options: { format, resolution, backgroundColor, download, layoutSlots,
// encoder: 'auto' | 'ffmpeg' }.
export const exportVideoFFmpeg = async (items = [], durationMs = 7000, canvasAspectRatio = 16/9, canvasDimensions = { width: 800, height: 600 }, layoutId = null, onProgress = () => {}, options = {}) => {
  const { format = 'mp4', resolution = 720, encoder = 'auto' } = options;
  if (format !== 'gif' && encoder !== 'ffmpeg') {
    const { width, height } = outputSize(canvasAspectRatio, resolution);
    const { canEncodeMp4 } = await import('./webCodecsExport');
    if (await canEncodeMp4(width, height)) {
      try {
        return await exportWithWebCodecs(items, durationMs, canvasAspectRatio, layoutId, onProgress, options);
      } catch (error) {
        if (cancelRequested || error instanceof ExportCancelledError) throw new ExportCancelledError();
        console.warn('[export] Frame-by-frame export failed; rendering with FFmpeg instead.', error);
      }
    }
  }
  return exportWithFFmpeg(items, durationMs, canvasAspectRatio, canvasDimensions, layoutId, onProgress, options);
};
