# Audit Report: Meme Creator Studio

## Summary

- **Audit Target**: Commit `fe38ff0` (`feat: panel-aware placement, video layout fixes, glass top bar and photo Creator sheet`).
- **Working Tree**: Dirty (uncommitted modifications and untracked backup files present).
- **Automated Check Results**:
  - `npm run lint` (`oxlint`): **Passed** (0 errors, 0 warnings across 479 files).
  - `npm run typecheck` (`tsc -p tsconfig.json`): **Passed** (0 errors).
  - `npm test` (`vitest run`): **Passed** (129 test files, 903 tests passed in 58.7s).
  - `npm run build` (`vite build`): **Build Succeeded** (7.08s), but surfaced build warnings:
    - Multiple `[INEFFECTIVE_DYNAMIC_IMPORT]` warnings for `@ffmpeg/util` and `ffmpegExport.js`.
    - Workbox precaching 85 assets totaling >4,070 KiB on initial load.
    - Large individual vendor assets (`dist/assets/data-gleKowDg.js` is 735.63 kB minified; ONNX runtime wasm is 23.9 MB).

### Top 5 Issues
1. Auto-save in the video editor has an unsynchronized race condition in `dropUnusedMedia` that deletes newly stored media blobs when saves overlap.
2. Saving to gallery in the image editor triggers celebration confetti but silently fails on IndexedDB quota errors due to an unhandled detached async promise.
3. Maker hash routes (`#/stickers`, `#/ai-meme`, `#/gif`) lack hashchange event listeners, causing deep links, in-app navigation, and PWA home-screen shortcuts to fail while the app is active.
4. Multi-panel photos, slot pan/zoom transforms, canvas background colors, and filters are omitted from image editor history, breaking undo/redo for custom layouts.
5. Workbox precaches over 4MB of heavy editor and ONNX bundles on the user's initial visit, while FFmpeg is statically imported into the video editor chunk in violation of lazy-loading architecture rules.

---

## Findings

### Critical

#### 1. Video draft media deletion race condition in `dropUnusedMedia`
- **Severity**: Critical
- **Where**: `src/utils/videoDraftStore.ts:116-130`, Video Editor auto-save and draft persistence flow.
- **What happens**:
  - Steps: In the video editor, import multiple video clips or photos in rapid succession while the auto-save timer (`SAVE_DELAY_MS = 700`) is active.
  - Expected: Each media item is stored in the IndexedDB `media` store and kept as long as it is part of the project.
  - Actual: `saveVideoDraft()` calls `await storeMedia(project)` which puts blobs into the `media` store, followed by `await dropUnusedMedia()`. `dropUnusedMedia()` reads the committed draft from IndexedDB via `run<VideoDraft>(DRAFTS, 'readonly', ...)`. If an earlier save is in-flight or completes after a subsequent write, the draft in IndexedDB does not yet contain the new item's `mediaKeys`. `dropUnusedMedia()` classifies the newly written media blobs as unused and executes `s.delete(k)` on the `media` store. When the user next loads the draft, the media blob is `undefined`, causing permanent data loss for uploaded clips.
  - Observed: In code inspection of `videoDraftStore.ts:116-130` and `useVideoDraft.js:23-50`.
- **Suggested fix**: Sequence auto-saves through a promise chain or mutex, and pass the active in-memory `project.mediaKeys` into `dropUnusedMedia` so in-flight media is never deleted before the draft record commits.

#### 2. Unhandled `fetch()` rejection crashes video editor auto-save on revoked or missing blob URLs
- **Severity**: Critical
- **Where**: `src/utils/videoDraftStore.ts:103`, Video Editor auto-save.
- **What happens**:
  - Steps: Add a video clip or photo to the video timeline, perform edits where an object URL is revoked or refreshed, and allow auto-save to trigger.
  - Expected: Auto-save persists the active project and ignores revoked media gracefully (as done in `src/utils/memeDraftStore.ts:125-130`).
  - Actual: `storeMedia()` executes `const blob = await (await fetch(url)).blob();` without a `try/catch` wrapper. If any blob URL is revoked, expired, or invalid, `fetch(url)` throws an uncaught `TypeError: Failed to fetch`. The rejection aborts `saveVideoDraft()`, logging a warning and halting the auto-save pipeline. Subsequent project edits remain completely unsaved in IndexedDB.
  - Observed: In code inspection of `src/utils/videoDraftStore.ts:103` contrasted with `src/utils/memeDraftStore.ts:125-130`.
- **Suggested fix**: Wrap the `fetch(url)` statement in a `try/catch` block within `storeMedia()`, skip revoked or unresolvable URLs, and continue saving the remaining project state.

#### 3. Silent save failure on IndexedDB quota error with false visual confirmation
- **Severity**: Critical
- **Where**: `src/App.jsx:501-529` and `src/components/editor/export/ExportSheet.tsx:107, 271`, Image Editor export sheet.
- **What happens**:
  - Steps: In Image Editor, tap Export, choose any format, and tap "Save to Gallery" under storage constraints (e.g., storage quota exceeded or private browsing restrictions).
  - Expected: The UI awaits confirmation from storage before confirming, or displays an error notification if the write fails.
  - Actual: `ExportSheet.tsx` immediately invokes `triggerConfetti()` and closes the sheet. In `App.jsx`, `idbPutMeme(record)` is executed inside a detached async fire-and-forget IIFE `(async () => { ... })()`. If IndexedDB throws `QuotaExceededError` or fails to write the image blob, the error is caught and only logged to `console.error`. The user sees a success celebration and believes their meme is safely saved to My Studio, but the data was never written.
  - Observed: In browser inspection of "Save to Gallery" flow and code inspection of `src/App.jsx:501-529`.
- **Suggested fix**: Make `saveToGallery` return a promise, await `idbPutMeme(record)` before firing confetti, and display an error modal or toast with a download option if IndexedDB write fails.

---

### High

#### 4. Missing `hashchange` / `popstate` routing breaks deep links, PWA shortcuts, and browser navigation
- **Severity**: High
- **Where**: `src/App.jsx:36-40`, `src/components/editor/makers.ts:25-30`, and `vite.config.js:55-60`.
- **What happens**:
  - Steps: While the application is loaded in the browser, type `http://localhost:5173/#/stickers` or `http://localhost:5173/#/ai-meme` directly in the URL bar, or click a PWA home-screen app shortcut.
  - Expected: The app switches directly to Sticker Studio or AI Meme Studio.
  - Actual: The URL changes in the address bar, but the app does not react and either redirects to Home or remains on the previous view. In `App.jsx`, `window.location.hash` is only read once during initial state initialization (`useState(() => makerOfLink(window.location.hash))`). There are no `hashchange` or `popstate` listeners in the application. Browser Back and Forward buttons also fail to navigate between maker screens.
  - Observed: Confirmed in browser subagent testing (direct navigation to `#/stickers` and `#/ai-meme` redirected to Home) and verified in code inspection.
- **Suggested fix**: Add a `window.addEventListener('hashchange', ...)` effect in `App.jsx` that updates `currentView` and selects the appropriate template when the URL hash changes.

#### 5. Multi-panel slot photos, transforms, canvas colors, and filters omitted from undo/redo history
- **Severity**: High
- **Where**: `src/components/editor/store/useMemeEditorStore.js:18-29`, Image Editor canvas state.
- **What happens**:
  - Steps: Create a 2-panel or 3-panel meme layout in Image Editor, add a photo into slot 1, change the canvas background color or gradient, apply an image filter, and tap "Undo".
  - Expected: The photo addition, color change, or filter adjustment is reverted.
  - Actual: `HISTORY_FIELDS` only tracks `['captions', 'stickers', 'imageLayers', 'drawings', 'canvasHeader', 'canvasFooter', 'demotivational', 'canvasFlipX', 'activeTemplate', 'templateFaceMorph']`. Critical state variables (`slotImages`, `slotTransforms`, `canvasBgColor`, `canvasBgGradient`, `aspectRatio`, `imageFilters`, and `watermark`) are omitted. Tapping Undo does nothing or reverts a prior caption change while leaving panel photos and colors untouched.
  - Observed: In code inspection of `src/components/editor/store/useMemeEditorStore.js:18-29`.
- **Suggested fix**: Add `slotImages`, `slotTransforms`, `canvasBgColor`, `canvasBgGradient`, `aspectRatio`, and `imageFilters` to `HISTORY_FIELDS`.

#### 6. Eager static import of FFmpeg into video editor bundle violates lazy-loading architecture
- **Severity**: High
- **Where**: `src/components/video-editor/VideoEditor.jsx:16`, `src/utils/clipEffects.js:1`, `src/utils/videoFaceSwap.ts:1`.
- **What happens**:
  - Steps: Run `npm run build` and inspect the generated chunks in `dist/assets/`.
  - Expected: Heavy libraries like FFmpeg load on-demand only when export or video effects are executed (per `CLAUDE.md`: "Heavy libs (FFmpeg, MediaPipe, background removal) load lazily; never import eagerly").
  - Actual: `VideoEditor.jsx` statically imports `exportVideoWithFFmpeg` from `ffmpegExport.js`, while `clipEffects.js` and `videoFaceSwap.ts` statically import `getFFmpeg`. Vite produces `[INEFFECTIVE_DYNAMIC_IMPORT]` warnings because dynamic imports in `motionExport.ts`, `renderGif.ts`, and `clipAudio.js` are invalidated by these static imports. FFmpeg core is bundled directly into the video editor chunk, inflating its size and slowing initial editor load.
  - Observed: In `npm run build` output and code inspection.
- **Suggested fix**: Replace static imports of `ffmpegExport` and `getFFmpeg` with dynamic `await import('../../utils/ffmpegExport')` calls inside export and effect trigger functions.

#### 7. Over-aggressive Workbox PWA precaching downloads 4MB+ of heavy editor and AI bundles on initial page visit
- **Severity**: High
- **Where**: `vite.config.js:34-37`, PWA service worker precache.
- **What happens**:
  - Steps: Build the PWA via `npm run build` and inspect the generated `sw.js` and Workbox precache manifest.
  - Expected: Only core shell assets (HTML, entry CSS, small icons, Home page bundle) are precached; heavy editor modules and ONNX runtimes are cached at runtime upon use.
  - Actual: `vite.config.js` configures `maximumFileSizeToCacheInBytes: 5000000` with `globIgnores: ["**/ffmpeg-core.wasm", "**/*.wasm"]`. Workbox precaches 85 files totaling 4,070 KiB on the first visit, including the full video editor, image editor, emojibase dataset (`735 kB`), and ONNX runtime scripts (`ort.bundle.min.js`, `ort.webgpu.min.js`). A mobile user visiting the landing page is forced to download over 4MB of background data immediately.
  - Observed: In `npm run build` Workbox precache output.
- **Suggested fix**: Restrict `globPatterns` to entry bundles and shell assets, moving `VideoEditor`, `MemeEditor`, `emojibase`, and `ort` chunks to runtime caching with a `CacheFirst` or `StaleWhileRevalidate` strategy.

#### 8. Missing Android permissions for Camera, Microphone, and Media in `AndroidManifest.xml`
- **Severity**: High
- **Where**: `android/app/src/main/AndroidManifest.xml:40`, Android Capacitor app manifest.
- **What happens**:
  - Steps: Launch the app on Android via Capacitor, navigate to GIF maker and tap "Record a video", or navigate to Video Editor and tap "Voice" to record audio.
  - Expected: Android prompts the user for camera and microphone permissions and allows recording.
  - Actual: `AndroidManifest.xml` declares only `<uses-permission android:name="android.permission.INTERNET" />`. The Android WebView blocks `navigator.mediaDevices.getUserMedia` with a `NotAllowedError` because `android.permission.CAMERA` and `android.permission.RECORD_AUDIO` are absent from the manifest. Furthermore, Android 13+ gallery access requires media read permissions.
  - Observed: In code inspection of `android/app/src/main/AndroidManifest.xml:38-41`.
- **Suggested fix**: Add `android.permission.CAMERA`, `android.permission.RECORD_AUDIO`, `android.permission.READ_MEDIA_IMAGES`, and `android.permission.READ_MEDIA_VIDEO` to `AndroidManifest.xml`.

---

### Medium

#### 9. Modals, export sheets, and dropdown menus fail to close on `Escape` key press
- **Severity**: Medium
- **Where**: `src/components/NotificationsModal.jsx`, `src/components/AccountModal.jsx`, `src/components/ui/Sheet.tsx`, `src/components/editor/export/ExportSheet.tsx:178`, `src/components/video-editor/VideoEditor.jsx:168`.
- **What happens**:
  - Steps: Open the Notifications modal, Account & Sync modal, Image Editor ExportSheet, or Video Editor Export dropdown, and press the `Escape` key on the keyboard.
  - Expected: The active modal, sheet, or dropdown dismisses.
  - Actual: The modal or sheet remains open and active. `NotificationsModal.jsx` and `AccountModal.jsx` have no keyboard listeners. In `useEditorShortcuts.js:37`, `Escape` only calls `onDeselect()`, failing to close the active sheet. The user is forced to find and click the exact "X" or backdrop button.
  - Observed: Confirmed in browser subagent testing on mobile and desktop viewports.
- **Suggested fix**: Add a `keydown` listener for `Escape` in `Sheet.tsx`, `NotificationsModal.jsx`, and `AccountModal.jsx` that triggers `onClose()`.

#### 10. Memory leak from duplicate `URL.createObjectURL` without revocation on export
- **Severity**: Medium
- **Where**: `src/components/editor/export/ExportSheet.tsx:102, 105`, `src/utils/downloadHelper.js:12`.
- **What happens**:
  - Steps: Export multiple memes in PNG, JPG, or WebP format from the Image Editor.
  - Expected: Object URLs created for download or sharing are cleanly revoked after the action completes.
  - Actual: `ExportSheet.tsx` creates an object URL with `URL.createObjectURL(blob)` and passes it to `downloadImageHelper(url, fileName)`. Inside `downloadImageHelper`, the function passes the URL string to `fetch(dataUrl)`, extracts the blob, creates a *second* `URL.createObjectURL(blob)`, and revokes only the second one. The initial object URL created in `ExportSheet.tsx` is never revoked, leaking memory with every export.
  - Observed: In code inspection of `ExportSheet.tsx:102, 105` and `downloadHelper.js:9-13`.
- **Suggested fix**: Pass the raw `Blob` object directly to `downloadImageHelper` or revoke the created URL in a `finally` block in `ExportSheet.tsx`.

#### 11. Touch targets under 40px on primary navigation and editor controls
- **Severity**: Medium
- **Where**: `src/components/editor/top-bar/makerTopBar.css:101, 178`, `src/App.css:274`, `src/components/home/HomeTrending.css:42`.
- **What happens**:
  - Steps: Use the app on a mobile device or inspect button bounding boxes in developer tools.
  - Expected: All interactive controls meet the mobile/WCAG minimum touch target size of 40x40px (recommended 44–48px).
  - Actual: Multiple primary controls measure below 40px:
    - Header top bar buttons (`Toggle theme`, `Notifications`, `Account`) measure 36x36px.
    - Top bar Undo/Redo buttons (`.mtb-history-btn`) measure 36x34px.
    - Top bar back button (`.mtb-round`) measures 38x38px.
    - Meme card favorite buttons measure 28x28px.
    - Explore search bar input height is 38px.
  - Observed: Confirmed in browser subagent DOM bounding box measurements.
- **Suggested fix**: Increase button padding or set `min-width: 44px; min-height: 44px` on interactive touch targets across mobile stylesheets.

#### 12. Text input font sizes under 16px trigger automatic iOS Safari viewport zoom
- **Severity**: Medium
- **Where**: `src/components/editor/panels/browseSheet.css:174`, `src/components/video-editor/video-editor.css:987`, `src/components/TemplateDiscovery.css:120`.
- **What happens**:
  - Steps: On an iPhone in Safari, tap into the Explore search input, the Account email input, or the video text input.
  - Expected: The input receives focus without altering the page zoom level.
  - Actual: The inputs have `font-size: var(--ui-fs-body, 15px);` or `font-size: 14px;`. On iOS Safari, focusing any input element with a font size below 16px triggers an automatic viewport zoom-in, breaking the app layout and requiring manual pinch-to-zoom out.
  - Observed: In CSS inspection and browser subagent input inspection.
- **Suggested fix**: Set `font-size: 16px` on all `<input>` and `<textarea>` elements on mobile screens.

#### 13. Added canvas text overlaps centered empty-state instructions in Video Editor
- **Severity**: Medium
- **Where**: `src/components/video-editor/VideoEditor.jsx` (canvas render) and `src/components/video-editor/EmptyCanvasState.jsx`.
- **What happens**:
  - Steps: Open the Video Editor with a blank canvas and click "Text" in the bottom tool rail to add a text layer.
  - Expected: The centered empty-state prompt ("Add a video / Then layer text, stickers and sounds on it") disappears once an item is added to the project.
  - Actual: The empty-state card remains visible in the center of the canvas, and the newly added "NEW TEXT" layer is rendered directly on top of it, creating an unreadable visual collision.
  - Observed: Confirmed in browser subagent testing at 1280x800 desktop viewport.
- **Suggested fix**: Conditionally render the empty canvas placeholder only when `project.items.length === 0`.

#### 14. AGPL-3.0 copyleft dependency `@imgly/background-removal` introduces licensing compliance risks
- **Severity**: Medium
- **Where**: `package.json:28` and `src/data/credits.ts:42`.
- **What happens**:
  - Steps: Inspect package dependencies and license compliance for store distribution.
  - Expected: Client-side dependencies use permissive open-source licenses (MIT, Apache-2.0, BSD).
  - Actual: `@imgly/background-removal` is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0). AGPL-3.0 is a viral copyleft license. Packaging this library into a distributed Android APK or web app can legally require open-sourcing the entire client codebase under AGPL-3.0 unless a commercial license has been purchased from IMG.LY.
  - Observed: In code inspection of `package.json:28` and `src/data/credits.ts:42`.
- **Suggested fix**: Confirm whether a commercial license is in place; if not, replace with an MIT-compatible client segmentation model (such as MediaPipe Selfie Segmentation).

#### 15. Low text contrast on light mode hero banner badge
- **Severity**: Medium
- **Where**: `src/components/home/FeaturesShowcase.css:56` and `src/components/home/FeaturesShowcase.jsx`.
- **What happens**:
  - Steps: Click the theme toggle button in the header to switch to light mode and observe the hero carousel badge.
  - Expected: Text meets WCAG AA contrast ratio of at least 4.5:1 against its background.
  - Actual: The pill badge `🚀 100% FREE APP` renders white text (`#ffffff`) on a light translucent background (`rgba(255, 255, 255, 0.15)`), rendering the text illegible in light mode.
  - Observed: Confirmed in browser subagent testing upon toggling to light mode.
- **Suggested fix**: Apply a theme-aware text color (such as `var(--ui-text)` or dark charcoal `#1a1a1a`) to `.showcase-badge` when `[data-theme='light']` is active.

#### 16. Backup restore lacks transaction batching and leaves partial state on storage quota exhaustion
- **Severity**: Medium
- **Where**: `src/utils/studioBackupStore.ts:24-34` and `src/utils/videoDraftStore.ts:244-254`.
- **What happens**:
  - Steps: Restore a `.memestudio` backup containing 30+ items and videos under constrained storage or quota limits.
  - Expected: Restore operates atomically or rolls back cleanly if storage runs out.
  - Actual: `restoreStudio()` and `importSavedVideos()` perform individual `await run(...)` calls for each record and media blob in sequential loop iterations. If the device hits `QuotaExceededError` midway through, the loop throws an uncaught error, leaving the gallery partially restored with orphaned records and corrupt references.
  - Observed: In code inspection of `studioBackupStore.ts:24-34` and `videoDraftStore.ts:244-254`.
- **Suggested fix**: Batch writes into a single IDB transaction per store, catch quota errors, and present a clear recovery dialogue if storage is exhausted.

---

### Low

#### 17. Mobile-first layout container locks desktop screen to 847px with empty gutters
- **Severity**: Low
- **Where**: `src/App.css:283` and `src/components/pages/iosLook.css:12`.
- **What happens**:
  - Steps: Open the application in a desktop browser at 1280x800 or wider.
  - Expected: Content utilizes available desktop horizontal space with multi-column responsive grids.
  - Actual: Several views and pages are constrained to a fixed 847px container left-aligned with a ~433px blank gutter on the right, while the floating mobile dock sits awkwardly centered within the 847px column.
  - Observed: Confirmed in browser subagent testing at 1280x800 desktop viewport.
- **Suggested fix**: Use responsive CSS grid rules that expand beyond 847px on viewports wider than 1024px.

#### 18. Rank number badges overlap favorite star buttons on compact trending meme cards
- **Severity**: Low
- **Where**: `src/components/home/HomeTrending.css:42` and `src/components/home/HomeTrending.jsx`.
- **What happens**:
  - Steps: View the "Trending Memes" horizontal card strip on a mobile viewport (390px).
  - Expected: The rank badge ("1", "2", "3") and the favorite star button are clearly separated.
  - Actual: The top-left rank indicator sits within 2px of the star icon button on small card variants, causing visual overlap and mis-taps.
  - Observed: Confirmed in browser subagent visual inspection.
- **Suggested fix**: Move the favorite star button to the top-right corner of the card.

#### 19. Ineffective dynamic import warnings for FFmpeg utilities during production build
- **Severity**: Low
- **Where**: `src/utils/clipAudio.js`, `src/utils/motionExport.ts`, `src/utils/renderGif.ts`.
- **What happens**:
  - Steps: Run `npm run build`.
  - Expected: Clean build output with zero module bundling warnings.
  - Actual: Rollup emits `[INEFFECTIVE_DYNAMIC_IMPORT]` warnings because `@ffmpeg/util` is dynamically imported in `clipAudio.js` but statically imported in `ffmpegExport.js`.
  - Observed: In `npm run build` console output.
- **Suggested fix**: Standardize dynamic import syntax across all export utilities.

#### 20. Android `allowBackup="true"` allows unencrypted local database extraction via ADB
- **Severity**: Low
- **Where**: `android/app/src/main/AndroidManifest.xml:5`.
- **What happens**:
  - Steps: Connect an Android device with USB debugging enabled and execute `adb backup com.meme.creator`.
  - Expected: App data and private user drafts in IndexedDB are protected from extraction.
  - Actual: `android:allowBackup="true"` is enabled without backup rules, permitting full extraction of local IndexedDB databases via ADB backup.
  - Observed: In code inspection of `android/app/src/main/AndroidManifest.xml:5`.
- **Suggested fix**: Set `android:allowBackup="false"` or configure explicit `backup_rules.xml`.

---

## Not Checked

1. **Physical Android Device Hardware**: Testing was performed via browser simulation and code inspection of `android/` and `capacitor.config.json`. Physical camera/microphone hardware permissions prompts, hardware-accelerated WebCodecs performance on low-end Android chipsets, and physical system back-button handling could not be tested on a physical phone.
2. **Live Giphy API Search**: `VITE_GIPHY_API_KEY` was not configured in the test environment; remote Giphy GIF search against live production servers was not evaluated.
3. **Local Face Swap & Video Link Helper Backends**: The optional local Python face-swap server (`127.0.0.1:5174`) and video link helper (`127.0.0.1:5175`) were not running; fallback UI and error states were confirmed.
