// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import FirstRunTour, { TOUR_KEY } from './FirstRunTour';
import { placeBubble } from './tourPlacement';

const viewport = { width: 375, height: 812 };

describe('placeBubble', () => {
  it('goes under a target in the top half of the screen, over one in the bottom half', () => {
    const top = placeBubble({ left: 300, top: 10, width: 60, height: 36 }, viewport);
    expect(top.top).toBe(58);
    expect(top.bottom).toBeUndefined();
    const bottom = placeBubble({ left: 16, top: 720, width: 343, height: 64 }, viewport);
    expect(bottom.bottom).toBe(812 - 720 + 12);
    expect(bottom.top).toBeUndefined();
  });

  it('stays on screen', () => {
    const p = placeBubble({ left: 340, top: 10, width: 30, height: 30 }, viewport);
    expect(p.left + p.width).toBeLessThanOrEqual(375 - 12);
    expect(p.left).toBeGreaterThanOrEqual(12);
  });
});

describe('FirstRunTour', () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it('walks through the steps once and remembers it was seen', () => {
    render(<FirstRunTour />);
    expect(screen.getByText('1 of 4')).toBeTruthy();
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('Tap anything on the meme')).toBeTruthy();
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Got it'));
    expect(screen.queryByRole('dialog', { name: 'Editor tour' })).toBeNull();
    expect(localStorage.getItem(TOUR_KEY)).toBe('done');
    cleanup();
    render(<FirstRunTour />);
    expect(screen.queryByRole('dialog', { name: 'Editor tour' })).toBeNull();
  });

  it('Skip ends it straight away', () => {
    render(<FirstRunTour />);
    fireEvent.click(screen.getByText('Skip'));
    expect(screen.queryByRole('dialog', { name: 'Editor tour' })).toBeNull();
    expect(localStorage.getItem(TOUR_KEY)).toBe('done');
  });
});
