# hook timer redesign brief

Written 16 November 2026 for Claude Code, from an analysis of the code on `main` and design work with the owner. The mockups are in the owner's "hook timer redesign" canvas on Claude (https://claude.ai/artifact/LnUBR2QVprP1vv4SHfkKER, private to the owner). This brief describes them fully, so you don't need to open it.

Goal: keep the app minimal and fast to use, make it look right on every modern phone, add saved workouts, and get it ready to become an installable app.

## Decisions the owner still has to confirm

The brief assumes the recommended option for each. Ask the owner before building if they haven't confirmed.

1. **Home screen:** option A, a workout list (assumed), or option B, the quick timer first with workouts as chips.
2. **Timer:** no progress ring, bigger digits (assumed; the owner said "I think I want to").
3. **Rounds:** workouts can repeat their sets in rounds with a longer rest between (assumed; needed for hangboard repeaters).

## Suggested order

Three pull requests, each with a Netlify preview the owner tests on iPhone and on a Samsung:

1. Rename to hook, layout that fits every phone, installable app basics (sections 1, 2, 5).
2. Timer without the ring (section 3).
3. Workouts and the new home screen (section 4).

## 1. Rename to hook

The brand is now **hook**, always lowercase. See `docs/brand.md` for the naming rules.

- `index.html`: `<title>hook timer</title>`; description "hook timer: an interval timer for climbers and anyone who trains in sets."
- Setup/home screen header: the name is set in Inter, weight 800, lowercase, `letter-spacing: -0.03em`. Never in Bebas Neue, which has no lowercase (it would render HOOK). The current header uses `font-display`; change it.
- `README.md` and `package.json` name: `hook-timer`.
- Storage keys move to a `hook:` prefix (section 4). Read the old `workout-timer:settings:v1` key once and migrate it.
- The `--th-` prefix on the CSS variables can stay or become `--hk-`; it isn't user-visible.
- `public/favicon.svg` still holds an older icon. Replace it with the placeholder app icon from the design system (a three-quarter ring on a green tile) or leave it; the real logo is coming from a human designer.
- Not code: the Netlify site is still `toe-hook-workout-timer`. Renaming it changes the URL and breaks existing home-screen installs, so leave it to the owner.

## 2. Layout that fits every phone

The owner reports the app looks fine as an iPhone home-screen app but "weird" on some Samsung phones. These causes are visible in the code. They were found by reading it, not by seeing the Samsung, so ask the owner for a screenshot if something still looks off after the fix.

| Cause | Where | Effect |
| --- | --- | --- |
| The setup screen has a fixed stack about 700px tall inside `fixed inset-0 h-[100dvh] overflow-hidden` | `SetupScreen.jsx`, `SettingCard.jsx` | On a shorter viewport (most Android phones in a browser tab, about 360 × 640 to 700 visible) the bottom is clipped and can't scroll. The Start button can be cut off. |
| The ring is always `max-w-xs` (320px) and the digits a fixed `text-[6.5rem]` | `TimerScreen.jsx` | The timer is the same size on every phone: small on large phones; on short viewports the stack (about 620px) is centred in an `overflow-hidden` box, so the top and the Stop button are cut. |
| There is no web app manifest | `index.html`, `public/` | On Android, "Add to Home screen" opens a browser tab with the address bar instead of a full-screen app, so Android gets a much shorter viewport than the iPhone home-screen app. |
| No `color-scheme` meta tag | `index.html` | Samsung Internet's dark mode can recolour pages. Samsung's guidance is to provide `prefers-color-scheme` styles (already there) and declare `<meta name="color-scheme" content="light dark">`. |
| Nothing is designed for widths under 360px | all screens | Android "display size" and font-size settings can shrink the viewport to about 320px wide and enlarge text. |

### Rules

- Every screen is a flex column that is at least the viewport tall (`min-height: 100svh`, upgraded to `100dvh` where supported) and **scrolls if its content is taller**. Never clip. The primary button stays reachable (sticky at the bottom).
- Size the timer from the screen, using the smaller of width and height:
  - digits `m:ss`: `font-size: min(60vw, 30dvh)`; `mm:ss`: `min(47vw, 30dvh)`; single countdown digit: `min(80vw, 36dvh)`. Cap at about `20rem` on tablets and desktop.
  - phase label: `clamp(2.25rem, 12vw, 3.5rem)`; set line: `clamp(1.75rem, 9vw, 2.5rem)`.
  - Bebas Neue digits are about 1.39em wide for `m:ss` and 1.79em for `mm:ss`; keep 24px side padding.
- Content column `max-width: 28rem`, centred, on tablets and desktop.
- Landscape must work: the same min(vw, dvh) sizing keeps the digits on screen; put the Stop button beside the digits if the height is under about 420px.
- Keep safe-area padding, 44px touch targets, no layout jumps (see `CLAUDE.md`).
- Add `<meta name="color-scheme" content="light dark">`.

### How to check

Take screenshots of every screen and phase at 320 × 568, 360 × 640, 360 × 740, 390 × 844, 412 × 915, 430 × 932, 844 × 390 (landscape) and 768 × 1024, in light and dark, and once with the browser's text size at 130%. Nothing may be clipped or overlap, and the Start and Stop buttons must always be visible or reachable by scrolling. A small Playwright script for this is worth adding as `npm run shots`.

## 3. Timer without the ring

Remove `ProgressRing` from the timer screen. The time left becomes the largest thing on screen.

Layout, top to bottom, centred as one group in the space above the button:

1. Phase label (Bebas Neue, letter-spacing 0.08em): CHALK UP, WORK, REST, ROUND REST, PAUSED, SENT.
2. Digits (Bebas Neue, tabular figures, line-height 0.8), sized as in section 2. The finished screen shows the check icon in the same box.
3. "Set 3 of 6" (Bebas Neue).
4. `SetDots`, unchanged in behaviour.
5. One small line (Inter 13px, weight 600, uppercase, letter-spacing 0.08em): "Round 2 of 5" when the workout has rounds, "First set in 3" during the countdown, "Tap to resume" when paused. Empty otherwise.
6. Stop button (56px, `bg-stop`) pinned to the bottom; Done on the finished screen (`bg-on-send text-send`).

- Every line keeps its box in every phase (`invisible`, not conditional rendering), and the digits box has a fixed height so the larger countdown digit doesn't move the lines around it.
- Colours are unchanged: one flat phase colour, everything on it in the phase's `on-` colour.
- Delete `ProgressRing.jsx` once nothing uses it. `requestAnimationFrame` ticking can drop to a few updates per second since nothing animates smoothly any more; keep the time derived from timestamps.

## 4. Workouts and the new home screen

### Data

```js
// One workout
{
  id: "repeaters",      // string, unique
  name: "Repeaters",
  workSec: 7,
  restSec: 3,
  sets: 6,
  rounds: 5,            // 1 = a simple workout
  roundRestSec: 180,    // used only when rounds > 1
  builtIn: true,        // built-ins can't be overwritten or deleted
}
```

### Engine (`src/timer/engine.js`, with tests)

- `buildPlan` takes `rounds` and `roundRestSec`. Phase order: countdown, then for each round: work, rest, work, … with no rest after the round's last set; then a `roundRest` phase between rounds; nothing after the last round.
- Each phase carries `set` and `round`. The plan carries `sets` and `rounds`.
- Limits: `rounds` 1 to 20, `roundRestSec` 0 to 3600. Existing limits stay.
- Beeps work per phase as now. `workoutDurationMs` includes round rests.
- `roundRest` uses the rest colours with the label "Round rest"; during it the dots show rounds (done solid, next one larger and faint) and the set line reads "Round 2 of 5 done".

### Built-in workouts

Common timer formats, to be reviewed by the owner. They are starting points, not training advice.

| Name | Work | Rest | Sets | Rounds | Round rest | Total |
| --- | --- | --- | --- | --- | --- | --- |
| Repeaters | 0:07 | 0:03 | 6 | 5 | 3:00 | 16:45 |
| Max hangs | 0:10 | 3:00 | 5 | 1 | | 12:50 |
| Tabata | 0:20 | 0:10 | 8 | 1 | | 3:50 |
| Minute on the minute | 0:30 | 0:30 | 10 | 1 | | 9:30 |
| Classic 15/45 | 0:15 | 0:45 | 10 | 1 | | 9:15 |

Use the totals as test cases for `workoutDurationMs`.

### Storage (localStorage, all wrapped in try/catch as now)

- `hook:workouts:v1`: the user's own workouts, an array.
- `hook:settings:v1`: `{ keepScreenAwake, sound, lastWorkoutId }`.
- Migration: if `workout-timer:settings:v1` exists and the new keys don't, turn its work, rest and sets into a user workout named "My workout" and carry `keepScreenAwake` over.
- Sanitize everything read from storage with the engine's clamps.

### Home screen (option A: workout list)

On `chalk`, 20px side padding, scrolls.

- Header: the name (Inter 800, lowercase) left; a settings button right (44px, icon only, `aria-label="Settings"`).
- "MY WORKOUTS" then "BUILT IN" section labels (Inter 12px, weight 600, letter-spacing 0.08em, `granite-muted`). The user's workouts come first, most recently used on top. Hide the first section when it is empty.
- One row per workout: a `chalk-raised` card, radius 24, hairline `line`, `shadow-card`, about 80px tall.
  - Left, a button that opens the workout: name in Bebas Neue 30px; total time right-aligned on the same line (Inter 13px, weight 600, `granite-muted`, tabular); below, one line in Inter 13px `granite-muted`: "0:07 work · 0:03 rest · 6 sets × 5".
  - Right, a 52px round `send` button with a play triangle in `on-send`, `aria-label="Start Repeaters"`. It starts the workout immediately.
- Bottom, sticky: "New workout" secondary button (56px, `chalk-raised`, hairline, Bebas Neue 28px, plus icon).
- Green is only for starting. Nothing else on this screen is green.

### Workout screen (view, edit, start)

- Top bar: back button left. Right: "Save" for the user's own workouts when something changed, "Save a copy" for built-ins. Deleting a user workout sits behind a "…" menu with a confirm step built into the page.
- Name: a text input styled as a title (Bebas Neue 44px, 2px `line` underline) with a small label above ("BUILT-IN WORKOUT" or "WORKOUT NAME").
- One card with a row per value, 64px each, hairlines between: Work (`send-ink`), Rest (`rest-ink`), Sets, Rounds, Round rest (`rest-ink`, shown only when rounds > 1).
  - Each row: label in Bebas Neue 26px left; right, a minus button, the value (Bebas Neue 34px, tabular, about 76px wide) and a plus button. Buttons are 44px circles, `chalk` with a hairline.
  - Steps: times change by 1s below 0:10 and by 5s above; sets and rounds by 1. Holding a button repeats. Tapping the value lets you type it with the numeric keypad (seconds, or m:ss).
- Helper line: "A round repeats all your sets. Keep rounds at 1 for a simple workout."
- Bottom, sticky: summary ("5 rounds of 6 sets · **16:45** total") and the Start button (64px, `send`, radius 24, `shadow-start`, Bebas Neue 38px).
- Starting an edited but unsaved workout is allowed; it just runs.

### Settings

A simple sheet or screen from the header button: keep screen awake (moved here from the home screen), sound on or off. Candidates for later: vibration on Android, length of the get-ready countdown.

### Option B, if the owner prefers it

Keep one screen: the header, a horizontally scrolling row of workout chips (44px pills; selected chip `granite` with `chalk` text), the value card with steppers for Work, Rest, Sets and Rounds, a "Save as a workout" text button, and Start at the bottom. Same data and engine.

## 5. Installable app

Do this with the first pull request; it also fixes the Android home-screen experience.

- Web app manifest: `name` "hook timer", `short_name` "hook", `display` "standalone", `background_color` and `theme_color` from `chalk`, icons at 192 and 512 plus a maskable one, and an `apple-touch-icon` at 180. Use the placeholder app icon until the real logo exists.
- A service worker that precaches the build so the app opens with no signal (cellar gyms). `vite-plugin-pwa` with `registerType: "autoUpdate"` is the usual way.
- `base: "./"` and `public/_redirects` are in place for Netlify; check the manifest `start_url` and `scope` work with them.

### Later: the app stores (not part of this work)

- **Google Play:** an installable web app can be wrapped as a Trusted Web Activity (PWABuilder or Bubblewrap). Personal developer accounts created after 13 November 2023 must run a closed test with at least 12 testers for 14 days before publishing ([Google Play Console Help](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en)).
- **App Store:** needs the Apple Developer Program, 99 USD per year ([Apple](https://developer.apple.com/programs/enroll/)), and a native wrapper such as Capacitor, built on a Mac or a cloud Mac. Apple's guideline 4.2 rejects apps that are only a repackaged website, so the wrapper should add things a browser tab can't: background audio or notifications when the phone locks, haptics, a proper offline start ([summary of guideline 4.2](https://www.mobiloud.com/blog/app-store-review-guidelines-webview-wrapper)).
- Keep the timer logic in `engine.js` free of browser APIs, as it is now, so it carries over unchanged.

## 6. Other recommendations (backlog, owner decides)

- **Stop is easy to hit by accident.** Consider showing Stop only when paused (tap to pause, then Resume or End), or asking for a long press. This would also free the bottom of the running screen.
- **Sound switch and vibration.** A mute toggle in settings; `navigator.vibrate` on Android at phase changes (iOS Safari doesn't support it).
- **Get-ready length.** 5 seconds is short for getting onto a hangboard; offer 5, 10 or 15.
- **Skip.** A way to skip the rest of a rest phase.
- **Locked phone.** Beeps stop when the phone locks or the browser is in the background. Wake lock covers most of it; a store app can do better.
- **Finished screen.** Show the total time, and offer "Again".
- **Tests.** Only the engine is tested. Add component tests for the timer screen states once the layout settles.
- **No tracking, no accounts.** Everything stays on the device. Say so in a short About line; it is part of the brand promise.
