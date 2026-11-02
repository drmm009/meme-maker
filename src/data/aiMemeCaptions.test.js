import { describe, it, expect, vi, afterEach } from 'vitest';
import { generateMemeCaptionsWithGemini, GEMINI_MODEL } from './aiMemeCaptions';

const reply = (captions) => ({
  ok: true,
  json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(captions) }] } }] }),
});

afterEach(() => vi.unstubAllGlobals());

describe('generateMemeCaptionsWithGemini', () => {
  it('asks the current Gemini model, the key in a header and not the URL', async () => {
    const fetch = vi.fn(async () => reply(['one', 'two']));
    vi.stubGlobal('fetch', fetch);
    const captions = await generateMemeCaptionsWithGemini({ apiKey: ' test-key ', prompt: 'mondays', templateName: 'Drake', count: 2 });
    expect(captions).toEqual(['one', 'two']);
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`);
    expect(url).not.toContain('test-key');
    expect(init.headers['x-goog-api-key']).toBe('test-key');
  });

  it('falls back to the built-in library without a key, or when the call fails', async () => {
    const fetch = vi.fn(async () => ({ ok: false, json: async () => ({}) }));
    vi.stubGlobal('fetch', fetch);
    expect(await generateMemeCaptionsWithGemini({ apiKey: '', count: 4 })).toHaveLength(4);
    expect(fetch).not.toHaveBeenCalled();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await generateMemeCaptionsWithGemini({ apiKey: 'k', count: 3 })).toHaveLength(3);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
