import { TEMPLATE_DEFAULTS } from "../../constants/templateConfig";

type MusicMiniBarProps = {
  artworkSrc?: string;
  currentLyric: string;
  disabled?: boolean;
  isPlaying: boolean;
  title?: string;
  onToggleLyrics: () => void;
  onTogglePlayback: () => void;
  onVolumeChange: (volume: number) => void;
  volume: number;
};

export default function MusicMiniBar({
  artworkSrc,
  currentLyric,
  disabled = false,
  isPlaying,
  title = TEMPLATE_DEFAULTS.musicTitle,
  onToggleLyrics,
  onTogglePlayback,
  onVolumeChange,
  volume,
}: MusicMiniBarProps) {
  return (
    <div className="music" aria-label="배경음악 컨트롤">
      {artworkSrc ? <img className="music__artwork" src={artworkSrc} alt="" loading="lazy" decoding="async" /> : null}
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

      <div className="music__title" id="musicTitle">{title}</div>

      <div className="music__centerLyric" id="musicLyricNow">{currentLyric}</div>

      <button className="music__lyricsBtn" id="lyricsToggle" type="button" onClick={onToggleLyrics}>
        ♡ 가사
      </button>

      <input
        className="music__vol"
        id="musicVol"
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={(event) => onVolumeChange(Number(event.target.value))}
      />
    </div>
  );
}
