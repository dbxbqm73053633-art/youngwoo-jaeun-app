import { TEMPLATE_DEFAULTS } from "../constants/templateConfig";
import { lyrics } from "./lyrics";
import type { MusicTrack } from "../services/musicService";
import type { RoomConfig } from "../types";

export function buildDefaultMusicTracks(couple: RoomConfig & { musicTracks?: MusicTrack[] }): MusicTrack[] {
  const configuredTracks = Array.isArray(couple.musicTracks) ? couple.musicTracks : [];
  const fallbackTrack: MusicTrack = {
    id: "youngwoo-jaeun-love",
    title: couple.musicTitle || TEMPLATE_DEFAULTS.musicTitle,
    subtitle: couple.musicMeta || TEMPLATE_DEFAULTS.musicMeta,
    audioSrc: couple.musicSrc || TEMPLATE_DEFAULTS.musicSrc,
    artworkSrc: couple.posterSrc || TEMPLATE_DEFAULTS.posterSrc,
    lyrics,
    themeColor: "#f59ac4",
    lyricOffsetMs: 0,
  };
  const jaeunByMySideTrack: MusicTrack = {
    id: "jaeun-by-my-side",
    title: "재은아 내 곁에",
    subtitle: "영우가 재은이에게",
    audioSrc: "/music/jaeun-by-my-side.mp3",
    artworkSrc: "/images/jaeun-by-my-side-cover.png",
    lyrics: [],
    lyricsSrc: "/lyrics/jaeun-by-my-side.lrc",
    themeColor: "#9bbcff",
    lyricOffsetMs: 0,
  };
  const jjj4Track: MusicTrack = {
    id: "jjj4",
    title: "재은아 사랑해",
    subtitle: "영우가 재은이에게",
    audioSrc: "/music/jjj4.mp3",
    artworkSrc: "/images/jjj4.png",
    lyrics: [],
    lyricsSrc: "/lyrics/jjj4.lrc",
    themeColor: "#f7a6c8",
    lyricOffsetMs: 0,
  };

  if (configuredTracks.length === 0) return [fallbackTrack, jaeunByMySideTrack, jjj4Track];

  return configuredTracks.map((track, index) => ({
    ...track,
    id: track.id || `track-${index + 1}`,
    title: track.title || fallbackTrack.title,
    subtitle: track.subtitle || fallbackTrack.subtitle,
    artworkSrc: track.artworkSrc || fallbackTrack.artworkSrc,
    lyrics: Array.isArray(track.lyrics) ? track.lyrics : [],
    lyricsSrc: track.lyricsSrc,
    themeColor: track.themeColor || fallbackTrack.themeColor,
    lyricOffsetMs: track.lyricOffsetMs || 0,
    backgroundVideoSrc: track.backgroundVideoSrc,
  }));
}
