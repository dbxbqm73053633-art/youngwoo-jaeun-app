export default function PhotoModal() {
  return (
    <div className="lightbox" id="lightbox" aria-hidden="true">
      <div className="lightbox__backdrop" data-lb-close="1" />

      <div className="lightbox__panel" role="dialog" aria-modal="true" aria-label="사진 크게 보기">
        <button className="lightbox__close iconBtn" type="button" data-lb-close="1" aria-label="닫기">✕</button>

        <button className="lightbox__nav lightbox__nav--prev" type="button" id="lbPrev" aria-label="이전">‹</button>
        <button className="lightbox__nav lightbox__nav--next" type="button" id="lbNext" aria-label="다음">›</button>

        <div className="lightbox__stage" id="lbStage">
          <img className="lightbox__img" id="lbImg" alt="사진 크게 보기" draggable="false" />
        </div>

        <div className="lightbox__meta">
          <div className="lightbox__form" aria-label="사진 정보 수정">
            <label className="lbLabel">
              앨범
              <input id="lbAlbum" className="input" type="text" />
            </label>
            <div className="lbRow">
              <label className="lbLabel">
                사진 날짜
                <input id="lbDate" className="input" type="date" />
              </label>
              <button className="btn btn--soft" type="button" id="lbSave">저장</button>
            </div>
            <label className="lbLabel">
              캡션
              <input id="lbCaptionInput" className="input" type="text" maxLength={60} />
            </label>
            <div className="lightbox__saveHint" id="lbSaveHint">수정 후 저장을 눌러주세요. (Ctrl/Cmd + S 가능)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
