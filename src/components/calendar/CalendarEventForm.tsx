import { useEffect, useState, type FormEvent } from "react";
import { useConfirm } from "../layout/ModalProvider";
import { deleteDiaryPhoto, uploadDiaryPhoto } from "../../services/calendarService";
import type { DiaryEntry, DiaryPhoto } from "../../types";

type CalendarEventFormProps = {
  roomId: string | null;
  selectedDateKey: string;
  selectedEntry: DiaryEntry | null;
  onSelectDate: (dateKey: string) => void;
  onSave: (entry: DiaryEntry) => Promise<void>;
  onDelete: () => Promise<void>;
};

function dateKeyToDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1, 0, 0, 0);
}

export default function CalendarEventForm({ roomId, selectedDateKey, selectedEntry, onSelectDate, onSave, onDelete }: CalendarEventFormProps) {
  const requestConfirm = useConfirm();
  const [memo, setMemo] = useState("");
  const [anniversary, setAnniversary] = useState("");
  const [photos, setPhotos] = useState<DiaryPhoto[]>([]);
  const [removedPhotos, setRemovedPhotos] = useState<DiaryPhoto[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [hint, setHint] = useState("날짜를 눌러 함께한 하루를 저장해보세요.");
  const [error, setError] = useState("");
  const selectedPhotoText = files.length ? `선택된 사진 ${files.length}장` : "선택된 사진이 없어요";

  useEffect(() => {
    setMemo(selectedEntry?.memo || "");
    setAnniversary(selectedEntry?.anniversary || "");
    setPhotos([...(selectedEntry?.photos || [])]);
    setRemovedPhotos([]);
    setFiles([]);
    setError("");
    setHint(`${selectedDateKey} 기록을 편집하고 있어요.`);
  }, [selectedDateKey, selectedEntry]);

  const handleRemovePhoto = (index: number) => {
    const target = photos[index];
    if (!target) return;
    setRemovedPhotos((current) => [...current, target]);
    setPhotos((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!roomId) {
      setError("입장 후 다이어리를 저장할 수 있어요.");
      return;
    }
    setSaving(true);
    setHint("저장 중...");
    try {
      await Promise.all(removedPhotos.map((photo) => deleteDiaryPhoto(photo)));
      const uploaded: DiaryPhoto[] = [];
      for (const file of files) {
        if (!file.type.startsWith("image/")) continue;
        uploaded.push(await uploadDiaryPhoto(roomId, selectedDateKey, `${Date.now()}-${file.name}`, file));
      }
      const date = dateKeyToDate(selectedDateKey);
      await onSave({
        id: selectedDateKey,
        dateKey: selectedDateKey,
        dateTs: date.getTime(),
        monthKey: selectedDateKey.slice(0, 7),
        memo: memo.trim(),
        anniversary: anniversary.trim(),
        photos: [...photos, ...uploaded],
        updatedAt: Date.now(),
      });
      setFiles([]);
      setRemovedPhotos([]);
      setHint("저장 완료 ♡ 달력에도 바로 업데이트됐어요.");
    } catch {
      setError("다이어리 저장에 실패했어요. 네트워크와 Firebase 권한을 확인해주세요.");
      setHint("저장 실패");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setError("");
    if (!roomId) {
      setError("입장 후 다이어리를 삭제할 수 있어요.");
      return;
    }
    const ok = await requestConfirm({ title: "다이어리 삭제", message: "이 날짜의 다이어리 기록을 삭제할까요?", confirmLabel: "삭제", destructive: true });
    if (!ok) return;
    setSaving(true);
    setHint("삭제 중...");
    try {
      await onDelete();
      setHint("이 날짜 기록을 삭제했어요.");
    } catch {
      setError("다이어리 삭제에 실패했어요. 잠시 후 다시 시도해주세요.");
      setHint("삭제 실패");
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="card card--diaryEditor">
      <div className="card__title">선택한 날짜 기록</div>
      <form id="diaryForm" className="form" onSubmit={handleSubmit}>
        <label className="label">날짜<input id="diaryDate" className="input" type="date" value={selectedDateKey} onChange={(event) => onSelectDate(event.target.value)} disabled={saving} /></label>
        <label className="label">메모<textarea id="diaryMemo" className="textarea" rows={5} maxLength={1000} value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="오늘 같이 있었던 일, 기억하고 싶은 장면, 서로에게 하고 싶은 말들" disabled={saving} /></label>
        <label className="label">기념일 등록<input id="diaryAnniversary" className="input" type="text" maxLength={60} value={anniversary} onChange={(event) => setAnniversary(event.target.value)} placeholder="예: 첫 드라이브, 300일 벚꽃 데이트" disabled={saving} /></label>
        <div className="diaryUploadPicker">
          <label className="diaryUploadPicker__button" htmlFor="diaryPhotos">사진 선택하기</label>
          <span className="diaryUploadPicker__count">{selectedPhotoText}</span>
          <input id="diaryPhotos" className="diaryUploadPicker__input" type="file" accept="image/*" multiple onChange={(event) => setFiles([...(event.target.files || [])])} disabled={saving} />
        </div>
        <div className="diaryPhotoList" id="diaryPhotoList" data-react-render="true">
          {photos.length ? photos.map((photo, index) => (
            <div className="diaryPhoto" key={`${photo.storagePath}-${index}`}>
              <img className="diaryPhoto__img" src={photo.url} alt={`다이어리 사진 ${index + 1}`} loading="lazy" />
              <button className="diaryPhoto__remove" type="button" onClick={() => handleRemovePhoto(index)} disabled={saving}>삭제</button>
            </div>
          )) : <p className="hint">아직 등록된 사진이 없어요.</p>}
        </div>
        <div className="row">
          <button className="btn btn--primary" type="submit" disabled={saving}>{saving ? "저장 중..." : "이 날짜 저장"}</button>
          <button className="btn btn--soft" type="button" id="diaryDeleteBtn" onClick={handleDelete} disabled={saving}>이 날짜 삭제</button>
        </div>
        {error ? <p className="hint errorText">{error}</p> : <p className="hint" id="diarySaveHint">{hint}</p>}
      </form>
    </article>
  );
}
