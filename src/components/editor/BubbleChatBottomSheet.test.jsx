// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import BubbleChatBottomSheet, { BUBBLE_PRESETS } from './BubbleChatBottomSheet';

beforeEach(() => {
  if (!window.matchMedia) {
    window.matchMedia = () => ({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
    });
  }
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (cb) => setTimeout(cb, 0);
    window.cancelAnimationFrame = (id) => clearTimeout(id);
  }
});

afterEach(() => cleanup());

describe('BubbleChatBottomSheet', () => {
  it('renders bubble presets and triggers onApplyBubbleStyle on click', () => {
    const handleApply = vi.fn();
    const handleRemove = vi.fn();
    const handleClose = vi.fn();

    render(
      <BubbleChatBottomSheet
        isOpen={true}
        onClose={handleClose}
        activeCaption={{ id: 'cap-1', text: 'HELLO WORLD', bubbleStyle: null }}
        onApplyBubbleStyle={handleApply}
        onRemoveBubbleStyle={handleRemove}
      />
    );

    expect(screen.getByText('Chat & Speech Bubbles')).toBeDefined();
    expect(screen.getByText('iPhone Sent')).toBeDefined();
    expect(screen.getByText('WhatsApp Sent')).toBeDefined();
    expect(screen.getByText('Comic Speech (Left)')).toBeDefined();

    const iphoneBtn = screen.getByText('iPhone Sent').closest('button');
    expect(iphoneBtn).toBeDefined();
    fireEvent.click(iphoneBtn);

    expect(handleApply).toHaveBeenCalledWith('imessage-send');
  });

  it('shows active bubble and calls onRemoveBubbleStyle when remove clicked', () => {
    const handleApply = vi.fn();
    const handleRemove = vi.fn();

    render(
      <BubbleChatBottomSheet
        isOpen={true}
        onClose={() => {}}
        activeCaption={{ id: 'cap-1', text: 'HELLO WORLD', bubbleStyle: 'imessage-send' }}
        onApplyBubbleStyle={handleApply}
        onRemoveBubbleStyle={handleRemove}
      />
    );

    const removeBtn = screen.getByText('Remove Bubble').closest('button');
    expect(removeBtn).toBeDefined();
    fireEvent.click(removeBtn);

    expect(handleRemove).toHaveBeenCalledTimes(1);
  });
});
