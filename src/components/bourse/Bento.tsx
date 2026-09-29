import { useState, type PointerEvent as ReactPointerEvent } from "react";
import { motion } from "motion/react";
import { CAC_SERIES, CITIES, TIMEFRAMES, TOP_MOVERS, series, toPath } from "./data";
import { WorldDots } from "./Backdrop";
import { Sparkline } from "./Sparkline";

const W = 720;
const H = 300;

function MainChart() {
  const [tf, setTf] = useState<(typeof TIMEFRAMES)[number]>("1M");
  const [cross, setCross] = useState<{ x: number; y: number } | null>(null);

  const values =
    tf === "1D"
      ? series(3, 120, 8098, 8142.23, 0.002)
      : tf === "1W"
        ? series(9, 120, 8010, 8142.23, 0.004)
        : tf === "1M"
          ? CAC_SERIES
          : series(15, 120, 7180, 8142.23, 0.009);

  const min = Math.min(...values);
  const max = Math.max(...values);
  const d = toPath(values, W, H, 10);

  const onMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    const idx = Math.min(values.length - 1, Math.max(0, Math.round((x / W) * (values.length - 1))));
    const y = 10 + (1 - (values[idx] - min) / (max - min || 1)) * (H - 20);
    setCross({ x: (idx / (values.length - 1)) * W, y });
  };

  const hovered =
    cross !== null
      ? values[Math.round((cross.x / W) * (values.length - 1))]
      : values[values.length - 1];

  return (
    <div className="glass glass-hover rounded-3xl p-5 sm:p-6 lg:col-span-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            CAC 40 • INDEX
          </p>
          <div className="mt-2 flex items-center gap-3">
            <span className="font-mono text-3xl font-bold tracking-tight">
              {hovered.toFixed(2)}
            </span>
            <span
              className="rounded-full border px-2.5 py-1 font-mono text-xs font-semibold"
              style={{
                color: "var(--neon-emerald)",
                background: "rgba(0,255,148,0.14)",
                borderColor: "rgba(0,255,148,0.3)",
              }}
            >
              +0.84%
            </span>
          </div>
        </div>
        <div className="glass flex items-center gap-1 rounded-full p-1">
          {TIMEFRAMES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTf(t)}
              className="rounded-full border px-3 py-1.5 font-mono text-xs transition-colors"
              style={
                t === tf
                  ? {
                      borderColor: "rgba(0,229,255,0.6)",
                      color: "var(--neon-cyan)",
                      background: "rgba(0,229,255,0.1)",
                    }
                  : { borderColor: "transparent", color: "var(--muted-foreground)" }
              }
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H + 60}`}
        className="mt-6 w-full touch-none"
        onPointerMove={onMove}
        onPointerLeave={() => setCross(null)}
        role="img"
        aria-label="Évolution du CAC 40"
      >
        {Array.from({ length: 6 }, (_, i) => (
          <line
            key={i}
            x1={0}
            x2={W}
            y1={(i * H) / 5}
            y2={(i * H) / 5}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={1}
          />
        ))}
        {Array.from({ length: 9 }, (_, i) => (
          <line
            key={i}
            y1={0}
            y2={H + 50}
            x1={(i * W) / 8}
            x2={(i * W) / 8}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={1}
          />
        ))}

        {values.map((v, i) =>
          i % 2 === 0 ? null : (
            <rect
              key={i}
              x={(i / values.length) * W}
              width={W / values.length - 1.5}
              y={H + 50 - (10 + ((v * 31) % 40))}
              height={10 + ((v * 31) % 40)}
              fill={i % 5 === 0 ? "#00FF94" : "#00E5FF"}
              opacity={0.16}
              rx={1}
            />
          ),
        )}

        <path d={`${d} L${W},${H} L0,${H} Z`} fill="url(#cacFill)" opacity={0.4} />
        <path
          d={d}
          fill="none"
          stroke="var(--neon-cyan)"
          strokeWidth={2.2}
          strokeLinejoin="round"
          strokeLinecap="round"
          className="neon-line"
          style={{ color: "var(--neon-cyan)" }}
        />

        {cross && (
          <g>
            <line x1={cross.x} x2={cross.x} y1={0} y2={H} stroke="rgba(0,229,255,0.45)" strokeDasharray="4 4" />
            <line x1={0} x2={W} y1={cross.y} y2={cross.y} stroke="rgba(0,229,255,0.25)" strokeDasharray="4 4" />
            <circle cx={cross.x} cy={cross.y} r={5} fill="#00E5FF" className="neon-line" style={{ color: "#00E5FF" }} />
          </g>
        )}

        <defs>
          <linearGradient id="cacFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function TopMovers() {
  return (
    <div className="glass glass-hover rounded-3xl p-5 sm:p-6 lg:col-span-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        Top Movers
      </p>
      <ul className="mt-4 space-y-2">
        {TOP_MOVERS.map((m) => {
          const up = m.change >= 0;
          return (
            <li
              key={m.ticker}
              className="flex items-center gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-white/[0.04]"
            >
              <span className="glass flex h-9 w-9 items-center justify-center rounded-xl font-display text-sm font-bold">
                {m.ticker[0]}
              </span>
              <div className="min-w-0">
                <p className="font-mono text-sm font-bold">{m.ticker}</p>
                <p className="truncate text-[11px] text-muted-foreground">{m.name}</p>
              </div>
              <div className="ml-auto flex items-center gap-3">
                <Sparkline seed={m.seed} up={up} width={60} height={24} />
                <span
                  className="animate-neon-pulse rounded-full border px-2 py-1 font-mono text-[11px] font-semibold"
                  style={{
                    color: up ? "var(--neon-emerald)" : "var(--neon-red)",
                    background: up ? "rgba(0,255,148,0.15)" : "rgba(255,59,48,0.15)",
                    borderColor: up ? "rgba(0,255,148,0.3)" : "rgba(255,59,48,0.3)",
                  }}
                >
                  {up ? "+" : ""}
                  {m.change.toFixed(2)}%
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function WorldCard() {
  return (
    <div className="glass glass-hover relative overflow-hidden rounded-3xl p-5 sm:p-6 lg:col-span-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        Places mondiales
      </p>
      <div className="relative mt-4 aspect-[2/1] w-full">
        <WorldDots className="absolute inset-0 h-full w-full" opacity={0.28} />
        {CITIES.map((c) => (
          <span
            key={c.name}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center"
            style={{ left: `${c.x}%`, top: `${c.y}%` }}
          >
            <span
              className="absolute h-4 w-4 animate-ping rounded-full"
              style={{ background: "rgba(0,229,255,0.35)" }}
            />
            <span
              className="relative h-2 w-2 rounded-full"
              style={{ background: "#00E5FF", boxShadow: "0 0 12px #00E5FF" }}
            />
            <span className="ml-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {c.name}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

function StatsCard() {
  const stats = [
    { label: "S&P 500", value: "5 789.10", change: "+0.32%", up: true },
    { label: "NASDAQ", value: "18 234.60", change: "-0.12%", up: false },
    { label: "Volatilité VIX", value: "13.84", change: "-2.10%", up: false },
    { label: "Volume CAC", value: "3.42 Md€", change: "+6.40%", up: true },
  ];
  return (
    <div className="glass glass-hover rounded-3xl p-5 sm:p-6 lg:col-span-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        Indices & flux
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-white/[0.03] p-3">
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
            <p className="mt-1 font-mono text-lg font-bold">{s.value}</p>
            <p
              className="font-mono text-[11px]"
              style={{ color: s.up ? "var(--neon-emerald)" : "var(--neon-red)" }}
            >
              {s.change}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Bento() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16">
      <motion.div
        initial={{ opacity: 0, filter: "blur(10px)", y: 24 }}
        whileInView={{ opacity: 1, filter: "blur(0px)", y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, staggerChildren: 0.1 }}
        className="grid grid-cols-1 gap-5 lg:grid-cols-12"
      >
        <MainChart />
        <TopMovers />
        <WorldCard />
        <StatsCard />
        <div className="glass glass-hover flex flex-col justify-between rounded-3xl p-6 lg:col-span-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Sentiment
          </p>
          <p className="font-display text-4xl font-bold" style={{ color: "var(--neon-emerald)" }}>
            Greed 72
          </p>
          <div className="mt-4 h-2 w-full rounded-full bg-white/[0.06]">
            <div
              className="h-2 rounded-full"
              style={{ width: "72%", background: "var(--gradient-action)" }}
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
