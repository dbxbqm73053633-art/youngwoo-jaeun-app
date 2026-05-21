export function updateViewportHeightVar() {
  if (typeof window === "undefined") return;
  const height = window.visualViewport?.height || window.innerHeight;
  document.documentElement.style.setProperty("--app-viewport-height", `${height}px`);
}

export function recoverViewportAfterFullscreen() {
  if (typeof window === "undefined") return;

  const clearLocks = () => {
    document.body.classList.remove("cinematic-intro-open", "intro-open");

    const fullscreenLocked = document.body.classList.contains("photo-modal-open") || document.body.classList.contains("replay-open");
    if (!fullscreenLocked) {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }

    updateViewportHeightVar();
    window.dispatchEvent(new Event("resize"));
  };

  clearLocks();
  window.requestAnimationFrame(() => {
    clearLocks();
    window.requestAnimationFrame(clearLocks);
  });
}
