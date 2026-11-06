// @vitest-environment jsdom
// Smoke tests for the video editor shell: what the tool rail, timeline and modes do to the store.
// The Konva preview, FFmpeg export and the meme API are replaced; everything else is real.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup, act, within } from '@testing-library/react';
import VideoEditor from './VideoEditor';

const closeSheet = () => fireEvent.click(screen.getByLabelText(/^Close /));
import { useEditorStore } from '../../store/useVideoEditorStore';
import { exportVideoFFmpeg } from '../../utils/ffmpegExport';

vi.mock('./CanvasPreview', () => ({ default: ({ children }) => <div data-testid="canvas-preview">{children}</div> }));
vi.mock('../../utils/ffmpegExport', () => ({
  exportVideoFFmpeg: vi.fn(() => Promise.resolve({ blob: new Blob(['x'], { type: 'video/mp4' }), fileName: 'meme-studio-1.mp4' })),
  cancelExport: vi.fn(),
}));
vi.mock('../../utils/clipEffects', () => ({
  captureFrame: vi.fn(() => Promise.resolve('blob:still')),
  renderClipEffect: vi.fn(() => Promise.resolve({ url: 'blob:rev', durationMs: 2000 })),
}));
vi.mock('../../utils/voiceRecorder', () => ({
  canRecordVoice: () => true,
  startVoiceRecording: vi.fn(() => Promise.resolve({
    stop: () => Promise.resolve({ blob: new Blob(['voice'], { type: 'audio/webm' }), type: 'audio/webm', durationMs: 1500 }),
  })),
}));
vi.mock('../../utils/autoCaptions', () => ({
  generateCaptions: vi.fn(() => Promise.resolve({ captions: [{ text: 'this is', startMs: 0, endMs: 600 }, { text: 'fine.', startMs: 600, endMs: 1200 }], clips: 1 })),
}));
vi.mock('../../utils/transcriber', () => ({ cancelTranscription: vi.fn() }));
// Background removal's model comes from a CDN: stand in for loading it.
vi.mock('../../utils/personSegmenter', async (importOriginal) => ({
  ...(await importOriginal()),
  loadPersonSegmenter: vi.fn(() => Promise.resolve()),
  personSegmenterReady: () => false,
}));
vi.mock('../../services/memeService', () => ({ fetchOpenSourceMemes: () => Promise.resolve([]) }));

const store = () => useEditorStore.getState();
const clips = (container) => [...container.querySelectorAll('.vt-clip')];
// The add tools are one row in the bottom bar; some open a sheet of tiles for where to add from.
const labels = (el, selector = 'button') => [...el.querySelectorAll(selector)].map((b) => b.textContent);
const addTool = (label) => fireEvent.click(within(screen.getByRole('toolbar', { name: 'Add tools' })).getByText(label));
const addFrom = (label, tile) => {
  addTool(label);
  fireEvent.click(within(screen.getByRole('dialog')).getByText(tile));
};
const addTextFromRail = () => addTool('Text');
// A tool in the bottom bar's clip tools; Duplicate, the layer moves and Select are in the Arrange sheet.
const pill = () => document.querySelector('.vt-deckbar[role="toolbar"]');
const ARRANGE = ['Duplicate', 'Bring forward', 'Send back', 'Select'];
const clipTool = (text) => {
  if (!ARRANGE.includes(text)) return within(pill()).getByText(text);
  fireEvent.click(within(pill()).getByText('Arrange'));
  return within(screen.getByRole('dialog', { name: 'Arrange' })).getByText(text);
};

beforeEach(() => {
  store().clearItems();
  store().setLayoutSlots([]);
});
afterEach(cleanup);

describe('VideoEditor', () => {
  it('starts with the timeline closed, an empty-state prompt and the add tools', () => {
    const { container } = render(<VideoEditor onBack={() => {}} />);
    expect(container.querySelector('.vt-editor.is-preview')).toBeTruthy();
    const start = screen.getByRole('group', { name: 'Start your video' });
    expect([...start.querySelectorAll('button')].map((b) => b.textContent.trim())).toEqual(['Add a video', 'Photo', 'Meme clip']);
    // Opening the timeline puts the prompt away; closing it brings the prompt back.
    fireEvent.click(screen.getByText('Edit'));
    expect(container.querySelector('.vt-editor.is-edit')).toBeTruthy();
    expect(screen.queryByRole('group', { name: 'Start your video' })).toBeNull();
    fireEvent.click(screen.getByText('Done'));
    expect(screen.getByRole('group', { name: 'Start your video' })).toBeTruthy();
    expect(container.querySelector('.vt-timeline-wrap').textContent).toContain('Add a video');
    // Every add tool on one row, no Back.
    const dock = screen.getByRole('toolbar', { name: 'Add tools' });
    expect(labels(dock)).toEqual(['Video', 'Photo', 'Text', 'Stickers', 'Sounds', 'Voice', 'Subtitles', 'Canvas']);
  });

  it('opens a sheet of tiles from an add tool, and a setting from a tile', () => {
    render(<VideoEditor onBack={() => {}} />);
    addTool('Sounds');
    expect(labels(screen.getByRole('dialog', { name: 'Add sound' }), '.vt-source-label')).toEqual(['Top sounds', 'All sounds', 'Upload']);
    expect(screen.queryByRole('toolbar', { name: 'Add tools' })).toBeNull();
    fireEvent.click(screen.getByText('Top sounds'));
    expect(screen.getByRole('dialog', { name: 'Top sounds' })).toBeTruthy();
    closeSheet();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('toolbar', { name: 'Add tools' })).toBeTruthy();
  });

  it('adds a text clip from the rail and shows it on the timeline', () => {
    const { container } = render(<VideoEditor onBack={() => {}} />);
    addTextFromRail();
    expect(store().items).toHaveLength(1);
    expect(store().items[0]).toMatchObject({ type: 'text', text: 'NEW TEXT' });
    expect(clips(container)).toHaveLength(1);
    expect(clips(container)[0].className).toContain('vt-clip--text');
    expect(screen.queryByText('Start with a video or photo')).toBeNull();
  });

  it('opens a library as a full-height sheet and adds the pick to the timeline', () => {
    render(<VideoEditor onBack={() => {}} />);
    addFrom('Sounds', 'All sounds');
    expect(screen.getByRole('dialog', { name: 'All sounds' })).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Add Vine Boom'));
    expect(store().items[0]).toMatchObject({ type: 'audio', name: 'Vine Boom', url: '/sounds/vine_boom.mp3' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens Add photo and Add video sheets from the add tools', () => {
    render(<VideoEditor onBack={() => {}} />);
    addTool('Photo');
    const image = screen.getByRole('dialog', { name: 'Add photo' });
    expect(labels(image, '.vt-source-label')).toEqual(['Upload', 'Templates']);
    closeSheet();
    addTool('Video');
    const video = screen.getByRole('dialog', { name: 'Add video' });
    expect([...video.querySelectorAll('.vt-source-label')].map((b) => b.textContent)).toEqual(['Upload', 'Clips']);
    fireEvent.click(video.querySelectorAll('.vt-source')[1]);
    expect(screen.queryByRole('dialog', { name: 'Add video' })).toBeNull();
    expect(screen.getByRole('dialog', { name: 'Clips' })).toBeTruthy();
  });

  it('opens Stickers and GIFs as separate sheets', () => {
    render(<VideoEditor onBack={() => {}} />);
    addTool('Stickers');
    expect(labels(screen.getByRole('dialog', { name: 'Add sticker' }), '.vt-source-label')).toEqual(['Meme', 'Emoji', 'GIFs']);
    fireEvent.click(screen.getByText('Meme'));
    const stickers = screen.getByRole('dialog', { name: 'Stickers' });
    expect([...stickers.querySelectorAll('[role=tab]')].map((t) => t.textContent)).toEqual(['Stickers', 'Animated']);
    fireEvent.click(screen.getByLabelText('Close stickers'));
    addFrom('Stickers', 'GIFs');
    const gifs = screen.getByRole('dialog', { name: 'GIFs' });
    expect(gifs.querySelectorAll('[role=tab]').length).toBe(0);
  });

  it('adds a template from the Templates library', () => {
    render(<VideoEditor onBack={() => {}} />);
    addFrom('Photo', 'Templates');
    expect(screen.getByRole('dialog', { name: 'Templates' })).toBeTruthy();
    fireEvent.click(screen.getByRole('dialog').querySelector('.ie-shelf-card .ie-card'));
    expect(store().items[0]).toMatchObject({ type: 'image' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('swaps the bar for the clip’s tools on select, and Back steps out again', () => {
    const { container } = render(<VideoEditor onBack={() => {}} />);
    addTextFromRail();
    fireEvent.click(clips(container)[0]);
    expect(store().activeItemId).toBe(store().items[0].id);
    expect(clips(container)[0].className).toContain('is-selected');
    const main = screen.getByRole('toolbar', { name: 'Clip tools' });
    expect(labels(main)).toEqual(['Back', 'Edit', 'Font', 'Style', 'Colour', 'Animate', 'Split', 'Arrange', 'Delete']);
    // Arrange is a sheet of tiles, not another row.
    fireEvent.click(within(main).getByText('Arrange'));
    expect(labels(screen.getByRole('dialog', { name: 'Arrange' }), '.vt-source-label')).toEqual(['Duplicate', 'Bring forward', 'Send back', 'Select']);
    closeSheet();
    // Back, the only one, lets go of the clip and brings the add tools back.
    fireEvent.click(within(screen.getByRole('toolbar', { name: 'Clip tools' })).getByText('Back'));
    expect(store().activeItemId).toBe(null);
    expect(screen.queryByRole('toolbar', { name: 'Clip tools' })).toBeNull();
    expect(screen.getByRole('toolbar', { name: 'Add tools' })).toBeTruthy();
  });

  it('shows a video’s tools in one row, most used first', () => {
    act(() => store().addItem({ type: 'video', url: 'a.mp4', durationMs: 4000 }));
    const { container } = render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(clips(container)[0]);
    expect(labels(screen.getByRole('toolbar', { name: 'Clip tools' }))).toEqual([
      'Back', 'Split', '1×', 'Volume', 'Mute', 'Filters', 'Crop', 'Fit', 'Green screen', 'Background', 'Face swap',
      'Freeze', 'Reverse', 'Boomerang', 'Punch', 'Flip', 'Opacity', 'Arrange', 'Delete',
    ]);
  });

  it('duplicates and deletes the selected clip', () => {
    const { container } = render(<VideoEditor onBack={() => {}} />);
    addTextFromRail();
    fireEvent.click(clips(container)[0]);
    fireEvent.click(clipTool('Duplicate'));
    expect(store().items).toHaveLength(2);
    fireEvent.click(clipTool('Delete'));
    expect(store().items).toHaveLength(1);
    expect(store().activeItemId).toBe(null);
  });

  it('picks several clips to duplicate, move and delete together', () => {
    const { container } = render(<VideoEditor onBack={() => {}} />);
    addTextFromRail();
    act(() => { store().addItem({ type: 'text', text: 'B', durationMs: 2000 }); });
    const [a, b] = store().items;
    act(() => { store().updateItem(b.id, { startMs: 4000, endMs: 6000 }); store().setActiveItem(null); });
    // Select on the first clip's pill, then Shift-click the second.
    fireEvent.click(clips(container)[0]);
    fireEvent.click(clipTool('Select'));
    fireEvent.click(clips(container)[1], { shiftKey: true });
    expect(store().selectedIds).toEqual([a.id, b.id]);
    expect(screen.getByText('2 selected')).toBeTruthy();
    expect(clips(container).filter((c) => c.className.includes('is-picked'))).toHaveLength(2);

    // Duplicating puts the copies right after the group and picks them.
    fireEvent.click(screen.getByText('Duplicate'));
    expect(store().items).toHaveLength(4);
    const copies = store().items.filter((i) => store().selectedIds.includes(i.id));
    const groupEnd = Math.max(...store().items.slice(0, 2).map((i) => i.endMs));
    const starts = copies.map((c) => c.startMs).sort((x, y) => x - y);
    expect(starts[0]).toBe(groupEnd);
    expect(starts[1] - starts[0]).toBe(4000 - store().items[0].startMs);

    // Dragging one picked clip moves both.
    const copy = clips(container).find((c) => c.dataset.clipId === copies[0].id);
    fireEvent.pointerDown(copy, { clientX: 100, button: 0 });
    fireEvent.pointerMove(window, { clientX: 150 });
    fireEvent.pointerUp(window, { clientX: 150 });
    const moved = store().items.filter((i) => store().selectedIds.includes(i.id));
    const delta = moved[0].startMs - copies[0].startMs;
    expect(delta).toBeGreaterThan(0);
    expect(moved[1].startMs - copies[1].startMs).toBe(delta);

    fireEvent.click(screen.getByText('Delete'));
    expect(store().items.map((i) => i.id)).toEqual([a.id, b.id]);
    expect(screen.queryByText(/selected$/)).toBeNull();
  });

  it('hides a clip with its eye button and mutes video clips', () => {
    act(() => store().addItem({ type: 'video', url: 'a.mp4', durationMs: 2000 }));
    const { container } = render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(screen.getByLabelText('Hide clip'));
    expect(store().items[0].hidden).toBe(true);
    expect(clips(container)[0].className).toContain('is-hidden');
    fireEvent.click(screen.getByLabelText('Mute clip'));
    expect(store().items[0].muted).toBe(true);
    expect(screen.getByLabelText('Unmute clip')).toBeTruthy();
  });

  it('sets video speed and keeps the clip covering the same footage', () => {
    act(() => store().addItem({ type: 'video', url: 'a.mp4', durationMs: 2000 }));
    const { container } = render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(clips(container)[0]);
    fireEvent.click(clipTool('1×'));
    fireEvent.click(screen.getByRole('radio', { name: '1.5×' }));
    expect(store().items[0]).toMatchObject({ playbackRate: 1.5 });
    expect(store().items[0].endMs).toBeCloseTo(2000 / 1.5);
  });

  it('switches between edit and full-screen preview', () => {
    const { container } = render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(screen.getByText('Edit'));
    expect(container.querySelector('.vt-editor.is-edit')).toBeTruthy();
    fireEvent.click(screen.getByText('Done'));
    expect(container.querySelector('.vt-editor.is-preview')).toBeTruthy();
  });

  it('plays and pauses from the transport and the space bar', () => {
    act(() => store().addItem({ type: 'video', url: 'a.mp4', durationMs: 2000 }));
    render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(screen.getByLabelText('Play'));
    expect(store().isPlaying).toBe(true);
    fireEvent.keyDown(window, { code: 'Space' });
    expect(store().isPlaying).toBe(false);
  });

  it('splits the selected clip at the playhead', () => {
    act(() => store().addItem({ type: 'video', url: 'a.mp4', durationMs: 4000 }));
    const { container } = render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(clips(container)[0]);
    act(() => store().setPlayhead(1500));
    fireEvent.click(screen.getByText('Split'));
    expect(store().items.map((i) => [i.startMs, i.endMs])).toEqual([[0, 1500], [1500, 4000]]);
    expect(clips(container)).toHaveLength(2);
  });

  it('sets volume and fades from the volume panel', () => {
    act(() => store().addItem({ type: 'audio', url: 'boom.mp3', durationMs: 2000 }));
    const { container } = render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(clips(container)[0]);
    fireEvent.click(screen.getByText('Volume'));
    fireEvent.change(screen.getByRole('slider'), { target: { value: '40' } });
    fireEvent.click(screen.getByText('Fade in'));
    expect(store().items[0]).toMatchObject({ volume: 0.4, fadeInMs: 600 });
    fireEvent.click(screen.getByText('Fade in'));
    expect(store().items[0].fadeInMs).toBe(0);
  });

  it('edits, styles and colours text with the image editor’s text controls', () => {
    const { container } = render(<VideoEditor onBack={() => {}} />);
    addTextFromRail();
    fireEvent.click(clips(container)[0]);
    fireEvent.click(clipTool('Edit'));
    fireEvent.change(screen.getByLabelText('Caption text'), { target: { value: 'WHEN IT WORKS' } });
    closeSheet();
    fireEvent.click(clipTool('Font'));
    fireEvent.click(screen.getByRole('button', { name: 'Comic Sans (Fun)' }));
    closeSheet();
    fireEvent.click(clipTool('Style'));
    fireEvent.change(screen.getByRole('slider', { name: 'Text size' }), { target: { value: '150' } });
    fireEvent.click(screen.getByRole('radio', { name: 'Right' }));
    fireEvent.click(screen.getByRole('button', { name: 'Italic' }));
    closeSheet();
    fireEvent.click(clipTool('Colour'));
    fireEvent.click(screen.getByRole('tab', { name: 'Box' }));
    fireEvent.click(screen.getByRole('radio', { name: '#000000' }));
    expect(store().items[0]).toMatchObject({
      text: 'WHEN IT WORKS', fontSize: 150, align: 'right', italic: true,
      bgColor: 'black', color: '#ffffff', stroke: 'transparent',
    });
    expect(store().items[0].fontFamily).toMatch(/^"Comic Sans MS"/);
  });

  it('edits a sticker and gives it a die-cut border with the image editor’s sticker controls', () => {
    act(() => store().addItem({ type: 'sticker', url: 'a.png', durationMs: 2000, width: 100, height: 100, x: 100, y: 100 }));
    const { container } = render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(clips(container)[0]);
    const main = screen.getByRole('toolbar', { name: 'Clip tools' });
    expect([...main.querySelectorAll('button')].map((b) => b.textContent)).toEqual(['Back', 'Edit', 'Die-cut', 'Crop', 'Flip', 'Cut out', 'Rotate', 'Split', 'Arrange', 'Delete']);
    fireEvent.click(clipTool('Edit'));
    fireEvent.change(screen.getByRole('slider', { name: 'Sticker size' }), { target: { value: '0.25' } });
    fireEvent.change(screen.getByRole('slider', { name: 'Shadow size' }), { target: { value: '12' } });
    fireEvent.click(screen.getByRole('switch', { name: 'Flip sticker' }));
    closeSheet();
    fireEvent.click(clipTool('Die-cut'));
    fireEvent.click(screen.getByRole('radio', { name: '#ffd60a' }));
    const sticker = store().items[0];
    expect(sticker).toMatchObject({ shadowSize: 12, flipX: true, dieCut: true, dieCutColor: '#ffd60a' });
    // A quarter of the stage's width, about its centre (150, 150).
    expect(sticker.width * sticker.scaleX).toBeCloseTo(200);
    expect(sticker.x).toBeCloseTo(50);
    fireEvent.click(screen.getByRole('switch', { name: 'Die-cut border' }));
    expect(store().items[0].dieCut).toBe(false);
  });

  it('gives a photo the image editor’s photo bar: filters and the look in More', () => {
    act(() => store().addItem({ type: 'image', url: 'a.png', durationMs: 2000, width: 200, height: 100, x: 100, y: 100 }));
    const { container } = render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(clips(container)[0]);
    const main = screen.getByRole('toolbar', { name: 'Clip tools' });
    expect([...main.querySelectorAll('button')].map((b) => b.textContent || b.getAttribute('aria-label')))
      .toEqual(['Back', 'Face swap', 'Background', 'Filters', 'More', 'Fit', 'Motion', 'Rotate', 'Split', 'Arrange', 'Delete']);

    fireEvent.click(clipTool('Filters'));
    fireEvent.click(screen.getByRole('button', { name: '90s Vintage' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Adjust' }));
    fireEvent.change(screen.getByRole('slider', { name: 'Warmth' }), { target: { value: '40' } });
    expect(store().items[0]).toMatchObject({ filterId: 'vintage', filters: { sepia: 35, warmth: 40 } });
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(store().items[0]).toMatchObject({ filterId: null, filters: null });
    closeSheet();

    fireEvent.click(within(pill()).getByRole('button', { name: /^More/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Mirror' }));
    fireEvent.change(screen.getByRole('slider', { name: 'Corner rounding' }), { target: { value: '0.5' } });
    fireEvent.change(screen.getByRole('slider', { name: 'Border width' }), { target: { value: '8' } });
    fireEvent.click(screen.getByRole('radio', { name: '#000000' }));
    expect(store().items[0]).toMatchObject({ flipX: true, cornerRadius: 0.5, borderWidth: 8, borderColor: '#000000' });
    // Crop opens the clip's crop sheet.
    fireEvent.click(screen.getByRole('button', { name: 'Crop' }));
    expect(screen.getByRole('dialog', { name: 'Crop' })).toBeTruthy();
  });

  it('turns green-screen removal on, tunes it and turns it off', () => {
    act(() => store().addItem({ type: 'video', url: 'a.mp4', durationMs: 2000 }));
    const { container } = render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(clips(container)[0]);
    fireEvent.click(clipTool('Green screen'));
    expect(store().items[0].chromaKey).toEqual({ color: 'auto', similarity: 0.22, blend: 0.08 });
    const [strength, edges] = screen.getAllByRole('slider');
    fireEvent.change(strength, { target: { value: '30' } });
    fireEvent.change(edges, { target: { value: '12' } });
    expect(store().items[0].chromaKey).toMatchObject({ similarity: 0.3, blend: 0.12 });
    fireEvent.click(screen.getByText('Turn off'));
    expect(store().items[0].chromaKey).toBe(null);
  });

  it('removes a video clip\'s background, softens its edge and turns it off', async () => {
    act(() => store().addItem({ type: 'video', url: 'a.mp4', durationMs: 2000 }));
    const { container } = render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(clips(container)[0]);
    const tool = clipTool('Background');
    await act(async () => { fireEvent.click(tool); });
    expect(store().items[0].bgRemoval).toEqual({ softness: 0.3 });
    fireEvent.change(screen.getByRole('slider', { name: 'Edge softness' }), { target: { value: '0.6' } });
    expect(store().items[0].bgRemoval).toEqual({ softness: 0.6 });
    fireEvent.click(screen.getByRole('switch', { name: 'Remove background' }));
    expect(store().items[0].bgRemoval).toBe(null);
    expect(screen.queryByRole('slider', { name: 'Edge softness' })).toBeNull();
  });

  it('picks a text animation and previews it', () => {
    const previews = [];
    const onPreview = (e) => previews.push(e.detail.id);
    window.addEventListener('vt-preview-text-animation', onPreview);
    const { container } = render(<VideoEditor onBack={() => {}} />);
    addTextFromRail();
    fireEvent.click(clips(container)[0]);
    fireEvent.click(screen.getByText('Animate'));
    fireEvent.click(screen.getByText('Typewriter'));
    expect(store().items[0].animation).toBe('typewriter');
    expect(previews).toEqual([store().items[0].id]);
    fireEvent.click(screen.getByText('None'));
    expect(store().items[0].animation).toBe(null);
    window.removeEventListener('vt-preview-text-animation', onPreview);
  });

  it('sets the canvas background from the rail', () => {
    render(<VideoEditor onBack={() => {}} />);
    addFrom('Canvas', 'Background');
    fireEvent.click(screen.getByLabelText('#000000'));
    expect(store().backgroundColor).toBe('#000000');
    expect(screen.getByLabelText('#000000').getAttribute('aria-checked')).toBe('true');
    act(() => store().setBackgroundColor('#ffffff'));
  });

  it('adds a watermark to the export and an end card after the last clip', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:test');
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      fillRect: vi.fn(), fillText: vi.fn(), measureText: (s) => ({ width: s.length * 20 }),
    });
    const toDataURL = vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,card');
    try {
      act(() => store().addItem({ type: 'video', url: 'a.mp4', durationMs: 4000 }));
      render(<VideoEditor onBack={() => {}} />);
      addFrom('Canvas', 'Watermark');
      fireEvent.change(screen.getByLabelText('Watermark text'), { target: { value: '@memer' } });
      fireEvent.click(screen.getByText('Top left'));
      expect(store().watermark).toEqual({ text: '@memer', corner: 'tl' });
      closeSheet();

      addFrom('Canvas', 'End card');
      fireEvent.change(screen.getByLabelText('End card title'), { target: { value: 'Bye' } });
      fireEvent.click(screen.getByLabelText('#ff5e36'));
      fireEvent.click(screen.getByText('Add end card'));
      const card = store().items.find((i) => i.endCard);
      expect(card).toMatchObject({ type: 'image', url: 'data:image/png;base64,card', startMs: 4000, endMs: 6500, endCard: { title: 'Bye', color: '#ff5e36' } });
      // Adding again redraws the same card rather than adding another.
      fireEvent.click(screen.getByText('Update end card'));
      expect(store().items.filter((i) => i.endCard)).toHaveLength(1);
      closeSheet();
      // A video added later goes before the end card, which moves along to stay last.
      act(() => store().addItem({ type: 'video', url: 'b.mp4', durationMs: 2000 }));
      expect(store().items.find((i) => i.endCard)).toMatchObject({ startMs: 6000, endMs: 8500 });

      fireEvent.click(screen.getByLabelText('Export'));
      await act(async () => { fireEvent.click(screen.getByText('720p · faster')); });
      const [items, endMs] = exportVideoFFmpeg.mock.calls.at(-1);
      expect(endMs).toBe(8500);
      expect(items.at(-1)).toMatchObject({ type: 'text', text: '@memer', startMs: 0, endMs: 8500, align: 'left' });
      expect(store().items.some((i) => i.text === '@memer')).toBe(false);
    } finally {
      getContext.mockRestore();
      toDataURL.mockRestore();
      act(() => store().setWatermark(null));
    }
  });

  it('exports without auto-downloading and shows the ready card', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:test');
    URL.revokeObjectURL = vi.fn();
    act(() => store().addItem({ type: 'video', url: 'a.mp4', durationMs: 2000 }));
    render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(screen.getByLabelText('Export'));
    await act(async () => { fireEvent.click(screen.getByText('720p · faster')); });
    expect(exportVideoFFmpeg.mock.calls.at(-1)[6]).toMatchObject({ format: 'mp4', resolution: 720, download: false, backgroundColor: '#ffffff' });
    // Generous wait: under a parallel build the ready card can take over a second to show.
    expect(await screen.findByText('Your video is ready', {}, { timeout: 5000 })).toBeTruthy();
    expect(screen.getByText('Download')).toBeTruthy();
    expect(screen.getByText('Save to My Studio')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Close'));
    expect(screen.queryByText('Your video is ready')).toBeNull();
  });

  it('drops a sound effect at the playhead with one tap', () => {
    window.HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve());
    act(() => store().addItem({ type: 'video', url: 'a.mp4', durationMs: 5000 }));
    render(<VideoEditor onBack={() => {}} />);
    act(() => store().setPlayhead(1200));
    addFrom('Sounds', 'Top sounds');
    fireEvent.click(screen.getByText('Vine Boom'));
    const sound = store().items.find((i) => i.type === 'audio');
    expect(sound).toMatchObject({ name: 'Vine Boom', url: '/sounds/vine_boom.mp3', startMs: 1200 });
  });

  it('freezes the frame under the playhead', async () => {
    act(() => store().addItem({ type: 'video', url: 'a.mp4', durationMs: 4000 }));
    const { container } = render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(clips(container)[0]);
    act(() => store().setPlayhead(1500));
    const freeze = clipTool('Freeze');
    await act(async () => { fireEvent.click(freeze); });
    const still = store().items.find((i) => i.isFreeze);
    expect(still).toMatchObject({ url: 'blob:still', startMs: 1500, endMs: 3000 });
    expect(store().busy).toBe(null);
  });

  it('reverses a clip and switches it back', async () => {
    act(() => store().addItem({ type: 'video', url: 'a.mp4', durationMs: 2000 }));
    const { container } = render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(clips(container)[0]);
    const reverse = clipTool('Reverse');
    await act(async () => { fireEvent.click(reverse); });
    expect(store().items[0]).toMatchObject({ url: 'blob:rev', effect: 'reverse' });
    fireEvent.click(clipTool('Reverse'));
    expect(store().items[0]).toMatchObject({ url: 'a.mp4', effect: null });
  });

  it('opens Face swap from Effects, saying when the face swap server is off', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))));
    act(() => store().addItem({ type: 'video', url: 'a.mp4', durationMs: 4000 }));
    const { container } = render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(clips(container)[0]);
    const swap = clipTool('Face swap');
    fireEvent.click(swap);
    const sheet = screen.getByRole('dialog', { name: 'Face swap' });
    expect(await within(sheet).findByText('Face swap is offline')).toBeTruthy();
    vi.unstubAllGlobals();
  });

  it('adds zoom punches at the playhead and clears them', () => {
    act(() => store().addItem({ type: 'video', url: 'a.mp4', durationMs: 4000 }));
    const { container } = render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(clips(container)[0]);
    fireEvent.click(clipTool('Punch'));
    act(() => store().setPlayhead(1200));
    fireEvent.click(screen.getByText('Punch at playhead'));
    act(() => store().setPlayhead(2500));
    fireEvent.click(screen.getByText('Punch at playhead'));
    expect(store().items[0].punches).toEqual([1200, 2500]);
    expect(container.querySelectorAll('.vt-punch-mark')).toHaveLength(2);
    fireEvent.click(screen.getByText('Remove nearest'));
    expect(store().items[0].punches).toEqual([1200]);
    fireEvent.click(screen.getByText(/Clear all/));
    expect(store().items[0].punches).toEqual([]);
  });

  it('brings a sticker in front of text', async () => {
    const { drawOrder } = await import('../../utils/layerOrder');
    act(() => {
      store().addItem({ type: 'sticker', url: 'a.png' });
      store().addItem({ type: 'text', text: 'TOP' });
    });
    const { container } = render(<VideoEditor onBack={() => {}} />);
    expect(drawOrder(store().items).map((i) => i.type)).toEqual(['sticker', 'text']);
    fireEvent.click(clips(container).find((c) => c.className.includes('vt-clip--sticker')));
    fireEvent.click(clipTool('Bring forward'));
    expect(drawOrder(store().items).map((i) => i.type)).toEqual(['text', 'sticker']);
  });

  it('applies a filter preset and adjustments to a video', () => {
    act(() => store().addItem({ type: 'video', url: 'a.mp4', durationMs: 2000 }));
    const { container } = render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(clips(container)[0]);
    fireEvent.click(clipTool('Filters'));
    // As a photo's Filters: Presets, then the sliders under Adjust.
    fireEvent.click(screen.getByText('Vintage'));
    fireEvent.click(screen.getByRole('tab', { name: 'Adjust' }));
    fireEvent.change(screen.getByRole('slider', { name: 'Brightness' }), { target: { value: '30' } });
    expect(store().items[0].filter).toEqual({ preset: 'vintage', brightness: 30 });
    closeSheet();
    // The pill's Filters button now says which preset is on; Reset in the sheet's heading clears it.
    expect(pill().textContent).toContain('Vintage');
    fireEvent.click(clipTool('Vintage'));
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(store().items[0].filter).toBe(null);
  });

  it('crops a video to a shape from the crop sheet and resets it from the heading', async () => {
    act(() => store().addItem({ type: 'video', url: 'a.mp4', durationMs: 2000, width: 400, height: 300 }));
    const { container } = render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(clips(container)[0]);
    fireEvent.click(clipTool('Crop'));
    // The video's frame (captureFrame, stood in for) arrives, then its picture loads.
    await act(async () => {});
    const img = container.ownerDocument.querySelector('.vt-crop-frame img');
    Object.defineProperty(img, 'naturalWidth', { value: 400 });
    Object.defineProperty(img, 'naturalHeight', { value: 300 });
    fireEvent.load(img);
    expect(screen.getByRole('button', { name: 'Reset' }).disabled).toBe(true);
    fireEvent.click(screen.getByRole('radio', { name: '1:1' }));
    expect(store().items[0].crop).toMatchObject({ width: 0.75, height: 1 });
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(store().items[0].crop ?? null).toBe(null);
    expect(screen.getByRole('radio', { name: 'Free' }).getAttribute('aria-checked')).toBe('true');
  });

  it('records a voiceover over the video and drops it where it started', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:voice');
    act(() => store().addItem({ type: 'video', url: 'a.mp4', durationMs: 5000 }));
    render(<VideoEditor onBack={() => {}} />);
    act(() => store().setPlayhead(1000));
    addTool('Voice');
    await act(async () => { fireEvent.click(screen.getByLabelText('Start recording')); });
    expect(store().isPlaying).toBe(true);
    expect(screen.getByText(/Recording/)).toBeTruthy();
    await act(async () => { fireEvent.click(screen.getByLabelText('Stop recording')); });
    expect(store().isPlaying).toBe(false);
    const voice = store().items.find((i) => i.isVoiceover);
    expect(voice).toMatchObject({ type: 'audio', url: 'blob:voice', name: 'Voiceover 1', startMs: 1000, endMs: 2500, mimeType: 'audio/webm' });
  });

  it('sets a transition on a clip that follows another', () => {
    act(() => {
      store().addItem({ type: 'video', url: 'a.mp4', durationMs: 2000 });
      store().addItem({ type: 'video', url: 'b.mp4', durationMs: 2000 });
    });
    const { container } = render(<VideoEditor onBack={() => {}} />);
    const [first, second] = clips(container);
    fireEvent.click(first);
    expect(screen.queryByText('Transition')).toBeNull();
    fireEvent.click(second);
    fireEvent.click(clipTool('Transition'));
    fireEvent.click(screen.getByText('Fade'));
    expect(store().items[1].transitionIn).toEqual({ type: 'fade', durationMs: 500 });
    expect(container.querySelector('.vt-transition-mark')).toBeTruthy();
    fireEvent.click(screen.getByText('None'));
    expect(store().items[1].transitionIn).toBe(null);
  });

  it('generates auto captions from speech, restyles and removes them', async () => {
    render(<VideoEditor onBack={() => {}} />);
    act(() => { store().addItem({ type: 'video', url: 'blob:talk', durationMs: 2000 }); store().setActiveItem(null); });
    addTool('Subtitles');
    await act(async () => { fireEvent.click(screen.getByText('Generate captions')); });
    const captions = () => store().items.filter((i) => i.autoCaption);
    expect(captions().map((i) => [i.text, i.startMs, i.endMs])).toEqual([['THIS IS', 0, 600], ['FINE.', 600, 1200]]);
    expect(screen.getByText('2 captions added. Tap one to edit it.')).toBeTruthy();
    fireEvent.click(screen.getByText('Typewriter'));
    expect(captions().map((i) => [i.text, i.animation])).toEqual([['this is', 'typewriter'], ['fine.', 'typewriter']]);
    fireEvent.click(screen.getByText('Remove'));
    expect(captions()).toHaveLength(0);
    expect(store().items).toHaveLength(1);
  });

  it('calls onBack from the back button', () => {
    const onBack = vi.fn();
    render(<VideoEditor onBack={onBack} />);
    fireEvent.click(screen.getByLabelText('Back'));
    expect(onBack).toHaveBeenCalled();
  });

  it('shows the canvas size beside Export only while the timeline is closed', () => {
    const { container } = render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(screen.getByText('Edit'));
    expect(container.querySelector('.ui-size-menu')).toBeNull();
    fireEvent.click(screen.getByText('Done'));
    const actions = container.querySelector('.vt-top-actions');
    expect(actions.querySelector('.ui-size-menu')).toBeTruthy();
    expect(actions.lastElementChild.textContent).toContain('Export');
    fireEvent.click(screen.getByText('Edit'));
    expect(container.querySelector('.ui-size-menu')).toBeNull();
  });
});
