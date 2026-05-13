import { useCallback, useEffect, useMemo, useState } from "react";
import { getRecentMoods, getTodayPrompt, saveMood, saveTodayPrompt, todayKey } from "../services/dailyService";
import type { DailyPromptRecord, RoomConfig } from "../types";

const MILESTONES = [
  { days: 100, name: "100일(우리, 꽤 멋지게 여기까지)" },
  { days: 200, name: "200일(서로에게 더 익숙해지는 날)" },
  { days: 365, name: "1주년 (처음부터 지금까지, 고마워)" },
  { days: 500, name: "500일(사랑은 오늘도 진행 중)" },
  { days: 730, name: "2주년 (든든한 우리)" },
  { days: 1000, name: "1000일(우리만의 전설)" },
];

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function formatDate(date: Date) {
  const week = ["일", "월", "화", "수", "목", "금", "토"];
  return `${date.getFullYear()}.${pad2(date.getMonth() + 1)}.${pad2(date.getDate())} (${week[date.getDay()]})`;
}

function diffFrom(startDate: number) {
  const now = new Date();
  const ms = Math.max(0, now.getTime() - startDate);
  const totalSeconds = Math.floor(ms / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);
  return { now, totalSeconds, totalMinutes, totalHours, totalDays };
}

export function useHomeData(roomId: string | null, couple: RoomConfig) {
  const [tick, setTick] = useState(() => Date.now());
  const [prompt, setPrompt] = useState<DailyPromptRecord | null>(null);
  const [todayMood, setTodayMood] = useState("");

  useEffect(() => {
    const id = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const counter = useMemo(() => {
    void tick;
    const diff = diffFrom(couple.startDate);
    const start = new Date(couple.startDate);
    const next = MILESTONES.find((item) => item.days > diff.totalDays) ?? MILESTONES[MILESTONES.length - 1];
    const nextDate = new Date(start);
    nextDate.setDate(start.getDate() + next.days);

    return {
      dday: `D+${diff.totalDays + 1}`,
      headerDDay: `D+${diff.totalDays + 1}`,
      sinceText: `${formatDate(start)}부터`,
      startDateLabel: formatDate(start),
      todayLabel: formatDate(diff.now),
      hhmmss: `${pad2(diff.now.getHours())}:${pad2(diff.now.getMinutes())}:${pad2(diff.now.getSeconds())}`,
      days: diff.totalDays.toLocaleString("ko-KR"),
      hours: diff.totalHours.toLocaleString("ko-KR"),
      minutes: diff.totalMinutes.toLocaleString("ko-KR"),
      seconds: diff.totalSeconds.toLocaleString("ko-KR"),
      nextLabel: next.name,
      nextValue: `${formatDate(nextDate)} · D-${Math.max(0, next.days - diff.totalDays)}`,
    };
  }, [couple.startDate, tick]);

  const reload = useCallback(async () => {
    if (!roomId) return;
    const [nextPrompt, moods] = await Promise.all([getTodayPrompt(roomId), getRecentMoods(roomId)]);
    setPrompt(nextPrompt);
    setTodayMood(moods.find((item) => item.dateKey === todayKey())?.mood || "");
  }, [roomId]);

  const savePrompt = useCallback(async (mine: string, yours: string) => {
    if (!roomId || !prompt) return;
    const nextPrompt = { mine, yours, question: prompt.question, updatedAt: Date.now() };
    await saveTodayPrompt(roomId, nextPrompt);
    setPrompt(nextPrompt);
  }, [prompt, roomId]);

  const setMood = useCallback(async (mood: string) => {
    if (!roomId) return;
    await saveMood(roomId, mood);
    setTodayMood(mood);
  }, [roomId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { counter, prompt, todayMood, reload, savePrompt, setMood };
}
