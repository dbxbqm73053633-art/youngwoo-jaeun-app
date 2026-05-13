import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ensureAuth } from "../services/authService";
import { DEFAULT_CONFIG, ensureRoomDoc, getRoomConfig, makeRoomId, saveRoomConfig } from "../services/roomService";
import type { RoomConfig } from "../types";

const SESSION_KEY = "ywjy_unlocked_v3";
const ROOM_PASSWORD = String(import.meta.env.VITE_ROOM_PASSWORD || "").trim();

type RoomContextValue = {
  roomId: string | null;
  couple: RoomConfig;
  unlocked: boolean;
  admin: boolean;
  loading: boolean;
  error: Error | null;
  isConfigured: boolean;
  unlock: (pass: string) => Promise<boolean>;
  refreshRoom: () => Promise<void>;
  saveCoupleConfig: (config: RoomConfig) => Promise<void>;
};

const RoomContext = createContext<RoomContextValue | null>(null);

export function RoomProvider({ children }: { children: ReactNode }) {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [couple, setCouple] = useState<RoomConfig>(DEFAULT_CONFIG);
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === "1");
  const [admin, setAdmin] = useState(() => sessionStorage.getItem(SESSION_KEY) === "1");
  const [loading, setLoading] = useState(() => sessionStorage.getItem(SESSION_KEY) === "1");
  const [error, setError] = useState<Error | null>(null);
  const isConfigured = ROOM_PASSWORD.length > 0;

  const refreshRoom = useCallback(async () => {
    if (!roomId) return;
    setCouple(await getRoomConfig(roomId));
  }, [roomId]);

  const unlock = useCallback(async (pass: string) => {
    const normalized = String(pass || "").trim();
    if (!isConfigured) {
      setError(new Error("Room password is not configured."));
      return false;
    }
    if (normalized !== ROOM_PASSWORD) return false;

    setLoading(true);
    setError(null);
    try {
      const nextRoomId = await makeRoomId(normalized);
      await ensureAuth();
      await ensureRoomDoc(nextRoomId);
      const config = await getRoomConfig(nextRoomId);
      sessionStorage.setItem(SESSION_KEY, "1");
      setRoomId(nextRoomId);
      setCouple(config);
      setUnlocked(true);
      setAdmin(true);
      return true;
    } catch (caught) {
      const nextError = caught instanceof Error ? caught : new Error(String(caught));
      setError(nextError);
      sessionStorage.removeItem(SESSION_KEY);
      setUnlocked(false);
      setAdmin(false);
      throw nextError;
    } finally {
      setLoading(false);
    }
  }, [isConfigured]);

  const saveCoupleConfig = useCallback(async (config: RoomConfig) => {
    if (!roomId) return;
    await saveRoomConfig(roomId, config);
    setCouple(config);
  }, [roomId]);

  useEffect(() => {
    if (!unlocked || roomId || !isConfigured) return;
    void unlock(ROOM_PASSWORD);
  }, [isConfigured, roomId, unlock, unlocked]);

  const value = useMemo<RoomContextValue>(() => ({
    roomId,
    couple,
    unlocked,
    admin,
    loading,
    error,
    isConfigured,
    unlock,
    refreshRoom,
    saveCoupleConfig,
  }), [admin, couple, error, isConfigured, loading, refreshRoom, roomId, saveCoupleConfig, unlock, unlocked]);

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}

export function useRoom() {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error("useRoom must be used inside RoomProvider");
  }
  return context;
}
