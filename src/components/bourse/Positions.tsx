import { motion } from "motion/react";
import { POSITIONS } from "./data";
import { Sparkline } from "./Sparkline";

export function Positions() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-28 md:pb-16">
      <motion.div
        initial={{ opacity: 0, filter: "blur(10px)", y: 24 }}
        whileInView={{ opacity: 1, filter: "blur(0px)", y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7 }}
        className="glass rounded-3xl p-5 sm:p-6"
      >
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl font-bold tracking-tight">
            Positions <span className="text-muted-foreground">• 12 actifs</span>
          </h2>
          <span className="font-mono text-xs text-muted-foreground">
            Valeur totale <span className="text-foreground">625 804 €</span>
          </span>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[720px] border-separate border-spacing-y-1 text-left">
            <thead className="sticky top-0 backdrop-blur-xl">
              <tr className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                <th className="px-3 py-3 font-normal">Actif</th>
                <th className="px-3 py-3 font-normal">Prix</th>
                <th className="px-3 py-3 font-normal">24h</th>
                <th className="px-3 py-3 font-normal">Valeur</th>
                <th className="px-3 py-3 font-normal">Tendance</th>
                <th className="px-3 py-3 text-right font-normal">P&amp;L</th>
              </tr>
            </thead>
            <tbody>
              {POSITIONS.map((p) => {
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
                          <p className="font-mono text-sm font-bold">{p.ticker}</p>
                          <p className="text-[11px] text-muted-foreground">{p.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-sm">{p.price} €</td>
                    <td
                      className="px-3 py-3 font-mono text-sm"
                      style={{ color: up24 ? "var(--neon-emerald)" : "var(--neon-red)" }}
                    >
                      {up24 ? "+" : ""}
                      {p.d24.toFixed(2)}%
                    </td>
                    <td className="px-3 py-3 font-mono text-sm">{p.value} €</td>
                    <td className="px-3 py-3">
                      <Sparkline seed={p.seed} up={upPnl} />
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
          Données de démonstration — aucun conseil en investissement.
        </p>
      </footer>
    </section>
  );
}
