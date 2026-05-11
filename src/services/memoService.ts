import { addDoc, collection, deleteDoc, doc, getDocs, limit, orderBy, query, type CollectionReference } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { MemoRecord } from "../types";

export function memosCollection(roomId: string): CollectionReference {
  return collection(db, "rooms", roomId, "memos");
}

export function memoDocument(roomId: string, memoId: string) {
  return doc(db, "rooms", roomId, "memos", memoId);
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
