import { useEffect, useState, type FormEvent } from "react";
import { useRoom } from "../../contexts/RoomContext";

const allowedThemes = ["romance", "minimal", "lavender"];

function applyTheme(theme: string) {
  const safeTheme = allowedThemes.includes(theme) ? theme : "romance";
  document.documentElement.dataset.theme = safeTheme;
  localStorage.setItem("ywjy_theme", safeTheme);
}

export default function ThemeSettings() {
  const { admin } = useRoom();
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("ywjy_theme") || "romance";
    return allowedThemes.includes(saved) ? saved : "romance";
  });
  const [hint, setHint] = useState("설정은 브라우저에 기억돼요.");

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!admin) return;
    applyTheme(theme);
    setHint("테마가 적용되었어요.");
  };

  return (
    <article className="card">
      <div className="card__title">테마 / 보기 설정</div>
      <form id="themeForm" className="form" onSubmit={handleSubmit}>
        <label className="label">
          테마 선택
          <select id="themeSelect" className="input" value={theme} onChange={(event) => setTheme(event.target.value)} disabled={!admin}>
            <option value="romance">Pink Romance</option>
            <option value="minimal">Soft Minimal</option>
            <option value="lavender">Lavender Dream</option>
          </select>
        </label>
        <div className="row">
          <button className="btn btn--soft" type="submit" disabled={!admin}>테마 적용</button>
          <span className="promptForm__hint" id="themeHint">{hint}</span>
        </div>
      </form>
    </article>
  );
}
