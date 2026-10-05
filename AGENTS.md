<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Yahoo Finance queue is a Kafka-equivalent in Lovable Cloud (tables yahoo_finance_history + yahoo_finance_dlq, src/lib/yahoo-queue.*) — Kafka can't run on the Worker runtime.
- Market data per timeframe comes from Yahoo Finance via getMarketData (src/lib/market.functions.ts) with a per-timeframe server memory cache + React Query; fake data in data.ts is only a fallback — keeps the page usable if Yahoo is down.
- Portfolio values convert USD quotes to EUR with Yahoo's USD/EUR quote from the shared market response; without a valid rate, leave the EUR total unavailable rather than mix currencies.
