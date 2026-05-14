import { collection, doc, getDoc, getDocs, limit, orderBy, query, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { logResolvedFirestorePath, resolveRoomDocumentSegments, resolveRoomId, resolvedRoomDocumentPath, resolvedRoomPath } from "./roomService";
import type { DailyPromptRecord } from "../types";

const DAILY_PROMPTS = [
  "오늘 하루 중 나에게 가장 고마웠던 순간은 언제였어?",
  "지금 이 순간, 나에게 해주고 싶은 말 한 줄만 적어볼래?",
  "오늘 나를 생각하며 가장 많이 떠오른 장면은 뭐야?",
  "요즘 우리 관계에서 가장 좋다고 느끼는 점은 뭐야?",
  "처음 만났던 날을 떠올리면 아직도 어떤 감정이 들어?",
  "오늘 나 때문에 웃었던 시간이 있다면 적어줘.",
  "앞으로 우리에게 꼭 이루어졌으면 하는 작은 소원은?",
  "오늘 우리 하루를 색으로 표현하면 어떤 색일까? 이유도 적어줘.",
  "최근 내가 해준 것 중에 네가 좋았던 행동이 있다면?",
  "오늘 하루를 한 문장으로 정리한다면 뭐라고 쓰고 싶어?",
];

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

export function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function simpleHash(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function questionForDate(dateKey: string) {
  return DAILY_PROMPTS[simpleHash(dateKey) % DAILY_PROMPTS.length];
}

export async function getTodayPrompt(roomId: string, key = todayKey()): Promise<DailyPromptRecord> {
  const path = resolvedRoomDocumentPath(roomId, "dailyPrompts", key);
  const segments = resolveRoomDocumentSegments(roomId, "dailyPrompts", key);
  logResolvedFirestorePath("resolved document path", path);
  const ref = doc(db, "rooms", segments.roomId, segments.collectionName, segments.documentId);
  const snap = await getDoc(ref);
  const data = snap.exists() ? snap.data() : {};
  return {
    mine: String(data.mine || ""),
    yours: String(data.yours || ""),
    question: String(data.question || questionForDate(key)),
    updatedAt: typeof data.updatedAt === "number" ? data.updatedAt : 0,
  };
}

export async function saveTodayPrompt(roomId: string, prompt: DailyPromptRecord, key = todayKey()) {
  const path = resolvedRoomDocumentPath(roomId, "dailyPrompts", key);
  const segments = resolveRoomDocumentSegments(roomId, "dailyPrompts", key);
  logResolvedFirestorePath("resolved document path", path);
  await setDoc(doc(db, "rooms", segments.roomId, segments.collectionName, segments.documentId), prompt, { merge: true });
}

export async function getRecentMoods(roomId: string) {
  const cleanRoomId = resolveRoomId(roomId);
  const roomPath = resolvedRoomPath(roomId);
  logResolvedFirestorePath("resolved room path", roomPath);
  const snap = await getDocs(query(collection(db, "rooms", cleanRoomId, "moods"), orderBy("dateKey", "desc"), limit(7)));
  return snap.docs
    .map((item) => ({ id: item.id, ...item.data(), mood: String(item.data().mood || ""), dateKey: String(item.data().dateKey || item.id) }))
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey, "ko"));
}

export async function saveMood(roomId: string, mood: string, key = todayKey()) {
  const path = resolvedRoomDocumentPath(roomId, "moods", key);
  const segments = resolveRoomDocumentSegments(roomId, "moods", key);
  logResolvedFirestorePath("resolved document path", path);
  await setDoc(doc(db, "rooms", segments.roomId, segments.collectionName, segments.documentId), { mood, dateKey: key, updatedAt: Date.now() }, { merge: true });
}
