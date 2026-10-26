// Up to MAX_DOTS sets, progress is a row of dots. Above that the dots won't
// fit, so it becomes one thin segment per set, and above MAX_SEGMENTS a single
// continuous bar (the app allows up to 99 sets).
const MAX_DOTS = 15;
const MAX_SEGMENTS = 30;

// Set progress under the phase label. Finished sets are solid, upcoming sets
// are faint, and the set you're on is larger. During work the current dot
// radiates a soft pulse; during rest the set you just did counts as done and
// the next one is shown larger but faint. Nothing pulses while paused.
export default function SetDots({ set, totalSets, phaseType, paused }) {
  const resting = phaseType === "rest";
  const doneCount = resting ? set : set - 1;
  const focusIndex = resting ? set : set - 1; // the set being done, or up next
  const pulse = !paused && !resting;
  const useDots = totalSets <= MAX_DOTS;

  const label = `Set ${set} of ${totalSets}: ${doneCount} done, ${totalSets - doneCount} to go`;

  if (totalSets > MAX_SEGMENTS) {
    const width = `${((doneCount + (resting ? 0 : 1)) / totalSets) * 100}%`;
    return (
      <div role="img" aria-label={label} className="flex h-5 w-full items-center">
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-current/25">
          <div className="absolute inset-y-0 left-0 rounded-full bg-current transition-all duration-300" style={{ width }} />
        </div>
      </div>
    );
  }

  const gap = !useDots ? "gap-1" : totalSets > 10 ? "gap-2" : "gap-3";

  return (
    <div role="img" aria-label={label} className={`flex h-5 w-full items-center justify-center ${gap}`}>
      {Array.from({ length: totalSets }, (_, i) => {
        const done = i < doneCount;
        const focus = i === focusIndex;
        const fill = done || (focus && !resting) ? "bg-current" : "bg-current/25";

        if (!useDots) {
          return <span key={i} className={`block min-w-0 flex-1 rounded-full transition-all duration-300 ${focus ? "h-2.5" : "h-1.5"} ${fill}`} />;
        }

        return (
          <span key={i} className={`relative block flex-none rounded-full transition-all duration-300 ${focus ? "size-3.5" : "size-2.5"} ${fill}`}>
            {focus && pulse && <span className="absolute inset-0 animate-radiate rounded-full bg-current" />}
          </span>
        );
      })}
    </div>
  );
}
