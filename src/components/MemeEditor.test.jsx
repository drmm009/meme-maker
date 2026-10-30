// @vitest-environment jsdom
// Smoke tests guarding the MemeEditor refactor (docs/plans/meme-editor-split.md).
// CanvasEditor (Konva) is replaced by a stub that records the props MemeEditor
// passes it, so these tests assert on editor state rather than pixels.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup, act, within } from '@testing-library/react';

// `animation` stands in for the moving layers' controls the real canvas carries (canvas/media).
const canvas = { props: null, animation: undefined };

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
      canvasBgColor: doc.canvasBgColor,
      drawTool: ui.drawTool,
      ...ownProps,
    };
    canvas.props = props;
    React.useImperativeHandle(ref, () => ({ toDataURL: () => 'data:image/png;base64,STUB', get animation() { return canvas.animation; } }));
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
// Each dock tab shows a strip of its tools above the dock; some tools open a sheet under the strip.
const bar = () => screen.getByRole('navigation', { name: 'Editor tools' });
const sheet = (name) => screen.getByRole('dialog', { name });
const strip = (name) => screen.getByRole('toolbar', { name });
const openSection = (title) => fireEvent.click(within(bar()).getByTitle(title));
// Sheets close from their handle (or a tap around the canvas).
const closeSheet = () => fireEvent.click(screen.getByLabelText(/^Close /));
// The Text strip, opening it from the dock unless it already shows.
const textStrip = () => {
  if (!screen.queryByRole('toolbar', { name: 'Text tools' })) openSection('Text');
  return strip('Text tools');
};
const addTextFromMenu = () => fireEvent.click(within(textStrip()).getByText('Add Text'));
const openTextSheet = () => fireEvent.click(within(textStrip()).getByText('Edit'));
// Hidden (no accessible name) until the real canvas reports where the layer is, so find it by label.
const canvasStrip = () => screen.getByRole('toolbar', { name: 'Canvas tools' });
const layerToolbar = () => screen.getByLabelText('Layer tools');

function renderEditor(template = TEMPLATE, onSaveToGallery = vi.fn()) {
  return render(<MemeEditor template={template} onBack={vi.fn()} onSaveToGallery={onSaveToGallery} />);
}

describe('MemeEditor', () => {
  beforeEach(() => {
    stubBrowserAPIs();
    localStorage.clear();
    // The first-run tour has its own test; keep it out of the others' way.
    localStorage.setItem('meme-maker-editor-tour-v1', JSON.stringify('done'));
    canvas.props = null;
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    canvas.animation = undefined;
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

  it('every dock tab shows its tool strip; tapping the tab again closes it', () => {
    renderEditor();
    const strips = [
      ['Draw on the meme', 'Draw tools', ['Brush', 'Glow', 'Marker', 'Eraser', 'Shapes', 'Censor']],
      ['Photos, videos, stickers and emoji', 'Media tools', ['Photo', 'Templates', 'Stickers', 'Emoji']],
      ['Text', 'Text tools', ['Add Text', 'Edit', 'Bubble', 'Social Card']],
      ['AI tools and photo filters', 'AI and filter tools', ['Face Swap', 'Remove BG', 'AI Caption', 'Filters']],
      ['Canvas colour, bands and watermark', 'Canvas tools', ['Color', 'Watermark', 'Mirror', 'Header', 'Footer']],
    ];
    for (const [tab, name, tools] of strips) {
      openSection(tab);
      expect(within(strip(name)).getAllByText(/./).map((el) => el.textContent), name).toEqual(tools);
      expect(within(bar()).getByTitle(tab).getAttribute('aria-pressed')).toBe('true');
      expect(screen.queryByRole('dialog')).toBeNull();
    }
    openSection('Canvas colour, bands and watermark');
    expect(screen.queryByRole('toolbar', { name: 'Canvas tools' })).toBeNull();
  }, 30000);

  it('Media adds stickers and emoji from its strip; Templates opens the picker', () => {
    renderEditor();
    openSection('Photos, videos, stickers and emoji');
    fireEvent.click(within(strip('Media tools')).getByText('Emoji'));
    fireEvent.click(screen.getByTitle('Laugh Cry'));
    expect(canvas.props.stickers).toHaveLength(1);
    expect(within(strip('Media tools')).getByLabelText('Photo').getAttribute('type')).toBe('file');
  }, 30000);

  it('Text: Bubble adds a speech bubble and opens its styles', () => {
    renderEditor();
    fireEvent.click(within(textStrip()).getByText('Bubble'));
    expect(canvas.props.captions.some((c) => c.bubbleStyle)).toBe(true);
    expect(document.querySelector('.bottom-sheet-panel')).toBeTruthy();
  }, 30000);

  it('shows the floating tools for the selected caption once its sheet closes', () => {
    renderEditor();
    addTextFromMenu();
    closeSheet();
    const tools = layerToolbar();
    for (const name of ['Font', 'Size', 'Color', 'Bold', 'Layers', 'Delete']) expect(within(tools).getByText(name)).toBeTruthy();
    fireEvent.click(within(tools).getByText('Bold'));
    expect(canvas.props.captions[2].bold).toBe(false);
    // Font opens the Text sheet on the selected caption.
    fireEvent.click(within(layerToolbar()).getByText('Font'));
    expect(within(sheet('Text')).getByLabelText('Caption text').value).toBe('NEW TEXT');
  }, 30000);

  it('Layers on the floating toolbar lists every layer, top first; select, reorder, hide and lock', () => {
    renderEditor();
    addTextFromMenu();
    closeSheet();
    for (const name of ['Font', 'Size', 'Color', 'Bold', 'Layers', 'Delete']) expect(within(layerToolbar()).getByText(name)).toBeTruthy();
    fireEvent.click(within(layerToolbar()).getByText('Layers'));
    const panel = sheet('Layers');
    const rows = () => within(screen.getByRole('list', { name: 'Layers' })).getAllByRole('listitem').map((li) => li.querySelector('.ie-layer-pick').textContent);
    expect(rows()).toEqual(['NEW TEXT', 'BOTTOM TEXT', 'TOP TEXT']);

    fireEvent.click(within(panel).getByLabelText('Send NEW TEXT backward'));
    expect(rows()).toEqual(['BOTTOM TEXT', 'NEW TEXT', 'TOP TEXT']);

    fireEvent.click(within(panel).getByLabelText('Hide TOP TEXT'));
    expect(canvas.props.captions.find((c) => c.text === 'TOP TEXT').hidden).toBe(true);
    fireEvent.click(within(panel).getByLabelText('Lock BOTTOM TEXT'));
    expect(canvas.props.captions.find((c) => c.text === 'BOTTOM TEXT').locked).toBe(true);

    fireEvent.click(within(panel).getByText('TOP TEXT'));
    expect(canvas.props.activeLayerId).toBe(canvas.props.captions.find((c) => c.text === 'TOP TEXT').id);
  }, 30000);

  it('edits the selected caption from the Text sheet', () => {
    renderEditor();
    openTextSheet();
    const panel = sheet('Text');
    expect(strip('Text tools')).toBeTruthy();
    fireEvent.change(within(panel).getByLabelText('Caption text'), { target: { value: 'ME AT 3AM' } });
    expect(captionTexts()[0]).toBe('ME AT 3AM');
    fireEvent.click(within(panel).getByRole('button', { name: 'Italic' }));
    expect(canvas.props.captions[0].italic).toBe(true);
    fireEvent.click(within(panel).getByRole('switch', { name: 'Stroke' }));
    expect(canvas.props.captions[0].stroke).toBe('transparent');
    fireEvent.click(within(panel).getByText('BOTTOM TEXT'));
    expect(canvas.props.activeLayerId).toBe(canvas.props.captions[1].id);
  }, 30000);

  it('applies a filter preset from AI/Filters and adds the top band from Canvas', () => {
    renderEditor();
    openSection('AI tools and photo filters');
    fireEvent.click(within(screen.getByRole('toolbar', { name: 'AI and filter tools' })).getByText('Filters'));
    const deepFry = within(sheet('Filters')).getByText('Deep Fried 🔥').closest('button');
    expect(deepFry.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(deepFry);
    expect(within(sheet('Filters')).getByText('Deep Fried 🔥').closest('button').getAttribute('aria-pressed')).toBe('true');
    expect(within(sheet('Filters')).getByText('Deep Fried')).toBeTruthy();
    closeSheet();
    openSection('Canvas colour, bands and watermark');
    fireEvent.click(within(canvasStrip()).getByText('Header'));
    expect(captionTexts().some((t) => /solve the bug/.test(t))).toBe(true);
  }, 30000);

  it('Draw shows Brush, Glow and Marker; a brush opens its settings and drawing stays on until Draw is tapped again', () => {
    renderEditor();
    openSection('Draw on the meme');
    const strip = screen.getByRole('toolbar', { name: 'Draw tools' });
    expect(within(strip).getAllByRole('button').map((b) => b.textContent)).toEqual(['Brush', 'Glow', 'Marker', 'Eraser', 'Shapes', 'Censor']);
    expect(canvas.props.isDrawingMode).toBe(false);

    fireEvent.click(within(strip).getByText('Marker'));
    expect(canvas.props.drawTool).toBe('highlighter');
    expect(canvas.props.isDrawingMode).toBe(true);
    const settings = sheet('Marker');
    expect(within(settings).getByLabelText('Brush colour')).toBeTruthy();
    expect(within(settings).getByLabelText('Brush size')).toBeTruthy();
    expect(within(settings).getByText('Clear drawing')).toBeTruthy();

    // Switching brush from the strip above the open settings.
    fireEvent.click(within(screen.getByRole('toolbar', { name: 'Draw tools' })).getByText('Glow'));
    expect(sheet('Glow')).toBeTruthy();
    closeSheet();
    expect(canvas.props.isDrawingMode).toBe(true);
    expect(within(bar()).getByTitle('Draw on the meme').getAttribute('aria-pressed')).toBe('true');

    openSection('Draw on the meme');
    expect(canvas.props.isDrawingMode).toBe(false);
    expect(screen.queryByRole('toolbar', { name: 'Draw tools' })).toBeNull();
  }, 30000);

  it('Shapes and Censor: their sheets pick the shape or the censor style, and drawing stays on', () => {
    renderEditor();
    openSection('Draw on the meme');
    fireEvent.click(within(strip('Draw tools')).getByText('Shapes'));
    expect(canvas.props.drawTool).toBe('shape');
    expect(canvas.props.isDrawingMode).toBe(true);
    const shapes = sheet('Shapes');
    for (const name of ['Arrow', 'Circle', 'Box', 'Line']) expect(within(shapes).getByText(name)).toBeTruthy();
    expect(within(shapes).queryByRole('switch', { name: 'Fill shape' })).toBeNull();
    fireEvent.click(within(shapes).getByText('Box'));
    expect(within(sheet('Shapes')).getByText('Box').closest('button').getAttribute('aria-pressed')).toBe('true');
    expect(within(sheet('Shapes')).getByRole('switch', { name: 'Fill shape' })).toBeTruthy();

    fireEvent.click(within(strip('Draw tools')).getByText('Censor'));
    const censor = sheet('Censor');
    for (const name of ['Blur', 'Pixelate', 'Black bar']) expect(within(censor).getByText(name)).toBeTruthy();
    expect(within(censor).getByLabelText('Censor strength')).toBeTruthy();
    fireEvent.click(within(censor).getByText('Black bar'));
    expect(within(sheet('Censor')).queryByLabelText('Censor strength')).toBeNull();

    // A dragged-out shape is saved like a stroke, and undo removes it.
    act(() => canvas.props.onAddDrawing({ id: 's', type: 'shape', shape: 'rect', color: '#fff', size: 4, points: [{ x: 0, y: 0 }, { x: 40, y: 40 }] }));
    expect(canvas.props.drawings).toHaveLength(1);
    fireEvent.click(undoButton());
    expect(canvas.props.drawings).toHaveLength(0);
  }, 30000);

  it('a selected shape can be copied, deleted, restyled and moved', () => {
    renderEditor();
    act(() => canvas.props.onAddDrawing({ id: 'arrow-1', type: 'shape', shape: 'arrow', color: '#ffffff', size: 6, points: [{ x: 0, y: 0 }, { x: 80, y: 0 }] }));
    act(() => canvas.props.onSelectLayer('arrow-1'));
    expect(['Style', 'Copy', 'Delete'].every((name) => within(layerToolbar()).queryByText(name))).toBe(true);

    fireEvent.click(within(layerToolbar()).getByText('Copy'));
    expect(canvas.props.drawings).toHaveLength(2);
    expect(canvas.props.drawings[1].points[0]).toEqual({ x: 24, y: 24 });
    expect(canvas.props.activeLayerId).toBe(canvas.props.drawings[1].id);
    fireEvent.click(within(layerToolbar()).getByText('Delete'));
    expect(canvas.props.drawings.map((d) => d.id)).toEqual(['arrow-1']);

    // Style opens the Shapes sheet on the shape: it shows and changes that shape.
    act(() => canvas.props.onSelectLayer('arrow-1'));
    fireEvent.click(within(layerToolbar()).getByText('Style'));
    expect(canvas.props.drawTool).toBe('shape');
    expect(within(sheet('Shapes')).getByText('Arrow').closest('button').getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(within(sheet('Shapes')).getByText('Box'));
    expect(canvas.props.drawings[0].shape).toBe('rect');

    // Dragging it on the canvas moves it.
    act(() => canvas.props.onUpdateDrawing('arrow-1', { points: [{ x: 10, y: 10 }, { x: 90, y: 10 }] }));
    expect(canvas.props.drawings[0].points[0]).toEqual({ x: 10, y: 10 });
  }, 30000);

  it('clears the drawing from the brush settings', () => {
    renderEditor();
    act(() => canvas.props.onAddDrawing({ points: [0, 0, 10, 10], color: '#fff', size: 4, tool: 'brush' }));
    openSection('Draw on the meme');
    fireEvent.click(within(screen.getByRole('toolbar', { name: 'Draw tools' })).getByText('Brush'));
    fireEvent.click(within(sheet('Brush')).getByText('Clear drawing'));
    expect(canvas.props.drawings).toHaveLength(0);
  }, 30000);

  it('records drawings and clears them', () => {
    renderEditor();
    act(() => canvas.props.onAddDrawing({ points: [0, 0, 10, 10], color: '#fff', size: 4, tool: 'brush' }));
    expect(canvas.props.drawings).toHaveLength(1);

    fireEvent.click(undoButton());
    expect(canvas.props.drawings).toHaveLength(0);
  }, 30000);

  it('Export opens a sheet with format, quality and size; the choices are remembered', () => {
    const { unmount } = renderEditor();
    fireEvent.click(screen.getByLabelText('Export'));
    const panel = sheet('Export');
    for (const name of ['Download', 'Share', 'Copy', 'Save to Gallery']) expect(within(panel).getByText(name)).toBeTruthy();
    expect(within(panel).queryByLabelText('Quality')).toBeNull();
    expect(within(panel).getByRole('switch', { name: 'Transparent background' })).toBeTruthy();
    fireEvent.click(within(panel).getByRole('radio', { name: 'JPG' }));
    expect(within(sheet('Export')).getByLabelText('Quality')).toBeTruthy();
    // JPG can't be see-through.
    expect(within(sheet('Export')).queryByRole('switch', { name: 'Transparent background' })).toBeNull();
    unmount();
    renderEditor();
    fireEvent.click(screen.getByLabelText('Export'));
    expect(within(sheet('Export')).getByRole('radio', { name: 'JPG' }).getAttribute('aria-checked')).toBe('true');
  }, 30000);

  it('Export offers GIF and MP4 only when something on the meme moves', () => {
    const { unmount } = renderEditor();
    fireEvent.click(screen.getByLabelText('Export'));
    expect(within(sheet('Export')).queryByRole('radio', { name: 'GIF' })).toBeNull();
    unmount();

    canvas.animation = { loopsMs: [1200], pause: () => {}, resume: () => {}, seek: async () => {} };
    const moving = renderEditor();
    fireEvent.click(screen.getByLabelText('Export'));
    expect(within(sheet('Export')).getByText('Your meme moves: GIF and MP4 keep it moving.')).toBeTruthy();
    fireEvent.click(within(sheet('Export')).getByRole('radio', { name: 'MP4' }));
    const panel = sheet('Export');
    // An MP4 runs whole loops for at least three seconds, has no sound, and can't be copied.
    expect(within(panel).getByText(/MP4 · \d+ × \d+ · 3\.6 s · no sound/)).toBeTruthy();
    expect(within(panel).queryByText('Copy')).toBeNull();
    expect(within(panel).queryByText('Save to Gallery')).toBeNull();
    expect(within(panel).queryByRole('switch', { name: 'Transparent background' })).toBeNull();
    fireEvent.click(within(panel).getByRole('radio', { name: 'GIF' }));
    // GIFs have their own size.
    expect(within(sheet('Export')).queryByRole('radiogroup', { name: 'Image width' })).toBeNull();

    // The GIF choice is remembered, but a meme that doesn't move exports a PNG.
    moving.unmount();
    canvas.animation = undefined;
    renderEditor();
    fireEvent.click(screen.getByLabelText('Export'));
    expect(within(sheet('Export')).getByRole('radio', { name: 'PNG' }).getAttribute('aria-checked')).toBe('true');
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

  it('flips the canvas from the Canvas sheet', () => {
    renderEditor();
    expect(canvas.props.canvasFlipX).toBeFalsy();
    openSection('Canvas colour, bands and watermark');
    fireEvent.click(within(canvasStrip()).getByText('Mirror'));
    expect(canvas.props.canvasFlipX).toBe(true);
    expect(within(canvasStrip()).getByText('Mirror').closest('button').getAttribute('aria-pressed')).toBe('true');
  }, 30000);

  it('Canvas shows Color, Watermark, Mirror, Header and Footer; Color and Watermark open sheets under the strip', () => {
    renderEditor();
    openSection('Canvas colour, bands and watermark');
    expect(within(canvasStrip()).getAllByRole('button').map((b) => b.textContent)).toEqual(['Color', 'Watermark', 'Mirror', 'Header', 'Footer']);

    fireEvent.click(within(canvasStrip()).getByText('Color'));
    fireEvent.click(within(sheet('Background')).getByRole('radio', { name: '#000000' }));
    expect(canvas.props.canvasBgColor).toBe('#000000');
    expect(canvasStrip()).toBeTruthy();

    fireEvent.click(within(canvasStrip()).getByText('Watermark'));
    const wm = sheet('Watermark');
    expect(within(wm).getByRole('switch', { name: 'Watermark' }).getAttribute('aria-checked')).toBe('true');
    fireEvent.change(within(wm).getByLabelText('Watermark name'), { target: { value: 'memelord' } });
    expect(within(wm).getByLabelText('Watermark name').value).toBe('memelord');

    // Footer switches straight away; tapping Canvas again closes the strip and its sheet.
    fireEvent.click(within(canvasStrip()).getByText('Footer'));
    expect(within(canvasStrip()).getByText('Footer').closest('button').getAttribute('aria-pressed')).toBe('true');
    closeSheet();
    openSection('Canvas colour, bands and watermark');
    expect(screen.queryByRole('toolbar', { name: 'Canvas tools' })).toBeNull();
  }, 30000);

  it('AI/Filters shows Face Swap, Remove BG, AI Caption and Filters; AI Caption opens its studio', () => {
    renderEditor();
    openSection('AI tools and photo filters');
    const strip = screen.getByRole('toolbar', { name: 'AI and filter tools' });
    expect(within(strip).getAllByRole('button').map((b) => b.textContent)).toEqual(['Face Swap', 'Remove BG', 'AI Caption', 'Filters']);
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(within(strip).getByText('AI Caption'));
    expect(document.querySelector('.bottom-sheet-panel')?.textContent).toContain('AI Captions');
  }, 30000);

  it('Filters opens under the AI/Filters strip; tapping AI/Filters again closes both', () => {
    renderEditor();
    openSection('AI tools and photo filters');
    const strip = () => screen.getByRole('toolbar', { name: 'AI and filter tools' });
    fireEvent.click(within(strip()).getByText('Filters'));
    expect(sheet('Filters')).toBeTruthy();
    expect(within(strip()).getByText('Filters').closest('button').getAttribute('aria-pressed')).toBe('true');
    closeSheet();
    expect(strip()).toBeTruthy();
    openSection('AI tools and photo filters');
    expect(screen.queryByRole('toolbar', { name: 'AI and filter tools' })).toBeNull();
  }, 30000);

  it('Text sheet: outline thickness, gradient, letter spacing, line height and shadow', () => {
    renderEditor();
    openTextSheet();
    const panel = sheet('Text');
    fireEvent.change(within(panel).getByLabelText('Outline thickness'), { target: { value: '12' } });
    expect(canvas.props.captions[0].strokeWidth).toBe(12);
    fireEvent.click(within(panel).getByRole('radio', { name: 'Gold gradient' }));
    expect(canvas.props.captions[0].gradient).toEqual(['#f7971e', '#ffd200']);
    fireEvent.change(within(sheet('Text')).getByLabelText('Letter spacing'), { target: { value: '0.2' } });
    fireEvent.change(within(sheet('Text')).getByLabelText('Line height'), { target: { value: '1.5' } });
    expect(canvas.props.captions[0]).toMatchObject({ letterSpacing: 0.2, lineHeight: 1.5 });
    expect(within(sheet('Text')).queryByLabelText('Shadow colour')).toBeNull();
    fireEvent.change(within(sheet('Text')).getByLabelText('Shadow size'), { target: { value: '8' } });
    fireEvent.click(within(within(sheet('Text')).getByRole('radiogroup', { name: 'Shadow colour' })).getByRole('radio', { name: '#ff5a36' }));
    expect(canvas.props.captions[0].shadowColor).toBe('#ff5a36');
    expect(canvas.props.captions[0].shadowSize).toBe(8);
    expect(within(sheet('Text')).getByLabelText('Upload your own font')).toBeTruthy();
    // Turning the outline off hides its thickness.
    fireEvent.click(within(sheet('Text')).getByRole('switch', { name: 'Stroke' }));
    expect(within(sheet('Text')).queryByLabelText('Outline thickness')).toBeNull();
  }, 30000);

  it('a tap around the canvas closes the open sheet, and then deselects', () => {
    const { container } = renderEditor();
    openTextSheet();
    const wrapper = container.querySelector('.canvas-wrapper');
    fireEvent.pointerDown(wrapper);
    expect(screen.queryByRole('dialog', { name: 'Text' })).toBeNull();
    expect(canvas.props.activeLayerId).toBe(canvas.props.captions[0].id);
    fireEvent.pointerDown(wrapper);
    expect(canvas.props.activeLayerId).toBe(null);
  }, 30000);

  it('the Media sheet sets how a sticker sits: upside down, opacity, blend and shadow', () => {
    renderEditor();
    openSection('Photos, videos, stickers and emoji');
    fireEvent.click(within(strip('Media tools')).getByText('Emoji'));
    fireEvent.click(screen.getByTitle('Laugh Cry'));
    fireEvent.click(screen.getByLabelText('Close'));
    fireEvent.click(within(layerToolbar()).getByText('Size'));
    const media = sheet('Media');
    fireEvent.click(within(media).getByRole('switch', { name: 'Flip upside down' }));
    fireEvent.click(within(within(media).getByRole('group', { name: 'Blend mode' })).getByText('Screen'));
    fireEvent.change(within(media).getByLabelText('Opacity'), { target: { value: '0.5' } });
    fireEvent.change(within(media).getByLabelText('Shadow size'), { target: { value: '12' } });
    expect(canvas.props.stickers[0]).toMatchObject({ flipY: true, blend: 'screen', opacity: 0.5, shadowSize: 12 });
    expect(within(sheet('Media')).getByRole('radiogroup', { name: 'Shadow colour' })).toBeTruthy();
    // Corners and border are for photos.
    expect(within(sheet('Media')).queryByLabelText('Corner rounding')).toBeNull();
  }, 30000);

  it('the open sheet follows the selection: picking a caption switches Media to Text', () => {
    renderEditor();
    openSection('Photos, videos, stickers and emoji');
    fireEvent.click(within(strip('Media tools')).getByText('Emoji'));
    fireEvent.click(screen.getByTitle('Laugh Cry'));
    fireEvent.click(screen.getByLabelText('Close'));
    // The new sticker's Size opens the Media sheet under the Media strip.
    fireEvent.click(within(layerToolbar()).getByText('Size'));
    expect(within(sheet('Media')).getByLabelText('Sticker size')).toBeTruthy();
    expect(strip('Media tools')).toBeTruthy();
    act(() => canvas.props.onSelectLayer(canvas.props.captions[1].id));
    expect(within(sheet('Text')).getByLabelText('Caption text').value).toBe('BOTTOM TEXT');
    expect(strip('Text tools')).toBeTruthy();
  }, 30000);
});
