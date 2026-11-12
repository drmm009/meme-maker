# Keep improving the image editor's UI (for Gemini)

You are continuing UI work on **Meme Creator Studio**, a browser-first meme maker (React 19 + Vite 8,
canvas-2D image editor, zustand stores, no backend). The repository is at
`C:\Users\jigar\.gemini\antigravity-ide\scratch\meme-maker`.

## Your task

> **Write the change you want here**, one item per line, e.g.
> - "On the Bubble sheet, make the style tiles bigger and show the selected one with an orange ring"
> - "Give the Draw sheet's brush sizes a live preview dot"

Do only what is listed. If something is unclear, ask before you build it.

## Before you start

1. Read `CLAUDE.md` (short). In `docs/architecture.md` read only the image editor section, and only
   the parts about what you are changing.
2. You are on branch **`feat/editor-easy-round`**, 35 commits ahead of `main`. Nothing tracked is
   uncommitted, and everything passes: `npm test` (640 tests), `npm run typecheck`, `npm run lint`,
   `npm run build`. Check with `git status` and `git log --oneline -5` that this is still true
   (the newest commit is `b7365f3`, the new Bubble and Social Card icons). If it isn't, stop and
   report. Untracked folders (`docs/prompts/`, `.agents/`, `.claude/`, `.codex/`, `.github/*`,
   `.impeccable/`, `scratch/`) are expected: leave them alone and keep them out of commits.
3. Already done on this branch. Don't redo or undo these:
   - Stickers: the boxes are round. The Stickers sheet keeps its **original look**. The owner
     rejected an iOS-style restyle twice, so don't restyle it unless asked.
   - Face Swap (`src/components/FaceMorphModal.jsx`): a swap starts only on **Swap face**, then
     **Apply**. Faces come from `TEMPLATE_FACES` in `editor/faceSwap.ts`.
   - AI Caption (`panels/AiCaptionSheet.tsx`): no Gemini key field and no idea chips. There's a
     composer view and a results view, Shuffle sits top-right, and results are kept when the
     sheet is closed and reopened.
   - Social Card (`panels/SocialCardSheet.tsx`): app icons, not card templates.
   - Text layers can move and resize past the canvas edge. The first tap on a caption only
     selects it. A tap on the caption that's already selected opens the keyboard
     (`canvas/interaction/useCanvasInteraction.js`).
   - Strip icons are hand-drawn SVGs in `panels/editorIcons.tsx`: a chat bubble with dots and a
     rounded heart.

## Where things are

- Wiring only (don't add UI here): `src/components/MemeEditor.jsx`, `CanvasEditor.jsx`.
- Panels, sheets and strips: `src/components/editor/panels/`. Each sheet has plain CSS next to it
  (`panels.css`, `browseSheet.css`, `aiCaptionSheet.css`, `socialCardSheet.css`, ...).
- Shared UI kit: `src/components/ui/` (`Sheet`, `Section`, `Row`, `Switch`, `SegmentedControl`,
  `ToolStrip`, ...). Use it before building your own.
- UI state (open sheet, modals, brush): `editor/store/useEditorUiStore.js`. Panels read it directly.
- Document state and undo: `editor/store/useMemeEditorStore.js`. Use `patchLayer(key, id, patch)`
  for a layer edit, or `pushHistory()` after a user edit for an immediate undo step.
- Colours and sizes: tokens in `src/styles/theme.css` (`--ui-accent`, `--ui-text`, `--ui-muted`,
  ...). Use them, don't hard-code new colours.

## Gotchas

- **Pill rule:** `panels.css` (around line 1470) has a global
  `.ie-panels--sheet button:not(...)` rule that forces `border-radius: 9999px !important` on every
  button in a sheet. If a new button must not be a pill (a tile, a card), add its class to that
  `:not(...)` list.
- **Heading override:** `src/App.css` sets `h3` to `1.15rem !important` and
  `text-transform: none !important` on phones. Use another element or a more specific
  `!important` if a heading must differ.
- Inputs must be at least 16px font size, or phones zoom in on focus.
- Heavy libraries (FFmpeg, MediaPipe, background removal) load lazily. Never import them eagerly.
- Never hard-code API keys. Gemini keys are entered by the user in the app.
- Keep asset paths relative (`./faces/x.jpg`, not `/faces/x.jpg`): `vite.config.js` has `base: './'`.

## Rules

- New code in TypeScript (strict). Match the surrounding code: naming, short plain-English
  comments that say *why*, plain CSS next to the component.
- The editor is dark, solid fills, one orange accent. No glass or blur effects, and no new fonts
  or gradients unless asked. Keep touch targets at least 40px.
- Add or update tests for behaviour changes: pure logic in a `*.test.ts` next to it, UI in
  `src/components/MemeEditor.test.jsx` (see its `sheet('...')` / `strip('...')` helpers). Vitest
  runs with `isolate: false`: a file that mocks a module another test loads must call
  `vi.resetModules()` and `await import()` what it tests.
- After each change run `npm run lint`, `npm run typecheck`, `npm test` and `npm run build`. All
  must pass with no new warnings.
- Check it in the browser: `npm run dev` (http://localhost:5173), open the "Drake Approving"
  template, window at **375 × 812**. Then delete the test drafts it saved: IndexedDB
  `meme-creator-image`, store `drafts`, keys `current`, `current-ai`, `current-sticker`,
  `current-faceswap` and `current-social`.
- When a feature changes, update its part of `docs/architecture.md` (not `CLAUDE.md`).
- **Commit only when the owner says so.** Then commit each change on its own, staging explicit
  paths only (never `git add -A` or `git add .`). Message style, as in `git log`:
  `feat: <what the user can now do>` or `fix: ...`.
- **Do not push, deploy (`npm run deploy`) or touch `android/`.** Don't edit `_old/`, `.agents/`,
  `design-preview/` or `penpot-design-pack/`.

## When you finish

Report in a few lines what changed, which files, which checks pass, and anything you couldn't
verify.
