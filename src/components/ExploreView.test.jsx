// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ExploreView from './ExploreView';

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
  if (!Element.prototype.scrollTo) {
    Element.prototype.scrollTo = vi.fn();
  }
  global.fetch = vi.fn().mockRejectedValue(new Error('offline'));
}

describe('ExploreView', () => {
  beforeEach(() => {
    stubBrowserAPIs();
  });

  it('renders search bar and category tags slider', () => {
    render(<ExploreView onSelectTemplate={() => {}} />);
    expect(screen.getByPlaceholderText(/search templates/i)).toBeTruthy();
    expect(screen.getByRole('tab', { name: /^All\s*\d*$/ })).toBeTruthy();
    expect(screen.queryByRole('tab', { name: /all templates/i })).toBeNull();
    expect(screen.getByRole('tab', { name: /trending/i })).toBeTruthy();
  });

  it('keeps the social cards out of Trending, and shows them by their own previews', () => {
    const { container } = render(<ExploreView onSelectTemplate={() => {}} initialCategory="trending" />);
    expect(screen.queryByText('Tweet / X Post Card')).toBeNull();
    cleanup();
    render(<ExploreView onSelectTemplate={() => {}} initialCategory="social" />);
    const srcs = [...document.querySelectorAll('.ex-card-pic img')].map((i) => i.getAttribute('src'));
    expect(srcs.some((src) => /social-previews\/tweet\.svg/.test(src || ''))).toBe(true);
    expect(container).toBeTruthy();
  });

  it('filters to empty state on unknown query', async () => {
    render(<ExploreView onSelectTemplate={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText(/search templates/i), {
      target: { value: 'zzz-no-such-meme-zzz' },
    });
    expect(await screen.findByText(/no meme templates found/i)).toBeTruthy();
  });

  it('allows selecting a template', () => {
    const onSelectTemplate = vi.fn();
    render(<ExploreView onSelectTemplate={onSelectTemplate} initialCategory="trending" />);
    const cards = screen.getAllByRole('button');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('shows a shelf per category, and See All opens that category as a grid', () => {
    render(<ExploreView onSelectTemplate={() => {}} initialCategory="all" />);
    expect(screen.getByRole('heading', { name: 'Trending Memes' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'See all Trending Memes' }));
    expect(screen.getByRole('tab', { name: /trending/i }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('heading', { name: 'Trending' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Trending Memes' })).toBeNull();
  });

  it('opens a template, and stars one into My Favorites', () => {
    localStorage.removeItem('meme_favorite_templates');
    const onSelectTemplate = vi.fn();
    render(<ExploreView onSelectTemplate={onSelectTemplate} initialCategory="social" />);
    fireEvent.click(screen.getByRole('button', { name: /X Post Card.*views/ }));
    expect(onSelectTemplate).toHaveBeenCalledWith(expect.objectContaining({ id: 'social-tweet-card' }));

    fireEvent.click(screen.getByRole('button', { name: 'Add Tweet / X Post Card to favorites' }));
    expect(JSON.parse(localStorage.getItem('meme_favorite_templates'))).toEqual(['social-tweet-card']);
    fireEvent.click(screen.getByRole('tab', { name: /my favorites/i }));
    expect(screen.getByRole('button', { name: 'Remove Tweet / X Post Card from favorites' })).toBeTruthy();
    localStorage.removeItem('meme_favorite_templates');
  });

  it('sorts from the Sort menu, ticking the picked order', () => {
    render(<ExploreView onSelectTemplate={() => {}} initialCategory="social" />);
    fireEvent.click(screen.getByRole('button', { name: 'Sort templates' }));
    expect(screen.getByRole('menuitemradio', { name: 'Trending' }).getAttribute('aria-checked')).toBe('true');
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Name' }));
    expect(screen.queryByRole('menu')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Sort templates' }));
    expect(screen.getByRole('menuitemradio', { name: 'Name' }).getAttribute('aria-checked')).toBe('true');
  });

  it('keeps active category button visible in screen when category changes', async () => {
    const scrollToSpy = vi.spyOn(Element.prototype, 'scrollTo').mockImplementation(() => {});
    render(<ExploreView onSelectTemplate={() => {}} initialCategory="all" />);

    const desiTab = screen.getByRole('tab', { name: /bollywood culture/i });
    expect(desiTab).toBeTruthy();

    fireEvent.click(desiTab);
    expect(desiTab.getAttribute('aria-selected')).toBe('true');

    // Give requestAnimationFrame timer a turn to execute scroll
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(scrollToSpy).toHaveBeenCalled();
  });
});
