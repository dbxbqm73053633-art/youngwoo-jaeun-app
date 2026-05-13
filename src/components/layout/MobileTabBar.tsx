import { tabs, type AppTab } from "../../types/navigation";

type MobileTabBarProps = {
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
};

export default function MobileTabBar({ activeTab, onChange }: MobileTabBarProps) {
  return (
    <nav className="tabbar" aria-label="하단 탭">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tabbar__btn${activeTab === tab.id ? " tabbar__btn--active" : ""}`}
          type="button"
          onClick={() => onChange(tab.id)}
        >
          <span className="tabbar__icon">{tab.icon}</span>
          <span className="tabbar__label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
