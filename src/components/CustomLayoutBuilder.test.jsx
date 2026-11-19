// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import CustomLayoutBuilder from './CustomLayoutBuilder';

beforeEach(() => localStorage.removeItem('canvas_layout_aspect'));
afterEach(() => {
  cleanup();
  localStorage.removeItem('canvas_layout_aspect');
});

const pick = (name) => fireEvent.click(screen.getByRole('button', { name }));

describe('CustomLayoutBuilder', () => {
  it('shows the title, the canvas shapes, Blank Canvas, then Grid layouts and Caption layouts', () => {
    render(<CustomLayoutBuilder />);
    expect(screen.getByRole('heading', { name: 'Canvas Layout' })).toBeTruthy();
    const shapes = screen.getByRole('radiogroup', { name: 'Canvas shape' });
    expect(within(shapes).getAllByRole('radio').map((r) => r.getAttribute('aria-label'))).toEqual(['Square 1:1', 'Portrait 4:5', 'Story 9:16', 'Wide 16:9']);
    // Only the picked shape says its name.
    expect([...shapes.querySelectorAll('.clb-aspect-name')].map((n) => n.textContent)).toEqual(['Square']);
    expect(screen.queryByText('Canvas shape')).toBeNull();
    expect(within(shapes).getByRole('radio', { name: /Square/ }).getAttribute('aria-checked')).toBe('true');
    const grids = screen.getByRole('heading', { name: 'Grid layouts' });
    expect(screen.getByRole('heading', { name: 'Caption layouts' })).toBeTruthy();
    const blank = screen.getAllByRole('button', { name: /Blank Canvas/ });
    expect(blank).toHaveLength(1);
    expect(blank[0].compareDocumentPosition(grids) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('puts the sections in order, Grid layouts last', () => {
    const { unmount } = render(<CustomLayoutBuilder />);
    const order = () => [...document.querySelectorAll('.clb-section h2')].map((h) => h.textContent);
    expect(order()).toEqual(['Caption layouts', 'Meme formats', 'Collages', 'Grid layouts']);
    unmount();
    render(<CustomLayoutBuilder kind="video" />);
    expect(order()).toEqual(['Caption layouts', 'Grid layouts']);
  });

  it('lists the grids, Custom Grid last, leaving out for an image meme the ones Collages already have', () => {
    const grids = () => [...screen.getByRole('heading', { name: 'Grid layouts' }).parentElement.querySelectorAll('.clb-card')]
      .map((c) => `${c.querySelector('.clb-card-name').textContent} ${c.querySelector('.clb-card-detail').textContent}`);
    const { unmount } = render(<CustomLayoutBuilder />);
    expect(grids()).toEqual(['3 Panels Stacked', '3 Panels Side by side', '3 Panels 1 top, 2 below', 'Custom Grid Rows & columns']);
    unmount();
    // The video editor has no collages, so it keeps them all.
    render(<CustomLayoutBuilder kind="video" />);
    expect(grids()).toEqual([
      '2 Panels Top / Bottom', '2 Panels Side by side', '3 Panels Stacked', '3 Panels Side by side', '3 Panels 1 top, 2 below', '4 Panels 2 × 2 grid', 'Custom Grid Rows & columns',
    ]);
  });

  it('starts a blank image canvas in the shape picked, and remembers the shape', () => {
    const handleSelect = vi.fn();
    const { unmount } = render(<CustomLayoutBuilder onSelectTemplate={handleSelect} />);
    fireEvent.click(screen.getByRole('radio', { name: /Story/ }));
    pick(/Blank Canvas/);
    const template = handleSelect.mock.calls[0][0];
    expect(template).toMatchObject({ layoutId: '1-panel', canvasOnly: true, aspectRatio: '9:16', defaultCaptions: [] });
    unmount();
    render(<CustomLayoutBuilder />);
    expect(screen.getByRole('radio', { name: /Story/ }).getAttribute('aria-checked')).toBe('true');
  });

  it('opens an image grid as the editor’s own panels, in the shape picked', () => {
    const handleSelect = vi.fn();
    render(<CustomLayoutBuilder onSelectTemplate={handleSelect} />);
    fireEvent.click(screen.getByRole('radio', { name: /Portrait/ }));
    pick(/3 Panels\s*1 top, 2 below/);
    expect(handleSelect.mock.calls[0][0]).toMatchObject({
      category: 'custom', layoutId: '3-hybrid', name: '3 Panels (1 Top / 2 Bottom)', aspectRatio: '4:5', isNativeLayout: true,
      layoutDef: { id: '3-hybrid', slots: 3 }, slotImages: [null, null, null],
    });
  });

  it('opens a video grid with its panels drawn on the shape picked', () => {
    const handleSelect = vi.fn();
    render(<CustomLayoutBuilder kind="video" onSelectTemplate={handleSelect} />);
    fireEvent.click(screen.getByRole('radio', { name: /Wide/ }));
    pick(/2 Panels\s*Side by side/);
    const template = handleSelect.mock.calls[0][0];
    expect(template).toMatchObject({ type: 'video', category: 'custom', layoutId: '2-horiz', width: 800, height: 450 });
    expect(template.slots).toEqual([
      { x: 0, y: 0, width: 400, height: 450 },
      { x: 400, y: 0, width: 400, height: 450 },
    ]);
  });

  it('opens a caption layout in the video editor for a video meme, with its bar on', () => {
    const handleSelect = vi.fn();
    render(<CustomLayoutBuilder kind="video" onSelectTemplate={handleSelect} />);
    pick(/Top Caption/);
    const template = handleSelect.mock.calls[0][0];
    expect(template).toMatchObject({ type: 'video', videoLayout: 'header', width: 1080, height: 1080 });
    expect(template.videoHeader.enabled).toBe(true);
    expect(template.videoFooter.enabled).toBe(false);
    expect(template.defaultCaptions.map((c) => c.text)).toEqual(['TOP TEXT']);
  });

  it('opens a caption layout in the image editor for an image meme: the bars on, a caption in each', () => {
    const handleSelect = vi.fn();
    render(<CustomLayoutBuilder kind="image" onSelectTemplate={handleSelect} />);
    pick(/Top & Bottom/);
    const template = handleSelect.mock.calls[0][0];
    expect(template.type).toBeUndefined();
    expect(template.aspectRatio).toBe('1:1');
    expect(template.canvasHeader.enabled).toBe(true);
    expect(template.canvasFooter.enabled).toBe(true);
    expect(template.defaultCaptions.map((c) => [c.text, Boolean(c.isHeaderCaption), Boolean(c.isFooterCaption)])).toEqual([
      ['TOP TEXT', true, false],
      ['BOTTOM TEXT', false, true],
    ]);
    // Each caption's box hugs its words (no fixed width), so it stays on one line.
    expect(template.defaultCaptions.every((c) => !c.hasCustomWidth && c.width === undefined)).toBe(true);
  });

  it('offers Meme formats and Collages for an image meme only, each preview showing the picture', () => {
    const { unmount } = render(<CustomLayoutBuilder />);
    const cards = (heading) => [...screen.getByRole('heading', { name: heading }).parentElement.querySelectorAll('.clb-card-name')].map((n) => n.textContent);
    expect(cards('Meme formats')).toEqual(['Classic', 'Subtitle', 'Poster', 'Breaking news']);
    expect(cards('Collages')).toEqual(['Top & bottom', 'Then & now', 'Side by side', '2 × 2 + caption']);
    expect(document.querySelectorAll('.clb-photo').length).toBeGreaterThan(20);
    // The caption layouts have their own picture (a beach); everything else the sunset.
    const srcs = (heading) => new Set([...screen.getByRole('heading', { name: heading }).parentElement.querySelectorAll('.clb-photo')].map((i) => i.getAttribute('src')));
    expect(srcs('Caption layouts')).toEqual(new Set(['./images/layout-preview-beach.svg']));
    for (const heading of ['Meme formats', 'Collages', 'Grid layouts']) expect(srcs(heading)).toEqual(new Set(['./images/layout-preview.svg']));
    // Every section is one line of cards that slides: Grid layouts, Caption layouts, Meme formats, Collages.
    expect(document.querySelectorAll('.clb-slider')).toHaveLength(4);
    unmount();
    render(<CustomLayoutBuilder kind="video" />);
    expect(screen.queryByRole('heading', { name: 'Meme formats' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Collages' })).toBeNull();
    // Grid and Caption layouts, each one line that slides.
    expect(document.querySelectorAll('.clb-slider')).toHaveLength(2);
  });

  it('opens each meme format with its look and words in place, in the shape picked', () => {
    const handleSelect = vi.fn();
    render(<CustomLayoutBuilder onSelectTemplate={handleSelect} />);
    fireEvent.click(screen.getByRole('radio', { name: /Portrait/ }));
    pick(/^Classic/);
    pick(/^Subtitle/);
    pick(/^Poster/);
    pick(/^Breaking news/);
    const [classic, subtitle, poster, news] = handleSelect.mock.calls.map((c) => c[0]);
    expect(classic).toMatchObject({ canvasOnly: true, aspectRatio: '4:5' });
    expect(classic.defaultCaptions.map((c) => [c.text, c.fontFamily])).toEqual([['TOP TEXT', 'Impact, sans-serif'], ['BOTTOM TEXT', 'Impact, sans-serif']]);
    expect(subtitle.defaultCaptions).toHaveLength(1);
    expect(subtitle.defaultCaptions[0]).toMatchObject({ text: 'Your text', y: 0.9 });
    expect(poster).toMatchObject({ canvasBgColor: '#000000', demotivational: { enabled: true, title: 'YOUR TEXT' } });
    expect(poster.defaultCaptions.map((c) => Boolean(c.isDemotivationalTitle || c.isDemotivationalSubtitle))).toEqual([true, true]);
    expect(news.defaultCaptions[0]).toMatchObject({ isBreakingNews: true, text: 'YOUR HEADLINE HERE' });
  });

  it('opens collages as the editor’s panels with their text already in place', () => {
    const handleSelect = vi.fn();
    render(<CustomLayoutBuilder onSelectTemplate={handleSelect} />);
    pick(/^Then & now/);
    pick(/^Side by side.*caption under/);
    pick(/^2 × 2 \+ caption/);
    const [thenNow, side, quad] = handleSelect.mock.calls.map((c) => c[0]);
    expect(thenNow).toMatchObject({ layoutId: '2-vert', isNativeLayout: true, slotImages: [null, null] });
    // The labels don't hide the panels' start cards.
    expect(thenNow.defaultCaptions.map((c) => [c.text, c.isPanelLabel])).toEqual([['HOW IT STARTED', true], ["HOW IT'S GOING", true]]);
    expect(side).toMatchObject({ layoutId: '2-horiz', canvasFooter: { enabled: true, bgColor: '#ffffff' } });
    expect(side.defaultCaptions[0]).toMatchObject({ isFooterCaption: true, color: '#000000' });
    expect(quad).toMatchObject({ layoutId: '4-grid', canvasHeader: { enabled: true, bgColor: '#ffffff' } });
    expect(quad.defaultCaptions[0]).toMatchObject({ isHeaderCaption: true });
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
    pick(/Custom Grid/);
    pick('More columns');
    pick('Fewer rows');
    pick('Create 3 Panels');
    expect(handleSelect.mock.calls[0][0]).toMatchObject({
      layoutId: 'custom-grid', name: 'Custom 3x1', isNativeLayout: true,
      layoutDef: { id: 'custom-grid', slots: 3, cols: 3, rows: 1 }, slotImages: [null, null, null], defaultCaptions: [],
    });
  });

  it('starts a blank video in the shape picked', () => {
    const handleSelect = vi.fn();
    render(<CustomLayoutBuilder kind="video" onSelectTemplate={handleSelect} />);
    fireEvent.click(screen.getByRole('radio', { name: /Portrait/ }));
    expect(screen.getByText(/An empty portrait video/)).toBeTruthy();
    pick(/Blank Canvas/);
    const template = handleSelect.mock.calls[0][0];
    expect(template).toMatchObject({ type: 'video', category: 'custom', width: 1080, height: 1350 });
    expect(template.videoLayout).toBeUndefined();
  });
});
