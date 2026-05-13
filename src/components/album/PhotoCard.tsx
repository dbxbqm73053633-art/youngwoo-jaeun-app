import { memo } from "react";

type PhotoCardProps = {
  id: string;
  index: number;
  url: string;
  caption: string;
  onDelete?: (id: string) => void;
  onOpen?: (index: number) => void;
};

function PhotoCard({ id, index, url, caption, onDelete, onOpen }: PhotoCardProps) {
  return (
    <div className="photo" data-id={id} data-idx={index} onClick={() => onOpen?.(index)}>
      <img className="photo__img" src={url} alt={caption} loading="lazy" decoding="async" />
      <button
        className="photo__del"
        type="button"
        title="사진 삭제"
        aria-label="사진 삭제"
        data-del={id}
        onClick={(event) => {
          event.stopPropagation();
          onDelete?.(id);
        }}
      >
        ×
      </button>
    </div>
  );
}

export default memo(PhotoCard);
