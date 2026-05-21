import type { CSSProperties } from "react";
import { TEMPLATE_DEFAULTS } from "../../constants/templateConfig";

type MusicMiniBarProps = {
  artworkSrc?: string;
  currentLyric: string;
  currentTime: number;
  disabled?: boolean;
  duration: number;
  isPlaying: boolean;
  subtitle?: string;
  trackPosition?: string;
  title?: string;
  onNextTrack?: () => void;
  onPreviousTrack?: () => void;
  onSeek: (time: number) => void;
  onToggleLyrics: () => void;
  onTogglePlayback: () => void;
};

export default function MusicMiniBar({
  artworkSrc,
  currentLyric,
  currentTime,
  disabled = false,
  duration,
  isPlaying,
  subtitle = TEMPLATE_DEFAULTS.musicMeta,
  trackPosition,
  title = TEMPLATE_DEFAULTS.musicTitle,
  onNextTrack,
  onPreviousTrack,
  onSeek,
  onToggleLyrics,
  onTogglePlayback,
}: MusicMiniBarProps) {
  const progress = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  return (
    <div className={`music${isPlaying ? " music--playing" : ""}`} aria-label="배경음악 컨트롤">
      <div className="music__main">
        {artworkSrc ? <img className="music__artwork" src={artworkSrc} alt="" loading="lazy" decoding="async" /> : null}

        <div className="music__meta">
          <div className="music__title" id="musicTitle">{title}</div>
          <div className="music__sub">
            <span>{subtitle}</span>
            {trackPosition ? <span className="music__count">{trackPosition}</span> : null}
          </div>
          {currentLyric ? <div className="music__centerLyric" id="musicLyricNow">{currentLyric}</div> : null}
        </div>

        <div className="music__controls">
          <button
            className="music__skip music__skip--prev"
            type="button"
            aria-label="이전 곡"
            disabled={!onPreviousTrack}
            onClick={onPreviousTrack}
          >
            ‹
          </button>
          <button
            className="music__btn"
            id="musicToggle"
            type="button"
            aria-label={isPlaying ? "배경음악 일시정지" : "배경음악 재생"}
            data-react-render="true"
            data-state={isPlaying ? "playing" : "paused"}
            disabled={disabled}
            onClick={onTogglePlayback}
          />
          <button
            className="music__skip music__skip--next"
            type="button"
            aria-label="다음 곡"
            disabled={!onNextTrack}
            onClick={onNextTrack}
          >
            ›
          </button>

          <button className="music__lyricsBtn" id="lyricsToggle" type="button" onClick={onToggleLyrics}>
            가사
          </button>
        </div>
      </div>

      <input
        className="music__progress"
        type="range"
        min="0"
        max={duration || 0}
        step="0.1"
        value={Math.min(currentTime, duration || currentTime)}
        style={{ "--music-progress": `${progress}%` } as CSSProperties}
        aria-label="음악 재생 위치"
        disabled={!duration}
        onChange={(event) => onSeek(Number(event.target.value))}
      />
    </div>
  );
}
