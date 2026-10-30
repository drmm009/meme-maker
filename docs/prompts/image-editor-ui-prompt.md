You are a senior mobile product designer and front-end engineer. Design and build the complete front-end UI for the **image editor screen of a meme-making app called "Meme Creator Studio"**. I want a premium, modern, minimal UI that feels like a top-tier creative app (think CapCut, Instagram Edits, Canva mobile, VSCO), not a busy toolbox.

Build it as a working, clickable prototype. Everything should be interactive with mock state. No backend, no real image processing: fake the results (e.g. a toast or a visual change) where an action would normally run.

---

## 1. Tech constraints

- React 18+ with function components and hooks. Plain JSX, no TypeScript.
- Plain CSS (one CSS file, or CSS modules). No Tailwind, no UI kit.
- Icons: `lucide-react` (outline icons, ~20px, stroke width 2).
- Animations: CSS transitions/keyframes, or `framer-motion` for sheets and bars.
- Mobile-first: design for a **390 × 844 phone screen** (iPhone 14/15), portrait. It must also look right at 360px and at 430px wide. On desktop, centre the phone-width layout.
- Respect iPhone safe areas: `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`. The app runs as an installed home-screen web app with a translucent status bar, so content draws under the status bar.
- **Do not use `100vh` / `100dvh` for the editor height.** Use `position: fixed; inset: 0` for the editor root, so it fills the screen correctly in iOS home-screen apps.

## 2. Visual language (must match the rest of the app)

- Always dark.
  - Background `#090a0f` (solid, calm, no busy gradients behind the canvas).
  - Surface `#12151f` / `#1a1d27`.
  - Hairlines `rgba(255,255,255,0.07–0.12)`.
- Text `#f5f5f7`; muted text `#8b8f9e`.
- Brand accent: coral `#ff5e36`. Brand gradient `linear-gradient(135deg, #ff5e36 0%, #ec4899 100%)`, used sparingly (primary action, the active state). Soft coral glow on the primary button only: `0 10px 28px -8px rgba(255,94,54,0.7)`.
- Font: **Plus Jakarta Sans** (fallback: Inter, system-ui).
- Small labels under icons: 0.68rem (~11px), weight 650, muted colour. Active label: coral, weight 800.
- Active/selected state follows the app's bottom nav: the icon and label turn coral `#ff5e36`, with a small **14×3px coral pill bar under the label**.
- Glass surfaces for floating bars: `rgba(18,21,31,0.88)` + `backdrop-filter: blur(28px) saturate(190%)` + `1px solid rgba(255,255,255,0.12)` + `box-shadow: 0 16px 40px rgba(0,0,0,0.45)`.
- Round, quiet controls: 40px circular buttons with `rgba(255,255,255,0.08)` fill and no borders. Avoid boxed chips with borders and drop shadows; that "chunky toolbox" look is exactly what I want to get away from.
- Generous spacing, big tap targets (min 44px), no clutter, no more than one strong accent per area.

## 3. Screen layout

From top to bottom:

### A. Top bar (KEEP this design; I like it)
One row, transparent background, under the safe area:
- Left: **Close** – 40px round button, `X` icon.
- Centre: **Aspect ratio** pill (dropdown): Original, 1:1 Square, 4:5 Portrait, 9:16 Story, 16:9 Video.
- Right: **Undo** and **Redo** as plain icons (no background; dimmed when unavailable), then **Export**: a 40px round button with the brand gradient, glow and a share icon. Tapping Export opens a small dropdown card: Download PNG, Copy image, Share, Save to gallery.

### B. Canvas (the meme)
- The meme image centred in the remaining space with 12–16px side margins, rounded corners (~18px) and a deep soft shadow. It should be as large as possible.
- Layers on top of the image: text captions, stickers/emojis, image layers, chat/social cards, drawings, header/footer bands, watermark.
- A selected layer shows a thin coral selection box with small handles: delete (top-left ×), rotate (top centre), resize (bottom-right).
- Tapping empty canvas deselects.
- Small toasts appear at the top of the canvas (e.g. "Image pasted from clipboard").

### C. Bottom area: a floating "island" bar
A floating rounded glass bar (border-radius 32px, ~64px tall) inset 12px from the screen edges and above the home indicator. It is styled exactly like the app's home-screen bottom nav. It has three states; animate between them (fade/slide, ~200ms):

1. **Sections** (default): Draw · Media · Text · AI · Canvas. Each is an icon over a small label; the current section is coral with the small bar.
2. **Section tools**: tapping a section swaps the island's contents to that section's tools.
   - Left: a back arrow labelled with the section name (e.g. "‹ Text"), then a thin vertical divider.
   - Then the tools, in the same icon-over-label style. They scroll sideways when they don't fit, with a soft fade on the right edge.
   - Back returns to the sections.
3. **Selected layer**: when a text, sticker or image layer is selected, the island shows that layer's tools.
   - Left: a coral **✓ Done** (deselects the layer), then a divider, then the layer's tools.

Above the island, two kinds of floating elements appear when needed (glass style, centred):
- **Quick actions pill** (only when a layer is selected): Text case (Aa) · Align · Rotate 90° · Duplicate · Layer order (bring forward / send backward) · Delete (red).
- **Settings bars**: a compact floating panel for the current setting (colour swatches, sliders, options), opened by the tools below. Only one is open at a time. Tapping the tool again closes it.

Bottom sheets (rounded top corners, drag handle, dark glass) are used for larger pickers: stickers, emojis, templates, filters, chat bubbles, AI captions, social card settings, face swap.

## 4. Every feature to design (all must be reachable)

### Draw section
- **Brush** (solid stroke), **Marker** (translucent highlighter), **Glow** (neon stroke). Opening Draw starts drawing with Brush. Back stops drawing.
- Draw settings bar: colour swatches plus a custom colour picker, stroke size (min/max), **Undo last stroke**, **Clear all drawings**.

### Media section
- **Stickers**: bottom sheet of meme stickers with categories.
- **Emojis**: bottom sheet with categories and search.
- **Photo**: upload an image or video from the device as a new layer.
- **Template**: pick another meme template image to add as a layer.

### Text section
- **Add Text**: adds a caption ("NEW TEXT", Impact, white with black outline) and selects it.
- **AI Captions**: bottom sheet that generates funny captions for the current meme (AI, with loading state and a list of suggestions to tap and apply).
- **Bubble**: adds a chat or speech bubble. Bottom sheet of bubble styles: iPhone iMessage, WhatsApp, comic speech/thought bubbles.
- **Header/Footer**: settings bar with toggles for Header, Footer and Both. These add white bands above/below the image for classic "caption on top" memes.

### AI section
- **Face Swap**: AI face swap. Pick a photo; then a face-morph tool row appears with an intensity slider, "hold to compare with original", Change face, Cancel and Done.
- **Filters**: bottom sheet of photo filter presets with thumbnails (including a "deep fried" meme filter) plus adjustment sliders.

### Canvas section
- **Color**: canvas background colour swatches plus a custom picker.
- **Flip**: flip the whole canvas horizontally.
- **Watermark**: settings bar with text or uploaded logo, position (4 corners), size, opacity and colour, plus remove logo.

### When a TEXT caption is selected (island tools)
- **Font** (shows the current font name, e.g. "Impact"): font picker sheet.
- **Color**: text fill colour.
- **Box**: text background (none / black / white / custom colour).
- **Blur**: text blur and opacity sliders.
- **Effects**: Arch, Smile curve, Shadow, Glow, Glitch, 3D, Hollow/outline.
- **Bubble**: convert the caption into a chat/speech bubble style.
- Plus the quick-actions pill above (case, align, rotate, duplicate, layer order, delete).

### When a SOCIAL CARD caption is selected (tweet, Instagram post, WhatsApp chat)
These are realistic fake social-media cards for memes:
- **Tweet card**: Settings sheet (name, handle, text, avatar), Theme (Dim / Dark / White), Verified badge toggle, Trend metrics (Viral / Casual / Ratioed).
- **Instagram post**: Settings, Theme (dark/light), Story ring toggle, upload post photo.
- **WhatsApp chat**: Settings, Theme (dark/light), contact header toggle, read-receipt ticks (blue / grey / single), "+ Msg" to add a message to the thread.

### When a STICKER is selected
- **Die-Cut** (white sticker outline, with a border colour option) and **Flip**. Plus the quick-actions pill.

### When an IMAGE layer is selected
- **Magic Eraser** (remove background, with a full-canvas "Removing background…" loading overlay), **Face Swap** and **Filters**. Plus the quick-actions pill.

### Always available
- Undo/redo history, aspect ratio, export menu (top bar).
- Paste an image from the clipboard as a new layer (shows a toast).

## 5. States and screens to include in the prototype

1. Default editor with a meme loaded (use any placeholder image, e.g. the "Distracted Boyfriend" meme with three captions).
2. Each section open in the island (Draw, Media, Text, AI, Canvas).
3. A text caption selected: island layer tools + quick-actions pill + one settings bar open (e.g. Color).
4. A tweet card selected, with its tools.
5. A sticker selected and an image layer selected.
6. Export dropdown open.
7. One bottom sheet open (Stickers) and the AI Captions sheet with a loading state and results.
8. Face-swap tool row with the intensity slider.
9. Empty, loading and error states where they make sense (e.g. AI captions failed → friendly retry).

## 6. Interaction details

- Every tap gives feedback: a slight press-in scale (0.92) on buttons and a colour change on active.
- Only one settings bar or sheet open at a time; opening another closes the previous one.
- Sheets close with drag-down or by tapping the backdrop.
- The island never shows two rows. Layer tools replace section tools and come back on Done.
- Long tool rows scroll horizontally with momentum, a hidden scrollbar and a right-edge fade.
- Keep the canvas visible and as large as possible at all times. Settings bars float over the bottom of the canvas area, not over the island.
- Accessibility:
  - Every icon button has an `aria-label`.
  - Visible focus styles.
  - Contrast AA for text.
  - Reduced motion respected (`prefers-reduced-motion`).

## 7. Deliverables

- The full React source: `App.jsx` plus components such as `EditorTopBar`, `Canvas`, `Island` (sections / section tools / layer tools), `QuickActionsPill`, `SettingsBar`, `BottomSheet`, `ExportMenu`, the individual sheets, and the CSS.
- A single mock state store (React context or a small reducer) with layers (captions, stickers, images, social cards, drawings), the selected layer, the open section, the open settings bar or sheet, and an undo/redo stack. That way the prototype behaves like the real editor.
- Clean, readable code with design tokens as CSS variables at the top of the stylesheet:
  - `--bg`, `--surface`, `--text`, `--muted`
  - `--accent: #ff5e36`, `--accent-grad`
  - `--glass-bg`, `--glass-border`
  - `--radius-island: 32px`
- Start by showing the default editor screen, then make all the states above reachable by tapping through the UI.
