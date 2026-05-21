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
  volume: number;
  onNextTrack?: () => void;
  onPreviousTrack?: () => void;
  onSeek: (time: number) => void;
  onToggleLyrics: () => void;
  onTogglePlayback: () => void;
  onVolumeChange: (volume: number) => void;
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
  volume,
  onNextTrack,
  onPreviousTrack,
  onSeek,
  onToggleLyrics,
  onTogglePlayback,
  onVolumeChange,
}: MusicMiniBarProps) {
  const progress = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;
  const volumeProgress = Math.min(100, Math.max(0, volume * 100));
  const volumeLabel = volume <= 0 ? "음소거 해제" : "음소거";

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
          />
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
          />

          <button className="music__lyricsBtn" id="lyricsToggle" type="button" onClick={onToggleLyrics}>
            가사
          </button>

          <div className="music__volume" aria-label="음량 조절">
            <button
              className="music__muteBtn"
              type="button"
              aria-label={volumeLabel}
              onClick={() => onVolumeChange(volume <= 0 ? 0.5 : 0)}
            >
              {volume <= 0 ? "×" : "♪"}
            </button>
            <input
              className="music__vol"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              style={{ "--music-volume": `${volumeProgress}%` } as CSSProperties}
              aria-label="음량"
              onChange={(event) => onVolumeChange(Number(event.target.value))}
            />
          </div>
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
