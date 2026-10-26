import { formatTime } from "../timer/engine";
import ProgressRing from "./ProgressRing";
import SetDots from "./SetDots";

// One flat Toe Hook phase colour fills the screen. Text, digits, the ring and
// its track all use the matching "on-" colour. Class names are written out in
// full so Tailwind can find them.
const LOOKS = {
  countdown: "bg-ready text-on-ready",
  work: "bg-send text-on-send",
  rest: "bg-rest text-on-rest",
  paused: "bg-pause text-on-pause",
  finished: "bg-send text-on-send",
};

// The running/paused/finished screen. Tapping anywhere pauses or resumes.
export default function TimerScreen({ progress, paused, totalSets, onTogglePause, onStop, onDone }) {
  const { finished, phase, index, remainingMs } = progress;
  const isCountdown = phase?.type === "countdown";
  const look = LOOKS[paused ? "paused" : finished ? "finished" : phase.type];
  const ringValue = finished ? 1 : 1 - remainingMs / phase.durationMs;
  const countdownSeconds = Math.max(1, Math.ceil(remainingMs / 1000));

  const label = paused ? "Paused" : finished ? "Sent" : isCountdown ? "Chalk up" : phase.type;
  const display = isCountdown ? String(countdownSeconds) : formatTime(remainingMs);

  // Set progress shows during work and rest, including while paused.
  const showSets = !finished && !isCountdown;
  const currentSet = phase?.set ?? totalSets;

  let hint = null;
  if (paused) hint = "Tap to resume";
  else if (finished) hint = `${totalSets} ${totalSets === 1 ? "set" : "sets"} done`;
  else if (isCountdown) hint = `First set in ${countdownSeconds}`;

  return (
    <div
      className={`fixed inset-0 flex h-[100dvh] w-full touch-none items-center justify-center overflow-hidden overscroll-none px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] transition-colors duration-300 ${look}`}
      onClick={finished ? undefined : onTogglePause}
    >
      <div className="flex w-full max-w-xs flex-col items-center">
        <ProgressRing value={ringValue} phaseKey={index}>
          {finished ? (
            <svg viewBox="0 0 24 24" className="h-28 w-28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-label="Done">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          ) : (
            <span className={`font-display leading-none tabular-nums ${isCountdown ? "text-[8.5rem]" : "text-[6.5rem]"}`}>{display}</span>
          )}
        </ProgressRing>

        <div className="mt-5 font-display text-4xl leading-none tracking-[0.08em] uppercase">{label}</div>

        {/* Set progress and the hint line always take up their space, even when
            hidden, so nothing on the screen moves when you pause, resume or
            change phase. */}
        <div className={`mt-3 w-full ${showSets ? "" : "invisible"}`} aria-hidden={!showSets}>
          <div className="text-center font-display text-3xl tracking-wide">
            Set {currentSet} <span className="text-xl opacity-70">of</span> {totalSets}
          </div>
          <div className="mt-2">
            <SetDots set={currentSet} totalSets={totalSets} phaseType={phase?.type} paused={paused} />
          </div>
        </div>

        <div className="mt-2 h-5 text-sm leading-5 font-medium">{hint ?? "\u00a0"}</div>

        <div className="mt-8 w-full">
          {finished ? (
            <button type="button" onClick={onDone} className="h-14 w-full rounded-2xl bg-on-send font-display text-3xl tracking-wider text-send">
              Done
            </button>
          ) : (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onStop();
              }}
              className="h-14 w-full rounded-2xl bg-stop font-display text-3xl tracking-wider text-on-stop"
            >
              Stop
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
