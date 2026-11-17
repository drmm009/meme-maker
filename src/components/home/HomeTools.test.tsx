// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import HomeTools from './HomeTools';

afterEach(() => {
  cleanup();
});

describe('HomeTools', () => {
  it('renders the makers as cards, each with its icon, name and a line about it', () => {
    render(<HomeTools onAction={vi.fn()} />);
    const nav = screen.getByRole('navigation', { name: 'Makers' });
    const cards = within(nav).getAllByRole('button');
    expect(cards.map((b) => b.getAttribute('aria-label'))).toEqual(['Meme video', 'Stickers', 'Face swap', 'AI meme', 'GIF maker']);
    for (const card of cards) {
      expect(card.querySelector('.hh-tool-icon svg')).toBeTruthy();
      // The line about the maker is its description, read after its name.
      const about = document.getElementById(card.getAttribute('aria-describedby') || '');
      expect(about?.textContent?.length).toBeGreaterThan(8);
    }
    expect(within(nav).getByText('Cut out a photo in one tap')).toBeTruthy();
  });

  it('has a heading in the shelves\' style above the cards', () => {
    render(<HomeTools onAction={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Make your own' })).toBeTruthy();
  });

  it('invokes onAction with correct action key on click', () => {
    const onAction = vi.fn();
    render(<HomeTools onAction={onAction} />);
    const pairs: [string, string][] = [['Meme video', 'video'], ['Stickers', 'stickers'], ['Face swap', 'faceswap'], ['AI meme', 'ai'], ['GIF maker', 'gif']];
    for (const [name, action] of pairs) {
      fireEvent.click(screen.getByRole('button', { name }));
      expect(onAction).toHaveBeenCalledWith(action);
    }
  });
});
