// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import TemplateDiscovery, { templateNumericId } from './TemplateDiscovery';

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

  it('renders studio feature containers and handles feature clicks', () => {
    const onSelectTemplate = vi.fn();
    const onCreateCustom = vi.fn();
    const onOpenAiGenerator = vi.fn();

    render(
      <TemplateDiscovery
        onSelectTemplate={onSelectTemplate}
        onCreateCustom={onCreateCustom}
        onOpenAiGenerator={onOpenAiGenerator}
      />
    );

    // Verify all 6 feature containers render
    expect(screen.getByRole('button', { name: 'Generate Stickers' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Face Swap' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Create Viral Video' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Create Now' })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Upload' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Social Cards' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'AI Punchlines' })).toBeTruthy();

    // Click Face Swap
    fireEvent.click(screen.getByRole('button', { name: 'Face Swap' }));
    expect(onSelectTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ initialFaceSwap: true })
    );

    // Click Generate Stickers
    fireEvent.click(screen.getByRole('button', { name: 'Generate Stickers' }));
    expect(onSelectTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ initialStickersModal: true })
    );

    // Click Video Trimming
    fireEvent.click(screen.getByRole('button', { name: 'Create Viral Video' }));
    expect(onCreateCustom).toHaveBeenCalledWith('video');

    // Click Create Now
    fireEvent.click(screen.getByRole('button', { name: 'Create Now' }));
    expect(onCreateCustom).toHaveBeenCalledWith('image');

    // Click AI Punchlines
    fireEvent.click(screen.getByRole('button', { name: 'AI Punchlines' }));
    expect(onOpenAiGenerator).toHaveBeenCalled();
  });
});
