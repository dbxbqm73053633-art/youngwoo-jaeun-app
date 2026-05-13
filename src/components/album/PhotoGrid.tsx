import { memo } from "react";
import type { PhotoRecord } from "../../types";
import PhotoCard from "./PhotoCard";

type PhotoGridProps = {
  hasMore: boolean;
  photos: PhotoRecord[];
  totalCount: number;
  managementMode?: boolean;
  selectedIds: Set<string>;
  onDeletePhoto: (id: string) => void;
  onLoadMore: () => void;
  onOpenPhoto: (index: number) => void;
  onToggleSelected: (id: string) => void;
};

function PhotoGrid({
  hasMore,
  photos,
  totalCount,
  managementMode = false,
  selectedIds,
  onDeletePhoto,
  onLoadMore,
  onOpenPhoto,
  onToggleSelected,
}: PhotoGridProps) {
  return (
    <>
      <div
        className={`gallery memoryGrid${photos.length >= 8 ? " gallery--scroll" : ""}`}
        id="gallery"
        aria-label="추억사진 갤러리"
        data-react-render="true"
      >
        {photos.length ? (
          photos.map((photo, index) => {
            const caption = photo.caption?.trim() ? photo.caption.trim() : "사진";
            const id = photo.id ?? "";
            return (
              <PhotoCard
                key={id || photo.url}
                id={id}
                index={index}
                url={photo.url}
                thumbUrl={photo.thumbnailUrl}
                caption={caption}
                album={photo.album}
                isCover={photo.isCover}
                selected={selectedIds.has(id)}
                managementMode={managementMode}
                onDelete={onDeletePhoto}
                onOpen={onOpenPhoto}
                onToggleSelected={onToggleSelected}
              />
            );
          })
        ) : (
          <div className="albumEmpty emptyState">
            <strong>아직 사진이 없어요</strong>
            <span>위의 사진 추가 버튼으로 첫 장면을 올리면 앨범과 슬라이드가 자동으로 채워져요.</span>
          </div>
        )}
      </div>

      <div className="paging">
        <button
          className="btn btn--soft"
          type="button"
          id="loadMore"
          onClick={onLoadMore}
          style={{ display: hasMore ? "inline-flex" : "none" }}
        >
          더 보기
        </button>
        <div className="paging__hint" id="pagingHint">
          {photos.length} / {totalCount}장 표시
        </div>
      </div>
    </>
  );
}

export default memo(PhotoGrid);
