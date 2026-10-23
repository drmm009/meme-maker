// @vitest-environment jsdom
// Smoke tests guarding the MemeEditor refactor (docs/plans/meme-editor-split.md).
// CanvasEditor (Konva) is replaced by a stub that records the props MemeEditor
// passes it, so these tests assert on editor state rather than pixels.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';

const canvas = { props: null };

vi.mock('./CanvasEditor', async () => {
  const React = await import('react');
  const CanvasEditorStub = React.forwardRef(function CanvasEditorStub(props, _ref) {
    canvas.props = props;
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

function renderEditor(template = TEMPLATE) {
  return render(<MemeEditor template={template} onBack={vi.fn()} onSaveToGallery={vi.fn()} />);
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
    fireEvent.click(screen.getByTitle('Add Text Caption'));
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

    fireEvent.click(screen.getByTitle('Add Text Caption'));
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
    fireEvent.click(screen.getByTitle('Add Text Caption'));
    deselect();
    fireEvent.click(screen.getByTitle('Add Text Caption'));
    const ids = canvas.props.captions.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(captionTexts()).toHaveLength(4);
  }, 30000);

  it('switches between every sidebar tab without crashing', () => {
    renderEditor();
    for (const label of ['Draw', 'Media', 'AI/Filters', 'Canvas', 'Text']) {
      const tab = screen.getAllByText(label).find((el) => el.closest('.tab-btn'));
      expect(tab, `tab "${label}"`).toBeTruthy();
      fireEvent.click(tab.closest('.tab-btn'));
      expect(tab.closest('.tab-btn').className).toContain('active');
    }
  }, 30000);

  it('turns on drawing mode on the Draw tab', () => {
    renderEditor();
    const drawTab = screen.getAllByText('Draw').find((el) => el.closest('.tab-btn'));
    fireEvent.click(drawTab.closest('.tab-btn'));
    expect(canvas.props.isDrawingMode).toBe(true);
    expect(canvas.props.drawTool).toBe('brush');
  }, 30000);

  it('records drawings and clears them', () => {
    renderEditor();
    act(() => canvas.props.onAddDrawing({ points: [0, 0, 10, 10], color: '#fff', size: 4, tool: 'brush' }));
    expect(canvas.props.drawings).toHaveLength(1);

    fireEvent.click(undoButton());
    expect(canvas.props.drawings).toHaveLength(0);
  }, 30000);

  it('flips the canvas from the Canvas tab', () => {
    renderEditor();
    const canvasTab = screen.getAllByText('Canvas').find((el) => el.closest('.tab-btn'));
    fireEvent.click(canvasTab.closest('.tab-btn'));
    expect(canvas.props.canvasFlipX).toBeFalsy();
    fireEvent.click(screen.getAllByTitle(/Flip (Canvas|base template) Horizontal/i)[0]);
    expect(canvas.props.canvasFlipX).toBe(true);
  }, 30000);
});
