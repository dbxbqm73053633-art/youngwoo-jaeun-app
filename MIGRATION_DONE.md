# Migration Done

## Changed Files

- `src/App.tsx`
- `src/contexts/RoomContext.tsx`
- `src/hooks/useHomeData.ts`
- `src/hooks/useLegacyShell.ts`
- `src/hooks/usePhotos.ts`
- `src/services/roomService.ts`
- `src/services/dailyService.ts`
- `src/services/pwaService.ts`
- `src/services/photoService.ts`
- `src/services/calendarService.ts`
- `src/features/home/HomeScreen.tsx`
- `src/features/album/AlbumScreen.tsx`
- `src/features/calendar/CalendarScreen.tsx`
- `src/components/home/AnniversaryCards.tsx`
- `src/components/home/DDaySection.tsx`
- `src/components/home/HeroSection.tsx`
- `src/components/home/TodaySummary.tsx`
- `src/components/memo/MemoForm.tsx`
- `src/components/memo/MemoList.tsx`
- `src/components/memo/MemoToolbar.tsx`
- `src/components/memo/TodayPromptCard.tsx`
- `src/components/album/AlbumToolbar.tsx`
- `src/components/album/PhotoModal.tsx`
- `src/components/calendar/CalendarEventForm.tsx`
- `src/components/calendar/CalendarGrid.tsx`
- `src/components/calendar/CalendarHeader.tsx`
- `src/components/settings/CoupleSettingsForm.tsx`
- `src/components/settings/ThemeSettings.tsx`
- Removed `src/legacy/index.js`
- Removed `src/legacy/index.d.ts`

## Completed

- Added React room/auth context for `roomId`, couple config, unlock/admin state, and loading/error state.
- Removed the React app dependency on legacy boot orchestration and legacy room events.
- Moved home D-day, milestone, header D-day, prompt summary, and mood summary into React state.
- Moved memo create/delete/clear into React using `memoService` and `useMemos`.
- Moved album upload, compression, Storage upload, filtering, sorting, paging, slider, lightbox edit, and delete into React.
- Moved calendar selected date, memo, anniversary text, diary photo upload/removal, save, and delete into React.
- Moved couple settings and theme selection into React.
- Moved PWA install handling and service worker registration/update detection into React utilities.

## Remaining Risks

- `public/legacy-app.html` remains the visual shell during this migration step, so `src/App.tsx` still parses that HTML and mounts React portals into it.
- `src/hooks/useLegacyShell.ts` still bridges shell-only DOM nodes for lock visibility, tab activation, app install banner, and header labels. These can be removed after the shell markup is rebuilt as normal React components.
- `public/js/index.js` is preserved as a public legacy asset for compatibility, but the React app no longer imports `src/legacy/index.js`.
- Firebase rules and Storage permissions were not changed. Upload/save behavior still depends on the existing production Firebase configuration.

## Build

- `npm run build` passed.
- Vite warnings remain:
  - `./css/index.css` does not exist at build time and is left for runtime resolution.
  - One chunk is larger than 500 kB after minification.
