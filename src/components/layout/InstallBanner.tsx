import { useEffect, useState } from "react";
import { registerServiceWorker, setupPwaInstall, type BeforeInstallPromptEvent } from "../../services/pwaService";

export default function InstallBanner() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [updateRegistration, setUpdateRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updating, setUpdating] = useState(false);
  const visible = Boolean(installPrompt || updateRegistration);
  const isUpdate = Boolean(updateRegistration);

  useEffect(() => {
    const cleanupInstall = setupPwaInstall(setInstallPrompt);
    void registerServiceWorker(setUpdateRegistration).catch(() => {});
    return cleanupInstall;
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  const handleUpdate = () => {
    setUpdating(true);
    updateRegistration?.waiting?.postMessage({ type: "SKIP_WAITING" });
    window.location.reload();
  };

  return (
    <div className={`install${visible ? " show" : ""}`} aria-hidden={visible ? "false" : "true"}>
      <div className="install__text">
        <div className="install__title">{isUpdate ? "새 버전이 준비됐어요" : "홈 화면에 앱으로 저장하기"}</div>
        <div className="install__sub">
          {isUpdate ? "업데이트를 적용하면 최신 화면으로 다시 열려요." : "한 번 설치해두면 더 빠르고 편하게 열 수 있어요 ♡"}
        </div>
      </div>
      <div className="install__actions">
        <button
          className="btn btn--soft"
          type="button"
          onClick={() => {
            setInstallPrompt(null);
            setUpdateRegistration(null);
          }}
          disabled={updating}
        >
          나중에
        </button>
        <button className="btn btn--primary" type="button" onClick={isUpdate ? handleUpdate : handleInstall} disabled={updating}>
          {updating ? "적용 중..." : isUpdate ? "새 버전 적용" : "설치"}
        </button>
      </div>
    </div>
  );
}
