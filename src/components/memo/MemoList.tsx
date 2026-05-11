import { useCallback, useEffect, useState } from "react";
import { useMemos } from "../../hooks/useMemos";
import MemoCard from "./MemoCard";

type LegacyWindow = Window & {
  __YWJY_ROOM_ID__?: string;
};

function formatMemoDate(timestamp: number) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const week = ["일", "월", "화", "수", "목", "금", "토"];
  const pad2 = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}.${pad2(date.getMonth() + 1)}.${pad2(date.getDate())} (${week[date.getDay()]})`;
}

export default function MemoList() {
  const [roomId, setRoomId] = useState(() => (window as LegacyWindow).__YWJY_ROOM_ID__ ?? null);
  const { memos, reload, removeMemo } = useMemos(roomId);

  useEffect(() => {
    const syncRoom = (event: Event) => {
      const detail = (event as CustomEvent<{ roomId?: string }>).detail;
      setRoomId(detail?.roomId ?? (window as LegacyWindow).__YWJY_ROOM_ID__ ?? null);
    };

    window.addEventListener("ywjy:room-ready", syncRoom);
    return () => window.removeEventListener("ywjy:room-ready", syncRoom);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload, roomId]);

  useEffect(() => {
    const handleMemosChanged = () => {
      void reload();
    };

    window.addEventListener("ywjy:memos-changed", handleMemosChanged);
    return () => window.removeEventListener("ywjy:memos-changed", handleMemosChanged);
  }, [reload]);

  const handleDelete = useCallback(async (id: string) => {
    const ok = confirm("이 메모를 삭제할까요?");
    if (!ok) return;
    await removeMemo(id);
  }, [removeMemo]);

  return (
    <article className="card">
      <div className="card__title">저장된 메모</div>
      <div className="memoList" id="memoList" data-react-render="true">
        {memos.length ? (
          memos.map((memo) => (
            <MemoCard
              key={memo.id}
              id={memo.id ?? ""}
              title={memo.title || "제목 없음"}
              body={memo.body}
              date={formatMemoDate(memo.createdAt)}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <p className="hint">아직 메모가 없어요. 오늘 있었던 일을 살짝 남겨볼까요?</p>
        )}
      </div>
      {/* TODO: memo create/clear handlers are still legacy-owned; this list reloads from service events. */}
    </article>
  );
}
