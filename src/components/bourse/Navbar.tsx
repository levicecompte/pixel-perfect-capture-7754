import { TICKER_ITEMS } from "./data";

function TickerRow() {
  return (
    <div className="flex shrink-0 items-center gap-8 pr-8">
      {TICKER_ITEMS.map((item) => {
        const up = item.change >= 0;
        return (
          <div key={item.label} className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {item.label}
            </span>
            <span className="font-mono text-xs font-semibold text-foreground">{item.value}</span>
            <span
              className="animate-neon-pulse font-mono text-[11px] font-bold"
              style={{ color: up ? "var(--neon-emerald)" : "var(--neon-red)" }}
            >
              {up ? "▲" : "▼"} {up ? "+" : ""}
              {item.change.toFixed(2)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function Navbar() {
  return (
    <header className="sticky top-4 z-50 px-4">
      <nav className="glass mx-auto flex h-16 max-w-7xl items-center gap-4 rounded-full px-4 sm:px-6">
        <a
          href="#top"
          className="font-display text-lg font-bold tracking-tight text-foreground sm:text-xl"
        >
          BOURSE<span style={{ color: "var(--neon-cyan)" }}>.</span>
        </a>

        <div className="relative hidden flex-1 overflow-hidden md:block">
          <div className="flex w-max animate-ticker">
            <TickerRow />
            <TickerRow />
          </div>
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-16"
            style={{ background: "linear-gradient(90deg,#0b1020,transparent)" }}
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-16"
            style={{ background: "linear-gradient(270deg,#0b1020,transparent)" }}
          />
        </div>

        <button
          type="button"
          className="btn-neon ml-auto rounded-full px-5 py-2.5 text-sm md:ml-0"
        >
          Dashboard
        </button>
      </nav>
    </header>
  );
}

export function MobileNav() {
  const items = ["Marchés", "Positions", "Alertes", "Profil"];
  return (
    <nav className="glass fixed inset-x-4 bottom-4 z-50 flex items-center justify-around rounded-full px-2 py-3 md:hidden">
      {items.map((label, i) => (
        <button
          key={label}
          type="button"
          className="px-3 text-[11px] uppercase tracking-[0.14em]"
          style={{ color: i === 0 ? "var(--neon-cyan)" : "var(--muted-foreground)" }}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
