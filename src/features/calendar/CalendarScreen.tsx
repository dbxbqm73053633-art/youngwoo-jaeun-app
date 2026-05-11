import { useCallback, useEffect, useState } from "react";
import CalendarEventForm from "../../components/calendar/CalendarEventForm";
import CalendarEventList from "../../components/calendar/CalendarEventList";
import CalendarGrid from "../../components/calendar/CalendarGrid";
import { useCalendar } from "../../hooks/useCalendar";

type CalendarScreenProps = {
  onReady?: () => void;
};

type LegacyWindow = Window & {
  __YWJY_ROOM_ID__?: string;
};

function dateFromMonthKey(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, (month || 1) - 1, 1);
}

export default function CalendarScreen({ onReady }: CalendarScreenProps) {
  const [roomId, setRoomId] = useState(() => (window as LegacyWindow).__YWJY_ROOM_ID__ ?? null);
  const {
    cursor,
    entries,
    reload,
    selectedDateKey,
    setCursor,
    setEntries,
    setSelectedDateKey,
  } = useCalendar(roomId);

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  useEffect(() => {
    const syncRoom = (event: Event) => {
      const detail = (event as CustomEvent<{ roomId?: string }>).detail;
      setRoomId(detail?.roomId ?? (window as LegacyWindow).__YWJY_ROOM_ID__ ?? null);
    };

    window.addEventListener("ywjy:room-ready", syncRoom);
    return () => window.removeEventListener("ywjy:room-ready", syncRoom);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload, roomId]);

  useEffect(() => {
    const handleCalendarChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ entries?: typeof entries; monthKey?: string; selectedDateKey?: string }>).detail;
      if (detail?.monthKey) setCursor(dateFromMonthKey(detail.monthKey));
      if (detail?.selectedDateKey) setSelectedDateKey(detail.selectedDateKey);
      if (detail?.entries) {
        setEntries(detail.entries);
      }
    };

    window.addEventListener("ywjy:calendar-changed", handleCalendarChanged);
    window.addEventListener("ywyj:calendar-changed", handleCalendarChanged);
    return () => {
      window.removeEventListener("ywjy:calendar-changed", handleCalendarChanged);
      window.removeEventListener("ywyj:calendar-changed", handleCalendarChanged);
    };
  }, [entries, setCursor, setEntries, setSelectedDateKey]);

  const handleSelectDate = useCallback((dateKey: string) => {
    setSelectedDateKey(dateKey);
    window.dispatchEvent(new CustomEvent("ywjy:select-diary-date", { detail: { dateKey } }));
  }, [setSelectedDateKey]);

  return (
    <section className="tab" id="tab-diary" aria-label="공동 다이어리">
      <section className="section">
        <div className="section__head">
          <h2 className="section__title">공동 다이어리</h2>
          <p className="section__desc">달력에 하루를 모아두고, 사진과 메모와 기념일을 함께 남겨요.</p>
        </div>

        <div className="grid grid--2 diaryGrid">
          <CalendarGrid
            cursor={cursor}
            entries={entries}
            selectedDateKey={selectedDateKey}
            onSelectDate={handleSelectDate}
          />
          <CalendarEventForm />
        </div>
      </section>

      <CalendarEventList entries={entries} onSelectDate={handleSelectDate} />

      {/* TODO: diary form save/delete and photo handling remain legacy-owned for now. */}
    </section>
  );
}
