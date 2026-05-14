import { useMemo, useState } from "react";
import { useRoom } from "../../contexts/RoomContext";
import { provisionCustomerRoom, type ProvisionedCustomerRoom } from "../../services/roomService";

function credentialText(result: ProvisionedCustomerRoom) {
  const appUrl = window.location.origin + window.location.pathname;
  return [
    `app URL: ${appUrl}`,
    `coupleCode: ${result.coupleCode}`,
    `admin password: ${result.adminPassword}`,
    `viewer password: ${result.viewerPassword}`,
  ].join("\n");
}

export default function CustomerProvisioning() {
  const { systemAdmin } = useRoom();
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<ProvisionedCustomerRoom | null>(null);
  const [hint, setHint] = useState("새 고객용 커플 코드를 만들 수 있어요.");
  const text = useMemo(() => result ? credentialText(result) : "", [result]);

  if (!systemAdmin) return null;

  const handleCreate = async () => {
    setCreating(true);
    setHint("고객 방을 만드는 중...");
    try {
      const created = await provisionCustomerRoom();
      setResult(created);
      setHint("고객 방을 만들었어요. 비밀번호는 지금 복사해두세요.");
    } catch {
      setHint("고객 방 생성에 실패했어요. Firebase 권한과 중복 코드를 확인해주세요.");
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setHint("고객 접속 정보를 복사했어요.");
  };

  return (
    <article className="card customerProvisioning">
      <div className="card__title">고객 방 생성</div>
      <div className="form">
        <p className="hint">관리자 전용 고객 생성 도구예요.</p>
        <div className="row">
          <button className="btn btn--primary" type="button" onClick={handleCreate} disabled={creating}>
            {creating ? "생성 중..." : "고객 방 만들기"}
          </button>
          <button className="btn btn--soft" type="button" onClick={handleCopy} disabled={!result}>
            접속 정보 복사
          </button>
        </div>

        {result ? (
          <div className="customerProvisioning__result" aria-label="생성된 고객 접속 정보">
            <div><span>앱 주소</span><strong>{window.location.origin + window.location.pathname}</strong></div>
            <div><span>커플 코드</span><strong>{result.coupleCode}</strong></div>
            <div><span>관리자 비밀번호</span><strong>{result.adminPassword}</strong></div>
            <div><span>보기 비밀번호</span><strong>{result.viewerPassword}</strong></div>
          </div>
        ) : null}

        <p className="promptForm__hint">{hint}</p>
      </div>
    </article>
  );
}
