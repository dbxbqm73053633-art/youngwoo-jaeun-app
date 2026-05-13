type AnniversaryCardsProps = {
  label: string;
  value: string;
};

export default function AnniversaryCards({ label, value }: AnniversaryCardsProps) {
  return (
    <article className="card">
      <div className="card__title">다음 기념일</div>
      <div className="nextBox">
        <div className="nextBox__label" id="nextLabel">{label}</div>
        <div className="nextBox__value" id="nextValue">{value}</div>
      </div>
      <p className="hint">소중한 하루와 특별한 날이 지나가니까요. 마일스톤은 자동으로 계산해요 ♡</p>
    </article>
  );
}
