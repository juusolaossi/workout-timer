import { useState } from "react";
import { LIMITS, clampSetting } from "../timer/engine";

// Class names are written out in full so Tailwind can find them.
const ACCENTS = {
  work: { label: "text-green-700", selected: "bg-green-500 text-white shadow-md shadow-green-600/30" },
  rest: { label: "text-orange-600", selected: "bg-orange-500 text-white shadow-md shadow-orange-600/30" },
  sets: { label: "text-slate-700", selected: "bg-slate-800 text-white shadow-md shadow-slate-900/30" },
};

// One setting (work, rest or sets): a large number field for any value, and
// all presets visible as big buttons in one row.
export default function SettingCard({ settingKey, label, unit, accent, presets, value, onChange }) {
  const [draft, setDraft] = useState(null);
  const colors = ACCENTS[accent];
  const { min, max } = LIMITS[settingKey];

  function handleInput(event) {
    const text = event.target.value;
    setDraft(text);
    if (text !== "") onChange(clampSetting(settingKey, text));
  }

  return (
    <section className="rounded-3xl bg-white/80 p-4 shadow-sm ring-1 ring-black/5">
      <div className="flex items-center justify-between gap-3">
        <h2 className={`font-display text-3xl leading-none tracking-wide ${colors.label}`}>{label}</h2>
        <label className="flex items-baseline gap-1.5 rounded-2xl bg-slate-100 px-3 py-1 focus-within:ring-2 focus-within:ring-slate-400">
          <input
            type="number"
            inputMode="numeric"
            min={min}
            max={max}
            value={draft ?? value}
            onChange={handleInput}
            onFocus={(event) => event.target.select()}
            onBlur={() => setDraft(null)}
            onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
            aria-label={unit ? `${label} (${unit})` : label}
            className="w-20 bg-transparent text-right font-display text-4xl leading-tight tabular-nums text-slate-900 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          {unit && <span className="text-sm font-medium text-slate-500">{unit}</span>}
        </label>
      </div>

      <div role="group" aria-label={`${label} presets`} className="mt-3 grid grid-cols-6 gap-2">
        {presets.map((preset) => {
          const selected = value === preset;
          return (
            <button
              key={preset}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                setDraft(null);
                onChange(preset);
              }}
              className={`h-12 rounded-2xl font-display text-2xl tabular-nums transition active:scale-95 ${selected ? colors.selected : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
            >
              {preset}
            </button>
          );
        })}
      </div>
    </section>
  );
}
