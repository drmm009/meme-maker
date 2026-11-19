# Meme Creator Studio

Browser-first meme studio: templates, custom multi-panel builder, canvas-2D image editor, Konva video editor, FFmpeg video export, local gallery. PWA + Capacitor wrapper.

## Run
- `npm install`
- `npm run dev` (Vite, default `http://localhost:5173`)
- `npm run build` / `npm run preview`
- `npm run lint` (oxlint)
- Deploy: `npm run deploy` (`gh-pages -d dist`)

## Env (.env, see .env.example)
- `VITE_GIPHY_API_KEY=` optional. Without it, GIF search shows a disabled state and video templates fall back to local only. No hardcoded keys are shipped.

## Notes
- Gallery + favorites + watermark live in `localStorage` (5MB quota — keep exports small).
- AI captions: from the built-in curated library for now; a backend will write them later.
- Heavy models load at runtime: MediaPipe (CDN; faces and background removal) and FFmpeg WASM.
- Optional local face-swap: `face_swap_server.py` on `:5174` (Vite proxies `/api/face-swap`). Requires `insightface` + `inswapper_128.onnx`.
