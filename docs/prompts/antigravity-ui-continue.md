# Continue the UI work on Meme Creator Studio

You are picking up UI work on **Meme Creator Studio**, a browser-first meme maker (React 19, Vite 8,
plain CSS next to components, no backend). Another assistant did the work described below. Read
this whole brief, then `CLAUDE.md` and the parts of `docs/architecture.md` for the area you touch,
before changing anything.

## My next task

> **[Write what you want changed here before sending. For example: "Redesign the Home page's
> Trending shelf and Social Media Cards shelf in the same iOS look as Explore."]**

If that line is still a placeholder, do not start designing. Ask me what to change.

## Where things stand

- Branch `main`, in sync with `origin/main` at commit `650a90b`.
- **There are about 20 uncommitted files in the working tree.** Run `git status` and `git diff`
  first and treat them as work in progress that must be kept. Do not reset, stash, or overwrite
  them. They include the Home maker cards (`src/components/home/HomeTools.tsx`, `homeTools.css`,
  its test) and later edits to Choose Canvas Layout, Social, My Studio, `App.jsx`, `App.css` and
  some editor stylesheets.
- With those edits in place, lint, typecheck and all 818 tests pass. Keep it that way.

## The design system to follow

Four pages outside the editors share one iOS-style look: **My Studio, Social, Explore, Choose
Canvas Layout**. It lives in `src/components/pages/`:

- `iosLook.css` holds the `--ios-*` tokens (iOS system greys, one orange tint `#ff5a36`), dark by
  default and swapped under `[data-theme='light']`. It also holds the shared pieces: `ios-page`,
  `ios-title`, `ios-subtitle`, `ios-section-title`, `ios-btn` (`--filled`, `--gray`,
  `--destructive`, `--capsule`, `--small`), `ios-text-btn`, `ios-empty`, `ios-spinner`.
- `SegmentedControl.tsx` is the tab control with a **black key** that slides under the picked
  segment.
- `SearchField.tsx` is the search field with its clear button.
- `PullDownMenu.tsx` is a button plus the menu it opens. It is used for My Studio's "More" and
  Explore's "Sort".

Rules that came out of this work. Follow them:

1. **A page's root carries `ios ios-page`.** Anything it portals to `<body>` (a sheet, a dialog)
   carries `ios ios-layer`, or it loses the tokens.
2. **Use the tokens, never raw colours**, so the light theme keeps working. Test every change in
   both themes with the header's theme toggle.
3. **The font is Plus Jakarta Sans everywhere.** Do not add a font. Do not write a rule like
   `.something button { font: inherit }` with real specificity: it overrides each button's own
   size and weight. The shared reset is written as `:where(.ios, .ios-layer) button` for that
   reason.
4. **The selected state is black with white text** (segmented control key, the picked chip on
   Explore, the Grid/List switch). Orange is for primary actions and links only.
5. **Anything clickable is a real `<button>`**, not a `<div onClick>`. A card that also holds a
   second control (a star, a More button) is an `<article>` with two sibling buttons, never a
   button inside a button.
6. **`.app-static-bg` is a fixed layer that paints over un-positioned content.** A new page root
   needs `position: relative; z-index: 1` (`ios-page` already does this).
7. **Phone first.** Check 375px wide and 1280px wide. On a phone, a long row scrolls sideways or
   drops secondary detail; it must never push the page wider than the screen.
8. No gradient text, no decorative glass or glow, no emoji used as icons (icons come from
   `lucide-react`), no badge or eyebrow label above a heading.
9. Respect `prefers-reduced-motion`. Give icon-only buttons an `aria-label`.

The Home page (`src/components/TemplateDiscovery.jsx` and `src/components/home/`) is **not** on
this look yet, apart from the maker cards. It still uses its own older styles in
`TemplateDiscovery.css`, with heavier headings (weight 800 to 850).

## Project rules (from CLAUDE.md)

- New code in TypeScript (strict). Convert `.js`/`.jsx` with `git mv`, one file at a time.
- Plain CSS next to the component. Keep asset paths relative (`base: './'`).
- Heavy libraries (FFmpeg, MediaPipe, background removal) load lazily. Never import them eagerly.
- When a feature changes, update its section in `docs/architecture.md`.
- Do not read or edit `_old/`, `.agents/`, `design-preview/`, `penpot-design-pack/`.
- `MemeEditor.jsx` and `CanvasEditor.jsx` are wiring only. New editor UI goes in
  `src/components/editor/` as panels.

## How to check your work

Run all four after every change, and do not report done until they pass:

```bash
npm run lint
```

```bash
npm run typecheck
```

```bash
npm test
```

```bash
npm run build
```

Then look at the result in the browser with `npm run dev` (http://localhost:5173), at phone and
desktop widths, in dark and light themes. Tests in this repo share one page (`isolate: false`), so
a test that depends on `localStorage` must clear its own keys first.

When you rename a file (for example `.jsx` to `.tsx`) while the dev server is running, the server
keeps asking for the old name and the page shows "Something went wrong". Restart the dev server.

## Known open items

Pick these up only if I ask, but do not make them worse:

- Home has five maker cards. I may want Social card back as a sixth; the `social` action is still
  handled in `TemplateDiscovery.jsx`, so it is one entry in `TOOLS` in `HomeTools.tsx`.
- Headings on the four iOS pages are weight 700; Home's are 800 to 850. Not yet unified.
- On phones the app header is hidden on Explore, Social and My Studio but still shown on Choose
  Canvas Layout (the rule is in `App.jsx`).
- The filled orange buttons use white text, which is about 3:1 contrast.
- `StickersSheet.test.tsx` is order-dependent: it can fail when run with only the editor tests,
  and passes alone and in the full run.
- Git has no author identity on this machine. Earlier commits used
  `git -c user.name=Deploy -c user.email=deploy@example.com commit ...`.

## How to work

- Change only what the task needs. Do not restyle pages I did not mention.
- Do not commit or push unless I say so. When I do, commit only the files for that task.
- Tell me plainly what you changed, what you checked, and anything you could not verify.
