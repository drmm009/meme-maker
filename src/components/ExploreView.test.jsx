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
    expect(screen.getByRole('tab', { name: /all templates/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /trending/i })).toBeTruthy();
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

  it('renders shelf headings with their plain icon and a See all', () => {
    render(<ExploreView onSelectTemplate={() => {}} initialCategory="all" />);
    const heading = screen.getByText('Trending Memes');
    const headingRow = heading.closest('.pg-section-head');
    expect(headingRow).toBeTruthy();
    // The icon takes the page's orange from CSS, not a colour of its own.
    const iconSvg = headingRow.querySelector('svg.pg-section-icon');
    expect(iconSvg).toBeTruthy();
    expect(iconSvg.getAttribute('color') ?? 'currentColor').toBe('currentColor');
    expect(headingRow.querySelector('.pg-section-aside').textContent).toMatch(/see all/i);
  });

  it('shows a grid of the category after See all', () => {
    render(<ExploreView onSelectTemplate={() => {}} initialCategory="all" />);
    const seeAll = screen.getByText('Trending Memes').closest('.pg-section-head').querySelector('.pg-section-aside');
    fireEvent.click(seeAll);
    expect(document.querySelector('.ex-grid')).toBeTruthy();
    expect(screen.getByRole('tab', { name: /trending/i }).getAttribute('aria-selected')).toBe('true');
  });

  it('keeps active category button visible in screen when category changes', async () => {
    const scrollToSpy = vi.spyOn(Element.prototype, 'scrollTo').mockImplementation(() => {});
    render(<ExploreView onSelectTemplate={() => {}} initialCategory="all" />);

    const desiTab = screen.getByRole('tab', { name: /bollywood culture/i });
    expect(desiTab).toBeTruthy();

    fireEvent.click(desiTab);
    expect(desiTab.classList.contains('active')).toBe(true);

    // Give requestAnimationFrame timer a turn to execute scroll
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(scrollToSpy).toHaveBeenCalled();
  });
});
