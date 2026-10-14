# Meme Creator Studio

Browser-first meme studio: templates, custom multi-panel builder, Konva canvas editor, FFmpeg video export, local gallery. PWA + Capacitor wrapper.

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
- AI captions: user supplies their own Gemini key in-app; otherwise curated fallback is used.
- Heavy models load at runtime: MediaPipe (CDN), FFmpeg WASM, `@imgly/background-removal`.
- Optional local face-swap: `face_swap_server.py` on `:5174` (Vite proxies `/api/face-swap`). Requires `insightface` + `inswapper_128.onnx`.
