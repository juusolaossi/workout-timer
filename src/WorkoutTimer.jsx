import React, { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "workout-presets-v1";

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

  function setVolume(v) {
    ensureCtx().gain.gain.value = v;
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

  return { setVolume, playBeep, ensureCtx };
}

export default function WorkoutTimer() {
  const [workSec, setWorkSec] = useState(45);
  const [restSec, setRestSec] = useState(15);
  const [rounds, setRounds] = useState(8);

  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [phase, setPhase] = useState("idle");
  const [currentRound, setCurrentRound] = useState(0);
  const [remainingMs, setRemainingMs] = useState(0);

  const startSettingsRef = useRef({ workSec, restSec, rounds });
  const lastTickRef = useRef(null);
  const lastBeepSecondRef = useRef(null);

  const audio = useAudioEngine();

  useEffect(() => {
    startSettingsRef.current = { workSec, restSec, rounds };
  }, [workSec, restSec, rounds]);

  // Timer loop
  useEffect(() => {
    if (!isRunning || isPaused) return;
    const id = setInterval(() => {
      const now = performance.now();
      const delta = now - (lastTickRef.current || now);
      lastTickRef.current = now;

      setRemainingMs((prev) => {
  const next = Math.max(0, prev - delta);

  // Round down to whole seconds
  const sec = Math.ceil(next / 1000);

  if (sec <= 3 && sec !== lastBeepSecondRef.current) {
    lastBeepSecondRef.current = sec;

    if (sec > 0) {
      // short countdown beeps
      audio.playBeep({ type: "short", frequency: 880 });
    } else if (sec === 0) {
      // final higher long beep BEFORE phase transition
      audio.playBeep({ type: "long", frequency: 1200 });
    }
  }

  if (next <= 0) {
    // allow the long beep a tiny moment before switching phase
    setTimeout(() => handlePhaseEnd(), 100);
  }

  return next;
});

    }, 200);
    return () => clearInterval(id);
  }, [isRunning, isPaused, phase]);

  function startTimerFromSettings() {
    const s = startSettingsRef.current;
    setCurrentRound(1);
    setPhase("work");
    setRemainingMs(s.workSec * 1000);
    setIsRunning(true);
    setIsPaused(false);
    lastTickRef.current = performance.now();
    lastBeepSecondRef.current = null;
    audio.ensureCtx();
  }

  function handlePhaseEnd() {
    const s = startSettingsRef.current;
    lastBeepSecondRef.current = null;

    if (phase === "work") {
      if (s.restSec > 0) {
        setPhase("rest");
        setRemainingMs(s.restSec * 1000);
      } else if (currentRound >= s.rounds) {
        finishTimer();
      } else {
        setCurrentRound((c) => c + 1);
        setPhase("work");
        setRemainingMs(s.workSec * 1000);
      }
    } else if (phase === "rest") {
      if (currentRound >= s.rounds) {
        finishTimer();
      } else {
        setCurrentRound((c) => c + 1);
        setPhase("work");
        setRemainingMs(s.workSec * 1000);
      }
    }
  }

  function finishTimer() {
    setIsRunning(false);
    setIsPaused(false);
    setPhase("idle");
    setRemainingMs(0);
    setCurrentRound(0);
  }

  function handleStartPause() {
    if (!isRunning) {
      startTimerFromSettings();
    } else if (isPaused) {
      setIsPaused(false);
      lastTickRef.current = performance.now();
    } else {
      setIsPaused(true);
    }
  }

  function handleReset() {
    setIsRunning(false);
    setIsPaused(false);
    setPhase("idle");
    setRemainingMs(0);
    setCurrentRound(0);
    lastBeepSecondRef.current = null;
  }

  function formatMs(ms) {
    const total = Math.ceil(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  const bgClass = isPaused
    ? "bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500"
    : phase === "work"
    ? "bg-gradient-to-br from-blue-400 via-blue-600 to-indigo-700"
    : phase === "rest"
    ? "bg-gradient-to-br from-yellow-200 via-yellow-400 to-orange-500"
    : "bg-gradient-to-br from-white via-gray-100 to-gray-200";

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${bgClass}`}>
      <div className="w-full max-w-md bg-white/70 backdrop-blur-md rounded-xl p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-4">Workout Timer</h1>
        <div className="text-center text-5xl font-mono mb-2">
          {remainingMs > 0
            ? formatMs(remainingMs)
            : phase === "work"
            ? formatMs(workSec * 1000)
            : phase === "rest"
            ? formatMs(restSec * 1000)
            : "0:00"}
        </div>
        <div className="text-center text-lg mb-2 capitalize">{phase}</div>
        {isRunning && (
          <div className="text-center text-sm mb-4">
            Round {currentRound} / {rounds}
          </div>
        )}
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleStartPause}
            className="flex-1 py-3 bg-green-500 text-white rounded-lg font-semibold"
          >
            {!isRunning ? "Start" : isPaused ? "Resume" : "Pause"}
          </button>
          <button
            onClick={handleReset}
            className="w-24 py-3 bg-red-500 text-white rounded-lg font-semibold"
          >
            Reset
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <label>
            <div className="text-xs">Work (s)</div>
            <input
              type="number"
              min={1}
              value={workSec}
              onChange={(e) => setWorkSec(+e.target.value)}
              className="w-full border rounded p-2"
            />
          </label>
          <label>
            <div className="text-xs">Rest (s)</div>
            <input
              type="number"
              min={0}
              value={restSec}
              onChange={(e) => setRestSec(+e.target.value)}
              className="w-full border rounded p-2"
            />
          </label>
          <label>
            <div className="text-xs">Rounds</div>
            <input
              type="number"
              min={1}
              value={rounds}
              onChange={(e) => setRounds(+e.target.value)}
              className="w-full border rounded p-2"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
