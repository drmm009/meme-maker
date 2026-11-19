// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, act, within } from '@testing-library/react';
import type { ReactElement } from 'react';
import ImagePanelPrompts from './ImagePanelPrompts';
import { createMemeEditorStore, MemeEditorStoreContext } from './store/useMemeEditorStore';
import { createEditorUiStore, EditorUiStoreContext } from './store/useEditorUiStore';

type AnyState = Record<string, unknown>;
type Api = { getState: () => AnyState; setState: (s: AnyState) => void };
let doc: Api;
let ui: Api;

// A grid from Choose Canvas Layout: real panels, all empty.
const gridTemplate = (layoutDef: AnyState) => ({
  id: 'grid', isNativeLayout: true, layoutDef, slotImages: Array((layoutDef.slots as number)).fill(null), defaultCaptions: [], canvasBgColor: '#ffffff',
});
const renderGrid = (layoutDef: AnyState, onPhoto?: (e: unknown) => void) => {
  const t = gridTemplate(layoutDef);
  doc = createMemeEditorStore(t) as unknown as Api;
  ui = createEditorUiStore(t) as unknown as Api;
  const el: ReactElement = <ImagePanelPrompts layoutDef={layoutDef as never} onPhoto={onPhoto as never} />;
  return render(
    <MemeEditorStoreContext.Provider value={doc as never}>
      <EditorUiStoreContext.Provider value={ui as never}>{el}</EditorUiStoreContext.Provider>
    </MemeEditorStoreContext.Provider>,
  );
};

beforeEach(() => cleanup());
afterEach(cleanup);

describe('ImagePanelPrompts', () => {
  it('puts a small start card in each panel of a 2-panel grid: Add photo, then Text and Templates', () => {
    renderGrid({ id: '2-vert', slots: 2 });
    const cards = screen.getAllByRole('group', { name: /^Panel \d$/ });
    expect(cards).toHaveLength(2);
    expect([...cards[0].querySelectorAll('button')].map((b) => b.textContent?.trim())).toEqual(['Add photo', 'Text', 'Templates']);
  });

  it('shows no cards on a grid of more than 4 panels', () => {
    renderGrid({ id: 'custom-grid', slots: 6, cols: 3, rows: 2 });
    expect(screen.queryAllByRole('group')).toHaveLength(0);
  });

  it('adds text in the middle of its panel, and that panel\'s card goes', () => {
    renderGrid({ id: '2-vert', slots: 2 });
    fireEvent.click(within(screen.getByRole('group', { name: 'Panel 2' })).getByRole('button', { name: 'Text' }));
    const caps = doc.getState().captions as { x: number; y: number }[];
    expect(caps).toHaveLength(1);
    expect(caps[0]).toMatchObject({ x: 0.5, y: 0.75 });
    expect(screen.getAllByRole('group', { name: /^Panel \d$/ }).map((g) => g.getAttribute('aria-label'))).toEqual(['Panel 1']);
  });

  it('opens Templates for its panel, and a filled panel loses its card', () => {
    renderGrid({ id: '4-grid', slots: 4 });
    fireEvent.click(within(screen.getByRole('group', { name: 'Panel 3' })).getByRole('button', { name: 'Templates' }));
    expect(ui.getState().sheet).toBe('templates');
    expect(ui.getState().panelTarget).toBe(2);
    act(() => ui.setState({ sheet: null }));
    act(() => doc.setState({ slotImages: [null, null, 'pic.png', null] }));
    expect(screen.getAllByRole('group', { name: /^Panel \d$/ })).toHaveLength(3);
  });

  it("sends a chosen photo to the editor's upload with its panel as the target", () => {
    const onPhoto = vi.fn();
    renderGrid({ id: '2-vert', slots: 2 }, onPhoto);
    const card = screen.getByRole('group', { name: 'Panel 2' });
    const input = card.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['x'], 'a.png', { type: 'image/png' })] } });
    expect(ui.getState().panelTarget).toBe(1);
    expect(onPhoto).toHaveBeenCalledTimes(1);
  });

  it("hides a panel's card once a photo layer sits in it", () => {
    renderGrid({ id: '2-vert', slots: 2 });
    act(() => doc.setState({ imageLayers: [{ id: 'img-1', url: 'a.png', x: 0.5, y: 0.25 }] }));
    expect(screen.getAllByRole('group', { name: /^Panel \d$/ }).map((g) => g.getAttribute('aria-label'))).toEqual(['Panel 2']);
  });

  it("hides a panel's card as a sticker or text is moved into it, and brings it back when moved out", () => {
    renderGrid({ id: '2-vert', slots: 2 });
    const names = () => screen.queryAllByRole('group', { name: /^Panel \d$/ }).map((g) => g.getAttribute('aria-label'));
    act(() => doc.setState({ stickers: [{ id: 's', url: 's.png', x: 0.5, y: 0.75 }] }));
    expect(names()).toEqual(['Panel 1']);
    act(() => doc.setState({ stickers: [], captions: [{ id: 'c', text: 'HI', x: 0.5, y: 0.25 }] }));
    expect(names()).toEqual(['Panel 2']);
    act(() => doc.setState({ captions: [] }));
    expect(names()).toEqual(['Panel 1', 'Panel 2']);
  });
});
