export type AppTab = "home" | "photos" | "memo" | "diary" | "admin";

export type TabItem = {
  id: AppTab;
  icon: string;
  label: string;
};

export const tabs: TabItem[] = [
  { id: "home", icon: "🏠", label: "오늘" },
  { id: "photos", icon: "📸", label: "앨범" },
  { id: "memo", icon: "💌", label: "한마디" },
  { id: "diary", icon: "📔", label: "다이어리" },
  { id: "admin", icon: "⚙️", label: "관리" },
];
