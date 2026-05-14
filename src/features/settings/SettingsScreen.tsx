import { useEffect } from "react";
import AdminUnlock from "../../components/settings/AdminUnlock";
import AnniversarySettings from "../../components/settings/AnniversarySettings";
import BackupSettings from "../../components/settings/BackupSettings";
import CoupleSettingsForm from "../../components/settings/CoupleSettingsForm";
import CustomerProvisioning from "../../components/settings/CustomerProvisioning";
import MediaManagement from "../../components/settings/MediaManagement";
import ThemeSettings from "../../components/settings/ThemeSettings";

type SettingsScreenProps = {
  onReady?: () => void;
};

export default function SettingsScreen({ onReady }: SettingsScreenProps) {
  useEffect(() => {
    onReady?.();
  }, [onReady]);

  return (
    <section className="tab tab--active" id="tab-admin" aria-label="관리자 모드">
      <section className="section">
        <div className="section__head">
          <h2 className="section__title">관리자 모드</h2>
          <p className="section__desc">우리만의 앱을 더 우리답게 만들기.</p>
        </div>

        <AdminUnlock />
        <div className="adminPanel">
          <div className="adminPanel__group">
            <div className="adminPanel__label">고객 관리</div>
            <CustomerProvisioning />
          </div>
          <div className="adminPanel__group">
            <div className="adminPanel__label">커플 정보</div>
            <CoupleSettingsForm />
            <AnniversarySettings />
          </div>
          <div className="adminPanel__group">
            <div className="adminPanel__label">화면 / 미디어</div>
            <ThemeSettings />
            <MediaManagement />
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
