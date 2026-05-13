import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import AlbumToolbar from "../../components/album/AlbumToolbar";
import { createPortal } from "react-dom";
import PhotoGrid from "../../components/album/PhotoGrid";
import { useConfirm } from "../../components/layout/ModalProvider";
import { useRoom } from "../../contexts/RoomContext";
import { usePhotos, type PhotoSortMode } from "../../hooks/usePhotos";
import { formatPhotoDate, fromISODateInputValue, toISODateInputValue } from "../../services/photoService";
import type { PhotoRecord } from "../../types";

const PhotoModal = lazy(() => import("../../components/album/PhotoModal"));

type AlbumScreenProps = {
  onReady?: () => void;
};

function normalizeAlbum(value: string) {
  return value.trim() || "기본앨범";
}

type PhotoUploadPanelProps = {
  disabled?: boolean;
  onUpload: (files: File[], metadata: Pick<PhotoRecord, "album" | "caption" | "date">) => Promise<void>;
  uploading?: boolean;
};

function PhotoUploadPanel({ disabled = false, onUpload, uploading = false }: PhotoUploadPanelProps) {
  const [album, setAlbum] = useState("");
  const [date, setDate] = useState(() => toISODateInputValue(new Date()));
  const [caption, setCaption] = useState("");

  const handleFiles = async (files: FileList | null) => {
    const list = [...(files || [])];
    if (!list.length) return;
    await onUpload(list, {
      album: normalizeAlbum(album),
      caption: caption.trim(),
      date: fromISODateInputValue(date),
    });
  };

  return (
    <article className="card photoUploadCard">
      <div className="photoUploadCard__head">
        <div>
          <div className="card__title">사진 추가</div>
          <p className="hint">앨범 이름과 날짜를 넣으면 추억이 더 예쁘게 정리돼요.</p>
        </div>
        <label className="upload__btn btn btn--primary" htmlFor="photoInput">{uploading ? "업로드 중..." : "사진 올리기"}</label>
      </div>
      <div className="upload upload--premium">
        <label className="label">
          앨범 이름
          <input id="albumName" className="input" type="text" maxLength={24} value={album} onChange={(event) => setAlbum(event.target.value)} placeholder="첫 여행, 주말 데이트, 생일" disabled={disabled || uploading} />
        </label>
        <label className="label">
          사진 날짜
          <input id="photoDate" className="input" type="date" value={date} onChange={(event) => setDate(event.target.value)} disabled={disabled || uploading} />
        </label>
        <label className="label">
          짧은 캡션
          <input id="photoCaption" className="input" type="text" maxLength={40} value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="이 순간은 정말 최고" disabled={disabled || uploading} />
        </label>
        <input id="photoInput" className="upload__input" type="file" accept="image/*" multiple disabled={disabled || uploading} onChange={(event) => void handleFiles(event.target.files).then(() => { event.target.value = ""; })} />
        <div className="upload__hint">
          <span className="dot" />
          <span>{disabled ? "입장 후 사진을 업로드할 수 있어요" : "업로드하면 앨범에 저장되고 재생 모드에도 바로 반영돼요"}</span>
        </div>
      </div>
    </article>
  );
}

function ReplayOverlay({ photos, onClose }: { photos: PhotoRecord[]; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const current = photos[index] ?? null;
  const progress = photos.length ? ((index + 1) / photos.length) * 100 : 0;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  useEffect(() => {
    if (!playing || photos.length <= 1) return;
    const timer = window.setTimeout(() => setIndex((currentIndex) => (currentIndex + 1) % photos.length), 4200);
    return () => window.clearTimeout(timer);
  }, [index, photos.length, playing]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") setIndex((currentIndex) => (currentIndex + 1) % photos.length);
      if (event.key === "ArrowLeft") setIndex((currentIndex) => (currentIndex - 1 + photos.length) % photos.length);
      if (event.key === " ") {
        event.preventDefault();
        setPlaying((value) => !value);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, photos.length]);

  if (!current) return null;

  const replayLayer = (
    <div className="replay" role="dialog" aria-modal="true" aria-label="추억 재생하기">
      <div className="replay__progress"><span style={{ width: `${progress}%` }} /></div>
      <button className="replay__close iconBtn" type="button" aria-label="닫기" onClick={onClose}>×</button>
      <button className="replay__nav replay__nav--prev" type="button" aria-label="이전 사진" onClick={() => setIndex((currentIndex) => (currentIndex - 1 + photos.length) % photos.length)}>‹</button>
      <button className="replay__nav replay__nav--next" type="button" aria-label="다음 사진" onClick={() => setIndex((currentIndex) => (currentIndex + 1) % photos.length)}>›</button>
      <div className="replay__stage" key={current.id || current.url}>
        <img src={current.url} alt={current.caption || "추억 사진"} decoding="async" />
      </div>
      <div className="replay__caption">
        <span>{current.album} · {formatPhotoDate(current.date)}</span>
        <strong>{current.caption || "함께 남긴 소중한 순간"}</strong>
        {current.memo ? <p>{current.memo}</p> : <p>이 장면도 우리에게 오래 남을 거예요.</p>}
      </div>
      <button className="replay__play btn btn--soft" type="button" onClick={() => setPlaying((value) => !value)}>{playing ? "잠시 멈추기" : "다시 재생"}</button>
    </div>
  );

  return createPortal(replayLayer, document.body);
}

export default function AlbumScreen({ onReady }: AlbumScreenProps) {
  const { roomId, unlocked } = useRoom();
  const requestConfirm = useConfirm();
  const {
    album,
    albums,
    error,
    hasMore,
    loading,
    photos,
    reload,
    removePhoto,
    removePhotos,
    movePhotosToAlbum,
    setAlbum,
    setCoverPhoto,
    setPage,
    setSortMode,
    sortMode,
    updatePhotoMeta,
    uploadPhotos,
    visiblePhotos,
  } = usePhotos(roomId);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [managementMode, setManagementMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [replayOpen, setReplayOpen] = useState(false);
  const [actionError, setActionError] = useState("");
  const lightboxPhoto = useMemo(() => lightboxIndex === null ? null : visiblePhotos[lightboxIndex] ?? null, [lightboxIndex, visiblePhotos]);

  useEffect(() => { onReady?.(); }, [onReady]);
  useEffect(() => { void reload(album); }, [album, reload, roomId]);
  useEffect(() => { setSelectedIds(new Set()); }, [album, sortMode]);

  const handleUpload = useCallback(async (files: File[], metadata: Pick<PhotoRecord, "album" | "caption" | "date">) => {
    setActionError("");
    if (!unlocked || !roomId) {
      setActionError("입장 후 사진을 업로드할 수 있어요.");
      return;
    }
    setUploading(true);
    try {
      await uploadPhotos(files, metadata);
    } catch {
      setActionError("사진 업로드에 실패했어요. 네트워크와 Firebase Storage 권한을 확인해주세요.");
    } finally {
      setUploading(false);
    }
  }, [roomId, unlocked, uploadPhotos]);

  const handleDeletePhoto = useCallback(async (id: string) => {
    setActionError("");
    const ok = await requestConfirm({ title: "사진 삭제", message: "이 사진을 삭제할까요? Storage에서도 지워져요.", confirmLabel: "삭제", destructive: true });
    if (!ok) return;
    try {
      await removePhoto(id);
    } catch {
      setActionError("사진 삭제에 실패했어요. Firebase 연결을 확인하고 다시 시도해주세요.");
    }
  }, [requestConfirm, removePhoto]);

  const handleDeleteSelected = useCallback(async () => {
    const ids = [...selectedIds];
    if (!ids.length) return;
    const ok = await requestConfirm({ title: "선택 사진 삭제", message: `${ids.length}장의 사진을 삭제할까요? Storage에서도 지워져요.`, confirmLabel: "삭제", destructive: true });
    if (!ok) return;
    try {
      await removePhotos(ids);
      setSelectedIds(new Set());
    } catch {
      setActionError("선택한 사진을 삭제하지 못했어요. 잠시 후 다시 시도해주세요.");
    }
  }, [removePhotos, requestConfirm, selectedIds]);

  const handleMoveSelected = useCallback(async () => {
    const ids = [...selectedIds];
    if (!ids.length) return;
    const nextAlbum = window.prompt("이동할 앨범 이름을 입력해주세요.", album === "__ALL__" ? "기본앨범" : album)?.trim();
    if (!nextAlbum) return;
    try {
      await movePhotosToAlbum(ids, normalizeAlbum(nextAlbum));
      setSelectedIds(new Set());
    } catch {
      setActionError("앨범 이동에 실패했어요. Firebase 연결을 확인해주세요.");
    }
  }, [album, movePhotosToAlbum, selectedIds]);

  const handleBringSelectedFirst = useCallback(async () => {
    const ids = [...selectedIds];
    if (!ids.length) return;
    try {
      const minOrder = Math.min(...photos.map((photo) => photo.order ?? photo.createdAt), Date.now());
      await Promise.all(ids.map((id, index) => updatePhotoMeta(id, { order: minOrder - ids.length + index })));
      setSortMode("custom");
      setSelectedIds(new Set());
    } catch {
      setActionError("직접정렬 저장에 실패했어요. 잠시 후 다시 시도해주세요.");
    }
  }, [photos, selectedIds, setSortMode, updatePhotoMeta]);

  const handleAlbumChange = useCallback((nextAlbum: string) => {
    setAlbum(nextAlbum);
    void reload(nextAlbum);
  }, [reload, setAlbum]);

  const handleSortChange = useCallback((nextSortMode: PhotoSortMode) => {
    setSortMode(nextSortMode);
    setPage(1);
  }, [setPage, setSortMode]);

  const toggleSelected = useCallback((id: string) => {
    if (!id) return;
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const showNext = useCallback(() => {
    setLightboxIndex((current) => visiblePhotos.length ? (current === null ? 0 : (current + 1) % visiblePhotos.length) : null);
  }, [visiblePhotos.length]);

  const showPrev = useCallback(() => {
    setLightboxIndex((current) => visiblePhotos.length ? (current === null ? 0 : (current - 1 + visiblePhotos.length) % visiblePhotos.length) : null);
  }, [visiblePhotos.length]);

  const handleSaveLightbox = useCallback(async (patch: Partial<PhotoRecord>) => {
    if (!lightboxPhoto?.id) return;
    try {
      await updatePhotoMeta(lightboxPhoto.id, patch);
    } catch {
      setActionError("사진 정보 저장에 실패했어요. 잠시 후 다시 시도해주세요.");
      throw new Error("Photo save failed");
    }
  }, [lightboxPhoto?.id, updatePhotoMeta]);

  const handleSetCover = useCallback(async (id: string) => {
    try {
      await setCoverPhoto(id);
    } catch {
      setActionError("대표사진 설정에 실패했어요. 잠시 후 다시 시도해주세요.");
    }
  }, [setCoverPhoto]);

  const startReplay = useCallback(() => {
    if (!visiblePhotos.length) {
      setActionError("재생할 사진이 아직 없어요. 먼저 사진을 올려주세요.");
      return;
    }
    setReplayOpen(true);
  }, [visiblePhotos.length]);

  return (
    <section className="tab tab--active" id="tab-photos" aria-label="추억사진">
      <section className="section">
        <div className="section__head albumHeroHead">
          <div>
            <h2 className="section__title">추억사진</h2>
            <p className="section__desc">우리의 장면을 앨범처럼 모으고, 영화처럼 다시 재생해요.</p>
          </div>
        </div>

        <PhotoUploadPanel disabled={!unlocked} onUpload={handleUpload} uploading={uploading} />

        <article className="card albumGalleryCard">
          <div className="albumGalleryCard__head">
            <div>
              <div className="card__title">우리 앨범 <span className="count" id="photoCount">{photos.length}</span></div>
              <p className="hint">대표사진, 메모, 정렬까지 이곳에서 관리할 수 있어요.</p>
            </div>
          </div>
          {loading ? <p className="hint loadingHint">사진을 불러오는 중...</p> : null}
          {error ? <p className="hint errorText">앨범을 불러오지 못했어요. Firebase 연결을 확인해주세요.</p> : null}
          {actionError ? <p className="hint errorText">{actionError}</p> : null}
          <AlbumToolbar
            album={album}
            albums={albums}
            sortMode={sortMode}
            managementMode={managementMode}
            selectedCount={selectedIds.size}
            onAlbumChange={handleAlbumChange}
            onSortModeChange={handleSortChange}
            onResetPaging={() => setPage(1)}
            onToggleManagement={() => setManagementMode((value) => !value)}
            onReplay={startReplay}
            onDeleteSelected={handleDeleteSelected}
            onMoveSelected={handleMoveSelected}
            onBringSelectedFirst={handleBringSelectedFirst}
          />
          <PhotoGrid
            hasMore={hasMore}
            photos={visiblePhotos}
            totalCount={photos.length}
            managementMode={managementMode}
            selectedIds={selectedIds}
            onDeletePhoto={handleDeletePhoto}
            onLoadMore={() => setPage((currentPage) => currentPage + 1)}
            onOpenPhoto={setLightboxIndex}
            onToggleSelected={toggleSelected}
          />
        </article>
      </section>

      {lightboxPhoto ? (
        <Suspense fallback={null}>
          <PhotoModal photo={lightboxPhoto} onClose={() => setLightboxIndex(null)} onNext={showNext} onPrev={showPrev} onDelete={handleDeletePhoto} onSetCover={handleSetCover} onSave={handleSaveLightbox} />
        </Suspense>
      ) : null}

      {replayOpen ? <ReplayOverlay photos={visiblePhotos} onClose={() => setReplayOpen(false)} /> : null}
    </section>
  );
}
