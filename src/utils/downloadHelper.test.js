// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { downloadImageHelper } from './downloadHelper';

describe('downloadHelper.downloadImageHelper', () => {
  const TINY_PNG =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

  let originalCreateElement;
  let clickedLink = null;

  beforeEach(() => {
    clickedLink = null;
    originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = originalCreateElement(tag);
      if (tag === 'a') {
        el.click = vi.fn(() => {
          clickedLink = el;
        });
      }
      return el;
    });

    if (!globalThis.URL.createObjectURL) {
      globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    } else {
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    }
    if (!globalThis.URL.revokeObjectURL) {
      globalThis.URL.revokeObjectURL = vi.fn();
    } else {
      vi.spyOn(URL, 'revokeObjectURL').mockReturnValue();
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('triggers anchor download for data URL without throwing', async () => {
    await downloadImageHelper(TINY_PNG, 'test-meme.png');

    expect(clickedLink).not.toBeNull();
    expect(clickedLink.download).toBe('test-meme.png');
    expect(clickedLink.href).toContain('blob:mock-url');
  });

  it('uses Web Share API if navigator.canShare returns true', async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined);
    const originalNavigator = globalThis.navigator;

    Object.defineProperty(globalThis, 'navigator', {
      value: {
        ...originalNavigator,
        canShare: vi.fn(() => true),
        share: mockShare,
      },
      configurable: true,
      writable: true,
    });

    await downloadImageHelper(TINY_PNG, 'share-test.png');
    expect(mockShare).toHaveBeenCalled();

    // Restore navigator
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: true,
    });
  });
});
