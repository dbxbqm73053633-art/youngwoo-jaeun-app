import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query, updateDoc, where, type CollectionReference } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref as storageRef, uploadBytesResumable } from "firebase/storage";
import { db, storage } from "../lib/firebase";
import { logResolvedFirestorePath, resolveRoomDocumentSegments, resolveRoomId, resolvedRoomDocumentPath, resolvedRoomPath } from "./roomService";
import type { PhotoRecord } from "../types";

const MAX_UPLOAD_BYTES = 40 * 1024 * 1024;
const MAIN_IMAGE_LONG_SIDE = 1800;
const THUMB_IMAGE_LONG_SIDE = 520;
const MAIN_JPG_QUALITY = 0.86;
const THUMB_JPG_QUALITY = 0.78;
const DEFAULT_ALBUM = "기본앨범";

export type PhotoUploadProgress = {
  fileIndex: number;
  fileCount: number;
  fileName: string;
  phase: "compressing" | "uploading" | "saving";
  progress: number;
};

type OptimizedImageSet = {
  main: Blob;
  thumbnail: Blob;
};

export function photosCollection(roomId: string): CollectionReference {
  const cleanRoomId = resolveRoomId(roomId);
  const roomPath = resolvedRoomPath(roomId);
  logResolvedFirestorePath("resolved room path", roomPath);
  return collection(db, "rooms", cleanRoomId, "photos");
}

export function photoDocument(roomId: string, photoId: string) {
  const path = resolvedRoomDocumentPath(roomId, "photos", photoId);
  const segments = resolveRoomDocumentSegments(roomId, "photos", photoId);
  logResolvedFirestorePath("resolved document path", path);
  return doc(db, "rooms", segments.roomId, segments.collectionName, segments.documentId);
}

function normalizeAlbum(value: unknown) {
  return String(value || DEFAULT_ALBUM).trim() || DEFAULT_ALBUM;
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
        album: normalizeAlbum(data.album),
        caption: String(data.caption || ""),
        date: typeof data.date === "number" ? data.date : null,
        memo: String(data.memo || ""),
        name: String(data.name || "photo"),
        url: String(data.url || ""),
        thumbnailUrl: String(data.thumbnailUrl || ""),
        storagePath: String(data.storagePath || ""),
        createdAt: typeof data.createdAt === "number" ? data.createdAt : 0,
        order: typeof data.order === "number" ? data.order : undefined,
        isCover: Boolean(data.isCover),
      } satisfies PhotoRecord;
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
    albums.add(normalizeAlbum(data.album));
  });

  return [...albums].sort((a, b) => a.localeCompare(b, "ko"));
}

export async function createPhotoPlaceholder(roomId: string, photo: Omit<PhotoRecord, "id">) {
  return addDoc(photosCollection(roomId), photo);
}

export async function updatePhoto(roomId: string, photoId: string, patch: Partial<PhotoRecord>) {
  await updateDoc(photoDocument(roomId, photoId), patch);
}

export async function setPhotoAsCover(roomId: string, photoId: string) {
  const snap = await getDocs(query(photosCollection(roomId), where("isCover", "==", true), limit(50)));
  await Promise.all(snap.docs.map((item) => updateDoc(item.ref, { isCover: false })));
  await updateDoc(photoDocument(roomId, photoId), { isCover: true });
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
      // Existing customer records can point at missing Storage files; Firestore cleanup should still finish.
    }
    try {
      await deleteObject(storageRef(storage, thumbnailPathFromMainPath(path)));
    } catch {
      // Older records may not have a separate thumbnail file.
    }
  }

  await deleteDoc(ref);
}

function uploadPhotoBlob(path: string, blob: Blob, onProgress?: (progress: number) => void) {
  const ref = storageRef(storage, path);
  const task = uploadBytesResumable(ref, blob, {
    contentType: "image/jpeg",
    cacheControl: "public,max-age=31536000,immutable",
  });

  return new Promise<string>((resolve, reject) => {
    task.on("state_changed", (snapshot) => {
      const progress = snapshot.totalBytes ? snapshot.bytesTransferred / snapshot.totalBytes : 0;
      onProgress?.(progress);
    }, reject, async () => {
      resolve(await getDownloadURL(ref));
    });
  });
}

function humanName(filename: string) {
  if (!filename) return "photo";
  const base = filename.replace(/\.[^/.]+$/, "");
  return base.length > 18 ? `${base.slice(0, 18)}...` : base;
}

export function fromISODateInputValue(value: string) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, 0, 0, 0).getTime();
}

export function toISODateInputValue(tsOrDate: number | Date) {
  const date = tsOrDate instanceof Date ? tsOrDate : new Date(tsOrDate);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function formatPhotoDate(ts: number | null | undefined) {
  if (!ts) return "날짜 없음";
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric" }).format(new Date(ts));
}

function thumbnailPathFromMainPath(path: string) {
  return path.replace(/\.jpg$/i, "_thumb.jpg");
}

async function drawToJpeg(bitmap: ImageBitmap, longSide: number, quality: number): Promise<Blob> {
  const scale = Math.min(1, longSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");
  ctx.drawImage(bitmap, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Image compression failed"));
    }, "image/jpeg", quality);
  });
}

export async function fileToOptimizedJpegs(file: File): Promise<OptimizedImageSet> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Image file is too large");
  }
  const bitmap = await createImageBitmap(file);
  try {
    const [main, thumbnail] = await Promise.all([
      drawToJpeg(bitmap, MAIN_IMAGE_LONG_SIDE, MAIN_JPG_QUALITY),
      drawToJpeg(bitmap, THUMB_IMAGE_LONG_SIDE, THUMB_JPG_QUALITY),
    ]);
    return { main, thumbnail };
  } finally {
    bitmap.close();
  }
}

export async function uploadPhotoFile(
  roomId: string,
  file: File,
  metadata: Pick<PhotoRecord, "album" | "caption" | "date">,
  progress?: {
    fileIndex: number;
    fileCount: number;
    onProgress?: (progress: PhotoUploadProgress) => void;
  },
) {
  progress?.onProgress?.({
    fileIndex: progress.fileIndex,
    fileCount: progress.fileCount,
    fileName: file.name,
    phase: "compressing",
    progress: 0,
  });
  const now = Date.now();
  const docRef = await createPhotoPlaceholder(roomId, {
    album: metadata.album,
    caption: metadata.caption,
    date: metadata.date,
    memo: "",
    name: humanName(file.name),
    createdAt: now,
    order: now,
    isCover: false,
    url: "",
    thumbnailUrl: "",
    storagePath: "",
  });
  const path = `rooms/${resolveRoomId(roomId)}/photos/${docRef.id}.jpg`;
  const thumbPath = thumbnailPathFromMainPath(path);

  try {
    const optimized = await fileToOptimizedJpegs(file);
    progress?.onProgress?.({
      fileIndex: progress.fileIndex,
      fileCount: progress.fileCount,
      fileName: file.name,
      phase: "uploading",
      progress: 0,
    });
    const thumbUrl = await uploadPhotoBlob(thumbPath, optimized.thumbnail, (value) => {
      progress?.onProgress?.({
        fileIndex: progress.fileIndex,
        fileCount: progress.fileCount,
        fileName: file.name,
        phase: "uploading",
        progress: value * 0.35,
      });
    });
    const url = await uploadPhotoBlob(path, optimized.main, (value) => {
      progress?.onProgress?.({
        fileIndex: progress.fileIndex,
        fileCount: progress.fileCount,
        fileName: file.name,
        phase: "uploading",
        progress: 0.35 + value * 0.65,
      });
    });
    progress?.onProgress?.({
      fileIndex: progress.fileIndex,
      fileCount: progress.fileCount,
      fileName: file.name,
      phase: "saving",
      progress: 1,
    });
    await updateDoc(docRef, { url, thumbnailUrl: thumbUrl, storagePath: path });
  } catch (error) {
    try {
      await deleteDoc(docRef);
    } catch {
      // Preserve upload behavior: cleanup is best-effort.
    }
    throw error;
  }
}
