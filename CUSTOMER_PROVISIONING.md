# Customer Provisioning

This app includes a lightweight platform-owner-only customer creation tool in:

```text
관리자 모드 > 고객 방 생성
```

## What It Creates

The tool creates a new Firestore room:

```text
rooms/{coupleCode}
```

Room fields:

```json
{
  "coupleCode": "couple-xxxxxxxx",
  "nameA": "영우",
  "nameB": "재은",
  "startDate": 1775583600000,
  "adminPasswordHash": "...",
  "viewerPasswordHash": "...",
  "members": {
    "PROVISIONER_FIREBASE_UID": {
      "role": "admin",
      "provisioner": true,
      "createdAt": 1770000000000
    }
  },
  "settings": {
    "theme": "romance"
  }
}
```

Generated customer credentials:

```text
app URL: https://your-app.example/
coupleCode: couple-xxxxxxxx
admin password: generated-admin-password
viewer password: generated-viewer-password
```

Only password hashes are stored in Firestore. Plain generated passwords are shown once in the admin UI so they can be copied and delivered to the customer.

## Admin Delivery Checklist

1. Open `관리자 모드`.
2. Use `고객 방 생성`.
3. Copy the generated customer summary.
4. Send the app URL, couple code, admin password, and viewer password to the customer.
5. Export a backup later from `백업 / 복구 > 백업 내보내기` when needed.

## Duplicate Prevention

The provisioning helper checks whether `rooms/{coupleCode}` already exists before writing. If an auto-generated code collides, it retries with a new code.

## systemAdmin Setup

To allow this client-side provisioning utility, create a Firestore document:

```text
systemAdmins/{firebaseAuthUid}
```

The document can contain any marker fields, for example:

```json
{
  "enabled": true,
  "label": "internal admin"
}
```

Only UIDs listed under `systemAdmins` can see the provisioning UI and create new room documents. Room-level `admin` users can still manage their own room, but they cannot access customer provisioning or see generated delivery credentials. For higher security, replace this client-side utility with a Cloud Function using the Firebase Admin SDK.

## Customer Login Note

The generated room contains the provisioner as the initial admin member. For strict member-based Firestore rules, add each customer's Firebase Auth UID to:

```text
rooms/{coupleCode}.members
```

with role `admin` or `viewer`, or implement a trusted Cloud Function that grants membership after password validation.
