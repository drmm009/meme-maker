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
  it('offers a photo, text, templates and stickers on a blank canvas, in ink that suits it', () => {
    const { container } = renderIn(<ImageStartPrompt onPhoto={() => {}} />);
    const group = screen.getByRole('group', { name: 'Start your meme' });
    expect([...group.querySelectorAll('button')].map((b) => b.textContent?.trim())).toEqual(['Add a photo', 'Text', 'Templates', 'Stickers']);
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

  it('goes away once text is added beyond the starting captions', () => {
    renderIn(<ImageStartPrompt onPhoto={() => {}} />);
    expect(screen.getByRole('group', { name: 'Start your meme' })).toBeTruthy();
    const captions = doc.getState().captions as unknown[];
    act(() => doc.setState({ captions: [...captions, { id: 'cap-new', text: 'MORE' }] }));
    expect(screen.queryByRole('group', { name: 'Start your meme' })).toBeNull();
  });

  it('shows on a caption layout (its band captions are its starting text)', () => {
    storesFor({ id: 'caption', canvasOnly: true, canvasHeader: { enabled: true, bgColor: '#ffffff', height: 140 },
      defaultCaptions: [{ id: 'h', text: 'TOP TEXT', isHeaderCaption: true }] });
    renderIn(<ImageStartPrompt onPhoto={() => {}} />);
    expect(screen.getByRole('group', { name: 'Start your meme' })).toBeTruthy();
  });

  it('goes away on a caption layout once text is added to the picture', () => {
    storesFor({ id: 'caption', canvasOnly: true, canvasHeader: { enabled: true, bgColor: '#000000', height: 170 },
      defaultCaptions: [{ id: 'h', text: 'TOP TEXT', isHeaderCaption: true }] });
    renderIn(<ImageStartPrompt onPhoto={() => {}} />);
    expect(screen.getByRole('group', { name: 'Start your meme' })).toBeTruthy();
    const captions = doc.getState().captions as unknown[];
    act(() => doc.setState({ captions: [...captions, { id: 'cap-new', text: 'MORE', x: 0.5, y: 0.5 }] }));
    expect(screen.queryByRole('group', { name: 'Start your meme' })).toBeNull();
  });

  it('goes away on a caption layout once its bar caption is dragged onto the picture', () => {
    storesFor({ id: 'caption', canvasOnly: true, canvasHeader: { enabled: true, bgColor: '#000000', height: 170 },
      defaultCaptions: [{ id: 'h', text: 'TOP TEXT', isHeaderCaption: true }] });
    renderIn(<ImageStartPrompt onPhoto={() => {}} />);
    expect(screen.getByRole('group', { name: 'Start your meme' })).toBeTruthy();
    const moved = (doc.getState().captions as AnyState[]).map((c) => ({ ...c, y: 0.5, hasCustomPos: true }));
    act(() => doc.setState({ captions: moved }));
    expect(screen.queryByRole('group', { name: 'Start your meme' })).toBeNull();
  });

  it('is not shown on a multi-panel canvas (its panels have their own cards)', () => {
    storesFor({ id: 'grid', canvasOnly: true, isNativeLayout: true, layoutDef: { id: '2-vert', slots: 2 }, slotImages: [null, null], defaultCaptions: [] });
    renderIn(<ImageStartPrompt onPhoto={() => {}} />);
    expect(screen.queryByRole('group')).toBeNull();
  });

  it('adds a caption in the middle of an empty blank canvas, selected, and goes', () => {
    storesFor({ id: 'blank', canvasOnly: true, canvasBgColor: '#ffffff', defaultCaptions: [] });
    renderIn(<ImageStartPrompt onPhoto={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Text' }));
    const caps = doc.getState().captions as AnyState[];
    expect(caps).toHaveLength(1);
    expect(caps[0]).toMatchObject({ x: 0.5, y: 0.5, width: 0.25, hasCustomWidth: true });
    expect(doc.getState().activeLayerId).toBe(caps[0].id);
    expect(screen.queryByRole('group', { name: 'Start your meme' })).toBeNull();
  });

  it('is not shown on a template picture', () => {
    storesFor({ id: 'drake', imageUrl: 'drake.jpg' });
    renderIn(<ImageStartPrompt onPhoto={() => {}} />);
    expect(screen.queryByRole('group')).toBeNull();
  });
});
