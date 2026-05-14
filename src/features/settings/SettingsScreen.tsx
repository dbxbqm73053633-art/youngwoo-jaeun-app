import { useEffect } from "react";
import AdminUnlock from "../../components/settings/AdminUnlock";
import AnniversarySettings from "../../components/settings/AnniversarySettings";
import BackupSettings from "../../components/settings/BackupSettings";
import CoupleSettingsForm from "../../components/settings/CoupleSettingsForm";
import CustomerProvisioning from "../../components/settings/CustomerProvisioning";
import ThemeSettings from "../../components/settings/ThemeSettings";
import { useRoom } from "../../contexts/RoomContext";

type SettingsScreenProps = {
  onReady?: () => void;
};

export default function SettingsScreen({ onReady }: SettingsScreenProps) {
  const { systemAdmin } = useRoom();

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  return (
    <section className="tab tab--active" id="tab-admin" aria-label="관리자 모드">
      <section className="section">
        <div className="section__head">
          <h2 className="section__title">관리자 모드</h2>
          <p className="section__desc">우리의 공간을 조용히 정리하고 오래 간직해요.</p>
        </div>

        <AdminUnlock />
        <div className="adminPanel">
          {systemAdmin ? (
            <div className="adminPanel__group">
              <div className="adminPanel__label">고객 관리</div>
              <CustomerProvisioning />
            </div>
          ) : null}
          <div className="adminPanel__group">
            <div className="adminPanel__label">커플 정보</div>
            <CoupleSettingsForm />
            <AnniversarySettings />
          </div>
          <div className="adminPanel__group">
            <div className="adminPanel__label">화면 분위기</div>
            <ThemeSettings />
          </div>
          <div className="adminPanel__group">
            <div className="adminPanel__label">백업 / 복구</div>
            <BackupSettings />
          </div>
        </div>
      </section>
    </section>
  );
}
