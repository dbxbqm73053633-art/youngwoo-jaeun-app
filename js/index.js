/* ===============================
   영우 ♡ 재은 - V2 탭 구조 전면 개편
   =============================== */

/* ---------- Lock / Room ---------- */
const PASSWORD = "0408";
const SESSION_KEY = "ywjy_unlocked_v3";

/* ---------- 기본 커플 정보 (관리자에서 덮어씀) ---------- */
let COUPLE = {
  nameA: "영우",
  nameB: "재은",
};

/* ---------- 기본 시작일 (관리자에서 덮어씀) ---------- */
let START = new Date(2026, 3, 8, 0, 0, 0);

/* ---------- Milestones ---------- */
const MILESTONES = [
  { days: 100, name: "100일 (우리, 꽤 멋지게 여기까지)" },
  { days: 200, name: "200일 (서로에게 더 편해진 날)" },
  { days: 365, name: "1주년 (처음부터 지금까지, 너라서)" },
  { days: 500, name: "500일 (사랑은 오늘도 진행 중)" },
  { days: 730, name: "2주년 (익숙함 속 설렘)" },
  { days: 1000, name: "1000일 (우리만의 전설)" },
];

/* ---------- Gallery Options ---------- */
const MAX_IMAGE_LONG_SIDE = 1600;
const JPG_QUALITY = 0.86;
const PAGE_SIZE = 12;
const MAX_LOAD_ALL = 1500;

/* ---------- Daily Prompt 리스트 ---------- */
const DAILY_PROMPTS = [
  "오늘 하루 중, 너에게 가장 고마웠던 순간은 언제였어?",
  "지금 이 순간, 나에게 해주고 싶은 말 한 줄만 적어볼래?",
  "오늘 너를 생각하며 가장 많이 떠올린 장면은 뭐야?",
  "요즘 우리 관계에서 가장 좋다고 느끼는 점은 뭐야?",
  "처음 만났던 날을 떠올리면 아직도 어떤 감정이 들어?",
  "오늘 나 때문에 웃었던 순간이 있다면 적어줘.",
  "앞으로 우리에게 꼭 이루어졌으면 하는 작은 소원은?",
  "오늘 우리 둘을 색으로 표현하면 어떤 색일까? 이유도 적어줘.",
  "최근에 내가 해준 것 중에 은근 좋았던 행동이 있다면?",
  "오늘 하루를 한 단어로 정리한다면 뭐라고 적고 싶어?"
];

/* ===============================
   Firebase
   =============================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
  getStorage,
  ref as sRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

// 🔐 Firebase Auth (Anonymous login for Firestore rules)
import {
  getAuth,
  signInAnonymously
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

/* ✅ 네 프로젝트 설정 그대로 */
const firebaseConfig = {
  apiKey: "AIzaSyDvno110yawAqkbYd5pSOVTquDJY5ILjLc",
  authDomain: "couple-youngwoo-jisun-20260205.firebaseapp.com",
  projectId: "couple-youngwoo-jisun-20260205",
  storageBucket: "couple-youngwoo-jisun-20260205.firebasestorage.app",
  messagingSenderId: "365911720629",
  appId: "1:365911720629:web:3f30f8c9ed33b53fbaf4fc",
  measurementId: "G-HE01FBT363"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

async function ensureAuth() {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
}

/* ===============================
   Utils
   =============================== */
const $ = (id) => document.getElementById(id);
const week = ["일", "월", "화", "수", "목", "금", "토"];
const pad2 = (n) => String(n).padStart(2, "0");

function fmtDate(d) {
  if (!(d instanceof Date)) d = new Date(d);
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}.${m}.${day} (${week[d.getDay()]})`;
}
function fmtDateShort(d) {
  if (!(d instanceof Date)) d = new Date(d);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${m}/${day}`;
}
function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function toISODateInputValue(tsOrDate) {
  if (!tsOrDate) return "";
  const d = tsOrDate instanceof Date ? tsOrDate : new Date(tsOrDate);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function fromISODateInputValue(v) {
  if (!v) return null;
  const [y, m, d] = v.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 0, 0, 0).getTime();
}
function humanName(filename) {
  if (!filename) return "photo";
  const base = filename.replace(/\.[^/.]+$/, "");
  return base.length > 18 ? base.slice(0, 18) + "…" : base;
}
function normalizePass(v) { return String(v || "").trim(); }
function normalizeAlbum(v) {
  const t = String(v || "").trim();
  return t ? t : "기본앨범";
}
function safeAlert(msg, err) {
  console.error(msg, err);
  alert(`${msg}\n\n${err?.message || String(err)}`);
}
function hasValidUrl(data) {
  const url = String(data?.url || "").trim();
  return url.length > 0;
}
function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}-${m}-${day}`;
}
function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

/* ===============================
   🎵 Background Music
   =============================== */
// 🎵 Background Music
let bgmReady = false;
function setMusicUI(isPlaying) {
  const btn = $("musicToggle");
  const bar = document.querySelector(".music");
  if (!btn) return;

  // 상태 값을 data-state 로만 저장
  btn.dataset.state = isPlaying ? "playing" : "paused";
  btn.setAttribute(
    "aria-label",
    isPlaying ? "배경음악 일시정지" : "배경음악 재생"
  );

  if (bar) {
    bar.classList.toggle("music--playing", isPlaying);
  }
}
async function tryPlayBgm() {
  const audio = $("bgm");
  if (!audio) return;
  audio.volume = Number($("musicVol")?.value ?? 0.6);
  try {
    await audio.play();
    bgmReady = true;
    setMusicUI(true);
  } catch {
    setMusicUI(false);
  }
}
function pauseBgm() {
  const audio = $("bgm");
  if (!audio) return;
  audio.pause();
  setMusicUI(false);
}
function initBgm() {
  const audio = $("bgm");
  if (!audio) return;

  $("musicVol")?.addEventListener("input", () => {
    audio.volume = Number($("musicVol").value);
  });

  $("musicToggle")?.addEventListener("click", async () => {
  const audio = $("bgm");
  if (!audio) return;

  if (audio.paused) {
    await tryPlayBgm();     // 안에서 setMusicUI(true) 호출
  } else {
    pauseBgm();             // 안에서 setMusicUI(false) 호출
  }
});

  const unlockOnce = async () => {
    if (bgmReady) return;
    await tryPlayBgm();
  };
  window.addEventListener("pointerdown", unlockOnce, { once: true });

  setMusicUI(false);
}

/* ===============================
   🎵 Lyrics Panel + Sync
   =============================== */

// 줄 단위 타임라인 (초 단위)
const LYRICS = [
  { time: 15.160, text: "[Verse 1]", tag: true },
  { time: 15.160, text: "아침 햇살보다 네가 먼저 떠올라" },
  { time: 22.978, text: "잠든 네 손끝이 내 하루를 깨워" },
  { time: 29.893, text: "작은 네 웃음 하나 내 맘을 다 적셔와" },
  { time: 35.585, text: "말없이 안아도 다 전해지는 걸" },

  { time: 44.102, text: "[Pre-Chorus]", tag: true },
  { time: 44.102, text: "세상은 늘 바빠도 나는 멈춰 서서" },
  { time: 51.701, text: "너 하나만 보게 돼 그게 내 진심이야" },
  { time: 59.015, text: "조금 서툴러도 내 사랑은 선명해" },
  { time: 65.146, text: "이름만 불러도 가슴이 벅차올라" },

  { time: 73.607, text: "[Chorus]", tag: true },
  { time: 73.607, text: "재은아, 내 사랑" },
  { time: 78.430, text: "너를 꼭 안을게" },
  { time: 82.819, text: "재은아, 내 세상" },
  { time: 88.245, text: "너만 있으면 돼" },
  { time: 92.313, text: "네가 웃는 순간 난 다 괜찮아져" },
  { time: 102.686, text: "재은아, 내 사랑" },
  { time: 106.941, text: "영원히 널 지킬게" },

  { time: 110.598, text: "[Verse 2]", tag: true },
  { time: 110.598, text: "비가 오는 날도 네 목소린 햇살 같아" },
  { time: 119.680, text: "한참 지친 밤에도 넌 내 길이 돼" },
  { time: 124.149, text: "투정 부린 내 말도 다 받아준 네 마음" },
  { time: 135.558, text: "그 다정한 온도에 나도 물들어가" },

  { time: 142.609, text: "[Pre-Chorus]", tag: true },
  { time: 142.609, text: "아무 말 안 해도 널 알 수 있어 난" },
  { time: 150.039, text: "눈빛 하나만으로 서로를 안아" },
  { time: 154.281, text: "흔들리는 세상 속 내 편은 너 하나" },
  { time: 164.720, text: "이름만 불러도 모든 게 괜찮아" },

  { time: 171.759, text: "[Chorus]", tag: true },
  { time: 171.759, text: "재은아, 내 사랑" },
  { time: 176.649, text: "너를 꼭 안을게" },
  { time: 180.877, text: "재은아, 내 세상" },
  { time: 183.032, text: "너만 있으면 돼" },
  { time: 190.611, text: "네가 웃는 순간 난 다 괜찮아져" },
  { time: 200.824, text: "재은아, 내 사랑" },
  { time: 205.079, text: "영원히 널 지킬게" },

  { time: 209.724, text: "[Bridge]", tag: true },
  { time: 209.724, text: "혹시 멀어지는 날이 와도" },
  { time: 213.669, text: "내 마음은 여기 있어" },
  { time: 215.903, text: "수많은 계절이 지나도" },
  { time: 220.532, text: "널 처음처럼 사랑할게" },

  { time: 226.243, text: "[Final Chorus]", tag: true },
  { time: 226.243, text: "재은아, 내 사랑" },
  { time: 231.144, text: "너를 꼭 안을게" },
  { time: 235.451, text: "재은아, 내 세상" },
  { time: 240.956, text: "너만 있으면 돼" },
  { time: 243.510, text: "네가 웃는 순간 난 다 괜찮아져" },
  { time: 255.318, text: "재은아, 내 사랑" },
  { time: 259.654, text: "영원히 널 지킬게" },
  { time: 266.936, text: "영원히 널 지킬게" },
];

function updateMiniLyricLine(activeIndex) {
  const mini = document.getElementById("musicLyricNow");
  if (!mini || !Array.isArray(LYRICS)) return;

  let idx = activeIndex;
  while (idx >= 0 && LYRICS[idx].tag) {
    idx--;
  }

  if (idx < 0) {
    mini.textContent = "";
    return;
  }

  mini.textContent = LYRICS[idx].text;
}

let lyricsCurrentIndex = -1;

function renderLyrics() {
  const body = $("lyricsBody");
  if (!body) return;

  body.innerHTML = LYRICS.map((line, idx) => {
    const classes = ["lyrics__line"];
    if (line.tag) classes.push("lyrics__line--tag");
    return `<div class="${classes.join(" ")}" data-idx="${idx}">${escapeHtml(line.text)}</div>`;
  }).join("");
}

function setActiveLyricsLine(idx) {
  const body = $("lyricsBody");
  if (!body) return;

  body.querySelectorAll(".lyrics__line").forEach((el) => {
    el.classList.remove("lyrics__line--active");
  });

  const active = body.querySelector(`.lyrics__line[data-idx="${idx}"]`);
  if (active) {
    active.classList.add("lyrics__line--active");
    // 패널이 열려 있을 때만 스크롤
    const panel = $("lyricsPanel");
    if (panel && panel.classList.contains("show")) {
      active.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }
}

function syncLyricsByTime(currentTime) {
  if (!LYRICS.length) return;

  // currentTime 보다 작거나 같은 마지막 줄 찾기
  let idx = -1;
  for (let i = 0; i < LYRICS.length; i++) {
    if (currentTime + 0.05 >= LYRICS[i].time) idx = i;
    else break;
  }
  if (idx === -1 || idx === lyricsCurrentIndex) return;
  lyricsCurrentIndex = idx;
  setActiveLyricsLine(idx);
  updateMiniLyricLine(idx);
}

function initLyricsPanel() {
  const panel = $("lyricsPanel");
  const openBtn = $("lyricsToggle");
  const closeBtn = $("lyricsClose");
  const backdrop = panel ? panel.querySelector(".lyrics__backdrop") : null;

  if (!panel || !openBtn || !closeBtn || !backdrop) return;

  renderLyrics();

  const open = () => {
    panel.classList.add("show");
    panel.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    // 패널 열릴 때도 현재 위치 반영
    const audio = $("bgm");
    if (audio) syncLyricsByTime(audio.currentTime || 0);
  };

  const close = () => {
    panel.classList.remove("show");
    panel.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  backdrop.addEventListener("click", close);

  // 오디오 시간과 동기화
  const audio = $("bgm");
  if (audio) {
    const update = () => syncLyricsByTime(audio.currentTime || 0);
    audio.addEventListener("timeupdate", update);
    audio.addEventListener("seeked", update);
    audio.addEventListener("play", update);
  }
}

/* ===============================
   PWA Install (Android/Chrome)
   =============================== */
let deferredPrompt = null;

function showInstallBar() {
  const bar = $("installBar");
  if (!bar) return;
  bar.classList.add("show");
  bar.setAttribute("aria-hidden", "false");
}
function hideInstallBar() {
  const bar = $("installBar");
  if (!bar) return;
  bar.classList.remove("show");
  bar.setAttribute("aria-hidden", "true");
}
function initInstallUX() {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallBar();
  });

  $("installLater")?.addEventListener("click", () => {
    hideInstallBar();
    deferredPrompt = null;
  });

  $("installBtn")?.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try { await deferredPrompt.userChoice; } catch {}
    deferredPrompt = null;
    hideInstallBar();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    hideInstallBar();
  });
}

/* ===============================
   Room Key (password -> roomId)
   =============================== */
async function makeRoomId(pass) {
  const enc = new TextEncoder().encode(`room:${pass}`);
  const hash = await crypto.subtle.digest("SHA-256", enc);
  const hex = [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return hex.slice(0, 24);
}
let roomId = null;

/* ===============================
   Lock Screen
   =============================== */
function showLock() {
  $("lock")?.classList.add("show");
  $("lock")?.setAttribute("aria-hidden", "false");
  if ($("lockPass")) {
    $("lockPass").value = "";
    $("lockPass").focus();
  }
}
function hideLock() {
  $("lock")?.classList.remove("show");
  $("lock")?.setAttribute("aria-hidden", "true");
}
function initLock() {
  const unlocked = sessionStorage.getItem(SESSION_KEY) === "1";
  if (!unlocked) showLock();

  $("lockForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const pass = normalizePass($("lockPass").value);
    const hint = $("lockHint");
    const card = document.querySelector(".lock__card");

    if (pass === PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "1");
      if (hint) {
        hint.classList.remove("error");
        hint.textContent = "열렸어요. 우리만의 공간으로 ♡";
      }
      hideLock();
      await tryPlayBgm();

      try {
        roomId = await makeRoomId(pass);
        await ensureAuth();
        await ensureRoomDoc();
        await loadRoomConfig();
        await bootApp();
      } catch (err) {
        safeAlert("Firebase 연결/초기화에 실패했어요.", err);
        sessionStorage.removeItem(SESSION_KEY);
        showLock();
      }
      return;
    }

    if (hint) {
      hint.classList.add("error");
      hint.textContent = "앗, 비밀번호가 달라요. 우리만 아는 숫자 4자리 ♡";
    }
    if (card) {
      card.classList.remove("shake");
      void card.offsetWidth;
      card.classList.add("shake");
    }
    $("lockPass")?.select();
  });
}

/* ===============================
   Firestore refs
   =============================== */
function roomDocRef() { return doc(db, "rooms", roomId); }
function photosColRef() { return collection(db, "rooms", roomId, "photos"); }
function memosColRef() { return collection(db, "rooms", roomId, "memos"); }
function dailyColRef() { return collection(db, "rooms", roomId, "dailyPrompts"); }
function moodsColRef() { return collection(db, "rooms", roomId, "moods"); }

async function ensureRoomDoc() {
  const ref = roomDocRef();
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      createdAt: serverTimestamp(),
      hint: "No-auth room. Shared by password(roomKey).",
      startDate: START.getTime(),
      nameA: COUPLE.nameA,
      nameB: COUPLE.nameB,
    });
  }
}

/* ===============================
   Room Config (Admin)
   =============================== */
async function loadRoomConfig() {
  const snap = await getDoc(roomDocRef());
  if (!snap.exists()) return;
  const data = snap.data();

  if (data.startDate) {
    START = new Date(data.startDate);
  }
  if (data.nameA) COUPLE.nameA = data.nameA;
  if (data.nameB) COUPLE.nameB = data.nameB;

  $("coupleNameA").textContent = COUPLE.nameA;
  $("coupleNameB").textContent = COUPLE.nameB;
  $("lockTitle").textContent = `${COUPLE.nameA} ♡ ${COUPLE.nameB}`;
}

/* ===============================
   Counter / Milestones
   =============================== */
function diffNow() {
  const now = new Date();
  const ms = Math.max(0, now - START);
  const totalSeconds = Math.floor(ms / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);
  return {
    now,
    totalSeconds,
    totalMinutes,
    totalHours,
    totalDays,
    hhmmss: `${pad2(totalHours % 24)}:${pad2(totalMinutes % 60)}:${pad2(totalSeconds % 60)}`,
  };
}
function renderCounter() {
  const { now, totalDays, totalHours, totalMinutes, totalSeconds, hhmmss } = diffNow();
  $("startDateLabel").textContent = fmtDate(START);
  $("todayLabel").textContent = fmtDate(now);
  $("dDay").textContent = `D+${totalDays}`;
  $("headerDDay").textContent = `D+${totalDays}`;
  $("sinceText").textContent = `${fmtDate(START)}부터 우리가 만든 따뜻한 시간`;
  $("hhmmss").textContent = hhmmss;
  $("days").textContent = totalDays.toLocaleString();
  $("hours").textContent = totalHours.toLocaleString();
  $("minutes").textContent = totalMinutes.toLocaleString();
  $("seconds").textContent = totalSeconds.toLocaleString();
}
function renderMilestones() {
  const { totalDays } = diffNow();
  const nextLabel = $("nextLabel");
  const nextValue = $("nextValue");
  if (!nextLabel || !nextValue) return;

  const next = MILESTONES
    .map((m) => ({ ...m, left: m.days - totalDays, date: addDays(START, m.days) }))
    .filter((x) => x.left > 0)
    .sort((a, b) => a.left - b.left)[0];

  if (next) {
    nextLabel.textContent = `${next.name}까지`;
    nextValue.textContent = `${next.left}일 · ${fmtDate(next.date)}`;
  } else {
    nextLabel.textContent = "다음 기념일";
    nextValue.textContent = "새 마일스톤을 추가해도 좋아요 ♡";
  }
}

/* ===============================
   Image compress -> jpeg blob
   =============================== */
async function fileToJpegBlobCompressed(file) {
  const dataUrl = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error("파일을 읽을 수 없어요."));
    r.onload = () => resolve(r.result);
    r.readAsDataURL(file);
  });

  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("이미지를 불러올 수 없어요."));
    i.src = dataUrl;
  });

  const longSide = Math.max(img.width, img.height);
  const scale = longSide > MAX_IMAGE_LONG_SIDE ? MAX_IMAGE_LONG_SIDE / longSide : 1;
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d").drawImage(img, 0, 0, w, h);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", JPG_QUALITY));
  if (!blob) throw new Error("이미지 변환에 실패했어요.");
  return blob;
}

/* ===============================
   Photos (앨범 + 정렬 + 슬라이더 + 라이트박스)
   =============================== */
let allRows = [];
let viewRows = [];
let currentAlbum = "__ALL__";
let sortMode = "new";
let page = 1;

let lbIndex = 0;
let lbPhotoId = null;

function normalizeRow(x) {
  return {
    id: x.id,
    album: (x.album || "기본앨범").trim() || "기본앨범",
    caption: x.caption || "",
    date: typeof x.date === "number" ? x.date : null,
    name: x.name || "photo",
    url: x.url || "",
    storagePath: x.storagePath || "",
    createdAt: typeof x.createdAt === "number" ? x.createdAt : 0,
  };
}
function resetPaging() {
  page = 1;
  const loadMore = $("loadMore");
  if (loadMore) loadMore.style.display = "inline-flex";
  const hint = $("pagingHint");
  if (hint) hint.textContent = "—";
}
function getPagedRows() {
  const end = page * PAGE_SIZE;
  return viewRows.slice(0, end);
}
function updatePagingUI() {
  const wrap = $("gallery");
  if (!wrap) return;
  const shown = getPagedRows().length;
  $("photoCount").textContent = String(viewRows.length);
  $("pagingHint").textContent = `${shown} / ${viewRows.length}장 표시`;

  if (shown >= viewRows.length) $("loadMore").style.display = "none";
  else $("loadMore").style.display = "inline-flex";

  if (shown >= 5) wrap.classList.add("gallery--scroll");
  else wrap.classList.remove("gallery--scroll");
}

/* Sorting */
function cmpStr(a, b) {
  return String(a || "").localeCompare(String(b || ""), "ko", { sensitivity: "base" });
}
function applySort() {
  const arr = [...allRows];

  switch (sortMode) {
    case "new":
      arr.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      break;
    case "old":
      arr.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      break;
    case "name_asc":
      arr.sort((a, b) => {
        const c = cmpStr(a.name, b.name);
        if (c !== 0) return c;
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
      break;
    case "date_desc":
      arr.sort((a, b) => {
        const da = a.date ?? a.createdAt ?? 0;
        const db = b.date ?? b.createdAt ?? 0;
        return db - da;
      });
      break;
    default:
      arr.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }

  viewRows = arr;
  resetPaging();
}

/* Fetch photos for currentAlbum */
async function fetchPhotosForAlbum() {
  const col = photosColRef();
  let qBase = query(col, orderBy("createdAt", "desc"), limit(MAX_LOAD_ALL));
  if (currentAlbum !== "__ALL__") {
    qBase = query(col, where("album", "==", currentAlbum), orderBy("createdAt", "desc"), limit(MAX_LOAD_ALL));
  }

  const snap = await getDocs(qBase);
  const rows = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((x) => typeof x.url === "string" && x.url.trim().length > 0)
    .map(normalizeRow);

  allRows = rows;
}

/* 앨범 셀렉트 옵션 재구성 */
async function rebuildAlbumOptions() {
  const snap = await getDocs(query(photosColRef(), orderBy("createdAt", "desc"), limit(MAX_LOAD_ALL)));
  const albums = new Set();
  snap.forEach((d) => {
    const data = d.data();
    if (!hasValidUrl(data)) return;
    const a = String(data?.album || "기본앨범").trim();
    albums.add(a || "기본앨범");
  });

  const list = [...albums].sort((a, b) => a.localeCompare(b, "ko"));
  const sel = $("albumFilter");
  if (!sel) return;
  const prev = sel.value || "__ALL__";

  sel.innerHTML =
    `<option value="__ALL__">전체 앨범</option>` +
    list.map((a) => `<option value="${escapeHtml(a)}">${escapeHtml(a)}</option>`).join("");

  sel.value = ([ "__ALL__", ...list ].includes(prev)) ? prev : "__ALL__";
  currentAlbum = sel.value;
}

/* Lightbox */
function openLightbox() {
  document.body.classList.add("lb-open");
  $("lightbox")?.classList.add("show");
  $("lightbox")?.setAttribute("aria-hidden", "false");
}
function closeLightbox() {
  document.body.classList.remove("lb-open");
  $("lightbox")?.classList.remove("show");
  $("lightbox")?.setAttribute("aria-hidden", "true");
}
function setLightboxByIndex(i) {
  const arr = getPagedRows();
  if (!arr.length) return;

  lbIndex = (i + arr.length) % arr.length;
  const it = arr[lbIndex];

  lbPhotoId = it.id;
  $("lbImg").src = it.url;
  $("lbAlbum").value = it.album || "기본앨범";
  $("lbDate").value = it.date ? toISODateInputValue(it.date) : "";
  $("lbCaptionInput").value = it.caption?.trim() ? it.caption.trim() : "";

  $("lbSaveHint").textContent = "수정 후 저장을 눌러주세요. (Ctrl/Cmd + S 가능)";
}
async function saveLightboxEdits() {
  if (!lbPhotoId) return;

  const album = normalizeAlbum($("lbAlbum").value);
  const dateTs = fromISODateInputValue($("lbDate").value);
  const caption = $("lbCaptionInput").value.trim();

  const ref = doc(db, "rooms", roomId, "photos", lbPhotoId);
  await updateDoc(ref, { album, date: dateTs || null, caption });

  const patch = (arr) => {
    const idx = arr.findIndex((x) => x.id === lbPhotoId);
    if (idx >= 0) arr[idx] = { ...arr[idx], album, date: dateTs || null, caption };
  };
  patch(allRows);
  patch(viewRows);

  $("lbSaveHint").textContent = "저장 완료 ♡";

  await rebuildAlbumOptions();
  await refreshPhotos(false);
}
function initLightbox() {
  $("lightbox")?.addEventListener("click", (e) => {
    const t = e.target;
    if (t?.getAttribute?.("data-lb-close") === "1") closeLightbox();
  });

  $("lbPrev")?.addEventListener("click", () => setLightboxByIndex(lbIndex - 1));
  $("lbNext")?.addEventListener("click", () => setLightboxByIndex(lbIndex + 1));

  $("lbSave")?.addEventListener("click", async () => {
    try {
      $("lbSaveHint").textContent = "저장 중…";
      await saveLightboxEdits();
    } catch (err) {
      $("lbSaveHint").textContent = "저장 실패";
      safeAlert("사진 정보 저장에 실패했어요.", err);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (!$("lightbox")?.classList.contains("show")) return;

    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") setLightboxByIndex(lbIndex - 1);
    if (e.key === "ArrowRight") setLightboxByIndex(lbIndex + 1);

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      $("lbSave")?.click();
    }
  });
}

/* Render Gallery + Slider */
async function renderGallery() {
  const wrap = $("gallery");
  const slider = $("photoSlider");
  if (!wrap || !slider) return;

  const shown = getPagedRows();

  if (!shown.length) {
    wrap.innerHTML = `<p class="hint">아직 사진이 없어요. 우리 첫 장을 담아볼까요?</p>`;
    slider.innerHTML = `<p class="hint">사진을 올리면 여기에서 슬라이드처럼 볼 수 있어요.</p>`;
    updatePagingUI();
    return;
  }

  // 그리드
  wrap.innerHTML = shown.map((it, idx) => {
    const caption = it.caption?.trim() ? it.caption.trim() : "사진";
    return `
      <div class="photo" data-id="${escapeHtml(it.id)}" data-idx="${idx}">
        <img class="photo__img" src="${escapeHtml(it.url)}" alt="${escapeHtml(caption)}" loading="lazy" />
        <button class="photo__del" type="button" title="삭제" aria-label="사진 삭제" data-del="${escapeHtml(it.id)}">✕</button>
      </div>
    `;
  }).join("");

  // 슬라이더: 최신순 20장만
  const sliderRows = [...viewRows].slice(0, 20);
  slider.innerHTML = sliderRows.map((it) => {
    const caption = it.caption?.trim() ? it.caption.trim() : (it.album || "사진");
    return `
      <div class="photoSlider__item">
        <img class="photoSlider__img" src="${escapeHtml(it.url)}" alt="${escapeHtml(caption)}" loading="lazy" />
        <div class="photoSlider__caption">${escapeHtml(caption)}</div>
      </div>
    `;
  }).join("");

  updatePagingUI();

  // click -> lightbox
  wrap.querySelectorAll(".photo").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target?.closest?.("[data-del]")) return;
      const idx = Number(card.getAttribute("data-idx"));
      setLightboxByIndex(idx);
      openLightbox();
    });
  });

  // 삭제
  wrap.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-del");
      const ok = confirm("이 사진을 삭제할까요? (Storage에서도 지워져요)");
      if (!ok) return;

      try {
        await deletePhotoById(id);
        await rebuildAlbumOptions();
        await refreshPhotos(false);
      } catch (err) {
        safeAlert("사진 삭제에 실패했어요.", err);
      }
    });
  });
}

async function deletePhotoById(id) {
  const ref = doc(db, "rooms", roomId, "photos", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  const path = data?.storagePath;

  if (path) {
    try { await deleteObject(sRef(storage, path)); } catch {}
  }
  await deleteDoc(ref);
}

/* Upload */
async function uploadOnePhoto(file, album, dateTs, caption) {
  const blob = await fileToJpegBlobCompressed(file);
  const now = Date.now();

  const docRef = await addDoc(photosColRef(), {
    album,
    caption: caption?.trim() || "",
    date: dateTs || null,
    name: humanName(file.name),
    createdAt: now,
    url: "",
    storagePath: "",
  });

  const path = `rooms/${roomId}/photos/${docRef.id}.jpg`;
  try {
    const fileRef = sRef(storage, path);
    await uploadBytes(fileRef, blob, { contentType: "image/jpeg" });
    const url = await getDownloadURL(fileRef);
    await updateDoc(docRef, { url, storagePath: path });
  } catch (err) {
    try { await deleteDoc(docRef); } catch {}
    throw err;
  }
}

async function refreshPhotos(forceRebuildAlbum = false) {
  if (forceRebuildAlbum) await rebuildAlbumOptions();
  await fetchPhotosForAlbum();
  applySort();
  await renderGallery();
}

/* Gallery UI init */
function initGalleryUI() {
  $("photoDate").value = toISODateInputValue(new Date());

  $("photoInput")?.addEventListener("change", async (e) => {
    const files = [...(e.target.files || [])];
    if (!files.length) return;

    const album = normalizeAlbum($("albumName").value);
    const dateTs = fromISODateInputValue($("photoDate").value);
    const caption = $("photoCaption").value.trim();

    try {
      for (const f of files) {
        if (!f.type.startsWith("image/")) continue;
        await uploadOnePhoto(f, album, dateTs, caption);
      }
      e.target.value = "";
      await refreshPhotos(true);
    } catch (err) {
      safeAlert(
        "업로드가 막혔어요.\n대부분 Storage Rules(권한) 또는 버킷 설정 문제예요.",
        err
      );
    }
  });

  $("albumFilter")?.addEventListener("change", async (e) => {
    currentAlbum = e.target.value;
    try {
      await refreshPhotos(false);
    } catch (err) {
      safeAlert("앨범 불러오기에 실패했어요.", err);
    }
  });

  $("sortMode")?.addEventListener("change", async (e) => {
    sortMode = e.target.value;
    applySort();
    await renderGallery();
  });

  $("loadMore")?.addEventListener("click", async () => {
    page += 1;
    await renderGallery();
  });

  $("resetPaging")?.addEventListener("click", async () => {
    resetPaging();
    await renderGallery();
  });

  initLightbox();
}

/* ===============================
   Memo
   =============================== */
async function fetchMemos() {
  const snap = await getDocs(query(memosColRef(), orderBy("createdAt", "desc"), limit(100)));
  const list = $("memoList");
  if (!list) return;

  if (snap.empty) {
    list.innerHTML = `<p class="hint">아직 메모가 없어요. 오늘 있었던 일을 살짝 남겨볼까요?</p>`;
    return;
  }

  list.innerHTML = snap.docs.map((d) => {
    const data = d.data();
    const createdAt = data.createdAt ? fmtDate(new Date(data.createdAt)) : "";
    const title = data.title || "제목 없음";
    const body = data.body || "";
    return `
      <div class="memo" data-id="${d.id}">
        <div class="memo__top">
          <div class="memo__title">${escapeHtml(title)}</div>
          <div class="memo__date">${escapeHtml(createdAt)}</div>
        </div>
        <div class="memo__body">${escapeHtml(body)}</div>
        <div class="memo__actions">
          <button class="btn btn--ghost" type="button" data-del="${d.id}">삭제</button>
        </div>
      </div>
    `;
  }).join("");

  list.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-del");
      const ok = confirm("이 메모를 삭제할까요?");
      if (!ok) return;
      try {
        await deleteDoc(doc(db, "rooms", roomId, "memos", id));
        await fetchMemos();
      } catch (err) {
        safeAlert("메모 삭제에 실패했어요.", err);
      }
    });
  });
}

function initMemoUI() {
  $("memoForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = $("memoTitle").value.trim();
    const body = $("memoBody").value.trim();
    if (!title && !body) {
      alert("제목이나 내용을 적어주세요 ♡");
      return;
    }
    try {
      await addDoc(memosColRef(), {
        title,
        body,
        createdAt: Date.now(),
      });
      $("memoTitle").value = "";
      $("memoBody").value = "";
      await fetchMemos();
    } catch (err) {
      safeAlert("메모 저장에 실패했어요.", err);
    }
  });

  $("clearMemos")?.addEventListener("click", async () => {
    const ok = confirm("메모를 전부 삭제할까요? 되돌릴 수 없어요.");
    if (!ok) return;
    try {
      const snap = await getDocs(memosColRef());
      const batchDeletes = snap.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(batchDeletes);
      await fetchMemos();
    } catch (err) {
      safeAlert("메모 전체 삭제에 실패했어요.", err);
    }
  });
}

/* ===============================
   Daily Love Prompt (오늘의 한마디)
   =============================== */
async function loadDailyPrompt() {
  const key = todayKey();
  const ref = doc(dailyColRef(), key);
  const snap = await getDoc(ref);

  const dateLabel = $("promptDateLabel");
  if (dateLabel) dateLabel.textContent = key.replaceAll("-", ".");

  // 질문 결정 (날짜 기준 고정)
  const idx = simpleHash(key) % DAILY_PROMPTS.length;
  const question = DAILY_PROMPTS[idx];
  $("promptQuestion").textContent = question;

  if (snap.exists()) {
    const data = snap.data();
    if (data.mine) $("promptMine").value = data.mine;
    if (data.yours) $("promptYours").value = data.yours;
    updateHomePromptSummary(data.mine, data.yours, question);
  } else {
    $("promptMine").value = "";
    $("promptYours").value = "";
    updateHomePromptSummary("", "", question);
  }
}

function updateHomePromptSummary(mine, yours, question) {
  const el = $("homePromptSummary");
  if (!el) return;
  if (!mine && !yours) {
    el.textContent = "아직 오늘의 질문에 답하지 않았어요. ‘한마디’ 탭에서 둘이 같이 적어볼까요?";
    return;
  }
  const q = question || "오늘의 질문";
  const first = mine || yours || "";
  el.textContent = `${q} · ${first.slice(0, 28)}${first.length > 28 ? "…" : ""}`;
}

function initDailyPromptUI() {
  $("promptForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const mine = $("promptMine").value.trim();
    const yours = $("promptYours").value.trim();
    const key = todayKey();
    const ref = doc(dailyColRef(), key);

    try {
      await setDoc(ref, {
        mine,
        yours,
        question: $("promptQuestion").textContent,
        updatedAt: Date.now(),
      }, { merge: true });

      $("promptSaveHint").textContent = "오늘의 기록이 저장됐어요 ♡";
      updateHomePromptSummary(mine, yours, $("promptQuestion").textContent);

      if (mine && yours) {
        const heart = $("promptHeart");
        heart.classList.remove("show");
        void heart.offsetWidth;
        heart.classList.add("show");
      }
    } catch (err) {
      $("promptSaveHint").textContent = "저장에 실패했어요.";
      safeAlert("오늘의 한마디 저장에 실패했어요.", err);
    }
  });
}

/* ===============================
   Mood (감정 온도계)
   =============================== */
async function saveMood(mood) {
  const key = todayKey();
  const ref = doc(moodsColRef(), key);
  await setDoc(ref, { mood, dateKey: key, updatedAt: Date.now() }, { merge: true });
}

async function loadMoods() {
  // 최근 7일
  const snap = await getDocs(query(moodsColRef(), orderBy("dateKey", "desc"), limit(7)));
  const list = [];
  snap.forEach((d) => {
    const data = d.data();
    list.push({ ...data, id: d.id });
  });
  list.sort((a, b) => a.dateKey.localeCompare(b.dateKey));

  const graph = $("moodGraph");
  if (!graph) return;

  if (!list.length) {
    graph.innerHTML = `<p class="hint">아직 온도 기록이 없어요. 오늘 기분부터 체크해볼까요?</p>`;
    $("homeMoodSummary").textContent = "아직 오늘 기분을 남기지 않았어요. ‘온도’ 탭에서 체크해볼까요?";
    return;
  }

  const today = todayKey();
  const todayMood = list.find((x) => x.dateKey === today)?.mood || "";
  updateHomeMoodSummary(todayMood);

  graph.innerHTML = list.map((it, idx) => {
    let cls = "moodGraph__bar";
    if (it.mood === "happy") cls += " moodGraph__bar--happy";
    else if (it.mood === "sad") cls += " moodGraph__bar--sad";
    else cls += " moodGraph__bar--normal";

    const d = new Date(it.dateKey);
    const label = it.mood === "happy" ? "행복" : it.mood === "sad" ? "속상" : "보통";

    return `
      <div class="moodGraph__item">
        <div class="${cls}" style="opacity:${0.6 + idx * 0.05}"></div>
        <div class="moodGraph__label">${label}</div>
        <div class="moodGraph__day">${fmtDateShort(d)}</div>
      </div>
    `;
  }).join("");
}

function updateHomeMoodSummary(mood) {
  const el = $("homeMoodSummary");
  if (!el) return;
  if (!mood) {
    el.textContent = "아직 오늘 기분을 남기지 않았어요. ‘온도’ 탭에서 체크해볼까요?";
    return;
  }
  if (mood === "happy") el.textContent = "오늘 우리 온도는 😊 행복 쪽에 가까워요.";
  else if (mood === "sad") el.textContent = "오늘 우리 온도는 조금 😢 속상 쪽이에요. 그래도 함께라서 다행이지?";
  else el.textContent = "오늘 우리 온도는 😐 보통이에요. 조용하지만 편안한 하루였을지도?";
}

function initMoodUI() {
  const buttons = document.querySelectorAll(".moodBtn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const mood = btn.getAttribute("data-mood");
      try {
        await saveMood(mood);
        $("moodSaveHint").textContent = "오늘 기분이 저장됐어요 ♡";
        buttons.forEach((b) => b.classList.remove("moodBtn--active"));
        btn.classList.add("moodBtn--active");
        await loadMoods();
      } catch (err) {
        $("moodSaveHint").textContent = "저장 실패";
        safeAlert("오늘 기분 저장에 실패했어요.", err);
      }
    });
  });

  // 초기 상태에서 오늘 mood 있을 경우 active 처리
  loadMoods().then(async () => {
    const today = todayKey();
    const snap = await getDoc(doc(moodsColRef(), today));
    if (snap.exists()) {
      const mood = snap.data().mood;
      document.querySelectorAll(".moodBtn").forEach((btn) => {
        if (btn.getAttribute("data-mood") === mood) btn.classList.add("moodBtn--active");
      });
    }
  }).catch(console.error);
}

/* ===============================
   Notifications (기념일 알림 UI)
   =============================== */
function updateNotifyStatus() {
  const el = $("notifyStatus");
  if (!el || !("Notification" in window)) {
    if (el) el.textContent = "지원 안 함";
    return;
  }
  const perm = Notification.permission;
  if (perm === "granted") el.textContent = "허용됨";
  else if (perm === "denied") el.textContent = "차단됨";
  else el.textContent = "미요청";
}

function initNotifyUI() {
  updateNotifyStatus();

  $("notifyRequestBtn")?.addEventListener("click", async () => {
    if (!("Notification" in window)) {
      alert("이 브라우저는 알림을 지원하지 않아요.");
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      updateNotifyStatus();
      if (perm === "granted") {
        alert("알림이 허용되었어요. 실제 푸시는 Service Worker + 서버 연결이 필요해요.");
      }
    } catch (err) {
      safeAlert("알림 권한 요청 중 오류가 발생했어요.", err);
    }
  });

  $("testNotifyBtn")?.addEventListener("click", async () => {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") {
      alert("먼저 알림 허용을 해주세요.");
      return;
    }
    new Notification("테스트 알림", {
      body: "기념일 알림이 이런 느낌으로 도착할 거예요 ♡",
    });
  });
}

/* ===============================
   Admin (기본 정보 + 테마)
   =============================== */
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("ywjy_theme", theme);
}

function initAdminUI() {
  // 기본 값 세팅
  $("adminNameA").value = COUPLE.nameA;
  $("adminNameB").value = COUPLE.nameB;
  $("adminStartDate").value = toISODateInputValue(START);

  $("adminInfoForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nameA = $("adminNameA").value.trim() || COUPLE.nameA;
    const nameB = $("adminNameB").value.trim() || COUPLE.nameB;
    const startTs = fromISODateInputValue($("adminStartDate").value) ?? START.getTime();

    try {
      await setDoc(roomDocRef(), {
        nameA,
        nameB,
        startDate: startTs,
      }, { merge: true });

      COUPLE.nameA = nameA;
      COUPLE.nameB = nameB;
      START = new Date(startTs);

      $("coupleNameA").textContent = COUPLE.nameA;
      $("coupleNameB").textContent = COUPLE.nameB;
      $("lockTitle").textContent = `${COUPLE.nameA} ♡ ${COUPLE.nameB}`;
      $("adminInfoHint").textContent = "저장 완료 ♡ 다시 들어와도 같은 값으로 보일 거예요.";

      renderCounter();
      renderMilestones();
    } catch (err) {
      $("adminInfoHint").textContent = "저장 실패";
      safeAlert("관리자 정보 저장에 실패했어요.", err);
    }
  });

  // 테마
const allowedThemes = ["romance", "minimal", "lavender"];
let savedTheme = localStorage.getItem("ywjy_theme") || "romance";

if (!allowedThemes.includes(savedTheme)) {
  savedTheme = "romance";   // 예전 midnight 값이면 기본으로
}

$("themeSelect").value = savedTheme;
applyTheme(savedTheme);

  $("themeForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const theme = $("themeSelect").value || "romance";
    applyTheme(theme);
    $("themeHint").textContent = "테마가 적용됐어요 ♡";
  });
}

/* ===============================
   Tabs
   =============================== */
function initTabs() {
  const buttons = document.querySelectorAll(".tabbar__btn");
  const tabs = {
    home: $("tab-home"),
    photos: $("tab-photos"),
    memo: $("tab-memo"),
    mood: $("tab-mood"),
    admin: $("tab-admin"),
  };

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-target");
      if (!tabs[target]) return;

      Object.values(tabs).forEach((el) => el.classList.remove("tab--active"));
      tabs[target].classList.add("tab--active");

      buttons.forEach((b) => b.classList.remove("tabbar__btn--active"));
      btn.classList.add("tabbar__btn--active");
    });
  });
}

/* ===============================
   Service worker (캐시 + offline)
   =============================== */
function initServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

/* ===============================
   Boot
   =============================== */
async function bootApp() {
  // Counter
  renderCounter();
  renderMilestones();
  setInterval(renderCounter, 1000);

  // Tabs
  initTabs();

  // Gallery / Memo / Prompt / Mood / Admin / Notify
  initGalleryUI();
  await rebuildAlbumOptions();
  await refreshPhotos(false);

  initMemoUI();
  await fetchMemos();

  initDailyPromptUI();
  await loadDailyPrompt();

  initMoodUI();
  initNotifyUI();
  initAdminUI();
}

/* ===============================
   Global init
   =============================== */
window.addEventListener("DOMContentLoaded", () => {
  initBgm();
  initLyricsPanel();   // 👈 가사 패널 초기화 추가
  initInstallUX();
  initLock();
  initServiceWorker();
});