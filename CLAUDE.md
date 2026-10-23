# Meme Creator Studio

Browser-first meme maker: React 19 + Vite 8, canvas-2D image editor, FFmpeg WASM video export, PWA, wrapped for Android with Capacitor. No backend — everything runs client-side. The gallery persists in IndexedDB (`src/utils/galleryStore.js`); settings, favorites and watermark use `localStorage` (`src/utils/storage.js`).

## Commands
- `npm run dev` — Vite dev server on http://localhost:5173
- `npm test` — Vitest (jsdom). Run after every change.
- `npm run lint` — oxlint
- `npm run build` — production build to `dist/` (also the Capacitor `webDir`)
- `npm run deploy` — publish `dist/` to GitHub Pages
- CI (`.github/workflows/ci.yml`) runs lint, test, build on every push.

## Layout
- `src/App.jsx` — top-level view switching (discovery, editor, explore, gallery, social)
- `src/components/MemeEditor.jsx` (~580 lines: layout + wiring) and `CanvasEditor.jsx` (~5k lines, plain canvas 2D; reads the editor stores) — the image editor. UI panels live in `src/components/editor/`: `top-bar/`, `context-toolbars/` (all editing tools, above the dock), `EditorSidebar.jsx` (the tab dock), `EditorModals.jsx`. The editor uses the same phone-style layout at every width; logic in `editor/hooks/` and `editor/store/`. Add new UI as panels there rather than growing MemeEditor. See `docs/plans/meme-editor-split.md`.
- Toolbar submenus are `motion.div` children of `AnimatePresence`; keep them direct children (don't wrap them in components) or exit animations break.
- `src/components/editor/store/useEditorUiStore.js` — the image editor's shared UI state (active tab/submenu, open menus and modals, brush, watermark). Not undoable. Panels read it directly; don't thread these values through props.
- `src/components/editor/hooks/use*Actions.js` — edit handlers grouped by feature (captions, layers, social cards, bubbles, canvas frame, drawing).
- `src/components/editor/store/useMemeEditorStore.js` — the image editor's document state (captions, layers, header/footer, drawings…) and undo/redo, one store per editor via React context. Call `pushHistory()` after a user edit to make it an undo step; plain setters don't record history.
- `src/components/video-editor/` — video editor (timeline, canvas preview, audio); state in `src/store/useVideoEditorStore.js` (zustand + zundo undo)
- `src/components/editor/` — bottom-sheet tools (stickers, emoji, filters, bubbles, template picker), each with a `.test.jsx`
- `src/data/` — static content: templates, video templates, stickers, sounds, filters, AI caption fallbacks
- `src/utils/` — face landmark/morph/graft engines, FFmpeg export, download, gallery/storage helpers
- `src/styles/theme.css` — theme tokens; `src/App.css` (~4.5k lines) holds most global styles
- `public/` — static assets served at `./` (template images, sounds, ffmpeg core, imgly models)
- `android/` — Capacitor Android project (`npx cap sync android` after a build)
- `face_swap_server.py` — optional local face-swap API on :5174, proxied at `/api/face-swap` by Vite

## Conventions
- Plain JSX (no TypeScript). Plain CSS files next to components.
- `vite.config.js` uses `base: './'` so builds work under GitHub Pages and Capacitor — keep asset paths relative.
- Heavy libs (FFmpeg, MediaPipe, background removal) load lazily at runtime; don't import them eagerly.
- Optional env: `VITE_GIPHY_API_KEY` (see `.env.example`). Gemini keys are user-supplied in-app — never hardcode keys.

## Not part of the app
- `_old/` — retired copies, old builds and scratch files (git-ignored). Don't read or edit unless asked.
- `.agents/`, `design-preview/`, `penpot-design-pack/` — design tooling and mockups, not shipped.
