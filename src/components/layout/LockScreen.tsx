import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRoom } from "../../contexts/RoomContext";

const SAVED_COUPLE_CODE_KEY = "ywjy_last_couple_code_v1";

function readSavedCoupleCode() {
  return localStorage.getItem(SAVED_COUPLE_CODE_KEY)?.trim() || "";
}

export default function LockScreen() {
  const { couple, error, loading, unlock, unlocked } = useRoom();
  const configuredCoupleCode = String(import.meta.env.VITE_COUPLE_CODE || "").trim();
  const [hasSavedCoupleCode, setHasSavedCoupleCode] = useState(() => Boolean(readSavedCoupleCode()));
  const [editingCoupleCode, setEditingCoupleCode] = useState(() => !readSavedCoupleCode() && !configuredCoupleCode);
  const [coupleCode, setCoupleCode] = useState(() => readSavedCoupleCode() || configuredCoupleCode);
  const [pass, setPass] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [loginError, setLoginError] = useState("");
  const codeInputRef = useRef<HTMLInputElement | null>(null);
  const passInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!unlocked) (editingCoupleCode || !coupleCode ? codeInputRef : passInputRef).current?.focus();
  }, [coupleCode, editingCoupleCode, unlocked]);

  const handleChangeCoupleCode = () => {
    setEditingCoupleCode(true);
    setInvalid(false);
    setLoginError("");
    requestAnimationFrame(() => codeInputRef.current?.select());
  };

  const handleResetSavedCoupleCode = () => {
    localStorage.removeItem(SAVED_COUPLE_CODE_KEY);
    setHasSavedCoupleCode(false);
    setEditingCoupleCode(true);
    setCoupleCode(configuredCoupleCode);
    setInvalid(false);
    setLoginError("");
    requestAnimationFrame(() => codeInputRef.current?.select());
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError("");
    try {
      const result = await unlock(coupleCode, pass);
      setInvalid(!result.ok);
      if (result.ok) {
        const displayCoupleCode = String(coupleCode || configuredCoupleCode).trim();
        if (displayCoupleCode) {
          localStorage.setItem(SAVED_COUPLE_CODE_KEY, displayCoupleCode);
          setHasSavedCoupleCode(true);
          setEditingCoupleCode(false);
        }
        return;
      }
      if (!result.ok) {
        if (result.reason === "invalid-code") setLoginError("커플 코드를 입력해주세요.");
        if (result.reason === "missing-room") setLoginError("커플 코드를 찾을 수 없어요. 다시 확인해주세요.");
        if (result.reason === "wrong-password") setLoginError("앗, 비밀번호가 달라요. 우리만 아는 숫자 4자리예요.");
        if (result.reason === "config-error") setLoginError("입장 설정이 아직 준비되지 않았어요.");
        (result.reason === "wrong-password" ? passInputRef : codeInputRef).current?.select();
      }
    } catch (caught) {
      setInvalid(false);
      const code = typeof caught === "object" && caught && "code" in caught ? String(caught.code) : "";
      const message = caught instanceof Error ? caught.message : String(caught);
      if (code.includes("permission-denied") || message.includes("permission-denied")) {
        setLoginError("권한 설정 문제로 접속하지 못했어요. 관리자에게 문의해주세요.");
        return;
      }
      setLoginError("Firebase 연결에 실패했어요. 네트워크를 확인하고 다시 시도해주세요.");
    }
  };

  return (
    <div className={`lock${unlocked ? "" : " show"}`} aria-hidden={unlocked ? "true" : "false"}>
      <div className={`lock__card${invalid ? " shake" : ""}`} role="dialog" aria-modal="true" aria-label="비밀번호 잠금">
        <div className="lock__badge">♡</div>
        <h1 className="lock__title">{couple.nameA} ♡ {couple.nameB}</h1>
        <p className="lock__desc">
          우리 둘만 들어오는 작은 공간이에요.<br />
          비밀번호를 입력하면 열려요.
        </p>

        <form className="lock__form" onSubmit={handleSubmit}>
          <label className="lock__label" htmlFor="lockCoupleCode">커플 코드</label>
          <div className="lock__codeRow">
            <input
              ref={codeInputRef}
              id="lockCoupleCode"
              className="lock__input"
              type="text"
              autoCapitalize="none"
              autoComplete="username"
              value={coupleCode}
              onChange={(event) => {
                setCoupleCode(event.target.value);
                setInvalid(false);
                setLoginError("");
              }}
              disabled={loading || (!editingCoupleCode && Boolean(coupleCode))}
            />
            {!editingCoupleCode && coupleCode ? (
              <button className="lock__miniButton" type="button" onClick={handleChangeCoupleCode} disabled={loading}>&#48320;&#44221;</button>
            ) : null}
          </div>

          <label className="lock__label" htmlFor="lockPass">비밀번호</label>
          <div className="lock__row">
            <input
              ref={passInputRef}
              id="lockPass"
              className="lock__input"
              type="password"
              inputMode="numeric"
              maxLength={12}
              autoComplete="off"
              value={pass}
              onChange={(event) => {
                setPass(event.target.value);
                setInvalid(false);
                setLoginError("");
              }}
              disabled={loading}
            />
            <button className="btn btn--primary" type="submit" disabled={loading}>{loading ? "확인 중..." : "열기"}</button>
          </div>
          <p className={`lock__hint${invalid || error || loginError ? " error" : ""}`}>
            {loginError || (invalid ? "앗, 비밀번호가 달라요. 우리만 아는 숫자 4자리예요." : "비밀번호는 숫자 4자리예요.")}
          </p>
          {hasSavedCoupleCode && invalid ? (
            <button className="lock__resetCode" type="button" onClick={handleResetSavedCoupleCode} disabled={loading}>&#51200;&#51109;&#46108; &#52964;&#54540; &#53076;&#46300; &#51648;&#50864;&#44592;</button>
          ) : null}
        </form>

        <div className="lock__foot">Made with ♡ for two</div>
      </div>
    </div>
  );
}
