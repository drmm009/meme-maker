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
  it('has Upload, Camera and Gallery on the page, and the styles as cards with what each does', () => {
    const { ui } = renderStudio();
    const page = screen.getByRole('region', { name: 'Make a sticker' });
    const sources = within(page).getByRole('group', { name: 'Add a photo' });
    expect(within(sources).getByLabelText('Upload a photo')).toBeTruthy();
    expect(within(sources).getByLabelText('Take a photo')).toBeTruthy();
    fireEvent.click(within(sources).getByRole('button', { name: 'Gallery' }));
    expect(ui.getState().sheet).toBe('stickerGallery');

    const styles = within(page).getByRole('radiogroup', { name: 'Sticker style' });
    expect(within(styles).getByRole('radio', { name: 'Comic' }).textContent).toContain('Thin black');
  });

  it('previews the photo in the picked style before it is cut out', () => {
    renderStudio([{ id: 'p', url: 'photo.png', x: 0.5, y: 0.5 }]);
    const page = screen.getByRole('region', { name: 'Make a sticker' });
    const preview = page.querySelector('img.ie-stk-preview') as HTMLImageElement;
    expect(preview.getAttribute('src')).toBe('photo.png');
    expect(preview.className).toContain('ie-stk-preview--classic');
    fireEvent.click(within(page).getByRole('radio', { name: 'Retro' }));
    expect(preview.className).toContain('ie-stk-preview--retro');
  });

  it('while cutting out, says so and holds every control', () => {
    renderStudio([{ id: 'p', url: 'photo.png', x: 0.5, y: 0.5 }], { isRemovingBg: true } as Partial<EditorActions>);
    expect(screen.getByRole('status').textContent).toContain('Cutting out your sticker');
    expect((screen.getByRole('button', { name: 'Generating…' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Gallery' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByRole('button', { name: 'Remove the photo' })).toBeNull();
  });
});
