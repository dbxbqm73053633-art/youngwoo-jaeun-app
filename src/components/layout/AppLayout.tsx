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

type AppLayoutProps = {
  activeTab: AppTab;
  dday: string;
  children: ReactNode;
  onTabChange: (tab: AppTab) => void;
};

export default function AppLayout({ activeTab, children, dday, onTabChange }: AppLayoutProps) {
  const { couple } = useRoom();

  useEffect(() => {
    document.title = couple.appTitle || TEMPLATE_DEFAULTS.appName;
  }, [couple.appTitle]);

  return (
    <>
      <div className="bg" aria-hidden="true" />
      <LockScreen />
      <CinematicIntro dday={dday} />
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
