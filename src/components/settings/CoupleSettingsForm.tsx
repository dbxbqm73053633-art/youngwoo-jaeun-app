export default function CoupleSettingsForm() {
  return (
    <article className="card">
      <div className="card__title">기본 정보</div>
      <form id="adminInfoForm" className="form">
        <label className="label">
          첫 번째 이름
          <input id="adminNameA" className="input" type="text" maxLength={8} placeholder="예) 영우" />
        </label>
        <label className="label">
          두 번째 이름
          <input id="adminNameB" className="input" type="text" maxLength={8} placeholder="예) 지선" />
        </label>
        <label className="label">
          우리 시작일
          <input id="adminStartDate" className="input" type="date" />
        </label>

        <div className="row">
          <button className="btn btn--primary" type="submit">저장</button>
          <span className="promptForm__hint" id="adminInfoHint">Firebase에 저장돼서 둘 다 같이 적용돼요.</span>
        </div>
      </form>
    </article>
  );
}
