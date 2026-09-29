/**
 * Yahoo Finance queue — Kafka-equivalent pipeline backed by Lovable Cloud.
 *
 * Topic   "yahoo-finance-quotes"     -> table yahoo_finance_history (status column)
 * DLQ     "yahoo-finance-quotes-dlq" -> table yahoo_finance_dlq
 * Producer: publishEvent()  (never throws: Yahoo call is never blocked)
 * Consumer: consumeEvent()  (3 attempts, exponential backoff, idempotent key)
 */

export const TOPIC = "yahoo-finance-quotes";
export const DLQ_TOPIC = "yahoo-finance-quotes-dlq";

/** DTO published on the queue. */
export interface YahooFinanceQuoteEvent {
  symbol: string;
  regularMarketPrice: number | null;
  regularMarketChange: number | null;
  currency: string | null;
  marketCap: number | null;
  volume: number | null;
  timestampAppel: string; // ISO
  rawResponseJson: unknown;
}

const log = {
  info: (...a: unknown[]) => console.info("[yahoo-queue]", ...a),
  warn: (...a: unknown[]) => console.warn("[yahoo-queue]", ...a),
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Idempotency key: symbol + timestamp. */
export const keyOf = (e: YahooFinanceQuoteEvent) => `${e.symbol}:${e.timestampAppel}`;

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Calls Yahoo Finance (chart endpoint, no key required) and maps to the DTO. */
export async function callYahooFinance(symbol: string): Promise<YahooFinanceQuoteEvent> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 BOURSE." } });
  if (!res.ok) throw new Error(`Yahoo Finance HTTP ${res.status}`);
  const json = (await res.json()) as {
    chart?: { result?: Array<{ meta?: Record<string, unknown>; indicators?: { quote?: Array<{ volume?: (number | null)[] }> } }>; error?: { description?: string } };
  };
  const result = json.chart?.result?.[0];
  if (!result?.meta) throw new Error(json.chart?.error?.description ?? "Symbole introuvable");
  const m = result.meta as Record<string, number | string | undefined>;
  const price = typeof m.regularMarketPrice === "number" ? m.regularMarketPrice : null;
  const prev = typeof m.chartPreviousClose === "number" ? m.chartPreviousClose : null;
  const vols = result.indicators?.quote?.[0]?.volume ?? [];
  const lastVol = [...vols].reverse().find((v) => typeof v === "number") ?? null;
  const ts = typeof m.regularMarketTime === "number" ? new Date(m.regularMarketTime * 1000) : new Date();
  return {
    symbol: String(m.symbol ?? symbol).toUpperCase(),
    regularMarketPrice: price,
    regularMarketChange: price != null && prev != null ? +(price - prev).toFixed(4) : null,
    currency: (m.currency as string) ?? null,
    marketCap: typeof m.marketCap === "number" ? m.marketCap : null,
    volume: (typeof m.regularMarketVolume === "number" ? m.regularMarketVolume : lastVol) as number | null,
    timestampAppel: ts.toISOString(),
    rawResponseJson: json,
  };
}

/** Producer — writes the event with status "produced". Never throws. */
export async function publishEvent(e: YahooFinanceQuoteEvent): Promise<boolean> {
  try {
    const db = await admin();
    const { error } = await db.from("yahoo_finance_history").upsert(
      {
        idempotency_key: keyOf(e),
        symbol: e.symbol,
        regular_market_price: e.regularMarketPrice,
        regular_market_change: e.regularMarketChange,
        currency: e.currency,
        market_cap: e.marketCap,
        volume: e.volume,
        timestamp_appel: e.timestampAppel,
        raw_response_json: e.rawResponseJson as never,
        status: "produced",
      },
      { onConflict: "idempotency_key", ignoreDuplicates: true },
    );
    if (error) throw error;
    log.info(`Published to ${TOPIC}: ${e.symbol}`);
    return true;
  } catch (err) {
    log.warn(`Queue unavailable, event not published for ${e.symbol}`, err); // fallback: Yahoo result still returned
    return false;
  }
}

/** Consumer — validates and marks the event "consumed"; retries 3x, then DLQ. */
export async function consumeEvent(e: YahooFinanceQuoteEvent): Promise<"consumed" | "failed"> {
  const key = keyOf(e);
  const db = await admin();
  let lastError = "";
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      // "Deserialization" check — malformed payloads go to the DLQ.
      if (!e.symbol || e.regularMarketPrice == null) throw new Error("Payload invalide : prix manquant");
      const { error } = await db
        .from("yahoo_finance_history")
        .update({ status: "consumed", attempts: attempt, consumed_at: new Date().toISOString(), last_error: null })
        .eq("idempotency_key", key)
        .neq("status", "consumed"); // idempotent
      if (error) throw error;
      return "consumed";
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      log.warn(`Consume attempt ${attempt}/3 failed for ${key}: ${lastError}`);
      if (attempt < 3) await sleep(200 * 2 ** (attempt - 1)); // 200, 400 ms
    }
  }
  await db.from("yahoo_finance_history").update({ status: "failed", attempts: 3, last_error: lastError }).eq("idempotency_key", key);
  await db.from("yahoo_finance_dlq").insert({ idempotency_key: key, payload: { ...e, rawResponseJson: undefined } as never, error: lastError });
  log.warn(`Sent to ${DLQ_TOPIC}: ${key}`);
  return "failed";
}
