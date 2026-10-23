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

// Decode every frame of a GIF with the browser's ImageDecoder (WebCodecs). Resolves to
// { frames: ImageBitmap[], durations: ms[], width, height }, or null where ImageDecoder isn't
// available (the sticker then shows its first frame).
export async function decodeGif(url) {
  if (typeof ImageDecoder === 'undefined') return null;
  const res = await fetch(url);
  const decoder = new ImageDecoder({ data: await res.arrayBuffer(), type: 'image/gif' });
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
