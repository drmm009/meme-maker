# Meme Creator Studio

Browser-first meme maker: React 19 + Vite 8, canvas-2D image editor, FFmpeg WASM video export, PWA, wrapped for Android with Capacitor. No backend — everything runs client-side.

**Detailed feature map:** `docs/architecture.md`. Read the section for the area you're touching before working there; don't read it all up front.

## Commands
- `npm run dev` — Vite dev server on http://localhost:5173
- `npm test` — Vitest (jsdom). Run after every change. `isolate: false`: a test file that mocks a module another test file loads must call `vi.resetModules()` and `await import()` what it tests.
- `npm run lint` (oxlint) · `npm run typecheck` (tsc, `.ts`/`.tsx` only) · `npm run build` (to `dist/`, also the Capacitor `webDir`) · `npm run deploy` (GitHub Pages)
- CI runs lint, typecheck, test, build on every push.

## Map
- `src/App.jsx` — view switching (discovery, editor, explore, gallery, social)
- Image editor: `src/components/MemeEditor.jsx` and `CanvasEditor.jsx` are wiring only. Canvas code in `src/components/canvas/` (`render/`, `draw/`, `interaction/` pure tested TS, `media/`, `layout/`). Panels, sheets, hooks and stores in `src/components/editor/` (`panels/`, `export/`, `hooks/use*Actions.js`, `store/`). Shared UI kit in `src/components/ui/`.
  - `editor/store/useEditorUiStore.js` — UI state (open sheet, modals, brush). Not undoable; panels read it directly, don't thread through props.
  - `editor/store/useMemeEditorStore.js` — document state + undo. Call `pushHistory()` after a user edit. Auto-saves drafts to IndexedDB (`src/utils/memeDraftStore.ts`).
  - Add new UI as panels in `editor/`, not in MemeEditor.
- Video editor: `src/components/video-editor/`, state `src/store/useVideoEditorStore.js` (zustand + zundo). Export via `src/utils/ffmpegExport.js` / `webCodecsExport.ts`; FFmpeg command built by `src/utils/exportGraph.ts` (snapshot-tested — `npx vitest -u` only for intended changes). Run FFmpeg commands through `runFFmpeg(ff, args)`.
- `src/model/` — saved-data types with format versions + migrate functions (`memeDocument.ts`, `videoProject.ts`, `galleryRecord.ts`).
- `src/data/` static content · `src/utils/` engines and helpers · `src/styles/theme.css` tokens · `src/App.css` global styles
- `public/` static assets · `android/` Capacitor (`npx cap sync android` after build) · `face_swap_server.py` optional local API on :5174

## Conventions
- New code in TypeScript (strict); convert `.js`/`.jsx` file by file with `git mv`. Plain CSS next to components.
- Saved data is versioned: when its shape changes, bump the version in `src/model/` and teach the migrate function the previous version.
- `vite.config.js` uses `base: './'` — keep asset paths relative.
- Heavy libs (FFmpeg, MediaPipe, background removal) load lazily; never import eagerly.
- Optional env `VITE_GIPHY_API_KEY`. Gemini keys are user-supplied in-app — never hardcode keys.
- When a feature changes, update its section in `docs/architecture.md` (not this file).

## Not part of the app
`_old/` (git-ignored scratch), `.agents/`, `design-preview/`, `penpot-design-pack/` — don't read or edit unless asked.
