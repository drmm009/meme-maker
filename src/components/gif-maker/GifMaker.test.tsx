// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within, waitFor } from '@testing-library/react';

const makeGif = vi.fn(async () => new Blob(['GIF89a'], { type: 'image/gif' }));

// Videos "load" as soon as they're given a source: 12 seconds, 640 × 360 (jsdom plays nothing).
const media = HTMLMediaElement.prototype;
const saved = {
  src: Object.getOwnPropertyDescriptor(media, 'src'),
  duration: Object.getOwnPropertyDescriptor(media, 'duration'),
  play: media.play,
  pause: media.pause,
};

beforeEach(() => {
  let n = 0;
  URL.createObjectURL = vi.fn(() => `blob:${++n}`);
  URL.revokeObjectURL = vi.fn();
  Object.defineProperty(media, 'src', {
    configurable: true,
    get() { return this.getAttribute('src') ?? ''; },
    set(v: string) {
      this.setAttribute('src', v);
      setTimeout(() => (this as HTMLMediaElement).onloadedmetadata?.(new Event('loadedmetadata')), 0);
    },
  });
  Object.defineProperty(media, 'duration', { configurable: true, get: () => 12 });
  Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', { configurable: true, get: () => 640 });
  Object.defineProperty(HTMLVideoElement.prototype, 'videoHeight', { configurable: true, get: () => 360 });
  media.play = vi.fn(() => Promise.resolve());
  media.pause = vi.fn();
});
afterEach(() => {
  cleanup();
  if (saved.src) Object.defineProperty(media, 'src', saved.src);
  if (saved.duration) Object.defineProperty(media, 'duration', saved.duration);
  media.play = saved.play;
  media.pause = saved.pause;
  makeGif.mockClear();
});

async function load() {
  vi.resetModules();
  vi.doMock('./renderGif', () => ({ makeGif, CAPTION_FONT: 'Impact' }));
  return (await import('./GifMaker')).default;
}

const clip = () => new File(['x'], 'clip.mp4', { type: 'video/mp4' });

describe('GifMaker', () => {
  it('starts on one card to add a video, with Upload and Record, and no photos', async () => {
    const GifMaker = await load();
    render(<GifMaker onBack={() => {}} />);
    expect(screen.getByRole('heading', { name: 'GIF Studio' })).toBeTruthy();
    expect(screen.getByText('Add a video', { selector: '.ui-topbar-subtitle' })).toBeTruthy();
    expect(screen.getByLabelText('Choose a video')).toBeTruthy();
    const sources = screen.getByRole('group', { name: 'Add a video' });
    expect(within(sources).getByLabelText('Upload a video')).toBeTruthy();
    expect(within(sources).getByLabelText('Record a video')).toBeTruthy();
    expect(screen.queryByLabelText('Choose photos')).toBeNull();
    expect((screen.getByRole('button', { name: 'Export' }) as HTMLButtonElement).disabled).toBe(true);
    // The stage invites the video; a line under Export says what comes first.
    expect(screen.getByText('Turn a video into a GIF')).toBeTruthy();
    expect(screen.getByText('Add a video to start')).toBeTruthy();
  });

  it('Clips opens the meme clips; a pick is downloaded and becomes the clip', async () => {
    const fetchMock = vi.fn(async () => new Response(new Blob(['x'], { type: 'video/mp4' })));
    vi.stubGlobal('fetch', fetchMock);
    try {
      const GifMaker = await load();
      render(<GifMaker onBack={() => {}} />);
      fireEvent.click(within(screen.getByRole('group', { name: 'Add a video' })).getByRole('button', { name: 'Clips' }));
      const sheet = screen.getByRole('dialog', { name: 'Pick a clip' });
      fireEvent.click(within(sheet).getAllByRole('button').find((b) => b.classList.contains('ie-card'))!);
      expect(await screen.findByRole('slider', { name: 'Clip start' })).toBeTruthy();
      expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\.mp4$/));
      expect(screen.queryByRole('dialog', { name: 'Pick a clip' })).toBeNull();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('a video becomes a clip to trim, caption and make into a GIF to save; Remove goes back to the start', async () => {
    const GifMaker = await load();
    const onSave = vi.fn();
    render(<GifMaker onBack={() => {}} onSaveToGallery={onSave} />);
    fireEvent.change(screen.getByLabelText('Upload a video'), { target: { files: [clip()] } });

    // Its first five seconds, ready to make.
    const start = await screen.findByRole('slider', { name: 'Clip start' });
    expect(start.getAttribute('aria-valuenow')).toBe('0');
    expect(screen.getByRole('slider', { name: 'Clip end' }).getAttribute('aria-valuenow')).toBe('5');
    expect(screen.getByText('Ready to make', { selector: '.ui-topbar-subtitle' })).toBeTruthy();
    expect(screen.queryByRole('group', { name: 'Add a video' })).toBeNull();
    // Change (another video) and Remove sit on the stage; Export moves to the header's right.
    expect(screen.getByLabelText('Change the video')).toBeTruthy();
    expect(screen.getByRole('banner').contains(screen.getByRole('button', { name: 'Export' }))).toBe(true);
    expect(screen.getAllByRole('button', { name: 'Export' })).toHaveLength(1);

    fireEvent.change(screen.getByLabelText('Caption'), { target: { value: 'when it works' } });
    fireEvent.click(within(screen.getByRole('radiogroup', { name: 'Caption place' })).getByRole('radio', { name: 'Bottom' }));
    fireEvent.click(within(screen.getByRole('radiogroup', { name: 'Loop' })).getByRole('radio', { name: 'Bounce' }));
    fireEvent.click(within(screen.getByRole('radiogroup', { name: 'Size' })).getByRole('radio', { name: 'Small' }));
    expect(screen.getByText('320 × 180')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Export' }));
    const sheet = await screen.findByRole('dialog', { name: 'Your GIF' });
    expect(makeGif).toHaveBeenCalledWith(
      expect.objectContaining({ trim: { start: 0, end: 5 }, speed: 1, loop: 'bounce', w: 320, h: 180, caption: { text: 'when it works', place: 'bottom' } }),
      expect.any(Function),
    );
    expect(screen.getByText('Ready to export', { selector: '.ui-topbar-subtitle' })).toBeTruthy();
    expect(within(sheet).getByRole('button', { name: 'Download' })).toBeTruthy();
    // Its name starts as the caption and can be edited; the edited name is what's saved.
    const name = within(sheet).getByLabelText('GIF name') as HTMLInputElement;
    expect(name.value).toBe('when it works');
    fireEvent.change(name, { target: { value: 'Friday mood' } });
    fireEvent.click(within(sheet).getByRole('button', { name: 'Save to My Studio' }));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'Friday mood', imageUrl: expect.stringMatching(/^data:image\/gif/) })));
    expect(within(sheet).getByRole('button', { name: 'Saved to My Studio' })).toBeTruthy();
    fireEvent.click(within(sheet).getByRole('button', { name: 'Close' }));

    fireEvent.click(screen.getByRole('button', { name: 'Remove the video' }));
    expect(screen.getByLabelText('Choose a video')).toBeTruthy();
    expect(screen.queryByRole('slider', { name: 'Clip start' })).toBeNull();
  });
});
