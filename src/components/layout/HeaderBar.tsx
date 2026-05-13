import type { RoomConfig } from "../../types";

type HeaderBarProps = {
  couple: RoomConfig;
  dday: string;
};

export default function HeaderBar({ couple, dday }: HeaderBarProps) {
  return (
    <header className="appHeader">
      <div className="appHeader__inner">
        <div className="appHeader__brand">
          <span className="appHeader__name">{couple.nameA}</span>
          <span className="appHeader__heart beat">♡</span>
          <span className="appHeader__name">{couple.nameB}</span>
        </div>
        <div className="appHeader__dday">{dday}</div>
      </div>
    </header>
  );
}
