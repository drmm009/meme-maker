// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import SocialFeed from './SocialFeed';

afterEach(() => cleanup());

describe('SocialFeed', () => {
  it('renders community meme cards and search input', () => {
    render(
      <SocialFeed
        onRemixMeme={() => {}}
        onCreateCustom={() => {}}
      />
    );

    expect(screen.getByRole('heading', { name: /Trending/i })).toBeDefined();
    expect(screen.getByPlaceholderText(/Search memes/i)).toBeDefined();
    expect(screen.getByText('Writing unit tests at 3 AM')).toBeDefined();
    expect(screen.getByText('CyberDoge')).toBeDefined();
  });

  it('filters memes based on search input', () => {
    render(
      <SocialFeed
        onRemixMeme={() => {}}
        onCreateCustom={() => {}}
      />
    );

    const input = screen.getByPlaceholderText(/Search memes/i);
    fireEvent.change(input, { target: { value: 'CSS centered div' } });

    expect(screen.getByText('Modern CSS centered div expectation vs reality')).toBeDefined();
    expect(screen.queryByText('Writing unit tests at 3 AM')).toBeNull();
  });

  it('triggers onRemixMeme when Remix button is clicked', () => {
    const handleRemix = vi.fn();
    render(
      <SocialFeed
        onRemixMeme={handleRemix}
        onCreateCustom={() => {}}
      />
    );

    const remixButtons = screen.getAllByRole('button', { name: /Remix/i });
    expect(remixButtons.length).toBeGreaterThan(0);
    fireEvent.click(remixButtons[0]);
    expect(handleRemix).toHaveBeenCalled();
  });
});
