import AnniversaryCards from "./AnniversaryCards";

export default function DDaySection() {
  return (
    <section className="section" aria-label="함께한 시간">
      <div className="section__head">
        <h2 className="section__title">함께한 시간</h2>
        <p className="section__desc">우리의 시작부터 지금 이 순간까지, 사랑스럽게 카운트해요.</p>
      </div>

      <div className="grid grid--2">
        <article className="card card--counter">
          <div className="counterTop">
            <div>
              <div className="kicker">TOGETHER</div>
              <div className="dday" id="dDay">D+0</div>
              <div className="muted" id="sinceText">—</div>
            </div>

            <div className="live">
              <div className="live__label">LIVE</div>
              <div className="live__time" id="hhmmss">00:00:00</div>
            </div>
          </div>

          <div className="divider" />

          <div className="stats">
            <div className="stat"><div className="stat__label">총 일수</div><div className="stat__value" id="days">0</div></div>
            <div className="stat"><div className="stat__label">총 시간</div><div className="stat__value" id="hours">0</div></div>
            <div className="stat"><div className="stat__label">총 분</div><div className="stat__value" id="minutes">0</div></div>
            <div className="stat"><div className="stat__label">총 초</div><div className="stat__value" id="seconds">0</div></div>
          </div>
        </article>

        <AnniversaryCards />
      </div>
    </section>
  );
}
