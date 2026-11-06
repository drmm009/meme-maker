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

vi.mock('./CanvasPreview', () => ({ default: () => <div data-testid="canvas-preview" /> }));
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
vi.mock('../../services/memeService', () => ({ fetchOpenSourceMemes: () => Promise.resolve([]) }));

const store = () => useEditorStore.getState();
const clips = (container) => [...container.querySelectorAll('.vt-clip')];
// Add tools live in the strips of the dock's sections, reached the way a user would.
const addTextFromRail = () => { fireEvent.click(screen.getByText('Text')); fireEvent.click(screen.getByText('Add text')); };

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
    expect([...start.querySelectorAll('button')].map((b) => b.textContent.trim())).toEqual(['Video', 'Photo', 'Meme clip']);
    // Opening the timeline puts the prompt away; closing it brings the prompt back.
    fireEvent.click(screen.getByText('Edit'));
    expect(container.querySelector('.vt-editor.is-edit')).toBeTruthy();
    expect(screen.queryByRole('group', { name: 'Start your video' })).toBeNull();
    fireEvent.click(screen.getByLabelText('Full screen preview'));
    expect(screen.getByRole('group', { name: 'Start your video' })).toBeTruthy();
    expect(screen.getByText('Add a video')).toBeTruthy();
    const dock = screen.getByRole('navigation', { name: 'Sections' });
    expect([...dock.querySelectorAll('button')].map((b) => b.textContent)).toEqual(['Media', 'Text', 'Stickers', 'Audio', 'Canvas']);
    // No section's tools until a section is tapped; tapping it again puts them away.
    expect(screen.queryByRole('toolbar', { name: /tools$/ })).toBeNull();
    fireEvent.click(screen.getByText('Media'));
    const strip = screen.getByRole('toolbar', { name: 'Media tools' });
    expect([...strip.querySelectorAll('button')].map((b) => b.textContent)).toEqual(['Image', 'Video']);
    expect(screen.getByTitle('Media').getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByText('Media'));
    expect(screen.queryByRole('toolbar', { name: 'Media tools' })).toBeNull();
  });

  it('shows the tapped section’s tools in the strip', () => {
    render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(screen.getByText('Audio'));
    expect(screen.getByRole('toolbar', { name: 'Audio tools' })).toBeTruthy();
    expect(screen.getByText('Voice')).toBeTruthy();
    expect(screen.queryByRole('toolbar', { name: 'Media tools' })).toBeNull();
  });

  it('opens a setting as a sheet in place of the strip and dock, and brings them back on close', () => {
    render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(screen.getByText('Audio'));
    fireEvent.click(screen.getByText('SFX'));
    expect(screen.getByRole('dialog', { name: 'Sound effects' })).toBeTruthy();
    expect(screen.queryByRole('toolbar', { name: 'Audio tools' })).toBeNull();
    expect(screen.queryByRole('navigation', { name: 'Sections' })).toBeNull();
    closeSheet();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('toolbar', { name: 'Audio tools' })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Sections' })).toBeTruthy();
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
    fireEvent.click(screen.getByText('Audio'));
    fireEvent.click(screen.getByText('Sounds'));
    expect(screen.getByRole('dialog', { name: 'Sounds' })).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Add Vine Boom'));
    expect(store().items[0]).toMatchObject({ type: 'audio', name: 'Vine Boom', url: '/sounds/vine_boom.mp3' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens Add image and Add video sheets from the Media strip', () => {
    render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(screen.getByText('Media'));
    fireEvent.click(screen.getByTitle('Image'));
    const image = screen.getByRole('dialog', { name: 'Add image' });
    expect([...image.querySelectorAll('.vt-source-label')].map((b) => b.textContent)).toEqual(['Upload', 'Templates']);
    expect(screen.queryByRole('toolbar', { name: 'Media tools' })).toBeNull();
    closeSheet();
    fireEvent.click(screen.getByTitle('Video'));
    const video = screen.getByRole('dialog', { name: 'Add video' });
    expect([...video.querySelectorAll('.vt-source-label')].map((b) => b.textContent)).toEqual(['Upload', 'Clips']);
    fireEvent.click(video.querySelectorAll('.vt-source')[1]);
    expect(screen.queryByRole('dialog', { name: 'Add video' })).toBeNull();
    expect(screen.getByRole('dialog', { name: 'Clips' })).toBeTruthy();
  });

  it('opens Stickers and GIFs as separate sheets', () => {
    render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(screen.getByText('Stickers'));
    fireEvent.click(screen.getByText('Meme'));
    const stickers = screen.getByRole('dialog', { name: 'Stickers' });
    expect([...stickers.querySelectorAll('[role=tab]')].map((t) => t.textContent)).toEqual(['Stickers', 'Animated']);
    fireEvent.click(screen.getByLabelText('Close stickers'));
    fireEvent.click(screen.getByText('GIFs'));
    const gifs = screen.getByRole('dialog', { name: 'GIFs' });
    expect(gifs.querySelectorAll('[role=tab]').length).toBe(0);
  });

  it('adds a template from the Templates library', () => {
    render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(screen.getByText('Media'));
    fireEvent.click(screen.getByTitle('Image'));
    fireEvent.click(screen.getByRole('dialog', { name: 'Add image' }).querySelectorAll('.vt-source')[1]);
    expect(screen.getByRole('dialog', { name: 'Templates' })).toBeTruthy();
    fireEvent.click(screen.getByRole('dialog').querySelector('.ie-shelf-card .ie-card'));
    expect(store().items[0]).toMatchObject({ type: 'image' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('swaps the strip for the clip’s tool pill on select, and a section brings it back', () => {
    const { container } = render(<VideoEditor onBack={() => {}} />);
    addTextFromRail();
    fireEvent.click(clips(container)[0]);
    expect(store().activeItemId).toBe(store().items[0].id);
    expect(clips(container)[0].className).toContain('is-selected');
    const pill = screen.getByRole('toolbar', { name: 'Clip tools' });
    expect([...pill.querySelectorAll('button')].map((b) => b.textContent)).toEqual(
      ['Edit', 'AaFont', 'Colour', 'Style', 'Background', 'Size', 'Animate', 'Align', 'Opacity', 'Select', 'Split', 'Bring forward', 'Send back', 'Duplicate', 'Delete'],
    );
    expect(screen.queryByText('Add text')).toBeNull();
    fireEvent.click(screen.getByText('Text'));
    expect(store().activeItemId).toBe(null);
    expect(screen.queryByRole('toolbar', { name: 'Clip tools' })).toBeNull();
    expect(screen.getByRole('toolbar', { name: 'Text tools' })).toBeTruthy();
  });

  it('duplicates and deletes the selected clip', () => {
    const { container } = render(<VideoEditor onBack={() => {}} />);
    addTextFromRail();
    fireEvent.click(clips(container)[0]);
    fireEvent.click(screen.getByText('Duplicate'));
    expect(store().items).toHaveLength(2);
    fireEvent.click(screen.getByText('Delete'));
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
    fireEvent.click(screen.getByText('Select'));
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
    fireEvent.click(screen.getByText('1×'));
    fireEvent.click(screen.getByRole('radio', { name: '1.5×' }));
    expect(store().items[0]).toMatchObject({ playbackRate: 1.5 });
    expect(store().items[0].endMs).toBeCloseTo(2000 / 1.5);
  });

  it('switches between edit and full-screen preview', () => {
    const { container } = render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(screen.getByText('Edit'));
    expect(container.querySelector('.vt-editor.is-edit')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Full screen preview'));
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

  it('edits, resizes and aligns text from the rail', () => {
    const { container } = render(<VideoEditor onBack={() => {}} />);
    addTextFromRail();
    fireEvent.click(clips(container)[0]);
    fireEvent.click(within(screen.getByRole('toolbar', { name: 'Clip tools' })).getByText('Edit'));
    fireEvent.change(screen.getByPlaceholderText('Type your text'), { target: { value: 'WHEN IT WORKS' } });
    closeSheet();
    fireEvent.click(screen.getByText('Size'));
    fireEvent.change(screen.getByRole('slider'), { target: { value: '150' } });
    closeSheet();
    fireEvent.click(screen.getByText('Align'));
    fireEvent.click(screen.getByRole('radio', { name: 'Right' }));
    expect(store().items[0]).toMatchObject({ text: 'WHEN IT WORKS', fontSize: 150, align: 'right' });
  });

  it('turns green-screen removal on, tunes it and turns it off', () => {
    act(() => store().addItem({ type: 'video', url: 'a.mp4', durationMs: 2000 }));
    const { container } = render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(clips(container)[0]);
    fireEvent.click(screen.getByText('Green screen'));
    expect(store().items[0].chromaKey).toEqual({ color: 'auto', similarity: 0.22, blend: 0.08 });
    const [strength, edges] = screen.getAllByRole('slider');
    fireEvent.change(strength, { target: { value: '30' } });
    fireEvent.change(edges, { target: { value: '12' } });
    expect(store().items[0].chromaKey).toMatchObject({ similarity: 0.3, blend: 0.12 });
    fireEvent.click(screen.getByText('Turn off'));
    expect(store().items[0].chromaKey).toBe(null);
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
    fireEvent.click(screen.getByText('Canvas'));
    fireEvent.click(screen.getByText('Background'));
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
      fireEvent.click(screen.getByText('Canvas'));
      fireEvent.click(screen.getByText('Watermark'));
      fireEvent.change(screen.getByLabelText('Watermark text'), { target: { value: '@memer' } });
      fireEvent.click(screen.getByText('Top left'));
      expect(store().watermark).toEqual({ text: '@memer', corner: 'tl' });
      closeSheet();

      fireEvent.click(screen.getByText('End card'));
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
    fireEvent.click(screen.getByText('Audio'));
    fireEvent.click(screen.getByText('SFX'));
    fireEvent.click(screen.getByText('Vine Boom'));
    const sound = store().items.find((i) => i.type === 'audio');
    expect(sound).toMatchObject({ name: 'Vine Boom', url: '/sounds/vine_boom.mp3', startMs: 1200 });
  });

  it('freezes the frame under the playhead', async () => {
    act(() => store().addItem({ type: 'video', url: 'a.mp4', durationMs: 4000 }));
    const { container } = render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(clips(container)[0]);
    act(() => store().setPlayhead(1500));
    await act(async () => { fireEvent.click(screen.getByText('Freeze')); });
    const still = store().items.find((i) => i.isFreeze);
    expect(still).toMatchObject({ url: 'blob:still', startMs: 1500, endMs: 3000 });
    expect(store().busy).toBe(null);
  });

  it('reverses a clip and switches it back', async () => {
    act(() => store().addItem({ type: 'video', url: 'a.mp4', durationMs: 2000 }));
    const { container } = render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(clips(container)[0]);
    await act(async () => { fireEvent.click(screen.getByText('Reverse')); });
    expect(store().items[0]).toMatchObject({ url: 'blob:rev', effect: 'reverse' });
    fireEvent.click(screen.getByText('Reverse'));
    expect(store().items[0]).toMatchObject({ url: 'a.mp4', effect: null });
  });

  it('adds zoom punches at the playhead and clears them', () => {
    act(() => store().addItem({ type: 'video', url: 'a.mp4', durationMs: 4000 }));
    const { container } = render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(clips(container)[0]);
    fireEvent.click(screen.getByText('Punch'));
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
    fireEvent.click(screen.getByText('Bring forward'));
    expect(drawOrder(store().items).map((i) => i.type)).toEqual(['text', 'sticker']);
  });

  it('applies a filter preset and adjustments to a video', () => {
    act(() => store().addItem({ type: 'video', url: 'a.mp4', durationMs: 2000 }));
    const { container } = render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(clips(container)[0]);
    fireEvent.click(screen.getByText('Filters'));
    fireEvent.click(screen.getByText('Vintage'));
    const [bright] = screen.getAllByRole('slider');
    fireEvent.change(bright, { target: { value: '30' } });
    expect(store().items[0].filter).toEqual({ preset: 'vintage', brightness: 30 });
    closeSheet();
    // The pill's Filters button now says which preset is on.
    expect(screen.getByRole('toolbar', { name: 'Clip tools' }).textContent).toContain('Vintage');
  });

  it('records a voiceover over the video and drops it where it started', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:voice');
    act(() => store().addItem({ type: 'video', url: 'a.mp4', durationMs: 5000 }));
    render(<VideoEditor onBack={() => {}} />);
    act(() => store().setPlayhead(1000));
    fireEvent.click(screen.getByText('Audio'));
    fireEvent.click(screen.getByText('Voice'));
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
    fireEvent.click(screen.getByText('Transition'));
    fireEvent.click(screen.getByText('Fade'));
    expect(store().items[1].transitionIn).toEqual({ type: 'fade', durationMs: 500 });
    expect(container.querySelector('.vt-transition-mark')).toBeTruthy();
    fireEvent.click(screen.getByText('None'));
    expect(store().items[1].transitionIn).toBe(null);
  });

  it('generates auto captions from speech, restyles and removes them', async () => {
    render(<VideoEditor onBack={() => {}} />);
    act(() => { store().addItem({ type: 'video', url: 'blob:talk', durationMs: 2000 }); store().setActiveItem(null); });
    fireEvent.click(screen.getByText('Text'));
    fireEvent.click(screen.getByText('Captions'));
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
    fireEvent.click(screen.getByLabelText('Full screen preview'));
    const actions = container.querySelector('.vt-top-actions');
    expect(actions.querySelector('.ui-size-menu')).toBeTruthy();
    expect(actions.lastElementChild.textContent).toContain('Export');
    fireEvent.click(screen.getByText('Edit'));
    expect(container.querySelector('.ui-size-menu')).toBeNull();
  });
});
