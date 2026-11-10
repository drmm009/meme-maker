// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within, waitFor } from '@testing-library/react';

const makeGif = vi.fn(async () => new Blob(['GIF89a'], { type: 'image/gif' }));

// Photos "load" as soon as they're given a source (jsdom doesn't decode images).
class FakeImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = 800;
  naturalHeight = 600;
  set src(_: string) { setTimeout(() => this.onload?.(), 0); }
}

beforeEach(() => {
  vi.stubGlobal('Image', FakeImage);
  let n = 0;
  URL.createObjectURL = vi.fn(() => `blob:${++n}`);
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  makeGif.mockClear();
});

async function load() {
  vi.resetModules();
  vi.doMock('./renderGif', () => ({ makeGif, CAPTION_FONT: 'Impact' }));
  return (await import('./GifMaker')).default;
}

const files = (...names: string[]) => names.map((n) => new File(['x'], n, { type: 'image/jpeg' }));

describe('GifMaker', () => {
  it('starts on Video and Photos; photos become frames to move, caption and make into a GIF to save', async () => {
    const GifMaker = await load();
    const onSave = vi.fn();
    render(<GifMaker onBack={() => {}} onSaveToGallery={onSave} />);
    expect(screen.getByText('Add a video or photos', { selector: '.ui-topbar-subtitle' })).toBeTruthy();
    expect(screen.getByLabelText('Choose a video')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Make GIF' }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(screen.getByLabelText('Choose photos'), { target: { files: files('a.jpg', 'b.jpg', 'c.jpg') } });
    const frames = await screen.findByRole('list', { name: 'Frames' });
    expect(within(frames).getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText('Ready to make', { selector: '.ui-topbar-subtitle' })).toBeTruthy();

    // A picked frame moves later; the order is what the GIF gets.
    fireEvent.click(within(frames).getByRole('button', { name: 'Frame 1' }));
    fireEvent.click(within(frames).getByRole('button', { name: 'Move later' }));
    fireEvent.change(screen.getByLabelText('Caption'), { target: { value: 'when it works' } });
    fireEvent.click(within(screen.getByRole('radiogroup', { name: 'Caption place' })).getByRole('radio', { name: 'Bottom' }));
    fireEvent.click(within(screen.getByRole('radiogroup', { name: 'Loop' })).getByRole('radio', { name: 'Bounce' }));
    fireEvent.click(within(screen.getByRole('radiogroup', { name: 'Size' })).getByRole('radio', { name: 'Small' }));
    expect(screen.getByText('320 × 240')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Make GIF' }));
    const sheet = await screen.findByRole('dialog', { name: 'Your GIF' });
    expect(makeGif).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'photos', urls: ['blob:2', 'blob:1', 'blob:3'], loop: 'bounce', w: 320, h: 240, caption: { text: 'when it works', place: 'bottom' } }),
      expect.any(Function),
    );
    expect(screen.getByText('Ready to export', { selector: '.ui-topbar-subtitle' })).toBeTruthy();
    expect(within(sheet).getByRole('button', { name: 'Download' })).toBeTruthy();
    fireEvent.click(within(sheet).getByRole('button', { name: 'Save to My Studio' }));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'when it works', imageUrl: expect.stringMatching(/^data:image\/gif/) })));
    expect(within(sheet).getByRole('button', { name: 'Saved to My Studio' })).toBeTruthy();
  });

  it('removing the last frame goes back to the start; Start over clears it', async () => {
    const GifMaker = await load();
    render(<GifMaker onBack={() => {}} />);
    fireEvent.change(screen.getByLabelText('Choose photos'), { target: { files: files('a.jpg') } });
    fireEvent.click(await screen.findByRole('button', { name: 'Frame 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove frame' }));
    expect(screen.getByLabelText('Choose photos')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Choose photos'), { target: { files: files('a.jpg') } });
    fireEvent.click(await screen.findByRole('button', { name: 'Start over' }));
    expect(screen.queryByRole('list', { name: 'Frames' })).toBeNull();
  });
});
