export type RoomConfig = {
  coupleCode?: string;
  nameA: string;
  nameB: string;
  startDate: number;
  appTitle?: string;
  introText?: string;
  theme?: string;
  musicTitle?: string;
  musicMeta?: string;
  musicSrc?: string;
  videoTitle?: string;
  videoSrc?: string;
  posterSrc?: string;
  createdAt?: unknown;
};

export type PhotoRecord = {
  id?: string;
  album: string;
  caption: string;
  date: number | null;
  memo?: string;
  name: string;
  url: string;
  thumbnailUrl?: string;
  storagePath: string;
  createdAt: number;
  order?: number;
  isCover?: boolean;
};

export type MemoRecord = {
  id?: string;
  title: string;
  body: string;
  createdAt: number;
};

export type DailyPromptRecord = {
  mine: string;
  yours: string;
  question: string;
  updatedAt: number;
};

export type DiaryPhoto = {
  url: string;
  storagePath: string;
  name: string;
  createdAt: number;
};

export type DiaryEntry = {
  id?: string;
  dateKey: string;
  dateTs: number;
  monthKey: string;
  memo: string;
  anniversary: string;
  photos: DiaryPhoto[];
  updatedAt: number;
};
