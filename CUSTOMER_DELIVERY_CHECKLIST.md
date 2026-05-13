# Customer Delivery Checklist

## Build Command

```bash
npm run build
```

## Preview Command

```bash
npm run preview
```

Default local preview URL:

```text
http://127.0.0.1:4173/
```

## Deployment Checklist

- Set all required environment variables before building.
- Run `npm run build` and confirm there are no TypeScript or Vite warnings.
- Deploy the full `dist/` folder.
- Confirm `manifest.webmanifest`, `sw.js`, `icons/`, `images/`, `music/`, and `css/index.css` are reachable after deployment.
- Open the deployed URL in a clean browser profile and verify the lock screen appears.
- After deployment, refresh once and confirm the service worker does not serve stale assets.

## Firebase Setup Checklist

- Create or select the customer Firebase project.
- Enable Anonymous Authentication.
- Create Firestore database.
- Enable Firebase Storage.
- Configure Firestore and Storage rules for the room data model.
- Set these environment variables:
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_STORAGE_BUCKET`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - `VITE_FIREBASE_APP_ID`
  - `VITE_FIREBASE_MEASUREMENT_ID`
  - `VITE_ROOM_PASSWORD`
- Keep `VITE_ROOM_PASSWORD` unchanged for existing customers unless intentionally creating a new room.

## PWA Install Test Checklist

- Open the production URL on Android Chrome and confirm install prompt behavior.
- Install to home screen.
- Launch from home screen and confirm lock screen, tabs, music, and media assets load.
- Deploy a new build and confirm the `새 버전 적용` update banner appears.
- Tap `새 버전 적용` and confirm the app reloads into the new build.
- Test offline reload after one successful online load.

## Customer Customization Checklist

- Set customer Firebase environment variables.
- Set the customer room password in `VITE_ROOM_PASSWORD`.
- Update customer names and start date through the admin/settings screen.
- Replace customer images only through approved public asset paths.
- Replace music only if the file path and service worker cache list are updated together.
- Verify all Korean text after customization.

## Known Remaining Risks

- Firebase rules are not validated by this repo; production delivery depends on correct Firebase project rules.
- Browser-side image compression depends on device memory for very large uploads.
- Existing customer room data is tied to the password-derived room ID. Changing `VITE_ROOM_PASSWORD` creates a different room.
- The visual CSS still lives in `public/css/index.css`; a future pass can migrate it into component-owned source CSS.
