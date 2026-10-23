# Plan: split `MemeEditor.jsx`

Status: proposed (2026-10-23). No code changed yet.

## Where it stands

`src/components/MemeEditor.jsx` is 8,084 lines, one component:

| Lines | What |
|---|---|
| 1–232 | imports, `XSocialLogo`, `TEXT_EFFECTS`, `CanvasColorPicker`, animation variants |
| 233–2776 | logic: **63 `useState`**, 14 `useEffect`, 10 `useRef`, ~75 handlers |
| 2777–8084 | one `return (...)`: ~5,300 lines of JSX |

The JSX contains:
- Export panel (2812–2942) and editor top bar (2943–3124)
- `<CanvasEditor>` with **~100 props** (3176–3276)
- Context toolbars under the canvas, which depend on what's selected: text, sticker, image, face-morph (3144–5181)
- Compact tab tools: text, images, draw, canvas, filters (5182–5521)
- Sidebar tab panels: canvas/watermark, draw, text (1,600 lines incl. tweet / Instagram / WhatsApp / chyron card editors), media, filters (5522–7970)
- Bottom sheets and modals (7972–8084)

The state falls into two kinds:
- **Document state**, what the meme *is*: `captions`, `stickers`, `imageLayers`, `drawings`, `canvasHeader`, `canvasFooter`, `demotivational`, `canvasFlipX`, `activeTemplate`, `templateFaceMorph`, `slotImages`, `slotTransforms`, `aspectRatio`, `canvasBgColor`, `imageFilters`, `watermark`, `activeLayerId`. Undo/redo snapshots these by hand (`pushHistory` / `applySnapshot` with `useMemeHistory`).
- **UI state**, what's open: about 30 `show*Menu` / `show*Modal` / `isExportModalOpen` / `export*` flags, `activeTab`, `activeSubmenu`, toasts.

**Risk:** there are no tests for MemeEditor, and `CanvasEditor` (5,300 lines) depends on all of it through props.

## Target shape

```
src/components/editor/
  MemeEditor.jsx              ← layout shell only, target < 300 lines
  constants.js                ← TEXT_EFFECTS, variants, isSocialCardCaption…
  store/useMemeEditorStore.js ← zustand + zundo (same pattern as useVideoEditorStore)
  hooks/useExport.js          ← quick export, copy, share, file size
  hooks/useBackgroundRemoval.js
  hooks/useFaceMorph.js       ← morph / pinpoint / revert / finalize
  hooks/useEditorShortcuts.js ← keyboard + paste listeners
  top-bar/EditorTopBar.jsx, ExportPanel.jsx
  context-toolbars/TextToolbar.jsx, StickerToolbar.jsx, ImageToolbar.jsx, FaceMorphToolbar.jsx
  tabs/TextTab.jsx, MediaTab.jsx, DrawTab.jsx, CanvasTab.jsx, FiltersTab.jsx
  tabs/text/CaptionStyleControls.jsx, QuickPhrases.jsx
  social-cards/TweetCardEditor.jsx, InstagramCardEditor.jsx, WhatsAppCardEditor.jsx, ChyronEditor.jsx
  EditorModals.jsx            ← bottom sheets + AI / styles / face-morph modals
```

Rules:
- Document state and its actions live in the store. Components read only the slices they need: `useMemeEditorStore(s => s.captions)`.
- UI state stays local to the component that owns it. The store only gets what several panels share, like `activeTab` and `activeLayerId`.
- Async or DOM-heavy work (export, background removal, face morph) goes in hooks, not store actions.
- Undo/redo uses zundo's `temporal` with `partialize` set to the document fields. This replaces the hand-written snapshot code. The debounced push used while dragging and typing becomes zundo's `handleSet` throttle.

## Phases

Each phase is its own commit. After each one, `npm test`, `npm run lint` and `npm run build` must pass, and you check the app by hand in the browser.

0. **Safety net.**
   - Add `MemeEditor.test.jsx` covering: renders with a template, add caption, edit its text, add sticker, undo, redo, switch each tab.
   - Add a manual checklist covering export PNG, a social card, face morph, background removal and the mobile layout.
1. **Move constants and pure helpers out.** *Done:* MemeEditor.jsx went from 8,084 to 7,880 lines.
   - `editor/constants.jsx`: `TEXT_EFFECTS` (it contains JSX, hence `.jsx`) and `secondaryVariants`
   - `editor/CanvasColorPicker.jsx`
   - `editor/memeEditorUtils.js`: `isSocialCardCaption`, `getContrastStroke`, `isVideoUrl`, `cleanTemplateName`
   - Deleted `XSocialLogo`: it was exported but nothing used it.
2. **Create the store.**
   - Move document state and its handlers (captions, layers, stickers, header/footer, social cards, drawing) into `useMemeEditorStore`.
   - Replace `pushHistory` / `applySnapshot` with zundo.
   - MemeEditor still renders the same JSX, just reading from the store.
   - This is the riskiest phase, so it gets the most manual testing.
3. **Extract hooks:** `useExport`, `useBackgroundRemoval`, `useFaceMorph`, `useEditorShortcuts`.
4. **Extract panels, one per commit,** smallest first: ExportPanel → EditorTopBar → CanvasTab → DrawTab → FiltersTab → MediaTab → context toolbars → social-card editors → TextTab → EditorModals. Once the store exists, each panel is mostly cut-and-paste plus a store selector.
5. **Remove duplicate UI.** The compact tab tools (5182–5521) and the sidebar tabs (5522–7970) seem to repeat the same controls, probably one set for mobile and one for desktop. Check which is which, then build both from shared components.
6. **Point `CanvasEditor` at the store** instead of passing ~100 props, then plan its own split the same way.

CSS (`MemeEditor.css`, 2,076 lines) gets split along with the components in phase 4. It is redesigned in the separate design-system step.

## Safety net (phase 0, done)

`src/components/MemeEditor.test.jsx` replaces `CanvasEditor` with a stub that records its props. The tests check what MemeEditor *sends* to the canvas: default and template captions, add caption, edit text, undo/redo, delete with undo, unique IDs, every sidebar tab, draw mode, drawings with undo, and canvas flip. I checked them by breaking undo and caption creation, and four tests failed as expected.

The tests can't see Konva rendering, export, AI, or real device layout. Before merging each phase, run `npm run dev` and check by hand:

- [ ] Open a template from the discovery screen. The image and TOP/BOTTOM text show.
- [ ] Drag, resize and rotate a caption. Edit its text, font, color, background and effect.
- [ ] Add an emoji sticker and a meme sticker. Duplicate one, reorder layers, delete one.
- [ ] Add an image layer and remove its background (Magic Eraser).
- [ ] Draw with brush, marker and glow. Undo a stroke, then clear all.
- [ ] Toggle header, footer and both. Try a demotivational template.
- [ ] Add a tweet card, an Instagram card and a WhatsApp card, and edit their fields.
- [ ] Do a face swap: accept it, then revert it.
- [ ] Undo/redo across several kinds of edits, including Ctrl+Z / Ctrl+Y.
- [ ] Export PNG and JPG, copy to clipboard, save to gallery.
- [ ] Check the phone layout (DevTools ~390px wide): the dock folds and unfolds, and the bottom sheets open.

## Done when
- `MemeEditor.jsx` is under 300 lines and no file in `editor/` is over about 600.
- Undo/redo behaves as before. The editor has tests, and they pass in CI.
- No visible change in the app. This is a refactor, not a redesign.
