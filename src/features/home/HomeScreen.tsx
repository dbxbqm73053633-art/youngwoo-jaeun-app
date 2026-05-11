import { useEffect } from "react";
import DDaySection from "../../components/home/DDaySection";
import HeroSection from "../../components/home/HeroSection";
import MainCtaButtons from "../../components/home/MainCtaButtons";
import TodaySummary from "../../components/home/TodaySummary";

type HomeScreenProps = {
  onReady?: () => void;
};

export default function HomeScreen({ onReady }: HomeScreenProps) {
  useEffect(() => {
    onReady?.();
  }, [onReady]);

  return (
    <section className="tab tab--active" id="tab-home" aria-label="오늘">
      <HeroSection />
      <DDaySection />
      <MainCtaButtons />
      <TodaySummary />
    </section>
  );
}
