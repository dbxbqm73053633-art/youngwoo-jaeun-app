import { useEffect, useRef, useState } from "react";
import type { initLegacyApp as InitLegacyApp } from "./legacy/index.js";

type LegacyModule = {
  initLegacyApp?: typeof InitLegacyApp;
};

export default function App() {
  const [markup, setMarkup] = useState("");
  const initRef = useRef(false);
  const baseUrl = import.meta.env.BASE_URL;

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
          setMarkup(html.replace(/<script[\s\S]*?<\/script>/gi, "").trim());
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
    if (!markup || initRef.current) {
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
  }, [markup]);

  return (
    <div
      className="legacy-host"
      dangerouslySetInnerHTML={{ __html: markup || '<div class="appBoot">앱을 불러오는 중...</div>' }}
    />
  );
}
