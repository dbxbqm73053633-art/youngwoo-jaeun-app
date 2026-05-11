import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query, updateDoc, where, type CollectionReference } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import { db, storage } from "../lib/firebase";
import type { PhotoRecord } from "../types";

export function photosCollection(roomId: string): CollectionReference {
  return collection(db, "rooms", roomId, "photos");
}

export function photoDocument(roomId: string, photoId: string) {
  return doc(db, "rooms", roomId, "photos", photoId);
}

export async function listPhotos(roomId: string, album = "__ALL__", maxRows = 1500): Promise<PhotoRecord[]> {
  const base = photosCollection(roomId);
  const request = album === "__ALL__"
    ? query(base, orderBy("createdAt", "desc"), limit(maxRows))
    : query(base, where("album", "==", album), orderBy("createdAt", "desc"), limit(maxRows));
  const snap = await getDocs(request);

  return snap.docs
    .map((item) => {
      const data = item.data();
      return {
        id: item.id,
        album: String(data.album || "기본앨범").trim() || "기본앨범",
        caption: String(data.caption || ""),
        date: typeof data.date === "number" ? data.date : null,
        name: String(data.name || "photo"),
        url: String(data.url || ""),
        storagePath: String(data.storagePath || ""),
        createdAt: typeof data.createdAt === "number" ? data.createdAt : 0,
      };
    })
    .filter((item) => item.url.trim().length > 0);
}

export async function listAlbums(roomId: string, maxRows = 1500): Promise<string[]> {
  const snap = await getDocs(query(photosCollection(roomId), orderBy("createdAt", "desc"), limit(maxRows)));
  const albums = new Set<string>();

  snap.forEach((item) => {
    const data = item.data();
    const hasUrl = typeof data.url === "string" && data.url.trim().length > 0;
    if (!hasUrl) return;
    albums.add(String(data.album || "기본앨범").trim() || "기본앨범");
  });

  return [...albums].sort((a, b) => a.localeCompare(b, "ko"));
}

export async function createPhotoPlaceholder(roomId: string, photo: Omit<PhotoRecord, "id">) {
  return addDoc(photosCollection(roomId), photo);
}

export async function updatePhoto(roomId: string, photoId: string, patch: Partial<PhotoRecord>) {
  await updateDoc(photoDocument(roomId, photoId), patch);
}

export async function deletePhoto(roomId: string, photoId: string) {
  const ref = photoDocument(roomId, photoId);
  const snap = await getDoc(ref);
  const data = snap.exists() ? snap.data() : null;
  const path = typeof data?.storagePath === "string" ? data.storagePath : "";

  if (path) {
    try {
      await deleteObject(storageRef(storage, path));
    } catch {
      // Legacy behavior ignores missing Storage objects and still deletes Firestore metadata.
    }
  }

  await deleteDoc(ref);
}

export async function uploadPhotoBlob(path: string, blob: Blob) {
  const ref = storageRef(storage, path);
  await uploadBytes(ref, blob, { contentType: "image/jpeg" });
  return getDownloadURL(ref);
}
