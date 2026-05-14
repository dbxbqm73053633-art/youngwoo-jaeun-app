import { useState } from "react";
import { TEMPLATE_DEFAULTS } from "../../constants/templateConfig";
import { useRoom } from "../../contexts/RoomContext";

type HeroSectionProps = {
  counter: {
    startDateLabel: string;
    todayLabel: string;
  };
};

export default function HeroSection({ counter }: HeroSectionProps) {
  const { couple } = useRoom();
  const [mediaReady, setMediaReady] = useState(false);
  const [subtitleA, ...subtitleRest] = TEMPLATE_DEFAULTS.heroSubtitle.split(/,\s*/);

  return (
    <section className="hero" aria-label="메인 영상">
      <div className={`hero__media${mediaReady ? " hero__media--ready" : " hero__media--loading"}`}>
        <video
          className="hero__video"
          src={couple.videoSrc || TEMPLATE_DEFAULTS.videoSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={couple.posterSrc || TEMPLATE_DEFAULTS.posterSrc}
          onCanPlay={() => setMediaReady(true)}
          onLoadedData={() => setMediaReady(true)}
          onError={() => setMediaReady(true)}
        />

        <div className="hero__shine" aria-hidden="true" />

        <div className="hero__overlay">
          <p className="hero__badge">{TEMPLATE_DEFAULTS.heroBadge}</p>
          <h1 className="hero__title">
            {TEMPLATE_DEFAULTS.heroTitle}
            <br />
            <span className="hero__titleGrad">{TEMPLATE_DEFAULTS.heroHighlight}</span>
          </h1>
          <p className="hero__sub">
            {subtitleA ? `${subtitleA},` : TEMPLATE_DEFAULTS.heroSubtitle}
            <br />
            {subtitleRest.join(", ")}
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
