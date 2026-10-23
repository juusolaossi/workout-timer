import { describe, expect, it } from "vitest";
import {
  COUNTDOWN_MS,
  buildBeeps,
  buildPlan,
  elapsedMs,
  formatTime,
  getProgress,
  pauseRun,
  resumeRun,
  sanitizeSettings,
  startRun,
  workoutDurationMs,
} from "./engine";

const types = (plan) => plan.phases.map((p) => `${p.type}${p.type === "countdown" ? "" : p.set}`);

describe("buildPlan", () => {
  it("alternates work and rest with no rest after the last set", () => {
    const plan = buildPlan({ workSec: 15, restSec: 45, sets: 3 });
    expect(types(plan)).toEqual(["countdown", "work1", "rest1", "work2", "rest2", "work3"]);
    expect(plan.totalMs).toBe(COUNTDOWN_MS + 3 * 15000 + 2 * 45000);
  });

  it("goes straight from work to work when rest is 0", () => {
    const plan = buildPlan({ workSec: 1, restSec: 0, sets: 3 });
    expect(types(plan)).toEqual(["countdown", "work1", "work2", "work3"]);
  });

  it("clamps invalid settings", () => {
    expect(sanitizeSettings({ workSec: 0, restSec: -5, sets: "" })).toEqual({ workSec: 1, restSec: 0, sets: 1 });
    expect(sanitizeSettings({ workSec: 99999, restSec: 2.6, sets: 500 })).toEqual({ workSec: 3600, restSec: 3, sets: 99 });
  });

  it("reports the workout length without the countdown", () => {
    expect(workoutDurationMs({ workSec: 15, restSec: 45, sets: 10 })).toBe((10 * 15 + 9 * 45) * 1000);
  });
});

describe("getProgress", () => {
  const plan = buildPlan({ workSec: 1, restSec: 0, sets: 3 });

  it("finishes after the last set even when rest is 0", () => {
    // The old timer kept counting past the last set ("SET 12 OF 3") in this case.
    expect(getProgress(plan, COUNTDOWN_MS + 2500)).toMatchObject({ finished: false, phase: { type: "work", set: 3 } });
    expect(getProgress(plan, COUNTDOWN_MS + 3000)).toMatchObject({ finished: true, phase: null });
  });

  it("reports the time left in the current phase", () => {
    expect(getProgress(plan, 1200)).toMatchObject({ phase: { type: "countdown" }, remainingMs: 3800 });
  });
});

describe("pause and resume", () => {
  it("stops the clock while paused", () => {
    let run = startRun({ workSec: 10, restSec: 0, sets: 1 }, 1000);
    run = pauseRun(run, 3000);
    expect(elapsedMs(run, 60000)).toBe(2000);
    run = resumeRun(run, 60000);
    expect(elapsedMs(run, 61000)).toBe(3000);
  });
});

describe("buildBeeps", () => {
  it("beeps at 3, 2, 1 seconds left and ends with the finish sound", () => {
    const beeps = buildBeeps(buildPlan({ workSec: 10, restSec: 0, sets: 1 }));
    expect(beeps).toEqual([
      { atMs: 2000, kind: "short" },
      { atMs: 3000, kind: "short" },
      { atMs: 4000, kind: "short" },
      { atMs: 5000, kind: "long" },
      { atMs: 12000, kind: "short" },
      { atMs: 13000, kind: "short" },
      { atMs: 14000, kind: "short" },
      { atMs: 15000, kind: "finish" },
    ]);
  });

  it("does not stack beeps on the start of very short phases", () => {
    const beeps = buildBeeps(buildPlan({ workSec: 1, restSec: 0, sets: 2 }));
    expect(beeps.filter((b) => b.atMs > COUNTDOWN_MS)).toEqual([
      { atMs: 6000, kind: "long" },
      { atMs: 7000, kind: "finish" },
    ]);
  });
});

describe("formatTime", () => {
  it("rounds up to whole seconds", () => {
    expect(formatTime(45000)).toBe("0:45");
    expect(formatTime(44001)).toBe("0:45");
    expect(formatTime(90000)).toBe("1:30");
    expect(formatTime(0)).toBe("0:00");
  });
});
