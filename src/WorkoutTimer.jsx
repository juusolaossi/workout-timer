import { useEffect, useRef, useState } from "react";
import { createBeeper } from "./audio/beeper";
import SetupScreen from "./components/SetupScreen";
import TimerScreen from "./components/TimerScreen";
import { useStoredSettings } from "./hooks/useStoredSettings";
import { useWakeLock } from "./hooks/useWakeLock";
import { elapsedMs, getProgress, isPaused, pauseRun, resumeRun, startRun, timelineToClock } from "./timer/engine";

export default function WorkoutTimer() {
  const [settings, setSettings] = useStoredSettings();
  // The current workout, or null when idle. See timer/engine.js.
  const [run, setRun] = useState(null);
  const [now, setNow] = useState(() => performance.now());
  const beeperRef = useRef(null);
  if (!beeperRef.current) beeperRef.current = createBeeper();

  const progress = run ? getProgress(run.plan, elapsedMs(run, now)) : null;
  const paused = run ? isPaused(run) : false;
  const finished = progress?.finished ?? false;
  const ticking = run !== null && !paused && !finished;

  // Redraw the clock while running. The time shown is always computed from
  // timestamps, so a slow or skipped tick never makes the timer drift.
  useEffect(() => {
    if (!ticking) return;
    const id = setInterval(() => setNow(performance.now()), 100);
    return () => clearInterval(id);
  }, [ticking]);

  // Schedule every remaining beep of the workout whenever it starts or resumes.
  // Pausing or stopping cancels them. When audio comes back after an
  // interruption (phone call, switching apps), the beeps are scheduled again.
  useEffect(() => {
    const beeper = beeperRef.current;
    if (!run || isPaused(run)) return;
    let cancelled = false;

    function scheduleBeeps() {
      beeper.unlock().then((canPlay) => {
        if (cancelled || !canPlay) return;
        beeper.schedule(run.beeps.map((beep) => ({ at: timelineToClock(run, beep.atMs), kind: beep.kind })));
      });
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") scheduleBeeps();
    }

    scheduleBeeps();
    const stopListening = beeper.onResumed(scheduleBeeps);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      cancelled = true;
      stopListening();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      beeper.cancel();
    };
  }, [run]);

  useWakeLock(settings.keepScreenAwake && ticking);

  function start() {
    // Audio may only be started from a tap, so unlock it here.
    beeperRef.current.unlock();
    const startedAt = performance.now();
    setNow(startedAt);
    setRun(startRun(settings, startedAt));
  }

  function togglePause() {
    if (!run) return;
    const at = performance.now();
    if (paused) beeperRef.current.unlock();
    setNow(at);
    setRun(paused ? resumeRun(run, at) : pauseRun(run, at));
  }

  function reset() {
    setRun(null);
  }

  if (!run) return <SetupScreen settings={settings} onChange={setSettings} onStart={start} />;

  return (
    <TimerScreen
      progress={progress}
      paused={paused}
      totalSets={run.plan.sets}
      onTogglePause={togglePause}
      onStop={reset}
      onDone={reset}
    />
  );
}
