import type { DiaryEntry } from "../../types";

type CalendarEventListProps = {
  entries: DiaryEntry[];
  onSelectDate: (dateKey: string) => void;
};

function formatShortDate(dateKey: string) {
  const [, month, day] = dateKey.split("-");
  return `${Number(month)}/${Number(day)}`;
}

export default function CalendarEventList({ entries, onSelectDate }: CalendarEventListProps) {
  const anniversaries = entries
    .filter((entry) => entry.anniversary.trim())
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey, "ko"));

  return (
    <section className="section section--compact">
      <div className="section__head">
        <h2 className="section__title">이번 달 기념일</h2>
        <p className="section__desc">달력에 남긴 특별한 날만 모아서 볼 수 있어요.</p>
      </div>

      <article className="card">
        <div className="diaryAnniversaryList" id="diaryAnniversaryList" data-react-render="true">
          {anniversaries.length ? (
            anniversaries.map((entry) => (
              <button
                key={entry.dateKey}
                className="diaryAnniversaryItem"
                type="button"
                data-anni-date={entry.dateKey}
                onClick={() => onSelectDate(entry.dateKey)}
              >
                <span className="diaryAnniversaryItem__date">{formatShortDate(entry.dateKey)}</span>
                <span className="diaryAnniversaryItem__text">{entry.anniversary.trim()}</span>
              </button>
            ))
          ) : (
            <p className="hint emptyState">이번 달에는 아직 등록한 기념일이 없어요.</p>
          )}
        </div>
      </article>
    </section>
  );
}
