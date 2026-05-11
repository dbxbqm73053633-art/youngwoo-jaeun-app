export type LyricTiming = {
  time: number;
  text: string;
  tag?: boolean;
};

export function findActiveLyricIndex(lines: LyricTiming[], currentTime: number) {
  let activeIndex = -1;

  for (let index = 0; index < lines.length; index += 1) {
    if (currentTime + 0.05 >= lines[index].time) activeIndex = index;
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
