import type { RefObject } from "react";

type MusicPlayerProps = {
  audioRef: RefObject<HTMLAudioElement>;
  onPause: () => void;
  onPlay: () => void;
  onSync: (currentTime: number) => void;
};

export default function MusicPlayer({ audioRef, onPause, onPlay, onSync }: MusicPlayerProps) {
  return (
    <audio
      id="bgm"
      preload="auto"
      loop
      ref={audioRef}
      data-react-render="true"
      onPause={onPause}
      onPlay={(event) => {
        onPlay();
        onSync(event.currentTarget.currentTime || 0);
      }}
      onSeeked={(event) => onSync(event.currentTarget.currentTime || 0)}
      onTimeUpdate={(event) => onSync(event.currentTarget.currentTime || 0)}
    >
      <source src="./music/재은아사랑해.mp3" type="audio/mpeg" />
    </audio>
  );
}
