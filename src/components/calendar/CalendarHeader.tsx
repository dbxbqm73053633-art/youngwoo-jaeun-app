type CalendarHeaderProps = {
  cursor: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
};

export default function CalendarHeader({ cursor, onPrevMonth, onNextMonth }: CalendarHeaderProps) {
  return (
    <>
      <div className="diaryCalendar__head">
        <button className="iconBtn" id="diaryPrevMonth" type="button" aria-label="이전 달" onClick={onPrevMonth}>‹</button>
        <div>
          <div className="card__title">월별 달력</div>
          <div className="diaryCalendar__month" id="diaryMonthLabel">{cursor.getFullYear()}년 {cursor.getMonth() + 1}월</div>
        </div>
        <button className="iconBtn" id="diaryNextMonth" type="button" aria-label="다음 달" onClick={onNextMonth}>›</button>
      </div>

      <div className="diaryLegend" aria-label="다이어리 표시 범례">
        <span className="diaryLegend__item"><span className="diaryDot diaryDot--memo" /> 메모</span>
        <span className="diaryLegend__item"><span className="diaryDot diaryDot--photo" /> 사진</span>
        <span className="diaryLegend__item"><span className="diaryDot diaryDot--anni" /> 기념일</span>
      </div>

      <div className="diaryWeekdays" aria-hidden="true">
        <span>일</span>
        <span>월</span>
        <span>화</span>
        <span>수</span>
        <span>목</span>
        <span>금</span>
        <span>토</span>
      </div>
    </>
  );
}
