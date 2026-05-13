# Photo UX Report

## Album Experience

- Changed the photo tab to a grid-first memory gallery so uploaded photos are the primary view.
- Added album filter chips with Korean labels and a clearer sorting control for `최신순`, `오래된순`, and `직접정렬`.
- Kept the upload action prominent at the top and added clearer empty-state upload guidance.
- Added lazy thumbnail rendering with skeleton-style placeholders and preserved existing uploaded photo URLs.

## Lightbox Experience

- Expanded the mobile-first fullscreen viewer with swipe left/right navigation.
- Added pinch/zoom support on touch devices and Ctrl/Cmd wheel zoom on desktop.
- Shows album name, photo date, caption, and memo.
- Added close, previous, next, delete, download, and `대표사진으로 설정` actions.
- Memo, caption, album, and date edits save back to the existing Firestore photo document.

## Memory Replay

- Added `추억 재생하기` cinematic replay mode for the currently selected album/filter.
- Supports auto-play, pause/resume, previous/next navigation, progress bar, and soft fade transitions.
- Uses the app's current audio state passively; it does not stop or replace background music.
- Adds elegant Korean captions using album/date/caption/memo data with a fallback emotional message.

## Management Mode

- Added multi-select management mode.
- Added selected photo delete confirmation.
- Added selected album move/edit via album-name prompt.
- Added simple custom order support through optional `order` metadata and a `맨 앞으로` action.
- Added optional `isCover`, `memo`, `thumbnailUrl`, and `order` fields without requiring old records to have them.

## Firebase Compatibility

- Firestore paths remain unchanged: `rooms/{roomId}/photos/{photoId}`.
- Existing records continue to load because all new fields are optional and have safe fallbacks.
- Existing Storage paths and deletion behavior remain compatible.

## Performance Notes

- Grid images use `loading="lazy"` and `decoding="async"`.
- Lightbox and replay use the full-size image only when the viewer is opened.
- New uploads still use the existing client-side JPEG compression flow.
- True separate thumbnail generation is prepared through `thumbnailUrl`, but current uploads store the compressed image URL as both `url` and `thumbnailUrl` until a dedicated thumbnail pipeline is added.

## Verification

- `npm run build` completed successfully.
- No Vite chunk-size warning was emitted.
