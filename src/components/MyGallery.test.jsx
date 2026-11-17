// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import MyGallery from './MyGallery';

afterEach(() => cleanup());

const meme = (over = {}) => ({
  id: 'meme-1',
  name: 'My Meme',
  createdAt: '2026-01-01T00:00:00.000Z',
  thumbnailUrl: 'data:image/jpeg;base64,AAA',
  imageUrl: 'data:image/jpeg;base64,AAA',
  ...over,
});

describe('MyGallery', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading state while gallery resolves IndexedDB', () => {
    render(
      <MyGallery savedMemes={[]} galleryReady={false} onDeleteMeme={() => {}} onSelectMeme={() => {}} />
    );
    expect(screen.getByText(/loading gallery/i)).toBeTruthy();
  });

  it('shows empty state when ready with no memes', () => {
    render(
      <MyGallery savedMemes={[]} galleryReady onDeleteMeme={() => {}} onSelectMeme={() => {}} />
    );
    expect(screen.getByText(/no saved memes yet/i)).toBeTruthy();
  });

  it('renders thumbnails with Unknown date fallback', () => {
    render(
      <MyGallery
        savedMemes={[meme({ id: 'a', name: 'A', createdAt: null })]}
        galleryReady
        onDeleteMeme={() => {}}
        onSelectMeme={() => {}}
      />
    );
    expect(screen.getByText('A')).toBeTruthy();
    expect(screen.getByText(/unknown date/i)).toBeTruthy();
  });

  it('opens preview and resolves full-res image via resolver', async () => {
    const full = 'blob:http://localhost/full-res';
    const onResolveFullImage = vi.fn(async () => full);
    render(
      <MyGallery
        savedMemes={[meme()]}
        galleryReady
        onDeleteMeme={() => {}}
        onSelectMeme={() => {}}
        onResolveFullImage={onResolveFullImage}
      />
    );
    fireEvent.click(screen.getByText('My Meme'));
    expect(await screen.findByText(/download/i)).toBeTruthy();
    expect(onResolveFullImage).toHaveBeenCalled();
  });

  it('sorts saves into tabs by kind, with counts', () => {
    render(
      <MyGallery
        savedMemes={[meme({ id: 'm', name: 'Funny' }), meme({ id: 's', name: 'Cat sticker', kind: 'sticker' }), meme({ id: 'g', name: 'Dance', kind: 'gif' })]}
        savedVideos={[{ id: 'v', name: 'Clip', savedAt: '2026-01-02T00:00:00.000Z', thumbnail: '', durationMs: 4000 }]}
        galleryReady
        onDeleteMeme={() => {}}
        onSelectMeme={() => {}}
      />
    );
    const tabs = screen.getAllByRole('tab').map((t) => t.textContent);
    expect(tabs).toEqual(['All4', 'Memes1', 'Stickers1', 'GIFs1', 'Videos1']);
    fireEvent.click(screen.getByRole('tab', { name: /stickers/i }));
    expect(screen.getByText('Cat sticker')).toBeTruthy();
    expect(screen.queryByText('Funny')).toBeNull();
    expect(screen.queryByText('Clip')).toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: /videos/i }));
    expect(screen.getByText('Clip')).toBeTruthy();
    expect(screen.getByText('0:04')).toBeTruthy();
  });

  it('shows an empty tab with its maker', () => {
    const onMake = vi.fn();
    render(<MyGallery savedMemes={[meme()]} galleryReady onDeleteMeme={() => {}} onSelectMeme={() => {}} onMake={onMake} />);
    fireEvent.click(screen.getByRole('tab', { name: /gifs/i }));
    expect(screen.getByText(/no gifs yet/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Make a GIF' }));
    expect(onMake).toHaveBeenCalledWith('gif');
  });

  it('offers no Re-Edit for a saved GIF', async () => {
    render(<MyGallery savedMemes={[meme({ name: 'Dance', kind: 'gif' })]} galleryReady onDeleteMeme={() => {}} onSelectMeme={() => {}} />);
    fireEvent.click(screen.getByText('Dance'));
    expect(await screen.findByRole('button', { name: /download/i })).toBeTruthy();
    expect(screen.queryByText(/re-edit/i)).toBeNull();
  });

  it('shows a save in a sheet with its kind and no Done button, and closes on Escape', async () => {
    render(<MyGallery savedMemes={[meme()]} galleryReady onDeleteMeme={() => {}} onSelectMeme={() => {}} />);
    fireEvent.click(screen.getByText('My Meme'));
    const sheet = await screen.findByRole('dialog', { name: 'My Meme' });
    expect(sheet.querySelector('.mg-sheet-kind').textContent).toBe('Meme');
    expect(screen.queryByRole('button', { name: 'Done' })).toBeNull();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('deletes from the sheet', async () => {
    const onDeleteMeme = vi.fn();
    render(<MyGallery savedMemes={[meme()]} galleryReady onDeleteMeme={onDeleteMeme} onSelectMeme={() => {}} />);
    fireEvent.click(screen.getByText('My Meme'));
    const sheet = await screen.findByRole('dialog');
    fireEvent.click(within(sheet).getByRole('button', { name: 'Delete' }));
    expect(onDeleteMeme).toHaveBeenCalledWith('meme-1');
  });

  it('searches by name and switches between the grid and the list', () => {
    render(
      <MyGallery
        savedMemes={[meme({ id: 'm', name: 'Funny' }), meme({ id: 's', name: 'Cat sticker', kind: 'sticker' })]}
        galleryReady
        onDeleteMeme={() => {}}
        onSelectMeme={() => {}}
      />
    );
    expect(screen.getByText('2 items saved on this device')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Search My Studio'), { target: { value: 'cat' } });
    expect(screen.getByText('Cat sticker')).toBeTruthy();
    expect(screen.queryByText('Funny')).toBeNull();
    fireEvent.change(screen.getByLabelText('Search My Studio'), { target: { value: 'zzz' } });
    expect(screen.getByText('No Results for “zzz”')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Clear Search' }));
    expect(screen.getByText('Funny')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'List' }));
    expect(screen.getByRole('button', { name: 'List' }).getAttribute('aria-pressed')).toBe('true');
    // The list says each save's kind beside its date.
    expect(screen.getByText(/^Sticker · /)).toBeTruthy();
  });

  it('pulls down a menu from More, and closes it on Escape', () => {
    const onSelectMeme = vi.fn();
    render(<MyGallery savedMemes={[meme({ name: 'Dance', kind: 'gif' })]} galleryReady onDeleteMeme={() => {}} onSelectMeme={onSelectMeme} />);
    const more = screen.getByRole('button', { name: 'More for Dance' });
    expect(more.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(more);
    // A GIF can't be edited again.
    expect(screen.getAllByRole('menuitem').map((m) => m.textContent)).toEqual(['Download', 'Delete']);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('calls onDeleteMeme from the More menu', () => {
    const onDeleteMeme = vi.fn();
    render(
      <MyGallery
        savedMemes={[meme()]}
        galleryReady
        onDeleteMeme={onDeleteMeme}
        onSelectMeme={() => {}}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'More for My Meme' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));
    expect(onDeleteMeme).toHaveBeenCalledWith('meme-1');
  });
});
