// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import CreatorSheet from './CreatorSheet';

afterEach(cleanup);

describe('CreatorSheet', () => {
  it('offers the two main makers, then More tools, and says which was picked', () => {
    const onPick = vi.fn();
    const onMaker = vi.fn();
    render(<CreatorSheet open onClose={() => {}} onPick={onPick} onMaker={onMaker} />);
    const sheet = screen.getByRole('dialog', { name: 'Create' });
    expect([...sheet.querySelectorAll('.cs-card-label')].map((b) => b.textContent)).toEqual(['Image meme', 'Video meme']);
    const tools = screen.getByRole('group', { name: 'More tools' });
    expect([...tools.querySelectorAll('button')].map((b) => b.textContent)).toEqual(['AI meme', 'Stickers', 'GIF maker', 'Face swap']);
    fireEvent.click(screen.getByRole('button', { name: /^Video meme/ }));
    expect(onPick).toHaveBeenCalledWith('video');
    fireEvent.click(screen.getByRole('button', { name: /^Image meme/ }));
    expect(onPick).toHaveBeenLastCalledWith('image');
    for (const [name, maker] of [['AI meme', 'ai'], ['Stickers', 'stickers'], ['GIF maker', 'gif'], ['Face swap', 'faceswap']]) {
      fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${name}`) }));
      expect(onMaker).toHaveBeenLastCalledWith(maker);
    }
  });

  it('closes on Escape and on a tap outside, and shows nothing when closed', () => {
    const onClose = vi.fn();
    const { rerender } = render(<CreatorSheet open onClose={onClose} onPick={() => {}} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(document.querySelector('.cs-backdrop') as Element);
    expect(onClose).toHaveBeenCalledTimes(2);
    rerender(<CreatorSheet open={false} onClose={onClose} onPick={() => {}} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
