// Web Audio beeps. Beeps are scheduled ahead of time on the audio clock, so
// they play on time even when the browser slows down the page's JS timers.

const SOUNDS = {
  short: [{ frequency: 880, offset: 0, duration: 0.15 }],
  long: [{ frequency: 1200, offset: 0, duration: 0.6 }],
  finish: [
    { frequency: 784, offset: 0, duration: 0.18 },
    { frequency: 988, offset: 0.2, duration: 0.18 },
    { frequency: 1319, offset: 0.4, duration: 0.7 },
  ],
};

export function createBeeper() {
  let ctx = null;
  let master = null;
  let scheduled = new Set();

  function ensureCtx() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      ctx = new AudioCtx();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    }
    return ctx;
  }

  // Call from a tap/click handler at least once: browsers only allow audio to
  // start after a user gesture. Resolves to true when audio can play.
  async function unlock() {
    const c = ensureCtx();
    if (!c) return false;
    if (c.state !== "running") {
      try {
        await c.resume();
      } catch {
        // Ignored: we report the state below.
      }
    }
    return c.state === "running";
  }

  function playTone(at, { frequency, duration }) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(0.7, at + 0.01);
    gain.gain.linearRampToValueAtTime(0, at + duration);
    osc.connect(gain);
    gain.connect(master);
    osc.start(at);
    osc.stop(at + duration + 0.05);
    scheduled.add(osc);
    osc.onended = () => {
      scheduled.delete(osc);
      gain.disconnect();
    };
  }

  // beeps: [{ at, kind }] where `at` is a performance.now() timestamp.
  // Replaces anything scheduled before.
  function schedule(beeps) {
    cancel();
    if (!ctx || ctx.state !== "running") return;
    const clockOffset = ctx.currentTime - performance.now() / 1000;
    for (const beep of beeps) {
      const at = beep.at / 1000 + clockOffset;
      if (at < ctx.currentTime - 0.05) continue;
      for (const tone of SOUNDS[beep.kind]) playTone(Math.max(ctx.currentTime, at + tone.offset), tone);
    }
  }

  function cancel() {
    for (const osc of scheduled) {
      osc.onended = null;
      try {
        osc.stop();
      } catch {
        // Already stopped.
      }
      osc.disconnect();
    }
    scheduled = new Set();
  }

  // Calls `callback` when audio starts running again, e.g. after a phone call
  // or switching apps interrupted it. Returns an unsubscribe function.
  function onResumed(callback) {
    const c = ensureCtx();
    if (!c) return () => {};
    const handler = () => {
      if (c.state === "running") callback();
    };
    c.addEventListener("statechange", handler);
    return () => c.removeEventListener("statechange", handler);
  }

  return { unlock, schedule, cancel, onResumed };
}
