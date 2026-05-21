import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { findActiveLyricIndex, findDisplayLyric, type LyricTiming } from "../services/musicService";

const MUSIC_VOLUME_KEY = "coupleMusicVolume";
const DEFAULT_VOLUME = 0.5;

function readSavedVolume() {
  if (typeof window === "undefined") return DEFAULT_VOLUME;
  const saved = window.localStorage.getItem(MUSIC_VOLUME_KEY);
  if (saved === null) return DEFAULT_VOLUME;
  const parsed = Number(saved);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(1, parsed)) : DEFAULT_VOLUME;
}

export function useMusic(lyrics: LyricTiming[] = [], lyricOffsetMs = 0) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(readSavedVolume);
  const [activeLyricIndex, setActiveLyricIndex] = useState(-1);

  const currentLyric = useMemo(
    () => findDisplayLyric(lyrics, activeLyricIndex),
    [activeLyricIndex, lyrics],
  );

  useEffect(() => {
    setCurrentTime(0);
    setActiveLyricIndex(-1);
  }, [lyrics]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const syncLyrics = useCallback((nextTime: number) => {
    setCurrentTime(nextTime);
    setActiveLyricIndex(findActiveLyricIndex(lyrics, nextTime, lyricOffsetMs));
  }, [lyricOffsetMs, lyrics]);

  const resetPosition = useCallback(() => {
    setCurrentTime(0);
    setActiveLyricIndex(-1);
    if (audioRef.current) audioRef.current.currentTime = 0;
  }, []);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    await audio.play();
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    setIsPlaying(false);
  }, []);

  const togglePlayback = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) await play();
    else pause();
  }, [pause, play]);

  const setVolume = useCallback((nextVolume: number, persist = true) => {
    const clamped = Math.max(0, Math.min(1, nextVolume));
    setVolumeState(clamped);
    if (audioRef.current) audioRef.current.volume = clamped;
    if (persist && typeof window !== "undefined") {
      window.localStorage.setItem(MUSIC_VOLUME_KEY, String(clamped));
    }
  }, []);

  const seek = useCallback((nextTime: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const safeDuration = Number.isFinite(audio.duration) ? audio.duration : 0;
    const clamped = Math.max(0, Math.min(safeDuration || nextTime, nextTime));
    audio.currentTime = clamped;
    syncLyrics(clamped);
  }, [syncLyrics]);

  return {
    audioRef,
    isPlaying,
    currentTime,
    duration,
    volume,
    activeLyricIndex,
    currentLyric,
    resetPosition,
    seek,
    setIsPlaying,
    setDuration,
    setVolume,
    syncLyrics,
    play,
    pause,
    togglePlayback,
  };
}
