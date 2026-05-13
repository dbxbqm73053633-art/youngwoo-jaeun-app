import AnniversaryCards from "./AnniversaryCards";

type DDaySectionProps = {
  counter: {
    dday: string;
    sinceText: string;
    hhmmss: string;
    days: string;
    hours: string;
    minutes: string;
    seconds: string;
    nextLabel: string;
    nextValue: string;
  };
};

export default function DDaySection({ counter }: DDaySectionProps) {
  return (
    <section className="section" aria-label="함께한 시간">
      <div className="section__head">
        <h2 className="section__title">함께한 시간</h2>
        <p className="section__desc">우리의 시작부터 지금 이 순간까지, 사랑스럽게 카운팅해요.</p>
      </div>

      <div className="grid grid--2">
        <article className="card card--counter">
          <div className="counterTop">
            <div>
              <div className="kicker">TOGETHER</div>
              <div className="dday" id="dDay">{counter.dday}</div>
              <div className="muted" id="sinceText">{counter.sinceText}</div>
            </div>

            <div className="live">
              <div className="live__label">LIVE</div>
              <div className="live__time" id="hhmmss">{counter.hhmmss}</div>
            </div>
          </div>

          <div className="divider" />

          <div className="stats">
            <div className="stat"><div className="stat__label">총 일수</div><div className="stat__value" id="days">{counter.days}</div></div>
            <div className="stat"><div className="stat__label">총 시간</div><div className="stat__value" id="hours">{counter.hours}</div></div>
            <div className="stat"><div className="stat__label">총 분</div><div className="stat__value" id="minutes">{counter.minutes}</div></div>
            <div className="stat"><div className="stat__label">총 초</div><div className="stat__value" id="seconds">{counter.seconds}</div></div>
          </div>
        </article>

        <AnniversaryCards label={counter.nextLabel} value={counter.nextValue} />
      </div>
    </section>
  );
}
