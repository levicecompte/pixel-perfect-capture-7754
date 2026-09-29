import { series, toPath } from "./data";

export function Sparkline({
  seed,
  up,
  width = 84,
  height = 28,
}: {
  seed: number;
  up: boolean;
  width?: number;
  height?: number;
}) {
  const values = series(seed, 28, 100, up ? 118 : 86, 0.05);
  const color = up ? "var(--neon-emerald)" : "var(--neon-red)";
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path
        d={toPath(values, width, height, 3)}
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="neon-line"
        style={{ color }}
      />
    </svg>
  );
}
