import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const MARKET_SYMBOLS = {
  CAC: "^FCHI", SPX: "^GSPC", NDX: "^IXIC", VIX: "^VIX",
  AAPL: "AAPL", NVDA: "NVDA", MC: "MC.PA", TSLA: "TSLA", BTC: "BTC-USD",
  RMS: "RMS.PA", TTE: "TTE.PA", AIR: "AIR.PA", OR: "OR.PA", SAN: "SAN.PA", BNP: "BNP.PA", SU: "SU.PA",
  STOXX: "^STOXX50E", GOLD: "GC=F", USDEUR: "USDEUR=X",
} as const;

export type MarketKey = keyof typeof MARKET_SYMBOLS;
export interface SymbolData { closes: number[]; volumes: number[]; last: number; changePct: number; currency: string | null; marketTime?: number }
export type MarketData = Partial<Record<MarketKey, SymbolData>>;

const RANGES = {
  "1D": { range: "1d", interval: "5m", ttl: 60_000 },
  "1W": { range: "5d", interval: "30m", ttl: 5 * 60_000 },
  "1M": { range: "1mo", interval: "90m", ttl: 15 * 60_000 },
  "1Y": { range: "1y", interval: "1d", ttl: 60 * 60_000 },
} as const;

// In-memory cache of the Yahoo web service, shared by all visitors of this server instance.
const cache = new Map<string, { at: number; data: MarketData }>();

async function fetchSymbol(symbol: string, range: string, interval: string): Promise<SymbolData | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`,
      { headers: { "User-Agent": "Mozilla/5.0 BOURSE." } },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      chart?: { result?: Array<{ meta?: { currency?: string; chartPreviousClose?: number; regularMarketPrice?: number; regularMarketTime?: number }; timestamp?: number[]; indicators?: { quote?: Array<{ close?: (number | null)[]; volume?: (number | null)[] }> } }> };
    };
    const r = json.chart?.result?.[0];
    const q = r?.indicators?.quote?.[0];
    const raw = q?.close ?? [];
    const closes: number[] = [];
    const volumes: number[] = [];
    raw.forEach((c, i) => {
      if (typeof c === "number") { closes.push(c); volumes.push(q?.volume?.[i] ?? 0); }
    });
    if (closes.length < 2) return null;
    const last = r?.meta?.regularMarketPrice ?? closes[closes.length - 1]!;
    const base = range === "1d" ? (r?.meta?.chartPreviousClose ?? closes[0]!) : closes[0]!;
    const marketTime = r?.meta?.regularMarketTime ?? r?.timestamp?.at(-1);
    return { closes, volumes, last, changePct: ((last - base) / base) * 100, currency: r?.meta?.currency ?? null, ...(marketTime === undefined ? {} : { marketTime }) };
  } catch {
    return null;
  }
}

export async function getMarketSnapshot(tf: keyof typeof RANGES) {
    const cfg = RANGES[tf];
    const hit = cache.get(tf);
    if (hit && Date.now() - hit.at < cfg.ttl) return { data: hit.data, cachedAt: hit.at, cached: true };
    const entries = await Promise.all(
      (Object.keys(MARKET_SYMBOLS) as MarketKey[]).map(async (k) => [k, await fetchSymbol(MARKET_SYMBOLS[k], cfg.range, cfg.interval)] as const),
    );
    const result: MarketData = {};
    for (const [k, v] of entries) if (v) result[k] = v;
    if (Object.keys(result).length === 0 && hit) return { data: hit.data, cachedAt: hit.at, cached: true }; // stale fallback
    const at = Date.now();
    if (Object.keys(result).length) cache.set(tf, { at, data: result });
    return { data: result, cachedAt: at, cached: false };
}

export const getMarketData = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ tf: z.enum(["1D", "1W", "1M", "1Y"]) }).parse(d))
  .handler(async ({ data }) => getMarketSnapshot(data.tf));
