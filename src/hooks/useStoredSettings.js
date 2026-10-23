import { useEffect, useState } from "react";
import { sanitizeSettings } from "../timer/engine";

const STORAGE_KEY = "workout-timer:settings:v1";
const DEFAULTS = { workSec: 15, restSec: 45, sets: 10, keepScreenAwake: true };

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || typeof saved !== "object") return DEFAULTS;
    return {
      ...sanitizeSettings({ ...DEFAULTS, ...saved }),
      keepScreenAwake: typeof saved.keepScreenAwake === "boolean" ? saved.keepScreenAwake : DEFAULTS.keepScreenAwake,
    };
  } catch {
    return DEFAULTS;
  }
}

// The last used settings, remembered in this browser between visits.
export function useStoredSettings() {
  const [settings, setSettings] = useState(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Storage can be unavailable (private mode, blocked site data); the app still works.
    }
  }, [settings]);

  return [settings, setSettings];
}
