import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildDefaultMusicTracks } from "../../data/musicTracks";
import { useMusic } from "../../hooks/useMusic";
import LyricsPanel from "../../components/music/LyricsPanel";
import MusicMiniBar from "../../components/music/MusicMiniBar";
import MusicPlayer from "../../components/music/MusicPlayer";
import { INTRO_PENDING_KEY, INTRO_SEEN_KEY } from "../../constants/intro";
import { useRoom } from "../../contexts/RoomContext";
import { parseLrc } from "../../services/musicService";

type MusicScreenProps = {
  onReady?: () => void;
};

const DEFAULT_MUSIC_VOLUME = 0.5;

export default function MusicScreen({ onReady }: MusicScreenProps) {
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [needsGestureToPlay, setNeedsGestureToPlay] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const shouldAutoPlayNextRef = useRef(false);
  const { couple, unlocked } = useRoom();
  const tracks = useMemo(() => buildDefaultMusicTracks(couple), [couple]);
  const currentTrack = tracks[currentTrackIndex] || tracks[0];
  const trackPosition = tracks.length > 0 ? `${currentTrackIndex + 1}/${tracks.length}` : "";
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

  const primeAudioVolume = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.muted = false;
      audio.volume = DEFAULT_MUSIC_VOLUME;
    }
    setVolume(DEFAULT_MUSIC_VOLUME, true);
  }, [audioRef, setVolume]);

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

    const shouldResume = (shouldAutoPlayNextRef.current || !audio.paused) && hasAudio;
    shouldAutoPlayNextRef.current = false;
    audio.pause();
    audio.load();
    resetPosition();
    setDuration(currentTrack?.duration || 0);

    if (shouldResume) {
      primeAudioVolume();
      void audio.play()
        .then(() => setIsPlaying(true))
        .catch((error) => {
          console.info("Background music needs a user gesture before it can play.", error);
          setNeedsGestureToPlay(true);
          setIsPlaying(false);
        });
    } else {
      setIsPlaying(false);
    }
  }, [audioRef, currentTrack?.audioSrc, currentTrack?.duration, hasAudio, primeAudioVolume, resetPosition, setDuration, setIsPlaying]);

  const selectTrack = (trackId: string) => {
    const nextIndex = tracks.findIndex((track) => track.id === trackId);
    if (nextIndex >= 0) {
      shouldAutoPlayNextRef.current = isPlaying;
      setCurrentTrackIndex(nextIndex);
    }
  };

  const playTrackOffset = (offset: number, autoplay = isPlaying) => {
    if (tracks.length <= 1) return;
    shouldAutoPlayNextRef.current = autoplay;
    setCurrentTrackIndex((index) => (index + offset + tracks.length) % tracks.length);
  };

  const handleTrackEnded = () => {
    setIsPlaying(false);
    if (tracks.length <= 1) return;
    playTrackOffset(1, true);
  };

  useEffect(() => {
    if (!unlocked) return;

    let handledGesture = false;
    const shouldStartWithIntro = sessionStorage.getItem(INTRO_PENDING_KEY) === "1" || sessionStorage.getItem(INTRO_SEEN_KEY) !== "1";

    const tryPlay = async () => {
      if (!hasAudio) return false;
      primeAudioVolume();
      if (!audioRef.current?.paused) return true;
      try {
        await play();
        setNeedsGestureToPlay(false);
        return true;
      } catch (error) {
        console.info("Background music autoplay was blocked; waiting for user gesture.", error);
        setIsPlaying(false);
        setNeedsGestureToPlay(true);
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
      if (!started || shouldStartWithIntro) addGestureListeners();
    });

    return () => {
      removeGestureListeners();
    };
  }, [audioRef, hasAudio, play, primeAudioVolume, setIsPlaying, unlocked]);

  const handleGesturePlay = () => {
    if (!hasAudio) return;
    primeAudioVolume();
    void play().then(() => {
      setNeedsGestureToPlay(false);
    }).catch((error) => {
      console.info("Background music still needs a user gesture before it can play.", error);
      setIsPlaying(false);
      setNeedsGestureToPlay(true);
    });
  };

  return (
    <>
      {needsGestureToPlay ? (
        <button className="musicStartPrompt" type="button" onClick={handleGesturePlay}>
          터치해서 음악 시작
        </button>
      ) : null}
      <MusicMiniBar
        artworkSrc={currentTrack?.artworkSrc || couple.posterSrc}
        currentLyric={currentLyric}
        currentTime={currentTime}
        disabled={!hasAudio}
        duration={duration}
        isPlaying={isPlaying}
        subtitle={currentTrack?.subtitle}
        trackPosition={trackPosition}
        title={currentTrack?.title}
        volume={volume}
        onNextTrack={tracks.length > 1 ? () => playTrackOffset(1) : undefined}
        onPreviousTrack={tracks.length > 1 ? () => playTrackOffset(-1) : undefined}
        onSeek={seek}
        onToggleLyrics={() => setIsLyricsOpen(true)}
        onTogglePlayback={() => {
          if (!hasAudio) return;
          void togglePlayback().catch(() => setIsPlaying(false));
        }}
        onVolumeChange={setVolume}
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
        onEnded={handleTrackEnded}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onSync={syncLyrics}
      />
    </>
  );
}
