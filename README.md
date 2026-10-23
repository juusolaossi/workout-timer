# Workout Timer

A simple interval timer for work/rest sets, built for use on a phone at the gym.

Live: https://toe-hook-workout-timer.netlify.app/

- Pick work time, rest time and number of sets with one tap, or type any value.
- 5-second "get ready" countdown, beeps at 3-2-1 seconds left and when each phase ends.
- Tap anywhere to pause or resume.
- Keeps the screen on during the workout (optional).
- Remembers your last settings.

## Development

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev      # local dev server
npm test         # unit tests for the timer logic
npm run lint
npm run build    # production build into dist/
```

## How it's built

React 19 + Vite + Tailwind CSS 4. Fonts (Bebas Neue, Inter) are bundled from Fontsource.

- `src/timer/engine.js` – all timer logic as plain functions: builds the list of
  phases for a workout and works out the current phase from the elapsed time.
  Tests are in `engine.test.js`.
- `src/audio/beeper.js` – beeps, scheduled ahead on the Web Audio clock.
- `src/hooks/` – screen wake lock and saved settings.
- `src/components/` – the setup screen and the running timer screen.

Deployed on Netlify (build command `npm run build`, publish directory `dist`).
