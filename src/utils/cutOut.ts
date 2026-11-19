// Cut out: a picture's subject on a see-through background, as a new blob: URL (PNG), through
// utils/photoCutout (MediaPipe, loaded on first use).
export async function cutOutBackground(url: string): Promise<string> {
  const source = await (await fetch(url)).blob();
  const { cutOutPhoto } = await import('./photoCutout');
  return URL.createObjectURL(await cutOutPhoto(source));
}

// Photos and stickers can be cut out; animated GIFs can't (only their first frame would be kept).
export const canCutOut = (item: { type: string; url?: string; isGif?: boolean }): boolean =>
  (item.type === 'image' || item.type === 'sticker') && Boolean(item.url) && !item.isGif && !/\.gif($|\?)/i.test(item.url || '');
