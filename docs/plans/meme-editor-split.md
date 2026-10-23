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
2. **Create the store.** *Done:* MemeEditor.jsx is down to 7,613 lines.
   - `editor/store/useMemeEditorStore.js` holds the 16 document fields, with setters that work like `useState` setters.
   - Each editor gets its own store through React context, so templates and tests never share state.
   - Undo/redo now runs on zundo, but **keeps the existing checkpoints**. zundo's automatic recording is paused, and the 62 `pushHistory()` calls still decide what counts as one step. zundo holds the stacks and applies undo/redo. This replaced `useMemeHistory`, `buildInitialSnapshot` and `applySnapshot`, and `pushHistory()` no longer takes arguments because it snapshots the store.
   - Handlers stay in the component for now. They move out with the panels in phases 3–4, where they can go into hooks or store actions together with the JSX that uses them.
   - Fixed along the way:
     - Undoing back to the start used to restore a slightly different meme (font size 45 instead of 50, new caption IDs, missing panel captions). It now restores the exact starting state.
     - Undo now also restores the face-swap "original" image link along with the image.
     - Undo/redo cancels a pending typing checkpoint, so it can no longer wipe out redo a moment later.
   - Known, unchanged: the compact "Flip Canvas" button doesn't save a checkpoint, so its flip lands in the next undo step. Ctrl+Z inside a text box is the browser's own text undo.
3. **Extract hooks.** *Done:* MemeEditor.jsx is down to 6,973 lines.
   - `editor/hooks/`:
     - `useEditorShortcuts`: keyboard and paste. The pure `getShortcutCommand` has its own tests.
     - `useExport`: format/quality presets, download, copy, share, save to gallery.
     - `useBackgroundRemoval`
     - `useFaceMorph`
   - New store action `nudgeLayer`, plus `useMemeEditorStoreApi()` for reading fresh state in async code.
   - Fixed along the way:
     - Arrow keys used to move a layer by 1 (or 10) *canvas widths*, because positions are 0..1 fractions. Nudges are now 0.5% (5% with Shift).
     - Background removal applies its result by layer ID to the latest state. Before, a different selection or other edits made during the multi-second removal could be overwritten.
   - Not tested by hand: an actual face swap, which needs `face_swap_server.py` and its model. The modal and its "server offline" path were checked.
4. **Extract panels, one per commit.** *Done:* 26 components and 27 commits. MemeEditor.jsx is down to 2,045 lines, and its JSX is about 400 lines of layout.
   - `editor/top-bar/`: EditorTopBar
   - `editor/tabs/`: CanvasTab, DrawTab, MediaTab, FiltersTab, TextTab, plus `text/` TextToolbar and CaptionStyleControls
   - `editor/social-cards/`: Chyron, Tweet, Instagram and WhatsApp card editors
   - `editor/context-toolbars/`: ContextToolbar (CaptionToolbar, StickerToolbar, ImageLayerToolbar, FaceMorphToolbar, TabQuickTools) and SecondaryToolbar (`secondary/` LayerActionsBar, DrawSettingsBar, WatermarkBar, HeaderFooterBar)
   - `editor/EditorSidebar.jsx`, `editor/EditorModals.jsx`
   - Each panel reads store fields itself and gets everything else as props.
   - The split was done with an AST tool that finds the variables each JSX block uses. Every step was checked with a parse, lint (no new unused or undefined names) and the editor tests before committing.
   - Still above ~600 lines:
     - `SecondaryToolbar` (747): its animated submenus must stay direct children of one `AnimatePresence`.
     - `CaptionToolbar` (608)
   - Long prop lists point to shared UI state (active tab/submenu, which modal is open) that should become a small UI store: `EditorSidebar` has 58 props, `EditorModals` 43, `ContextToolbar` 41.
   - Found and removed: nothing ever opened the full-screen export page (`setIsExportModalOpen(true)` was never called), so `ExportPage`, its format/quality presets in `useExport` and its CSS were deleted (about 500 lines). This also fixed Save to Gallery naming the first save "My Meme": the name is now passed to the menu action instead of read from state set a moment earlier.
   - Still in MemeEditor: about 1,550 lines of handlers (captions, layers, bubbles, social cards, header/footer) and the `<CanvasEditor>` call (phase 6).
5. **Move handlers out and add a UI store.** *Done:* MemeEditor.jsx is down to 635 lines, from 2,045.
   - `editor/store/useEditorUiStore.js`: a per-editor store for shared UI state:
     - active tab and submenu
     - open menus and modals
     - brush settings
     - pending media and the paste toast
     - the watermark, saved through a store subscription
   - Handler hooks in `editor/hooks/`: `useCaptionActions`, `useLayerActions`, `useSocialCardActions`, `useBubbleActions`, `useCanvasFrameActions`, `useDrawingActions`. Each reads the stores itself and takes at most four arguments (derived selection values or other hooks' handlers). Helpers used only inside a hook stay private.
   - Panels now read store-backed values directly instead of receiving them as props. A tool rehomed them top-down: MemeEditor → sidebar/toolbars/modals → tabs/submenus. For example, EditorSidebar went from 58 props to 39, and EditorModals from 43 to 27.
   - What's still passed as props: handlers, plus derived values like `activeCaption` / `activeSticker` / `isElementSelected`. A `useActiveLayers()` hook would remove most of the derived ones.
6. **Remove duplicate UI (desktop fix).** *Done.* Desktop showed both UIs at once: a cramped side panel and the phone toolbars, in the top-left of a large, mostly empty screen.
   - Desktop now uses the phone layout. The tab dock stays compact at every width, the `<=900px` editor layout rules in App.css apply everywhere, and the fixed 370px desktop sidebar rule in MemeEditor.css is gone. The canvas, toolbars and dock are centered and scale with the screen (e.g. a 1080x720 canvas at 1920x1080).
   - Desktop-only features moved into the phone toolbars first:
     - Curved Text and Quick Phrases (text quick tools, plus a phrases submenu)
     - undo last stroke
     - watermark logo upload
     - face-morph intensity slider
   - The video trimmer moved to EditorModals.
   - The Canvas Color submenu now keeps the header/footer background and text contrast in sync, and the Canvas flip records an undo step.
   - Deleted `editor/tabs/`, `editor/social-cards/` and CanvasColorPicker, about 2,700 lines. The chyron editor was dead: nothing creates breaking-news captions.
   - Only on the old desktop panel and not ported: switching an image layer back to stretch fit. The phone crop toggle switches between crop and fit.

7. **Point `CanvasEditor` at the store.** *Done.* The call was ~100 lines but only 36 props.
   - CanvasEditor now reads 19 store-backed values itself:
     - meme data: captions, stickers, layers, slots, header/footer, drawings, flip, filters, template
     - UI state: watermark, brush, draw tool
   - Three props it ignored were dropped: `isVideoPlaying`, `onUpdateCanvasHeader`, `onUpdateCanvasFooter`.
   - The inline bounds/text callbacks became the store actions `patchLayer` and `updateCaptionText` (both tested). It now takes 13 props: the ref, derived values (compare-mode image, drawing mode), template layout info and event callbacks.
   - The editor tests' CanvasEditor stub reads the same store values, so they still check what the canvas renders from.

## Next: split `CanvasEditor.jsx` (5,300 lines)

It draws with the **plain canvas 2D API** (`getContext('2d')`), not Konva; Konva is only used by the video editor. Today it has two halves:

| Lines | What |
|---|---|
| 1–2014 | ~50 pure drawing functions, no React: `wrapText`, `drawCurvedText`, `drawSpeechBubble` (172), `drawBreakingNewsChyron`, the tweet card (163), Instagram card (322), WhatsApp card + icons + doodle pattern (~690), die-cut rendering (~120), SVG paths, `TWEET_TREND_PRESETS` |
| 2015–5304 | the component: 25 refs, 10 effects, **one render effect of 1,287 lines** that draws the whole scene, pointer handlers (down 575, move 500, hover cursor 236, end 46, wheel 41), and 108 lines of JSX |

Phases, each its own commit with the same checks (tests, lint baseline, build, browser):

8. **Move the pure drawing functions out.** *Done:* CanvasEditor.jsx is down to 3,306 lines, from 5,300.
   - 10 modules in `src/components/canvas/draw/`:
     - `text.js` (233 lines): wrap, curved text, effects, round rect
     - `speechBubble.js` (175)
     - `chyron.js` (60)
     - `paths.js` (25)
     - `faceLighting.js` (36)
     - `dieCut.js` (119)
     - `socialCards/shared.js` (61): image cache, like-count parsing, shared icons
     - `socialCards/tweet.js` (267), `socialCards/instagram.js` (356), `socialCards/whatsapp.js` (696)
   - Moved verbatim by an AST tool that also wrote each module's imports. The dependency graph has no cycles, and caches stay private to their module.
   - `draw.test.js` covers `wrapText` (with a fake `measureText`), `getCurveSagitta`, `getBreakingNewsHeight`, `parseLikesCount` and `parseTweetMetrics`. The existing WhatsApp layout test now imports from the new module.
   - Checked in the browser:
     - captions and curved text
     - a speech bubble
     - a die-cut sticker
     - tweet, Instagram and WhatsApp cards
     - face swap (face-lighting sampler)

     The chyron can't be created in the app, so only its unit test covers it.
9. **Split the render effect.** *Done:* CanvasEditor.jsx is down to 2,025 lines, from 3,306.
   - The 1,287-line effect is now `renderScene(scene)` in `src/components/canvas/render/` (217 lines). It attaches the face-morph helpers, then `renderCanvas` runs the painters in drawing order:
     1. `getImageArea`
     2. `paintBase`: base image or multi-panel slots
     3. `paintHeaderFooter`
     4. `paintLayers`: a z-ordered loop that calls `paintImageLayer` (227), `paintSticker` (95) and `paintCaption` (300)
     5. `paintDrawings`
     6. `paintWatermark`
     7. `paintOverlays`: global-filter composite, selection handles, snapping guides
   - `handles.js` holds the selection-UI drawers. The unused `drawRoundHandle` was dropped.
   - Done in three commits by AST tools that worked out each painter's inputs:
     - Nothing a painter reads is reassigned.
     - The only outer variable written, the active layer's handle drawer, is returned by `paintLayers`. Inside it, the per-type painters set it through `setActiveHandleDrawer`, so early returns still behave.
     - The effect keeps its exact dependency list.
   - Checked in the browser on one meme combining:
     - header/footer, an image layer, an emoji sticker with handles
     - an iPhone bubble, curved text, a drawing
     - a watermark, and a whole-meme black-and-white filter

     Also checked: a 2×2 multi-panel layout. No errors. Snapping guides only show mid-drag and weren't captured.
   - Still to do: unit tests with a recording fake context. The painters now take plain inputs, so this is feasible.
10. **Extract interaction** into `useCanvasInteraction`: hit testing as pure functions (`hitTestLayer`, `hitTestHandle`) with unit tests, plus the drag/resize/rotate/draw state machine behind the pointer handlers. The arrow-key nudge bug from phase 3 came from the 0..1 coordinate convention, so the hit-test tests should pin those units down.
11. **Afterwards:** CanvasEditor should be a ~300-line component that wires the canvas element, refs, `renderScene` and `useCanvasInteraction`.

CSS (`MemeEditor.css`, 2,076 lines) gets split along with the components in phase 4. It is redesigned in the separate design-system step.

## Safety net (phase 0, done)

`src/components/MemeEditor.test.jsx` replaces `CanvasEditor` with a stub that records its props. The tests check what MemeEditor *sends* to the canvas: default and template captions, add caption, edit text, undo/redo, delete with undo, unique IDs, every sidebar tab, draw mode, drawings with undo, and canvas flip. I checked them by breaking undo and caption creation, and four tests failed as expected.

The tests can't see canvas rendering, export, AI, or real device layout. Before merging each phase, run `npm run dev` and check by hand:

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
