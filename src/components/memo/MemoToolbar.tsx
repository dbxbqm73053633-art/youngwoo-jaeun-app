export default function MemoToolbar() {
  return (
    <div className="row">
      <button className="btn btn--primary" type="submit">저장</button>
      <button className="btn btn--soft" type="button" id="clearMemos">메모 전체 삭제</button>
    </div>
  );
}
