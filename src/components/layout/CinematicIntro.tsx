import { useEffect, useState } from "react";
import { INTRO_PENDING_KEY, INTRO_SEEN_KEY } from "../../constants/intro";
import { useRoom } from "../../contexts/RoomContext";
import { recoverViewportAfterFullscreen } from "../../utils/viewportRecovery";

type CinematicIntroProps = {
  onComplete?: () => void;
};

const INTRO_DURATION_MS = 5000;

function formatStartDate(timestamp: number) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(timestamp));
}

function ddayCount(timestamp: number) {
  const start = new Date(timestamp);
  const today = new Date();
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return Math.max(1, Math.floor((todayDay - startDay) / 86400000) + 1);
}

export default function CinematicIntro({ onComplete }: CinematicIntroProps) {
  const { couple, unlocked } = useRoom();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!unlocked || sessionStorage.getItem(INTRO_PENDING_KEY) !== "1") return;
    setVisible(true);
    const timer = window.setTimeout(() => {
      sessionStorage.removeItem(INTRO_PENDING_KEY);
      sessionStorage.setItem(INTRO_SEEN_KEY, "1");
      setVisible(false);
      recoverViewportAfterFullscreen();
      onComplete?.();
    }, INTRO_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [onComplete, unlocked]);

  useEffect(() => {
    document.body.classList.toggle("cinematic-intro-open", visible);
    return () => document.body.classList.remove("cinematic-intro-open");
  }, [visible]);

  const close = () => {
    sessionStorage.removeItem(INTRO_PENDING_KEY);
    sessionStorage.setItem(INTRO_SEEN_KEY, "1");
    setVisible(false);
    recoverViewportAfterFullscreen();
    onComplete?.();
  };

  if (!visible) return null;

  return (
    <div className="cinematicIntro" role="dialog" aria-modal="true" aria-label="처음 시작" onClick={close}>
      <img className="cinematicIntro__image" src="/intro/kfkf.png" alt="" aria-hidden="true" />
      <div className="cinematicIntro__veil" aria-hidden="true" />
      <div className="cinematicIntro__warmth" aria-hidden="true" />
      <div className="cinematicIntro__content">
        <div className="cinematicIntro__heroText">
          <h1 className="cinematicIntro__title" data-text="우리만의 특별한 이야기">
            <span>우리만의</span>
            <span>특별한 <em>이야기</em></span>
          </h1>
          <p className="cinematicIntro__subtitle">함께한 모든 순간이, 우리의 추억이 됩니다.</p>
        </div>
        <section className="cinematicIntro__card" aria-label="커플 정보">
          <div className="cinematicIntro__names">{couple.nameA} ♡ {couple.nameB}</div>
          <span>함께한 시간</span>
          <strong>D+{ddayCount(couple.startDate)}</strong>
          <small>{formatStartDate(couple.startDate)}부터</small>
        </section>
        <div className="cinematicIntro__quotes" aria-label="인트로 문장">
          <p>오늘도 사랑을 기록할게요</p>
          <div className="cinematicIntro__dots" aria-hidden="true"><i /><i /><i /></div>
          <span>우리만의 공간을 여는 중...</span>
          <button className="cinematicIntro__skip" type="button" onClick={(event) => { event.stopPropagation(); close(); }}>건너뛰기 &gt;</button>
        </div>
      </div>
    </div>
  );
}
