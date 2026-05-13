import { useEffect, useState, type FormEvent } from "react";
import { useRoom } from "../../contexts/RoomContext";
import { useConfirm } from "../layout/ModalProvider";

function toISODateInputValue(timestamp: number) {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function fromISODateInputValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1, 0, 0, 0).getTime();
}

export default function CoupleSettingsForm() {
  const { admin, couple, saveCoupleConfig } = useRoom();
  const requestConfirm = useConfirm();
  const [nameA, setNameA] = useState(couple.nameA);
  const [nameB, setNameB] = useState(couple.nameB);
  const [startDate, setStartDate] = useState(toISODateInputValue(couple.startDate));
  const [saving, setSaving] = useState(false);
  const [hint, setHint] = useState("Firebase에 저장되면 모두 같이 적용돼요.");
  const [error, setError] = useState("");

  useEffect(() => {
    setNameA(couple.nameA);
    setNameB(couple.nameB);
    setStartDate(toISODateInputValue(couple.startDate));
  }, [couple.nameA, couple.nameB, couple.startDate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!admin) {
      setError("관리자 모드에서만 저장할 수 있어요.");
      return;
    }
    const ok = await requestConfirm({
      title: "기본 정보 저장",
      message: "커플 이름과 시작일을 새 값으로 저장할까요?",
      confirmLabel: "저장",
    });
    if (!ok) return;
    setSaving(true);
    try {
      await saveCoupleConfig({
        nameA: nameA.trim() || couple.nameA,
        nameB: nameB.trim() || couple.nameB,
        startDate: fromISODateInputValue(startDate),
      });
      setHint("저장 완료 ♡ 다시 들어와도 같은 값으로 보일 거예요.");
    } catch {
      setError("설정 저장에 실패했어요. Firebase 연결을 확인해주세요.");
      setHint("저장 실패");
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="card">
      <div className="card__title">기본 정보</div>
      <form id="adminInfoForm" className="form" onSubmit={handleSubmit}>
        <label className="label">
          첫 번째 이름
          <input id="adminNameA" className="input" type="text" maxLength={8} value={nameA} onChange={(event) => setNameA(event.target.value)} placeholder="예: 영우" disabled={!admin || saving} />
        </label>
        <label className="label">
          두 번째 이름
          <input id="adminNameB" className="input" type="text" maxLength={8} value={nameB} onChange={(event) => setNameB(event.target.value)} placeholder="예: 재은" disabled={!admin || saving} />
        </label>
        <label className="label">
          우리 시작일
          <input id="adminStartDate" className="input" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} disabled={!admin || saving} />
        </label>

        <div className="row">
          <button className="btn btn--primary" type="submit" disabled={!admin || saving}>{saving ? "저장 중..." : "저장"}</button>
          <span className={`promptForm__hint${error ? " errorText" : ""}`} id="adminInfoHint">{error || hint}</span>
        </div>
      </form>
    </article>
  );
}
