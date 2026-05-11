import { useEffect } from "react";
import AdminUnlock from "../../components/settings/AdminUnlock";
import AnniversarySettings from "../../components/settings/AnniversarySettings";
import BackupSettings from "../../components/settings/BackupSettings";
import CoupleSettingsForm from "../../components/settings/CoupleSettingsForm";
import ThemeSettings from "../../components/settings/ThemeSettings";

type SettingsScreenProps = {
  onReady?: () => void;
};

export default function SettingsScreen({ onReady }: SettingsScreenProps) {
  useEffect(() => {
    onReady?.();
  }, [onReady]);

  return (
    <section className="tab" id="tab-admin" aria-label="관리자 모드">
      <section className="section">
        <div className="section__head">
          <h2 className="section__title">관리자 모드</h2>
          <p className="section__desc">우리만의 앱을 더 우리답게 만들기.</p>
        </div>

        <AdminUnlock />
        <CoupleSettingsForm />
        <AnniversarySettings />
        <ThemeSettings />
        <BackupSettings />
      </section>

      {/* TODO: admin form persistence, theme application, and global unlock remain legacy-owned for now. */}
    </section>
  );
}
