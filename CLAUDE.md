# Toe Hook Timer

An interval timer for climbers and anyone who trains in sets. It is the first product of **Toe Hook**, a climbing and outdoors brand that will later include other products, merch and apps. Built for phones at the gym: big numbers, one tap to pause, the screen stays awake, colour tells you the phase.

Live: https://toe-hook-workout-timer.netlify.app/

## Commands

```bash
npm install
npm run dev      # Vite dev server, http://localhost:5173
npm test         # Vitest unit tests for the timer engine
npm run lint     # ESLint
npm run build    # production build into dist/
```

Run `npm test`, `npm run lint` and `npm run build` before calling a change done.

## How the code is organised

- `src/timer/engine.js` – all timer logic as pure functions. The plan is a list of phases (countdown, work, rest) on a timeline; everything on screen is derived from elapsed time, so the timer can't drift. Tests in `engine.test.js`.
- `src/audio/beeper.js` – beeps scheduled ahead on the Web Audio clock.
- `src/hooks/` – screen wake lock and saved settings (localStorage).
- `src/components/SetupScreen.jsx` – the idle screen: work, rest and sets cards, keep-awake switch, Start.
- `src/components/TimerScreen.jsx` – the running, paused and finished screen. Tap anywhere pauses or resumes.
- `src/components/SetDots.jsx` – set progress under the phase label.
- `src/index.css` – Toe Hook colour tokens as CSS variables (light and dark), exposed to Tailwind as colours like `bg-send` and `text-on-rest`.

## Rules for changes

- **Follow the brand.** Read `docs/brand.md` before any visual or copy change. Use the Tailwind brand colours (`chalk`, `granite`, `send`, `rest`, `ready`, `pause`, `stop` and their `on-` and `-ink` variants), never raw Tailwind palette colours like `green-500` or hex values in components.
- **The layout must not jump.** Elements on the timer screen keep their position when pausing, resuming or changing phase. Reserve space for anything that appears or disappears (use `invisible`, not conditional rendering).
- **Mobile first, iPhone especially.** The app is used from the iPhone home screen. Check safe areas, no unwanted scrolling, numeric keypad for inputs, touch targets of at least 44px.
- **Keep timer logic in the engine.** New timing behaviour goes in `engine.js` with tests, not in components.
- **Respect reduced motion.** Any animation needs a `prefers-reduced-motion` fallback.
- **The owner tests on a real iPhone.** After a change, say what to check on the phone.

## Workflow

- Work on a branch and open a pull request. Netlify builds a deploy preview for every pull request; the owner tests the preview on PC and iPhone before merging to `main`.
- Commit messages: a short summary line, then what changed and why.
