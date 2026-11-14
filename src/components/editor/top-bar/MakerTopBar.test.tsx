// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { createMemeEditorStore, MemeEditorStoreContext } from '../store/useMemeEditorStore';
import { makeStickerTemplate, stickerStep } from '../stickerMaker';
import { aiStep } from '../aiMeme';
import MakerTopBar from './MakerTopBar';

afterEach(cleanup);

function renderBar(imageLayers: object[], mode: 'sticker' | 'ai' | 'faceswap' = 'sticker', extra: object = {}) {
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
    expect(screen.getByRole('heading', { name: /^Create Custom\s*Stickers$/ })).toBeTruthy();
    expect(screen.getByText('AI Sticker Studio')).toBeTruthy();
    expect(step('Photo').className).toContain('is-done');
    expect(step('Style').className).toContain('is-now');
    expect(step('Export').className).not.toMatch(/is-(now|done)/);
    expect(screen.getByText('Ready to generate')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(onBack).toHaveBeenCalled();
  });

  it('the AI Meme maker: its tagline and title, no step track, and where the meme stands in words', () => {
    expect(aiStep({ imageUrl: 'drake.jpg' })).toBe(1);
    expect(aiStep({ imageUrl: 'drake.jpg', aiPicked: true })).toBe(2);
    const { step } = renderBar([], 'ai', { imageUrl: 'drake.jpg' });
    expect(screen.getByRole('heading', { name: /^Create an\s*AI Meme$/ })).toBeTruthy();
    expect(screen.getByText('AI Meme Studio')).toBeTruthy();
    expect(step('Idea')).toBeUndefined();
    expect(screen.getByText('Pick a meme and an idea')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Undo' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('the Face Swap maker: its tagline and title, no step track, and where the swap stands in words', () => {
    const { step } = renderBar([], 'faceswap', { imageUrl: 'drake.jpg' });
    expect(screen.getByRole('heading', { name: /^Instant\s*Face Swap$/ })).toBeTruthy();
    expect(screen.getByText('AI Face Studio')).toBeTruthy();
    expect(step('Export')).toBeUndefined();
    expect(screen.getByText('Pick a face and a picture')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Undo' })).toBeTruthy();
  });
});
