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

export const exportVideoFFmpeg = async (items, durationMs, canvasAspectRatio, canvasDimensions, onProgress) => {
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
    let primaryAudioIndex = 1; // Default to anullsrc
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
        command.push('-ss', trimStartSec.toString(), '-i', fileName);
        if (primaryAudioIndex === 1) {
          primaryAudioIndex = inputIndex; // Map audio from the first video found
        }
      }

      const startT = item.startMs / 1000;
      const endT = item.endMs / 1000;
      
      const w = Math.round((item.width || 100) * (item.scaleX || item.scale || 1) * konvaRatio);
      const h = Math.round((item.height || 100) * (item.scaleY || item.scale || 1) * konvaRatio);
      const x = Math.round((item.x || 0) * konvaRatio);
      const y = Math.round((item.y || 0) * konvaRatio);

      // Force scale (or maybe use decrease if we want aspect ratio, but we want exact W/H mapped from konva)
      filterComplex += `[${inputIndex}:v]setpts=PTS-STARTPTS,scale=${w}:${h}[vis${inputIndex}];`;
      
      filterComplex += `[${currentBgIndex === 0 ? '0:v' : `bg${currentBgIndex}`}][vis${inputIndex}]overlay=${x}:${y}:enable='between(t,${startT},${endT})'[bg${currentBgIndex + 1}];`;
      
      currentBgIndex++;
      inputIndex++;
    }

    // Add text items
    for (const item of textItems) {
      const startT = item.startMs / 1000;
      const endT = item.endMs / 1000;
      
      const x = Math.round((item.x || 0) * konvaRatio);
      const y = Math.round((item.y || 0) * konvaRatio);
      const fontSize = Math.round((item.fontSize || 32) * (item.scale || 1) * konvaRatio);
      
      const safeText = (item.text || 'Text').replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/:/g, "\\:").replace(/,/g, "\\,");
      
      filterComplex += `[${currentBgIndex === 0 ? '0:v' : `bg${currentBgIndex}`}]drawtext=fontfile=Roboto-Regular.ttf:text='${safeText}':x=${x}:y=${y}:fontsize=${fontSize}:fontcolor=${item.fill || 'black'}:enable='between(t,${startT},${endT})'[bg${currentBgIndex + 1}];`;
      
      currentBgIndex++;
    }

    const finalVideoMap = currentBgIndex === 0 ? '0:v' : `[bg${currentBgIndex}]`;

    if (filterComplex && filterComplex.endsWith(';')) filterComplex = filterComplex.slice(0, -1);

    if (filterComplex) {
      command.push('-filter_complex', filterComplex);
    }

    const outputFileName = 'output.mp4';

    command.push(
      '-map', finalVideoMap,
      '-map', `${primaryAudioIndex}:a?`, 
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-c:a', 'aac',
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
