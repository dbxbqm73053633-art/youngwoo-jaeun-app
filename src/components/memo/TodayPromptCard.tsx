export default function TodayPromptCard() {
  return (
    <section className="section">
      <div className="section__head">
        <h2 className="section__title">오늘의 한마디</h2>
        <p className="section__desc">매일 한 번, 서로에게 다정한 질문을 던져줄게요.</p>
      </div>

      <article className="card card--prompt">
        <div className="promptHeader">
          <div className="promptHeader__label">오늘의 질문</div>
          <div className="promptHeader__date" id="promptDateLabel">—</div>
        </div>
        <p className="promptQuestion" id="promptQuestion">오늘 질문을 불러오는 중…</p>

        <form id="promptForm" className="promptForm">
          <label className="label">
            나의 한마디
            <textarea id="promptMine" className="textarea" rows={2} maxLength={200} placeholder="오늘 나는 어떤 마음이었는지 적어볼까?" />
          </label>
          <label className="label">
            너에게 한마디
            <textarea id="promptYours" className="textarea" rows={2} maxLength={200} placeholder="지금 너에게 해주고 싶은 말을 적어줘." />
          </label>

          <div className="row">
            <button className="btn btn--primary" type="submit">오늘 기록 저장</button>
            <span className="promptForm__hint" id="promptSaveHint">둘 다 적고 저장하면 하트가 반짝여요 ♡</span>
          </div>
        </form>

        <div className="promptHeart" id="promptHeart" aria-hidden="true">♡</div>
      </article>
    </section>
  );
}
