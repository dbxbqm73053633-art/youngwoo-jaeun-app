import MemoToolbar from "./MemoToolbar";

export default function MemoForm() {
  return (
    <article className="card">
      <div className="card__title">새 메모</div>

      <form id="memoForm" className="form">
        <label className="label">
          제목
          <input id="memoTitle" className="input" type="text" maxLength={40} placeholder="예) 오늘도 너라서 좋았어" />
        </label>

        <label className="label">
          내용
          <textarea id="memoBody" className="textarea" maxLength={500} placeholder="우리만 아는 말, 약속, 다짐, 추억…" />
        </label>

        <MemoToolbar />

        <p className="hint">※ 우리들만의 비밀이야기 ♡</p>
      </form>
    </article>
  );
}
