// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import VideoBandsPanel from './VideoBandsPanel';
import { useEditorStore } from '../../store/useVideoEditorStore';
import { DEFAULT_VIDEO_BAND } from '../../utils/videoBands';

beforeEach(() => {
  useEditorStore.setState({ videoHeader: DEFAULT_VIDEO_BAND, videoFooter: DEFAULT_VIDEO_BAND });
});
afterEach(cleanup);

describe('VideoBandsPanel', () => {
  it('switches the header bar on, then sets one colour for both bars', () => {
    render(<VideoBandsPanel />);
    expect(screen.getByText(/Switch one on/)).toBeTruthy();
    fireEvent.click(screen.getByRole('switch', { name: 'Header' }));
    expect(useEditorStore.getState().videoHeader.enabled).toBe(true);
    expect(useEditorStore.getState().videoFooter.enabled).toBe(false);

    fireEvent.click(screen.getByRole('radio', { name: /#ff5a36/i }));
    expect(useEditorStore.getState().videoHeader.bgColor).toBe('#ff5a36');
    expect(useEditorStore.getState().videoFooter.bgColor).toBe('#ff5a36');
  });
});
