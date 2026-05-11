export default function AlbumToolbar() {
  return (
    <div className="albumBar">
      <select id="albumFilter" className="input albumSelect" aria-label="앨범 필터">
        <option value="__ALL__">전체 앨범</option>
      </select>

      <select id="sortMode" className="input sortSelect" aria-label="정렬">
        <option value="new">최신순</option>
        <option value="old">오래된순</option>
        <option value="name_asc">이름순</option>
        <option value="date_desc">사진날짜순</option>
      </select>

      <button className="btn btn--ghost" type="button" id="resetPaging">처음으로</button>
    </div>
  );
}
