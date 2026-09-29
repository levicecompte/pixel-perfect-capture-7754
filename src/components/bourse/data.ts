// Fake but realistic market data for the BOURSE. terminal.

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function series(seed: number, count: number, start: number, end: number, vol = 0.006) {
  const rnd = mulberry32(seed);
  const out: number[] = [];
  let value = start;
  for (let i = 0; i < count; i++) {
    const drift = (end - start) / count;
    value = value + drift + (rnd() - 0.5) * start * vol;
    out.push(value);
  }
  out[out.length - 1] = end;
  return out;
}

export function toPath(values: number[], width: number, height: number, pad = 4) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = pad + (1 - (v - min) / span) * (height - pad * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

export const CAC_SERIES = series(7, 120, 7400, 8142.23, 0.007);
export const SP_SERIES = series(21, 120, 5480, 5789.4, 0.006);

export const TIMEFRAMES = ["1D", "1W", "1M", "1Y"] as const;

export const TICKER_ITEMS = [
  { label: "CAC 40", value: "8 142.23", change: 0.84 },
  { label: "S&P 500", value: "5 789.10", change: 0.32 },
  { label: "NASDAQ", value: "18 234.60", change: -0.12 },
  { label: "BTC", value: "67 342.00", change: 2.14 },
  { label: "EURO STOXX", value: "5 012.44", change: 0.41 },
  { label: "OR", value: "2 386.70", change: -0.28 },
];

export const TOP_MOVERS = [
  { ticker: "AAPL", name: "Apple", price: "228.41", change: 1.62, seed: 3 },
  { ticker: "NVDA", name: "Nvidia", price: "132.87", change: 3.94, seed: 11 },
  { ticker: "MC", name: "LVMH", price: "641.20", change: -0.87, seed: 19 },
  { ticker: "TSLA", name: "Tesla", price: "254.03", change: -1.42, seed: 27 },
  { ticker: "BTC", name: "Bitcoin", price: "67 342", change: 2.14, seed: 35 },
];

export const POSITIONS = [
  { ticker: "MC", name: "LVMH", price: "641.20", d24: -0.87, value: "128 240", pnl: 8.42, seed: 5 },
  { ticker: "RMS", name: "Hermès", price: "2 154.00", d24: 0.54, value: "107 700", pnl: 21.08, seed: 13 },
  { ticker: "AAPL", name: "Apple", price: "228.41", d24: 1.62, value: "91 364", pnl: 14.77, seed: 23 },
  { ticker: "TTE", name: "TotalEnergies", price: "62.18", d24: -0.31, value: "62 180", pnl: -3.11, seed: 31 },
  { ticker: "NVDA", name: "Nvidia", price: "132.87", d24: 3.94, value: "53 148", pnl: 46.92, seed: 41 },
  { ticker: "AIR", name: "Airbus", price: "146.72", d24: 0.22, value: "44 016", pnl: 5.63, seed: 47 },
  { ticker: "OR", name: "L'Oréal", price: "381.55", d24: -0.64, value: "38 155", pnl: -1.24, seed: 53 },
  { ticker: "SAN", name: "Sanofi", price: "98.44", d24: 0.18, value: "29 532", pnl: 2.86, seed: 59 },
  { ticker: "BNP", name: "BNP Paribas", price: "61.09", d24: 1.04, value: "24 436", pnl: 9.51, seed: 67 },
  { ticker: "BTC", name: "Bitcoin", price: "67 342", d24: 2.14, value: "20 202", pnl: 63.4, seed: 71 },
  { ticker: "TSLA", name: "Tesla", price: "254.03", d24: -1.42, value: "15 241", pnl: -7.88, seed: 79 },
  { ticker: "SU", name: "Schneider", price: "231.80", d24: 0.76, value: "11 590", pnl: 12.34, seed: 83 },
];

export const CITIES = [
  { name: "Paris", x: 49, y: 31 },
  { name: "New York", x: 26, y: 36 },
  { name: "Tokyo", x: 84, y: 38 },
  { name: "Londres", x: 47, y: 28 },
];

// Sparse dot-map grid approximating world landmasses (x%, y%).
export const WORLD_DOTS: Array<[number, number]> = (() => {
  const rnd = mulberry32(99);
  const blobs = [
    { cx: 22, cy: 32, rx: 10, ry: 14 }, // north america
    { cx: 31, cy: 62, rx: 6, ry: 13 }, // south america
    { cx: 48, cy: 28, rx: 7, ry: 7 }, // europe
    { cx: 52, cy: 52, rx: 8, ry: 14 }, // africa
    { cx: 68, cy: 34, rx: 14, ry: 12 }, // asia
    { cx: 84, cy: 70, rx: 6, ry: 5 }, // oceania
  ];
  const dots: Array<[number, number]> = [];
  for (const b of blobs) {
    const n = Math.round(b.rx * b.ry * 1.6);
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2;
      const r = Math.sqrt(rnd());
      const x = b.cx + Math.cos(a) * r * b.rx;
      const y = b.cy + Math.sin(a) * r * b.ry;
      dots.push([Math.round(x * 2) / 2, Math.round(y * 2) / 2]);
    }
  }
  return dots;
})();
