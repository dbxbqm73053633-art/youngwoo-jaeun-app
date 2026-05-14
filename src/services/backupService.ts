import { collection, getDoc, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { logResolvedFirestorePath, resolveRoomId, roomDocument, resolvedRoomPath } from "./roomService";

export async function exportRoomBackup(roomId: string) {
  const cleanRoomId = resolveRoomId(roomId);
  const roomPath = resolvedRoomPath(roomId);
  logResolvedFirestorePath("resolved room path", roomPath);
  const [roomSnap, memosSnap, diariesSnap] = await Promise.all([
    getDoc(roomDocument(roomId)),
    getDocs(collection(db, "rooms", cleanRoomId, "memos")),
    getDocs(collection(db, "rooms", cleanRoomId, "diaries")),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    roomId,
    roomConfig: roomSnap.exists() ? roomSnap.data() : null,
    memos: memosSnap.docs.map((item) => ({ id: item.id, ...item.data() })),
    calendar: diariesSnap.docs.map((item) => ({ id: item.id, ...item.data() })),
  };
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
