import { useEffect, useState } from "react";
import { INTRO_QUOTES } from "../../constants/emotionalCopy";
import { INTRO_SEEN_KEY } from "../../constants/intro";
import { useRoom } from "../../contexts/RoomContext";

type CinematicIntroProps = {
  dday: string;
};

export default function CinematicIntro({ dday }: CinematicIntroProps) {
  const { couple, unlocked } = useRoom();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!unlocked || localStorage.getItem(INTRO_SEEN_KEY) === "1") return;
    setVisible(true);
    const timer = window.setTimeout(() => {
      localStorage.setItem(INTRO_SEEN_KEY, "1");
      setVisible(false);
    }, 4200);
    return () => window.clearTimeout(timer);
  }, [unlocked]);

  const close = () => {
    localStorage.setItem(INTRO_SEEN_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="cinematicIntro" role="dialog" aria-modal="true" aria-label="처음 시작" onClick={close}>
      <video
        className="cinematicIntro__media"
        src="./images/영재.mp4"
        poster="./images/영우재은.png"
        muted
        playsInline
        autoPlay
        loop
        preload="metadata"
        aria-hidden="true"
      />
      <div className="cinematicIntro__image" aria-hidden="true" />
      <div className="cinematicIntro__veil" aria-hidden="true" />
      <div className="cinematicIntro__glow" aria-hidden="true" />
      <div className="cinematicIntro__content">
        <p className="cinematicIntro__eyebrow">우리만의 방에 오신 걸 환영해요</p>
        <h1 className="cinematicIntro__names">{couple.nameA} ♡ {couple.nameB}</h1>
        <div className="cinematicIntro__dday">{dday}</div>
        <div className="cinematicIntro__quotes" aria-label="인트로 문장">
          {INTRO_QUOTES.map((quote) => (
            <span key={quote}>{quote}</span>
          ))}
        </div>
      </div>
      <button className="cinematicIntro__skip" type="button" onClick={(event) => { event.stopPropagation(); close(); }}>바로 들어가기</button>
    </div>
  );
}
