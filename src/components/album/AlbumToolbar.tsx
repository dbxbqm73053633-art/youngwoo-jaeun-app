import type { PhotoSortMode } from "../../hooks/usePhotos";

type AlbumToolbarProps = {
  album: string;
  albums: string[];
  sortMode: PhotoSortMode;
  onAlbumChange: (album: string) => void;
  onSortModeChange: (sortMode: PhotoSortMode) => void;
  onResetPaging: () => void;
};

export default function AlbumToolbar({
  album,
  albums,
  sortMode,
  onAlbumChange,
  onSortModeChange,
  onResetPaging,
}: AlbumToolbarProps) {
  return (
    <div className="albumBar">
      <select
        id="albumFilter"
        className="input albumSelect"
        aria-label="앨범 필터"
        value={album}
        onChange={(event) => onAlbumChange(event.target.value)}
      >
        <option value="__ALL__">전체 앨범</option>
        {albums.map((item) => (
          <option key={item} value={item}>{item}</option>
        ))}
      </select>

      <select
        id="sortMode"
        className="input sortSelect"
        aria-label="정렬"
        value={sortMode}
        onChange={(event) => onSortModeChange(event.target.value as PhotoSortMode)}
      >
        <option value="new">최신순</option>
        <option value="old">오래된순</option>
        <option value="name_asc">이름순</option>
        <option value="date_desc">사진날짜순</option>
      </select>

      <button className="btn btn--ghost" type="button" id="resetPaging" onClick={onResetPaging}>처음으로</button>
    </div>
  );
}
