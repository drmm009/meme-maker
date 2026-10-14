// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import EmojiBottomSheet from './EmojiBottomSheet';

afterEach(() => cleanup());

describe('EmojiBottomSheet', () => {
  it('renders emoji categories and allows selecting an emoji', () => {
    const handleSelect = vi.fn();
    render(
      <EmojiBottomSheet
        isOpen={true}
        onClose={() => {}}
        onSelectEmoji={handleSelect}
      />
    );

    expect(screen.getByText('Choose an Emoji')).toBeDefined();
    expect(screen.getByText('Faces')).toBeDefined();

    const laughCryBtn = screen.getByTitle('Laugh Cry');
    fireEvent.click(laughCryBtn);
    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'laugh_cry', emoji: '😂' })
    );
  });

  it('shows empty state for unmatched search', () => {
    render(
      <EmojiBottomSheet
        isOpen={true}
        onClose={() => {}}
        onSelectEmoji={() => {}}
      />
    );

    const input = screen.getByPlaceholderText(/Search emojis/i);
    fireEvent.change(input, { target: { value: 'zzzz_no_match_here' } });

    expect(screen.getByText(/No emojis found matching/i)).toBeDefined();
  });
});
