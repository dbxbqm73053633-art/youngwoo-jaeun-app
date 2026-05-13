import { memo } from "react";

type PhotoCardProps = {
  id: string;
  index: number;
  url: string;
  thumbUrl?: string;
  caption: string;
  album?: string;
  isCover?: boolean;
  selected?: boolean;
  managementMode?: boolean;
  onDelete?: (id: string) => void;
  onOpen?: (index: number) => void;
  onToggleSelected?: (id: string) => void;
};

function PhotoCard({ id, index, url, thumbUrl, caption, album, isCover, selected = false, managementMode = false, onDelete, onOpen, onToggleSelected }: PhotoCardProps) {
  const handleClick = () => {
    if (managementMode) onToggleSelected?.(id);
    else onOpen?.(index);
  };

  return (
    <figure className={`photo${selected ? " photo--selected" : ""}${isCover ? " photo--cover" : ""}`} data-id={id} data-idx={index} onClick={handleClick}>
      <img className="photo__img" src={thumbUrl || url} alt={caption} loading="lazy" decoding="async" />
      <div className="photo__shade" />
      <figcaption className="photo__caption">
        {album ? <span className="photo__album">{album}</span> : null}
        <span className="photo__title">{caption}</span>
      </figcaption>
      {isCover ? <span className="photo__coverBadge">대표</span> : null}
      {managementMode ? (
        <span className={`photo__check${selected ? " photo__check--on" : ""}`} aria-hidden="true">✓</span>
      ) : (
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
      )}
    </figure>
  );
}

export default memo(PhotoCard);
