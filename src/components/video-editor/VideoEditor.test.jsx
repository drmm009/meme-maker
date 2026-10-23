// @vitest-environment jsdom
// Smoke tests for the video editor shell: what the tool rail, timeline and modes do to the store.
// The Konva preview, FFmpeg export and the meme API are replaced; everything else is real.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import VideoEditor from './VideoEditor';
import { useEditorStore } from '../../store/useVideoEditorStore';

vi.mock('./CanvasPreview', () => ({ default: () => <div data-testid="canvas-preview" /> }));
vi.mock('../../utils/ffmpegExport', () => ({ exportVideoFFmpeg: vi.fn(() => Promise.resolve()) }));
vi.mock('../../services/memeService', () => ({ fetchOpenSourceMemes: () => Promise.resolve([]) }));

const store = () => useEditorStore.getState();
const clips = (container) => [...container.querySelectorAll('.vt-clip')];

beforeEach(() => {
  store().clearItems();
  store().setLayoutSlots([]);
});
afterEach(cleanup);

describe('VideoEditor', () => {
  it('starts in edit mode with an empty-state prompt and the add tools', () => {
    const { container } = render(<VideoEditor onBack={() => {}} />);
    expect(container.querySelector('.vt-editor.is-edit')).toBeTruthy();
    expect(screen.getByText('Start with a video or photo')).toBeTruthy();
    expect(screen.getByText('Add a video')).toBeTruthy();
    for (const label of ['Text', 'Stickers', 'Emoji', 'Photo', 'Video', 'Sounds']) expect(screen.getByText(label)).toBeTruthy();
  });

  it('adds a text clip from the rail and shows it on the timeline', () => {
    const { container } = render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(screen.getByText('Text'));
    expect(store().items).toHaveLength(1);
    expect(store().items[0]).toMatchObject({ type: 'text', text: 'NEW TEXT' });
    expect(clips(container)).toHaveLength(1);
    expect(clips(container)[0].className).toContain('vt-clip--text');
    expect(screen.queryByText('Start with a video or photo')).toBeNull();
  });

  it('swaps the rail to clip tools on select and back on Done', () => {
    const { container } = render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(screen.getByText('Text'));
    fireEvent.click(clips(container)[0]);
    expect(store().activeItemId).toBe(store().items[0].id);
    expect(clips(container)[0].className).toContain('is-selected');
    expect(screen.getByText('Background')).toBeTruthy();
    expect(screen.queryByText('Stickers')).toBeNull();
    fireEvent.click(screen.getByText('Done'));
    expect(store().activeItemId).toBe(null);
    expect(screen.getByText('Stickers')).toBeTruthy();
  });

  it('duplicates and deletes the selected clip', () => {
    const { container } = render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(screen.getByText('Text'));
    fireEvent.click(clips(container)[0]);
    fireEvent.click(screen.getByText('Duplicate'));
    expect(store().items).toHaveLength(2);
    fireEvent.click(screen.getByText('Delete'));
    expect(store().items).toHaveLength(1);
    expect(store().activeItemId).toBe(null);
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

  it('cycles video speed and keeps the clip covering the same footage', () => {
    act(() => store().addItem({ type: 'video', url: 'a.mp4', durationMs: 2000 }));
    const { container } = render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(clips(container)[0]);
    fireEvent.click(screen.getByText('1×'));
    expect(store().items[0]).toMatchObject({ playbackRate: 1.5 });
    expect(store().items[0].endMs).toBeCloseTo(2000 / 1.5);
  });

  it('switches between edit and full-screen preview', () => {
    const { container } = render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(screen.getByLabelText('Full screen preview'));
    expect(container.querySelector('.vt-editor.is-preview')).toBeTruthy();
    fireEvent.click(screen.getByText('Edit'));
    expect(container.querySelector('.vt-editor.is-edit')).toBeTruthy();
  });

  it('plays and pauses from the transport and the space bar', () => {
    act(() => store().addItem({ type: 'video', url: 'a.mp4', durationMs: 2000 }));
    render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(screen.getByLabelText('Play'));
    expect(store().isPlaying).toBe(true);
    fireEvent.keyDown(window, { code: 'Space' });
    expect(store().isPlaying).toBe(false);
  });

  it('calls onBack from the close button', () => {
    const onBack = vi.fn();
    render(<VideoEditor onBack={onBack} />);
    fireEvent.click(screen.getByLabelText('Close editor'));
    expect(onBack).toHaveBeenCalled();
  });
});
