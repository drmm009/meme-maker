// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { fileNameFor, formatBytes, outputSize, renderExport } from './exportImage';

afterEach(() => vi.restoreAllMocks());

describe('exportImage', () => {
  it('scales down to the chosen width, keeping the shape, and never up', () => {
    expect(outputSize(1080, 720, 'full')).toEqual({ w: 1080, h: 720 });
    expect(outputSize(1080, 720, 480)).toEqual({ w: 480, h: 320 });
    expect(outputSize(600, 400, 720)).toEqual({ w: 600, h: 400 });
  });

  it('names the file after the type the browser actually wrote', () => {
    expect(fileNameFor('meme-drake', 'image/jpeg')).toMatch(/^meme-drake-\d+\.jpg$/);
    expect(fileNameFor('m', 'image/webp')).toMatch(/\.webp$/);
    expect(fileNameFor('m', 'image/png')).toMatch(/\.png$/);
  });

  it('prints sizes for people', () => {
    expect(formatBytes(900)).toBe('900 B');
    expect(formatBytes(230 * 1024)).toBe('230 KB');
    expect(formatBytes(2.5 * 1024 * 1024)).toBe('2.5 MB');
  });

  it('writes the source as is at full size, with the format and quality asked for', async () => {
    const toBlob = vi.fn((cb: (b: Blob) => void, type?: string) => cb(new Blob(['x'], { type })));
    const source = { width: 1080, height: 720, toBlob, toDataURL: vi.fn() };
    const blob = await renderExport(source, { format: 'webp', quality: 0.7, width: 'full' });
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/webp', 0.7);
    expect(blob.type).toBe('image/webp');
    await renderExport(source, { format: 'png', quality: 0.7, width: 'full' });
    expect(toBlob).toHaveBeenLastCalledWith(expect.any(Function), 'image/png', undefined);
  });

  it('draws a smaller copy, over white for JPG', async () => {
    const calls: string[] = [];
    const ctx = {
      fillStyle: '',
      imageSmoothingQuality: 'low',
      fillRect: () => calls.push(`fill ${ctx.fillStyle}`),
      drawImage: (_src: unknown, x: number, y: number, w: number, h: number) => calls.push(`draw ${x},${y},${w}x${h}`),
    };
    const copy = { width: 0, height: 0, getContext: () => ctx, toBlob: (cb: (b: Blob) => void, type?: string) => cb(new Blob(['y'], { type })) };
    vi.spyOn(document, 'createElement').mockReturnValue(copy as unknown as HTMLElement);
    const source = { width: 1080, height: 720, toBlob: vi.fn(), toDataURL: vi.fn() };
    const blob = await renderExport(source, { format: 'jpeg', quality: 0.8, width: 480 });
    expect([copy.width, copy.height]).toEqual([480, 320]);
    expect(calls).toEqual(['fill #ffffff', 'draw 0,0,480x320']);
    expect(blob.type).toBe('image/jpeg');
    expect(source.toBlob).not.toHaveBeenCalled();
  });
});
