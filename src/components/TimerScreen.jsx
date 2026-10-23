import { formatTime } from "../timer/engine";
import ProgressRing from "./ProgressRing";

const LOOKS = {
  paused: { bg: "from-gray-300 via-gray-400 to-gray-500", ring: "#6b7280" },
  countdown: { bg: "from-blue-200 via-blue-300 to-blue-500", ring: "#2563eb" },
  work: { bg: "from-green-400 via-green-500 to-green-600", ring: "#16a34a" },
  rest: { bg: "from-yellow-200 via-yellow-400 to-orange-500", ring: "#f59e0b" },
  finished: { bg: "from-green-300 via-green-400 to-green-500", ring: "#16a34a" },
};

// The running/paused/finished screen. Tapping anywhere pauses or resumes.
export default function TimerScreen({ progress, paused, totalSets, onTogglePause, onStop, onDone }) {
  const { finished, phase, index, remainingMs } = progress;
  const isCountdown = phase?.type === "countdown";
  const look = LOOKS[paused ? "paused" : finished ? "finished" : phase.type];
  const ringValue = finished ? 1 : 1 - remainingMs / phase.durationMs;
  const countdownSeconds = Math.max(1, Math.ceil(remainingMs / 1000));

  const label = paused ? "Paused" : finished ? "Workout complete!" : isCountdown ? "Get ready" : phase.type;
  const display = isCountdown ? String(countdownSeconds) : formatTime(remainingMs);

  return (
    <div
      className={`fixed inset-0 flex h-[100dvh] w-full touch-none items-center justify-center overflow-hidden overscroll-none bg-gradient-to-br p-6 ${look.bg}`}
      onClick={finished ? undefined : onTogglePause}
    >
      <div className="flex w-full max-w-xs flex-col items-center">
        <ProgressRing value={ringValue} color={look.ring} phaseKey={index}>
          {finished ? (
            <svg viewBox="0 0 24 24" className="h-28 w-28 text-black" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-label="Done">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          ) : (
            <span className="font-display text-[6.5rem] leading-none tabular-nums text-black">{display}</span>
          )}
        </ProgressRing>

        <div className="mt-4 font-display text-4xl leading-none tracking-wider text-black uppercase">{label}</div>

        {!finished && !isCountdown && (
          <div className="mt-3 w-full">
            <div className="text-center font-display text-3xl tracking-wide text-black">
              Set {phase.set} <span className="text-xl opacity-70">of</span> {totalSets}
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/40">
              <div className="h-full rounded-full bg-white transition-all duration-300" style={{ width: `${(phase.set / totalSets) * 100}%` }} />
            </div>
          </div>
        )}

        {isCountdown && <div className="mt-2 text-sm text-black">Workout starts in {countdownSeconds}</div>}

        <div className="mt-6 w-full">
          {finished ? (
            <button type="button" onClick={onDone} className="h-14 w-full rounded-2xl bg-green-600 font-display text-3xl tracking-wider text-white">
              Done
            </button>
          ) : (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onStop();
              }}
              className="h-14 w-full rounded-2xl bg-red-500 font-display text-3xl tracking-wider text-white"
            >
              Stop
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
