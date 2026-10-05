import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const schema = z.object({
  period: z.enum(["1D", "1W", "1M", "1Y"]),
  positions: z.array(z.object({
    symbol: z.string().regex(/^[A-Za-z0-9.^=-]{1,20}$/),
    name: z.string().max(80),
    quantity: z.number().positive().finite().max(1e9),
    price: z.number().positive().finite().max(1e12),
    currency: z.string().regex(/^[A-Z]{3}$/),
    changePct: z.number().finite().min(-100).max(10000),
    marketTime: z.number().finite().nullable(),
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
          const { result, runIdFetch } = analyzePortfolio(input);
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
