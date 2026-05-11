export default function CalendarEventForm() {
  return (
    <article className="card card--diaryEditor">
      <div className="card__title">선택한 날짜 기록</div>
      <form id="diaryForm" className="form">
        <label className="label">
          날짜
          <input id="diaryDate" className="input" type="date" />
        </label>

        <label className="label">
          메모
          <textarea id="diaryMemo" className="textarea" rows={5} maxLength={1000} placeholder="오늘 같이 있었던 일, 기억하고 싶은 장면, 너에게 하고 싶은 말…" />
        </label>

        <label className="label">
          기념일 등록
          <input id="diaryAnniversary" className="input" type="text" maxLength={60} placeholder="예) 첫 드라이브, 300일, 벚꽃 데이트" />
        </label>

        <label className="label">
          사진 추가
          <input id="diaryPhotos" className="input" type="file" accept="image/*" multiple />
        </label>

        {/* TODO: legacy diary code still renders existing/uploaded photo rows and remove handlers here. */}
        <div className="diaryPhotoList" id="diaryPhotoList">
          <p className="hint">아직 등록된 사진이 없어요.</p>
        </div>

        <div className="row">
          <button className="btn btn--primary" type="submit">이 날짜 저장</button>
          <button className="btn btn--soft" type="button" id="diaryDeleteBtn">이 날짜 삭제</button>
        </div>
        <p className="hint" id="diarySaveHint">날짜를 눌러서 함께 쓴 하루를 저장해보세요 ♡</p>
      </form>
    </article>
  );
}
