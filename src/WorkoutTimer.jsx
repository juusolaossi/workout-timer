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

  // Redraw the clock on every animation frame while running. The displayed
  // time is still derived from timestamps, so a dropped frame never makes
  // the timer drift. requestAnimationFrame keeps the progress ring smooth.
  useEffect(() => {
    if (!ticking) return;

    let frameId;
    const tick = (timestamp) => {
      setNow(timestamp);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
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

  // Keep the screen awake for the entire active workout, including the
  // GET READY countdown, pauses, and the finished screen. It is released
  // when the workout is stopped/done. The setup screen remains idle.
  useWakeLock(settings.keepScreenAwake && run !== null);

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
