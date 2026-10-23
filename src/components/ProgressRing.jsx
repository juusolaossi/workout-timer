const RADIUS = 46;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Circular progress ring with content in the middle. `value` is 0..1.
// Change `phaseKey` when a new phase starts so the ring restarts from empty
// instead of animating backwards.
export default function ProgressRing({ value, color, phaseKey, children }) {
  return (
    <div className="relative aspect-square w-full">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="8" />
        <circle
          key={phaseKey}
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - value)}
          opacity={value > 0 ? 1 : 0}
          style={{ transition: "stroke 0.3s" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}
