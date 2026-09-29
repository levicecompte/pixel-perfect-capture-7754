import { WORLD_DOTS } from "./data";

export function WorldDots({ className = "", dotColor = "white", opacity = 0.08 }) {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      style={{ opacity }}
      aria-hidden="true"
    >
      {WORLD_DOTS.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={0.28} fill={dotColor} />
      ))}
    </svg>
  );
}

export function Backdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 grid-overlay" />
      <WorldDots className="absolute inset-0 h-full w-full" opacity={0.08} />
      <div
        className="absolute -top-40 left-1/4 h-[36rem] w-[36rem] rounded-full blur-[140px]"
        style={{ background: "rgba(0,229,255,0.16)" }}
      />
      <div
        className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full blur-[160px]"
        style={{ background: "rgba(0,255,148,0.08)" }}
      />
    </div>
  );
}
