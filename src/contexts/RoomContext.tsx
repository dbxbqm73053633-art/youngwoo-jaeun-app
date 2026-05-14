import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ensureAuth } from "../services/authService";
import { DEFAULT_CONFIG, ensureRoomMember, getExistingRoomConfig, getExistingRoomMemberRole, getRoomConfig, migrateValidatedRoomPassword, normalizeCoupleCode, resolveCoupleCode, resolveExistingLoginRoom, saveRoomConfig, validateRoomPassword, type RoomRole } from "../services/roomService";
import { isCurrentUserSystemAdmin } from "../services/systemAdminService";
import type { RoomConfig } from "../types";

const SESSION_KEY = "ywjy_unlocked_v3";
const ROOM_KEY = "ywjy_room_code_v1";
const ROLE_KEY = "ywjy_room_role_v1";
const CONFIGURED_COUPLE_CODE = String(import.meta.env.VITE_COUPLE_CODE || "").trim();
const ROOM_PASSWORD = String(import.meta.env.VITE_ROOM_PASSWORD || "").trim();
const initialUnlocked = sessionStorage.getItem(SESSION_KEY) === "1";
const initialRole = (sessionStorage.getItem(ROLE_KEY) === "viewer" ? "viewer" : "admin") as RoomRole;

type UnlockResult =
  | { ok: true }
  | { ok: false; reason: "invalid-code" | "missing-room" | "wrong-password" | "config-error" };

type LoginDebugState = {
  enteredCoupleCode: string;
  anonymousAuthSucceeded: boolean;
  roomDocumentExists: boolean | null;
  adminPasswordHashExists: boolean | null;
  passwordValidationPassed: boolean | null;
  resolvedRoomPath?: string;
  firebaseErrorCode?: string;
  firebaseErrorMessage?: string;
};

function logLoginFailureDebug(reason: string, state: LoginDebugState) {
  if (!import.meta.env.DEV) return;
  console.info("[Firebase room login debug]", {
    failureReason: reason,
    enteredCoupleCode: state.enteredCoupleCode,
    anonymousAuthSucceeded: state.anonymousAuthSucceeded,
    roomDocumentExists: state.roomDocumentExists,
    adminPasswordHashExists: state.adminPasswordHashExists,
    passwordValidationPassed: state.passwordValidationPassed,
    resolvedRoomPath: state.resolvedRoomPath || null,
    firebaseErrorCode: state.firebaseErrorCode || null,
    firebaseErrorMessage: state.firebaseErrorMessage || null,
  });
}

type RoomContextValue = {
  roomId: string | null;
  coupleCode: string | null;
  couple: RoomConfig;
  role: RoomRole | null;
  systemAdmin: boolean;
  unlocked: boolean;
  admin: boolean;
  loading: boolean;
  error: Error | null;
  isConfigured: boolean;
  unlock: (coupleCode: string, pass: string) => Promise<UnlockResult>;
  refreshRoom: () => Promise<void>;
  saveCoupleConfig: (config: RoomConfig) => Promise<void>;
};

const RoomContext = createContext<RoomContextValue | null>(null);

export function RoomProvider({ children }: { children: ReactNode }) {
  const [coupleCode, setCoupleCode] = useState<string | null>(() => {
    if (!initialUnlocked) return null;
    return normalizeCoupleCode(CONFIGURED_COUPLE_CODE) || sessionStorage.getItem(ROOM_KEY);
  });
  const [couple, setCouple] = useState<RoomConfig>(DEFAULT_CONFIG);
  const [unlocked, setUnlocked] = useState(initialUnlocked);
  const [role, setRole] = useState<RoomRole | null>(() => initialUnlocked ? initialRole : null);
  const [admin, setAdmin] = useState(initialUnlocked && initialRole === "admin");
  const [systemAdmin, setSystemAdmin] = useState(false);
  const [loading, setLoading] = useState(initialUnlocked);
  const [error, setError] = useState<Error | null>(null);
  const isConfigured = ROOM_PASSWORD.length > 0;

  const refreshRoom = useCallback(async () => {
    if (!coupleCode) return;
    setCouple(await getRoomConfig(coupleCode));
  }, [coupleCode]);

  const unlock = useCallback(async (nextCode: string, pass: string): Promise<UnlockResult> => {
    const requestedCode = normalizeCoupleCode(nextCode || CONFIGURED_COUPLE_CODE);
    const normalized = String(pass || "").trim();
    const debugState: LoginDebugState = {
      enteredCoupleCode: requestedCode,
      anonymousAuthSucceeded: false,
      roomDocumentExists: null,
      adminPasswordHashExists: null,
      passwordValidationPassed: null,
    };
    if (!isConfigured) {
      setError(new Error("Room password is not configured."));
      logLoginFailureDebug("config-error", debugState);
      return { ok: false, reason: "config-error" };
    }
    if (!requestedCode) {
      logLoginFailureDebug("invalid-code", debugState);
      return { ok: false, reason: "invalid-code" };
    }

    setLoading(true);
    setError(null);
    try {
      const user = await ensureAuth();
      debugState.anonymousAuthSucceeded = Boolean(user?.uid);
      setSystemAdmin(await isCurrentUserSystemAdmin());

      const loginRoom = await resolveExistingLoginRoom(requestedCode, normalized, CONFIGURED_COUPLE_CODE);
      const { activeCode, config } = loginRoom;
      debugState.roomDocumentExists = loginRoom.debugInfo.exists;
      debugState.adminPasswordHashExists = loginRoom.debugInfo.hasAdminPasswordHash;
      debugState.resolvedRoomPath = loginRoom.roomPath;

      if (!config) {
        debugState.passwordValidationPassed = false;
        logLoginFailureDebug("missing-room", debugState);
        return { ok: false, reason: "missing-room" };
      }

      if (import.meta.env.DEV) {
        console.warn("DEV MODE PASSWORD BYPASS ENABLED");
        debugState.passwordValidationPassed = true;
        const nextRole = user?.uid ? (await getExistingRoomMemberRole(activeCode, user.uid)) || "viewer" : "viewer";
        if (user?.uid) {
          await ensureRoomMember(activeCode, user.uid, nextRole);
        }

        sessionStorage.setItem(SESSION_KEY, "1");
        sessionStorage.setItem(ROOM_KEY, activeCode);
        sessionStorage.setItem(ROLE_KEY, nextRole);
        setCoupleCode(activeCode);
        setCouple(config);
        setUnlocked(true);
        setRole(nextRole);
        setAdmin(nextRole === "admin");
        if (user?.uid) {
          console.log(`Current Firebase UID: ${user.uid}`);
        }
        return { ok: true };
      }

      const validation = await validateRoomPassword(activeCode, normalized, ROOM_PASSWORD);
      debugState.passwordValidationPassed = validation.ok;
      if (!validation.ok) {
        logLoginFailureDebug(validation.reason, debugState);
        return { ok: false, reason: validation.reason === "missing" ? "missing-room" : "wrong-password" };
      }
      const nextRole = validation.role || "viewer";
      if (user?.uid) {
        await ensureRoomMember(activeCode, user.uid, nextRole);
      }
      if (validation.shouldMigrate) {
        void migrateValidatedRoomPassword(activeCode, nextRole, normalized).catch(() => undefined);
      }

      sessionStorage.setItem(SESSION_KEY, "1");
      sessionStorage.setItem(ROOM_KEY, activeCode);
      sessionStorage.setItem(ROLE_KEY, nextRole);
      setCoupleCode(activeCode);
      setCouple(config);
      setUnlocked(true);
      setRole(nextRole);
      setAdmin(nextRole === "admin");
      if (import.meta.env.DEV && user?.uid) {
        console.log(`Current Firebase UID: ${user.uid}`);
      }
      return { ok: true };
    } catch (caught) {
      const nextError = caught instanceof Error ? caught : new Error(String(caught));
      const firebaseError = caught as { code?: unknown; message?: unknown };
      debugState.firebaseErrorCode = typeof firebaseError?.code === "string" ? firebaseError.code : "";
      debugState.firebaseErrorMessage = typeof firebaseError?.message === "string" ? firebaseError.message : nextError.message;
      logLoginFailureDebug("firebase-error", debugState);
      setError(nextError);
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(ROOM_KEY);
      sessionStorage.removeItem(ROLE_KEY);
      setCoupleCode(null);
      setRole(null);
      setUnlocked(false);
      setAdmin(false);
      throw nextError;
    } finally {
      setLoading(false);
    }
  }, [isConfigured]);

  const saveCoupleConfig = useCallback(async (config: RoomConfig) => {
    if (!coupleCode) return;
    if (role !== "admin") throw new Error("Permission denied");
    await saveRoomConfig(coupleCode, config);
    setCouple({ ...config, coupleCode });
  }, [coupleCode, role]);

  useEffect(() => {
    if (!unlocked || coupleCode || !isConfigured) return;
    void resolveCoupleCode(CONFIGURED_COUPLE_CODE, ROOM_PASSWORD).then((nextCode) => setCoupleCode(nextCode));
  }, [coupleCode, isConfigured, unlocked]);

  useEffect(() => {
    if (!unlocked || !coupleCode) return;
    let cancelled = false;
    setLoading(true);
    void ensureAuth()
      .then(() => isCurrentUserSystemAdmin())
      .then((nextSystemAdmin) => {
        if (!cancelled) setSystemAdmin(nextSystemAdmin);
      })
      .then(() => getExistingRoomConfig(coupleCode))
      .then((config) => {
        if (cancelled) return;
        if (!config) {
          sessionStorage.removeItem(SESSION_KEY);
          sessionStorage.removeItem(ROOM_KEY);
          sessionStorage.removeItem(ROLE_KEY);
          setCoupleCode(null);
          setRole(null);
          setUnlocked(false);
          setAdmin(false);
          return;
        }
        setCouple(config);
      })
      .catch((caught) => {
        if (cancelled) return;
        setError(caught instanceof Error ? caught : new Error(String(caught)));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [coupleCode, isConfigured, unlock, unlocked]);

  const value = useMemo<RoomContextValue>(() => ({
    roomId: coupleCode,
    coupleCode,
    couple,
    role,
    systemAdmin,
    unlocked,
    admin,
    loading,
    error,
    isConfigured,
    unlock,
    refreshRoom,
    saveCoupleConfig,
  }), [admin, couple, coupleCode, error, isConfigured, loading, refreshRoom, role, saveCoupleConfig, systemAdmin, unlock, unlocked]);

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}

export function useRoom() {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error("useRoom must be used inside RoomProvider");
  }
  return context;
}
