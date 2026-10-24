import { describe, it, expect, vi } from 'vitest';
import { canShareFile, shareFile } from './shareFile';

const file = { name: 'meme.mp4' };

describe('shareFile', () => {
  it('reports unsupported where files cannot be shared', async () => {
    expect(canShareFile(file, {})).toBe(false);
    expect(canShareFile(file, { canShare: () => false, share: vi.fn() })).toBe(false);
    expect(await shareFile(file, {}, { canShare: () => false, share: vi.fn() })).toBe('unsupported');
  });

  it('opens the share sheet with the file and title', async () => {
    const nav = { canShare: () => true, share: vi.fn(() => Promise.resolve()) };
    expect(await shareFile(file, { title: 'My meme' }, nav)).toBe('shared');
    expect(nav.share).toHaveBeenCalledWith({ files: [file], title: 'My meme' });
  });

  it('treats closing the sheet as cancelled and rethrows real errors', async () => {
    const abort = Object.assign(new Error('closed'), { name: 'AbortError' });
    expect(await shareFile(file, {}, { canShare: () => true, share: () => Promise.reject(abort) })).toBe('cancelled');
    await expect(shareFile(file, {}, { canShare: () => true, share: () => Promise.reject(new Error('boom')) })).rejects.toThrow('boom');
  });
});
