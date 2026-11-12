# Prompt for Gemini: UI work on the maker pages

Paste everything below the line into Gemini.

---

You're continuing UI work on **Meme Creator Studio**, a browser-first meme maker (React 19 + Vite 8, canvas-2D editor, PWA, wrapped for Android with Capacitor, no backend). The repo is the current folder, on branch `feat/editor-easy-round`.

I want to change the UI of the four **focused maker pages**: AI Meme, Stickers, Face Swap and Social Card. I'll tell you what to change, one page at a time. Before you edit anything, read what's below and the files it points to. If a request is unclear, ask me rather than guess.

## Read first

1. `CLAUDE.md`: project rules (commands, map, conventions). Follow it.
2. `docs/architecture.md`, the line starting with `src/components/editor/editorModes.ts`. It describes all four makers in detail. Read only that line and any other section for a file you touch.

## How the maker pages work

They aren't separate pages. Each one is the **same image editor** in a different **mode**:

- **`src/components/editor/editorModes.ts`**: the modes (`full`, `sticker`, `ai`, `faceswap`, `social`). For each mode it sets the top-bar title, which dock tabs show (`dock`) and the starting tab (`startTab`).
- **`src/components/editor/store/useEditorUiStore.js`**: the UI state.
  - `mode`, `dockTab`, and `sheet` (the open bottom sheet).
  - `SHEET_TAB` maps each sheet to its dock tab.
  - `buildInitialUi` decides what's open at the start: Social Card opens its `card` sheet, AI Meme opens its `aiMeme` sheet.
  - `openSheet` keeps a maker on its own tab when a sheet belongs to a tab that isn't in its dock.
- **`src/components/editor/panels/EditorPanels.tsx`**: the bottom of the editor.
  - `DOCK` lists the dock buttons. `SHEETS` maps sheet names to components. `FULL_SHEETS` lists the full-height sheets.
  - It picks which strip (the row of tool buttons above the dock) shows for `dockTab`.
  - When a layer is selected, its layer toolbar replaces the strip. In Stickers mode, a selected photo keeps the strip.
- **`src/components/editor/makers.ts`**: each maker's starting template and its link (`#/stickers`, `#/ai-meme`, `#/face-swap`, `#/social-card`). The PWA's home-screen shortcuts in `vite.config.js` use the same links, and a test checks they match.
- **`src/components/MemeEditor.jsx`**: wiring only.
  - It builds the `actions` object the panels use (`handleGenerateSticker`, `handleStickerDieCut`, `handleChangeMeme`, …).
  - `changeMeme` starts a fresh session on another template in the same mode.

### Each page's own files

| Page | Strip / sheets | Logic |
|---|---|---|
| **Stickers** | `panels/StickerStrip.tsx`, whose buttons grow with the sticker: Upload, Gallery and Text; then Crop and Effects once there's a photo; then Die-cut, Crop, Text, Effects and New once it's cut out. The dock (in `EditorPanels.tsx`) has **Generate Sticker**, then **Export** and **Full editor**. An empty canvas shows `StickerStart.tsx`. | `hooks/useStickerMaker.ts`, `stickerMaker.ts`. The canvas is see-through and shown on a checkerboard (`.canvas-wrapper--sticker` in `MemeEditor.css`). |
| **AI Meme** | `panels/AiStrip.tsx`, and `panels/AiMemeSheet.tsx` + `panels/aiMeme.css`. The sheet is a full-height prompt screen: template rail, "What's it about?", theme chips, Generate captions, 4 caption previews, and the Gemini key line. | `aiMeme.ts`. Captions come from `src/data/aiMemeCaptions.js` (`GEMINI_MODEL`, with the key sent in a header). |
| **Face Swap** | `panels/FaceSwapStrip.tsx` (Your face, Meme), and `MemePickerSheet` in `panels/TemplatesSheet.tsx`. The face picker is `src/components/FaceMorphModal.jsx` + `.css`. | The effect in `MemeEditor.jsx` opens the picker when the page starts. The swap needs `face_swap_server.py` running locally, so it shows "offline" without it. |
| **Social Card** | `panels/CardStrip.tsx` (Details, Look, Studio), `panels/CardFormSheet.tsx` + `panels/cardForm.css` (the Details form, plus `CardLookSheet`), and `panels/CardControls.tsx`. | `panels/socialCard.ts` (`useCard`). Studio opens the old full-screen `MemeStylesModal.jsx`. |

All paths in the table are under `src/components/editor/` unless they start with `src/`.

Shared UI kit: `src/components/ui/` (`Sheet`, `ToolStrip`, `ToolDock`, `SegmentedControl`, `Section`, `Row`, `Tile`, …). Sheet styles live in `panels/panels.css` and `panels/browseSheet.css`. Theme tokens are in `src/styles/theme.css`. The look is dark: grey surfaces (`--ui-surface` #1c1c1e), an orange accent (`--ui-accent`), and bold 800-weight headings.

## Gotchas we already hit

- **Every sheet button becomes a pill.** `panels.css` has a rule, `.ie-panels--sheet button:not(...)`, that forces `border-radius: 9999px !important` with very high specificity. For a button that shouldn't be round, add its class to that `:not(...)` list. A local `!important` loses.
- **`App.css` sets every `h3` on a phone to `1.15rem !important`.** Give your heading a `font-size` with `!important`, or use a non-heading element.
- **A full-height sheet** needs its name in `FULL_SHEETS`, plus `height: 100%` and a scrolling body.
- **Every new sheet needs an entry in `SHEET_TAB`**, or opening it switches the dock tab.
- **Write new code in TypeScript**, keep plain CSS next to components, and **match the comment style**: short plain-English comments saying what the code is for.
- **Heavy libraries stay lazy** (background removal, MediaPipe, FFmpeg). Never import them eagerly.
- **Never hardcode API keys.** Gemini keys are user-supplied and kept in localStorage under `gemini_api_key`.

## Rules

- **Don't touch:** `android/`, `_old/`, `.agents/`, `design-preview/` and `penpot-design-pack/`.
- **Git:** don't push or deploy.
  - Commit only when I ask, and stage explicit paths only (never `git add -A`).
  - Keep these untracked folders out of commits: `.agents`, `.claude`, `.codex`, `.github/*`, `scratch`, and `docs/prompts/`.
- **After every change, run all four checks** and fix anything that fails:
  - `npm test` (Vitest)
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
- **Tests:** the maker tests are in `src/components/MemeEditor.test.jsx` (search for "Stickers maker", "AI Meme maker", "Face Swap maker", "Social Card maker"), `hooks/useStickerMaker.test.jsx`, `store/useEditorUiStore.test.js` and `makers.test.ts`. If you change button labels or order, update the tests to match. Don't delete a test to make it pass.
- **Docs:** when a page's behaviour or layout changes, update its part of the `editorModes.ts` line in `docs/architecture.md`.
- **Check it visually:** run `npm run dev` (http://localhost:5173) and look at the page at phone width (375×812).
  - Open a page directly with `http://localhost:5173/#/stickers` (or `#/ai-meme`, `#/face-swap`, `#/social-card`).
  - Testing saves drafts to IndexedDB (`meme-creator-image` → `drafts`, keys `current-<mode>`). Delete the ones you made when you're done.

## State when you start

- The last commit is `94d92f2`, the Stickers redesign. It added the one Generate Sticker dock button, the two-stage strip, and the canvas fix that redraws newly loaded pictures from the current scene (`latest` in `CanvasEditor.jsx` / `renderScene.js`). The working tree is clean apart from the untracked folders listed above.

Start by reading `CLAUDE.md`, the `editorModes.ts` line in `docs/architecture.md`, and the files for the page I name. Then tell me in a few lines how that page is put together, and wait for my changes.
