type HeroSectionProps = {
  counter: {
    startDateLabel: string;
    todayLabel: string;
  };
};

export default function HeroSection({ counter }: HeroSectionProps) {
  return (
    <section className="hero" aria-label="메인 영상">
      <div className="hero__media">
        <video
          className="hero__video"
          src="./images/영재.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="./images/영우재은.png"
        />

        <div className="hero__shine" aria-hidden="true" />

        <div className="hero__overlay">
          <p className="hero__badge">Private Couple App</p>
          <h1 className="hero__title">
            세상에 하나뿐인 우리만의 방
            <br />
            <span className="hero__titleGrad">오늘도 사랑해</span>
          </h1>
          <p className="hero__sub">
            함께한 날을 다정하게 세고,
            <br />
            추억과 마음을 날마다 차곡차곡 모아가게요.
          </p>

          <div className="hero__chips">
            <div className="chip">
              <div className="chip__label">우리 시작</div>
              <div className="chip__value" id="startDateLabel">{counter.startDateLabel}</div>
            </div>
            <div className="chip">
              <div className="chip__label">오늘</div>
              <div className="chip__value" id="todayLabel">{counter.todayLabel}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
