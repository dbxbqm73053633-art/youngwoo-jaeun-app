import { useCallback, useState } from "react";
import { addMemo, clearMemos, deleteMemo, listMemos } from "../services/memoService";
import { assertAdminRole } from "../services/permissionService";
import type { RoomRole } from "../services/roomService";
import type { MemoRecord } from "../types";

export function useMemos(roomId: string | null, role: RoomRole | null = "admin") {
  const [memos, setMemos] = useState<MemoRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    if (!roomId) return;
    setLoading(true);
    setError(null);
    try {
      setMemos(await listMemos(roomId));
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error(String(caught)));
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  const createMemo = useCallback(async (title: string, body: string) => {
    if (!roomId) return;
    assertAdminRole(role);
    await addMemo(roomId, { title, body, createdAt: Date.now() });
    await reload();
  }, [reload, role, roomId]);

  const removeMemo = useCallback(async (memoId: string) => {
    if (!roomId) return;
    assertAdminRole(role);
    await deleteMemo(roomId, memoId);
    await reload();
  }, [reload, role, roomId]);

  const removeAllMemos = useCallback(async () => {
    if (!roomId) return;
    assertAdminRole(role);
    await clearMemos(roomId);
    await reload();
  }, [reload, role, roomId]);

  return { memos, loading, error, reload, createMemo, removeMemo, removeAllMemos };
}
