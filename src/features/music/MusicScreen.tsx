import { useEffect, useState } from "react";
import { lyrics } from "../../data/lyrics";
import { useMusic } from "../../hooks/useMusic";
import LyricsPanel from "../../components/music/LyricsPanel";
import MusicMiniBar from "../../components/music/MusicMiniBar";
import MusicPlayer from "../../components/music/MusicPlayer";
import { INTRO_SEEN_KEY } from "../../constants/intro";
import { useRoom } from "../../contexts/RoomContext";

type MusicScreenProps = {
  onReady?: () => void;
};

export default function MusicScreen({ onReady }: MusicScreenProps) {
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const { unlocked } = useRoom();
  const {
    activeLyricIndex,
    audioRef,
    currentLyric,
    isPlaying,
    play,
    setIsPlaying,
    setVolume,
    syncLyrics,
    togglePlayback,
    volume,
  } = useMusic(lyrics);

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  useEffect(() => {
    if (!unlocked) return;

    let handledGesture = false;
    const shouldFadeIn = localStorage.getItem(INTRO_SEEN_KEY) !== "1";
    const targetVolume = volume;
    let fadeFrame = 0;

    const fadeInMusic = () => {
      if (!shouldFadeIn) return;
      const startedAt = performance.now();
      const duration = 2600;
      const tick = (now: number) => {
        const progress = Math.min(1, (now - startedAt) / duration);
        setVolume(targetVolume * progress);
        if (progress < 1) fadeFrame = window.requestAnimationFrame(tick);
      };
      setVolume(0);
      fadeFrame = window.requestAnimationFrame(tick);
    };

    const tryPlay = async () => {
      if (!audioRef.current?.paused) return true;
      try {
        if (shouldFadeIn) setVolume(0);
        await play();
        fadeInMusic();
        return true;
      } catch {
        setIsPlaying(false);
        return false;
      }
    };

    const playOnGesture = () => {
      if (handledGesture) return;
      handledGesture = true;
      removeGestureListeners();
      void tryPlay();
    };

    const addGestureListeners = () => {
      window.addEventListener("pointerdown", playOnGesture, { once: true });
      window.addEventListener("touchstart", playOnGesture, { once: true });
      window.addEventListener("click", playOnGesture, { once: true });
    };

    const removeGestureListeners = () => {
      window.removeEventListener("pointerdown", playOnGesture);
      window.removeEventListener("touchstart", playOnGesture);
      window.removeEventListener("click", playOnGesture);
    };

    void tryPlay().then((started) => {
      if (!started) addGestureListeners();
    });

    return () => {
      removeGestureListeners();
      if (fadeFrame) window.cancelAnimationFrame(fadeFrame);
    };
  }, [audioRef, play, setIsPlaying, setVolume, unlocked, volume]);

  return (
    <>
      <MusicMiniBar
        currentLyric={currentLyric}
        isPlaying={isPlaying}
        onToggleLyrics={() => setIsLyricsOpen(true)}
        onTogglePlayback={() => {
          void togglePlayback().catch(() => setIsPlaying(false));
        }}
        onVolumeChange={setVolume}
        volume={volume}
      />
      <LyricsPanel
        activeLyricIndex={activeLyricIndex}
        isOpen={isLyricsOpen}
        lines={lyrics}
        onClose={() => setIsLyricsOpen(false)}
      />
      <MusicPlayer
        audioRef={audioRef}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onSync={syncLyrics}
      />
    </>
  );
}
