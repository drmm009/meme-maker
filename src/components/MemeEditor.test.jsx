// @vitest-environment jsdom
// Smoke tests guarding the MemeEditor refactor (docs/plans/meme-editor-split.md).
// CanvasEditor (Konva) is replaced by a stub that records the props MemeEditor
// passes it, so these tests assert on editor state rather than pixels.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup, act, within } from '@testing-library/react';

const canvas = { props: null };

vi.mock('./CanvasEditor', async () => {
  const React = await import('react');
  const { useMemeEditorStore } = await import('./editor/store/useMemeEditorStore');
  const { useEditorUiStore } = await import('./editor/store/useEditorUiStore');
  const CanvasEditorStub = React.forwardRef(function CanvasEditorStub(ownProps, ref) {
    // The real CanvasEditor reads the meme and drawing settings from the stores;
    // record them alongside its props so tests see everything it renders from.
    const doc = useMemeEditorStore((s) => s);
    const ui = useEditorUiStore((s) => s);
    const props = {
      captions: doc.captions,
      stickers: doc.stickers,
      imageLayers: doc.imageLayers,
      drawings: doc.drawings,
      activeLayerId: doc.activeLayerId,
      canvasFlipX: doc.canvasFlipX,
      drawTool: ui.drawTool,
      ...ownProps,
    };
    canvas.props = props;
    React.useImperativeHandle(ref, () => ({ toDataURL: () => 'data:image/png;base64,STUB' }));
    return (
      <div data-testid="canvas-stub">
        {props.captions.map((c) => (
          <span key={c.id} data-testid="caption">{c.text}</span>
        ))}
        {props.stickers.map((s) => (
          <span key={s.id} data-testid="sticker">{s.emoji}</span>
        ))}
      </div>
    );
  });
  return {
    default: CanvasEditorStub,
    TWEET_TREND_PRESETS: { viral: { label: '#1 Trending', topic: 'Trending in World', text: 'metrics' } },
  };
});
vi.mock('@imgly/background-removal', () => ({ removeBackground: vi.fn() }));
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
vi.mock('../services/memeService', () => ({ fetchOpenSourceMemes: vi.fn(() => Promise.resolve([])) }));
vi.mock('../utils/faceGraftEngine', () => ({ fuseFaceIntoTemplate: vi.fn() }));

import MemeEditor from './MemeEditor';

const TEMPLATE = {
  id: 'test-template',
  name: 'Test Template',
  imageUrl: '/images/drake-pointing.jpg',
};

function stubBrowserAPIs() {
  window.matchMedia = window.matchMedia || (() => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
  }));
  window.ResizeObserver = window.ResizeObserver || class { observe() {} unobserve() {} disconnect() {} };
  Element.prototype.scrollIntoView = Element.prototype.scrollIntoView || (() => {});
  Element.prototype.scrollTo = Element.prototype.scrollTo || (() => {});
  global.fetch = vi.fn().mockRejectedValue(new Error('offline'));
}

const captionTexts = () => screen.queryAllByTestId('caption').map((el) => el.textContent);
const deselect = () => act(() => canvas.props.onSelectLayer(null));
const undoButton = () => screen.getByTitle('Undo');
const redoButton = () => screen.getByTitle('Redo');
// The bottom deck: quick chips over a trigger bar whose "+" opens a command palette and orbit.
const bar = () => screen.getByRole('navigation', { name: 'Editor tools' });
const openSheet = () => fireEvent.click(screen.getByLabelText('Add anything'));
const pickFromSheet = (title) => {
  openSheet();
  fireEvent.click(within(screen.getByRole('dialog', { name: 'Add anything' })).getByTitle(title));
};
const addTextFromMenu = () => fireEvent.click(within(screen.getByRole('toolbar', { name: 'Quick tools' })).getByTitle('Add Text Caption'));

function renderEditor(template = TEMPLATE, onSaveToGallery = vi.fn()) {
  return render(<MemeEditor template={template} onBack={vi.fn()} onSaveToGallery={onSaveToGallery} />);
}

describe('MemeEditor', () => {
  beforeEach(() => {
    stubBrowserAPIs();
    localStorage.clear();
    canvas.props = null;
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders with default top/bottom captions for a plain template', () => {
    renderEditor();
    expect(screen.getByTestId('canvas-stub')).toBeTruthy();
    expect(captionTexts()).toEqual(['TOP TEXT', 'BOTTOM TEXT']);
    expect(canvas.props.imageUrl).toBeTruthy();
  }, 60000);

  it('uses the template captions when provided', () => {
    renderEditor({ ...TEMPLATE, captions: [{ text: 'ME', x: 0.5, y: 0.2 }, { text: 'ALSO ME', x: 0.5, y: 0.8 }] });
    expect(captionTexts()).toEqual(['ME', 'ALSO ME']);
  }, 30000);

  it('adds a caption from the Text tab and selects it', () => {
    renderEditor();
    addTextFromMenu();
    expect(captionTexts()).toEqual(['TOP TEXT', 'BOTTOM TEXT', 'NEW TEXT']);
    const added = canvas.props.captions[2];
    expect(canvas.props.activeLayerId).toBe(added.id);
  }, 30000);

  it('edits caption text through the canvas callback', () => {
    renderEditor();
    const [top] = canvas.props.captions;
    act(() => canvas.props.onUpdateCaptionText(top.id, 'WHEN THE TESTS PASS'));
    expect(captionTexts()[0]).toBe('WHEN THE TESTS PASS');
  }, 30000);

  it('undoes and redoes adding a caption', () => {
    renderEditor();
    expect(undoButton().disabled).toBe(true);

    addTextFromMenu();
    expect(captionTexts()).toHaveLength(3);
    expect(undoButton().disabled).toBe(false);

    fireEvent.click(undoButton());
    expect(captionTexts()).toEqual(['TOP TEXT', 'BOTTOM TEXT']);
    expect(redoButton().disabled).toBe(false);

    fireEvent.click(redoButton());
    expect(captionTexts()).toEqual(['TOP TEXT', 'BOTTOM TEXT', 'NEW TEXT']);
  }, 30000);

  it('deletes a layer and can undo the delete', () => {
    renderEditor();
    const [top] = canvas.props.captions;
    act(() => canvas.props.onDeleteLayer(top.id));
    expect(captionTexts()).toEqual(['BOTTOM TEXT']);

    fireEvent.click(undoButton());
    expect(captionTexts()).toEqual(['TOP TEXT', 'BOTTOM TEXT']);
  }, 30000);

  it('keeps independent captions after several adds', () => {
    renderEditor();
    addTextFromMenu();
    deselect();
    addTextFromMenu();
    const ids = canvas.props.captions.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(captionTexts()).toHaveLength(4);
  }, 30000);

  it('lists every tool in the + palette and filters it by search', () => {
    renderEditor();
    openSheet();
    const sheet = screen.getByRole('dialog', { name: 'Add anything' });
    for (const title of ['Add Text Caption', 'AI Meme Captions', 'Add Meme Stickers', 'Photo Filters', 'Watermark Settings', 'Brush: solid stroke']) {
      expect(within(sheet).getByTitle(title), title).toBeTruthy();
    }
    fireEvent.change(within(sheet).getByLabelText('Search tools'), { target: { value: 'tweet' } });
    expect(within(sheet).getByTitle('Add Chat & Speech Bubble')).toBeTruthy();
    expect(within(sheet).queryByTitle('Watermark Settings')).toBeNull();
    fireEvent.change(within(sheet).getByLabelText('Search tools'), { target: { value: 'zzz' } });
    expect(within(sheet).getByText(/No tool matches/)).toBeTruthy();
  }, 30000);

  it('shows an inspector card for the selected layer with Done', () => {
    renderEditor();
    addTextFromMenu();
    const card = screen.getByRole('toolbar', { name: 'Layer tools' });
    expect(within(card).getByText('Text Studio')).toBeTruthy();
    expect(within(card).getByText('NEW TEXT')).toBeTruthy();
    fireEvent.click(within(card).getByText('Done'));
    expect(canvas.props.activeLayerId).toBe(null);
    expect(bar()).toBeTruthy();
  }, 30000);

  it('toggles deep-fry and the top band from the quick chips', () => {
    renderEditor();
    const chips = screen.getByRole('toolbar', { name: 'Quick tools' });
    const deepFry = within(chips).getByTitle('Deep-fried filter');
    const topBand = within(chips).getByTitle('White band above the meme');
    expect(deepFry.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(deepFry);
    expect(within(chips).getByTitle('Deep-fried filter').getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(within(chips).getByTitle('Deep-fried filter'));
    expect(within(chips).getByTitle('Deep-fried filter').getAttribute('aria-pressed')).toBe('false');
    // Turning the band on adds its caption and selects it, so the inspector card opens.
    fireEvent.click(topBand);
    expect(within(screen.getByRole('toolbar', { name: 'Layer tools' })).getByText(/solve the bug/)).toBeTruthy();
  }, 30000);

  it('draws from the Draw shortcut and stops on Done', () => {
    renderEditor();
    fireEvent.click(within(bar()).getByLabelText('Draw'));
    expect(canvas.props.isDrawingMode).toBe(true);
    expect(canvas.props.drawTool).toBe('brush');
    fireEvent.click(within(screen.getByRole('toolbar', { name: 'Drawing tools' })).getByText('Marker'));
    expect(canvas.props.drawTool).toBe('highlighter');
    fireEvent.click(screen.getByText('Done'));
    expect(canvas.props.isDrawingMode).toBe(false);
  }, 30000);

  it('records drawings and clears them', () => {
    renderEditor();
    act(() => canvas.props.onAddDrawing({ points: [0, 0, 10, 10], color: '#fff', size: 4, tool: 'brush' }));
    expect(canvas.props.drawings).toHaveLength(1);

    fireEvent.click(undoButton());
    expect(canvas.props.drawings).toHaveLength(0);
  }, 30000);

  it('Save to Gallery names the meme after the template on the first save', () => {
    const onSave = vi.fn();
    renderEditor(TEMPLATE, onSave);
    fireEvent.click(screen.getByLabelText('Export'));
    fireEvent.click(screen.getByText('Save to Gallery'));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0]).toMatchObject({
      name: 'Test Template',
      imageUrl: 'data:image/png;base64,STUB',
    });
    expect(onSave.mock.calls[0][0].captions.map((c) => c.text)).toEqual(['TOP TEXT', 'BOTTOM TEXT']);
  }, 30000);

  it('flips the canvas from the + palette', () => {
    renderEditor();
    expect(canvas.props.canvasFlipX).toBeFalsy();
    pickFromSheet('Flip Canvas Horizontal');
    expect(canvas.props.canvasFlipX).toBe(true);
  }, 30000);
});
