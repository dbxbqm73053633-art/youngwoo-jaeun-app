import { Suspense, type ReactNode } from "react";
import HeaderBar from "./HeaderBar";
import InstallBanner from "./InstallBanner";
import LoadingOverlay from "./LoadingOverlay";
import LockScreen from "./LockScreen";
import MobileTabBar from "./MobileTabBar";
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

  return (
    <>
      <div className="bg" aria-hidden="true" />
      <LockScreen />
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
