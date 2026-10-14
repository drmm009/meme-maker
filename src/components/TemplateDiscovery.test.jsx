// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import TemplateDiscovery, { templateNumericId } from './TemplateDiscovery';

afterEach(() => cleanup());

function stubBrowserAPIs() {
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
}

describe('TemplateDiscovery', () => {
  beforeEach(() => {
    stubBrowserAPIs();
  });

  it('renders hero actions and search', () => {
    render(<TemplateDiscovery onSelectTemplate={() => {}} onCreateCustom={() => {}} />);
    expect(screen.getByText(/unleash your inner meme lord/i)).toBeTruthy();
    expect(screen.getByPlaceholderText(/search templates/i)).toBeTruthy();
  });

  it('filters to empty state on unknown query', () => {
    render(<TemplateDiscovery onSelectTemplate={() => {}} onCreateCustom={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText(/search templates/i), {
      target: { value: 'zzz-no-such-meme-zzz' },
    });
    expect(screen.getByText(/no meme templates found/i)).toBeTruthy();
  });

  it('templateNumericId never returns NaN', () => {
    const ids = [{ id: 'imgflip-1' }, { id: 'giphy-abc', trendingScore: 3 }, { id: undefined }];
    for (const t of ids) {
      expect(Number.isNaN(templateNumericId(t))).toBe(false);
    }
  });
});
