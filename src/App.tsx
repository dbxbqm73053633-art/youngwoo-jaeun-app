import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import AlbumScreen from "./features/album/AlbumScreen";
import CalendarScreen from "./features/calendar/CalendarScreen";
import HomeScreen from "./features/home/HomeScreen";
import MemoScreen from "./features/memo/MemoScreen";
import MusicScreen from "./features/music/MusicScreen";
import SettingsScreen from "./features/settings/SettingsScreen";
import type { initLegacyApp as InitLegacyApp } from "./legacy/index.js";

type LegacyModule = {
  initLegacyApp?: typeof InitLegacyApp;
};

const HOME_PORTAL_ID = "react-home-root";
const ALBUM_PORTAL_ID = "react-album-root";
const MEMO_PORTAL_ID = "react-memo-root";
const CALENDAR_PORTAL_ID = "react-calendar-root";
const MUSIC_PORTAL_ID = "react-music-root";
const SETTINGS_PORTAL_ID = "react-settings-root";

function prepareLegacyMarkup(html: string) {
  const template = document.createElement("template");
  template.innerHTML = html.replace(/<script[\s\S]*?<\/script>/gi, "").trim();

  const legacyHome = template.content.querySelector("#tab-home");
  if (legacyHome) {
    const homeMount = document.createElement("div");
    homeMount.id = HOME_PORTAL_ID;
    homeMount.setAttribute("data-react-home", "true");
    legacyHome.replaceWith(homeMount);
  }

  const legacyAlbum = template.content.querySelector("#tab-photos");
  if (legacyAlbum) {
    const albumMount = document.createElement("div");
    albumMount.id = ALBUM_PORTAL_ID;
    albumMount.setAttribute("data-react-album", "true");
    legacyAlbum.replaceWith(albumMount);
  }

  const legacyMemo = template.content.querySelector("#tab-memo");
  if (legacyMemo) {
    const memoMount = document.createElement("div");
    memoMount.id = MEMO_PORTAL_ID;
    memoMount.setAttribute("data-react-memo", "true");
    legacyMemo.replaceWith(memoMount);
  }

  const legacyCalendar = template.content.querySelector("#tab-diary");
  if (legacyCalendar) {
    const calendarMount = document.createElement("div");
    calendarMount.id = CALENDAR_PORTAL_ID;
    calendarMount.setAttribute("data-react-calendar", "true");
    legacyCalendar.replaceWith(calendarMount);
  }

  const legacyMusic = template.content.querySelector(".music");
  const legacyLyrics = template.content.querySelector("#lyricsPanel");
  const legacyAudio = template.content.querySelector("#bgm");
  if (legacyMusic) {
    const musicMount = document.createElement("div");
    musicMount.id = MUSIC_PORTAL_ID;
    musicMount.setAttribute("data-react-music", "true");
    legacyMusic.replaceWith(musicMount);
    legacyLyrics?.remove();
    legacyAudio?.remove();
  }

  const legacySettings = template.content.querySelector("#tab-admin");
  if (legacySettings) {
    const settingsMount = document.createElement("div");
    settingsMount.id = SETTINGS_PORTAL_ID;
    settingsMount.setAttribute("data-react-settings", "true");
    legacySettings.replaceWith(settingsMount);
  }

  return {
    html: template.innerHTML,
    hasReactHomeMount: Boolean(legacyHome),
    hasReactAlbumMount: Boolean(legacyAlbum),
    hasReactMemoMount: Boolean(legacyMemo),
    hasReactCalendarMount: Boolean(legacyCalendar),
    hasReactMusicMount: Boolean(legacyMusic),
    hasReactSettingsMount: Boolean(legacySettings),
  };
}

export default function App() {
  const [markup, setMarkup] = useState("");
  const [hasReactHomeMount, setHasReactHomeMount] = useState(false);
  const [hasReactAlbumMount, setHasReactAlbumMount] = useState(false);
  const [hasReactMemoMount, setHasReactMemoMount] = useState(false);
  const [hasReactCalendarMount, setHasReactCalendarMount] = useState(false);
  const [hasReactMusicMount, setHasReactMusicMount] = useState(false);
  const [hasReactSettingsMount, setHasReactSettingsMount] = useState(false);
  const [homeMount, setHomeMount] = useState<HTMLElement | null>(null);
  const [albumMount, setAlbumMount] = useState<HTMLElement | null>(null);
  const [memoMount, setMemoMount] = useState<HTMLElement | null>(null);
  const [calendarMount, setCalendarMount] = useState<HTMLElement | null>(null);
  const [musicMount, setMusicMount] = useState<HTMLElement | null>(null);
  const [settingsMount, setSettingsMount] = useState<HTMLElement | null>(null);
  const [homeReady, setHomeReady] = useState(false);
  const [albumReady, setAlbumReady] = useState(false);
  const [memoReady, setMemoReady] = useState(false);
  const [calendarReady, setCalendarReady] = useState(false);
  const [musicReady, setMusicReady] = useState(false);
  const [settingsReady, setSettingsReady] = useState(false);
  const initRef = useRef(false);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const baseUrl = import.meta.env.BASE_URL;
  const handleHomeReady = useCallback(() => {
    setHomeReady(true);
  }, []);
  const handleAlbumReady = useCallback(() => {
    setAlbumReady(true);
  }, []);
  const handleMemoReady = useCallback(() => {
    setMemoReady(true);
  }, []);
  const handleCalendarReady = useCallback(() => {
    setCalendarReady(true);
  }, []);
  const handleMusicReady = useCallback(() => {
    setMusicReady(true);
  }, []);
  const handleSettingsReady = useCallback(() => {
    setSettingsReady(true);
  }, []);

  useEffect(() => {
    let active = true;

    fetch(`${baseUrl}legacy-app.html`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load legacy markup: ${response.status}`);
        }
        return response.text();
      })
      .then((html) => {
        if (active) {
          const prepared = prepareLegacyMarkup(html);
          setMarkup(prepared.html);
          setHasReactHomeMount(prepared.hasReactHomeMount);
          setHasReactAlbumMount(prepared.hasReactAlbumMount);
          setHasReactMemoMount(prepared.hasReactMemoMount);
          setHasReactCalendarMount(prepared.hasReactCalendarMount);
          setHasReactMusicMount(prepared.hasReactMusicMount);
          setHasReactSettingsMount(prepared.hasReactSettingsMount);
          setHomeReady(!prepared.hasReactHomeMount);
          setAlbumReady(!prepared.hasReactAlbumMount);
          setMemoReady(!prepared.hasReactMemoMount);
          setCalendarReady(!prepared.hasReactCalendarMount);
          setMusicReady(!prepared.hasReactMusicMount);
          setSettingsReady(!prepared.hasReactSettingsMount);
        }
      })
      .catch((error) => {
        console.error(error);
      });

    return () => {
      active = false;
    };
  }, [baseUrl]);

  useEffect(() => {
    if (!markup || !hasReactHomeMount) {
      setHomeMount(null);
      return;
    }

    setHomeMount(hostRef.current?.querySelector<HTMLElement>(`#${HOME_PORTAL_ID}`) ?? null);
  }, [markup, hasReactHomeMount]);

  useEffect(() => {
    if (!markup || !hasReactAlbumMount) {
      setAlbumMount(null);
      return;
    }

    setAlbumMount(hostRef.current?.querySelector<HTMLElement>(`#${ALBUM_PORTAL_ID}`) ?? null);
  }, [markup, hasReactAlbumMount]);

  useEffect(() => {
    if (!markup || !hasReactMemoMount) {
      setMemoMount(null);
      return;
    }

    setMemoMount(hostRef.current?.querySelector<HTMLElement>(`#${MEMO_PORTAL_ID}`) ?? null);
  }, [markup, hasReactMemoMount]);

  useEffect(() => {
    if (!markup || !hasReactCalendarMount) {
      setCalendarMount(null);
      return;
    }

    setCalendarMount(hostRef.current?.querySelector<HTMLElement>(`#${CALENDAR_PORTAL_ID}`) ?? null);
  }, [markup, hasReactCalendarMount]);

  useEffect(() => {
    if (!markup || !hasReactMusicMount) {
      setMusicMount(null);
      return;
    }

    setMusicMount(hostRef.current?.querySelector<HTMLElement>(`#${MUSIC_PORTAL_ID}`) ?? null);
  }, [markup, hasReactMusicMount]);

  useEffect(() => {
    if (!markup || !hasReactSettingsMount) {
      setSettingsMount(null);
      return;
    }

    setSettingsMount(hostRef.current?.querySelector<HTMLElement>(`#${SETTINGS_PORTAL_ID}`) ?? null);
  }, [markup, hasReactSettingsMount]);

  useEffect(() => {
    if (!markup || initRef.current || !homeReady || !albumReady || !memoReady || !calendarReady || !musicReady || !settingsReady) {
      return;
    }

    let active = true;

    import("./legacy/index.js")
      .then((module) => {
        if (!active) {
          return;
        }
        const legacyModule = module as LegacyModule;
        legacyModule.initLegacyApp?.();
        initRef.current = true;
      })
      .catch((error) => {
        console.error(error);
      });

    return () => {
      active = false;
    };
  }, [markup, homeReady, albumReady, memoReady, calendarReady, musicReady, settingsReady]);

  return (
    <>
      <div
        ref={hostRef}
        className="legacy-host"
        dangerouslySetInnerHTML={{ __html: markup || '<div class="appBoot">앱을 불러오는 중...</div>' }}
      />
      {/* Remaining non-migrated screens are still owned by the legacy markup/runtime. */}
      {homeMount ? createPortal(<HomeScreen onReady={handleHomeReady} />, homeMount) : null}
      {albumMount ? createPortal(<AlbumScreen onReady={handleAlbumReady} />, albumMount) : null}
      {memoMount ? createPortal(<MemoScreen onReady={handleMemoReady} />, memoMount) : null}
      {calendarMount ? createPortal(<CalendarScreen onReady={handleCalendarReady} />, calendarMount) : null}
      {musicMount ? createPortal(<MusicScreen onReady={handleMusicReady} />, musicMount) : null}
      {settingsMount ? createPortal(<SettingsScreen onReady={handleSettingsReady} />, settingsMount) : null}
    </>
  );
}
