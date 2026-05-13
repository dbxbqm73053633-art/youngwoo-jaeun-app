import { missingFirebaseEnv } from "../../lib/firebase";

type ConfigurationFallbackProps = {
  roomPasswordConfigured: boolean;
};

export default function ConfigurationFallback({ roomPasswordConfigured }: ConfigurationFallbackProps) {
  const missing = [
    ...missingFirebaseEnv,
    ...(roomPasswordConfigured ? [] : ["VITE_ROOM_PASSWORD"]),
  ];

  return (
    <main className="configFallback">
      <section className="configFallback__panel" aria-labelledby="config-title">
        <h1 id="config-title">앱 설정이 필요해요</h1>
        <p>고객용 Firebase와 입장 비밀번호 환경 변수가 설정되지 않아 앱을 열 수 없어요.</p>
        <div className="configFallback__list">
          {missing.map((key) => (
            <code key={key}>{key}</code>
          ))}
        </div>
      </section>
    </main>
  );
}
