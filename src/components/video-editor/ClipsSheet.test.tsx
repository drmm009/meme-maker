// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import ClipsSheet from './ClipsSheet';

afterEach(cleanup);

describe('ClipsSheet', () => {
  it("shows a clip's own frame where its thumbnail can't be had", () => {
    render(<ClipsSheet onPick={vi.fn()} onClose={vi.fn()} />);
    const card = within(screen.getByRole('dialog', { name: 'Clips' })).getAllByRole('button').find((b) => b.classList.contains('ie-card'))!;
    const img = card.querySelector('img')!;
    expect(card.querySelector('video')).toBeNull();
    fireEvent.error(img);
    const video = card.querySelector('video')!;
    expect(video.getAttribute('src')).toMatch(/\.mp4#t=0\.5$/);
    expect(card.querySelector('img')).toBeNull();
  });
});
