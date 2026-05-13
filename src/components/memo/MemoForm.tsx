import { useState, type FormEvent } from "react";
import { useRoom } from "../../contexts/RoomContext";
import { useMemos } from "../../hooks/useMemos";
import { useConfirm } from "../layout/ModalProvider";
import MemoToolbar from "./MemoToolbar";

export default function MemoForm() {
  const { roomId, unlocked } = useRoom();
  const { createMemo, removeAllMemos } = useMemos(roomId);
  const requestConfirm = useConfirm();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!unlocked || !roomId) {
      setError("입장 후 메모를 저장할 수 있어요.");
      return;
    }
    if (!title.trim() && !body.trim()) {
      setError("제목이나 내용을 적어주세요 :)");
      return;
    }
    setSaving(true);
    try {
      await createMemo(title.trim(), body.trim());
      setTitle("");
      setBody("");
    } catch {
      setError("메모 저장에 실패했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setError("");
    if (!unlocked || !roomId) {
      setError("입장 후 메모를 삭제할 수 있어요.");
      return;
    }
    const ok = await requestConfirm({ title: "메모 전체 삭제", message: "메모를 전부 삭제할까요? 되돌릴 수 없어요.", confirmLabel: "삭제", destructive: true });
    if (!ok) return;
    setSaving(true);
    try {
      await removeAllMemos();
    } catch {
      setError("메모 삭제에 실패했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="card">
      <div className="card__title">새 메모</div>
      <form id="memoForm" className="form" onSubmit={handleSubmit}>
        <label className="label">
          제목
          <input id="memoTitle" className="input" type="text" maxLength={40} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="예: 오늘도 너라서 좋았어" disabled={saving} />
        </label>
        <label className="label">
          내용
          <textarea id="memoBody" className="textarea" maxLength={500} value={body} onChange={(event) => setBody(event.target.value)} placeholder="우리만 아는 말, 약속, 다짐, 추억들" disabled={saving} />
        </label>
        <MemoToolbar onClear={handleClear} saving={saving} />
        {error ? <p className="hint errorText">{error}</p> : <p className="hint">둘만의 비밀 이야기 ♡</p>}
      </form>
    </article>
  );
}
