import { useState } from "react";
import { useRoom } from "../../contexts/RoomContext";
import { downloadJson, exportRoomBackup } from "../../services/backupService";

const appVersion = import.meta.env.VITE_APP_VERSION || "0.0.0";

export default function BackupSettings() {
  const { admin, roomId } = useRoom();
  const [exporting, setExporting] = useState(false);
  const [hint, setHint] = useState("메모와 달력, 우리 공간의 기본 정보를 한 번에 간직할 수 있어요.");

  const handleExport = async () => {
    if (!admin || !roomId) return;
    setExporting(true);
    setHint("우리의 기록을 정리하는 중이에요...");
    try {
      const backup = await exportRoomBackup(roomId);
      downloadJson(`couple-room-${roomId}-backup.json`, backup);
      setHint("기록 파일을 안전하게 준비했어요.");
    } catch {
      setHint("기록을 내보내지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <article className="card appInfoCard backupCard" aria-label="기록 보관">
      <div className="backupCard__head">
        <span className="backupCard__icon" aria-hidden="true">♡</span>
        <div>
          <div className="card__title">기록 보관</div>
          <p className="hint">소중한 기록을 파일로 따로 보관해둘 수 있어요.</p>
        </div>
      </div>
      <button className="backupCard__button" type="button" onClick={handleExport} disabled={!admin || !roomId || exporting}>
        <span className="backupCard__buttonIcon" aria-hidden="true">↓</span>
        <span>{exporting ? "기록을 준비하는 중..." : "우리 기록 내보내기"}</span>
      </button>
      <p className="backupCard__hint">{hint}</p>
      <div className="appInfoCard__row">
        <span>앱 버전</span>
        <strong>v{appVersion}</strong>
      </div>
      <p className="hint">새 버전이 준비되면 앱 안에서 자연스럽게 이어서 사용할 수 있어요.</p>
    </article>
  );
}
