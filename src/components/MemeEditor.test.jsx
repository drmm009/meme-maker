// @vitest-environment jsdom
// Smoke tests guarding the MemeEditor refactor (docs/plans/meme-editor-split.md).
// CanvasEditor (Konva) is replaced by a stub that records the props MemeEditor
// passes it, so these tests assert on editor state rather than pixels.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup, act, within } from '@testing-library/react';

// `animation` stands in for the moving layers' controls the real canvas carries (canvas/media).
const canvas = { props: null, ui: null, animation: undefined };

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
      canvasBgGradient: doc.canvasBgGradient,
      imageFilters: doc.imageFilters,
      template: doc.activeTemplate,
      drawTool: ui.drawTool,
      ...ownProps,
    };
    canvas.props = props;
    canvas.ui = ui;
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
const openTextSheet = () => act(() => canvas.ui.openSheet('text'));
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
    canvas.ui = null;
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

  it('deleting the text in the header leaves the header band on', () => {
    renderEditor();
    openSection('Canvas colour, bands and watermark');
    fireEvent.click(within(canvasStrip()).getByText('Header'));
    const header = canvas.props.captions.find((c) => c.isHeaderCaption);
    act(() => canvas.props.onDeleteLayer(header.id));
    expect(captionTexts()).toEqual(['TOP TEXT', 'BOTTOM TEXT']);
    expect(within(sheet('Header')).getByRole('switch', { name: 'Header' }).getAttribute('aria-checked')).toBe('true');
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
      ['Photos, videos, stickers and emoji', 'Media tools', ['Photo', 'Templates', 'Stickers', 'GIFs', 'Emoji']],
      ['Text', 'Text tools', ['Add Text', 'Bubble', 'Social Card']],
      ['AI tools and photo filters', 'AI and filter tools', ['Face Swap', 'Background', 'AI Caption', 'Filters']],
      ['Canvas colour, bands and watermark', 'Canvas tools', ['Canvas Style', 'Watermark', 'Header', 'Footer']],
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
    // The new sticker is selected, so its tools pill sits where the strip was; deselecting brings it back.
    expect(layerToolbar()).toBeTruthy();
    expect(screen.queryByRole('toolbar', { name: 'Media tools' })).toBeNull();
    act(() => canvas.props.onSelectLayer(null));
    expect(screen.queryByRole('toolbar', { name: 'Layer tools' })).toBeNull();
    expect(within(strip('Media tools')).getByLabelText('Photo').getAttribute('type')).toBe('file');
  }, 30000);

  it('the Media pickers open full height over the meme, and close after a pick', () => {
    renderEditor();
    openSection('Photos, videos, stickers and emoji');
    const tool = (name) => within(strip('Media tools')).getByText(name).closest('button');

    // Stickers: a shelf per category; See all shows one as a grid, with a way back; a search
    // looks through all of them, then a pick adds it and closes.
    fireEvent.click(tool('Stickers'));
    const stickers = sheet('Stickers');
    expect(screen.queryByRole('toolbar', { name: 'Media tools' })).toBeNull();
    expect(document.querySelector('.bottom-sheet-panel')).toBeNull();
    expect(within(stickers).getByRole('region', { name: 'Bubbles' })).toBeTruthy();
    const tiles = within(stickers).getByRole('toolbar', { name: 'Stickers categories' });
    expect(within(tiles).getByText('All').closest('button').getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(within(stickers).getByRole('button', { name: 'See all bubbles' }));
    expect(within(tiles).getByText('Bubbles').closest('button').getAttribute('aria-pressed')).toBe('true');
    expect(within(stickers).queryByRole('region', { name: 'Memes' })).toBeNull();
    fireEvent.click(within(stickers).getByText('All stickers'));
    expect(within(stickers).getByRole('region', { name: 'Memes' })).toBeTruthy();
    fireEvent.change(within(stickers).getByLabelText('Search stickers'), { target: { value: 'doge' } });
    expect(within(tiles).getByText('All').closest('button').getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(within(stickers).getAllByRole('button', { name: /doge/i })[0]);
    expect(canvas.props.stickers).toHaveLength(1);
    expect(canvas.props.stickers[0].url).toBeTruthy();
    expect(screen.queryByRole('dialog', { name: 'Stickers' })).toBeNull();
    act(() => canvas.props.onSelectLayer(null));
    expect(strip('Media tools')).toBeTruthy();

    // Each closes from its own button, back to the strip.
    fireEvent.click(tool('Emoji'));
    expect(sheet('Emoji')).toBeTruthy();
    fireEvent.click(within(sheet('Emoji')).getByLabelText('Close emoji'));
    expect(screen.queryByRole('dialog', { name: 'Emoji' })).toBeNull();
    expect(strip('Media tools')).toBeTruthy();

    // Templates adds the template's picture as a photo layer.
    fireEvent.click(tool('Templates'));
    const templates = sheet('Templates');
    fireEvent.click(within(templates).getAllByRole('button', { name: /drake/i })[0]);
    expect(canvas.props.imageLayers).toHaveLength(1);
    expect(screen.queryByRole('dialog', { name: 'Templates' })).toBeNull();
  }, 30000);

  it('Templates opens full height with Explore-style shelves, search and its own close', () => {
    renderEditor();
    openSection('Photos, videos, stickers and emoji');
    fireEvent.click(within(strip('Media tools')).getByText('Templates').closest('button'));
    const templates = sheet('Templates');
    // Over the meme, without the strip; trending leads with memes, not social post cards.
    expect(screen.queryByRole('toolbar', { name: 'Media tools' })).toBeNull();
    const trending = within(templates).getByRole('region', { name: 'Trending now' });
    expect(within(trending).getAllByRole('button', { name: /^Star / })).toHaveLength(10);
    expect(within(trending).queryByRole('button', { name: /Post Card/ })).toBeNull();

    // A shelf's See all shows that category as a grid, with a way back.
    fireEvent.click(within(templates).getByRole('button', { name: 'See all reactions' }));
    const chips = within(templates).getByRole('toolbar', { name: 'Templates categories' });
    expect(within(chips).getByRole('button', { name: /^Reactions/ }).getAttribute('aria-pressed')).toBe('true');
    expect(within(templates).queryByRole('region', { name: 'Trending now' })).toBeNull();
    fireEvent.click(within(templates).getByText('All templates'));
    expect(within(templates).getByRole('region', { name: 'Trending now' })).toBeTruthy();

    // A star is remembered, for the home screen and Explore too.
    const starBtn = within(within(templates).getByRole('region', { name: 'Trending now' })).getAllByRole('button', { name: /^Star / })[0];
    fireEvent.click(starBtn);
    expect(starBtn.getAttribute('aria-pressed')).toBe('true');
    expect(JSON.parse(localStorage.getItem('meme_favorite_templates'))).toHaveLength(1);
    fireEvent.click(starBtn);
    expect(JSON.parse(localStorage.getItem('meme_favorite_templates'))).toHaveLength(0);

    fireEvent.change(within(templates).getByLabelText('Search templates'), { target: { value: 'zzqx' } });
    expect(within(templates).getByText('Nothing matches “zzqx”')).toBeTruthy();
    fireEvent.click(within(templates).getByText('Clear search'));
    expect(within(templates).getByRole('region', { name: 'Trending now' })).toBeTruthy();

    fireEvent.click(within(templates).getByLabelText('Close templates'));
    expect(screen.queryByRole('dialog', { name: 'Templates' })).toBeNull();
    expect(strip('Media tools')).toBeTruthy();
  }, 30000);

  it('Text: Bubble adds a speech bubble and opens its styles', () => {
    renderEditor();
    fireEvent.click(within(textStrip()).getByText('Bubble'));
    expect(canvas.props.captions.some((c) => c.bubbleStyle)).toBe(true);
    // The styles dock under the Text strip; picking one restyles the new bubble.
    const bubbles = sheet('Bubbles');
    expect(document.querySelector('.bottom-sheet-panel')).toBeNull();
    fireEvent.click(within(bubbles).getByText('WhatsApp Sent').closest('button'));
    expect(canvas.props.captions.some((c) => c.bubbleStyle === 'whatsapp-send')).toBe(true);
    closeSheet();
    const tools = layerToolbar();
    expect([...tools.querySelectorAll('button > span:last-child')].map((s) => s.textContent)).toEqual(['Font', 'Color', 'Box', 'Bubble', 'Copy', 'Layers', 'Delete']);
  }, 30000);

  it('hides the aspect ratio pill while a sheet is open', () => {
    renderEditor();
    expect(screen.getByRole('radiogroup', { name: 'Aspect ratio' })).toBeTruthy();
    openTextSheet();
    expect(screen.queryByRole('radiogroup', { name: 'Aspect ratio' })).toBeNull();
    closeSheet();
    expect(screen.getByRole('radiogroup', { name: 'Aspect ratio' })).toBeTruthy();
  });

  it('shows the floating tools for the selected caption once its sheet closes', () => {
    renderEditor();
    addTextFromMenu();
    const tools = layerToolbar();
    // Five Text sheets, each with its related controls, then the layer tools.
    expect([...tools.querySelectorAll('button > span:last-child')].map((s) => s.textContent)).toEqual(['Font', 'Style', 'Align', 'Color', 'Box', 'Copy', 'Layers', 'Delete']);

    // Font: the fonts and saved styles, nothing else.
    fireEvent.click(within(tools).getByText('Font'));
    const font = sheet('Font');
    expect(within(font).getByLabelText('Upload your own font')).toBeTruthy();
    expect(within(font).getByRole('group', { name: 'Saved text styles' })).toBeTruthy();
    expect(within(font).queryByLabelText('Caption text')).toBeNull();
    expect(within(font).queryByLabelText('Text size')).toBeNull();
    expect(within(font).queryByRole('group', { name: 'Captions' })).toBeNull();
    closeSheet();

    // Style: size, bold and the rest, effects.
    fireEvent.click(within(layerToolbar()).getByText('Style'));
    const style = sheet('Style');
    fireEvent.click(within(style).getByLabelText('Bold'));
    expect(canvas.props.captions[2].bold).toBe(false);
    expect(within(style).getByLabelText('Text size')).toBeTruthy();
    expect(within(style).getByRole('group', { name: 'Text effects' })).toBeTruthy();
    expect(within(style).queryByLabelText('Letter spacing')).toBeNull();
    expect(within(style).queryByRole('switch', { name: 'Shrink to fit' })).toBeNull();
    expect(within(style).queryByLabelText('Text colour')).toBeNull();
    closeSheet();

    // Align: alignment and spacing.
    fireEvent.click(within(layerToolbar()).getByText('Align'));
    const align = sheet('Align');
    fireEvent.click(within(align).getByRole('radio', { name: 'Left' }));
    expect(canvas.props.captions[2].align).toBe('left');
    expect(within(align).getByLabelText('Letter spacing')).toBeTruthy();
    expect(within(align).getByLabelText('Line height')).toBeTruthy();
    expect(within(align).queryByLabelText('Text size')).toBeNull();
    closeSheet();

    // Color: colour and outline (no shadow in color sheet).
    fireEvent.click(within(layerToolbar()).getByText('Color'));
    const color = sheet('Color');
    expect(within(color).getByLabelText('Text colour')).toBeTruthy();
    expect(within(color).getByLabelText('Stroke')).toBeTruthy();
    expect(within(color).queryByLabelText('Shadow size')).toBeNull();
    closeSheet();

    // Box: the box behind the text and opacity, no effects.
    fireEvent.click(within(layerToolbar()).getByText('Box'));
    const box = sheet('Box');
    expect(within(box).getByLabelText('Text box colour')).toBeTruthy();
    expect(within(box).getByLabelText('Text opacity')).toBeTruthy();
    expect(within(box).queryByRole('group', { name: 'Text effects' })).toBeNull();
    closeSheet();
  }, 30000);

  it('Layers on the floating toolbar lists every layer, top first; select, reorder, hide and lock', () => {
    renderEditor();
    addTextFromMenu();
    for (const name of ['Font', 'Style', 'Align', 'Color', 'Box', 'Copy', 'Layers', 'Delete']) expect(within(layerToolbar()).getByText(name)).toBeTruthy();
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

  it('Layers: Select picks several to group, ungroup or delete; shapes have their own list', () => {
    renderEditor();
    act(() => canvas.props.onAddDrawing({ id: 'shape-a', type: 'shape', shape: 'arrow', color: '#fff', size: 4, points: [{ x: 0, y: 0 }, { x: 40, y: 0 }] }));
    act(() => canvas.props.onSelectLayer(canvas.props.captions[0].id));
    fireEvent.click(within(layerToolbar()).getByText('Layers'));
    const shapes = screen.getByRole('list', { name: 'Shapes' });
    expect(within(shapes).getByText('Arrow')).toBeTruthy();
    fireEvent.click(within(shapes).getByLabelText('Hide Arrow'));
    expect(canvas.props.drawings[0].hidden).toBe(true);

    fireEvent.click(within(sheet('Layers')).getByRole('button', { name: 'Select' }));
    const list = screen.getByRole('list', { name: 'Layers' });
    fireEvent.click(within(list).getByText('TOP TEXT'));
    fireEvent.click(within(list).getByText('BOTTOM TEXT'));
    const bar = screen.getByRole('group', { name: 'Arrange chosen layers' });
    expect(within(bar).getByText('2 chosen')).toBeTruthy();
    // Spreading out needs three.
    expect(within(bar).getByLabelText('Spread out across').disabled).toBe(true);
    fireEvent.click(within(bar).getByText('Group'));
    const [top, bottom] = canvas.props.captions;
    expect(top.groupId).toBeTruthy();
    expect(bottom.groupId).toBe(top.groupId);
    fireEvent.click(within(bar).getByText('Ungroup'));
    expect(canvas.props.captions.every((c) => !c.groupId)).toBe(true);
    fireEvent.click(within(bar).getByText('Delete'));
    expect(canvas.props.captions).toHaveLength(0);
    fireEvent.click(undoButton());
    expect(canvas.props.captions).toHaveLength(2);
  }, 30000);

  it('renames a layer from the Layers sheet, and undo restores its automatic name', async () => {
    renderEditor();
    act(() => canvas.props.onSelectLayer(canvas.props.captions[0].id));
    fireEvent.click(within(layerToolbar()).getByText('Layers'));
    const panel = sheet('Layers');
    const rows = () => within(screen.getByRole('list', { name: 'Layers' })).getAllByRole('listitem').map((li) => li.querySelector('.ie-layer-pick').textContent);
    expect(rows()).toContain('TOP TEXT');

    fireEvent.click(within(panel).getByLabelText('Rename TOP TEXT'));
    const input = within(panel).getByLabelText('New name for TOP TEXT');
    expect(input.value).toBe('TOP TEXT');

    fireEvent.change(input, { target: { value: 'Punchline' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(rows()).toContain('Punchline');
    expect(rows()).not.toContain('TOP TEXT');

    await vi.waitFor(() => expect(undoButton().disabled).toBe(false), { timeout: 2000 });
    fireEvent.click(undoButton());

    expect(rows()).toContain('TOP TEXT');
    expect(rows()).not.toContain('Punchline');
  }, 30000);

  it('pressing ? opens the sheet on Shortcuts and shows keyboard shortcuts', () => {
    renderEditor();
    fireEvent.keyDown(document, { key: '?' });
    const panel = sheet('History & saved');
    expect(within(panel).getByText('Undo')).toBeTruthy();
    expect(within(panel).getByText('Duplicate the selected layer')).toBeTruthy();
  });

  it('Text: saved styles put on another caption', () => {
    renderEditor();
    openTextSheet();
    const panel = () => sheet('Text');
    expect(within(panel()).queryByRole('switch', { name: 'Shrink to fit' })).toBeNull();
    fireEvent.click(within(panel()).getByRole('button', { name: 'Italic' }));
    fireEvent.click(within(panel()).getByText('Save this style'));
    expect(within(panel()).getByLabelText('Use saved style 1')).toBeTruthy();
    fireEvent.click(within(within(panel()).getByRole('group', { name: 'Captions' })).getByText('BOTTOM TEXT'));
    fireEvent.click(within(panel()).getByLabelText('Use saved style 1'));
    expect(canvas.props.captions[1]).toMatchObject({ italic: true, text: 'BOTTOM TEXT' });
    fireEvent.click(within(panel()).getByLabelText('Remove saved style 1'));
    expect(within(panel()).queryByLabelText('Use saved style 1')).toBeNull();
  }, 30000);

  it('History lists the steps and jumps back and forward to any of them', () => {
    renderEditor();
    act(() => canvas.props.onAddDrawing({ points: [0, 0, 10, 10], color: '#fff', size: 4, tool: 'brush' }));
    addTextFromMenu();
    fireEvent.click(screen.getByLabelText('History and saved memes'));
    const steps = () => within(screen.getByRole('list', { name: 'History' })).getAllByRole('button').map((b) => b.textContent);
    expect(steps()).toEqual(['Added textNow', 'Added drawing', 'Start']);
    fireEvent.click(within(screen.getByRole('list', { name: 'History' })).getByText('Start'));
    expect(canvas.props.drawings).toHaveLength(0);
    expect(canvas.props.captions).toHaveLength(2);
    fireEvent.click(within(screen.getByRole('list', { name: 'History' })).getByText('Added text'));
    expect(canvas.props.captions).toHaveLength(3);
    expect(canvas.props.drawings).toHaveLength(1);
    fireEvent.click(within(sheet('History & saved')).getByRole('radio', { name: 'My memes' }));
    expect(within(sheet('History & saved')).getByText('Save project')).toBeTruthy();
  }, 30000);

  it('the outline stays on whatever the text colour, and its colour can be picked', () => {
    renderEditor();
    openTextSheet();
    const panel = () => sheet('Text');
    act(() => canvas.props.onUpdateCaptionBounds(canvas.props.captions[0].id, { stroke: 'transparent' }));
    fireEvent.click(within(panel()).getByRole('switch', { name: 'Stroke' }));
    expect(canvas.props.captions[0].stroke).toBe('#000000');
    fireEvent.click(within(within(panel()).getByRole('radiogroup', { name: 'Text colour' })).getAllByRole('radio')[1]);
    // A coloured caption keeps its outline (it used to switch off).
    expect(canvas.props.captions[0].stroke).not.toBe('transparent');
    fireEvent.click(within(panel()).getByRole('radio', { name: '#ff2a5f' }));
    expect(canvas.props.captions[0].stroke).toBe('#ff2a5f');
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

  it('Filters adds warmth, sharpen and vignette for the photo', () => {
    renderEditor();
    openSection('AI tools and photo filters');
    fireEvent.click(within(screen.getByRole('toolbar', { name: 'AI and filter tools' })).getByText('Filters'));
    const panel = sheet('Filters');
    // The adjustments stay folded away until asked for.
    expect(within(panel).queryByLabelText('Warmth')).toBeNull();
    expect(within(panel).queryByRole('radiogroup', { name: 'Apply to' })).toBeNull();
    fireEvent.click(within(panel).getByRole('button', { name: 'Adjustments' }));
    expect(within(panel).getByRole('button', { name: 'Adjustments' }).getAttribute('aria-expanded')).toBe('true');
    expect(Number(within(panel).getByLabelText('Warmth').value)).toBe(0);
    fireEvent.change(within(panel).getByLabelText('Warmth'), { target: { value: '40' } });
    fireEvent.change(within(panel).getByLabelText('Vignette'), { target: { value: '60' } });
    expect(canvas.props.imageFilters).toMatchObject({ warmth: 40, vignette: 60 });
    expect(within(sheet('Filters')).queryByLabelText('Background blur')).toBeNull();
  }, 30000);

  it('applies a filter preset from AI/Filters and adds the top band from Canvas', () => {
    renderEditor();
    openSection('AI tools and photo filters');
    fireEvent.click(within(screen.getByRole('toolbar', { name: 'AI and filter tools' })).getByText('Filters'));
    const deepFry = within(sheet('Filters')).getByText('Deep Fried 🔥').closest('button');
    expect(deepFry.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(deepFry);
    expect(within(sheet('Filters')).getByText('Deep Fried 🔥').closest('button').getAttribute('aria-pressed')).toBe('true');
    expect(within(sheet('Filters')).getByText('Preset: Deep Fried')).toBeTruthy();
    closeSheet();
    openSection('Canvas colour, bands and watermark');
    fireEvent.click(within(canvasStrip()).getByText('Header'));
    expect(captionTexts().some((t) => /Add header text/.test(t))).toBe(true);
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

  it('Copy starts the clipboard write inside the tap, with the picture to come (Safari needs that)', () => {
    const items = [];
    const write = vi.fn(() => Promise.resolve());
    const hadItem = 'ClipboardItem' in window;
    window.ClipboardItem = class { constructor(data) { items.push(data); } };
    Object.defineProperty(navigator, 'clipboard', { value: { write }, configurable: true });
    try {
      renderEditor();
      fireEvent.click(screen.getByLabelText('Export'));
      fireEvent.click(within(sheet('Export')).getByText('Copy'));
      // Called during the click itself, not after the picture is made.
      expect(write).toHaveBeenCalledTimes(1);
      expect(items[0]['image/png']).toBeInstanceOf(Promise);
      items[0]['image/png'].catch(() => {});
    } finally {
      if (!hadItem) delete window.ClipboardItem;
      delete navigator.clipboard;
    }
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

  it('flips the canvas from Canvas Style', () => {
    renderEditor();
    expect(canvas.props.canvasFlipX).toBeFalsy();
    openSection('Canvas colour, bands and watermark');
    fireEvent.click(within(canvasStrip()).getByText('Canvas Style'));
    fireEvent.click(within(sheet('Canvas Style')).getByText('Mirror'));
    expect(canvas.props.canvasFlipX).toBe(true);
    expect(within(sheet('Canvas Style')).getByText('Mirror').closest('button').getAttribute('aria-pressed')).toBe('true');
  }, 30000);

  it('Canvas shows Canvas Style, Watermark, Header and Footer; Canvas Style and Watermark open sheets under the strip', () => {
    renderEditor();
    openSection('Canvas colour, bands and watermark');
    expect(within(canvasStrip()).getAllByRole('button').map((b) => b.textContent)).toEqual(['Canvas Style', 'Watermark', 'Header', 'Footer']);

    fireEvent.click(within(canvasStrip()).getByText('Canvas Style'));
    fireEvent.click(within(sheet('Canvas Style')).getByRole('radio', { name: '#000000' }));
    expect(canvas.props.canvasBgColor).toBe('#000000');
    expect(canvasStrip()).toBeTruthy();

    fireEvent.click(within(canvasStrip()).getByText('Watermark'));
    const wm = sheet('Watermark');
    expect(within(wm).getByRole('switch', { name: 'Watermark' }).getAttribute('aria-checked')).toBe('true');
    fireEvent.change(within(wm).getByLabelText('Watermark name'), { target: { value: 'memelord' } });
    expect(within(wm).getByLabelText('Watermark name').value).toBe('memelord');

    // Footer switches straight away; tapping Canvas again closes the strip and its sheet (the first
    // tap deselects whatever layer is selected and shows the strip).
    fireEvent.click(within(canvasStrip()).getByText('Footer'));
    expect(within(canvasStrip()).getByText('Footer').closest('button').getAttribute('aria-pressed')).toBe('true');
    closeSheet();
    if (canvas.props.activeLayerId) openSection('Canvas colour, bands and watermark');
    expect(canvas.props.activeLayerId).toBe(null);
    openSection('Canvas colour, bands and watermark');
    expect(screen.queryByRole('toolbar', { name: 'Canvas tools' })).toBeNull();
  }, 30000);

  it('Canvas > Color sets a gradient background, and a solid colour replaces it', () => {
    renderEditor();
    openSection('Canvas colour, bands and watermark');
    fireEvent.click(within(canvasStrip()).getByText('Canvas Style'));
    fireEvent.click(within(sheet('Canvas Style')).getByRole('radio', { name: 'Ocean gradient' }));
    expect(canvas.props.canvasBgGradient).toEqual(['#2193b0', '#6dd5ed']);
    fireEvent.click(within(sheet('Canvas Style')).getByRole('radio', { name: '#000000' }));
    expect(canvas.props.canvasBgGradient).toBeNull();
    expect(canvas.props.canvasBgColor).toBe('#000000');
  }, 30000);

  it('Canvas Style > Crop opens the cropper', () => {
    renderEditor();
    openSection('Canvas colour, bands and watermark');
    fireEvent.click(within(canvasStrip()).getByText('Canvas Style'));
    fireEvent.click(within(sheet('Canvas Style')).getByText('Crop'));
    const cropper = screen.getByRole('dialog', { name: 'Crop photo' });
    for (const name of ['Free', '1:1', '4:5', '9:16', '16:9']) expect(within(cropper).getByText(name)).toBeTruthy();
    fireEvent.click(within(cropper).getByText('Cancel'));
    expect(screen.queryByRole('dialog', { name: 'Crop photo' })).toBeNull();
  }, 30000);

  it('AI/Filters shows Face Swap, Background, AI Caption and Filters; Background opens its sheet', () => {
    renderEditor();
    openSection('AI tools and photo filters');
    const strip = screen.getByRole('toolbar', { name: 'AI and filter tools' });
    expect(within(strip).getAllByRole('button').map((b) => b.textContent)).toEqual(['Face Swap', 'Background', 'AI Caption', 'Filters']);
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

  it("an image layer's More is compact: a row of tiles and the look sliders, nothing the bar already has", () => {
    renderEditor();
    openSection('Photos, videos, stickers and emoji');
    fireEvent.click(within(strip('Media tools')).getByText('Templates'));
    fireEvent.click(within(sheet('Templates')).getAllByRole('button', { name: /drake/i })[0]);
    act(() => canvas.props.onSelectLayer(canvas.props.imageLayers[0].id));
    fireEvent.click(within(layerToolbar()).getByText('More'));
    const more = sheet('More');
    expect(within(more).getAllByRole('button').map((b) => b.textContent).filter(Boolean)).toEqual(['Mirror', 'Flip', 'Copy', 'Crop']);
    expect(within(more).getByText('Replace')).toBeTruthy();
    for (const gone of ['Face Swap', 'Filters', 'Background', 'Duplicate']) expect(within(more).queryByText(gone)).toBeNull();
    expect(within(more).queryByRole('group', { name: 'Blend mode' })).toBeNull();
    expect(within(more).queryByRole('switch', { name: 'Keep shape when resizing' })).toBeNull();
    expect(within(more).queryByRole('group', { name: 'Images and stickers' })).toBeNull();

    fireEvent.click(within(more).getByText('Flip'));
    fireEvent.change(within(more).getByLabelText('Corner rounding'), { target: { value: '0.3' } });
    fireEvent.change(within(more).getByLabelText('Border width'), { target: { value: '6' } });
    expect(canvas.props.imageLayers[0]).toMatchObject({ flipY: true, cornerRadius: 0.3, borderWidth: 6 });
    expect(within(sheet('More')).getByRole('radiogroup', { name: 'Border colour' })).toBeTruthy();
    fireEvent.click(within(sheet('More')).getByText('Copy'));
    expect(canvas.props.imageLayers).toHaveLength(2);
  }, 30000);

  it("image layer toolbar has Background (opens Background sheet) and Face Swap buttons", () => {
    renderEditor();
    openSection('Photos, videos, stickers and emoji');
    fireEvent.click(within(strip('Media tools')).getByText('Templates'));
    fireEvent.click(within(sheet('Templates')).getAllByRole('button', { name: /drake/i })[0]);
    act(() => canvas.props.onSelectLayer(canvas.props.imageLayers[0].id));

    // Verify toolbar pill buttons for image layer
    const tb = layerToolbar();
    expect(within(tb).getByText('Background')).toBeTruthy();
    expect(within(tb).getByText('Face Swap')).toBeTruthy();
    expect(within(tb).getByText('Filters')).toBeTruthy();
    expect(within(tb).getByText('More')).toBeTruthy();
    expect(within(tb).queryByText('Crop')).toBeNull();

    // Tapping Background opens Background sheet
    fireEvent.click(within(tb).getByText('Background'));
    const bgSheet = sheet('Background');
    expect(bgSheet).toBeTruthy();
    expect(within(bgSheet).getByRole('button', { name: 'Remove Background' })).toBeTruthy();
    expect(within(bgSheet).getByRole('button', { name: 'Blur Background' })).toBeTruthy();

    // Tapping Background again closes the sheet
    fireEvent.click(within(tb).getByText('Background'));
    expect(screen.queryByRole('dialog', { name: 'Background' })).toBeNull();
  }, 30000);

  it('the Media sheet for stickers has only size bar, flip button, opacity and shadow', () => {
    renderEditor();
    openSection('Photos, videos, stickers and emoji');
    fireEvent.click(within(strip('Media tools')).getByText('Emoji'));
    fireEvent.click(screen.getByTitle('Laugh Cry'));

    // Flip button removed from toolbar pill; Edit button is present
    expect(within(layerToolbar()).queryByText('Flip')).toBeNull();
    expect(within(layerToolbar()).getByText('Edit')).toBeTruthy();

    fireEvent.click(within(layerToolbar()).getByText('Edit'));
    const media = sheet('Media');
    expect(within(media).getByLabelText('Sticker size')).toBeTruthy();

    fireEvent.click(within(media).getByRole('switch', { name: 'Flip sticker' }));
    fireEvent.change(within(media).getByLabelText('Opacity'), { target: { value: '0.5' } });
    fireEvent.change(within(media).getByLabelText('Shadow size'), { target: { value: '12' } });
    expect(canvas.props.stickers[0]).toMatchObject({ flipX: true, opacity: 0.5, shadowSize: 12 });
    expect(within(sheet('Media')).getByRole('radiogroup', { name: 'Shadow colour' })).toBeTruthy();

    // Upside down, blend mode, die-cut and corners are omitted
    expect(within(sheet('Media')).queryByRole('switch', { name: 'Flip upside down' })).toBeNull();
    expect(within(sheet('Media')).queryByRole('group', { name: 'Blend mode' })).toBeNull();
    expect(within(sheet('Media')).queryByRole('switch', { name: 'Die-cut border' })).toBeNull();
    expect(within(sheet('Media')).queryByLabelText('Corner rounding')).toBeNull();
  }, 30000);

  it('Die-cut button opens bottom sheet to customize border color and width, and toggling closes it', () => {
    renderEditor();
    openSection('Photos, videos, stickers and emoji');
    fireEvent.click(within(strip('Media tools')).getByText('Emoji'));
    fireEvent.click(screen.getByTitle('Laugh Cry'));

    // Tapping Die-cut opens its sheet without adding a border yet
    fireEvent.click(within(layerToolbar()).getByText('Die-cut'));
    const diecut = sheet('Die-cut');
    expect(diecut).toBeTruthy();
    expect(canvas.props.stickers[0].dieCut).toBeFalsy();

    // Picking a colour adds the border in that colour
    const swatches = within(diecut).getByRole('radiogroup', { name: 'Die-cut border colour' });
    fireEvent.click(within(swatches).getByLabelText('#ffd60a'));
    expect(canvas.props.stickers[0].dieCut).toBe(true);
    expect(canvas.props.stickers[0].dieCutColor).toBe('#ffd60a');

    // Border width slider works
    const slider = within(diecut).getByLabelText('Border width');
    fireEvent.change(slider, { target: { value: '10' } });
    expect(canvas.props.stickers[0].dieCutWidth).toBe(10);

    // Tapping Die-cut again closes the sheet
    fireEvent.click(within(layerToolbar()).getByText('Die-cut'));
    expect(screen.queryByRole('dialog', { name: 'Die-cut' })).toBeNull();
  }, 30000);

  it('Media > GIFs opens the Giphy picker: animated stickers or GIFs', () => {
    renderEditor();
    openSection('Photos, videos, stickers and emoji');
    fireEvent.click(within(strip('Media tools')).getByText('GIFs'));
    const kinds = within(sheet('GIFs')).getByRole('toolbar', { name: 'GIFs categories' });
    expect(within(kinds).getAllByRole('button').map((b) => b.textContent)).toEqual(['Stickers', 'GIFs']);
  }, 30000);

  it('a picture dropped on the canvas area is added', async () => {
    const { container } = renderEditor();
    const file = new File([new Uint8Array([1, 2, 3])], 'cat.png', { type: 'image/png' });
    await act(async () => {
      fireEvent.drop(container.querySelector('.canvas-wrapper'), { dataTransfer: { files: [file], types: ['Files'], getData: () => '' } });
    });
    await vi.waitFor(() => expect(canvas.props.imageLayers).toHaveLength(1));
  }, 30000);

  it("tapping a dock tab deselects the layer and shows that tab's strip", () => {
    renderEditor();
    act(() => canvas.props.onSelectLayer(canvas.props.captions[0].id));
    expect(layerToolbar()).toBeTruthy();
    const dock = screen.getByRole('navigation', { name: 'Editor tools' });
    fireEvent.click(within(dock).getByText('Canvas'));
    expect(canvas.props.activeLayerId).toBe(null);
    expect(screen.queryByRole('toolbar', { name: 'Layer tools' })).toBeNull();
    expect(strip('Canvas tools')).toBeTruthy();
  });

  it('a sheet from the layer pill keeps the pill above it; picking another layer closes it', () => {
    renderEditor();
    openSection('Photos, videos, stickers and emoji');
    fireEvent.click(within(strip('Media tools')).getByText('Emoji'));
    fireEvent.click(screen.getByTitle('Laugh Cry'));
    // No dock tab is lit while a layer's pill shows.
    expect(screen.getByRole('navigation', { name: 'Editor tools' }).querySelector('[aria-pressed="true"]')).toBeNull();
    // The new sticker's Edit opens the Media sheet under the pill, Edit lit.
    fireEvent.click(within(layerToolbar()).getByText('Edit'));
    expect(within(sheet('Media')).getByLabelText('Sticker size')).toBeTruthy();
    expect(screen.queryByRole('toolbar', { name: 'Media tools' })).toBeNull();
    expect(within(layerToolbar()).getByText('Edit').closest('button').getAttribute('aria-pressed')).toBe('true');
    // Tapping Edit again closes it.
    fireEvent.click(within(layerToolbar()).getByText('Edit'));
    expect(screen.queryByRole('dialog', { name: 'Media' })).toBeNull();
    fireEvent.click(within(layerToolbar()).getByText('Edit'));
    act(() => canvas.props.onSelectLayer(canvas.props.captions[1].id));
    expect(screen.queryByRole('dialog', { name: 'Media' })).toBeNull();
    expect(within(layerToolbar()).getByText('Font')).toBeTruthy();
  }, 30000);

});
