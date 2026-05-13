import { useEffect, useRef, useState, type KeyboardEvent, type TouchEvent } from "react";
import { fromISODateInputValue, toISODateInputValue } from "../../services/photoService";
import type { PhotoRecord } from "../../types";

type PhotoModalProps = {
  photo: PhotoRecord | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSave: (patch: Partial<PhotoRecord>) => Promise<void>;
};

export default function PhotoModal({ photo, onClose, onNext, onPrev, onSave }: PhotoModalProps) {
  const [album, setAlbum] = useState("");
  const [date, setDate] = useState("");
  const [caption, setCaption] = useState("");
  const [hint, setHint] = useState("수정 후 저장을 눌러주세요. (Ctrl/Cmd + S 가능)");
  const [saving, setSaving] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!photo) return;
    setAlbum(photo.album || "기본앨범");
    setDate(photo.date ? toISODateInputValue(photo.date) : "");
    setCaption(photo.caption || "");
    setHint("수정 후 저장을 눌러주세요. (Ctrl/Cmd + S 가능)");
    setSaving(false);
    window.requestAnimationFrame(() => panelRef.current?.focus());
  }, [photo]);

  const handleSave = async () => {
    if (!photo || saving) return;
    setSaving(true);
    setHint("저장 중...");
    try {
      await onSave({
        album: album.trim() || "기본앨범",
        date: fromISODateInputValue(date),
        caption: caption.trim(),
      });
      setHint("저장 완료 ♡");
    } catch {
      setHint("저장하지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") onClose();
    if (event.key === "ArrowLeft") onPrev();
    if (event.key === "ArrowRight") onNext();
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      void handleSave();
    }
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 56) return;
    if (delta > 0) onPrev();
    else onNext();
  };

  return (
    <div className={`lightbox${photo ? " show" : ""}`} id="lightbox" aria-hidden={photo ? "false" : "true"} onKeyDown={handleKeyDown}>
      <div className="lightbox__backdrop" data-lb-close="1" onClick={onClose} />

      <div ref={panelRef} className="lightbox__panel" role="dialog" aria-modal="true" aria-label="사진 크게 보기" tabIndex={-1}>
        <button className="lightbox__close iconBtn" type="button" data-lb-close="1" aria-label="닫기" onClick={onClose}>×</button>

        <button className="lightbox__nav lightbox__nav--prev" type="button" id="lbPrev" aria-label="이전 사진" onClick={onPrev}>‹</button>
        <button className="lightbox__nav lightbox__nav--next" type="button" id="lbNext" aria-label="다음 사진" onClick={onNext}>›</button>

        <div className="lightbox__stage" id="lbStage" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          {photo ? <img className="lightbox__img" id="lbImg" src={photo.url} alt={photo.caption || "사진 크게 보기"} draggable="false" decoding="async" /> : null}
        </div>

        <div className="lightbox__meta">
          <div className="lightbox__form" aria-label="사진 정보 수정">
            <label className="lbLabel">
              앨범
              <input id="lbAlbum" className="input" type="text" value={album} onChange={(event) => setAlbum(event.target.value)} />
            </label>
            <div className="lbRow">
              <label className="lbLabel">
                사진 날짜
                <input id="lbDate" className="input" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
              </label>
              <button className="btn btn--soft" type="button" id="lbSave" onClick={handleSave} disabled={saving}>
                {saving ? "저장 중..." : "저장"}
              </button>
            </div>
            <label className="lbLabel">
              캡션
              <input id="lbCaptionInput" className="input" type="text" maxLength={60} value={caption} onChange={(event) => setCaption(event.target.value)} />
            </label>
            <div className="lightbox__saveHint" id="lbSaveHint">{hint}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
