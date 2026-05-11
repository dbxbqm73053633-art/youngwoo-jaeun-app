import { useCallback, useState } from "react";
import { addMemo, clearMemos, deleteMemo, listMemos } from "../services/memoService";
import type { MemoRecord } from "../types";

export function useMemos(roomId: string | null) {
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
    await addMemo(roomId, { title, body, createdAt: Date.now() });
    await reload();
  }, [reload, roomId]);

  const removeMemo = useCallback(async (memoId: string) => {
    if (!roomId) return;
    await deleteMemo(roomId, memoId);
    await reload();
  }, [reload, roomId]);

  const removeAllMemos = useCallback(async () => {
    if (!roomId) return;
    await clearMemos(roomId);
    await reload();
  }, [reload, roomId]);

  return { memos, loading, error, reload, createMemo, removeMemo, removeAllMemos };
}
