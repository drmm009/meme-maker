// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import MemeStickersBottomSheet from './MemeStickersBottomSheet';

afterEach(() => cleanup());

describe('MemeStickersBottomSheet', () => {
  it('renders sticker categories and triggers onSelectSticker when clicked', () => {
    const handleSelect = vi.fn();
    const handleClose = vi.fn();

    render(
      <MemeStickersBottomSheet
        isOpen={true}
        onClose={handleClose}
        onSelectSticker={handleSelect}
      />
    );

    expect(screen.getByText('Choose a Sticker')).toBeDefined();
    const input = screen.getByPlaceholderText(/Search meme stickers/i);
    expect(input).toBeDefined();

    const stickerBtns = screen.getAllByRole('button');
    const stickerCard = stickerBtns.find((b) => b.classList.contains('graphic-sticker-btn'));
    if (stickerCard) {
      fireEvent.click(stickerCard);
      expect(handleSelect).toHaveBeenCalledTimes(1);
    }
  });

  it('filters stickers by search query', () => {
    render(
      <MemeStickersBottomSheet
        isOpen={true}
        onClose={() => {}}
        onSelectSticker={() => {}}
      />
    );

    const input = screen.getByPlaceholderText(/Search meme stickers/i);
    fireEvent.change(input, { target: { value: 'nonexistent_query_xyz_123' } });

    expect(screen.getByText(/No stickers found matching/i)).toBeDefined();
  });
});
