# Firebase Security Rules Deployment

This project includes production rules for room-scoped data:

- Firestore: `firestore.rules`
- Storage: `storage.rules`

## Required Room Document Shape

Each room must have a document at:

```text
rooms/{coupleCode}
```

Add a `members` map keyed by Firebase Auth UID:

```json
{
  "coupleCode": "youngwoo-jaeun",
  "nameA": "영우",
  "nameB": "재은",
  "startDate": 1775583600000,
  "adminPasswordHash": "...",
  "viewerPasswordHash": "...",
  "members": {
    "FIREBASE_AUTH_UID_1": { "role": "admin" },
    "FIREBASE_AUTH_UID_2": { "role": "viewer" }
  }
}
```

Valid roles are `admin` and `viewer`.

## Firestore Rules Summary

- Requires Firebase Auth for all room data.
- Allows room reads only when `request.auth.uid` exists in `rooms/{coupleCode}.members`.
- Allows writes to room subcollections only for `admin` members.
- Protects sensitive room fields from client updates:
  - `members`
  - password hash fields
  - legacy plain password fields
- Covers:
  - `rooms/{coupleCode}`
  - `rooms/{coupleCode}/photos`
  - `rooms/{coupleCode}/memos`
  - `rooms/{coupleCode}/diaries`
  - `rooms/{coupleCode}/calendar`
  - `rooms/{coupleCode}/dailyPrompts`
  - `rooms/{coupleCode}/moods`

## Storage Rules Summary

- Requires Firebase Auth.
- Allows reads from room photo paths only for room members.
- Allows upload/update/delete only for `admin` members.
- Limits uploads to image content under 15 MB.
- Covers:
  - `rooms/{coupleCode}/photos/...`
  - `rooms/{coupleCode}/diaries/...`

## Deploy In Firebase Console

1. Open Firebase Console.
2. Select the project used by this app.
3. Go to Firestore Database > Rules.
4. Paste the contents of `firestore.rules`.
5. Click Publish.
6. Go to Storage > Rules.
7. Paste the contents of `storage.rules`.
8. Click Publish.

## Deploy With Firebase CLI

If Firebase CLI is configured for this project:

```bash
firebase deploy --only firestore:rules,storage
```

## Important Production Note

The client app can only enforce viewer/admin UX. Real write protection comes from these Firebase rules. Before publishing these rules, make sure every active customer room has a correct `members` map, otherwise users will be denied access even if they know the couple code and password.
