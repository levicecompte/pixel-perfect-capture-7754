import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const schema = z.object({
  period: z.enum(["1D", "1W", "1M", "1Y"]),
  positions: z.array(z.object({
    symbol: z.enum(["MC", "RMS", "AAPL", "TTE", "NVDA", "AIR", "OR", "SAN", "BNP", "BTC", "TSLA", "SU"]),
    quantity: z.number().positive().finite().max(1e9),
  })).min(1).max(20),
});

type GatewayError = Error & { statusCode?: number; responseBody?: string };
const safeMessage = (error: unknown) => {
  const e = error as GatewayError;
  try { const body = JSON.parse(e.responseBody ?? "{}"); return typeof body.message === "string" ? body.message : typeof body.error?.message === "string" ? body.error.message : e.message; }
  catch { return e?.message || "L'analyse est indisponible."; }
};

export const Route = createFileRoute("/api/analyse-portefeuille")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let input;
        try { input = schema.parse(await request.json()); }
        catch { return Response.json({ error: "Vérifiez les positions et réessayez." }, { status: 400 }); }
        try {
          const { analyzePortfolio } = await import("@/lib/ai/portfolio.server");
          const { getMarketSnapshot } = await import("@/lib/market.functions");
          const { data: quotes } = await getMarketSnapshot(input.period);
          const { POSITIONS } = await import("@/components/bourse/data");
          const enriched = input.positions.map(h => {
            const quote = quotes[h.symbol];
            const label = POSITIONS.find(p => p.ticker === h.symbol);
            if (!quote || !label) return null;
            const currency = quote.currency ?? (["AAPL", "NVDA", "BTC", "TSLA"].includes(h.symbol) ? "USD" : "EUR");
            return { symbol: h.symbol, name: label.name, quantity: h.quantity, price: quote.last, currency, changePct: quote.changePct, marketTime: quote.marketTime ?? null };
          });
          if (enriched.some(p => !p)) return Response.json({ error: "Cours Yahoo Finance indisponibles pour une ou plusieurs positions." }, { status: 503 });
          const { result, runIdFetch } = analyzePortfolio({ period: input.period, positions: enriched.filter((p): p is NonNullable<typeof p> => p !== null) }, request.signal);
          const iterator = result.textStream[Symbol.asyncIterator]();
          // Wait for the first text or an upstream error before committing response headers.
          const first = await iterator.next();
          if (first.done) return Response.json({ error: "Le modèle n'a pas renvoyé d'analyse." }, { status: 502 });
          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            async start(controller) {
              controller.enqueue(encoder.encode(first.value));
              try {
                for await (const text of { [Symbol.asyncIterator]: () => iterator }) controller.enqueue(encoder.encode(text));
                controller.close();
              } catch (error) {
                controller.error(error);
              }
            },
            cancel: () => { void iterator.return?.(); },
          });
          const headers = new Headers({ "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
          const runId = runIdFetch.getRunId();
          if (runId) headers.set("X-Lovable-AIG-Run-ID", runId);
          return new Response(stream, { headers });
        } catch (error) {
          const e = error as GatewayError;
          return Response.json({ error: safeMessage(error) }, { status: e.statusCode && e.statusCode >= 400 && e.statusCode < 600 ? e.statusCode : 502 });
        }
      },
    },
  },
});
