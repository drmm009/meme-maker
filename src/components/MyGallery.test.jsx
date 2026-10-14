// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
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

  it('calls onDeleteMeme from the card button', () => {
    const onDeleteMeme = vi.fn();
    render(
      <MyGallery
        savedMemes={[meme()]}
        galleryReady
        onDeleteMeme={onDeleteMeme}
        onSelectMeme={() => {}}
      />
    );
    fireEvent.click(screen.getAllByTitle('Delete Meme')[0]);
    expect(onDeleteMeme).toHaveBeenCalledWith('meme-1');
  });
});
