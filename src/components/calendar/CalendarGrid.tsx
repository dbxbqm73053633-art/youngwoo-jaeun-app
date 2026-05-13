import type { DiaryEntry } from "../../types";
import CalendarDay from "./CalendarDay";
import CalendarHeader from "./CalendarHeader";

type CalendarGridProps = {
  cursor: Date;
  entries: DiaryEntry[];
  selectedDateKey: string;
  onSelectDate: (dateKey: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
};

function toDateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export default function CalendarGrid({ cursor, entries, selectedDateKey, onSelectDate, onPrevMonth, onNextMonth }: CalendarGridProps) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const entriesByDate = new Map(entries.map((entry) => [entry.dateKey, entry]));
  const todayKey = toDateKey(new Date());

  return (
    <article className="card card--diaryCalendar">
      <CalendarHeader cursor={cursor} onPrevMonth={onPrevMonth} onNextMonth={onNextMonth} />

      <div className="diaryCalendar" id="diaryCalendar" data-react-render="true">
        {Array.from({ length: firstWeekday }).map((_, index) => (
          <CalendarDay key={`empty-${index}`} dateKey="" isEmpty />
        ))}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const dateKey = toDateKey(new Date(year, month, day));
          return (
            <CalendarDay
              key={dateKey}
              dateKey={dateKey}
              day={day}
              entry={entriesByDate.get(dateKey)}
              isActive={selectedDateKey === dateKey}
              isToday={todayKey === dateKey}
              onSelect={onSelectDate}
            />
          );
        })}
      </div>

      <p className="hint">점이 채워진 날짜에는 기록이 있어요. 날짜를 누르면 아래에서 편집할 수 있어요.</p>
    </article>
  );
}
