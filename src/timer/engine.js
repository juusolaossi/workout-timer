// Pure timer logic, no React and no browser APIs, so it can be unit tested.
//
// A workout is a fixed "plan": a list of phases laid out on a timeline that
// starts at 0 ms. While running we only store when the run started and how
// long it has been paused; everything shown on screen is derived from the
// elapsed time. Because nothing is counted down step by step, the timer can't
// drift, and phase changes can't get out of sync with the set counter.

export const COUNTDOWN_MS = 5000;

export const LIMITS = {
  workSec: { min: 1, max: 3600 },
  restSec: { min: 0, max: 3600 },
  sets: { min: 1, max: 99 },
};

export function clampSetting(key, value) {
  const { min, max } = LIMITS[key];
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

export function sanitizeSettings({ workSec, restSec, sets }) {
  return {
    workSec: clampSetting("workSec", workSec),
    restSec: clampSetting("restSec", restSec),
    sets: clampSetting("sets", sets),
  };
}

export function buildPlan(settings) {
  const { workSec, restSec, sets } = sanitizeSettings(settings);
  const phases = [];
  let startMs = 0;
  const add = (type, durationMs, set) => {
    phases.push({ type, durationMs, set, startMs });
    startMs += durationMs;
  };

  add("countdown", COUNTDOWN_MS, 1);
  for (let set = 1; set <= sets; set++) {
    add("work", workSec * 1000, set);
    // No rest after the last set: the workout ends when the last work phase does.
    if (set < sets && restSec > 0) add("rest", restSec * 1000, set);
  }

  return { phases, totalMs: startMs, sets };
}

// Length of the workout itself, without the "get ready" countdown.
export function workoutDurationMs(settings) {
  return buildPlan(settings).totalMs - COUNTDOWN_MS;
}

export function getProgress(plan, elapsedMs) {
  if (elapsedMs >= plan.totalMs) {
    return { finished: true, index: plan.phases.length, phase: null, remainingMs: 0 };
  }
  const index = plan.phases.findIndex((p) => elapsedMs < p.startMs + p.durationMs);
  const phase = plan.phases[index];
  return { finished: false, index, phase, remainingMs: phase.startMs + phase.durationMs - elapsedMs };
}

// Short beeps at 3, 2 and 1 seconds left in every phase, a long beep when a
// phase ends, and a finish sound at the very end. Times are on the plan's timeline.
export function buildBeeps(plan) {
  const beeps = [];
  plan.phases.forEach((phase, i) => {
    const endMs = phase.startMs + phase.durationMs;
    for (const secondsLeft of [3, 2, 1]) {
      // Skip a beep that would land on the phase start, where the previous long beep plays.
      if (secondsLeft * 1000 < phase.durationMs) beeps.push({ atMs: endMs - secondsLeft * 1000, kind: "short" });
    }
    beeps.push({ atMs: endMs, kind: i === plan.phases.length - 1 ? "finish" : "long" });
  });
  return beeps;
}

// A "run" is one started workout. `now` is a performance.now() timestamp.
export function startRun(settings, now) {
  const plan = buildPlan(settings);
  return { plan, beeps: buildBeeps(plan), startedAt: now, pausedAt: null, pausedTotalMs: 0 };
}

export function isPaused(run) {
  return run.pausedAt !== null;
}

export function pauseRun(run, now) {
  return isPaused(run) ? run : { ...run, pausedAt: now };
}

export function resumeRun(run, now) {
  if (!isPaused(run)) return run;
  return { ...run, pausedAt: null, pausedTotalMs: run.pausedTotalMs + (now - run.pausedAt) };
}

export function elapsedMs(run, now) {
  const until = isPaused(run) ? run.pausedAt : now;
  return Math.max(0, until - run.startedAt - run.pausedTotalMs);
}

// performance.now() time at which a point on the plan's timeline happens,
// assuming the run is not paused again before then.
export function timelineToClock(run, atMs) {
  return run.startedAt + run.pausedTotalMs + atMs;
}

export function formatTime(ms) {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
