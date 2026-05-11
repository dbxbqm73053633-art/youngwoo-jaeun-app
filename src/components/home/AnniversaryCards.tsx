export default function AnniversaryCards() {
  return (
    <article className="card">
      <div className="card__title">다음 기념일</div>
      <div className="nextBox">
        <div className="nextBox__label" id="nextLabel">—</div>
        <div className="nextBox__value" id="nextValue">—</div>
      </div>
      <p className="hint">소소한 하루도 특별한 날이 되니까요. 마일스톤은 자동으로 계산해요 ♡</p>
    </article>
  );
}
