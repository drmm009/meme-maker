// Animated GIF helpers: GIF export settings, and decoding GIF stickers into frames for the preview.

export const GIF_FPS = 15;
export const GIF_MAX_SIDE = 480;
const DEFAULT_FRAME_MS = 100;
const MAX_FRAMES = 300;

export const isGifUrl = (url) => typeof url === 'string' && /\.gif(\?|#|$)/i.test(url);

// FFmpeg chain that turns a video stream into a good-looking GIF: lower frame rate and size, then a
// palette built from the whole clip (palettegen) applied with light dithering (paletteuse).
export const gifPaletteFilter = (input, width, height, output) => {
  const scale = width >= height ? `${GIF_MAX_SIDE}:-2` : `-2:${GIF_MAX_SIDE}`;
  return `${input}fps=${GIF_FPS},scale=${scale}:flags=lanczos,split[gifa][gifb];`
    + `[gifa]palettegen=stats_mode=diff[gifpal];`
    + `[gifb][gifpal]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle${output}`;
};

// Which frame is showing `tMs` into a looping animation with these frame durations.
export const frameIndexAt = (durations, tMs) => {
  const total = durations.reduce((a, b) => a + b, 0);
  if (!durations.length || total <= 0) return 0;
  let t = ((tMs % total) + total) % total;
  for (let i = 0; i < durations.length; i++) {
    if (t < durations[i]) return i;
    t -= durations[i];
  }
  return durations.length - 1;
};

// Every frame of a GIF as the whole picture at that moment (RGBA, width x height), decoded in
// JavaScript with omggif: for browsers without ImageDecoder (Safari). Each frame is drawn over the
// one before as the GIF says: kept (disposal 0/1), cleared to see-through (2) or put back as it
// was before the frame (3).
export function gifFramesRGBA(bytes, GifReader) {
  const reader = new GifReader(bytes);
  const { width, height } = reader;
  const count = Math.min(MAX_FRAMES, reader.numFrames());
  const canvas = new Uint8ClampedArray(width * height * 4);
  const frames = [];
  const durations = [];
  for (let i = 0; i < count; i++) {
    const info = reader.frameInfo(i);
    const before = info.disposal === 3 ? canvas.slice() : null;
    reader.decodeAndBlitFrameRGBA(i, canvas);
    frames.push(canvas.slice());
    // Delays are in hundredths of a second; 0 means "as fast as it can", shown at the default.
    durations.push(info.delay ? info.delay * 10 : DEFAULT_FRAME_MS);
    if (info.disposal === 2) {
      for (let y = info.y; y < Math.min(height, info.y + info.height); y++) {
        canvas.fill(0, (y * width + info.x) * 4, (y * width + Math.min(width, info.x + info.width)) * 4);
      }
    } else if (before) {
      canvas.set(before);
    }
  }
  return { width, height, frames, durations };
}

async function decodeWithImageDecoder(buffer) {
  const decoder = new ImageDecoder({ data: buffer, type: 'image/gif' });
  try {
    await decoder.tracks.ready;
    const count = Math.min(MAX_FRAMES, decoder.tracks.selectedTrack.frameCount);
    const frames = [];
    const durations = [];
    for (let i = 0; i < count; i++) {
      const { image } = await decoder.decode({ frameIndex: i });
      durations.push(image.duration ? image.duration / 1000 : DEFAULT_FRAME_MS);
      frames.push(await createImageBitmap(image));
      image.close();
    }
    if (!frames.length) return null;
    return { frames, durations, width: frames[0].width, height: frames[0].height };
  } finally {
    decoder.close();
  }
}

// Decode every frame of a GIF: with the browser's ImageDecoder (WebCodecs) where there is one,
// else with omggif (loaded only then). Resolves to { frames: ImageBitmap[], durations: ms[],
// width, height }, or null for a picture that isn't a readable GIF.
export async function decodeGif(url) {
  const buffer = await (await fetch(url)).arrayBuffer();
  if (typeof ImageDecoder !== 'undefined') return decodeWithImageDecoder(buffer);
  const { GifReader } = await import('omggif');
  const gif = gifFramesRGBA(new Uint8Array(buffer), GifReader);
  if (!gif.frames.length) return null;
  const frames = await Promise.all(gif.frames.map((rgba) => createImageBitmap(new ImageData(rgba, gif.width, gif.height))));
  return { frames, durations: gif.durations, width: gif.width, height: gif.height };
}
