import { useEffect, useState } from "react";
import { lyrics } from "../../data/lyrics";
import { useMusic } from "../../hooks/useMusic";
import LyricsPanel from "../../components/music/LyricsPanel";
import MusicMiniBar from "../../components/music/MusicMiniBar";
import MusicPlayer from "../../components/music/MusicPlayer";

type MusicScreenProps = {
  onReady?: () => void;
};

export default function MusicScreen({ onReady }: MusicScreenProps) {
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
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
    const unlockOnce = () => {
      if (!audioRef.current?.paused) return;
      void play().catch(() => setIsPlaying(false));
    };

    window.addEventListener("pointerdown", unlockOnce, { once: true });
    return () => window.removeEventListener("pointerdown", unlockOnce);
  }, [audioRef, play, setIsPlaying]);

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
