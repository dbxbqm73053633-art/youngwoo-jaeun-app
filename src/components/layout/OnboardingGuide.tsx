import { useEffect, useState } from "react";

const GUIDE_KEY = "ywjy_onboarding_seen_v1";

export default function OnboardingGuide() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(GUIDE_KEY) === "1") return;
    const isMobile = window.matchMedia("(max-width: 720px)").matches;
    if (isMobile) setOpen(true);
  }, []);

  const close = () => {
    localStorage.setItem(GUIDE_KEY, "1");
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="onboardingGuide" role="dialog" aria-modal="true" aria-label="처음 이용 안내">
      <div className="onboardingGuide__backdrop" onClick={close} />
      <section className="onboardingGuide__panel">
        <div className="card__title">처음 이용 안내</div>
        <p className="hint">브라우저 메뉴에서 홈 화면에 추가를 누르면 앱처럼 바로 열 수 있어요.</p>
        <p className="hint">음악은 입장 후 자동으로 시작되고, 막히면 화면을 한 번 터치하면 재생돼요.</p>
        <p className="hint">앨범에서 추억 재생하기를 누르면 사진을 전체 화면으로 볼 수 있어요.</p>
        <button className="btn btn--primary" type="button" onClick={close}>확인</button>
      </section>
    </div>
  );
}
