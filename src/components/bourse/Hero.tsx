import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { series, toPath } from "./data";

const HERO_SERIES = series(101, 60, 60, 160, 0.09);

function HeroChart() {
  const d = toPath(HERO_SERIES, 600, 220, 10);
  return (
    <svg viewBox="0 0 600 220" className="h-full w-full" aria-hidden="true">
      <path
        d={d}
        fill="none"
        stroke="var(--neon-cyan)"
        strokeWidth={2}
        strokeLinecap="round"
        className="neon-line"
        style={{
          color: "var(--neon-cyan)",
          strokeDasharray: 2400,
          strokeDashoffset: 2400,
          animation: "dash-draw 4s ease-out forwards, neon-pulse 5s ease-in-out infinite 4s",
        }}
      />
      <path d={`${d} L600,220 L0,220 Z`} fill="url(#heroFill)" opacity={0.35} />
      <defs>
        <linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function Candles() {
  const bars = Array.from({ length: 22 }, (_, i) => {
    const h = 20 + ((i * 37) % 70) + i * 2.2;
    const up = (i * 7) % 3 !== 0;
    return { i, h, up };
  });
  return (
    <svg viewBox="0 0 400 160" className="h-full w-full" aria-hidden="true">
      {bars.map(({ i, h, up }) => {
        const color = up ? "#00FF94" : "#FF3B30";
        const x = i * 18 + 6;
        return (
          <g key={i} style={{ color }} className="neon-line">
            <line x1={x + 4} y1={158 - h - 10} x2={x + 4} y2={158 - h + 12} stroke={color} strokeWidth={1} />
            <rect
              x={x}
              y={158 - h}
              width={8}
              height={h * 0.6}
              rx={1.5}
              fill={color}
              fillOpacity={0.35}
              stroke={color}
              strokeWidth={1}
            />
          </g>
        );
      })}
    </svg>
  );
}

function Particles() {
  return (
    <div className="absolute inset-0">
      {Array.from({ length: 20 }, (_, i) => (
        <span
          key={i}
          className="absolute h-1.5 w-1.5 rounded-full bg-white/60 blur-[2px]"
          style={{
            left: `${(i * 37) % 96}%`,
            top: `${(i * 53) % 88}%`,
            animation: `float-y ${5 + (i % 6)}s ease-in-out ${i * 0.24}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function GlassBull() {
  return (
    <svg viewBox="0 0 320 300" className="h-full w-full" aria-hidden="true">
      <g fill="rgba(255,255,255,0.05)" stroke="rgba(0,229,255,0.35)" strokeWidth="1">
        <polygon points="60,210 110,150 150,200 100,250" />
        <polygon points="110,150 175,120 200,185 150,200" />
        <polygon points="175,120 235,100 250,160 200,185" />
        <polygon points="235,100 280,70 295,120 250,160" />
        <polygon points="280,70 300,30 320,80 295,120" />
        <polygon points="235,100 262,55 280,70" />
        <polygon points="150,200 200,185 205,250 165,255" />
        <polygon points="100,250 150,200 165,255 120,275" />
        <polygon points="200,185 250,160 245,225 205,250" />
        <polygon points="60,210 100,250 70,265 45,235" />
      </g>
      <g fill="rgba(0,229,255,0.10)" stroke="rgba(0,229,255,0.5)" strokeWidth="1">
        <polygon points="300,30 316,12 322,34" />
        <polygon points="262,55 252,26 276,40" />
      </g>
      <ellipse cx="170" cy="282" rx="120" ry="12" fill="rgba(0,229,255,0.12)" />
    </svg>
  );
}

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yChart = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const yBull = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const opacity = useTransform(scrollYProgress, [0, 0.9], [1, 0]);

  return (
    <section
      ref={ref}
      id="top"
      className="relative flex min-h-[90vh] items-center overflow-hidden px-4 pt-10"
    >
      <motion.div style={{ opacity }} className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-1/3 top-1/4 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full blur-[120px]"
          style={{ background: "rgba(0,229,255,0.18)" }}
        />
        <Particles />
        <motion.div
          style={{ y: yChart }}
          className="absolute inset-x-0 top-[28%] mx-auto h-64 max-w-5xl opacity-70"
        >
          <HeroChart />
        </motion.div>
        <motion.div
          style={{ y: yChart }}
          className="absolute bottom-6 left-0 h-40 w-full max-w-md opacity-60 md:left-10"
        >
          <Candles />
        </motion.div>
        <motion.div
          style={{ y: yBull }}
          className="absolute right-0 top-1/2 hidden h-[24rem] w-[24rem] -translate-y-1/2 lg:block"
        >
          <GlassBull />
        </motion.div>
      </motion.div>

      <div className="relative mx-auto w-full max-w-7xl py-24">
        <motion.span
          initial={{ opacity: 0, filter: "blur(10px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.6 }}
          className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] uppercase tracking-[0.22em] text-muted-foreground"
        >
          <span
            className="animate-neon-pulse h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--neon-emerald)" }}
          />
          Marchés ouverts • Temps réel
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, filter: "blur(10px)", y: 16 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-title-gradient mt-8 font-display text-[3.2rem] font-bold leading-[0.95] tracking-tight sm:text-7xl lg:text-[96px]"
        >
          La Bourse,
          <br />
          enfin belle.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, filter: "blur(10px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="mt-6 max-w-lg text-lg text-muted-foreground"
        >
          Trading terminal inspiré du futur.
        </motion.p>

      </div>
    </section>
  );
}
