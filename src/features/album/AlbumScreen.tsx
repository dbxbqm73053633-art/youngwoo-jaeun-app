import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import AlbumToolbar from "../../components/album/AlbumToolbar";
import { memo } from "react";
import { createPortal } from "react-dom";
import PhotoGrid from "../../components/album/PhotoGrid";
import { useConfirm } from "../../components/layout/ModalProvider";
import { ALBUM_ATMOSPHERE_QUOTES, REPLAY_MEMORY_CAPTIONS } from "../../constants/emotionalCopy";
import { useRoom } from "../../contexts/RoomContext";
import { usePhotos, type PhotoSortMode } from "../../hooks/usePhotos";
import { formatPhotoDate, fromISODateInputValue, toISODateInputValue, type PhotoUploadProgress } from "../../services/photoService";
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
  progress?: PhotoUploadProgress | null;
  uploading?: boolean;
};

const PhotoUploadPanel = memo(function PhotoUploadPanel({ disabled = false, onUpload, progress = null, uploading = false }: PhotoUploadPanelProps) {
  const [album, setAlbum] = useState("");
  const [date, setDate] = useState(() => toISODateInputValue(new Date()));
  const [caption, setCaption] = useState("");
  const progressPercent = progress ? Math.round(progress.progress * 100) : 0;
  const progressText = progress
    ? progress.phase === "compressing"
      ? `사진을 가볍게 정리하는 중... ${progress.fileIndex}/${progress.fileCount}`
      : progress.phase === "saving"
        ? `앨범에 저장하는 중... ${progress.fileIndex}/${progress.fileCount}`
        : `업로드 중... ${progress.fileIndex}/${progress.fileCount} · ${progressPercent}%`
    : "";

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
        {uploading ? (
          <div className="uploadProgress" role="status" aria-live="polite">
            <div className="uploadProgress__top">
              <span>{progressText || "사진을 준비하는 중..."}</span>
              <strong>{progressPercent}%</strong>
            </div>
            <div className="uploadProgress__bar" aria-hidden="true"><span style={{ width: `${progressPercent}%` }} /></div>
            <p>모바일에서도 빠르게 열리도록 사진을 최적화하고 있어요.</p>
          </div>
        ) : null}
      </div>
    </article>
  );
});

function ReplayOverlay({ photos, onClose }: { photos: PhotoRecord[]; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [slideProgress, setSlideProgress] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const startedAt = useMemo(() => ({ current: performance.now() }), []);
  const touchStartX = useMemo(() => ({ current: null as number | null }), []);
  const slideMs = 5200;
  const current = photos[index] ?? null;
  const progress = photos.length ? ((index + slideProgress) / photos.length) * 100 : 0;

  const goNext = useCallback(() => {
    startedAt.current = performance.now();
    setSlideProgress(0);
    setIndex((currentIndex) => (currentIndex + 1) % photos.length);
  }, [photos.length, startedAt]);

  const goPrev = useCallback(() => {
    startedAt.current = performance.now();
    setSlideProgress(0);
    setIndex((currentIndex) => (currentIndex - 1 + photos.length) % photos.length);
  }, [photos.length, startedAt]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.classList.add("replay-open");
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.classList.remove("replay-open");
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    };
  }, []);

  useEffect(() => {
    if (!playing || photos.length <= 1) return;
    let frame = 0;
    const tick = (now: number) => {
      const nextProgress = Math.min(1, (now - startedAt.current) / slideMs);
      setSlideProgress(nextProgress);
      if (nextProgress >= 1) {
        startedAt.current = now;
        setSlideProgress(0);
        setIndex((currentIndex) => (currentIndex + 1) % photos.length);
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [photos.length, playing, startedAt]);

  useEffect(() => {
    startedAt.current = performance.now();
    setSlideProgress(0);
  }, [index, startedAt]);

  useEffect(() => {
    if (!photos.length) return;
    const urls = [
      photos[(index + 1) % photos.length]?.url,
      photos[(index - 1 + photos.length) % photos.length]?.url,
    ].filter(Boolean);
    const preloads = urls.map((url) => {
      const image = new Image();
      image.decoding = "async";
      image.src = url as string;
      return image;
    });
    return () => {
      preloads.forEach((image) => { image.src = ""; });
    };
  }, [index, photos]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") goNext();
      if (event.key === "ArrowLeft") goPrev();
      if (event.key === " ") {
        event.preventDefault();
        setPlaying((value) => !value);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev, onClose]);

  const handleReplayTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleReplayTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 48) return;
    if (delta > 0) goPrev();
    else goNext();
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setFullscreen(false);
      } else {
        await document.documentElement.requestFullscreen();
        setFullscreen(true);
      }
    } catch {
      setFullscreen((value) => !value);
    }
  };

  if (!current) return null;

  const replayCaption = current.memo?.trim() || REPLAY_MEMORY_CAPTIONS[index % REPLAY_MEMORY_CAPTIONS.length];

  const replayLayer = (
    <div className={`replay${playing ? " replay--playing" : " replay--paused"}${fullscreen ? " replay--fullscreen" : ""}`} role="dialog" aria-modal="true" aria-label="추억 재생하기" onTouchStart={handleReplayTouchStart} onTouchEnd={handleReplayTouchEnd}>
      <div className="replay__progress"><span style={{ width: `${progress}%` }} /></div>
      <button className="replay__close iconBtn" type="button" aria-label="닫기" onClick={onClose}>×</button>
      <button className="replay__fullscreen" type="button" aria-label="전체 화면" onClick={() => void toggleFullscreen()}>{fullscreen ? "화면 줄이기" : "전체 화면"}</button>
      <button className="replay__nav replay__nav--prev" type="button" aria-label="이전 사진" onClick={goPrev}>‹</button>
      <button className="replay__nav replay__nav--next" type="button" aria-label="다음 사진" onClick={goNext}>›</button>
      <div className="replay__stage" key={current.id || current.url}>
        <img src={current.url} alt={current.caption || "추억 사진"} decoding="async" fetchpriority="high" />
      </div>
      <div className="replay__caption">
        <span>{current.album} · {formatPhotoDate(current.date)}</span>
        <strong>{current.caption || "함께 남긴 소중한 순간"}</strong>
        <p className="replay__memoryLine">{replayCaption}</p>
      </div>
      <div className="replay__controls">
        <button className="replay__play" type="button" onClick={() => setPlaying((value) => !value)}>{playing ? "잠시 멈추기" : "다시 재생"}</button>
        <button className="replay__restart" type="button" onClick={() => { startedAt.current = performance.now(); setSlideProgress(0); setIndex(0); setPlaying(true); }}>처음부터</button>
      </div>
    </div>
  );

  return createPortal(replayLayer, document.body);
}

export default function AlbumScreen({ onReady }: AlbumScreenProps) {
  const { admin, role, roomId, unlocked } = useRoom();
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
  } = usePhotos(roomId, 18, role);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<PhotoUploadProgress | null>(null);
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
    if (!unlocked || !roomId || !admin) {
      setActionError("입장 후 사진을 업로드할 수 있어요.");
      return;
    }
    setUploading(true);
    setUploadProgress(null);
    try {
      await uploadPhotos(files, metadata, setUploadProgress);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "";
      setActionError(message === "Image file is too large"
        ? "사진 용량이 너무 커요. 조금 더 작은 사진으로 다시 올려주세요."
        : "사진 업로드에 실패했어요. 네트워크와 Firebase Storage 권한을 확인해주세요.");
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  }, [admin, roomId, unlocked, uploadPhotos]);

  const handleDeletePhoto = useCallback(async (id: string) => {
    setActionError("");
    if (!admin) return;
    const ok = await requestConfirm({ title: "사진 삭제", message: "이 사진을 삭제할까요? Storage에서도 지워져요.", confirmLabel: "삭제", destructive: true });
    if (!ok) return;
    try {
      await removePhoto(id);
    } catch {
      setActionError("사진 삭제에 실패했어요. Firebase 연결을 확인하고 다시 시도해주세요.");
    }
  }, [admin, requestConfirm, removePhoto]);

  const handleDeleteSelected = useCallback(async () => {
    if (!admin) return;
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
  }, [admin, removePhotos, requestConfirm, selectedIds]);

  const handleMoveSelected = useCallback(async () => {
    if (!admin) return;
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
  }, [admin, album, movePhotosToAlbum, selectedIds]);

  const handleBringSelectedFirst = useCallback(async () => {
    if (!admin) return;
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
  }, [admin, photos, selectedIds, setSortMode, updatePhotoMeta]);

  const handleAlbumChange = useCallback((nextAlbum: string) => {
    setAlbum(nextAlbum);
    void reload(nextAlbum);
  }, [reload, setAlbum]);

  const handleSortChange = useCallback((nextSortMode: PhotoSortMode) => {
    setSortMode(nextSortMode);
    setPage(1);
  }, [setPage, setSortMode]);

  const toggleSelected = useCallback((id: string) => {
    if (!admin) return;
    if (!id) return;
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, [admin]);

  const showNext = useCallback(() => {
    setLightboxIndex((current) => visiblePhotos.length ? (current === null ? 0 : (current + 1) % visiblePhotos.length) : null);
  }, [visiblePhotos.length]);

  const showPrev = useCallback(() => {
    setLightboxIndex((current) => visiblePhotos.length ? (current === null ? 0 : (current - 1 + visiblePhotos.length) % visiblePhotos.length) : null);
  }, [visiblePhotos.length]);

  const handleSaveLightbox = useCallback(async (patch: Partial<PhotoRecord>) => {
    if (!lightboxPhoto?.id) return;
    if (!admin) return;
    try {
      await updatePhotoMeta(lightboxPhoto.id, patch);
    } catch {
      setActionError("사진 정보 저장에 실패했어요. 잠시 후 다시 시도해주세요.");
      throw new Error("Photo save failed");
    }
  }, [admin, lightboxPhoto?.id, updatePhotoMeta]);

  const handleSetCover = useCallback(async (id: string) => {
    if (!admin) return;
    try {
      await setCoverPhoto(id);
    } catch {
      setActionError("대표사진 설정에 실패했어요. 잠시 후 다시 시도해주세요.");
    }
  }, [admin, setCoverPhoto]);

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

        {admin ? <PhotoUploadPanel disabled={!unlocked} onUpload={handleUpload} progress={uploadProgress} uploading={uploading} /> : null}

        <article className="card albumGalleryCard">
          <div className="albumGalleryCard__head">
            <div>
              <div className="card__title">우리 앨범 <span className="count" id="photoCount">{photos.length}</span></div>
              <p className="hint">대표사진, 메모, 정렬까지 이곳에서 관리할 수 있어요.</p>
              <p className="emotionalQuote albumAtmosphere">{ALBUM_ATMOSPHERE_QUOTES[photos.length % ALBUM_ATMOSPHERE_QUOTES.length]}</p>
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
            editable={admin}
            selectedCount={selectedIds.size}
            onAlbumChange={handleAlbumChange}
            onSortModeChange={handleSortChange}
            onResetPaging={() => setPage(1)}
            onToggleManagement={() => admin && setManagementMode((value) => !value)}
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
            editable={admin}
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
          <PhotoModal photo={lightboxPhoto} photos={visiblePhotos} currentIndex={lightboxIndex ?? 0} editable={admin} onClose={() => setLightboxIndex(null)} onNext={showNext} onPrev={showPrev} onSelectIndex={setLightboxIndex} onDelete={handleDeletePhoto} onSetCover={handleSetCover} onSave={handleSaveLightbox} />
        </Suspense>
      ) : null}

      {replayOpen ? <ReplayOverlay photos={visiblePhotos} onClose={() => setReplayOpen(false)} /> : null}
    </section>
  );
}
