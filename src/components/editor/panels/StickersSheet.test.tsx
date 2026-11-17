// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import StickersSheet from './StickersSheet';
import type { EditorActions } from './selection';
import { loadStickerPack } from '../../../utils/stickerPack';

// The sheet imports the 3D pack's list (about 1,600 rows) lazily; under a busy run that can outlast
// findBy's one second. Load it first: the sheet then gets the cached copy.
beforeAll(async () => {
  await loadStickerPack();
}, 30000);

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
