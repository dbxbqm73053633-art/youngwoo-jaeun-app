import { memo } from "react";
import { ALBUM_EMPTY_LINES } from "../../constants/emotionalCopy";
import type { PhotoRecord } from "../../types";
import PhotoCard from "./PhotoCard";

type PhotoGridProps = {
  hasMore: boolean;
  photos: PhotoRecord[];
  totalCount: number;
  editable?: boolean;
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
  editable = true,
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
                priority={index < 4}
                selected={selectedIds.has(id)}
                managementMode={editable && managementMode}
                onDelete={onDeletePhoto}
                onOpen={onOpenPhoto}
                onToggleSelected={onToggleSelected}
                canDelete={editable}
              />
            );
          })
        ) : (
          <div className="albumEmpty emptyState">
            <strong>아직 사진이 없어요</strong>
            <span>{ALBUM_EMPTY_LINES[0]}</span>
            <small>{ALBUM_EMPTY_LINES[1]}</small>
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
