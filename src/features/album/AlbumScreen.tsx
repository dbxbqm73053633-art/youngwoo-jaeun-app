import { useCallback, useEffect, useState } from "react";
import AlbumToolbar from "../../components/album/AlbumToolbar";
import PhotoGrid from "../../components/album/PhotoGrid";
import PhotoModal from "../../components/album/PhotoModal";
import { usePhotos, type PhotoSortMode } from "../../hooks/usePhotos";

type AlbumScreenProps = {
  onReady?: () => void;
};

function PhotoUploadPanel() {
  return (
    <article className="card">
      <div className="card__title">사진 추가</div>

      <div className="upload">
        <label className="label">
          앨범 이름
          <input id="albumName" className="input" type="text" maxLength={24} placeholder="예) 첫 여행, 주말 데이트, 파리" />
        </label>

        <label className="label">
          사진 날짜
          <input id="photoDate" className="input" type="date" />
        </label>

        <label className="label">
          짧은 캡션
          <input id="photoCaption" className="input" type="text" maxLength={40} placeholder="예) 너 웃는 거, 내 최애" />
        </label>

        <label className="upload__btn btn btn--primary" htmlFor="photoInput">사진 고르기 (여러 장 가능)</label>
        <input id="photoInput" className="upload__input" type="file" accept="image/*" multiple />

        <div className="upload__hint">
          <span className="dot" />
          <span>업로드하면 앨범에 저장돼요.</span>
        </div>
      </div>
    </article>
  );
}

function PhotoSlider() {
  return (
    <div className="card card--slider">
      <div className="card__title">슬라이더 뷰</div>
      {/* Legacy photo code renders recent uploaded photos here. */}
      <div className="photoSlider" id="photoSlider" />
      <p className="hint">왼쪽/오른쪽으로 넘기면서 우리 사진을 슬라이드로 볼 수 있어요.</p>
    </div>
  );
}

type LegacyWindow = Window & {
  __YWJY_ROOM_ID__?: string;
};

function AlbumPanel() {
  const [roomId, setRoomId] = useState(() => (window as LegacyWindow).__YWJY_ROOM_ID__ ?? null);
  const {
    album,
    hasMore,
    reload,
    removePhoto,
    setPage,
    setSortMode,
    visiblePhotos,
    photos,
  } = usePhotos(roomId);

  useEffect(() => {
    const syncRoom = (event: Event) => {
      const detail = (event as CustomEvent<{ roomId?: string }>).detail;
      setRoomId(detail?.roomId ?? (window as LegacyWindow).__YWJY_ROOM_ID__ ?? null);
    };

    window.addEventListener("ywjy:room-ready", syncRoom);
    return () => window.removeEventListener("ywjy:room-ready", syncRoom);
  }, []);

  useEffect(() => {
    void reload(album);
  }, [album, reload, roomId]);

  useEffect(() => {
    const handlePhotosChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ album?: string; sortMode?: PhotoSortMode }>).detail;
      if (detail?.sortMode) setSortMode(detail.sortMode);
      void reload(detail?.album ?? album);
    };

    window.addEventListener("ywjy:photos-changed", handlePhotosChanged);
    return () => window.removeEventListener("ywjy:photos-changed", handlePhotosChanged);
  }, [album, reload, setSortMode]);

  const handleLoadMore = useCallback(() => {
    setPage((currentPage) => currentPage + 1);
  }, [setPage]);

  const handleDeletePhoto = useCallback(async (id: string) => {
    const ok = confirm("이 사진을 삭제할까요? (Storage에서도 지워져요)");
    if (!ok) return;
    await removePhoto(id);
    window.dispatchEvent(new CustomEvent("ywjy:request-photos-refresh", { detail: { roomId, album } }));
  }, [album, removePhoto, roomId]);

  const handleOpenPhoto = useCallback((index: number) => {
    const photo = visiblePhotos[index];
    window.dispatchEvent(new CustomEvent("ywjy:open-photo", { detail: { id: photo?.id, index } }));
  }, [visiblePhotos]);

  return (
    <article className="card">
      <div className="card__title">
        내 앨범
        <span className="count" id="photoCount">{photos.length}</span>
      </div>

      <AlbumToolbar />
      <PhotoGrid
        hasMore={hasMore}
        photos={visiblePhotos}
        totalCount={photos.length}
        onDeletePhoto={handleDeletePhoto}
        onLoadMore={handleLoadMore}
        onOpenPhoto={handleOpenPhoto}
      />
    </article>
  );
}

export default function AlbumScreen({ onReady }: AlbumScreenProps) {
  useEffect(() => {
    onReady?.();
  }, [onReady]);

  return (
    <section className="tab" id="tab-photos" aria-label="추억사진">
      <section className="section">
        <div className="section__head">
          <h2 className="section__title">추억사진</h2>
          <p className="section__desc">앨범 관리 + 슬라이더 보기까지 한 번에.</p>
        </div>

        <PhotoSlider />

        <div className="grid grid--2 section__spaced">
          <PhotoUploadPanel />
          <AlbumPanel />
        </div>
      </section>

      {/* TODO: lightbox open/save/delete data flow is still owned by the legacy Firebase code. */}
      <PhotoModal />
    </section>
  );
}
