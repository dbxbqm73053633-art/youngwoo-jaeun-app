import { useEffect } from "react";
import { useRoom } from "../../contexts/RoomContext";
import { useHomeData } from "../../hooks/useHomeData";
import DDaySection from "../../components/home/DDaySection";
import HeroSection from "../../components/home/HeroSection";
import MainCtaButtons from "../../components/home/MainCtaButtons";
import TodaySummary from "../../components/home/TodaySummary";

type HomeScreenProps = {
  onReady?: () => void;
};

export default function HomeScreen({ onReady }: HomeScreenProps) {
  const { couple, roomId } = useRoom();
  const { counter, prompt, todayMood } = useHomeData(roomId, couple);

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  return (
    <section className="tab tab--active" id="tab-home" aria-label="오늘">
      <HeroSection counter={counter} />
      <DDaySection counter={counter} />
      <MainCtaButtons />
      <TodaySummary prompt={prompt} todayMood={todayMood} />
    </section>
  );
}
