# Finish the image editor's "easy round" (for Gemini)

You are continuing work on **Meme Creator Studio**, a browser-first meme maker (React 19 + Vite 8,
canvas-2D image editor, no backend). The repository is at
`C:\Users\jigar\.gemini\antigravity-ide\scratch\meme-maker`.

## Before you start

1. Read `CLAUDE.md` (short) and, in `docs/architecture.md`, only the image editor section
   (`src/components/MemeEditor.jsx` ... `CanvasEditor.jsx`). Read more only where you work.
2. You are on branch **`feat/editor-easy-round`**. It is 7 commits ahead of `main`, nothing is
   uncommitted, and everything passes: `npm test` (589 tests), `npm run typecheck`, `npm run lint`
   (0 warnings in `src/`), `npm run build`. Check with `git status` and `git log --oneline main..HEAD`
   that this is still true before changing anything; if it isn't, stop and report.
3. Already done on this branch (don't redo them): caption outline colour, Hindi/Gujarati fonts,
   caption blur on Safari, Canvas > Grid guides, gradient canvas backgrounds, "Keep shape" for
   photo layers, adding pictures by drag-and-drop / pasted link / Media > Link.

## Rules

- New code in TypeScript (`.ts` / `.tsx`, strict). Match the surrounding code: its naming, its
  comment style (short comments saying *why*, in plain English), plain CSS next to components,
  the UI kit in `src/components/ui/` (`Sheet`, `Section`, `Row`, `Switch`, `SegmentedControl`, ...).
- New UI goes into panels under `src/components/editor/`, not into `MemeEditor.jsx`. Edit handlers
  reach panels through the `actions` object built in `MemeEditor.jsx`.
- Document edits go through the editor store (`useMemeEditorStore`): `patchLayer(key, id, patch)`
  for one layer (records an undo step after a short pause), `pushHistory()` for an immediate one.
- Every feature gets tests. Unit-test pure logic in a `*.test.ts` next to it; test the UI in
  `src/components/MemeEditor.test.jsx` (it stubs the canvas: `canvas.props` holds what the editor
  passed it; see the existing tests for `sheet('...')`, `strip('...')`, `layerToolbar()` helpers).
  Vitest runs with `isolate: false`: a test file that mocks a module another file also loads must
  call `vi.resetModules()` and import with `await import()`.
- After each feature run `npm test`, `npm run typecheck` and `npm run lint`; all must pass with no
  new warnings. Then check it in the browser: `npm run dev` (http://localhost:5173), open a
  template (e.g. "Drake Approving"), at a phone-sized window (375 x 812).
- Commit each feature on its own, staging **explicit paths only** (never `git add -A` / `.`).
  Message style, as in `git log`: `feat: <what the user can now do>` or `fix: ...`, then a short
  body saying what changed and why, lines under ~76 characters.
- **Do not push, deploy (`npm run deploy`), or touch the `android/` project.** Don't edit files
  unrelated to the task, `_old/`, `.agents/`, `design-preview/` or `penpot-design-pack/`.
- Saved data carries a format version. Adding an optional field is fine without a version bump;
  renaming or removing one is not (see CLAUDE.md).

## Task 1: Rename layers

Today the Layers sheet shows "Image 1", the sticker's emoji/name, or the caption's text, and
shapes as "Arrow", "Circle", ... There is no way to name a layer.

- Add an optional `layerName?: string` to `MemeLayerBase` in `src/model/memeDocument.ts`.
  Do **not** reuse `name`: stickers already use `name` for the sticker's own name.
  Shapes and censor regions (in the `drawings` array) take the same optional `layerName`.
- `src/components/editor/panels/layerRows.ts`: a row's `label` is `layerName` when set (trimmed,
  non-empty), else what it is today. Same in `drawingRows`.
- `src/components/editor/panels/LayersSheet.tsx`: each row (layers and shapes, not in Select mode)
  gets a small rename button (lucide `Pencil`, `aria-label="Rename <label>"`). It turns the row's
  label into an input (`aria-label="New name for <label>"`, autofocus, current name selected).
  Enter or blur saves, Escape cancels; saving an empty name clears `layerName` (back to the
  automatic label). Save with `patchLayer(row.key, row.id, { layerName })`; for shapes the key is
  `'drawings'`. Copy the look of the rename in `src/components/editor/library/LibrarySheet.tsx`
  (`.ie-saved-rename`) so the two feel the same; CSS goes in `panels/panels.css`.
- The Media sheet's chips (`panels/MediaSheet.tsx`, "Image 1", emoji...) also show `layerName`
  when set.
- Tests: extend `src/components/editor/panels/layerRows.test.ts` (custom name wins, blank name
  falls back), and add a `MemeEditor.test.jsx` test: open Layers from a caption's floating
  toolbar, rename "TOP TEXT" to "Punchline", see "Punchline" in the list, undo brings the old
  label back.

## Task 2: Keyboard shortcuts list

The editor already has shortcuts (`src/components/editor/hooks/useEditorShortcuts.js`,
`getShortcutCommand`), but nothing in the app lists them. The real ones are exactly:

| Keys | Does |
|---|---|
| Ctrl/⌘ + Z | Undo |
| Ctrl/⌘ + Y, or Ctrl/⌘ + Shift + Z | Redo |
| Delete or Backspace | Delete the selected layer |
| Ctrl/⌘ + D | Duplicate the selected layer |
| Arrow keys | Nudge the selected layer (Shift + arrows: bigger steps) |
| ] / [ | Bring forward / send backward |
| Ctrl/⌘ + Shift + ] / [ | Bring to front / send to back |
| Esc | Deselect |
| Ctrl/⌘ + V | Paste a picture, or a link to one |
| ? | Show this list (new, see below) |

- Put this list as data in a new `src/components/editor/library/shortcutsList.ts`
  (`{ keys: string[]; label: string }[]`, with a `forMac(isMac)` helper that shows ⌘ / ⇧ on a
  Mac and Ctrl / Shift elsewhere), so the sheet and the tests share it. Keep it matching
  `getShortcutCommand`; a test should fail if one changes without the other (e.g. for each row,
  build the keydown and check `getShortcutCommand` returns the expected command type).
- Add `?` (that is `e.key === '?'`, not while typing in a field) to `getShortcutCommand` as
  `{ type: 'help' }`, and handle it in `useEditorShortcuts` by opening the list. Extend
  `useEditorShortcuts.test.js`.
- Show the list in the existing **History & saved** sheet (`editor/library/LibrarySheet.tsx`,
  opened from the top bar's History button): its `SegmentedControl` gains a third tab,
  "Shortcuts". `?` opens that sheet on that tab (keep the chosen tab in the UI store, e.g. a
  `libraryTab` field in `useEditorUiStore.js`, so a shortcut can pick it). Render each row as the
  keys in small `<kbd>` boxes and the label beside them; CSS in `library/library.css`, using the
  `--ui-*` tokens. Add a one-line note that shortcuts need a keyboard.
- Test in `MemeEditor.test.jsx`: pressing `?` opens the sheet on Shortcuts and shows "Undo" and
  "Duplicate the selected layer".

## Task 3: Finish the branch

1. Update the image editor section of `docs/architecture.md` (not CLAUDE.md) for everything on
   this branch: outline colour row; Hindi/Gujarati fonts and the `withIndicFallback` /
   `ensureIndicFonts` helpers in `canvas/draw/captionFont.ts`; caption blur without
   `ctx.filter` (render/paintLayers); Canvas > Grid (`canvas/draw/guideGrid.ts`, screen only);
   gradient backgrounds (`canvasBgGradient` in the store and draft); `keepShape` for photo
   layers (`dragMath.ts`); drag-and-drop / paste / Media > Link (`utils/imageFromLink.ts`,
   `editor/hooks/useMediaInput.js`, `panels/LinkSheet.tsx`); layer names; the shortcuts list.
   Keep the file's style: dense, one sentence per point, file paths in backticks.
2. Run `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`; all must pass.
3. Browser check of tasks 1 and 2 at 375 x 812.
4. Commit the docs. Then, only if `main` is an ancestor of the branch, fast-forward it:
   `git fetch . feat/editor-easy-round:main`. Don't push or deploy.
5. Report back: the commits you made, test count, anything you couldn't check or chose
   differently from this prompt and why.
