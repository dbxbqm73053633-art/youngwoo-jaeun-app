import type { RefObject } from "react";
import { TEMPLATE_DEFAULTS } from "../../constants/templateConfig";

type MusicPlayerProps = {
  audioRef: RefObject<HTMLAudioElement>;
  musicSrc?: string;
  onDurationChange?: (duration: number) => void;
  onPause: () => void;
  onPlay: () => void;
  onSync: (currentTime: number) => void;
};

export default function MusicPlayer({ audioRef, musicSrc = TEMPLATE_DEFAULTS.musicSrc, onDurationChange, onPause, onPlay, onSync }: MusicPlayerProps) {
  return (
    <audio
      id="bgm"
      preload="metadata"
      loop
      ref={audioRef}
      data-react-render="true"
      onPause={onPause}
      onLoadedMetadata={(event) => onDurationChange?.(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)}
      onPlay={(event) => {
        onPlay();
        onSync(event.currentTarget.currentTime || 0);
      }}
      onSeeked={(event) => onSync(event.currentTarget.currentTime || 0)}
      onTimeUpdate={(event) => onSync(event.currentTarget.currentTime || 0)}
    >
      {musicSrc ? <source src={musicSrc} type="audio/mpeg" /> : null}
    </audio>
  );
}
