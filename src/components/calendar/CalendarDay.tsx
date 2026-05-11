import type { DiaryEntry } from "../../types";

type CalendarDayProps = {
  dateKey: string;
  day?: number;
  entry?: DiaryEntry | null;
  isActive?: boolean;
  isEmpty?: boolean;
  isToday?: boolean;
  onSelect?: (dateKey: string) => void;
};

export default function CalendarDay({
  dateKey,
  day,
  entry,
  isActive = false,
  isEmpty = false,
  isToday = false,
  onSelect,
}: CalendarDayProps) {
  if (isEmpty) {
    return <button className="diaryCell diaryCell--empty" type="button" disabled aria-hidden="true" />;
  }

  const hasContent = Boolean(entry?.memo.trim() || entry?.anniversary.trim() || entry?.photos.length);
  const classes = ["diaryCell"];
  if (isActive) classes.push("diaryCell--active");
  if (isToday) classes.push("diaryCell--today");
  if (hasContent) classes.push("diaryCell--filled");

  return (
    <button
      className={classes.join(" ")}
      type="button"
      data-date-key={dateKey}
      aria-label={`${dateKey} 기록 열기`}
      onClick={() => onSelect?.(dateKey)}
    >
      <span className="diaryCell__day">{day}</span>
      <span className="diaryCell__dots">
        {entry?.memo.trim() ? <span className="diaryDot diaryDot--memo" /> : null}
        {entry?.photos.length ? <span className="diaryDot diaryDot--photo" /> : null}
        {entry?.anniversary.trim() ? <span className="diaryDot diaryDot--anni" /> : null}
      </span>
    </button>
  );
}
