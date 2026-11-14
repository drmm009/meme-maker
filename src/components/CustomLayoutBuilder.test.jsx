// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import CustomLayoutBuilder from './CustomLayoutBuilder';

afterEach(() => {
  cleanup();
});

describe('CustomLayoutBuilder (live website version)', () => {
  it('renders heading and shelf sections', () => {
    render(<CustomLayoutBuilder />);
    expect(screen.getByText('Choose Canvas Layout')).toBeTruthy();
    expect(screen.getByText('Image Layout')).toBeTruthy();
    expect(screen.getByText('Video Layout')).toBeTruthy();
    expect(screen.getByText('Social Cards')).toBeTruthy();
    expect(screen.getByText('Blank Canvas')).toBeTruthy();
  });

  it('triggers onSelectTemplate when Blank Canvas is clicked', () => {
    const handleSelect = vi.fn();
    render(<CustomLayoutBuilder onSelectTemplate={handleSelect} />);
    const blankCard = screen.getByText('Blank Canvas').closest('.blank-canvas-card');
    expect(blankCard).toBeTruthy();
    fireEvent.click(blankCard);

    expect(handleSelect).toHaveBeenCalledTimes(1);
    const template = handleSelect.mock.calls[0][0];
    expect(template.layoutId).toBe('1-panel');
    expect(template.canvasOnly).toBe(true);
  });

  it('selects a preset image grid', () => {
    const handleSelect = vi.fn();
    render(<CustomLayoutBuilder onSelectTemplate={handleSelect} />);

    const gridCards = screen.getAllByRole('button');
    const twoPanel = gridCards.find((c) => c.textContent.includes('2 Panels'));
    expect(twoPanel).toBeTruthy();
    fireEvent.click(twoPanel);

    expect(handleSelect).toHaveBeenCalledTimes(1);
    const template = handleSelect.mock.calls[0][0];
    expect(template.category).toBe('custom');
  });

  it('selects a video layout', () => {
    const handleSelect = vi.fn();
    render(<CustomLayoutBuilder onSelectTemplate={handleSelect} />);

    const videoCard = screen.getByText('Header Text Video').closest('.layout-shelf-card');
    expect(videoCard).toBeTruthy();
    fireEvent.click(videoCard);

    expect(handleSelect).toHaveBeenCalledTimes(1);
    const template = handleSelect.mock.calls[0][0];
    expect(template.type).toBe('video');
    expect(template.videoLayout).toBe('header');
  });

  it('selects a social card', () => {
    const handleSelect = vi.fn();
    render(<CustomLayoutBuilder onSelectTemplate={handleSelect} />);

    const tweetCard = screen.getByText('Tweet / X Post Card').closest('.layout-shelf-card');
    expect(tweetCard).toBeTruthy();
    fireEvent.click(tweetCard);

    expect(handleSelect).toHaveBeenCalledTimes(1);
    const template = handleSelect.mock.calls[0][0];
    expect(template.category).toBe('social');
  });
});
