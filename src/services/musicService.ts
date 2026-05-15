export type LyricTiming = {
  time: number;
  text: string;
  tag?: boolean;
};

export type MusicTrack = {
  id: string;
  title: string;
  subtitle?: string;
  audioSrc?: string;
  artworkSrc?: string;
  lyrics: LyricTiming[];
  lyricsSrc?: string;
  duration?: number;
  themeColor?: string;
  lyricOffsetMs?: number;
  backgroundVideoSrc?: string;
};

function parseTimestamp(value: string) {
  const match = value.match(/^(\d+):(\d{2})(?:\.(\d{1,3}))?$/);
  if (!match) return null;

  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  const fraction = Number((match[3] || "0").padEnd(3, "0"));
  return (minutes * 60) + seconds + (fraction / 1000);
}

function isSectionLabel(text: string) {
  return /^\[[^\]]+\]$/.test(text.trim());
}

export function parseLrc(lrc: string): LyricTiming[] {
  const lines: LyricTiming[] = [];
  let pendingTime: number | null = null;

  for (const rawLine of lrc.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const timestamps = [...line.matchAll(/\[(\d+:\d{2}(?:\.\d{1,3})?)\]/g)]
      .map((match) => parseTimestamp(match[1]))
      .filter((time): time is number => time !== null);

    const text = line.replace(/\[(\d+:\d{2}(?:\.\d{1,3})?)\]/g, "").trim();

    if (timestamps.length > 0) {
      const firstTime = timestamps[0];
      if (text) {
        for (const time of timestamps) {
          lines.push({ time, text, tag: isSectionLabel(text) });
        }
        pendingTime = isSectionLabel(text) ? firstTime : null;
      } else {
        pendingTime = firstTime;
      }
      continue;
    }

    if (pendingTime !== null) {
      lines.push({ time: pendingTime, text });
      pendingTime = null;
    }
  }

  return lines.sort((a, b) => a.time - b.time);
}

export function findActiveLyricIndex(lines: LyricTiming[], currentTime: number, lyricOffsetMs = 0) {
  let activeIndex = -1;
  const adjustedTime = currentTime + (lyricOffsetMs / 1000);

  for (let index = 0; index < lines.length; index += 1) {
    if (adjustedTime + 0.05 >= lines[index].time) activeIndex = index;
    else break;
  }

  return activeIndex;
}

export function findDisplayLyric(lines: LyricTiming[], activeIndex: number) {
  let index = activeIndex;

  while (index >= 0 && lines[index].tag) {
    index -= 1;
  }

  return index >= 0 ? lines[index].text : "";
}
