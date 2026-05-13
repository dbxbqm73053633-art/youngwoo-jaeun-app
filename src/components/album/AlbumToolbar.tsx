import type { PhotoSortMode } from "../../hooks/usePhotos";

type AlbumToolbarProps = {
  album: string;
  albums: string[];
  sortMode: PhotoSortMode;
  managementMode: boolean;
  selectedCount: number;
  onAlbumChange: (album: string) => void;
  onSortModeChange: (sortMode: PhotoSortMode) => void;
  onResetPaging: () => void;
  onToggleManagement: () => void;
  onReplay: () => void;
  onDeleteSelected: () => void;
  onMoveSelected: () => void;
  onBringSelectedFirst: () => void;
};

const sortLabels: Array<{ value: PhotoSortMode; label: string }> = [
  { value: "new", label: "최신순" },
  { value: "old", label: "오래된순" },
  { value: "custom", label: "직접정렬" },
];

export default function AlbumToolbar({
  album,
  albums,
  sortMode,
  managementMode,
  selectedCount,
  onAlbumChange,
  onSortModeChange,
  onResetPaging,
  onToggleManagement,
  onReplay,
  onDeleteSelected,
  onMoveSelected,
  onBringSelectedFirst,
}: AlbumToolbarProps) {
  return (
    <div className="albumTools" aria-label="앨범 도구">
      <div className="albumChips" aria-label="앨범 필터">
        <button className={`albumChip${album === "__ALL__" ? " albumChip--active" : ""}`} type="button" onClick={() => onAlbumChange("__ALL__")}>전체</button>
        {albums.map((item) => (
          <button key={item} className={`albumChip${album === item ? " albumChip--active" : ""}`} type="button" onClick={() => onAlbumChange(item)}>{item}</button>
        ))}
      </div>

      <div className="albumBar">
        <div className="segmented" role="group" aria-label="사진 정렬">
          {sortLabels.map((item) => (
            <button key={item.value} className={`segmented__btn${sortMode === item.value ? " segmented__btn--active" : ""}`} type="button" onClick={() => onSortModeChange(item.value)}>{item.label}</button>
          ))}
        </div>
        <button className="btn btn--primary" type="button" onClick={onReplay}>추억 재생하기</button>
        <button className="btn btn--soft" type="button" onClick={onToggleManagement}>{managementMode ? "선택 종료" : "관리"}</button>
        <button className="btn btn--ghost" type="button" id="resetPaging" onClick={onResetPaging}>처음으로</button>
      </div>

      {managementMode ? (
        <div className="selectionBar" aria-live="polite">
          <strong>{selectedCount}장 선택</strong>
          <button className="btn btn--soft" type="button" onClick={onMoveSelected} disabled={!selectedCount}>앨범 이동/수정</button>
          <button className="btn btn--soft" type="button" onClick={onBringSelectedFirst} disabled={!selectedCount}>맨 앞으로</button>
          <button className="btn btn--danger" type="button" onClick={onDeleteSelected} disabled={!selectedCount}>선택 삭제</button>
        </div>
      ) : null}
    </div>
  );
}
