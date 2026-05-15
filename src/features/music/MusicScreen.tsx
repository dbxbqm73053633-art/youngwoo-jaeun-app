import { useEffect, useMemo, useState } from "react";
import { buildDefaultMusicTracks } from "../../data/musicTracks";
import { useMusic } from "../../hooks/useMusic";
import LyricsPanel from "../../components/music/LyricsPanel";
import MusicMiniBar from "../../components/music/MusicMiniBar";
import MusicPlayer from "../../components/music/MusicPlayer";
import { INTRO_SEEN_KEY } from "../../constants/intro";
import { useRoom } from "../../contexts/RoomContext";
import { parseLrc } from "../../services/musicService";

type MusicScreenProps = {
  onReady?: () => void;
};

export default function MusicScreen({ onReady }: MusicScreenProps) {
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const { couple, unlocked } = useRoom();
  const tracks = useMemo(() => buildDefaultMusicTracks(couple), [couple]);
  const currentTrack = tracks[currentTrackIndex] || tracks[0];
  const [currentLyrics, setCurrentLyrics] = useState(currentTrack?.lyrics || []);
  const hasAudio = Boolean(currentTrack?.audioSrc);
  const {
    activeLyricIndex,
    audioRef,
    currentLyric,
    currentTime,
    duration,
    isPlaying,
    play,
    resetPosition,
    seek,
    setDuration,
    setIsPlaying,
    setVolume,
    syncLyrics,
    togglePlayback,
    volume,
  } = useMusic(currentLyrics, currentTrack?.lyricOffsetMs || 0);

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  useEffect(() => {
    if (currentTrackIndex < tracks.length) return;
    setCurrentTrackIndex(0);
  }, [currentTrackIndex, tracks.length]);

  useEffect(() => {
    let active = true;
    const fallbackLyrics = currentTrack?.lyrics || [];
    setCurrentLyrics(fallbackLyrics);
    resetPosition();

    if (!currentTrack?.lyricsSrc) return () => {
      active = false;
    };

    void fetch(currentTrack.lyricsSrc, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to load lyrics: ${response.status}`);
        return response.text();
      })
      .then((lrc) => {
        if (!active) return;
        setCurrentLyrics(parseLrc(lrc));
        resetPosition();
      })
      .catch((error) => {
        console.error("가사 파일을 불러오지 못했어요.", error);
        if (active) setCurrentLyrics(fallbackLyrics);
      });

    return () => {
      active = false;
    };
  }, [currentTrack?.id, currentTrack?.lyrics, currentTrack?.lyricsSrc, resetPosition]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const shouldResume = !audio.paused && hasAudio;
    audio.pause();
    audio.load();
    resetPosition();
    setDuration(currentTrack?.duration || 0);

    if (shouldResume) {
      void audio.play().catch(() => setIsPlaying(false));
    } else {
      setIsPlaying(false);
    }
  }, [audioRef, currentTrack?.audioSrc, currentTrack?.duration, hasAudio, resetPosition, setDuration, setIsPlaying]);

  const selectTrack = (trackId: string) => {
    const nextIndex = tracks.findIndex((track) => track.id === trackId);
    if (nextIndex >= 0) setCurrentTrackIndex(nextIndex);
  };

  const playTrackOffset = (offset: number) => {
    if (tracks.length <= 1) return;
    setCurrentTrackIndex((index) => (index + offset + tracks.length) % tracks.length);
  };

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
      if (!hasAudio) return false;
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
  }, [audioRef, hasAudio, play, setIsPlaying, setVolume, unlocked, volume]);

  return (
    <>
      <MusicMiniBar
        artworkSrc={currentTrack?.artworkSrc || couple.posterSrc}
        currentLyric={currentLyric}
        disabled={!hasAudio}
        isPlaying={isPlaying}
        title={currentTrack?.title}
        onToggleLyrics={() => setIsLyricsOpen(true)}
        onTogglePlayback={() => {
          if (!hasAudio) return;
          void togglePlayback().catch(() => setIsPlaying(false));
        }}
        onVolumeChange={setVolume}
        volume={volume}
      />
      <LyricsPanel
        activeLyricIndex={activeLyricIndex}
        artworkSrc={currentTrack?.artworkSrc || couple.posterSrc}
        currentTrackId={currentTrack?.id}
        currentTime={currentTime}
        duration={duration}
        isOpen={isLyricsOpen}
        isPlaying={isPlaying}
        lines={currentLyrics}
        songTitle={currentTrack?.title}
        songMeta={currentTrack?.subtitle}
        tracks={tracks}
        onClose={() => setIsLyricsOpen(false)}
        onNextTrack={() => playTrackOffset(1)}
        onPreviousTrack={() => playTrackOffset(-1)}
        onSeek={seek}
        onTrackSelect={selectTrack}
        onTogglePlayback={() => {
          if (!hasAudio) return;
          void togglePlayback().catch(() => setIsPlaying(false));
        }}
      />
      <MusicPlayer
        audioRef={audioRef}
        musicSrc={currentTrack?.audioSrc}
        onDurationChange={setDuration}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onSync={syncLyrics}
      />
    </>
  );
}
