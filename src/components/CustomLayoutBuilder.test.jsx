// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import CustomLayoutBuilder from './CustomLayoutBuilder';

afterEach(() => {
  cleanup();
});

describe('CustomLayoutBuilder', () => {
  it('shows the title, one Blank Canvas above Grid layout, then Caption layout, with no switch', () => {
    render(<CustomLayoutBuilder />);
    expect(screen.getByRole('heading', { name: 'Canvas Layout' })).toBeTruthy();
    const grid = screen.getByRole('heading', { name: 'Grid layout' });
    expect(screen.getByRole('heading', { name: 'Caption layout' })).toBeTruthy();
    expect(screen.queryByRole('tab')).toBeNull();
    const blank = screen.getAllByRole('button', { name: /Blank Canvas/ });
    expect(blank).toHaveLength(1);
    // The row comes before the Grid layout heading.
    expect(blank[0].compareDocumentPosition(grid) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('triggers onSelectTemplate when Blank Canvas is clicked', () => {
    const handleSelect = vi.fn();
    render(<CustomLayoutBuilder onSelectTemplate={handleSelect} />);
    fireEvent.click(screen.getByRole('button', { name: /Blank Canvas/ }));

    expect(handleSelect).toHaveBeenCalledTimes(1);
    const template = handleSelect.mock.calls[0][0];
    expect(template.layoutId).toBe('1-panel');
    expect(template.canvasOnly).toBe(true);
    // No TOP TEXT / BOTTOM TEXT: the start card's Text pill adds text.
    expect(template.defaultCaptions).toEqual([]);
  });

  it('selects a preset image grid', () => {
    const handleSelect = vi.fn();
    render(<CustomLayoutBuilder onSelectTemplate={handleSelect} />);
    fireEvent.click(screen.getByRole('button', { name: /2 Panels\s*Top \/ Bottom/ }));

    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect.mock.calls[0][0]).toMatchObject({ category: 'custom', layoutId: '2-vert' });
  });

  it('opens a caption layout in the video editor for a video meme, with its bar on', () => {
    const handleSelect = vi.fn();
    render(<CustomLayoutBuilder kind="video" onSelectTemplate={handleSelect} />);
    fireEvent.click(screen.getByRole('button', { name: /Top Caption/ }));

    expect(handleSelect).toHaveBeenCalledTimes(1);
    const template = handleSelect.mock.calls[0][0];
    expect(template.type).toBe('video');
    expect(template.videoLayout).toBe('header');
    expect(template.videoHeader.enabled).toBe(true);
    expect(template.videoFooter.enabled).toBe(false);
  });

  it('opens a caption layout in the image editor for an image meme: the bars on, a caption in each', () => {
    const handleSelect = vi.fn();
    render(<CustomLayoutBuilder kind="image" onSelectTemplate={handleSelect} />);
    fireEvent.click(screen.getByRole('button', { name: /Top & Bottom/ }));

    const template = handleSelect.mock.calls[0][0];
    expect(template.type).toBeUndefined();
    expect(template.canvasHeader.enabled).toBe(true);
    expect(template.canvasFooter.enabled).toBe(true);
    expect(template.defaultCaptions.map((c) => [c.text, Boolean(c.isHeaderCaption), Boolean(c.isFooterCaption)])).toEqual([
      ['TOP TEXT', true, false],
      ['BOTTOM TEXT', false, true],
    ]);
    // Each caption's box hugs its words (no fixed width), so it stays on one line.
    expect(template.defaultCaptions.every((c) => !c.hasCustomWidth && c.width === undefined)).toBe(true);
  });

  it('opens a grid in the video editor for a video meme: its panels and lines', () => {
    const handleSelect = vi.fn();
    render(<CustomLayoutBuilder kind="video" onSelectTemplate={handleSelect} />);
    fireEvent.click(screen.getByRole('button', { name: /2 Panels\s*Side-by-Side/ }));

    const template = handleSelect.mock.calls[0][0];
    expect(template).toMatchObject({ type: 'video', category: 'custom', layoutId: '2-horiz', width: 800, height: 600 });
    expect(template.slots).toEqual([
      { x: 0, y: 0, width: 400, height: 600 },
      { x: 400, y: 0, width: 400, height: 600 },
    ]);
  });

  it('says which editor the layouts open in', () => {
    const { unmount } = render(<CustomLayoutBuilder kind="video" />);
    expect(screen.getByText('Every layout opens in the video editor')).toBeTruthy();
    unmount();
    render(<CustomLayoutBuilder kind="image" />);
    expect(screen.getByText('Every layout opens in the image editor')).toBeTruthy();
  });

  it('makes a custom grid from the columns and rows picked', () => {
    const handleSelect = vi.fn();
    render(<CustomLayoutBuilder onSelectTemplate={handleSelect} />);
    fireEvent.click(screen.getByRole('button', { name: /Custom Grid/ }));
    fireEvent.click(screen.getByRole('button', { name: 'More columns' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fewer rows' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create 3 Panels' }));
    // The image editor's own panels, empty (each gets a start card there).
    expect(handleSelect.mock.calls[0][0]).toMatchObject({
      layoutId: 'custom-grid', name: 'Custom 3x1', isNativeLayout: true,
      layoutDef: { id: 'custom-grid', slots: 3, cols: 3, rows: 1 }, slotImages: [null, null, null], defaultCaptions: [],
    });
  });

  it('starts a blank video from the Blank Canvas row when opened for a video meme', () => {
    const handleSelect = vi.fn();
    render(<CustomLayoutBuilder kind="video" onSelectTemplate={handleSelect} />);
    expect(screen.getByText('A video with no caption bars')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Blank Canvas/ }));

    expect(handleSelect).toHaveBeenCalledTimes(1);
    const template = handleSelect.mock.calls[0][0];
    expect(template.type).toBe('video');
    expect(template.videoLayout).toBeUndefined();
  });
});
