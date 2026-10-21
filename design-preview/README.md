# Meme Creator Studio — UI Revamp Design Exploration

This folder contains the Phase 2 visual mockups and design direction proposals for the Meme Creator Studio overhaul.

> **Note:** As specified in Phase 2 guidelines, no application source code (`src/`, `public/`, etc.) has been modified. All mockups are self-contained in this `/design-preview` directory.

---

## How to View the Mockups

### Method 1: Via the Running Vite Dev Server
Since the dev server is active at port `5173`, open your browser to:
- **Master Showcase (All 3 Side-by-Side)**: `http://localhost:5173/design-preview/index.html`
- **Direction 1 (Noir Luxe)**: `http://localhost:5173/design-preview/direction-1.html`
- **Direction 2 (Neo-Pulse)**: `http://localhost:5173/design-preview/direction-2.html`
- **Direction 3 (Cyber-Minimal)**: `http://localhost:5173/design-preview/direction-3.html`

### Method 2: Open HTML Files Directly
Double-click or open any of the HTML files directly in Chrome, Edge, or Safari:
- `design-preview/index.html`
- `design-preview/direction-1.html`
- `design-preview/direction-2.html`
- `design-preview/direction-3.html`

### Method 3: View High-Resolution PNG Screenshots
PNG screenshots of the phone mockups are exported in:
`design-preview/screenshots/`

---

## The 3 Design Directions

### Direction 1: Noir Luxe (Studio Noir Evolved)
* **Vibe**: High-end cinema & dark studio console for creator memes (A24 / DaVinci Resolve meets meme culture).
* **Color Palette**:
  * **Dark Theme**: Obsidian base (`#0a0b10`), Card surface (`#13151f`), Brushed gold primary (`#c9a227`), Smoky deep teal secondary (`#4a6670`), Gold rim borders (`rgba(201, 162, 39, 0.3)`).
  * **Light Theme**: Soft warm paper (`#f5f6f8`), Surface (`#ffffff`), Burnished amber-gold (`#b88e13`), Deep teal slate (`#3b535c`).
* **Typography**: `Syne` (distinctive sculpted headers) + `Plus Jakarta Sans` (interface) + `Space Mono` (timecodes).
* **Radii & Geometry**: `16px` rounded cards, `12px` tool buttons, `26px` top-rounded bottom sheets. Soft deep drop shadows with gold ambient rim lights.
* **Key UX Strengths**:
  * Rich, pro-tier aesthetic that feels like a serious creative workstation rather than a toy.
  * Subtle gold highlights guide the eye directly to the primary action without visual fatigue.

---

### Direction 2: Neo-Pulse / Electric Canvas (Violet-to-Blue Studio)
* **Vibe**: Fast, tactile, dynamic, and social-first creative tool (Canva / CapCut meets modern meme culture).
* **Color Palette**:
  * **Light Theme (Built to User Target)**: Pure white base (`#ffffff`), Crisp dark navy text (`#0b132b`), Violet-to-blue gradient accent (`linear-gradient(135deg, #7c5cfc, #4f86f7)`), Neon cyan spark (`#06b6d4`), Soft pastel glass cards (`rgba(240, 244, 255, 0.88)`).
  * **Dark Theme**: Midnight abyss (`#090a16`), Dark indigo surface (`#111326`), Violet-blue gradient (`#8b5cf6` → `#3b82f6`), Neon cyan (`#22d3ee`).
* **Typography**: `Montserrat` (bold, punchy headers) + `Plus Jakarta Sans` (rounded, friendly UI).
* **Radii & Geometry**: Full pill-shaped buttons (`9999px`), `20px` squircle cards with pastel ambient glow shadows (`0 14px 32px rgba(124, 92, 252, 0.15)`).
* **Key UX Strengths**:
  * Maximum thumb reachability with oversized pill buttons (minimum 44–48px touch targets).
  * Ultra-clean contrast on white with dark navy text (`#0b132b`), meeting WCAG AAA readability.
  * Delightful, tactile Canva/CapCut vibe that feels energetic and fast.

---

### Direction 3: Cyber-Minimal / Hyper-Tactile Precision
* **Vibe**: Swiss modernist technical studio with segmented toolbars, razor-sharp hairline borders, and neon indicators (Linear / Nothing OS inspired).
* **Color Palette**:
  * **Dark Theme**: Pure carbon (`#08090b`), Technical slate (`#111216`), Hyper-neon green (`#00f5a0`), Electric cyan (`#00d9f5`), Hairline borders (`#22252e`).
  * **Light Theme**: Cool gray (`#f2f4f7`), Crisp white surface (`#ffffff`), Emerald accent (`#059669`), Azure accent (`#0284c7`), Cool slate borders (`#d4d9e2`).
* **Typography**: `Space Grotesk` (tight tracking `-0.03em`) + `Inter` + `Space Mono` (monospaced specs).
* **Radii & Geometry**: Precision compact radii (`8px` buttons, `10px` cards, `16px` sheets). Segmented tool docks with hairline borders and zero visual clutter.
* **Key UX Strengths**:
  * Maximizes canvas visible area by using ultra-compact segmented toolbars.
  * Crisp tactile feedback with instant property readouts.

---

## Screen Mockup Coverage

Each direction provides interactive mockups inside an exact 390×844px mobile frame for:
1. **Discovery Screen**: Search bar, category filter chips, custom grid builder banner, 2-column template cards with format badges and favorite toggles.
2. **Meme Canvas Editor Screen**: Top utility bar, real-time meme preview canvas with bounding box + rotation handle, thumb-dock tool strip, open **Text Effects Panel** (Curve Sagitta slider, Glow/Shadow, Preset styles).
3. **Video Studio Screen**: Video preview viewport, playhead timecode pill, transport controls (44px circular play button, split tool), thumb-friendly multi-track timeline (Video, Text Chyron, Audio SFX with waveform).
4. **My Gallery Screen**: Saved memes grid with resolution badges, format pills (PNG, MP4), one-tap share buttons, and IndexedDB quota-safe indicators.
5. **Bottom Sheet Panel (Editor)**: Slide-up drawer for sticker & emoji libraries with category chips without hiding the canvas.
6. **AI Processing HUD (Editor)**: Glowing circular progress ring and progress bar for WASM background removal and neural segmentation (84%).
7. **Empty Gallery State**: Engaging graphic illustration with a clear primary CTA pointing the user to trending templates.
