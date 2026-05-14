export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function setupPwaInstall(onPrompt: (event: BeforeInstallPromptEvent | null) => void) {
  const handleBeforeInstall = (event: Event) => {
    const isAndroid = /Android/i.test(navigator.userAgent);
    if (isAndroid) {
      onPrompt(null);
      return;
    }
    event.preventDefault();
    onPrompt(event as BeforeInstallPromptEvent);
  };
  const handleInstalled = () => onPrompt(null);

  window.addEventListener("beforeinstallprompt", handleBeforeInstall);
  window.addEventListener("appinstalled", handleInstalled);

  return () => {
    window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    window.removeEventListener("appinstalled", handleInstalled);
  };
}

export async function registerServiceWorker(onUpdate: (registration: ServiceWorkerRegistration) => void) {
  if (!("serviceWorker" in navigator)) return;
  if (location.hostname === "localhost" || location.hostname.endsWith(".app.github.dev")) {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((reg) => reg.unregister()));
    return;
  }

  const registration = await navigator.serviceWorker.register("./sw.js");
  if (registration.waiting && navigator.serviceWorker.controller) {
    onUpdate(registration);
  }
  registration.addEventListener("updatefound", () => {
    const worker = registration.installing;
    if (!worker) return;
    worker.addEventListener("statechange", () => {
      if (worker.state === "installed" && navigator.serviceWorker.controller) {
        onUpdate(registration);
      }
    });
  });

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    window.location.reload();
  });
}
