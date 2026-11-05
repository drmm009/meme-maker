// Cut out: a picture's subject on a see-through background, as a new blob: URL (PNG). The
// background-removal library is big, so it loads on first use (the first cut also downloads its
// model, which takes a while).
export async function cutOutBackground(url: string): Promise<string> {
  const source = await (await fetch(url)).blob();
  const { removeBackground } = await import('@imgly/background-removal');
  return URL.createObjectURL(await removeBackground(source));
}

// Photos and stickers can be cut out; animated GIFs can't (only their first frame would be kept).
export const canCutOut = (item: { type: string; url?: string; isGif?: boolean }): boolean =>
  (item.type === 'image' || item.type === 'sticker') && Boolean(item.url) && !item.isGif && !/\.gif($|\?)/i.test(item.url || '');
