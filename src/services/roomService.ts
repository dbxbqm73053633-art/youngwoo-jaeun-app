import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { RoomConfig } from "../types";

const DEFAULT_CONFIG: RoomConfig = {
  nameA: "영우",
  nameB: "재은",
  startDate: new Date(2026, 3, 8, 0, 0, 0).getTime(),
};

export async function makeRoomId(pass: string) {
  const enc = new TextEncoder().encode(`room:${pass}`);
  const hash = await crypto.subtle.digest("SHA-256", enc);
  const hex = [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return hex.slice(0, 24);
}

export function roomDocument(roomId: string) {
  return doc(db, "rooms", roomId);
}

export async function ensureRoomDoc(roomId: string) {
  const ref = roomDocument(roomId);
  const snap = await getDoc(ref);
  if (snap.exists()) return;

  await setDoc(ref, {
    createdAt: serverTimestamp(),
    hint: "No-auth room. Shared by password(roomKey).",
    ...DEFAULT_CONFIG,
  });
}

export async function getRoomConfig(roomId: string): Promise<RoomConfig> {
  const snap = await getDoc(roomDocument(roomId));
  if (!snap.exists()) return DEFAULT_CONFIG;

  const data = snap.data();
  return {
    nameA: String(data.nameA || DEFAULT_CONFIG.nameA),
    nameB: String(data.nameB || DEFAULT_CONFIG.nameB),
    startDate: typeof data.startDate === "number" ? data.startDate : DEFAULT_CONFIG.startDate,
    createdAt: data.createdAt,
  };
}

export async function saveRoomConfig(roomId: string, config: RoomConfig) {
  await setDoc(roomDocument(roomId), {
    nameA: config.nameA,
    nameB: config.nameB,
    startDate: config.startDate,
  }, { merge: true });
}

export { DEFAULT_CONFIG };
