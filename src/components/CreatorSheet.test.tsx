// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import CreatorSheet from './CreatorSheet';

afterEach(cleanup);

describe('CreatorSheet', () => {
  it('offers Video meme and Image meme, and says which was picked', () => {
    const onPick = vi.fn();
    render(<CreatorSheet open onClose={() => {}} onPick={onPick} />);
    expect(screen.getByRole('dialog', { name: 'What are you making?' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Video meme/ }));
    expect(onPick).toHaveBeenCalledWith('video');
    fireEvent.click(screen.getByRole('button', { name: /Image meme/ }));
    expect(onPick).toHaveBeenLastCalledWith('image');
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
