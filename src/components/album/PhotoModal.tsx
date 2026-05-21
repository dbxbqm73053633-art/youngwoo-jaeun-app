import { useEffect, useRef, useState, type KeyboardEvent, type TouchEvent, type WheelEvent } from "react";
import { formatPhotoDate, fromISODateInputValue, toISODateInputValue } from "../../services/photoService";
import type { PhotoRecord } from "../../types";

type PhotoModalProps = {
  photo: PhotoRecord | null;
  photos?: PhotoRecord[];
  currentIndex?: number;
  editable?: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSelectIndex?: (index: number) => void;
  onDelete: (id: string) => Promise<void>;
  onSetCover: (id: string) => Promise<void>;
  onSave: (patch: Partial<PhotoRecord>) => Promise<void>;
};

export default function PhotoModal({ photo, photos = [], currentIndex = 0, editable = true, onClose, onNext, onPrev, onSelectIndex, onDelete, onSetCover, onSave }: PhotoModalProps) {
  const [album, setAlbum] = useState("");
  const [date, setDate] = useState("");
  const [caption, setCaption] = useState("");
  const [memo, setMemo] = useState("");
  const [hint, setHint] = useState("수정 후 저장을 눌러주세요. (Ctrl/Cmd + S 가능)");
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<"idle" | "success" | "error">("idle");
  const [zoom, setZoom] = useState(1);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
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
    setDownloading(false);
    setDownloadStatus("idle");
    setZoom(1);
    setIsActionSheetOpen(false);
    setIsEditSheetOpen(false);
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
      setIsEditSheetOpen(false);
    } catch {
      setHint("저장하지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      if (isEditSheetOpen) {
        setIsEditSheetOpen(false);
        return;
      }
      if (isActionSheetOpen) {
        setIsActionSheetOpen(false);
        return;
      }
      onClose();
    }
    if (event.key === "ArrowLeft") onPrev();
    if (event.key === "ArrowRight") onNext();
    if (isEditSheetOpen && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
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

  const downloadFileName = () => {
    const baseName = (photo?.caption || photo?.name || "memory")
      .trim()
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, "-")
      .slice(0, 80) || "memory";
    return `${baseName}.jpg`;
  };

  const handleDownload = async () => {
    if (!photo) return;
    setDownloading(true);
    setDownloadStatus("idle");
    setHint("다운로드 중...");
    try {
      const response = await fetch(photo.url, { mode: "cors", credentials: "omit" });
      if (!response.ok) throw new Error("Image fetch failed");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = downloadFileName();
      link.rel = "noopener";
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      setDownloadStatus("success");
      setHint("다운로드를 시작했어요.");
    } catch {
      setDownloadStatus("error");
      setHint("다운로드가 막혀 새 창으로 열었어요.");
      window.open(photo.url, "_blank", "noopener,noreferrer");
    } finally {
      setDownloading(false);
      window.setTimeout(() => setDownloadStatus("idle"), 2400);
    }
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
    setIsActionSheetOpen(false);
  };

  const openEditSheet = () => {
    setIsActionSheetOpen(false);
    setIsEditSheetOpen(true);
    setHint("수정 후 저장을 눌러주세요. (Ctrl/Cmd + S 가능)");
  };

  const photoCountLabel = photos.length ? `${currentIndex + 1} / ${photos.length}` : "1 / 1";
  const visibleThumbs = photos.length > 8
    ? photos.slice(Math.max(0, Math.min(currentIndex - 3, photos.length - 8)), Math.max(0, Math.min(currentIndex - 3, photos.length - 8)) + 8)
    : photos;
  const visibleThumbStart = photos.length > 8 ? Math.max(0, Math.min(currentIndex - 3, photos.length - 8)) : 0;

  return (
    <div className={`lightbox${photo ? " show" : ""}`} id="lightbox" aria-hidden={photo ? "false" : "true"} onKeyDown={handleKeyDown}>
      <div className="lightbox__backdrop" data-lb-close="1" onClick={onClose} />

      <div className="lightbox__center">
        <div ref={panelRef} className="lightbox__panel lightbox__panel--gallery" role="dialog" aria-modal="true" aria-label="사진 크게 보기" tabIndex={-1}>
          <div className="lightbox__topbar">
            <button className="lightbox__close iconBtn" type="button" data-lb-close="1" aria-label="닫기" onClick={onClose}>×</button>
            <div className="lightbox__counter" aria-label="사진 위치">{photoCountLabel}</div>
            <button
              className="lightbox__settingsBtn"
              type="button"
              aria-expanded={isActionSheetOpen}
              aria-label="사진 작업 열기"
              onClick={() => setIsActionSheetOpen(true)}
            >
              ⋯
            </button>
          </div>

          <div className="lightbox__stage" id="lbStage" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} onWheel={handleWheel}>
            {photo ? (
              <>
                <img className="lightbox__bgImg" src={photo.url} alt="" aria-hidden="true" draggable="false" decoding="async" />
                <img className={`lightbox__img${isImageLoaded ? " is-loaded" : ""}`} id="lbImg" src={photo.url} alt={photo.caption || "사진 크게 보기"} draggable="false" decoding="async" fetchpriority="high" onLoad={() => setIsImageLoaded(true)} style={{ transform: `translate3d(${dragX}px, 0, 0) scale(${zoom})` }} />
              </>
            ) : null}
          </div>
          <button className="lightbox__edgeNav lightbox__edgeNav--prev" type="button" id="lbPrev" aria-label="이전 사진" onClick={onPrev}>‹</button>
          <button className="lightbox__edgeNav lightbox__edgeNav--next" type="button" id="lbNext" aria-label="다음 사진" onClick={onNext}>›</button>

          <div className="lightbox__meta lightbox__meta--premium">
            <div className="lightbox__summary">
              <span>{photo?.album || "기본앨범"}</span>
              <strong>{photo?.caption || "우리의 한 장면"}</strong>
              <span>{formatPhotoDate(photo?.date)}</span>
              {photo?.memo ? <p>{photo.memo}</p> : null}
            </div>

            <div className="lightbox__bottomControls" aria-label="사진 이동">
              <button className="lightbox__bottomNav" type="button" aria-label="이전 사진" onClick={onPrev}>이전</button>
              <button className="lightbox__bottomNav" type="button" aria-label="다음 사진" onClick={onNext}>다음</button>
            </div>

            {visibleThumbs.length > 1 ? (
              <div className="lightbox__thumbs" aria-label="사진 미리보기">
                {visibleThumbs.map((item, offset) => {
                  const index = visibleThumbStart + offset;
                  return (
                    <button className={`lightbox__thumb${index === currentIndex ? " is-active" : ""}`} type="button" key={item.id || item.url} aria-label={`${index + 1}번째 사진 보기`} onClick={() => onSelectIndex?.(index)}>
                      <img src={item.thumbnailUrl || item.url} alt="" loading="lazy" />
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {isActionSheetOpen ? (
        <div className="photoActionSheet" role="dialog" aria-modal="true" aria-label="사진 작업">
          <button className="photoActionSheet__scrim" type="button" aria-label="사진 작업 닫기" onClick={() => setIsActionSheetOpen(false)} />
          <div className="photoActionSheet__panel">
            <div className="photoActionSheet__handle" aria-hidden="true" />
            <div className="photoActionSheet__head">
              <span>{photo?.album || "기본앨범"}</span>
              <strong>{photo?.caption || "사진 작업"}</strong>
            </div>
            <div className="photoActionSheet__actions">
              <button className="photoActionSheet__item" type="button" onClick={() => void handleDownload()} disabled={downloading}>
                <span>{downloading ? "다운로드 중..." : "다운로드"}</span>
                <small>사진을 기기에 저장합니다</small>
              </button>
              {editable ? (
                <>
                  <button className="photoActionSheet__item" type="button" onClick={handleSetCover} disabled={photo?.isCover}>
                    <span>{photo?.isCover ? "이미 대표사진입니다" : "대표사진으로 설정"}</span>
                    <small>앨범과 홈 화면의 기준 사진</small>
                  </button>
                  <button className="photoActionSheet__item" type="button" onClick={openEditSheet}>
                    <span>사진 정보 수정</span>
                    <small>앨범, 날짜, 캡션, 메모</small>
                  </button>
                  <button className="photoActionSheet__item photoActionSheet__item--danger" type="button" onClick={handleDelete}>
                    <span>사진 삭제</span>
                    <small>삭제 후에는 복구할 수 없습니다</small>
                  </button>
                </>
              ) : null}
            </div>
            <button className="photoActionSheet__cancel" type="button" onClick={() => setIsActionSheetOpen(false)}>취소</button>
          </div>
        </div>
      ) : null}

      {editable && isEditSheetOpen ? (
        <div className="photoEditSheet" role="dialog" aria-modal="true" aria-label="사진 정보 수정">
          <button className="photoEditSheet__scrim" type="button" aria-label="사진 정보 수정 닫기" onClick={() => setIsEditSheetOpen(false)} />
          <div className="photoEditSheet__panel">
            <div className="photoEditSheet__head">
              <div>
                <span>사진 정보</span>
                <strong>보기 화면과 분리해서 수정해요</strong>
              </div>
              <button className="photoEditSheet__close" type="button" aria-label="닫기" onClick={() => setIsEditSheetOpen(false)}>×</button>
            </div>
            <div className="lightbox__form photoEditSheet__form">
              <label className="lbLabel">
                앨범
                <input id="lbAlbum" className="input" type="text" value={album} onChange={(event) => setAlbum(event.target.value)} />
              </label>
              <label className="lbLabel">
                사진 날짜
                <input id="lbDate" className="input" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
              </label>
              <label className="lbLabel">
                캡션
                <input id="lbCaptionInput" className="input" type="text" maxLength={60} value={caption} onChange={(event) => setCaption(event.target.value)} />
              </label>
              <label className="lbLabel">
                메모
                <textarea className="textarea" rows={4} maxLength={180} value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="이 사진에 남기고 싶은 마음" />
              </label>
              <div className="photoEditSheet__hint">{hint}</div>
              <div className="photoEditSheet__actions">
                <button className="btn btn--soft" type="button" onClick={() => setIsEditSheetOpen(false)}>취소</button>
                <button className="btn btn--primary" type="button" id="lbSave" onClick={handleSave} disabled={saving}>{saving ? "저장 중..." : "저장"}</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {downloadStatus !== "idle" || downloading ? (
        <div className={`photoDownloadToast photoDownloadToast--${downloadStatus}`} role="status" aria-live="polite">
          {downloading ? "다운로드 중..." : hint}
        </div>
      ) : null}
    </div>
  );
}
