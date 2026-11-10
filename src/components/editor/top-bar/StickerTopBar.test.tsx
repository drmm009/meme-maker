// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { createMemeEditorStore, MemeEditorStoreContext } from '../store/useMemeEditorStore';
import { makeStickerTemplate, stickerStep } from '../stickerMaker';
import StickerTopBar from './StickerTopBar';

afterEach(cleanup);

function renderBar(imageLayers: object[]) {
  const onBack = vi.fn();
  const doc = createMemeEditorStore({ ...makeStickerTemplate(), imageLayers });
  const { container } = render(
    <MemeEditorStoreContext.Provider value={doc as never}>
      <StickerTopBar onBack={onBack} />
    </MemeEditorStoreContext.Provider>,
  );
  const step = (label: string) => [...container.querySelectorAll('.stb-step')].find((s) => s.textContent?.includes(label))!;
  return { onBack, step };
}

describe('StickerTopBar', () => {
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
});
