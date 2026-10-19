// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import MemeStylesModal from './MemeStylesModal';

afterEach(() => cleanup());

describe('MemeStylesModal (Unified Social Cards Studio)', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <MemeStylesModal
        isOpen={false}
        onClose={() => {}}
        onAddTweetCard={() => {}}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders platform modal without top switcher tabs', () => {
    render(
      <MemeStylesModal
        isOpen={true}
        initialPlatform="tweet"
        onClose={() => {}}
        onAddTweetCard={() => {}}
        onAddInstagramCard={() => {}}
        onAddWhatsAppCard={() => {}}
      />
    );

    expect(screen.getByText('Add Tweet Card to Meme')).toBeDefined();
    // Switcher tabs should not exist in the bottom sheet
    expect(screen.queryByText('Twitter / X')).toBeNull();
  });

  it('adds Tweet card with selected persona when submitted', () => {
    const onAddTweet = vi.fn();
    const onClose = vi.fn();

    render(
      <MemeStylesModal
        isOpen={true}
        onClose={onClose}
        onAddTweetCard={onAddTweet}
      />
    );

    // Click Sam Altman persona
    const altmanBtn = screen.getByText(/Sam Altman/i);
    fireEvent.click(altmanBtn);

    const submitBtn = screen.getByText('Add Tweet Card to Meme');
    fireEvent.click(submitBtn);

    expect(onAddTweet).toHaveBeenCalledTimes(1);
    const callArgs = onAddTweet.mock.calls[0][0];
    expect(callArgs.name).toBe('Sam Altman');
    expect(callArgs.handle).toBe('@sama');
    expect(onClose).toHaveBeenCalled();
  });

  it('opens directly with Instagram modal, displays Instagram controls without orange tags container, and adds Instagram card', () => {
    const onAddInstagram = vi.fn();
    const onClose = vi.fn();

    render(
      <MemeStylesModal
        isOpen={true}
        initialPlatform="instagram"
        onClose={onClose}
        onAddTweetCard={() => {}}
        onAddInstagramCard={onAddInstagram}
      />
    );

    expect(screen.getAllByText(/Mark Zuckerberg/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Aesthetic Creator/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Add Instagram Card to Meme')).toBeDefined();

    // Select Aesthetic Creator persona
    const aestheticBtn = screen.getAllByText(/Aesthetic Creator/i)[0];
    fireEvent.click(aestheticBtn);

    // Submit Instagram card
    const submitBtn = screen.getByText('Add Instagram Card to Meme');
    fireEvent.click(submitBtn);

    expect(onAddInstagram).toHaveBeenCalledTimes(1);
    const callArgs = onAddInstagram.mock.calls[0][0];
    expect(callArgs.username).toBe('daily_aesthetic');
    expect(callArgs.hasStoryRing).toBe(false);
    expect(callArgs.verified).toBe(true);
    expect(callArgs.likesText).toBe('Liked by zendaya and 984,210 others');
    expect(callArgs.commentsCount).toBe('1,420');
    expect(callArgs.postImage).toBeDefined();
    expect(onClose).toHaveBeenCalled();
  });

  it('opens directly with WhatsApp tab when initialPlatform is whatsapp', () => {
    const onAddWhatsApp = vi.fn();
    const onClose = vi.fn();

    render(
      <MemeStylesModal
        isOpen={true}
        initialPlatform="whatsapp"
        onClose={onClose}
        onAddWhatsAppCard={onAddWhatsApp}
      />
    );

    expect(screen.getByText('WhatsApp Card')).toBeDefined();
    expect(screen.getAllByText(/Mom/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/The Boss/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Add WhatsApp Card to Meme')).toBeDefined();

    // Select The Boss persona
    const bossBtn = screen.getAllByText(/The Boss/i)[0];
    fireEvent.click(bossBtn);

    // Submit WhatsApp card
    const submitBtn = screen.getByText('Add WhatsApp Card to Meme');
    fireEvent.click(submitBtn);

    expect(onAddWhatsApp).toHaveBeenCalledTimes(1);
    const callArgs = onAddWhatsApp.mock.calls[0][0];
    expect(callArgs.contactName).toBe('Boss 💼');
    expect(Array.isArray(callArgs.messages)).toBe(true);
    expect(callArgs.messages.length).toBeGreaterThan(0);
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <MemeStylesModal
        isOpen={true}
        onClose={onClose}
      />
    );

    const closeBtn = screen.getByTitle('Close');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
