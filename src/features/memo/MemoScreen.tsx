import { useEffect } from "react";
import MemoForm from "../../components/memo/MemoForm";
import MemoList from "../../components/memo/MemoList";
import TodayPromptCard from "../../components/memo/TodayPromptCard";

type MemoScreenProps = {
  onReady?: () => void;
};

export default function MemoScreen({ onReady }: MemoScreenProps) {
  useEffect(() => {
    onReady?.();
  }, [onReady]);

  return (
    <section className="tab tab--active" id="tab-memo" aria-label="메모와 오늘의 한마디">
      <TodayPromptCard />

      <section className="section">
        <div className="section__head">
          <h2 className="section__title">다정한 메모</h2>
          <p className="section__desc">우리만의 이야기를 저장하고 함께 공유해요.</p>
        </div>

        <div className="grid grid--2">
          <MemoForm />
          <MemoList />
        </div>
      </section>
    </section>
  );
}
