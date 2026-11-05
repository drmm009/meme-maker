// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import StickersSheet from './StickersSheet';
import type { EditorActions } from './selection';

afterEach(cleanup);

describe('StickersSheet', () => {
  it('adds the 3D pack after the meme stickers, and searches both', async () => {
    const handleAddGraphicSticker = vi.fn();
    render(<StickersSheet actions={{ handleAddGraphicSticker } as unknown as EditorActions} onClose={() => {}} only="stickers" />);
    expect(await screen.findByRole('heading', { name: '3D Smileys' })).toBeTruthy();
    expect(screen.getByText('3D stickers: Fluent Emoji by Microsoft')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Search stickers'), { target: { value: 'pizza' } });
    fireEvent.click(screen.getByRole('button', { name: 'Pizza' }));
    expect(handleAddGraphicSticker).toHaveBeenCalledWith(expect.objectContaining({ name: 'Pizza', url: expect.stringMatching(/fluentui-emoji@\w+\/assets\/Pizza\/3D\/pizza_3d\.png$/) }));
  });
});
