import { useEffect, useState, type FormEvent } from "react";
import { PROMPT_ATMOSPHERE_LINES } from "../../constants/emotionalCopy";
import { useRoom } from "../../contexts/RoomContext";
import { useHomeData } from "../../hooks/useHomeData";
import { todayKey } from "../../services/dailyService";

export default function TodayPromptCard() {
  const { couple, roomId } = useRoom();
  const { prompt, savePrompt, setMood, todayMood } = useHomeData(roomId, couple);
  const [mine, setMine] = useState("");
  const [yours, setYours] = useState("");
  const [hint, setHint] = useState("둘 다 적고 저장하면 하트가 반짝여요 ♡");

  useEffect(() => {
    setMine(prompt?.mine || "");
    setYours(prompt?.yours || "");
  }, [prompt?.mine, prompt?.yours]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await savePrompt(mine.trim(), yours.trim());
    setHint("오늘의 기록이 저장됐어요 ♡");
  };

  const handleMood = async (mood: string) => {
    await setMood(mood);
  };

  return (
    <section className="section">
      <div className="section__head">
        <h2 className="section__title">오늘의 한마디</h2>
        <p className="section__desc">매일 한 번, 서로에게 다정한 질문을 던져줄게요.</p>
      </div>

      <article className="card card--prompt">
        <div className="promptHeader">
          <div className="promptHeader__label">오늘의 질문</div>
          <div className="promptHeader__date" id="promptDateLabel">{todayKey().split("-").join(".")}</div>
        </div>
        <p className="promptQuestion" id="promptQuestion">{prompt?.question || "오늘 질문을 불러오는 중..."}</p>
        <p className="emotionalQuote promptAtmosphere">{PROMPT_ATMOSPHERE_LINES[todayKey().length % PROMPT_ATMOSPHERE_LINES.length]}</p>

        <form id="promptForm" className="promptForm" onSubmit={handleSubmit}>
          <label className="label">
            나의 한마디
            <textarea id="promptMine" className="textarea" rows={2} maxLength={200} value={mine} onChange={(event) => setMine(event.target.value)} placeholder="오늘 나는 어떤 마음이었는지 적어볼까?" />
          </label>
          <label className="label">
            너에게 한마디
            <textarea id="promptYours" className="textarea" rows={2} maxLength={200} value={yours} onChange={(event) => setYours(event.target.value)} placeholder="지금 너에게 해주고 싶은 말을 적어줘" />
          </label>

          <div className="row">
            <button className="btn btn--primary" type="submit">오늘 기록 저장</button>
            <span className="promptForm__hint" id="promptSaveHint">{hint}</span>
          </div>
        </form>

        <div className={`promptHeart${mine && yours ? " show" : ""}`} id="promptHeart" aria-hidden="true">♡</div>
      </article>

      <article className="card section__spaced">
        <div className="card__title">오늘 기분</div>
        <div className="row">
          {["happy", "normal", "sad"].map((mood) => (
            <button
              key={mood}
              className={`btn btn--soft moodBtn${todayMood === mood ? " moodBtn--active" : ""}`}
              type="button"
              data-mood={mood}
              onClick={() => void handleMood(mood)}
            >
              {mood === "happy" ? "행복" : mood === "sad" ? "속상" : "보통"}
            </button>
          ))}
        </div>
        <p className="hint" id="moodSaveHint">오늘 기분을 선택해보세요.</p>
      </article>
    </section>
  );
}
