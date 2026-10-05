import { createContext, useContext } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMarketData } from "@/lib/market.functions";
import type { TIMEFRAMES } from "./data";

export type Timeframe = (typeof TIMEFRAMES)[number];

export const TimeframeContext = createContext<{ tf: Timeframe; setTf: (t: Timeframe) => void }>({
  tf: "1M",
  setTf: () => {},
});

export function useTimeframe() {
  return useContext(TimeframeContext);
}

export function useMarket() {
  const { tf } = useTimeframe();
  const fn = useServerFn(getMarketData);
  return useQuery({
    queryKey: ["market", tf],
    queryFn: () => fn({ data: { tf } }),
    staleTime: tf === "1D" ? 60_000 : 5 * 60_000,
    placeholderData: keepPreviousData,
  });
}

export const fmt = (n: number, d = 2) =>
  n.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });
