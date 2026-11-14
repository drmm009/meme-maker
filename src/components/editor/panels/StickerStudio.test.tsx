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
  it('with no photo: one card to add one, Upload, Camera and Templates above the outline styles, and the styles to pick already', () => {
    const { ui } = renderStudio();
    const page = screen.getByRole('region', { name: 'Make a sticker' });
    // The card itself uploads.
    expect(within(page).getByLabelText('Add your photo')).toBeTruthy();
    expect(within(page).queryByText('Add a photo to start')).toBeNull();
    expect(within(page).queryByText('Choose photo')).toBeNull();
    expect(within(page).queryByRole('radiogroup', { name: 'Preview backdrop' })).toBeNull();
    // Where the photo comes from, on the page, before the outline styles.
    const sources = within(page).getByRole('group', { name: 'Add a photo' });
    expect(within(sources).getByLabelText('Upload a photo')).toBeTruthy();
    expect(within(sources).getByLabelText('Take a photo')).toBeTruthy();
    const styles = within(page).getByRole('radiogroup', { name: 'Sticker style' });
    expect(sources.compareDocumentPosition(styles) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // The styles are there from the start, on a sample picture; the pick is kept for Generate.
    expect(within(styles).getAllByRole('radio').map((r) => r.textContent)).toEqual(['Classic', 'Bold', 'Comic', 'Pop', 'Clean', 'Retro']);
    fireEvent.click(within(styles).getByRole('radio', { name: 'Comic' }));
    expect(ui.getState().stickerStyle).toBe('comic');
    expect((within(page).getByRole('button', { name: 'Generate sticker' }) as HTMLButtonElement).disabled).toBe(true);
    // Templates is the Templates browser; its pick becomes the photo.
    fireEvent.click(within(sources).getByRole('button', { name: 'Templates' }));
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

  it('with a photo the sources stay to change it; Remove goes back to the empty card', () => {
    const { doc } = renderStudio([{ id: 'p', url: 'photo.png', x: 0.5, y: 0.5 }]);
    const sources = screen.getByRole('group', { name: 'Add a photo' });
    expect(within(sources).getByLabelText('Upload a photo')).toBeTruthy();
    expect(within(sources).getByRole('button', { name: 'Templates' })).toBeTruthy();
    expect(screen.queryByText('Change photo')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Remove the photo' }));
    expect((doc.getState() as { imageLayers: unknown[] }).imageLayers).toHaveLength(0);
    expect(screen.getByLabelText('Add your photo')).toBeTruthy();
  });

  it('while cutting out, says so and holds every control', () => {
    renderStudio([{ id: 'p', url: 'photo.png', x: 0.5, y: 0.5 }], { isRemovingBg: true } as Partial<EditorActions>);
    expect(screen.getByRole('status').textContent).toContain('Cutting out your sticker');
    expect((screen.getByRole('button', { name: 'Generating…' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('radio', { name: 'Classic' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByRole('button', { name: 'Remove the photo' })).toBeNull();
    expect((screen.getByRole('button', { name: 'Templates' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByLabelText('Upload a photo') as HTMLInputElement).disabled).toBe(true);
  });
});
