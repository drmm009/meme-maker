import { describe, it, expect, vi } from 'vitest';

vi.mock('./ffmpegExport', () => ({ loadFFmpeg: vi.fn(), runFFmpeg: vi.fn() }));
const { effectArgs } = await import('./clipEffects');

describe('effectArgs', () => {
  it('reverses the section with its sound, capped to 720px', () => {
    const args = effectArgs('reverse', { startSec: 1.5, lengthSec: 2 });
    expect(args.slice(0, 6)).toEqual(['-ss', '1.500', '-t', '2.000', '-i', 'fx_in.mp4']);
    const vf = args[args.indexOf('-vf') + 1];
    expect(vf).toContain('min(720,iw)');
    expect(vf.endsWith(',reverse')).toBe(true);
    expect(args).toContain('areverse');
    expect(args.at(-1)).toBe('fx_out.mp4');
  });

  it('can reverse a silent clip', () => {
    const args = effectArgs('reverse', { startSec: 0, lengthSec: 1, withAudio: false });
    expect(args).toContain('-an');
    expect(args).not.toContain('areverse');
  });

  it('plays a boomerang forwards then backwards, silent', () => {
    const args = effectArgs('boomerang', { startSec: 0, lengthSec: 1 });
    const graph = args[args.indexOf('-filter_complex') + 1];
    expect(graph).toContain('split[fwd][bk];[bk]reverse[rev];[fwd][rev]concat=n=2:v=1:a=0[out]');
    expect(args).toEqual(expect.arrayContaining(['-map', '[out]', '-an']));
  });
});
