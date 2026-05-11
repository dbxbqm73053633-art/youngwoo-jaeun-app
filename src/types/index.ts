export type RoomConfig = {
  nameA: string;
  nameB: string;
  startDate: number;
  createdAt?: unknown;
};

export type PhotoRecord = {
  id?: string;
  album: string;
  caption: string;
  date: number | null;
  name: string;
  url: string;
  storagePath: string;
  createdAt: number;
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
