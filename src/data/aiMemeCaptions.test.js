import { describe, it, expect } from 'vitest';
import { generateMemeCaptions } from './aiMemeCaptions';

describe('generateMemeCaptions', () => {
  it('picks captions from the built-in library, without calling anything', async () => {
    const captions = await generateMemeCaptions({ prompt: 'mondays', templateName: 'Drake', count: 4 });
    expect(captions).toHaveLength(4);
    for (const c of captions) expect(typeof c).toBe('string');
    expect(new Set(captions).size).toBe(4);
  });

  it('keeps to the vibe asked for', async () => {
    const all = await generateMemeCaptions({ category: 'students', count: 100 });
    expect(all.length).toBeGreaterThan(0);
    expect(all.some((c) => /exam|assignment|Professor/i.test(c))).toBe(true);
  });
});
