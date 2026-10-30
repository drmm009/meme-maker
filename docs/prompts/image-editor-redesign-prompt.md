You are a world-class mobile product designer and front-end engineer. **Redesign from scratch** the image editor screen of a meme-making app called "Meme Creator Studio". The current UI is functional but feels ordinary and cluttered. I want a **fresh, distinctive, premium** editor that feels as polished as the best creative apps (CapCut, Instagram Edits, Lightroom mobile, Procreate Pocket, Canva, VSCO, Picsart). Do not give me a generic toolbar app.

Build a clickable React prototype with mock state (no backend; fake any processing with a short loading state and a visual result).

---

## 1. Do NOT reproduce the current layout

The current editor looks like the layout below. **Do not copy it, and do not make a lightly restyled version of it:**
- A floating rounded nav bar at the bottom with 5 icon+label sections (Draw, Media, Text, AI, Canvas).
- Tapping a section swaps that bar to a horizontal row of the section's tools with a back arrow.
- A second floating pill above it for layer actions.
- Small icon-over-label buttons everywhere.

I want you to rethink **how tools are organised and reached**, not just their colours. Change the interaction model, the hierarchy, the placement and the motion.

## 2. Deliver three distinct concepts

Build **three genuinely different redesign concepts** in the same prototype, with a small floating switcher (Concept 1 / 2 / 3) so I can compare them on the same meme. They must differ in **interaction model**, not just styling. Directions to explore (pick three, or propose better ones):

- **Contextual radial / command palette:** a single central "+" or magic button. Tapping it opens a radial menu or a searchable command sheet ("Add text", "Remove background", "Face swap"…). Layer tools appear right next to the selected layer on the canvas.
- **Gesture-first canvas with a smart tray:** the canvas fills almost the whole screen. A slim tray at the bottom shows **only what's relevant right now**: suggested next actions when nothing is selected, the layer's tools when something is selected. You swipe up for more.
- **Pro-tool layout:** a vertical tool rail on one edge (like Lightroom/Procreate) with an expanding inspector panel for the selected tool or layer, plus a layers panel you can slide in.
- **Card-based creation flow:** big, friendly, illustrated action cards ("Add a caption", "Make it a tweet", "Swap a face", "Deep-fry it") in a swipeable bottom carousel. Selecting a layer turns the carousel into its settings.
- **Floating contextual toolbar:** like Apple's Freeform or Figma mobile. A compact toolbar floats next to the selection, plus a minimal bottom dock for adding things.

For each concept, include a short on-screen note (2–3 lines) explaining its idea, shown in the switcher.

## 3. Brand look (keep these; everything else is open)

- Always dark.
  - Background `#090a0f`.
  - Surfaces `#12151f` / `#1a1d27`.
  - Text `#f5f5f7`; muted text `#8b8f9e`.
- Accent coral `#ff5e36`. Brand gradient `linear-gradient(135deg, #ff5e36, #ec4899)`, used sparingly for the main action and active states.
- Font: Plus Jakarta Sans.
- Feel: premium, calm, confident, generous spacing, delightful micro-interactions (springy press states, smooth sheet physics, subtle haptics-like feedback). No clutter, no boxed chips with borders, no rainbow of colours.
- You may introduce new elements (glass, depth, motion, illustration, custom icons), as long as they fit a dark, coral-accented, premium look.

## 4. The top bar

I like the current top bar, so keep its spirit:
- **Close** (round icon button) on the left.
- **Aspect ratio** picker in the centre: Original, 1:1, 4:5, 9:16, 16:9.
- **Undo** and **Redo**.
- A round gradient **Export** button that opens Download PNG, Copy image, Share and Save to gallery.

You may refine it, but don't make it heavier.

## 5. Every feature must be reachable in each concept

**Adding things**
- Text caption (classic meme style: Impact, white with black outline).
- AI captions: generate funny captions for this meme, tap to apply. Include loading, results and error/retry states.
- Chat/speech bubble: iMessage, WhatsApp and comic speech/thought styles.
- Header/footer white bands, for "caption on top" memes.
- Meme stickers (categories) and emojis (categories + search).
- Photo/video from the device as a layer, or another meme template as a layer.
- Fake social cards:
  - **Tweet**: name, handle, text, avatar; theme Dim/Dark/White; verified badge; metrics Viral/Casual/Ratioed.
  - **Instagram post**: theme, story ring, post photo.
  - **WhatsApp chat**: theme, contact header, read ticks, add message.

**Drawing**
- Brush, marker (highlighter) and neon glow.
- Colour, stroke size, undo last stroke, clear all.

**AI and photo**
- Face swap: pick a photo, then adjust intensity, hold to compare with the original, change face, cancel or accept.
- Photo filters: presets with thumbnails, including a "deep fried" meme filter, plus adjustments.
- Magic eraser / remove background on an image layer, with a loading overlay.

**Canvas**
- Background colour.
- Flip canvas.
- Watermark: text or logo, 4 corner positions, size, opacity, colour.

**Selected text caption**
- Font, fill colour, text background box (none/black/white/custom).
- Blur and opacity.
- Effects: arch, smile curve, shadow, glow, glitch, 3D, hollow.
- Convert to bubble.
- Text case, alignment.

**Selected sticker**
- Die-cut white outline (with border colour) and flip.

**Every selected layer**
- Rotate 90°, duplicate, bring forward / send backward, flip, delete.
- Move, resize and rotate by direct manipulation on the canvas, with handles.

**Also**
- Undo/redo.
- Paste an image from the clipboard (show a toast).
- Tapping empty canvas deselects.

## 6. Technical constraints

- React 18+ function components, plain JSX (no TypeScript), plain CSS, `lucide-react` icons. `framer-motion` is allowed for motion.
- Mobile-first: **390 × 844 portrait** phone, also fine at 360px and 430px. On desktop, centre a phone-width frame.
- Use `position: fixed; inset: 0` for the editor root, not `100vh`/`100dvh`; it runs as an iPhone home-screen app. Respect `env(safe-area-inset-top/bottom)`.
- Use a placeholder meme (e.g. "Distracted Boyfriend" with three captions) on the canvas.
- One mock store (context/reducer) with layers (captions, stickers, images, social cards, drawings), the selection, the open tool or sheet, and an undo/redo stack, shared by all three concepts.
- Design tokens as CSS variables at the top of the stylesheet.
- Accessibility:
  - `aria-label` on icon buttons.
  - Visible focus states.
  - AA contrast.
  - Respect `prefers-reduced-motion`.

## 7. Quality bar

- Every concept should feel finished, not wireframe-y: real spacing, real motion, real empty/loading states.
- The canvas should be the hero: as large as possible, never covered by more than one transient panel at a time.
- Show me something I wouldn't have thought of. Surprise me with the interaction design, while keeping every feature one or two taps away.
