# Analyse and audit the whole app (for Gemini)

Paste everything below the line into Gemini.

---

You are auditing **Meme Creator Studio**, a meme maker built browser-first and wrapped for Android.
Your job is to **find and report problems, not to fix them**. Read the code, run the app and the
checks, and write one report. Don't edit source files, don't install packages, don't commit.

## The app

- React 19 + Vite 8, plain CSS, TypeScript (strict) for new code, some older `.js`/`.jsx` files.
- Image editor on canvas 2D; video editor with zustand + zundo, export through FFmpeg WASM
  (`src/utils/ffmpegExport.js`) or WebCodecs (`webCodecsExport.ts`).
- PWA (vite-plugin-pwa), and an Android app through Capacitor (`android/`, `webDir` is `dist/`).
- **No backend.** Everything is stored on the device in IndexedDB: the gallery
  (`src/utils/galleryStore.ts`), image drafts (`memeDraftStore.ts`), video drafts and saved videos
  (`videoDraftStore.ts`), and a backup file format (`src/model/studioBackup.ts`).
- Pages: Home, Explore, Social, My Studio, Choose Canvas Layout, the image editor, the video
  editor, the GIF maker. The dock's Creator button opens a sheet of makers.

## Before you start

1. Read `CLAUDE.md` (short). Use `docs/architecture.md` as the map, and read only the sections for
   the area you're auditing.
2. Run `git status` and `git log --oneline -3`, and put the commit and whether the tree was clean
   at the top of your report, so it's clear what you audited.
3. Run `npm install` only if `node_modules` is missing, then `npm run lint`, `npm run typecheck`,
   `npm test` and `npm run build`. Report anything that fails or warns. (Last known state: all
   pass, about 900 tests.)
4. Run the app with `npm run dev` (http://localhost:5173). Test at phone size **390 × 844** first,
   then at a desktop width. Try dark and light theme (the sun button in the header).

## Already known: don't report these

The owner knows about these and has decided to deal with them later:

- There is no backend. Social and Explore show sample posts. AI captions come from a built-in
  library (there is deliberately no Gemini key in the app). Face swap needs a local Python server
  and social media video links need a local helper; without them, users get a plain "not
  available yet" note.
- GIF search needs `VITE_GIPHY_API_KEY`, which isn't set.
- Meme images (Batman, Drake, Bollywood stills, Trending) are copyrighted; they'll be replaced
  before a Play Store release.
- There are no end-to-end (Playwright) tests, by choice.
- Downloads in the Android app probably don't work (they use an `<a download>` link, which
  Android's WebView ignores), and the Android Back button isn't handled. A fix with Capacitor
  plugins is planned. Report anything *else* you find on Android.
- Release signing and version numbers in `android/app/build.gradle` aren't set up yet.

## What to audit

Go area by area. For each, try the real flows in the browser, not just the code.

1. **Correctness and bugs.** Both editors end to end: pick a layout, add photos, text, stickers,
   move, resize, undo and redo, change aspect ratio, export, save to My Studio, reopen and edit
   again. Every grid layout and caption layout in both editors. The GIF maker, the sticker maker,
   the AI meme maker. My Studio: search, tabs, grid and list, view, download, delete, Backup and
   Restore. Look for crashes, console errors, wrong results, state that's lost or goes stale.
2. **Data safety.** Can anything the user made be lost? Check auto-save of drafts, saving while
   another save runs, quota errors (a full IndexedDB), old saved data being read by new code (the
   `migrate*` functions in `src/model/`), Restore of a damaged or old backup, and what happens when
   the user leaves mid-export.
3. **Performance.** First load (`npm run build` output sizes, what's precached), big imports that
   should load lazily (FFmpeg, MediaPipe and background removal must never load eagerly),
   re-renders while dragging on the canvas, memory with long videos or many photos, object URLs
   that are never revoked.
4. **Mobile and touch.** Tap targets under 40px, inputs under 16px font (phones zoom in), the
   keyboard covering inputs, safe areas on notched phones, gestures (pinch, drag) that fight page
   scroll, anything wider than the screen.
5. **Accessibility.** Buttons without names, focus order and visible focus, Escape closing
   sheets, focus trapped in dialogs, text contrast (especially text over photos), screen-reader
   labels on canvas tools, `prefers-reduced-motion`.
6. **Security and privacy.** Anything that sends user data off the device, `dangerouslySetInnerHTML`
   or other HTML injection, untrusted URLs loaded into the canvas, hardcoded keys or secrets,
   content in `public/` that shouldn't ship.
7. **Offline and PWA.** Does it work offline after the first visit? Is an app update picked up?
   What breaks with no network?
8. **Android (Capacitor).** Read `capacitor.config.*`, `android/app/src/main/AndroidManifest.xml`
   and the build config. Permissions, the file picker, camera access, anything that works in Chrome
   but not in a WebView. (Downloads and the Back button are already known.)
9. **Code health.** Dead code, duplicated logic, very large files, `.js`/`.jsx` files that should
   become TypeScript, missing tests for important logic, places that break the rules in
   `CLAUDE.md`.
10. **UX and copy.** Confusing flows, dead ends, buttons that do nothing, unclear or developer-only
    wording shown to users, inconsistent styles between pages.

## The report

Write it to `docs/audit-report.md` (that one new file is the only file you create). Structure:

1. **Summary**: what you audited (commit, tree clean or not), check results, and the top 5 issues
   in one line each.
2. **Findings**, most severe first. Each one:
   - **Title** and **severity**: Critical (data loss, crash, security), High (a main feature broken
     or badly wrong), Medium (works but with a real problem), Low (polish).
   - **Where**: `path/to/file.ext:line`, and the page or flow.
   - **What happens**: steps to reproduce, what you expected, what you saw. Say whether you saw it
     in the browser or only read it in the code.
   - **Suggested fix**: one or two sentences. Don't write the code.
3. **Not checked**: anything you couldn't test (a real phone, a Giphy key) and why.

Rules for findings:

- Only report what you've confirmed, in the browser or by reading the exact code path. Mark
  anything you suspect but couldn't confirm as **Unconfirmed**.
- One finding per problem. Group many small instances of the same thing into one finding with a
  list of places.
- Don't report style preferences as bugs, and don't suggest rewriting the app in another
  framework.
- Plain, short English. The owner reads this to decide what to fix next.

When you're done, clean up: delete any test saves you made (in IndexedDB: `meme-creator` /
`memes`, `meme-creator-video` / `projects`, and the image draft store), then stop the dev server.
