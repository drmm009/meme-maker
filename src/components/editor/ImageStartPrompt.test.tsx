// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import ImageStartPrompt from './ImageStartPrompt';
import type { ReactElement } from 'react';
import { createMemeEditorStore, MemeEditorStoreContext } from './store/useMemeEditorStore';
import { createEditorUiStore, EditorUiStoreContext } from './store/useEditorUiStore';

type AnyState = Record<string, unknown>;
type Api = { getState: () => AnyState; setState: (s: AnyState) => void };
let doc: Api;
let ui: Api;

// The editor's two stores for a template, provided as the editor does.
const storesFor = (template: AnyState) => {
  doc = createMemeEditorStore(template) as unknown as Api;
  ui = createEditorUiStore(template) as unknown as Api;
};
const renderIn = (el: ReactElement) => render(
  <MemeEditorStoreContext.Provider value={doc as never}>
    <EditorUiStoreContext.Provider value={ui as never}>{el}</EditorUiStoreContext.Provider>
  </MemeEditorStoreContext.Provider>,
);

beforeEach(() => storesFor({ id: 'blank', canvasOnly: true, canvasBgColor: '#ffffff' }));
afterEach(cleanup);

describe('ImageStartPrompt', () => {
  it('offers a photo, templates and stickers on a blank canvas, in ink that suits it', () => {
    const { container } = renderIn(<ImageStartPrompt onPhoto={() => {}} />);
    const group = screen.getByRole('group', { name: 'Start your meme' });
    expect([...group.querySelectorAll('button')].map((b) => b.textContent?.trim())).toEqual(['Add a photo', 'Templates', 'Stickers']);
    expect(container.querySelector('.ui-start.is-ink-dark')).toBeTruthy();
    act(() => doc.setState({ canvasBgColor: '#000000' }));
    expect(container.querySelector('.ui-start.is-ink-light')).toBeTruthy();
  });

  it('opens the photo picker or a sheet, and goes away once there is something on the canvas', () => {
    const onPhoto = vi.fn();
    const { container } = renderIn(<ImageStartPrompt onPhoto={onPhoto} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const pick = vi.spyOn(input, 'click');
    fireEvent.click(screen.getByText('Add a photo'));
    expect(pick).toHaveBeenCalled();
    fireEvent.change(input, { target: { files: [new File(['x'], 'a.png', { type: 'image/png' })] } });
    expect(onPhoto).toHaveBeenCalled();

    fireEvent.click(screen.getByText('Templates'));
    expect(ui.getState().sheet).toBe('templates');
    expect(screen.queryByRole('group', { name: 'Start your meme' })).toBeNull();

    act(() => ui.setState({ sheet: null }));
    expect(screen.getByRole('group', { name: 'Start your meme' })).toBeTruthy();
    act(() => doc.setState({ imageLayers: [{ id: 'img-1' }] }));
    expect(screen.queryByRole('group', { name: 'Start your meme' })).toBeNull();
  });

  it('is not shown on a template picture', () => {
    storesFor({ id: 'drake', imageUrl: 'drake.jpg' });
    renderIn(<ImageStartPrompt onPhoto={() => {}} />);
    expect(screen.queryByRole('group')).toBeNull();
  });
});
