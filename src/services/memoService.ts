import { addDoc, collection, deleteDoc, doc, getDocs, limit, orderBy, query, type CollectionReference } from "firebase/firestore";
import { db } from "../lib/firebase";
import { logResolvedFirestorePath, resolveRoomDocumentSegments, resolveRoomId, resolvedRoomDocumentPath, resolvedRoomPath } from "./roomService";
import type { MemoRecord } from "../types";

export function memosCollection(roomId: string): CollectionReference {
  const cleanRoomId = resolveRoomId(roomId);
  const roomPath = resolvedRoomPath(roomId);
  logResolvedFirestorePath("resolved room path", roomPath);
  return collection(db, "rooms", cleanRoomId, "memos");
}

export function memoDocument(roomId: string, memoId: string) {
  const path = resolvedRoomDocumentPath(roomId, "memos", memoId);
  const segments = resolveRoomDocumentSegments(roomId, "memos", memoId);
  logResolvedFirestorePath("resolved document path", path);
  return doc(db, "rooms", segments.roomId, segments.collectionName, segments.documentId);
}

export async function listMemos(roomId: string, maxRows = 100): Promise<MemoRecord[]> {
  const snap = await getDocs(query(memosCollection(roomId), orderBy("createdAt", "desc"), limit(maxRows)));

  return snap.docs.map((item) => {
    const data = item.data();
    return {
      id: item.id,
      title: String(data.title || ""),
      body: String(data.body || ""),
      createdAt: typeof data.createdAt === "number" ? data.createdAt : 0,
    };
  });
}

export async function addMemo(roomId: string, memo: Omit<MemoRecord, "id">) {
  return addDoc(memosCollection(roomId), memo);
}

export async function deleteMemo(roomId: string, memoId: string) {
  await deleteDoc(memoDocument(roomId, memoId));
}

export async function clearMemos(roomId: string) {
  const snap = await getDocs(memosCollection(roomId));
  await Promise.all(snap.docs.map((item) => deleteDoc(item.ref)));
}
