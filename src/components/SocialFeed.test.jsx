// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import SocialFeed from './SocialFeed';

beforeEach(() => localStorage.clear());
afterEach(() => cleanup());

describe('SocialFeed', () => {
  it('shows the title, search, filters, creators and posts with their captions', () => {
    render(<SocialFeed onRemixMeme={() => {}} />);
    expect(screen.getByRole('heading', { name: 'Social' })).toBeDefined();
    expect(screen.getByPlaceholderText(/Search memes/i)).toBeDefined();
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['For you', 'Trending', 'Hot']);
    expect(screen.queryByText(/Fresh memes/)).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Top creators' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Show memes by CyberDoge' })).toBeDefined();
    const post = screen.getByRole('article', { name: 'Writing unit tests at 3 AM' });
    expect(within(post).getByText('Testing code before deploying to production')).toBeDefined();
    expect(within(post).getByRole('button', { name: 'Remix Writing unit tests at 3 AM' }).textContent).toBe('Remix');
    expect(within(post).getByRole('button', { name: 'Copy link' })).toBeDefined();
  });

  it('picks the feed from the switch at the top right', () => {
    render(<SocialFeed onRemixMeme={() => {}} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Hot' }));
    expect(screen.getByRole('tab', { name: 'Hot' }).getAttribute('aria-selected')).toBe('true');
    const shown = screen.getAllByRole('article').map((a) => a.getAttribute('aria-label'));
    expect(shown).toContain('Aura farming in every meeting');
    expect(shown).not.toContain('Writing unit tests at 3 AM');
  });

  it('filters posts by search, a #tag included', () => {
    render(<SocialFeed onRemixMeme={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText(/Search memes/i), { target: { value: 'CSS centered div' } });
    expect(screen.getByRole('article', { name: 'Modern CSS centered div expectation vs reality' })).toBeDefined();
    expect(screen.queryByRole('article', { name: 'Writing unit tests at 3 AM' })).toBeNull();

    fireEvent.change(screen.getByPlaceholderText(/Search memes/i), { target: { value: '#developer' } });
    expect(screen.getByRole('article', { name: 'Writing unit tests at 3 AM' })).toBeDefined();
  });

  it('shows no title, hashtags or More button on a post', () => {
    render(<SocialFeed onRemixMeme={() => {}} />);
    const post = screen.getByRole('article', { name: 'Writing unit tests at 3 AM' });
    expect(within(post).queryByRole('heading')).toBeNull();
    expect(within(post).queryByRole('button', { name: /^#/ })).toBeNull();
    expect(within(post).queryByRole('button', { name: /^More/ })).toBeNull();
  });

  it('shows only one creator\'s posts when their avatar is tapped', () => {
    render(<SocialFeed onRemixMeme={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Show memes by PixelQueen' }));
    expect(screen.getAllByRole('article').map((a) => a.getAttribute('aria-label'))).toEqual(['When the AI writes better jokes than you']);
    fireEvent.click(screen.getByRole('button', { name: 'Show all' }));
    expect(screen.getAllByRole('article').length).toBeGreaterThan(1);
  });

  it('likes a post, remembers it, and double-tap likes too', () => {
    render(<SocialFeed onRemixMeme={() => {}} />);
    const post = screen.getByRole('article', { name: 'Writing unit tests at 3 AM' });
    fireEvent.click(within(post).getByRole('button', { name: 'Like' }));
    expect(within(post).getByRole('button', { name: 'Unlike' }).textContent).toBe('343');
    expect(JSON.parse(localStorage.getItem('meme_liked_posts'))).toContain('post-1');

    const other = screen.getByRole('article', { name: 'When the AI writes better jokes than you' });
    fireEvent.doubleClick(within(other).getByRole('img'));
    expect(within(other).getByRole('button', { name: 'Unlike' })).toBeDefined();
  });

  it('shows an empty state with a reset', () => {
    render(<SocialFeed onRemixMeme={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText(/Search memes/i), { target: { value: 'zzzz-nothing' } });
    expect(screen.getByText('No memes found')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }));
    expect(screen.getAllByRole('article').length).toBeGreaterThan(1);
  });

  it('triggers onRemixMeme when Remix is clicked', () => {
    const handleRemix = vi.fn();
    render(<SocialFeed onRemixMeme={handleRemix} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remix Writing unit tests at 3 AM' }));
    expect(handleRemix).toHaveBeenCalledWith(expect.objectContaining({ id: 'post-1' }));
  });
});
