type MemoToolbarProps = {
  onClear: () => void;
  saving?: boolean;
};

export default function MemoToolbar({ onClear, saving = false }: MemoToolbarProps) {
  return (
    <div className="row">
      <button className="btn btn--primary" type="submit" disabled={saving}>{saving ? "저장 중..." : "저장"}</button>
      <button className="btn btn--soft" type="button" id="clearMemos" onClick={onClear} disabled={saving}>메모 전체 삭제</button>
    </div>
  );
}
