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
    fireEvent.click(screen.getByRole('button', { name: /Blank Canvas/ }));

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

    fireEvent.click(screen.getByRole('button', { name: 'Header Text Video' }));

    expect(handleSelect).toHaveBeenCalledTimes(1);
    const template = handleSelect.mock.calls[0][0];
    expect(template.type).toBe('video');
    expect(template.videoLayout).toBe('header');
  });

  it('makes a custom grid from the columns and rows picked', () => {
    const handleSelect = vi.fn();
    render(<CustomLayoutBuilder onSelectTemplate={handleSelect} />);
    fireEvent.click(screen.getByRole('button', { name: 'Custom Grid' }));
    fireEvent.click(screen.getByRole('button', { name: 'More columns' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fewer rows' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create 3 Panels' }));
    expect(handleSelect.mock.calls[0][0]).toMatchObject({ layoutId: 'custom-grid', name: 'Custom 3x1' });
    expect(handleSelect.mock.calls[0][0].defaultCaptions).toHaveLength(3);
  });

  it('selects a social card', () => {
    const handleSelect = vi.fn();
    render(<CustomLayoutBuilder onSelectTemplate={handleSelect} />);

    fireEvent.click(screen.getByRole('button', { name: /X Post Card/ }));

    expect(handleSelect).toHaveBeenCalledTimes(1);
    const template = handleSelect.mock.calls[0][0];
    expect(template.category).toBe('social');
  });
});
