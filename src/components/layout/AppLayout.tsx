import { Suspense, useEffect, type ReactNode } from "react";
import CinematicIntro from "./CinematicIntro";
import HeaderBar from "./HeaderBar";
import InstallBanner from "./InstallBanner";
import LoadingOverlay from "./LoadingOverlay";
import LockScreen from "./LockScreen";
import MobileTabBar from "./MobileTabBar";
import OnboardingGuide from "./OnboardingGuide";
import { TEMPLATE_DEFAULTS } from "../../constants/templateConfig";
import { useRoom } from "../../contexts/RoomContext";
import type { AppTab } from "../../types/navigation";
import { recoverViewportAfterFullscreen, updateViewportHeightVar } from "../../utils/viewportRecovery";

type AppLayoutProps = {
  activeTab: AppTab;
  dday: string;
  children: ReactNode;
  onIntroComplete?: () => void;
  onTabChange: (tab: AppTab) => void;
};

export default function AppLayout({ activeTab, children, dday, onIntroComplete, onTabChange }: AppLayoutProps) {
  const { couple } = useRoom();

  useEffect(() => {
    document.title = couple.appTitle || TEMPLATE_DEFAULTS.appName;
  }, [couple.appTitle]);

  useEffect(() => {
    updateViewportHeightVar();
    window.visualViewport?.addEventListener("resize", updateViewportHeightVar);
    window.addEventListener("resize", updateViewportHeightVar);
    window.addEventListener("orientationchange", recoverViewportAfterFullscreen);

    return () => {
      window.visualViewport?.removeEventListener("resize", updateViewportHeightVar);
      window.removeEventListener("resize", updateViewportHeightVar);
      window.removeEventListener("orientationchange", recoverViewportAfterFullscreen);
    };
  }, []);

  return (
    <>
      <div className="bg" aria-hidden="true" />
      <LockScreen />
      <CinematicIntro onComplete={onIntroComplete} />
      <OnboardingGuide />
      <InstallBanner />

      <div className="app">
        <HeaderBar couple={couple} dday={dday} />
        <main className="appMain container">
          <Suspense fallback={<LoadingOverlay />}>{children}</Suspense>
        </main>
        <MobileTabBar activeTab={activeTab} onChange={onTabChange} />
      </div>
    </>
  );
}
