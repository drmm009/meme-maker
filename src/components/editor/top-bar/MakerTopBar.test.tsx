// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { createMemeEditorStore, MemeEditorStoreContext } from '../store/useMemeEditorStore';
import { makeStickerTemplate, stickerStep } from '../stickerMaker';
import { aiStep } from '../aiMeme';
import MakerTopBar from './MakerTopBar';

afterEach(cleanup);

function renderBar(imageLayers: object[], mode: 'sticker' | 'ai' = 'sticker', extra: object = {}) {
  const onBack = vi.fn();
  const doc = createMemeEditorStore({ ...makeStickerTemplate(), imageLayers, ...extra });
  const { container } = render(
    <MemeEditorStoreContext.Provider value={doc as never}>
      <MakerTopBar mode={mode} onBack={onBack} />
    </MemeEditorStoreContext.Provider>,
  );
  const step = (label: string) => [...container.querySelectorAll('.mtb-step')].find((s) => s.textContent?.includes(label))!;
  return { onBack, step };
}

describe('MakerTopBar', () => {
  it('knows the step: no photo, a photo to style, a cut-out sticker', () => {
    expect(stickerStep([])).toBe(0);
    expect(stickerStep([{ originalUrl: null }])).toBe(1);
    expect(stickerStep([{ originalUrl: 'photo.png' }])).toBe(2);
  });

  it('lights the step the sticker is on, ticks the ones done, and says it in words', () => {
    const { onBack, step } = renderBar([{ id: 'p', url: 'photo.png', x: 0.5, y: 0.5 }]);
    expect(screen.getByRole('heading', { name: 'Stickers' })).toBeTruthy();
    expect(step('Photo').className).toContain('is-done');
    expect(step('Style').className).toContain('is-now');
    expect(step('Export').className).not.toMatch(/is-(now|done)/);
    expect(screen.getByText('Ready to generate')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Undo' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(onBack).toHaveBeenCalled();
  });

  it('the AI Meme maker: Meme done, Idea lit until Generate makes it, then Export', () => {
    expect(aiStep({ imageUrl: 'drake.jpg' })).toBe(1);
    expect(aiStep({ imageUrl: 'drake.jpg', aiPicked: true })).toBe(2);
    const { step } = renderBar([], 'ai', { imageUrl: 'drake.jpg' });
    expect(screen.getByRole('heading', { name: 'AI Meme' })).toBeTruthy();
    expect(step('Meme').className).toContain('is-done');
    expect(step('Idea').className).toContain('is-now');
    expect(screen.getByText('Pick a meme and an idea')).toBeTruthy();
  });
});
