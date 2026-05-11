import { useCallback, useMemo, useRef, useState } from "react";
import { findActiveLyricIndex, findDisplayLyric, type LyricTiming } from "../services/musicService";

export function useMusic(lyrics: LyricTiming[] = []) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolumeState] = useState(0.6);
  const [activeLyricIndex, setActiveLyricIndex] = useState(-1);

  const currentLyric = useMemo(
    () => findDisplayLyric(lyrics, activeLyricIndex),
    [activeLyricIndex, lyrics],
  );

  const syncLyrics = useCallback((nextTime: number) => {
    setCurrentTime(nextTime);
    setActiveLyricIndex(findActiveLyricIndex(lyrics, nextTime));
  }, [lyrics]);

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

  const setVolume = useCallback((nextVolume: number) => {
    const clamped = Math.max(0, Math.min(1, nextVolume));
    setVolumeState(clamped);
    if (audioRef.current) audioRef.current.volume = clamped;
  }, []);

  return {
    audioRef,
    isPlaying,
    currentTime,
    volume,
    activeLyricIndex,
    currentLyric,
    setIsPlaying,
    setVolume,
    syncLyrics,
    play,
    pause,
    togglePlayback,
  };
}
