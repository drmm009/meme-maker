// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { createMemeEditorStore, MemeEditorStoreContext } from '../store/useMemeEditorStore';
import { createEditorUiStore, EditorUiStoreContext } from '../store/useEditorUiStore';
import { makeStickerTemplate } from '../stickerMaker';
import StickerStudio from './StickerStudio';
import type { EditorActions } from './selection';

afterEach(cleanup);

function renderStudio(imageLayers: object[] = [], actions: Partial<EditorActions> = {}) {
  const template = { ...makeStickerTemplate(), imageLayers };
  const doc = createMemeEditorStore(template);
  const ui = createEditorUiStore(template);
  render(
    <MemeEditorStoreContext.Provider value={doc as never}>
      <EditorUiStoreContext.Provider value={ui as never}>
        <StickerStudio actions={{ handleGenerateSticker: vi.fn(), handleFileUploadImageLayer: vi.fn(), ...actions } as unknown as EditorActions} />
      </EditorUiStoreContext.Provider>
    </MemeEditorStoreContext.Provider>,
  );
  return { doc, ui };
}

describe('StickerStudio', () => {
  it('with no photo: a card to add one, and Upload, Camera and Gallery; no styles yet', () => {
    const { ui } = renderStudio();
    const page = screen.getByRole('region', { name: 'Make a sticker' });
    expect(within(page).getByLabelText('Choose your photo')).toBeTruthy();
    const sources = within(page).getByRole('group', { name: 'Add a photo' });
    expect(within(sources).getByLabelText('Upload a photo')).toBeTruthy();
    expect(within(sources).getByLabelText('Take a photo')).toBeTruthy();
    expect(within(page).queryByRole('radiogroup', { name: 'Sticker style' })).toBeNull();
    expect((within(page).getByRole('button', { name: 'Generate sticker' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(within(sources).getByRole('button', { name: 'Gallery' }));
    expect(ui.getState().sheet).toBe('stickerGallery');
  });

  it('with a photo: the styles are small pictures of it, and the pick shows on the big one', () => {
    renderStudio([{ id: 'p', url: 'photo.png', x: 0.5, y: 0.5 }]);
    const page = screen.getByRole('region', { name: 'Make a sticker' });
    const preview = page.querySelector('img.ie-stk-preview') as HTMLImageElement;
    expect(preview.getAttribute('src')).toBe('photo.png');
    expect(preview.className).toContain('ie-stk-look--classic');
    const styles = within(page).getByRole('radiogroup', { name: 'Sticker style' });
    const radios = within(styles).getAllByRole('radio');
    expect(radios.map((r) => r.textContent)).toEqual(['Classic', 'Bold', 'Comic', 'Pop', 'Clean', 'Retro']);
    expect(radios.every((r) => r.querySelector('img')?.getAttribute('src') === 'photo.png')).toBe(true);
    fireEvent.click(within(styles).getByRole('radio', { name: 'Retro' }));
    expect(preview.className).toContain('ie-stk-look--retro');
    expect(within(styles).getByRole('radio', { name: 'Retro' }).getAttribute('aria-checked')).toBe('true');
  });

  it('Change opens where a photo comes from; Remove goes back to the first screen', () => {
    const { doc } = renderStudio([{ id: 'p', url: 'photo.png', x: 0.5, y: 0.5 }]);
    fireEvent.click(screen.getByRole('button', { name: 'Change the photo' }));
    const sheet = screen.getByRole('dialog', { name: 'Your photo' });
    expect(within(sheet).getByLabelText('Upload a photo')).toBeTruthy();
    expect(within(sheet).getByRole('button', { name: 'Gallery' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Remove the photo' }));
    expect((doc.getState() as { imageLayers: unknown[] }).imageLayers).toHaveLength(0);
    expect(screen.getByLabelText('Choose your photo')).toBeTruthy();
  });

  it('while cutting out, says so and holds every control', () => {
    renderStudio([{ id: 'p', url: 'photo.png', x: 0.5, y: 0.5 }], { isRemovingBg: true } as Partial<EditorActions>);
    expect(screen.getByRole('status').textContent).toContain('Cutting out your sticker');
    expect((screen.getByRole('button', { name: 'Generating…' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('radio', { name: 'Classic' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByRole('button', { name: 'Remove the photo' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Change the photo' })).toBeNull();
  });
});
