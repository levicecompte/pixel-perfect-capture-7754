import { useEffect, useState } from "react";
import { ArrowRight, Plus, Sparkles, Trash2, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { POSITIONS, TIMEFRAMES } from "./data";
import { fmt, useMarket, useTimeframe } from "./useMarket";
import type { MarketKey } from "@/lib/market.functions";

type Holding = { id: number; symbol: string; quantity: string };
const symbols = POSITIONS.map(p => ({ key: p.ticker as MarketKey, name: p.name }));

export function PortfolioAnalysis() {
  const { tf, setTf } = useTimeframe();
  const { data: market, isFetching } = useMarket();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [nextId, setNextId] = useState(1);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [analyzedPeriod, setAnalyzedPeriod] = useState<string | null>(null);
  const [controller, setController] = useState<AbortController | null>(null);

  const add = () => { setHoldings(prev => [...prev, { id: nextId, symbol: "MC", quantity: "" }]); setNextId(v => v + 1); };
  const update = (id: number, patch: Partial<Holding>) => setHoldings(prev => prev.map(h => h.id === id ? { ...h, ...patch } : h));
  const stop = () => { controller?.abort(); setPending(false); setController(null); };
  useEffect(() => () => controller?.abort(), [controller]);
  const canAnalyze = holdings.length > 0 && !pending && !isFetching && holdings.every(h => {
    const n = Number(h.quantity);
    return Number.isFinite(n) && n > 0 && n <= 1e9 && !!market?.data[h.symbol as MarketKey];
  });

  const analyze = async () => {
    if (!canAnalyze) return;
    const positions = holdings.map(h => ({ symbol: h.symbol, quantity: Number(h.quantity) }));
    const abort = new AbortController();
    setController(abort);
    setPending(true); setError(""); setAnswer(""); setAnalyzedPeriod(tf);
    try {
      const response = await fetch("/api/analyse-portefeuille", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ period: tf, positions }), signal: abort.signal });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(typeof payload.error === "string" ? payload.error : "L'analyse est indisponible.");
      }
      if (!response.body) throw new Error("Aucune réponse reçue.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        setAnswer(prev => prev + decoder.decode(value, { stream: true }));
      }
      setAnswer(prev => prev + decoder.decode());
    } catch (e) {
      if (!abort.signal.aborted) setError(e instanceof Error ? e.message : "L'analyse est indisponible.");
    } finally {
      setPending(false); setController(null);
    }
  };

  return (
    <div id="analyse" className="mt-10 border-t border-border pt-9">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 font-mono text-xs uppercase text-cyan"><Sparkles size={15} /> Analyse IA</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-foreground">Votre portefeuille, en perspective.</h2>
        </div>
        <div className="flex items-center gap-1 rounded-md border border-border bg-secondary p-1" aria-label="Période d'analyse">
          {TIMEFRAMES.map(t => <Button key={t} type="button" size="sm" variant={tf === t ? "default" : "ghost"} className="h-8 px-2.5 font-mono" onClick={() => { stop(); setTf(t); setAnswer(""); setError(""); setAnalyzedPeriod(null); }}>{t}</Button>)}
        </div>
      </div>
      <div className="mt-6 space-y-2">
        {holdings.map((h, index) => {
          const quote = market?.data[h.symbol as MarketKey];
          return <div key={h.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,110px)_36px] items-center gap-2 rounded-md border border-border bg-secondary p-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,150px)_minmax(0,170px)_36px]">
            <select aria-label={`Actif ${index + 1}`} value={h.symbol} onChange={e => update(h.id, { symbol: e.target.value })} className="min-w-0 rounded-md bg-background px-2 py-2 text-sm text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring">
              {symbols.map(s => <option value={s.key} key={s.key}>{s.key} · {s.name}</option>)}
            </select>
            <Input aria-label={`Quantité ${index + 1}`} type="number" inputMode="decimal" min="0.000001" max="1000000000" step="any" placeholder="Quantité" value={h.quantity} onChange={e => update(h.id, { quantity: e.target.value })} className="h-9 min-w-0 bg-background font-mono" />
            <span className="hidden truncate text-right font-mono text-xs text-muted-foreground sm:block">{quote ? `${fmt(quote.last)} ${quote.currency ?? ""}` : "Cours indisponible"}</span>
            <Button aria-label={`Retirer ${h.symbol}`} title="Retirer la position" variant="ghost" size="icon" className="text-muted-foreground hover:text-danger" onClick={() => setHoldings(prev => prev.filter(item => item.id !== h.id))}><Trash2 /></Button>
          </div>;
        })}
        {holdings.length === 0 && <p className="border-y border-border py-6 text-sm text-muted-foreground">Aucune position ajoutée.</p>}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" onClick={add} disabled={holdings.length >= 20}><Plus /> Ajouter une position</Button>
        <Button type="button" className="btn-neon ml-auto" onClick={analyze} disabled={!canAnalyze}><Sparkles /> {pending ? "Analyse en cours…" : "Analyser"} <ArrowRight /></Button>
        {pending && <Button type="button" variant="ghost" onClick={stop}><Square /> Arrêter</Button>}
      </div>
      {!canAnalyze && holdings.length > 0 && !pending && <p className="mt-3 text-xs text-muted-foreground">Indiquez une quantité positive pour chaque position et attendez les cours Yahoo Finance disponibles.</p>}
      {error && <p role="alert" className="mt-5 border-l-2 border-danger bg-destructive/10 p-3 text-sm text-danger">{error}</p>}
      {(answer || pending) && <div className="mt-7 border-l-2 border-cyan pl-4" aria-live="polite">
        <p className="font-mono text-xs uppercase text-cyan">Synthèse · {analyzedPeriod}{pending && " · En cours…"}</p>
        <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-foreground">{answer || "Analyse des mouvements et des risques…"}</div>
      </div>}
      <p className="mt-6 text-xs text-muted-foreground">Cours Yahoo Finance selon disponibilité. Les positions saisies sont envoyées au modèle pour cette analyse uniquement. Aucun conseil en investissement.</p>
    </div>
  );
}
