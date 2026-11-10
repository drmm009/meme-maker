// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import TemplateDiscovery from './TemplateDiscovery';
import { templateNumericId } from '../utils/templateOrder';

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

  it('renders hero actions and curated shelves without search bar', () => {
    render(<TemplateDiscovery onSelectTemplate={() => {}} onCreateCustom={() => {}} />);
    expect(screen.getAllByText(/unleash your/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/trending memes/i)).toBeTruthy();
    expect(screen.queryByPlaceholderText(/search templates/i)).toBeNull();
  }, 60000);

  it('navigates to explore when See all is clicked', () => {
    const onNavigateExplore = vi.fn();
    render(
      <TemplateDiscovery
        onSelectTemplate={() => {}}
        onCreateCustom={() => {}}
        onNavigateExplore={onNavigateExplore}
      />
    );
    const seeAllButtons = screen.getAllByRole('button', { name: /see all/i });
    expect(seeAllButtons.length).toBeGreaterThan(0);
    fireEvent.click(seeAllButtons[0]);
    expect(onNavigateExplore).toHaveBeenCalled();
  }, 30000);

  it('shows the makers as tiles under the carousel', () => {
    const onSelectTemplate = vi.fn();
    const onCreateCustom = vi.fn();
    const onOpenGifMaker = vi.fn();
    render(<TemplateDiscovery onSelectTemplate={onSelectTemplate} onCreateCustom={onCreateCustom} onOpenGifMaker={onOpenGifMaker} />);
    const tiles = screen.getByRole('navigation', { name: 'Makers' });
    for (const name of ['Meme video', 'Stickers', 'Face swap', 'Social card', 'AI meme', 'GIF maker']) {
      expect(within(tiles).getByRole('button', { name })).toBeTruthy();
    }
    fireEvent.click(within(tiles).getByRole('button', { name: 'Meme video' }));
    expect(onCreateCustom).toHaveBeenCalledWith('video');
    fireEvent.click(within(tiles).getByRole('button', { name: 'Face swap' }));
    expect(onSelectTemplate).toHaveBeenCalledWith(expect.objectContaining({ editorMode: 'faceswap' }));
    fireEvent.click(within(tiles).getByRole('button', { name: 'GIF maker' }));
    expect(onOpenGifMaker).toHaveBeenCalled();
  });

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
    expect(screen.getByRole('button', { name: /start creating/i })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Upload' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Social Cards' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'AI Punchlines' })).toBeTruthy();

    // Click Face Swap
    fireEvent.click(screen.getByRole('button', { name: 'Face Swap' }));
    expect(onSelectTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ editorMode: 'faceswap' })
    );

    // Click Generate Stickers
    fireEvent.click(screen.getByRole('button', { name: 'Generate Stickers' }));
    expect(onSelectTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ editorMode: 'sticker', canvasBgColor: 'transparent', defaultCaptions: [] })
    );

    // Click Video Trimming
    fireEvent.click(screen.getByRole('button', { name: 'Create Viral Video' }));
    expect(onCreateCustom).toHaveBeenCalledWith('video');

    // Click Create Now
    fireEvent.click(screen.getByRole('button', { name: /start creating/i }));
    expect(onCreateCustom).toHaveBeenCalledWith('image');

    // Click AI Punchlines: the AI Meme maker, on an image meme (not a social card)
    fireEvent.click(screen.getByRole('button', { name: 'AI Punchlines' }));
    expect(onSelectTemplate).toHaveBeenLastCalledWith(expect.objectContaining({ editorMode: 'ai', aiPrompt: '' }));
    expect(onSelectTemplate.mock.lastCall[0].category).not.toBe('social');
    expect(onOpenAiGenerator).not.toHaveBeenCalled();
  });
});
