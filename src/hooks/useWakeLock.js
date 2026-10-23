import { useEffect } from "react";

// Keeps the screen on while `active` is true. The browser drops the lock when
// the page is hidden, so it is requested again when the page becomes visible.
export function useWakeLock(active) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let lock = null;
    let requesting = false;
    let cancelled = false;

    async function request() {
      if (cancelled || lock || requesting || document.visibilityState !== "visible") return;
      requesting = true;
      try {
        const newLock = await navigator.wakeLock.request("screen");
        if (cancelled) {
          newLock.release().catch(() => {});
          return;
        }
        lock = newLock;
        newLock.addEventListener("release", () => {
          if (lock === newLock) lock = null;
        });
      } catch (error) {
        console.warn("Screen wake lock could not be enabled:", error);
      } finally {
        requesting = false;
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") request();
    }

    request();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      lock?.release().catch((error) => console.warn("Screen wake lock could not be released:", error));
      lock = null;
    };
  }, [active]);
}
