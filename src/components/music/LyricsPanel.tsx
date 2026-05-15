import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import { TEMPLATE_DEFAULTS } from "../../constants/templateConfig";
import type { LyricTiming, MusicTrack } from "../../services/musicService";

type LyricsPanelProps = {
  activeLyricIndex: number;
  artworkSrc?: string;
  currentTime: number;
  duration: number;
  isOpen: boolean;
  isPlaying: boolean;
  lines: LyricTiming[];
  songMeta?: string;
  songTitle?: string;
  tracks?: MusicTrack[];
  currentTrackId?: string;
  onClose: () => void;
  onNextTrack?: () => void;
  onPreviousTrack?: () => void;
  onSeek: (time: number) => void;
  onTrackSelect?: (trackId: string) => void;
  onTogglePlayback: () => void;
};

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
}

export default function LyricsPanel({
  activeLyricIndex,
  artworkSrc = TEMPLATE_DEFAULTS.posterSrc,
  currentTime,
  duration,
  isOpen,
  isPlaying,
  lines,
  onClose,
  onNextTrack,
  onPreviousTrack,
  onSeek,
  onTrackSelect,
  onTogglePlayback,
  songMeta = TEMPLATE_DEFAULTS.musicMeta,
  songTitle = TEMPLATE_DEFAULTS.musicTitle,
  tracks = [],
  currentTrackId,
}: LyricsPanelProps) {
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const touchStartY = useRef<number | null>(null);
  const progress = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;
  const selectedTrack = tracks.find((track) => track.id === currentTrackId);
  const hasAudio = Boolean(selectedTrack?.audioSrc);
  const activeLine = useMemo(() => {
    if (lines.length === 0) return "등록된 가사가 아직 없어요.";
    for (let index = activeLyricIndex; index >= 0; index -= 1) {
      const line = lines[index];
      if (line && !line.tag) return line.text;
    }
    return "우리의 음악이 흐르고 있어요";
  }, [activeLyricIndex, lines]);
  const lyricStack = useMemo(() => {
    if (lines.length === 0) {
      return [{ index: -1, text: "등록된 가사가 아직 없어요.", role: "active", distance: 0 }];
    }

    const findPrevious = (from: number) => {
      for (let index = from; index >= 0; index -= 1) {
        if (lines[index] && !lines[index].tag) return index;
      }
      return -1;
    };
    const findNext = (from: number) => {
      for (let index = from; index < lines.length; index += 1) {
        if (lines[index] && !lines[index].tag) return index;
      }
      return -1;
    };

    const currentIndex = findPrevious(activeLyricIndex >= 0 ? activeLyricIndex : 0);
    const previousIndex = currentIndex > 0 ? findPrevious(currentIndex - 1) : -1;
    const nextIndex = findNext(currentIndex + 1);
    const nextSecondIndex = nextIndex >= 0 ? findNext(nextIndex + 1) : -1;

    return [
      previousIndex >= 0 ? { index: previousIndex, text: lines[previousIndex].text, role: "previous", distance: 1 } : null,
      { index: currentIndex, text: activeLine, role: "active", distance: 0 },
      nextIndex >= 0 ? { index: nextIndex, text: lines[nextIndex].text, role: "next", distance: 1 } : null,
      nextSecondIndex >= 0 ? { index: nextSecondIndex, text: lines[nextSecondIndex].text, role: "next2", distance: 2 } : null,
    ].filter((line): line is { index: number; text: string; role: string; distance: number } => Boolean(line));
  }, [activeLine, activeLyricIndex, lines]);

  useEffect(() => {
    if (!isOpen) return;
    sheetRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    document.body.classList.toggle("lyrics-open", isOpen);
    return () => document.body.classList.remove("lyrics-open");
  }, [isOpen]);

  return (
    <div className={`lyrics${isOpen ? " show" : ""}`} id="lyricsPanel" aria-hidden={isOpen ? "false" : "true"} data-react-render="true">
      <div className="lyrics__backdrop" onClick={onClose} />
      <div
        ref={sheetRef}
        className="lyrics__sheet"
        role="dialog"
        aria-modal="true"
        aria-label="시네마틱 가사 보기"
        tabIndex={-1}
        onTouchStart={(event) => {
          touchStartY.current = event.touches[0]?.clientY ?? null;
        }}
        onTouchEnd={(event) => {
          if (touchStartY.current === null) return;
          const delta = (event.changedTouches[0]?.clientY ?? 0) - touchStartY.current;
          touchStartY.current = null;
          if (delta > 80) onClose();
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
        }}
      >
        <div className="lyrics__ambient" style={{ backgroundImage: `url("${artworkSrc}")` }} aria-hidden="true" />
        <div className="lyrics__veil" aria-hidden="true" />

        <div className="lyrics__topbar">
          <button className="lyrics__close" id="lyricsClose" type="button" aria-label="가사 닫기" onClick={onClose}>×</button>
        </div>

        <div className="lyrics__content">
          <section className="lyrics__topZone">
            <div className="lyrics__artWrap" aria-label="앨범 이미지">
              <img className="lyrics__art" src={artworkSrc} alt="" loading="eager" decoding="async" />
              <div className="lyrics__pulse" aria-hidden="true" />
            </div>
            <div className="lyrics__header">
              <div>
                <div className="lyrics__song">{songTitle}</div>
                <div className="lyrics__meta">{songMeta}</div>
              </div>
              <button
                className="lyrics__play"
                type="button"
                aria-label={isPlaying ? "음악 일시정지" : "음악 재생"}
                data-state={isPlaying ? "playing" : "paused"}
                disabled={!hasAudio}
                onClick={onTogglePlayback}
              />
            </div>
            {!hasAudio ? <div className="lyrics__audioWarning">음악 파일이 아직 등록되지 않았어요.</div> : null}
          </section>

          <section className="lyrics__focus">
            <div className="lyrics__stack" aria-live="polite">
              {lyricStack.map((line) => (
                <div
                  key={`${line.index}-${line.role}`}
                  className={`lyrics__stackLine lyrics__stackLine--${line.role}`}
                  data-distance={line.distance}
                >
                  {line.text}
                </div>
              ))}
            </div>
          </section>

          <section className="lyrics__bottomZone">
            <div className={`lyrics__albumCarousel${tracks.length <= 1 ? " lyrics__albumCarousel--single" : ""}`} aria-label="음악 앨범 선택">
              <div className="lyrics__albumTimeline" aria-hidden="true" />
              {tracks.length > 1 ? <button className="lyrics__albumNav" type="button" aria-label="이전 곡" onClick={onPreviousTrack}>‹</button> : null}
              <div className="lyrics__albums">
                {tracks.map((track) => (
                  <button
                    key={track.id}
                    className={`lyrics__albumCard${track.id === currentTrackId ? " lyrics__albumCard--active" : ""}`}
                    type="button"
                    style={{ "--track-color": track.themeColor || "#f59ac4" } as CSSProperties}
                    onClick={() => onTrackSelect?.(track.id)}
                  >
                    <span className="lyrics__albumArtWrap">
                      <img className="lyrics__albumArt" src={track.artworkSrc || artworkSrc} alt="" loading="lazy" decoding="async" />
                      <span className={`lyrics__albumPlay${track.audioSrc ? "" : " lyrics__albumPlay--disabled"}`} aria-hidden="true" />
                    </span>
                    <span className="lyrics__albumTitle">{track.title}</span>
                  </button>
                ))}
              </div>
              {tracks.length > 1 ? <button className="lyrics__albumNav" type="button" aria-label="다음 곡" onClick={onNextTrack}>›</button> : null}
            </div>

            <div className="lyrics__seek">
              <input
                className="lyrics__range"
                type="range"
                min="0"
                max={duration || 0}
                step="0.1"
                value={Math.min(currentTime, duration || currentTime)}
                style={{ "--lyrics-progress": `${progress}%` } as CSSProperties}
                aria-label="음악 위치"
                onChange={(event) => onSeek(Number(event.target.value))}
              />
              <div className="lyrics__time">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="lyrics__controlBar" aria-label="music controls">
              <button
                className="lyrics__controlBtn lyrics__controlBtn--side"
                type="button"
                aria-label="previous track"
                disabled={tracks.length <= 1}
                onClick={onPreviousTrack}
              >
                <span aria-hidden="true">‹</span>
              </button>
              <button
                className="lyrics__controlBtn lyrics__controlBtn--main"
                type="button"
                aria-label={isPlaying ? "pause" : "play"}
                data-state={isPlaying ? "playing" : "paused"}
                disabled={!hasAudio}
                onClick={onTogglePlayback}
              />
              <button
                className="lyrics__controlBtn lyrics__controlBtn--side"
                type="button"
                aria-label="next track"
                disabled={tracks.length <= 1}
                onClick={onNextTrack}
              >
                <span aria-hidden="true">›</span>
              </button>
              <button
                className="lyrics__controlBtn lyrics__controlBtn--playlist"
                type="button"
                aria-label="playlist"
                disabled
              >
                <span aria-hidden="true">≡</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
