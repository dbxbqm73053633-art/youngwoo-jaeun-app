const CACHE_NAME = "ywjy-shell-v11";

const SHELL = [
  "./",
  "./index.html",
  "./legacy-app.html",
  "./css/index.css",
  "./js/index.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./images/영우재은.png",
  "./images/영재.mp4",
  "./music/재은아사랑해.mp3"
];

// install: 앱 셸 캐시
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)).catch(() => {})
  );
});

// activate: 오래된 캐시 정리
self.addEventListener("activate", (event) => {
  self.clients.claim();
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k === CACHE_NAME ? null : caches.delete(k))))
    )
  );
});

// fetch: 셸은 cache-first, 그 외는 network-first + fallback
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 같은 오리진만 다룸
  if (url.origin !== location.origin) return;

  // navigation은 offline fallback
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("./index.html"))
    );
    return;
  }

  // 셸 자원은 캐시 우선
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        // 성공 응답이면 캐시에 저장
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => cached);
    })
  );
});
