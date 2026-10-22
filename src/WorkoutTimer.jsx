import React, { useEffect, useRef, useState } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

function useAudioEngine() {
  const audioCtxRef = useRef(null);
  const gainRef = useRef(null);

  function ensureCtx() {
    if (!audioCtxRef.current) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const gain = ctx.createGain();
      gain.gain.value = 0.5;
      gain.connect(ctx.destination);
      audioCtxRef.current = ctx;
      gainRef.current = gain;
    }
    return { ctx: audioCtxRef.current, gain: gainRef.current };
  }

  function playBeep({ type = "short", frequency = 880 }) {
    const { ctx, gain } = ensureCtx();
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = frequency;
    const nodeGain = ctx.createGain();
    osc.connect(nodeGain);
    nodeGain.connect(gain);
    const now = ctx.currentTime;
    const dur = type === "long" ? 0.6 : 0.15;
    nodeGain.gain.setValueAtTime(0, now);
    nodeGain.gain.linearRampToValueAtTime(0.7, now + 0.01);
    nodeGain.gain.linearRampToValueAtTime(0, now + dur);
    osc.start(now);
    osc.stop(now + dur + 0.05);
  }

  return { playBeep, ensureCtx };
}

export default function WorkoutTimer() {
  const [workSec, setWorkSec] = useState(15);
  const [restSec, setRestSec] = useState(45);
  const [rounds, setRounds] = useState(10);
  const [keepScreenAwake, setKeepScreenAwake] = useState(true);

  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [phase, setPhase] = useState("idle");
  const [currentRound, setCurrentRound] = useState(0);
  const [remainingMs, setRemainingMs] = useState(0);

  const startSettingsRef = useRef({ workSec, restSec, rounds });
  const lastTickRef = useRef(null);
  const lastBeepSecondRef = useRef(null);
  const phaseEndTimeoutRef = useRef(null);
  const wakeLockRef = useRef(null);
  const audio = useAudioEngine();

  useEffect(() => {
    startSettingsRef.current = { workSec, restSec, rounds };
  }, [workSec, restSec, rounds]);

  useEffect(() => {
    if (!isRunning || isPaused || !keepScreenAwake || phase === "finished") return;
    let cancelled = false;

    async function requestWakeLock() {
      if (!("wakeLock" in navigator)) return;
      if (document.visibilityState !== "visible") return;
      if (wakeLockRef.current) return;
      try {
        const wakeLock = await navigator.wakeLock.request("screen");
        if (cancelled) {
          await wakeLock.release();
          return;
        }
        wakeLockRef.current = wakeLock;
        wakeLock.addEventListener("release", () => {
          wakeLockRef.current = null;
        });
      } catch (error) {
        console.warn("Screen wake lock could not be enabled:", error);
      }
    }

    requestWakeLock();
    async function handleVisibilityChange() {
      if (document.visibilityState === "visible") await requestWakeLock();
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isRunning, isPaused, keepScreenAwake, phase]);

  async function releaseWakeLock() {
    if (!wakeLockRef.current) return;
    try {
      await wakeLockRef.current.release();
    } catch (error) {
      console.warn("Screen wake lock could not be released:", error);
    } finally {
      wakeLockRef.current = null;
    }
  }

  useEffect(() => {
    return () => {
      if (phaseEndTimeoutRef.current) clearTimeout(phaseEndTimeoutRef.current);
      releaseWakeLock();
    };
  }, []);

  useEffect(() => {
    if (!isRunning || isPaused) return;
    const id = setInterval(() => {
      const now = performance.now();
      const delta = now - (lastTickRef.current || now);
      lastTickRef.current = now;

      setRemainingMs((prev) => {
        const next = Math.max(0, prev - delta);
        const sec = Math.ceil(next / 1000);

        if (phase === "countdown") {
          if (sec >= 1 && sec <= 3 && sec !== lastBeepSecondRef.current) {
            lastBeepSecondRef.current = sec;
            audio.playBeep({ type: "short", frequency: 880 });
          }
          if (next <= 0 && lastBeepSecondRef.current !== 0) {
            lastBeepSecondRef.current = 0;
            audio.playBeep({ type: "long", frequency: 1200 });
          }
        } else if ((phase === "work" || phase === "rest") && sec <= 3) {
          if (sec !== lastBeepSecondRef.current) {
            lastBeepSecondRef.current = sec;
            if (sec > 0) audio.playBeep({ type: "short", frequency: 880 });
            else audio.playBeep({ type: "long", frequency: 1200 });
          }
        }

        if (next <= 0 && !phaseEndTimeoutRef.current) {
          phaseEndTimeoutRef.current = setTimeout(() => {
            phaseEndTimeoutRef.current = null;
            handlePhaseEnd();
          }, 100);
        }
        return next;
      });
    }, 200);
    return () => clearInterval(id);
  }, [isRunning, isPaused, phase]);

  function startTimer() {
    const s = startSettingsRef.current;
    const safeWorkSec = Math.max(1, Number(s.workSec) || 1);
    const safeRestSec = Math.max(0, Number(s.restSec) || 0);
    const safeRounds = Math.max(1, Number(s.rounds) || 1);
    startSettingsRef.current = { workSec: safeWorkSec, restSec: safeRestSec, rounds: safeRounds };
    setCurrentRound(1);
    setPhase("countdown");
    setRemainingMs(5000);
    setIsRunning(true);
    setIsPaused(false);
    lastTickRef.current = performance.now();
    lastBeepSecondRef.current = null;
    audio.ensureCtx();
  }

  function handlePhaseEnd() {
    const s = startSettingsRef.current;
    lastBeepSecondRef.current = null;
    if (phase === "countdown") {
      setPhase("work");
      setRemainingMs(s.workSec * 1000);
      lastTickRef.current = performance.now();
      return;
    }
    if (phase === "work") {
      if (currentRound >= s.rounds) finishWorkout();
      else if (s.restSec > 0) {
        setPhase("rest");
        setRemainingMs(s.restSec * 1000);
        lastTickRef.current = performance.now();
      } else {
        setCurrentRound((c) => c + 1);
        setPhase("work");
        setRemainingMs(s.workSec * 1000);
        lastTickRef.current = performance.now();
      }
      return;
    }
    if (phase === "rest") {
      setCurrentRound((c) => c + 1);
      setPhase("work");
      setRemainingMs(s.workSec * 1000);
      lastTickRef.current = performance.now();
    }
  }

  function finishWorkout() {
    setIsRunning(false);
    setIsPaused(false);
    setPhase("finished");
    setRemainingMs(0);
    lastBeepSecondRef.current = null;
    releaseWakeLock();
  }

  function resetToDefault() {
    setIsRunning(false);
    setIsPaused(false);
    setPhase("idle");
    setRemainingMs(0);
    setCurrentRound(0);
    lastBeepSecondRef.current = null;
    releaseWakeLock();
  }

  function togglePause() {
    if (!isRunning) return;
    if (isPaused) {
      setIsPaused(false);
      lastTickRef.current = performance.now();
    } else {
      setIsPaused(true);
      releaseWakeLock();
    }
  }

  function formatMs(ms) {
    const total = Math.ceil(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  const isCountdown = phase === "countdown";
  const isFinished = phase === "finished";
  const isIdle = phase === "idle";
  const totalPhaseTime = phase === "work" ? Number(workSec || 1) * 1000 : phase === "rest" ? Number(restSec || 1) * 1000 : isCountdown ? 5000 : 1;
  const progress = isFinished || isIdle ? 0 : Math.min(1, Math.max(0, 1 - remainingMs / totalPhaseTime));
  const setProgress = rounds ? Math.min(100, (Number(currentRound) / Number(rounds)) * 100) : 0;

  const bgClass = isPaused
    ? "bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500"
    : isCountdown
    ? "bg-gradient-to-br from-blue-200 via-blue-300 to-blue-500"
    : isFinished
    ? "bg-gradient-to-br from-green-300 via-green-400 to-green-500"
    : phase === "work"
    ? "bg-gradient-to-br from-green-400 via-green-500 to-green-600"
    : phase === "rest"
    ? "bg-gradient-to-br from-yellow-200 via-yellow-400 to-orange-500"
    : "bg-gradient-to-br from-white via-gray-100 to-gray-200";

  const displayText = isFinished ? "✓" : isCountdown ? String(Math.max(1, Math.ceil(remainingMs / 1000))) : formatMs(remainingMs);
  const phaseLabel = isPaused ? "Paused" : isCountdown ? "Get Ready" : isFinished ? "Workout Complete!" : phase;

  return (
    <div
      className={`fixed inset-0 h-[100dvh] w-full overflow-hidden overscroll-none touch-none flex items-center justify-center p-4 ${bgClass}`}
      style={{ touchAction: "none", WebkitOverflowScrolling: "auto" }}
      onClick={togglePause}
    >
      <div className="w-full max-w-xs">
        <CircularProgressbar
          value={progress * 100}
          text={displayText}
          styles={buildStyles({
            pathColor: isPaused ? "#6b7280" : isCountdown ? "#2563eb" : isFinished ? "#16a34a" : phase === "work" ? "#16a34a" : phase === "rest" ? "#f59e0b" : "#9ca3af",
            textColor: "#000",
            trailColor: "rgba(255,255,255,0.5)",
            strokeLinecap: "round",
            pathTransition: progress === 0 ? "none" : "stroke-dashoffset 0.5s ease 0s",
          })}
        />

        <div className="text-center text-lg mt-4 capitalize font-semibold">{phaseLabel}</div>

        {isRunning && !isCountdown && (
          <div className="mt-3 mb-4">
            <div className="text-center text-xl font-bold tracking-wide">SET {currentRound} <span className="font-normal text-base">OF</span> {rounds}</div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/40">
              <div className="h-full rounded-full bg-white transition-all duration-300" style={{ width: `${setProgress}%` }} />
            </div>
          </div>
        )}

        {isCountdown && <div className="text-center text-sm mb-4 mt-1">Workout starts in {Math.max(1, Math.ceil(remainingMs / 1000))}</div>}

        <div className="flex gap-2 mt-4">
          {isIdle ? (
            <button onClick={startTimer} className="flex-1 py-3 bg-green-500 text-white rounded-lg font-semibold">Start</button>
          ) : isFinished ? (
            <button onClick={resetToDefault} className="flex-1 py-3 bg-green-600 text-white rounded-lg font-semibold">Done</button>
          ) : (
            <button onClick={(e) => { e.stopPropagation(); resetToDefault(); }} className="flex-1 py-3 bg-red-500 text-white rounded-lg font-semibold">Stop</button>
          )}
        </div>

        {isIdle && (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <label><div className="text-xs">Work (s)</div><input type="number" min={1} value={workSec === "" ? "" : workSec} onChange={(e) => setWorkSec(e.target.value === "" ? "" : +e.target.value)} onBlur={(e) => { if (e.target.value === "" || +e.target.value < 1) setWorkSec(1); }} className="w-full border rounded p-2" /></label>
              <label><div className="text-xs">Rest (s)</div><input type="number" min={0} value={restSec === "" ? "" : restSec} onChange={(e) => setRestSec(e.target.value === "" ? "" : +e.target.value)} onBlur={(e) => { if (e.target.value === "" || +e.target.value < 0) setRestSec(0); }} className="w-full border rounded p-2" /></label>
              <label><div className="text-xs">Sets</div><input type="number" min={1} value={rounds === "" ? "" : rounds} onChange={(e) => setRounds(e.target.value === "" ? "" : +e.target.value)} onBlur={(e) => { if (e.target.value === "" || +e.target.value < 1) setRounds(1); }} className="w-full border rounded p-2" /></label>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-white/70 px-3 py-3 text-sm">
              <span>Keep screen awake during workout</span>
              <button type="button" role="switch" aria-checked={keepScreenAwake} aria-label="Keep screen awake during workout" onClick={(e) => { e.stopPropagation(); setKeepScreenAwake((value) => !value); }} className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 ${keepScreenAwake ? "bg-green-500" : "bg-gray-300"}`}>
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${keepScreenAwake ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
