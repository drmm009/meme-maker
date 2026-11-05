// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';

const page = (from: number, n: number) => Array.from({ length: n }, (_, i) => ({ id: `g${from + i}`, title: `Gif ${from + i}`, preview: `p${from + i}`, url: `u${from + i}` }));
const searchGiphy = vi.fn();

vi.mock('../../../services/giphy', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../services/giphy')>()),
  hasGiphyKey: () => true,
  searchGiphy: (args: unknown) => searchGiphy(args),
}));

beforeEach(() => {
  vi.resetModules();
  searchGiphy.mockReset();
  searchGiphy.mockImplementation(({ offset = 0 }: { offset?: number }) => Promise.resolve(offset ? page(offset, 5) : page(0, 30)));
  localStorage.removeItem('meme_recent_gifs');
});
afterEach(cleanup);

// Lets the search timer fire and its results render.
const flush = () => act(() => new Promise((r) => setTimeout(r, 20)));

describe('Giphy results in the Stickers sheet', () => {
  it('browses by mood, shows more on request, and keeps recent picks', async () => {
    const { default: StickersSheet } = await import('./StickersSheet');
    const handleAddGraphicSticker = vi.fn();
    const actions = { handleAddGraphicSticker } as never;
    render(<StickersSheet actions={actions} onClose={() => {}} only="gifs" />);
    await flush();
    expect(searchGiphy).toHaveBeenLastCalledWith(expect.objectContaining({ kind: 'gifs', query: '' }));
    expect(screen.getAllByRole('button', { name: /^Gif \d+$/ })).toHaveLength(30);

    fireEvent.click(screen.getByText('Show more'));
    await flush();
    expect(searchGiphy).toHaveBeenLastCalledWith(expect.objectContaining({ offset: 30 }));
    expect(screen.getAllByRole('button', { name: /^Gif \d+$/ })).toHaveLength(35);
    // A short page means that was the last one.
    expect(screen.queryByText('Show more')).toBeNull();

    fireEvent.click(screen.getByText('Facepalm'));
    await flush();
    expect(searchGiphy).toHaveBeenLastCalledWith(expect.objectContaining({ kind: 'gifs', query: 'facepalm' }));
    expect(screen.getByRole('heading', { name: 'Facepalm' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Gif 3' }));
    expect(handleAddGraphicSticker).toHaveBeenCalledWith(expect.objectContaining({ url: 'u3', isGif: true }));
    cleanup();

    render(<StickersSheet actions={actions} onClose={() => {}} only="gifs" />);
    await flush();
    expect(screen.getByRole('heading', { name: 'Recent' })).toBeTruthy();
  });
});
