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
vi.mock('../utils/memeDraftStore', async (importOriginal) => ({ ...(await importOriginal()), loadMemeDraft: async () => null, saveMemeDraft: async () => {} }));

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
// The bottom dock opens one sheet per section (Text, Sticker, Media, Draw, Fx).
const bar = () => screen.getByRole('navigation', { name: 'Editor tools' });
const sheet = (name) => screen.getByRole('dialog', { name });
const openSection = (title) => fireEvent.click(within(bar()).getByTitle(title));
// Sheets close from their handle (or a tap around the canvas).
const closeSheet = () => fireEvent.click(screen.getByLabelText(/^Close /));
const addTextFromMenu = () => {
  if (!screen.queryByRole('dialog', { name: 'Text' })) openSection('Text');
  fireEvent.click(within(sheet('Text')).getByText('Add Text'));
};
// Hidden (no accessible name) until the real canvas reports where the layer is, so find it by label.
const layerToolbar = () => screen.getByLabelText('Layer tools');

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

  it('opens each section of the dock as a sheet with its tools', () => {
    renderEditor();
    const expectations = {
      Text: ['AI meme captions', 'White band above the meme'],
      'Stickers and emoji': ['Add Meme Stickers', 'Add Emojis'],
      'Photos, videos and cutouts': ['Upload Image or Video', 'Add Image from Templates'],
      'Draw on the meme': ['Brush: solid stroke', 'Marker: translucent highlighter'],
      'Photo grading and effects': ['Flip Canvas Horizontal', 'Watermark'],
    };
    for (const [section, titles] of Object.entries(expectations)) {
      openSection(section);
      const panel = screen.getByRole('dialog');
      for (const title of titles) expect(within(panel).getByTitle(title), title).toBeTruthy();
      closeSheet();
    }
    expect(bar()).toBeTruthy();
  }, 30000);

  it('shows the floating tools for the selected caption once its sheet closes', () => {
    renderEditor();
    addTextFromMenu();
    closeSheet();
    const tools = layerToolbar();
    for (const name of ['Font', 'Size', 'Color', 'Bold', 'Delete']) expect(within(tools).getByText(name)).toBeTruthy();
    fireEvent.click(within(tools).getByText('Bold'));
    expect(canvas.props.captions[2].bold).toBe(false);
    // Font opens the Text sheet on the selected caption.
    fireEvent.click(within(layerToolbar()).getByText('Font'));
    expect(within(sheet('Text')).getByLabelText('Caption text').value).toBe('NEW TEXT');
  }, 30000);

  it('edits the selected caption from the Text sheet', () => {
    renderEditor();
    openSection('Text');
    const panel = sheet('Text');
    fireEvent.change(within(panel).getByLabelText('Caption text'), { target: { value: 'ME AT 3AM' } });
    expect(captionTexts()[0]).toBe('ME AT 3AM');
    fireEvent.click(within(panel).getByRole('button', { name: 'Italic' }));
    expect(canvas.props.captions[0].italic).toBe(true);
    fireEvent.click(within(panel).getByRole('switch', { name: 'Stroke' }));
    expect(canvas.props.captions[0].stroke).toBe('transparent');
    fireEvent.click(within(panel).getByText('BOTTOM TEXT'));
    expect(canvas.props.activeLayerId).toBe(canvas.props.captions[1].id);
  }, 30000);

  it('applies a filter preset from Fx and adds the top band from Text', () => {
    renderEditor();
    openSection('Photo grading and effects');
    const deepFry = within(sheet('Photo Grading & Effects')).getByText('Deep Fried 🔥').closest('button');
    expect(deepFry.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(deepFry);
    expect(within(sheet('Photo Grading & Effects')).getByText('Deep Fried 🔥').closest('button').getAttribute('aria-pressed')).toBe('true');
    expect(within(sheet('Photo Grading & Effects')).getByText('Deep Fried')).toBeTruthy();
    closeSheet();
    openSection('Text');
    fireEvent.click(within(sheet('Text')).getByTitle('White band above the meme'));
    expect(captionTexts().some((t) => /solve the bug/.test(t))).toBe(true);
  }, 30000);

  it('draws while the Draw sheet is open and stops when it closes', () => {
    renderEditor();
    openSection('Draw on the meme');
    expect(canvas.props.isDrawingMode).toBe(true);
    expect(canvas.props.drawTool).toBe('brush');
    fireEvent.click(within(sheet('Draw')).getByText('Marker'));
    expect(canvas.props.drawTool).toBe('highlighter');
    closeSheet();
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

  it('flips the canvas from the Fx sheet', () => {
    renderEditor();
    expect(canvas.props.canvasFlipX).toBeFalsy();
    openSection('Photo grading and effects');
    fireEvent.click(within(sheet('Photo Grading & Effects')).getByRole('switch', { name: 'Flip Canvas Horizontal' }));
    expect(canvas.props.canvasFlipX).toBe(true);
  }, 30000);

  it('a tap around the canvas closes the open sheet, and then deselects', () => {
    const { container } = renderEditor();
    openSection('Text');
    const wrapper = container.querySelector('.canvas-wrapper');
    fireEvent.pointerDown(wrapper);
    expect(screen.queryByRole('dialog', { name: 'Text' })).toBeNull();
    expect(canvas.props.activeLayerId).toBe(canvas.props.captions[0].id);
    fireEvent.pointerDown(wrapper);
    expect(canvas.props.activeLayerId).toBe(null);
  }, 30000);

  it('the open sheet follows the selection: picking a caption switches Sticker to Text', () => {
    renderEditor();
    openSection('Stickers and emoji');
    expect(sheet('Sticker')).toBeTruthy();
    act(() => canvas.props.onSelectLayer(canvas.props.captions[1].id));
    expect(within(sheet('Text')).getByLabelText('Caption text').value).toBe('BOTTOM TEXT');
  }, 30000);
});
