import { useEffect, useRef, useState, type KeyboardEvent, type TouchEvent, type WheelEvent } from "react";
import { formatPhotoDate, fromISODateInputValue, toISODateInputValue } from "../../services/photoService";
import type { PhotoRecord } from "../../types";

type PhotoModalProps = {
  photo: PhotoRecord | null;
  editable?: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onDelete: (id: string) => Promise<void>;
  onSetCover: (id: string) => Promise<void>;
  onSave: (patch: Partial<PhotoRecord>) => Promise<void>;
};

export default function PhotoModal({ photo, editable = true, onClose, onNext, onPrev, onDelete, onSetCover, onSave }: PhotoModalProps) {
  const [album, setAlbum] = useState("");
  const [date, setDate] = useState("");
  const [caption, setCaption] = useState("");
  const [memo, setMemo] = useState("");
  const [hint, setHint] = useState("수정 후 저장을 눌러주세요. (Ctrl/Cmd + S 가능)");
  const [saving, setSaving] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [dragX, setDragX] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const pinchDistance = useRef<number | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!photo) return;
    setAlbum(photo.album || "기본앨범");
    setDate(photo.date ? toISODateInputValue(photo.date) : "");
    setCaption(photo.caption || "");
    setMemo(photo.memo || "");
    setHint("수정 후 저장을 눌러주세요. (Ctrl/Cmd + S 가능)");
    setSaving(false);
    setZoom(1);
    setIsSettingsOpen(false);
    setIsImageLoaded(false);
    setDragX(0);
    window.requestAnimationFrame(() => panelRef.current?.focus());
  }, [photo]);

  useEffect(() => {
    document.body.classList.toggle("photo-modal-open", Boolean(photo));
    return () => document.body.classList.remove("photo-modal-open");
  }, [photo]);

  const handleSave = async () => {
    if (!photo || saving || !editable) return;
    setSaving(true);
    setHint("저장 중...");
    try {
      await onSave({
        album: album.trim() || "기본앨범",
        date: fromISODateInputValue(date),
        caption: caption.trim(),
        memo: memo.trim(),
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

  const distance = (touches: React.TouchList) => {
    const first = touches[0];
    const second = touches[1];
    if (!first || !second) return 0;
    return Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 2) {
      pinchDistance.current = distance(event.touches);
      setDragX(0);
      return;
    }
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 2 && pinchDistance.current !== null) {
      const nextDistance = distance(event.touches);
      if (!nextDistance) return;
      setZoom((current) => Math.min(3, Math.max(1, current * (nextDistance / pinchDistance.current!))));
      pinchDistance.current = nextDistance;
      return;
    }
    if (touchStartX.current === null || zoom > 1.05) return;
    const currentX = event.touches[0]?.clientX ?? touchStartX.current;
    setDragX(Math.max(-72, Math.min(72, (currentX - touchStartX.current) * 0.42)));
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (pinchDistance.current !== null) {
      pinchDistance.current = null;
      setDragX(0);
      return;
    }
    if (touchStartX.current === null || zoom > 1.05) {
      setDragX(0);
      return;
    }
    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    setDragX(0);
    if (Math.abs(delta) < 56) return;
    if (delta > 0) onPrev();
    else onNext();
  };

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    setZoom((current) => Math.min(3, Math.max(1, current + (event.deltaY < 0 ? 0.12 : -0.12))));
  };

  const handleDownload = () => {
    if (!photo) return;
    const link = document.createElement("a");
    link.href = photo.url;
    link.download = `${photo.caption || photo.name || "memory"}.jpg`;
    link.rel = "noopener";
    link.click();
  };

  const handleDelete = async () => {
    if (!photo?.id || !editable) return;
    await onDelete(photo.id);
    onClose();
  };

  const handleSetCover = async () => {
    if (!photo?.id || !editable) return;
    setHint("대표사진으로 설정 중...");
    await onSetCover(photo.id);
    setHint("대표사진으로 설정했어요 ♡");
  };

  return (
    <div className={`lightbox${photo ? " show" : ""}`} id="lightbox" aria-hidden={photo ? "false" : "true"} onKeyDown={handleKeyDown}>
      <div className="lightbox__backdrop" data-lb-close="1" onClick={onClose} />

      <div className="lightbox__center">
        <div ref={panelRef} className="lightbox__panel lightbox__panel--gallery" role="dialog" aria-modal="true" aria-label="사진 크게 보기" tabIndex={-1}>
          <button className="lightbox__close iconBtn" type="button" data-lb-close="1" aria-label="닫기" onClick={onClose}>×</button>
          <button className="lightbox__nav lightbox__nav--prev" type="button" id="lbPrev" aria-label="이전 사진" onClick={onPrev}>‹</button>
          <button className="lightbox__nav lightbox__nav--next" type="button" id="lbNext" aria-label="다음 사진" onClick={onNext}>›</button>

          <div className="lightbox__stage" id="lbStage" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} onWheel={handleWheel}>
            {photo ? <img className={`lightbox__img${isImageLoaded ? " is-loaded" : ""}`} id="lbImg" src={photo.url} alt={photo.caption || "사진 크게 보기"} draggable="false" decoding="async" fetchpriority="high" onLoad={() => setIsImageLoaded(true)} style={{ transform: `translate3d(${dragX}px, 0, 0) scale(${zoom})` }} /> : null}
          </div>

          <div className="lightbox__meta lightbox__meta--premium">
            <div className="lightbox__summary">
              <span>{photo?.album || "기본앨범"}</span>
              <strong>{photo?.caption || "우리의 한 장면"}</strong>
              <span>{formatPhotoDate(photo?.date)}</span>
              {photo?.memo ? <p>{photo.memo}</p> : null}
            </div>

            <div className="lightbox__actions">
              <button className="btn btn--soft" type="button" onClick={handleDownload}>다운로드</button>
              {editable ? (
                <button
                  className="lightbox__settingsBtn"
                  type="button"
                  aria-expanded={isSettingsOpen}
                  aria-label="사진 설정"
                  onClick={() => setIsSettingsOpen((current) => !current)}
                >
                  ⋯
                </button>
              ) : null}
            </div>

            {editable ? <div className={`lightbox__editPanel${isSettingsOpen ? " show" : ""}`}>
              <div className="lightbox__editActions">
                <button className="btn btn--soft" type="button" onClick={handleSetCover} disabled={photo?.isCover}>{photo?.isCover ? "대표사진" : "대표사진으로 설정"}</button>
                <button className="btn btn--danger" type="button" onClick={handleDelete}>삭제</button>
              </div>
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
                <button className="btn btn--soft" type="button" id="lbSave" onClick={handleSave} disabled={saving}>{saving ? "저장 중..." : "저장"}</button>
              </div>
              <label className="lbLabel">
                캡션
                <input id="lbCaptionInput" className="input" type="text" maxLength={60} value={caption} onChange={(event) => setCaption(event.target.value)} />
              </label>
              <label className="lbLabel">
                메모
                <textarea className="textarea" rows={3} maxLength={180} value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="이 사진에 남기고 싶은 마음" />
              </label>
              <div className="lightbox__saveHint" id="lbSaveHint">{hint} · 확대 {Math.round(zoom * 100)}%</div>
              </div>
            </div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
