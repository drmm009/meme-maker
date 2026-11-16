// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import HomeTools from './HomeTools';

afterEach(() => {
  cleanup();
});

describe('HomeTools', () => {
  it('renders the 6 makers as tiles, each its name under its icon', () => {
    render(<HomeTools onAction={vi.fn()} />);
    const nav = screen.getByRole('navigation', { name: 'Makers' });
    const names = within(nav).getAllByRole('button').map((b) => b.textContent);
    expect(names).toEqual(['Meme video', 'Stickers', 'Face swap', 'AI meme', 'GIF maker']);
    for (const b of within(nav).getAllByRole('button')) expect(b.querySelector('.hh-tool-icon svg')).toBeTruthy();
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
