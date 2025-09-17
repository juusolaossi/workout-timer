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
  const [workSec, setWorkSec] = useState(20);
  const [restSec, setRestSec] = useState(40);
  const [rounds, setRounds] = useState(5);

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

  useEffect(() => {
    if (!isRunning || isPaused) return;
    const id = setInterval(() => {
      const now = performance.now();
      const delta = now - (lastTickRef.current || now);
      lastTickRef.current = now;

      setRemainingMs((prev) => {
        const next = Math.max(0, prev - delta);
        const sec = Math.ceil(next / 1000);

        if (sec <= 3 && sec !== lastBeepSecondRef.current) {
          lastBeepSecondRef.current = sec;
          if (sec > 0) {
            audio.playBeep({ type: "short", frequency: 880 });
          } else if (sec === 0) {
            audio.playBeep({ type: "long", frequency: 1200 });
          }
        }

        if (next <= 0) {
          setTimeout(() => handlePhaseEnd(), 100);
        }

        return next;
      });
    }, 200);
    return () => clearInterval(id);
  }, [isRunning, isPaused, phase]);

  function startTimer() {
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
        stopTimer();
      } else {
        setCurrentRound((c) => c + 1);
        setPhase("work");
        setRemainingMs(s.workSec * 1000);
      }
    } else if (phase === "rest") {
      if (currentRound >= s.rounds) {
        stopTimer();
      } else {
        setCurrentRound((c) => c + 1);
        setPhase("work");
        setRemainingMs(s.workSec * 1000);
      }
    }
  }

  function stopTimer() {
    setIsRunning(false);
    setIsPaused(false);
    setPhase("idle");
    setRemainingMs(0);
    setCurrentRound(0);
    lastBeepSecondRef.current = null;
  }

  function togglePause() {
    if (!isRunning) return;
    if (isPaused) {
      setIsPaused(false);
      lastTickRef.current = performance.now();
    } else {
      setIsPaused(true);
    }
  }

  function formatMs(ms) {
    const total = Math.ceil(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  const totalPhaseTime =
    phase === "work"
      ? workSec * 1000
      : phase === "rest"
      ? restSec * 1000
      : 1;

  const progress = 1 - remainingMs / totalPhaseTime;

  const bgClass = isPaused
    ? "bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500"
    : phase === "work"
    ? "bg-gradient-to-br from-green-400 via-green-500 to-green-600"
    : phase === "rest"
    ? "bg-gradient-to-br from-yellow-200 via-yellow-400 to-orange-500"
    : "bg-gradient-to-br from-white via-gray-100 to-gray-200";

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 ${bgClass}`}
      onClick={togglePause}
    >
      <div className="w-full max-w-xs">
        <CircularProgressbar
          value={progress * 100}
          text={formatMs(remainingMs)}
          styles={buildStyles({
            pathColor:
              isPaused
                ? "#6b7280" // gray for paused
                : phase === "work"
                ? "#16a34a" // green
                : phase === "rest"
                ? "#f59e0b" // yellow/orange
                : "#9ca3af", // gray for idle
            textColor: "#000",
            trailColor: "rgba(255,255,255,0.5)",
            strokeLinecap: "round",
            pathTransition: progress === 0 ? "none" : "stroke-dashoffset 0.5s ease 0s",
          })}
        />
        <div className="text-center text-lg mt-4 capitalize">
          {isPaused ? "Paused" : phase}
        </div>
        {isRunning && (
          <div className="text-center text-sm mb-4">
            Round {currentRound} / {rounds}
          </div>
        )}
        <div className="flex gap-2 mt-4">
          {!isRunning ? (
            <button
              onClick={startTimer}
              className="flex-1 py-3 bg-green-500 text-white rounded-lg font-semibold"
            >
              Start
            </button>
          ) : (
            <button
              onClick={stopTimer}
              className="flex-1 py-3 bg-red-500 text-white rounded-lg font-semibold"
            >
              Stop
            </button>
          )}
        </div>

        {!isRunning && (
          <div className="grid grid-cols-3 gap-2 mt-4">
            <label>
              <div className="text-xs">Work (s)</div>
              <input
                type="number"
                min={1}
                value={workSec === "" ? "" : workSec}
                onChange={(e) => setWorkSec(e.target.value === "" ? "" : +e.target.value)}
                onBlur={(e) => {
                  if (e.target.value === "" || +e.target.value < 1) {
                    setWorkSec(1); // fallback minimum
                  }
                }}
                className="w-full border rounded p-2"
              />
            </label>
            <label>
              <div className="text-xs">Rest (s)</div>
              <input
                type="number"
                min={0}
                value={restSec === "" ? "" : restSec}
                onChange={(e) => setRestSec(e.target.value === "" ? "" : +e.target.value)}
                onBlur={(e) => {
                  if (e.target.value === "" || +e.target.value < 1) {
                    setRestSec(1); // fallback minimum
                  }
                }}
                className="w-full border rounded p-2"
              />
            </label>
            <label>
              <div className="text-xs">Rounds</div>
              <input
                type="number"
                min={1}
                value={rounds === "" ? "" : rounds}
                onChange={(e) => setRounds(e.target.value === "" ? "" : +e.target.value)}
                onBlur={(e) => {
                  if (e.target.value === "" || +e.target.value < 1) {
                    setRounds(1); // fallback minimum
                  }
                }}
                className="w-full border rounded p-2"
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
