import { useCallback, useEffect, useState } from "react";
import { MEMO_EMPTY_LINES } from "../../constants/emotionalCopy";
import { useRoom } from "../../contexts/RoomContext";
import { useMemos } from "../../hooks/useMemos";
import { useConfirm } from "../layout/ModalProvider";
import MemoCard from "./MemoCard";

function formatMemoDate(timestamp: number) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const week = ["일", "월", "화", "수", "목", "금", "토"];
  const pad2 = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}.${pad2(date.getMonth() + 1)}.${pad2(date.getDate())} (${week[date.getDay()]})`;
}

export default function MemoList() {
  const { admin, role, roomId } = useRoom();
  const { error, loading, memos, reload, removeMemo } = useMemos(roomId, role);
  const requestConfirm = useConfirm();
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    void reload();
  }, [reload, roomId]);

  const handleDelete = useCallback(async (id: string) => {
    setDeleteError("");
    if (!admin) return;
    const ok = await requestConfirm({
      title: "메모 삭제",
      message: "이 메모를 삭제할까요?",
      confirmLabel: "삭제",
      destructive: true,
    });
    if (!ok) return;
    try {
      await removeMemo(id);
    } catch {
      setDeleteError("메모 삭제에 실패했어요. 잠시 후 다시 시도해주세요.");
    }
  }, [admin, requestConfirm, removeMemo]);

  return (
    <article className="card">
      <div className="card__title">저장된 메모</div>
      <div className="memoList" id="memoList" data-react-render="true">
        {loading ? <p className="hint">메모를 불러오는 중...</p> : null}
        {error ? <p className="hint errorText">메모를 불러오지 못했어요. Firebase 연결을 확인해주세요.</p> : null}
        {deleteError ? <p className="hint errorText">{deleteError}</p> : null}
        {!loading && !error && memos.length ? (
          memos.map((memo) => (
            <MemoCard
              key={memo.id}
              id={memo.id ?? ""}
              title={memo.title || "제목 없음"}
              body={memo.body}
              date={formatMemoDate(memo.createdAt)}
              onDelete={admin ? handleDelete : undefined}
            />
          ))
        ) : null}
        {!loading && !error && !memos.length ? (
          <div className="memoEmpty emptyState">
            <strong>아직 메모가 없어요</strong>
            <span>{MEMO_EMPTY_LINES[0]}</span>
            <small>{MEMO_EMPTY_LINES[1]}</small>
          </div>
        ) : null}
      </div>
    </article>
  );
}
