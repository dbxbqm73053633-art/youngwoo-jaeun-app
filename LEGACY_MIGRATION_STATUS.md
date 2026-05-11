# Legacy Migration Status

## Current Architecture

The app is now a React/Vite shell with feature screens mounted through React portals. The legacy runtime at `src/legacy/index.js` still boots the app, owns several event handlers, and bridges some state to React through custom window events.

Firebase initialization has been moved to `src/lib/firebase.ts`, and feature services/hooks exist under `src/services` and `src/hooks`. The legacy runtime still imports Firestore/Storage helpers directly and still performs many reads/writes.

## Migrated Features

- Home static structure: React-owned components.
- Album tab structure: React-owned components.
- Album gallery grid rendering: React-owned via `usePhotos`.
- Memo tab structure: React-owned components.
- Memo list rendering: React-owned via `useMemos`.
- Calendar tab structure: React-owned components.
- Calendar month grid rendering: React-owned via `useCalendar`.
- Calendar monthly anniversary list rendering: React-owned via `useCalendar`.
- Music UI/playback/lyric active state: React-owned via `useMusic`.
- Settings tab structure: React-owned components.
- Firebase app initialization: shared `src/lib/firebase.ts`.

## Partially Migrated Features

- Auth/unlock:
  - Legacy-owned lock screen and password/session flow.
  - React listens to legacy room events for feature data loading.
- Home counters and summaries:
  - React owns markup.
  - Legacy still mutates D-day, milestone, prompt summary, mood summary, names, and header values.
- Album:
  - React owns gallery grid, paging/count, and delete through service.
  - Legacy still owns upload, album option rebuilding, filter/sort controls, slider rendering, lightbox state/editing, and Storage upload.
- Memo:
  - React owns memo list rendering and card delete.
  - Legacy still owns memo create, clear-all, and today prompt behavior.
- Calendar:
  - React owns month grid, selected visual state, and anniversary list rendering.
  - Legacy still owns editor form population, save/delete, diary photo upload/removal, and selected diary object.
- Music:
  - React owns normal playback state, volume, mini lyric, lyrics panel, and active lyric.
  - Legacy fallback remains but backs off when React-owned elements are present.
- Settings:
  - React owns markup.
  - Legacy still owns basic info save, theme apply, and localStorage theme persistence.
- PWA/install:
  - Fully legacy-owned.

## Fully Legacy-Owned Features

- PWA install banner and `beforeinstallprompt` flow.
- Service worker registration/unregistration.
- Global lock/password screen behavior.
- Tab navigation event wiring.
- Home D-day/milestone timer updates.
- Today prompt form data load/save.
- Mood/notification code paths, if reachable from legacy markup/state.
- Photo upload compression and Firebase Storage upload path.
- Photo slider rendering.
- Photo lightbox data binding, editing, keyboard navigation.
- Diary editor form and diary photo list rendering.
- Admin settings submit handlers.

## Remaining Direct DOM Usage

`src/legacy/index.js` still defines `$ = document.getElementById` and uses it throughout.

Major remaining DOM mutation areas:

- Music fallback: `musicToggle`, `musicVol`, `musicLyricNow`, `lyricsPanel`, `lyricsBody`.
- PWA install banner: `installBar`, `installLater`, `installBtn`.
- Lock screen: `lock`, `lockPass`, `lockForm`, `lockHint`.
- Home: `coupleNameA`, `coupleNameB`, `lockTitle`, `startDateLabel`, `todayLabel`, `dDay`, `headerDDay`, `sinceText`, `hhmmss`, `days`, `hours`, `minutes`, `seconds`, `nextLabel`, `nextValue`, `homePromptSummary`, `homeMoodSummary`.
- Album fallback/control paths: `albumFilter`, `sortMode`, `photoDate`, `photoInput`, `albumName`, `photoCaption`, `photoSlider`, `lightbox`, `lbImg`, `lbAlbum`, `lbDate`, `lbCaptionInput`, `lbSaveHint`.
- Calendar editor: `diaryDate`, `diaryMemo`, `diaryAnniversary`, `diaryPhotos`, `diaryPhotoList`, `diarySaveHint`.
- Memo form: `memoForm`, `memoTitle`, `memoBody`, `clearMemos`.
- Prompt form: `promptDateLabel`, `promptQuestion`, `promptMine`, `promptYours`, `promptSaveHint`, `promptHeart`.
- Admin/settings: `adminNameA`, `adminNameB`, `adminStartDate`, `adminInfoHint`, `themeSelect`, `themeHint`.
- Tab navigation: `.tabbar__btn`, `#tab-home`, `#tab-photos`, `#tab-memo`, `#tab-diary`, `#tab-admin`.

## Remaining `innerHTML` Rendering

Active or fallback `innerHTML` paths remain in `src/legacy/index.js`:

- Lyrics fallback rendering into `#lyricsBody`.
- Album select options via `albumFilter.innerHTML`.
- Photo slider rendering into `#photoSlider`.
- Photo gallery fallback rendering into `#gallery`.
- Diary calendar fallback rendering into `#diaryCalendar`.
- Diary photo list rendering into `#diaryPhotoList`.
- Diary anniversary fallback rendering into `#diaryAnniversaryList`.
- Memo list fallback rendering into `#memoList`.
- Mood graph rendering into `#moodGraph`.

Several fallback renderers now skip when React marks containers with `data-react-render="true"`.

## Remaining Global Events

Legacy dispatches:

- `ywjy:room-ready`
- `ywjy:memos-changed`
- `ywjy:photos-changed`
- `ywjy:calendar-changed`

Legacy listens for:

- `ywjy:open-photo`
- `ywjy:request-photos-refresh`
- `ywjy:select-diary-date`

Browser/global listeners still in legacy:

- `pointerdown` fallback music unlock.
- `beforeinstallprompt`.
- `appinstalled`.
- document `keydown` for lightbox fallback.
- Tab button click handlers.

## Remaining Firebase Operations In Legacy

Legacy still directly calls Firestore/Storage APIs for:

- Room creation/config load/save:
  - `getDoc`, `setDoc` on room document.
- Photo feature:
  - `getDocs` photo list/album options.
  - `addDoc`, `updateDoc`, `deleteDoc` photo metadata.
  - `uploadBytes`, `getDownloadURL`, `deleteObject` Storage operations.
  - Lightbox metadata save.
- Calendar/diary:
  - `getDocs` monthly diary fetch.
  - `setDoc`, `deleteDoc` diary save/delete.
  - `uploadBytes`, `getDownloadURL`, `deleteObject` diary photo operations.
- Memo:
  - `addDoc` create.
  - `getDocs` fallback list/clear.
  - `deleteDoc` clear/delete fallback.
- Daily prompt:
  - `getDoc`, `setDoc`.
- Mood:
  - `setDoc`, `getDocs`, `getDoc`.
- Admin:
  - `setDoc` room config update.

## Remaining Global State In Legacy

- `COUPLE`
- `START`
- `bgmReady`
- `deferredPrompt`
- `roomId`
- album globals: `allRows`, `viewRows`, `currentAlbum`, `sortMode`, `page`, `lbIndex`, `lbPhotoId`
- diary globals: `diaryCursor`, `diaryMonthEntries`, `selectedDiaryKey`, `selectedDiary`, `diaryRemovedPhotos`
- `appInitialized`

## Safest Next Migration Order

1. Move room/auth/unlock state into React context.
   - Replace `roomId` global and `ywjy:room-ready` bridge with a typed provider.
   - Keep the visual lock screen unchanged during the move.

2. Finish Home state migration.
   - Move D-day counter, milestone calculation, names, and prompt/mood summaries into React state.
   - Remove timer DOM mutations and `renderCounter`/`renderMilestones` from legacy.

3. Finish Memo and Prompt.
   - Move memo create/clear into React handlers.
   - Move today prompt load/save into a service and hook.
   - Remove memo fallback `innerHTML`.

4. Finish Album.
   - Move upload/compression into `photoService`/React.
   - Move album filter/sort controls to React state.
   - Move slider rendering to React.
   - Move lightbox edit/save/navigation to React.
   - Then remove album globals and fallback renderers.

5. Finish Calendar.
   - Move diary editor form state/save/delete to React.
   - Move diary photo list and remove handling to React.
   - Move diary photo upload/delete Storage operations into `calendarService`.
   - Remove diary globals and fallback renderers.

6. Finish Settings.
   - Move room config load/save to settings hooks.
   - Move theme state to React/localStorage helper.

7. Move PWA/install and service worker registration.
   - Keep this late because it affects runtime caching and deployment behavior.

8. Remove `src/legacy/index.js` boot orchestration.
   - After all feature handlers and renderers are React-owned, replace `initLegacyApp` with React providers/effects.
   - Keep `public/legacy-app.html` only until no longer needed for markup extraction.

## Current Risk Notes

- The app still depends on legacy initialization order for auth, room id, and some feature data.
- React and legacy share some DOM IDs intentionally during migration.
- Firebase SDK npm bundling creates a large JS chunk; code splitting should be addressed after feature ownership is clearer.
- Service worker cache paths still reference legacy public assets and should not be changed until PWA migration.
