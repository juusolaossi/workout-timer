import { useState } from "react";
import { LIMITS, clampSetting } from "../timer/engine";

// Class names are written out in full so Tailwind can find them.
// Work and rest use their phase colours from the timer screens.
const ACCENTS = {
  work: { label: "text-send-ink", selected: "bg-send text-on-send" },
  rest: { label: "text-rest-ink", selected: "bg-rest text-on-rest" },
  sets: { label: "text-granite", selected: "bg-granite text-chalk" },
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
    <section className="rounded-3xl bg-chalk-raised p-4 shadow-card ring-1 ring-line">
      <div className="flex items-center justify-between gap-3">
        <h2 className={`font-display text-3xl leading-none tracking-wide ${colors.label}`}>{label}</h2>
        <label className="flex items-baseline gap-1.5 rounded-2xl bg-chalk px-3 py-1 ring-1 ring-line focus-within:ring-2 focus-within:ring-send-ink">
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
            className="w-20 bg-transparent text-right font-display text-4xl leading-tight tabular-nums text-granite outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          {unit && <span className="text-sm font-medium text-granite-muted">{unit}</span>}
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
              className={`h-12 rounded-lg font-display text-2xl tabular-nums transition active:scale-95 ${selected ? colors.selected : "bg-chalk text-granite ring-1 ring-line hover:bg-line"}`}
            >
              {preset}
            </button>
          );
        })}
      </div>
    </section>
  );
}
