// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import TemplateDiscovery from './TemplateDiscovery';
import { templateNumericId } from '../utils/templateOrder';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

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
  global.fetch = vi.fn().mockRejectedValue(new Error('offline'));
}

describe('TemplateDiscovery', () => {
  beforeEach(() => {
    stubBrowserAPIs();
  });

  it('renders hero actions and curated shelves without search bar', () => {
    render(<TemplateDiscovery onSelectTemplate={() => {}} onCreateCustom={() => {}} />);
    expect(screen.getByRole('heading', { name: /make a meme/i })).toBeTruthy();
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

    // The Create card and all five makers show at once (no carousel)
    expect(screen.getByRole('button', { name: 'Stickers' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Face swap' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Meme video' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /start creating/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Upload' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Social card' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'AI meme' })).toBeTruthy();

    // Click Face Swap
    fireEvent.click(screen.getByRole('button', { name: 'Face swap' }));
    expect(onSelectTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ editorMode: 'faceswap' })
    );

    // Click Generate Stickers
    fireEvent.click(screen.getByRole('button', { name: 'Stickers' }));
    expect(onSelectTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ editorMode: 'sticker', canvasBgColor: 'transparent', defaultCaptions: [] })
    );

    // Click Video Trimming
    fireEvent.click(screen.getByRole('button', { name: 'Meme video' }));
    expect(onCreateCustom).toHaveBeenCalledWith('video');

    // Click Create Now
    fireEvent.click(screen.getByRole('button', { name: /start creating/i }));
    expect(onCreateCustom).toHaveBeenCalledWith('image');

    // Click AI Punchlines: the AI Meme maker, on an image meme (not a social card)
    fireEvent.click(screen.getByRole('button', { name: 'AI meme' }));
    expect(onSelectTemplate).toHaveBeenLastCalledWith(expect.objectContaining({ editorMode: 'ai', aiPrompt: '' }));
    expect(onSelectTemplate.mock.lastCall[0].category).not.toBe('social');
    expect(onOpenAiGenerator).not.toHaveBeenCalled();
  });
});
