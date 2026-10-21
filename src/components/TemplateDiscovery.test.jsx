// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import TemplateDiscovery from './TemplateDiscovery';
import { templateNumericId } from '../utils/templateUtils';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function stubBrowserAPIs() {
  if (typeof window !== 'undefined') {
    window.__PAUSE_CAROUSEL__ = true;
  }
  if (!window.matchMedia) {
    window.matchMedia = () => ({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
    });
  }
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (cb) => setTimeout(cb, 0);
    window.cancelAnimationFrame = (id) => clearTimeout(id);
  }
  global.fetch = vi.fn().mockRejectedValue(new Error('offline'));
}

describe('TemplateDiscovery', () => {
  beforeEach(() => {
    stubBrowserAPIs();
  });

  it('renders hero actions and search', () => {
    render(<TemplateDiscovery onSelectTemplate={() => {}} onCreateCustom={() => {}} />);
    expect(screen.getAllByText(/unleash your/i).length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText(/search templates/i)).toBeTruthy();
  }, 60000);

  it('filters to empty state on unknown query', async () => {
    render(<TemplateDiscovery onSelectTemplate={() => {}} onCreateCustom={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText(/search templates/i), {
      target: { value: 'zzz-no-such-meme-zzz' },
    });
    expect(await screen.findByText(/no meme templates found/i)).toBeTruthy();
  }, 30000);

  it('templateNumericId never returns NaN', () => {
    const ids = [{ id: 'imgflip-1' }, { id: 'giphy-abc', trendingScore: 3 }, { id: undefined }];
    for (const t of ids) {
      expect(Number.isNaN(templateNumericId(t))).toBe(false);
    }
  });
});
