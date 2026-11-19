// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import CreatorSheet from './CreatorSheet';

afterEach(cleanup);

describe('CreatorSheet', () => {
  it('offers the two main makers, the AI meme row, then More tools, and says which was picked', () => {
    const onPick = vi.fn();
    const onMaker = vi.fn();
    render(<CreatorSheet open onClose={() => {}} onPick={onPick} onMaker={onMaker} />);
    const sheet = screen.getByRole('dialog', { name: 'Create a meme' });
    expect([...sheet.querySelectorAll('.cs-card-label')].map((b) => b.textContent)).toEqual(['Image', 'Video']);
    expect(sheet.querySelector('.cs-card--video .cs-card-pill')?.textContent).toContain('VIDEO');
    const tools = screen.getByRole('group', { name: 'More tools' });
    expect([...tools.querySelectorAll('.cs-tool-label')].map((b) => b.textContent)).toEqual(['Stickers', 'GIF maker', 'Face swap']);

    fireEvent.click(screen.getByRole('button', { name: /^Video/ }));
    expect(onPick).toHaveBeenCalledWith('video');
    fireEvent.click(screen.getByRole('button', { name: /^Image/ }));
    expect(onPick).toHaveBeenLastCalledWith('image');
    fireEvent.click(screen.getByRole('button', { name: /^AI meme/ }));
    expect(onMaker).toHaveBeenLastCalledWith('ai');
    for (const [name, maker] of [['Stickers', 'stickers'], ['GIF maker', 'gif'], ['Face swap', 'faceswap']]) {
      fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${name}`) }));
      expect(onMaker).toHaveBeenLastCalledWith(maker);
    }
  });

  it('closes on its close button, Escape and a tap outside, and shows nothing when closed', () => {
    const onClose = vi.fn();
    const { rerender } = render(<CreatorSheet open onClose={onClose} onPick={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(document.querySelector('.cs-backdrop') as Element);
    expect(onClose).toHaveBeenCalledTimes(3);
    rerender(<CreatorSheet open={false} onClose={onClose} onPick={() => {}} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
