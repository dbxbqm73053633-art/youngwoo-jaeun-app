export const TEMPLATE_DEFAULTS = {
  appName: import.meta.env.VITE_APP_NAME || "영우 ♡ 재은",
  appShortName: import.meta.env.VITE_APP_SHORT_NAME || "영우재은",
  appDescription: import.meta.env.VITE_APP_DESCRIPTION || "영우와 재은의 추억 기록함",
  coupleNameA: import.meta.env.VITE_DEMO_NAME_A || "영우",
  coupleNameB: import.meta.env.VITE_DEMO_NAME_B || "재은",
  coupleCode: import.meta.env.VITE_COUPLE_CODE || "demo-couple",
  startDate: Date.parse(import.meta.env.VITE_DEMO_START_DATE || "2026-04-08T00:00:00+09:00"),
  introText: import.meta.env.VITE_INTRO_TEXT || "우리만의 방에 오신 걸 환영해요",
  heroBadge: import.meta.env.VITE_HERO_BADGE || "Private Couple App",
  heroTitle: import.meta.env.VITE_HERO_TITLE || "세상에 하나뿐인 우리만의 방",
  heroHighlight: import.meta.env.VITE_HERO_HIGHLIGHT || "오늘도 사랑해",
  heroSubtitle: import.meta.env.VITE_HERO_SUBTITLE || "함께한 날을 다정하게 세고, 추억과 마음을 날마다 차곡차곡 모아가게요.",
  musicTitle: import.meta.env.VITE_MUSIC_TITLE || "사랑해 재은아",
  musicMeta: import.meta.env.VITE_MUSIC_META || "영우가 재은이에게",
  musicSrc: import.meta.env.VITE_MUSIC_SRC || "./music/재은아사랑해.mp3",
  videoTitle: import.meta.env.VITE_VIDEO_TITLE || "영우와 재은의 시작 영상",
  videoSrc: import.meta.env.VITE_VIDEO_SRC || "./images/영재.mp4",
  posterSrc: import.meta.env.VITE_POSTER_SRC || "./images/영우재은.png",
  theme: import.meta.env.VITE_DEFAULT_THEME || "romance",
} as const;

export function safeDate(value: number) {
  return Number.isFinite(value) ? value : Date.parse("2026-04-08T00:00:00+09:00");
}
