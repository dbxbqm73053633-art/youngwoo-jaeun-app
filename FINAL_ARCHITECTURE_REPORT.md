# Final Architecture Report

## Removed Legacy Pieces

- Removed `public/legacy-app.html`; React no longer fetches or parses a legacy visual shell.
- Removed `public/js/index.js`; no public legacy DOM runtime remains.
- Removed `src/hooks/useLegacyShell.ts`; lock, tabs, install banner, header labels, and update UI are now React-owned.
- Removed portal-based mounting, `dangerouslySetInnerHTML`, legacy room window events, and custom shell DOM mutation from `src/App.tsx`.

## Final Architecture Overview

- `src/App.tsx` is the root composition layer.
- `RoomProvider` owns room unlock state, room ID, admin state, loading/error state, and couple config.
- `AppLayout` owns the application shell:
  - `HeaderBar`
  - `MobileTabBar`
  - `InstallBanner`
  - `LockScreen`
  - `ModalProvider`
  - loading fallback for lazy tabs
- Feature tabs are lazy-loaded:
  - `HomeScreen`
  - `MemoScreen`
  - `AlbumScreen`
  - `CalendarScreen`
  - `SettingsScreen`
  - `MusicScreen`
- Album lightbox is lazy-loaded separately through `PhotoModal`.
- Firebase paths remain compatible with existing customer data under `rooms/{roomId}` and existing subcollections.

## Performance Improvements

- Replaced eager feature imports with `React.lazy`.
- Split the photo lightbox into its own async chunk.
- Added Rollup manual chunks for React and Firebase packages:
  - `react-vendor`
  - `firebase-core`
  - `firebase-auth`
  - `firebase-firestore`
  - `firebase-storage`
- The production build no longer emits the Vite chunk-size warning.
- The missing `./css/index.css` warning is fixed by using the Vite base-aware public CSS link.

## PWA Improvements

- `InstallBanner` now owns install prompt state in React.
- Service worker update detection is surfaced as a visible banner with a `새 버전 적용` action.
- `public/sw.js` no longer pre-caches deleted legacy shell/runtime files.
- Cache version updated to `ywjy-shell-v12`.
- Service worker now handles `SKIP_WAITING`, claims clients on activation, and uses network-first behavior for built assets to reduce stale deployments.

## Remaining Technical Debt

- `public/css/index.css` still contains the original visual system and should eventually move under `src` for typed/component-owned styling.
- Some Korean text in existing migrated components remains from the prior source state and should be normalized in a dedicated copy pass, not mixed into architecture cleanup.
- `ThemeSettings` still sets `document.documentElement.dataset.theme` because existing CSS selectors are `html[data-theme]`.
- Image compression still uses an in-memory canvas, which is appropriate for browser-side upload compression but should be covered by device-memory testing.
- No automated browser test suite exists yet for lock, tab switching, upload flows, and PWA update UX.

## Verification

- `npm run build` passed.
- `npm run preview` started successfully at `http://127.0.0.1:4173/`.
- Local HTTP verification returned `200` for `/`.
- Source search confirms no remaining references to:
  - `legacy-app`
  - `public/js/index.js`
  - `useLegacyShell`
  - `dangerouslySetInnerHTML`
  - `createPortal`
  - legacy `ywjy:` room events

## Production Readiness Evaluation

The app is now a production-oriented React/Vite PWA architecture with legacy shell dependencies removed, chunking under control, and React-owned shell state. It is ready for the next production hardening pass: browser automation, Firebase rule validation, accessibility review, and a focused Korean copy/encoding cleanup.
