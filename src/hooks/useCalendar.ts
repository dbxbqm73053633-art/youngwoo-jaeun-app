import { useCallback, useMemo, useState } from "react";
import { deleteDiary, listDiaryMonth, saveDiary } from "../services/calendarService";
import type { DiaryEntry } from "../types";

function toMonthKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${date.getFullYear()}-${month}`;
}

function toDateKey(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  return `${toMonthKey(date)}-${day}`;
}

export function useCalendar(roomId: string | null, initialDate = new Date()) {
  const [cursor, setCursor] = useState(() => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
  const [selectedDateKey, setSelectedDateKey] = useState(() => toDateKey(initialDate));
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const monthKey = useMemo(() => toMonthKey(cursor), [cursor]);
  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.dateKey === selectedDateKey) ?? null,
    [entries, selectedDateKey],
  );

  const reload = useCallback(async () => {
    if (!roomId) return;
    setLoading(true);
    setError(null);
    try {
      setEntries(await listDiaryMonth(roomId, monthKey));
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error(String(caught)));
    } finally {
      setLoading(false);
    }
  }, [monthKey, roomId]);

  const saveEntry = useCallback(async (entry: DiaryEntry) => {
    if (!roomId) return;
    await saveDiary(roomId, entry.dateKey, entry);
    setSelectedDateKey(entry.dateKey);
    await reload();
  }, [reload, roomId]);

  const removeEntry = useCallback(async (dateKey = selectedDateKey) => {
    if (!roomId) return;
    await deleteDiary(roomId, dateKey);
    await reload();
  }, [reload, roomId, selectedDateKey]);

  return {
    cursor,
    monthKey,
    selectedDateKey,
    selectedEntry,
    entries,
    loading,
    error,
    setCursor,
    setEntries,
    setSelectedDateKey,
    reload,
    saveEntry,
    removeEntry,
  };
}
