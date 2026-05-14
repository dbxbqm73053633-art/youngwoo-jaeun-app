import { useCallback, useEffect } from "react";
import CalendarEventForm from "../../components/calendar/CalendarEventForm";
import CalendarEventList from "../../components/calendar/CalendarEventList";
import CalendarGrid from "../../components/calendar/CalendarGrid";
import { useRoom } from "../../contexts/RoomContext";
import { useCalendar } from "../../hooks/useCalendar";

type CalendarScreenProps = {
  onReady?: () => void;
};

function dateFromKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1, 0, 0, 0);
}

function firstDateKeyOfMonth(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${date.getFullYear()}-${month}-01`;
}

export default function CalendarScreen({ onReady }: CalendarScreenProps) {
  const { admin, role, roomId } = useRoom();
  const {
    cursor,
    entries,
    error,
    loading,
    reload,
    removeEntry,
    saveEntry,
    selectedDateKey,
    selectedEntry,
    setCursor,
    setSelectedDateKey,
  } = useCalendar(roomId, new Date(), role);

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  useEffect(() => {
    void reload();
  }, [reload, roomId]);

  const handleSelectDate = useCallback((dateKey: string) => {
    const date = dateFromKey(dateKey);
    setCursor(new Date(date.getFullYear(), date.getMonth(), 1));
    setSelectedDateKey(dateKey);
  }, [setCursor, setSelectedDateKey]);

  const moveMonth = useCallback((offset: number) => {
    const next = new Date(cursor.getFullYear(), cursor.getMonth() + offset, 1, 0, 0, 0);
    setCursor(next);
    setSelectedDateKey(firstDateKeyOfMonth(next));
  }, [cursor, setCursor, setSelectedDateKey]);

  return (
    <section className="tab tab--active" id="tab-diary" aria-label="공동 다이어리">
      <section className="section">
        <div className="section__head">
          <h2 className="section__title">공동 다이어리</h2>
          <p className="section__desc">달력에 하루를 모아두고, 사진과 메모와 기념일을 함께 담아요.</p>
        </div>
        {loading ? <p className="hint">다이어리를 불러오는 중...</p> : null}
        {error ? <p className="hint errorText">다이어리를 불러오지 못했어요. Firebase 연결을 확인해주세요.</p> : null}

        <div className="grid grid--2 diaryGrid">
          <CalendarGrid
            cursor={cursor}
            entries={entries}
            selectedDateKey={selectedDateKey}
            onSelectDate={handleSelectDate}
            onPrevMonth={() => moveMonth(-1)}
            onNextMonth={() => moveMonth(1)}
          />
          <CalendarEventForm
            roomId={roomId}
            editable={admin}
            selectedDateKey={selectedDateKey}
            selectedEntry={selectedEntry}
            onSelectDate={handleSelectDate}
            onSave={saveEntry}
            onDelete={() => removeEntry(selectedDateKey)}
          />
        </div>
      </section>

      <CalendarEventList entries={entries} onSelectDate={handleSelectDate} />
    </section>
  );
}
