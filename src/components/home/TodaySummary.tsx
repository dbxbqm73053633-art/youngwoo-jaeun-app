import type { DailyPromptRecord } from "../../types";

type TodaySummaryProps = {
  prompt: DailyPromptRecord | null;
  todayMood: string;
};

function moodSummary(mood: string) {
  if (!mood) return "아직 오늘 기분을 남기지 않았어요. 한마디 탭에서 체크해볼까요?";
  if (mood === "happy") return "오늘 우리 온도는 높은 행복 쪽에 가까워요.";
  if (mood === "sad") return "오늘 우리 온도는 조금 낮은 쪽이에요. 그래도 함께라서 괜찮아요.";
  return "오늘 우리 온도는 보통이에요. 조용하지만 편안한 하루였어요.";
}

function promptSummary(prompt: DailyPromptRecord | null) {
  if (!prompt || (!prompt.mine && !prompt.yours)) {
    return "아직 오늘의 질문에 답하지 않았어요. 한마디 탭에서 같이 적어볼까요?";
  }
  const first = prompt.mine || prompt.yours || "";
  return `${prompt.question} · ${first.slice(0, 28)}${first.length > 28 ? "…" : ""}`;
}

export default function TodaySummary({ prompt, todayMood }: TodaySummaryProps) {
  return (
    <section className="section section--compact" aria-label="오늘 요약">
      <div className="section__head">
        <h2 className="section__title">오늘의 우리</h2>
        <p className="section__desc">오늘 감정과 한마디는 다른 탭에서 자세히 함께 남길 수 있어요.</p>
      </div>

      <div className="grid grid--2">
        <article className="card">
          <div className="card__title">오늘 기분 요약</div>
          <p className="hint" id="homeMoodSummary">{moodSummary(todayMood)}</p>
        </article>

        <article className="card">
          <div className="card__title">오늘의 한마디</div>
          <p className="hint" id="homePromptSummary">{promptSummary(prompt)}</p>
        </article>
      </div>
    </section>
  );
}
