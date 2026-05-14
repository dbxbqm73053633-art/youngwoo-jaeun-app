import { FieldPath, deleteField, doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { ensureAuth } from "./authService";
import { TEMPLATE_DEFAULTS, safeDate } from "../constants/templateConfig";
import { db } from "../lib/firebase";
import type { RoomConfig } from "../types";

const DEFAULT_CONFIG: RoomConfig = {
  nameA: TEMPLATE_DEFAULTS.coupleNameA,
  nameB: TEMPLATE_DEFAULTS.coupleNameB,
  startDate: safeDate(TEMPLATE_DEFAULTS.startDate),
  appTitle: TEMPLATE_DEFAULTS.appName,
  introText: TEMPLATE_DEFAULTS.introText,
  theme: TEMPLATE_DEFAULTS.theme,
  musicTitle: TEMPLATE_DEFAULTS.musicTitle,
  musicMeta: TEMPLATE_DEFAULTS.musicMeta,
  musicSrc: TEMPLATE_DEFAULTS.musicSrc,
  videoTitle: TEMPLATE_DEFAULTS.videoTitle,
  videoSrc: TEMPLATE_DEFAULTS.videoSrc,
  posterSrc: TEMPLATE_DEFAULTS.posterSrc,
};

const ROOM_ALIASES: Record<string, string> = {
  "youngwoo-jaeun": "5e250a5ad0a01e95b37dc084",
};

export async function makeRoomId(pass: string) {
  const enc = new TextEncoder().encode(`room:${pass}`);
  const hash = await crypto.subtle.digest("SHA-256", enc);
  const hex = [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return hex.slice(0, 24);
}

export async function hashRoomPassword(pass: string) {
  const enc = new TextEncoder().encode(`roomPassword:${pass}`);
  const hash = await crypto.subtle.digest("SHA-256", enc);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export type RoomRole = "admin" | "viewer";

export type ProvisionedCustomerRoom = {
  coupleCode: string;
  adminPassword: string;
  viewerPassword: string;
  adminPasswordHash: string;
  viewerPasswordHash: string;
};

export function normalizeCoupleCode(value: string) {
  const raw = String(value || "").trim();
  const parts = raw.split(/[\\/]+/).filter(Boolean);
  const roomsIndex = parts.lastIndexOf("rooms");
  const roomSegment = roomsIndex >= 0 && parts[roomsIndex + 1] ? parts[roomsIndex + 1] : raw;

  return roomSegment
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function resolveRoomId(coupleCode: string) {
  const normalized = normalizeCoupleCode(coupleCode);
  return ROOM_ALIASES[normalized] || normalized;
}

export function normalizeDocumentId(value: string) {
  return String(value || "").trim().split(/[\\/]+/).filter(Boolean).pop() || "";
}

export function resolvedRoomPath(coupleCode: string) {
  const roomId = resolveRoomId(coupleCode);
  if (!roomId) throw new Error("Invalid couple code");
  return `rooms/${roomId}`;
}

export function resolvedRoomDocumentPath(coupleCode: string, collectionName: string, documentId: string) {
  const roomId = resolveRoomId(coupleCode);
  const cleanDocumentId = normalizeDocumentId(documentId);
  if (!roomId || !collectionName || !cleanDocumentId) throw new Error("Invalid room document path");
  return `rooms/${roomId}/${collectionName}/${cleanDocumentId}`;
}

export function resolveRoomDocumentSegments(coupleCode: string, collectionName: string, documentId: string) {
  const roomId = resolveRoomId(coupleCode);
  const cleanDocumentId = normalizeDocumentId(documentId);
  if (!roomId || !collectionName || !cleanDocumentId) throw new Error("Invalid room document path");
  return { roomId, collectionName, documentId: cleanDocumentId };
}

export function logResolvedFirestorePath(label: string, path: string) {
  if (!import.meta.env.DEV || import.meta.env.DEV_DEBUG !== "true") return;
  console.info(`[Firestore path] ${label}: ${path}`);
}

export async function resolveCoupleCode(coupleCode: string, roomPassword: string) {
  const normalized = normalizeCoupleCode(coupleCode);
  if (normalized) return resolveRoomId(normalized);
  return makeRoomId(roomPassword);
}

export function roomDocument(coupleCode: string) {
  const roomId = resolveRoomId(coupleCode);
  const path = resolvedRoomPath(coupleCode);
  logResolvedFirestorePath("resolved room doc path before read", path);
  return doc(db, "rooms", roomId);
}

function roomConfigFromData(data: Record<string, unknown>, coupleCode: string): RoomConfig {
  return {
    coupleCode: String(data.coupleCode || coupleCode),
    nameA: String(data.nameA || DEFAULT_CONFIG.nameA),
    nameB: String(data.nameB || DEFAULT_CONFIG.nameB),
    startDate: typeof data.startDate === "number" ? data.startDate : DEFAULT_CONFIG.startDate,
    appTitle: String(data.appTitle || DEFAULT_CONFIG.appTitle),
    introText: String(data.introText || DEFAULT_CONFIG.introText),
    theme: String(data.theme || DEFAULT_CONFIG.theme),
    musicTitle: String(data.musicTitle || DEFAULT_CONFIG.musicTitle),
    musicMeta: String(data.musicMeta || DEFAULT_CONFIG.musicMeta),
    musicSrc: String(data.musicSrc || DEFAULT_CONFIG.musicSrc),
    videoTitle: String(data.videoTitle || DEFAULT_CONFIG.videoTitle),
    videoSrc: String(data.videoSrc || DEFAULT_CONFIG.videoSrc),
    posterSrc: String(data.posterSrc || DEFAULT_CONFIG.posterSrc),
    createdAt: data.createdAt,
  };
}

export async function ensureRoomDoc(coupleCode: string) {
  const ref = roomDocument(coupleCode);
  const snap = await getDoc(ref);
  if (snap.exists()) return;

  await setDoc(ref, {
    coupleCode,
    createdAt: serverTimestamp(),
    hint: "Couple room. Shared by coupleCode and roomPassword.",
    ...DEFAULT_CONFIG,
  });
}

export async function getRoomConfig(coupleCode: string): Promise<RoomConfig> {
  const snap = await getDoc(roomDocument(coupleCode));
  if (!snap.exists()) {
    await ensureRoomDoc(coupleCode);
    return { ...DEFAULT_CONFIG, coupleCode };
  }

  return roomConfigFromData(snap.data(), coupleCode);
}

export async function getExistingRoomConfig(coupleCode: string): Promise<RoomConfig | null> {
  const snap = await getDoc(roomDocument(coupleCode));
  if (!snap.exists()) return null;

  return roomConfigFromData(snap.data(), coupleCode);
}

export async function getRoomLoginDebugInfo(coupleCode: string) {
  const snap = await getDoc(roomDocument(coupleCode));
  if (!snap.exists()) {
    return {
      exists: false,
      hasAdminPasswordHash: false,
    };
  }

  const data = snap.data();
  return {
    exists: true,
    hasAdminPasswordHash: Boolean(data.adminPasswordHash || data.roomPasswordHash || data.passwordHash),
  };
}

export async function resolveExistingLoginRoom(requestedCode: string, normalizedPassword: string, configuredCoupleCode = "") {
  let activeCode = normalizeCoupleCode(requestedCode);
  let config = await getExistingRoomConfig(activeCode);
  let debugInfo = await getRoomLoginDebugInfo(activeCode);

  if (!config) {
    const legacyCode = await resolveCoupleCode("", normalizedPassword);
    const configuredCode = normalizeCoupleCode(configuredCoupleCode);
    const canUseLegacyRoom = activeCode === legacyCode || (Boolean(configuredCode) && activeCode === configuredCode);

    if (canUseLegacyRoom) {
      const legacyConfig = await getExistingRoomConfig(legacyCode);
      const legacyDebugInfo = await getRoomLoginDebugInfo(legacyCode);
      if (legacyConfig) {
        activeCode = legacyCode;
        config = legacyConfig;
        debugInfo = legacyDebugInfo;
      } else {
        debugInfo = legacyDebugInfo;
      }
    }
  }

  return {
    activeCode,
    config,
    debugInfo,
    roomPath: resolvedRoomPath(activeCode),
  };
}

export async function getExistingRoomMemberRole(coupleCode: string, uid: string): Promise<RoomRole | null> {
  const snap = await getDoc(roomDocument(coupleCode));
  if (!snap.exists()) return null;

  const role = snap.data().members?.[uid]?.role;
  return role === "admin" || role === "viewer" ? role : null;
}

async function migrateLegacyPassword(coupleCode: string, role: RoomRole, normalizedPassword: string) {
  const hash = await hashRoomPassword(normalizedPassword);
  const cleanup = role === "admin"
    ? {
      roomPassword: deleteField(),
      password: deleteField(),
      roomPasswordHash: deleteField(),
      passwordHash: deleteField(),
    }
    : {
      viewerPassword: deleteField(),
    };

  await setDoc(roomDocument(coupleCode), {
    [`${role}PasswordHash`]: hash,
    ...cleanup,
    updatedAt: Date.now(),
  }, { merge: true });
}

// Production security note:
// Client-side role guards improve UX only. Firestore/Storage rules must also
// enforce room membership and admin-only writes for rooms/{coupleCode}/...
// because anonymous clients can be modified outside this bundle.
export async function validateRoomPassword(coupleCode: string, roomPassword: string, fallbackPassword = "") {
  const snap = await getDoc(roomDocument(coupleCode));
  if (!snap.exists()) return { ok: false, reason: "missing" as const, role: null };

  const data = snap.data();
  const normalizedPassword = String(roomPassword || "").trim();
  const adminHash = String(data.adminPasswordHash || data.roomPasswordHash || data.passwordHash || "").trim();
  const viewerHash = String(data.viewerPasswordHash || "").trim();
  const legacyAdminPassword = String(data.roomPassword || data.password || "").trim();
  const legacyViewerPassword = String(data.viewerPassword || "").trim();
  const candidateHash = await hashRoomPassword(normalizedPassword);

  if (adminHash || viewerHash) {
    if (adminHash === candidateHash) {
      return { ok: true, reason: "ok" as const, role: "admin" as const, shouldMigrate: Boolean(data.roomPasswordHash || data.passwordHash) };
    }
    if (viewerHash === candidateHash) return { ok: true, reason: "ok" as const, role: "viewer" as const };
    return { ok: false, reason: "wrong-password" as const, role: null };
  }

  if (legacyAdminPassword || legacyViewerPassword) {
    if (legacyAdminPassword === normalizedPassword) {
      return { ok: true, reason: "ok" as const, role: "admin" as const, shouldMigrate: true };
    }
    if (legacyViewerPassword === normalizedPassword) {
      return { ok: true, reason: "ok" as const, role: "viewer" as const, shouldMigrate: true };
    }
    return {
      ok: false,
      reason: "wrong-password" as const,
      role: null,
    };
  }

  if (fallbackPassword && normalizedPassword === fallbackPassword) {
    return { ok: true, reason: "ok" as const, role: "admin" as const, shouldMigrate: true };
  }

  return { ok: false, reason: "wrong-password" as const, role: null };
}

export async function migrateValidatedRoomPassword(coupleCode: string, role: RoomRole, normalizedPassword: string) {
  await migrateLegacyPassword(coupleCode, role, normalizedPassword);
}

export async function ensureRoomMember(coupleCode: string, uid: string, role: RoomRole) {
  await updateDoc(
    roomDocument(coupleCode),
    new FieldPath("members", uid),
    {
      role,
      joinedAt: Date.now(),
    },
    "updatedAt",
    Date.now(),
  );
}

export async function saveRoomConfig(coupleCode: string, config: RoomConfig) {
  await setDoc(roomDocument(coupleCode), {
    coupleCode,
    nameA: config.nameA,
    nameB: config.nameB,
    startDate: config.startDate,
  }, { merge: true });
}

export type RoomManagementSnapshot = {
  coupleCode: string;
  nameA: string;
  nameB: string;
  startDate: number;
  members: Record<string, { role?: RoomRole; joinedAt?: number; createdAt?: number; provisioner?: boolean }>;
  hasAdminPassword: boolean;
  hasViewerPassword: boolean;
};

export async function getRoomManagementSnapshot(coupleCode: string): Promise<RoomManagementSnapshot | null> {
  const snap = await getDoc(roomDocument(coupleCode));
  if (!snap.exists()) return null;

  const data = snap.data();
  return {
    coupleCode: String(data.coupleCode || coupleCode),
    nameA: String(data.nameA || DEFAULT_CONFIG.nameA),
    nameB: String(data.nameB || DEFAULT_CONFIG.nameB),
    startDate: typeof data.startDate === "number" ? data.startDate : DEFAULT_CONFIG.startDate,
    members: (data.members || {}) as RoomManagementSnapshot["members"],
    hasAdminPassword: Boolean(data.adminPasswordHash || data.roomPasswordHash || data.passwordHash),
    hasViewerPassword: Boolean(data.viewerPasswordHash),
  };
}

export async function updateRoomManagement(coupleCode: string, update: {
  nameA: string;
  nameB: string;
  startDate: number;
  adminPassword?: string;
  viewerPassword?: string;
}) {
  const patch: Record<string, unknown> = {
    coupleCode: resolveRoomId(coupleCode),
    nameA: update.nameA,
    nameB: update.nameB,
    startDate: update.startDate,
    updatedAt: Date.now(),
  };

  const adminPassword = update.adminPassword?.trim();
  const viewerPassword = update.viewerPassword?.trim();
  if (adminPassword) patch.adminPasswordHash = await hashRoomPassword(adminPassword);
  if (viewerPassword) patch.viewerPasswordHash = await hashRoomPassword(viewerPassword);

  await setDoc(roomDocument(coupleCode), patch, { merge: true });
}

function randomToken(length: number) {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => alphabet[byte % alphabet.length]).join("");
}

export function generateCustomerCredentials() {
  return {
    coupleCode: `couple-${randomToken(8)}`,
    adminPassword: randomToken(14),
    viewerPassword: randomToken(14),
  };
}

export async function provisionCustomerRoom(config: {
  coupleCode?: string;
  nameA?: string;
  nameB?: string;
  startDate?: number;
} = {}): Promise<ProvisionedCustomerRoom> {
  const user = await ensureAuth();
  if (!user) throw new Error("Authentication required");

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const generated = generateCustomerCredentials();
    const coupleCode = normalizeCoupleCode(config.coupleCode || generated.coupleCode);
    if (!coupleCode) throw new Error("Invalid couple code");

    const existing = await getDoc(roomDocument(coupleCode));
    if (existing.exists()) {
      if (config.coupleCode) throw new Error("Duplicate couple code");
      continue;
    }

    const adminPasswordHash = await hashRoomPassword(generated.adminPassword);
    const viewerPasswordHash = await hashRoomPassword(generated.viewerPassword);

    await setDoc(roomDocument(coupleCode), {
      coupleCode,
      nameA: config.nameA?.trim() || DEFAULT_CONFIG.nameA,
      nameB: config.nameB?.trim() || DEFAULT_CONFIG.nameB,
      startDate: config.startDate || DEFAULT_CONFIG.startDate,
      adminPasswordHash,
      viewerPasswordHash,
      members: {
        [user.uid]: {
          role: "admin",
          provisioner: true,
          createdAt: Date.now(),
        },
      },
      settings: {
        theme: "romance",
      },
      createdAt: serverTimestamp(),
      createdBy: user.uid,
      updatedAt: Date.now(),
    });

    return {
      coupleCode,
      adminPassword: generated.adminPassword,
      viewerPassword: generated.viewerPassword,
      adminPasswordHash,
      viewerPasswordHash,
    };
  }

  throw new Error("Could not generate a unique couple code");
}

export { DEFAULT_CONFIG };
