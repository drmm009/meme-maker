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

  it('renders all three platform selector buttons when open', () => {
    render(
      <MemeStylesModal
        isOpen={true}
        onClose={() => {}}
        onAddTweetCard={() => {}}
        onAddInstagramCard={() => {}}
        onAddWhatsAppCard={() => {}}
      />
    );

    expect(screen.getByText('Tweet Card')).toBeDefined();
    expect(screen.getByText('Twitter / X')).toBeDefined();
    expect(screen.getByText('Instagram')).toBeDefined();
    expect(screen.getByText('WhatsApp')).toBeDefined();
    expect(screen.getByText('Add Tweet Card to Meme')).toBeDefined();
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

  it('switches to Instagram tab, displays Instagram controls, and adds Instagram card', () => {
    const onAddInstagram = vi.fn();
    const onClose = vi.fn();

    render(
      <MemeStylesModal
        isOpen={true}
        initialPlatform="tweet"
        onClose={onClose}
        onAddTweetCard={() => {}}
        onAddInstagramCard={onAddInstagram}
      />
    );

    // Switch to Instagram
    const igTab = screen.getByText('Instagram');
    fireEvent.click(igTab);

    expect(screen.getByText(/Mark Zuckerberg/i)).toBeDefined();
    expect(screen.getByText(/Aesthetic Creator/i)).toBeDefined();
    expect(screen.getByText('Add Instagram Card to Meme')).toBeDefined();

    // Select Aesthetic Creator persona
    const aestheticBtn = screen.getByText(/Aesthetic Creator/i);
    fireEvent.click(aestheticBtn);

    // Submit Instagram card
    const submitBtn = screen.getByText('Add Instagram Card to Meme');
    fireEvent.click(submitBtn);

    expect(onAddInstagram).toHaveBeenCalledTimes(1);
    const callArgs = onAddInstagram.mock.calls[0][0];
    expect(callArgs.username).toBe('daily_aesthetic');
    expect(callArgs.hasStoryRing).toBe(false);
    expect(callArgs.verified).toBe(true);
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
    expect(screen.getByText(/The Boss/i)).toBeDefined();
    expect(screen.getByText('Add WhatsApp Card to Meme')).toBeDefined();

    // Select The Boss persona
    const bossBtn = screen.getByText(/The Boss/i);
    fireEvent.click(bossBtn);

    // Submit WhatsApp card
    const submitBtn = screen.getByText('Add WhatsApp Card to Meme');
    fireEvent.click(submitBtn);

    expect(onAddWhatsApp).toHaveBeenCalledTimes(1);
    const callArgs = onAddWhatsApp.mock.calls[0][0];
    expect(callArgs.contactName).toBe('Boss 💼');
    expect(callArgs.direction).toBe('received');
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
