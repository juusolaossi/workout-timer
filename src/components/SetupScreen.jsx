import { formatTime, workoutDurationMs } from "../timer/engine";
import SettingCard from "./SettingCard";

const WORK_PRESETS = [10, 15, 20, 30, 45, 60];
const REST_PRESETS = [10, 15, 30, 45, 60, 90];
const SET_PRESETS = [3, 5, 8, 10, 12, 15];

// The idle screen: no timer ring, so the settings get the whole screen.
export default function SetupScreen({ settings, onChange, onStart }) {
  const update = (key) => (value) => onChange((current) => ({ ...current, [key]: value }));
  const totalTime = formatTime(workoutDurationMs(settings));

  return (
    <div className="fixed inset-0 h-[100dvh] overflow-hidden overscroll-none bg-chalk">
      <div className="mx-auto flex h-full max-w-md flex-col gap-3 px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
        <header className="flex items-baseline justify-between">
          <h1 className="font-display text-4xl leading-none tracking-wide text-granite">Toe Hook</h1>
          <span className="text-xs font-semibold tracking-[0.08em] text-granite-muted uppercase">Interval timer</span>
        </header>

        <SettingCard settingKey="workSec" label="Work" unit="sec" accent="work" presets={WORK_PRESETS} value={settings.workSec} onChange={update("workSec")} />
        <SettingCard settingKey="restSec" label="Rest" unit="sec" accent="rest" presets={REST_PRESETS} value={settings.restSec} onChange={update("restSec")} />
        <SettingCard settingKey="sets" label="Sets" accent="sets" presets={SET_PRESETS} value={settings.sets} onChange={update("sets")} />

        <div className="flex items-center justify-between gap-3 rounded-3xl bg-chalk-raised px-4 py-3 text-sm text-granite shadow-card ring-1 ring-line">
          <span>Keep screen awake during workout</span>
          <button
            type="button"
            role="switch"
            aria-checked={settings.keepScreenAwake}
            aria-label="Keep screen awake during workout"
            onClick={() => onChange((current) => ({ ...current, keepScreenAwake: !current.keepScreenAwake }))}
            className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-send-ink focus-visible:ring-offset-1 ${settings.keepScreenAwake ? "bg-send" : "bg-line"}`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${settings.keepScreenAwake ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>

        {/* Start stays at the bottom of the screen, within thumb reach. */}
        <div className="mt-auto -mx-4 bg-gradient-to-t from-chalk via-chalk/95 to-transparent px-4 pt-4">
          <p className="mb-2 text-center text-sm text-granite-muted">
            {settings.sets} {settings.sets === 1 ? "set" : "sets"} · <span className="font-semibold text-granite">{totalTime}</span> total
          </p>
          <button
            type="button"
            onClick={onStart}
            className="h-16 w-full rounded-3xl bg-send font-display text-4xl tracking-wider text-on-send shadow-start transition active:scale-[0.98]"
          >
            Start
          </button>
        </div>
      </div>
    </div>
  );
}
