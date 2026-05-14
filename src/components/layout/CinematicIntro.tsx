import { useEffect, useState } from "react";
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
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [unlocked]);

  const close = () => {
    localStorage.setItem(INTRO_SEEN_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="cinematicIntro" role="dialog" aria-modal="true" aria-label="처음 시작">
      <div className="cinematicIntro__glow" aria-hidden="true" />
      <div className="cinematicIntro__content">
        <p className="cinematicIntro__eyebrow">우리만의 방에 오신 걸 환영해요</p>
        <h1 className="cinematicIntro__names">{couple.nameA} ♡ {couple.nameB}</h1>
        <div className="cinematicIntro__dday">{dday}</div>
      </div>
      <button className="cinematicIntro__skip" type="button" onClick={close}>바로 들어가기</button>
    </div>
  );
}
