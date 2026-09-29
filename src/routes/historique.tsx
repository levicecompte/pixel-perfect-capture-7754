import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Backdrop } from "@/components/bourse/Backdrop";
import { fetchYahooQuote, listYahooHistory } from "@/lib/yahoo-queue.functions";

const historyQuery = queryOptions({ queryKey: ["yahoo-history"], queryFn: () => listYahooHistory() });

export const Route = createFileRoute("/historique")({
  head: () => ({
    meta: [
      { title: "Historique Yahoo Finance Queue — BOURSE." },
      { name: "description", content: "Les 50 derniers messages de la file Yahoo Finance avec leur statut." },
      { property: "og:title", content: "Historique Yahoo Finance Queue — BOURSE." },
      { property: "og:description", content: "Suivi en direct de la file d'attente des cotations Yahoo Finance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(historyQuery),
  component: HistoryPage,
  errorComponent: ({ error }) => <p className="p-10 text-center">Erreur : {error.message}</p>,
  notFoundComponent: () => <p className="p-10 text-center">Introuvable</p>,
});

const STATUS_STYLE: Record<string, string> = {
  consumed: "text-[color:var(--neon-emerald)] border-[color:var(--neon-emerald)]/40",
  produced: "text-[color:var(--neon-cyan)] border-[color:var(--neon-cyan)]/40",
  failed: "text-[color:var(--neon-red)] border-[color:var(--neon-red)]/40",
};

function HistoryPage() {
  const { data: rows } = useSuspenseQuery(historyQuery);
  const qc = useQueryClient();
  const call = useServerFn(fetchYahooQuote);
  const [symbol, setSymbol] = useState("AAPL");
  const m = useMutation({
    mutationFn: (s: string) => call({ data: { symbol: s } }),
    onSettled: () => qc.invalidateQueries({ queryKey: ["yahoo-history"] }),
  });

  return (
    <div className="relative min-h-screen px-4 py-10">
      <Backdrop />
      <div className="relative mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← BOURSE.</Link>
            <h1 className="font-display text-4xl font-bold text-title-gradient">Historique Yahoo Finance Queue</h1>
            <p className="text-sm text-muted-foreground">50 derniers messages · statut produced / consumed / failed</p>
          </div>
          <form
            className="glass flex items-center gap-2 rounded-full p-1.5"
            onSubmit={(e) => { e.preventDefault(); m.mutate(symbol); }}
          >
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              className="w-28 bg-transparent px-3 font-mono text-sm outline-none"
              placeholder="AAPL"
              aria-label="Symbole"
            />
            <button disabled={m.isPending} className="btn-neon rounded-full px-4 py-2 text-sm">
              {m.isPending ? "Appel…" : "Appeler Yahoo"}
            </button>
          </form>
        </div>

        {m.data && (
          <div className="glass rounded-2xl p-4 font-mono text-sm">
            {m.data.quote.symbol} · {m.data.quote.regularMarketPrice} {m.data.quote.currency} · file : <b>{m.data.status}</b>
          </div>
        )}
        {m.error && <div className="glass rounded-2xl p-4 text-sm text-[color:var(--neon-red)]">{m.error.message}</div>}

        <div className="glass overflow-x-auto rounded-3xl">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-muted-foreground">
              <tr>{["Symbole", "Prix", "Var.", "Volume", "Horodatage", "Essais", "Statut"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
            </thead>
            <tbody className="font-mono">
              {rows.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Aucun message — lancez un appel ci-dessus.</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-white/[0.06]" title={r.last_error ?? ""}>
                  <td className="px-4 py-3 font-bold">{r.symbol}</td>
                  <td className="px-4 py-3">{r.regular_market_price ?? "—"} {r.currency}</td>
                  <td className={`px-4 py-3 ${Number(r.regular_market_change) >= 0 ? "text-[color:var(--neon-emerald)]" : "text-[color:var(--neon-red)]"}`}>{r.regular_market_change ?? "—"}</td>
                  <td className="px-4 py-3">{r.volume != null ? Number(r.volume).toLocaleString("fr-FR") : "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(r.timestamp_appel).toLocaleString("fr-FR")}</td>
                  <td className="px-4 py-3">{r.attempts}</td>
                  <td className="px-4 py-3"><span className={`rounded-full border px-2 py-0.5 text-xs ${STATUS_STYLE[r.status] ?? ""}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
