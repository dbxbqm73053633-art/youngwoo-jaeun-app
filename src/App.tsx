import { lazy, useMemo, useState } from "react";
import AppLayout from "./components/layout/AppLayout";
import ConfigurationFallback from "./components/layout/ConfigurationFallback";
import { ModalProvider } from "./components/layout/ModalProvider";
import { RoomProvider } from "./contexts/RoomContext";
import { useRoom } from "./contexts/RoomContext";
import { useHomeData } from "./hooks/useHomeData";
import { hasFirebaseConfig } from "./lib/firebase";
import type { AppTab } from "./types/navigation";

const HomeScreen = lazy(() => import("./features/home/HomeScreen"));
const MemoScreen = lazy(() => import("./features/memo/MemoScreen"));
const AlbumScreen = lazy(() => import("./features/album/AlbumScreen"));
const CalendarScreen = lazy(() => import("./features/calendar/CalendarScreen"));
const SettingsScreen = lazy(() => import("./features/settings/SettingsScreen"));
const MusicScreen = lazy(() => import("./features/music/MusicScreen"));

function ActiveTabScreen({ activeTab }: { activeTab: AppTab }) {
  if (activeTab === "photos") return <AlbumScreen />;
  if (activeTab === "memo") return <MemoScreen />;
  if (activeTab === "diary") return <CalendarScreen />;
  if (activeTab === "admin") return <SettingsScreen />;
  return <HomeScreen />;
}

function ReactApp() {
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const { couple, isConfigured, roomId } = useRoom();
  const { counter } = useHomeData(roomId, couple);
  const dday = useMemo(() => counter.headerDDay || counter.dday, [counter.dday, counter.headerDDay]);

  if (!hasFirebaseConfig || !isConfigured) {
    return <ConfigurationFallback roomPasswordConfigured={isConfigured} />;
  }

  return (
    <ModalProvider>
      <AppLayout activeTab={activeTab} dday={dday} onTabChange={setActiveTab}>
        <ActiveTabScreen activeTab={activeTab} />
      </AppLayout>
      <MusicScreen />
    </ModalProvider>
  );
}

export default function App() {
  return (
    <RoomProvider>
      <ReactApp />
    </RoomProvider>
  );
}
