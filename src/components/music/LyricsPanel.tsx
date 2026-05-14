import { useEffect, useRef } from "react";
import { TEMPLATE_DEFAULTS } from "../../constants/templateConfig";
import type { LyricTiming } from "../../services/musicService";
import LyricLine from "./LyricLine";

type LyricsPanelProps = {
  activeLyricIndex: number;
  isOpen: boolean;
  lines: LyricTiming[];
  songMeta?: string;
  songTitle?: string;
  onClose: () => void;
};

export default function LyricsPanel({ activeLyricIndex, isOpen, lines, onClose, songMeta = TEMPLATE_DEFAULTS.musicMeta, songTitle = TEMPLATE_DEFAULTS.musicTitle }: LyricsPanelProps) {
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    sheetRef.current?.focus();
    activeLineRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeLyricIndex, isOpen]);

  return (
    <div className={`lyrics${isOpen ? " show" : ""}`} id="lyricsPanel" aria-hidden={isOpen ? "false" : "true"} data-react-render="true">
      <div className="lyrics__backdrop" onClick={onClose} />
      <div
        ref={sheetRef}
        className="lyrics__sheet"
        role="dialog"
        aria-modal="true"
        aria-label="가사 전체 보기"
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
        }}
      >
        <button className="lyrics__close" id="lyricsClose" type="button" aria-label="가사 닫기" onClick={onClose}>×</button>

        <div className="lyrics__header">
          <div className="lyrics__song">{songTitle}</div>
          <div className="lyrics__meta">{songMeta}</div>
        </div>

        <div className="lyrics__body" id="lyricsBody">
          {lines.map((line, index) => (
            <LyricLine
              key={`${line.time}-${index}`}
              ref={index === activeLyricIndex ? activeLineRef : undefined}
              index={index}
              isActive={index === activeLyricIndex}
              isTag={line.tag}
              text={line.text}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
