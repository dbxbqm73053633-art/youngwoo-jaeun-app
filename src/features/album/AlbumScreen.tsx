import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import AlbumToolbar from "../../components/album/AlbumToolbar";
import PhotoGrid from "../../components/album/PhotoGrid";
import { useConfirm } from "../../components/layout/ModalProvider";
import { useRoom } from "../../contexts/RoomContext";
import { usePhotos, type PhotoSortMode } from "../../hooks/usePhotos";
import { fromISODateInputValue, toISODateInputValue } from "../../services/photoService";
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
    <article className="card">
      <div className="card__title">사진 추가</div>
      <div className="upload">
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
        <label className="upload__btn btn btn--primary" htmlFor="photoInput">{uploading ? "업로드 중..." : "사진 고르기(여러 장 가능)"}</label>
        <input id="photoInput" className="upload__input" type="file" accept="image/*" multiple disabled={disabled || uploading} onChange={(event) => void handleFiles(event.target.files).then(() => { event.target.value = ""; })} />
        <div className="upload__hint">
          <span className="dot" />
          <span>{disabled ? "입장 후 사진을 업로드할 수 있어요" : "업로드하면 앨범에 저장돼요"}</span>
        </div>
      </div>
    </article>
  );
}

function PhotoSlider({ photos, onOpen }: { photos: PhotoRecord[]; onOpen: (index: number) => void }) {
  const sliderRows = photos.slice(0, 20);
  return (
    <div className="card card--slider">
      <div className="card__title">슬라이더 뷰</div>
      <div className="photoSlider" id="photoSlider">
        {sliderRows.length ? sliderRows.map((photo, index) => (
          <button key={photo.id} className="photoSlider__item" type="button" onClick={() => onOpen(index)}>
            <img className="photoSlider__img" src={photo.url} alt={photo.caption || photo.album || "사진"} loading="lazy" decoding="async" />
            <div className="photoSlider__caption">{photo.caption || photo.album || "사진"}</div>
          </button>
        )) : (
          <p className="hint emptyState">사진을 올리면 여기에서 슬라이드처럼 볼 수 있어요.</p>
        )}
      </div>
      <p className="hint">왼쪽/오른쪽으로 넘기면서 우리 사진을 슬라이드로 볼 수 있어요.</p>
    </div>
  );
}

export default function AlbumScreen({ onReady }: AlbumScreenProps) {
  const { roomId, unlocked } = useRoom();
  const requestConfirm = useConfirm();
  const { album, albums, error, hasMore, loading, photos, reload, removePhoto, setAlbum, setPage, setSortMode, sortMode, updatePhotoMeta, uploadPhotos, visiblePhotos } = usePhotos(roomId);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [actionError, setActionError] = useState("");
  const lightboxPhoto = useMemo(() => lightboxIndex === null ? null : visiblePhotos[lightboxIndex] ?? null, [lightboxIndex, visiblePhotos]);

  useEffect(() => { onReady?.(); }, [onReady]);
  useEffect(() => { void reload(album); }, [album, reload, roomId]);

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

  const handleAlbumChange = useCallback((nextAlbum: string) => {
    setAlbum(nextAlbum);
    void reload(nextAlbum);
  }, [reload, setAlbum]);

  const handleSortChange = useCallback((nextSortMode: PhotoSortMode) => {
    setSortMode(nextSortMode);
    setPage(1);
  }, [setPage, setSortMode]);

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
    }
  }, [lightboxPhoto?.id, updatePhotoMeta]);

  return (
    <section className="tab tab--active" id="tab-photos" aria-label="추억사진">
      <section className="section">
        <div className="section__head">
          <h2 className="section__title">추억사진</h2>
          <p className="section__desc">앨범 관리부터 슬라이더 보기까지 한 번에.</p>
        </div>
        <PhotoSlider photos={visiblePhotos} onOpen={setLightboxIndex} />
        <div className="grid grid--2 section__spaced">
          <PhotoUploadPanel disabled={!unlocked} onUpload={handleUpload} uploading={uploading} />
          <article className="card">
            <div className="card__title">우리 앨범 <span className="count" id="photoCount">{photos.length}</span></div>
            {loading ? <p className="hint loadingHint">사진을 불러오는 중...</p> : null}
            {error ? <p className="hint errorText">앨범을 불러오지 못했어요. Firebase 연결을 확인해주세요.</p> : null}
            {actionError ? <p className="hint errorText">{actionError}</p> : null}
            <AlbumToolbar album={album} albums={albums} sortMode={sortMode} onAlbumChange={handleAlbumChange} onSortModeChange={handleSortChange} onResetPaging={() => setPage(1)} />
            <PhotoGrid hasMore={hasMore} photos={visiblePhotos} totalCount={photos.length} onDeletePhoto={handleDeletePhoto} onLoadMore={() => setPage((currentPage) => currentPage + 1)} onOpenPhoto={setLightboxIndex} />
          </article>
        </div>
      </section>
      {lightboxPhoto ? (
        <Suspense fallback={null}>
          <PhotoModal photo={lightboxPhoto} onClose={() => setLightboxIndex(null)} onNext={showNext} onPrev={showPrev} onSave={handleSaveLightbox} />
        </Suspense>
      ) : null}
    </section>
  );
}
