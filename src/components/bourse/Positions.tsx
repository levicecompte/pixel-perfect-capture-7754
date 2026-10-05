import { motion } from "motion/react";
import { POSITIONS } from "./data";
import { Sparkline } from "./Sparkline";
import { fmt, useMarket, useTimeframe } from "./useMarket";
import type { MarketKey } from "@/lib/market.functions";

const num = (s: string) => parseFloat(s.replace(/\s/g, ""));
const dollarPositions = new Set(["AAPL", "NVDA", "BTC", "TSLA"]);

export function Positions() {
  const { data: market } = useMarket();
  const { tf } = useTimeframe();
  const dollarToEuro = market?.data.USDEUR?.last;
  const validRate = dollarToEuro !== undefined && Number.isFinite(dollarToEuro) && dollarToEuro > 0;
  const rows = POSITIONS.map((p) => {
    const live = market?.data[p.ticker as MarketKey];
    const qty = num(p.value) / num(p.price);
    const price = live?.last ?? num(p.price);
    const currency = live?.currency ?? (dollarPositions.has(p.ticker) ? "USD" : "EUR");
    const rate = currency === "EUR" ? 1 : currency === "USD" && validRate ? dollarToEuro : null;
    const value = rate === null ? null : qty * price * rate;
    const closes = live?.closes;
    const d24 = closes && closes.length > 1 && tf === "1D" ? live.changePct : p.d24;
    return { ...p, price, value, d24, pnl: live?.changePct ?? p.pnl, closes, cur: currency, demo: !live };
  });
  const total = rows.every((r) => r.value !== null) ? rows.reduce((a, r) => a + (r.value ?? 0), 0) : null;
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-28 md:pb-16">
      <motion.div
        initial={{ opacity: 0, filter: "blur(10px)", y: 24 }}
        whileInView={{ opacity: 1, filter: "blur(0px)", y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7 }}
        className="glass rounded-3xl p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl font-bold tracking-tight">
            Positions <span className="text-muted-foreground">• 12 actifs</span>
          </h2>
          <span className="font-mono text-xs text-muted-foreground">
            Valeur totale <span className="text-foreground">{total === null ? "—" : `${fmt(total, 0)} €`}</span>
          </span>
        </div>
        <p className="mt-2 font-mono text-[11px] text-muted-foreground">
          {validRate
            ? `Conversion Yahoo Finance · 1 USD = ${fmt(dollarToEuro, 4)} EUR`
            : "Taux USD/EUR indisponible · total en euros temporairement indisponible"}
        </p>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[720px] border-separate border-spacing-y-1 text-left">
            <thead className="sticky top-0 backdrop-blur-xl">
              <tr className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                <th className="px-3 py-3 font-normal">Actif</th>
                <th className="px-3 py-3 font-normal">Prix</th>
                <th className="px-3 py-3 font-normal">24h</th>
                <th className="px-3 py-3 font-normal">Valeur</th>
                <th className="px-3 py-3 font-normal">Tendance</th>
                <th className="px-3 py-3 text-right font-normal">Var. {tf}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const up24 = p.d24 >= 0;
                const upPnl = p.pnl >= 0;
                return (
                  <tr key={p.ticker} className="group transition-colors hover:bg-white/[0.03]">
                    <td className="rounded-l-2xl px-3 py-3">
                      <div className="flex items-center gap-3">
                        <span className="glass flex h-8 w-8 items-center justify-center rounded-lg font-display text-xs font-bold">
                          {p.ticker[0]}
                        </span>
                        <div>
                          <p className="font-mono text-sm font-bold">{p.ticker}{p.demo && <span className="ml-2 text-[10px] font-normal text-danger">DÉMO</span>}</p>
                          <p className="text-[11px] text-muted-foreground">{p.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-sm">{fmt(p.price)} {p.cur === "EUR" ? "€" : p.cur === "USD" ? "$" : p.cur}</td>
                    <td
                      className="px-3 py-3 font-mono text-sm"
                      style={{ color: up24 ? "var(--neon-emerald)" : "var(--neon-red)" }}
                    >
                      {up24 ? "+" : ""}
                      {p.d24.toFixed(2)}%
                    </td>
                    <td className="px-3 py-3 font-mono text-sm">{p.value === null ? "—" : `${fmt(p.value, 0)} €`}</td>
                    <td className="px-3 py-3">
                      <Sparkline seed={p.seed} up={upPnl} values={p.closes} />
                    </td>
                    <td
                      className="rounded-r-2xl px-3 py-3 text-right font-mono text-sm font-semibold"
                      style={{ color: upPnl ? "var(--neon-emerald)" : "var(--neon-red)" }}
                    >
                      {upPnl ? "+" : ""}
                      {p.pnl.toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      <footer className="mt-10 flex flex-col items-center gap-2 text-center">
        <p className="font-display text-sm font-bold">
          BOURSE<span style={{ color: "var(--neon-cyan)" }}>.</span>
        </p>
        <p className="text-[11px] text-muted-foreground">
          Cours Yahoo Finance selon disponibilité ; valeurs signalées DÉMO = données de démonstration. Aucun conseil en investissement.
        </p>
      </footer>
    </section>
  );
}
