export default function ThemeSettings() {
  return (
    <article className="card">
      <div className="card__title">테마 / 보기 설정</div>
      <form id="themeForm" className="form">
        <label className="label">
          테마 선택
          <select id="themeSelect" className="input">
            <option value="romance">🌸 Pink Romance</option>
            <option value="minimal">🌿 Soft Minimal</option>
            <option value="lavender">💜 Lavender Dream</option>
          </select>
        </label>
        <div className="row">
          <button className="btn btn--soft" type="submit">테마 적용</button>
          <span className="promptForm__hint" id="themeHint">설정은 브라우저에 기억돼요.</span>
        </div>
      </form>
    </article>
  );
}
