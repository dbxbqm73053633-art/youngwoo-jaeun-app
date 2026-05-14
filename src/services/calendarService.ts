import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, where, type CollectionReference } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import { db, storage } from "../lib/firebase";
import { logResolvedFirestorePath, resolveRoomDocumentSegments, resolveRoomId, resolvedRoomDocumentPath, resolvedRoomPath } from "./roomService";
import type { DiaryEntry, DiaryPhoto } from "../types";

export function diariesCollection(roomId: string): CollectionReference {
  const cleanRoomId = resolveRoomId(roomId);
  const roomPath = resolvedRoomPath(roomId);
  logResolvedFirestorePath("resolved room path", roomPath);
  return collection(db, "rooms", cleanRoomId, "diaries");
}

export function diaryDocument(roomId: string, dateKey: string) {
  const path = resolvedRoomDocumentPath(roomId, "diaries", dateKey);
  const segments = resolveRoomDocumentSegments(roomId, "diaries", dateKey);
  logResolvedFirestorePath("resolved document path", path);
  return doc(db, "rooms", segments.roomId, segments.collectionName, segments.documentId);
}

export async function listDiaryMonth(roomId: string, monthKey: string): Promise<DiaryEntry[]> {
  // Match the previous legacy query shape exactly. Adding orderBy here can require
  // a composite Firestore index and cause existing diary data to disappear.
  const snap = await getDocs(query(diariesCollection(roomId), where("monthKey", "==", monthKey)));

  return snap.docs.map((item) => {
    const data = item.data();
    const photos = Array.isArray(data.photos) ? data.photos : [];
    return {
      id: item.id,
      dateKey: String(data.dateKey || item.id),
      dateTs: typeof data.dateTs === "number" ? data.dateTs : 0,
      monthKey: String(data.monthKey || monthKey),
      memo: String(data.memo || ""),
      anniversary: String(data.anniversary || ""),
      photos: photos.map((photo) => ({
        url: String(photo?.url || ""),
        storagePath: String(photo?.storagePath || ""),
        name: String(photo?.name || "photo"),
        createdAt: typeof photo?.createdAt === "number" ? photo.createdAt : 0,
      })),
      updatedAt: typeof data.updatedAt === "number" ? data.updatedAt : 0,
    };
  }).sort((a, b) => a.dateKey.localeCompare(b.dateKey, "ko"));
}

export async function saveDiary(roomId: string, dateKey: string, entry: DiaryEntry) {
  await setDoc(diaryDocument(roomId, dateKey), entry, { merge: true });
}

export async function deleteDiary(roomId: string, dateKey: string) {
  const ref = diaryDocument(roomId, dateKey);
  const snap = await getDoc(ref);
  const data = snap.exists() ? snap.data() : {};
  const photos = Array.isArray(data.photos) ? data.photos : [];
  await Promise.all(photos.map((photo) => deleteDiaryPhoto({ storagePath: String(photo?.storagePath || "") })));
  await deleteDoc(ref);
}

export async function uploadDiaryPhoto(roomId: string, dateKey: string, photoId: string, blob: Blob): Promise<DiaryPhoto> {
  const path = `rooms/${resolveRoomId(roomId)}/diaries/${dateKey}/${photoId}.jpg`;
  const ref = storageRef(storage, path);
  await uploadBytes(ref, blob, { contentType: "image/jpeg" });

  return {
    url: await getDownloadURL(ref),
    storagePath: path,
    name: "photo",
    createdAt: Date.now(),
  };
}

export async function deleteDiaryPhoto(photo: Pick<DiaryPhoto, "storagePath">) {
  if (!photo.storagePath) return;
  try {
    await deleteObject(storageRef(storage, photo.storagePath));
  } catch {
    // Preserve legacy behavior: missing Storage files should not block diary updates.
  }
}
