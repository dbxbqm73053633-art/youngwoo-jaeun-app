import { useState } from "react";
import { useRoom } from "../../contexts/RoomContext";
import { downloadJson, exportRoomBackup } from "../../services/backupService";

const appVersion = import.meta.env.VITE_APP_VERSION || "0.0.0";

export default function BackupSettings() {
  const { admin, roomId } = useRoom();
  const [exporting, setExporting] = useState(false);
  const [hint, setHint] = useState("메모, 달력, 기본 정보를 안전하게 내보낼 수 있어요.");

  const handleExport = async () => {
    if (!admin || !roomId) return;
    setExporting(true);
    setHint("백업 파일을 준비하는 중...");
    try {
      const backup = await exportRoomBackup(roomId);
      downloadJson(`couple-room-${roomId}-backup.json`, backup);
      setHint("백업 파일을 저장했어요.");
    } catch {
      setHint("백업을 만들지 못했어요. Firebase 연결을 확인해주세요.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <article className="card appInfoCard" aria-label="앱 정보">
      <div className="card__title">백업 / 앱 정보</div>
      <div className="row">
        <button className="btn btn--soft" type="button" onClick={handleExport} disabled={!admin || !roomId || exporting}>
          {exporting ? "내보내는 중..." : "백업 내보내기"}
        </button>
        <span className="promptForm__hint">{hint}</span>
      </div>
      <div className="appInfoCard__row">
        <span>버전</span>
        <strong>v{appVersion}</strong>
      </div>
      <p className="hint">설치 후에도 새 버전이 준비되면 앱 안에서 바로 적용할 수 있어요.</p>
    </article>
  );
}
