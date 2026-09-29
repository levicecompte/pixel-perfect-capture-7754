import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Calls Yahoo Finance, then publishes + consumes the event through the queue. */
export const fetchYahooQuote = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ symbol: z.string().trim().min(1).max(20).regex(/^[A-Za-z0-9.^=\-]+$/) }).parse(d))
  .handler(async ({ data }) => {
    const q = await import("./yahoo-queue.server");
    const event = await q.callYahooFinance(data.symbol);
    let status: "produced" | "consumed" | "failed" | "not_published" = "not_published";
    // Queue failures never block the Yahoo response.
    if (await q.publishEvent(event)) {
      try {
        status = await q.consumeEvent(event);
      } catch (err) {
        console.warn("[yahoo-queue] consumer error", err);
        status = "produced";
      }
    }
    const { rawResponseJson: _raw, ...quote } = event;
    return { quote, status };
  });

/** Last 50 messages from the history table. */
export const listYahooHistory = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("yahoo_finance_history")
    .select("id, symbol, regular_market_price, regular_market_change, currency, volume, timestamp_appel, status, attempts, last_error, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return data ?? [];
});
