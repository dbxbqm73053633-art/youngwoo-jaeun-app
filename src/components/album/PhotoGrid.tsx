import { memo } from "react";
import type { PhotoRecord } from "../../types";
import PhotoCard from "./PhotoCard";

type PhotoGridProps = {
  hasMore: boolean;
  photos: PhotoRecord[];
  totalCount: number;
  onDeletePhoto: (id: string) => void;
  onLoadMore: () => void;
  onOpenPhoto: (index: number) => void;
};

function PhotoGrid({
  hasMore,
  photos,
  totalCount,
  onDeletePhoto,
  onLoadMore,
  onOpenPhoto,
}: PhotoGridProps) {
  return (
    <>
      <div
        className={`gallery${photos.length >= 5 ? " gallery--scroll" : ""}`}
        id="gallery"
        aria-label="추억사진 갤러리"
        data-react-render="true"
      >
        {photos.length ? (
          photos.map((photo, index) => {
            const caption = photo.caption?.trim() ? photo.caption.trim() : "사진";
            return (
              <PhotoCard
                key={photo.id}
                id={photo.id ?? ""}
                index={index}
                url={photo.url}
                caption={caption}
                onDelete={onDeletePhoto}
                onOpen={onOpenPhoto}
              />
            );
          })
        ) : (
          <p className="hint emptyState">아직 사진이 없어요. 우리 첫 장면을 담아볼까요?</p>
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
