export default function TodaySummary() {
  return (
    <section className="section section--compact" aria-label="오늘 요약">
      <div className="section__head">
        <h2 className="section__title">오늘의 우리</h2>
        <p className="section__desc">오늘 감정과 한마디는 다른 탭에서 더 자세히 남길 수 있어요.</p>
      </div>

      <div className="grid grid--2">
        <article className="card">
          <div className="card__title">오늘 기분 한 줄 요약</div>
          <p className="hint" id="homeMoodSummary">아직 오늘 다이어리를 남기지 않았어요. ‘다이어리’ 탭에서 하루를 적어볼까요?</p>
        </article>

        <article className="card">
          <div className="card__title">오늘의 한마디</div>
          <p className="hint" id="homePromptSummary">‘한마디’ 탭에서 오늘의 질문에 답하면 여기에 살짝 보여줄게요.</p>
        </article>
      </div>
    </section>
  );
}
