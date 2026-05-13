const appVersion = import.meta.env.VITE_APP_VERSION || "0.0.0";

export default function BackupSettings() {
  return (
    <article className="card appInfoCard" aria-label="앱 정보">
      <div className="card__title">앱 정보</div>
      <div className="appInfoCard__row">
        <span>버전</span>
        <strong>v{appVersion}</strong>
      </div>
      <p className="hint">설치 후에도 새 버전이 준비되면 앱 안에서 바로 적용할 수 있어요.</p>
    </article>
  );
}
