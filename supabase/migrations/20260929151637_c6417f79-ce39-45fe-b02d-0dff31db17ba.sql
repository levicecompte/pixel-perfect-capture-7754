-- File d'attente + historique des appels Yahoo Finance (équivalent Kafka intégré)
CREATE TABLE public.yahoo_finance_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key text NOT NULL UNIQUE, -- symbol + timestamp
  symbol text NOT NULL,
  regular_market_price numeric,
  regular_market_change numeric,
  currency text,
  market_cap numeric,
  volume numeric,
  timestamp_appel timestamptz NOT NULL,
  raw_response_json jsonb,
  status text NOT NULL DEFAULT 'produced' CHECK (status IN ('produced','consumed','failed')),
  attempts int NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  consumed_at timestamptz
);
GRANT SELECT ON public.yahoo_finance_history TO anon, authenticated;
GRANT ALL ON public.yahoo_finance_history TO service_role;
ALTER TABLE public.yahoo_finance_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read history" ON public.yahoo_finance_history FOR SELECT TO anon, authenticated USING (true);
CREATE INDEX yfh_created_idx ON public.yahoo_finance_history (created_at DESC);

-- Dead letter queue
CREATE TABLE public.yahoo_finance_dlq (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key text,
  payload jsonb,
  error text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.yahoo_finance_dlq TO service_role;
ALTER TABLE public.yahoo_finance_dlq ENABLE ROW LEVEL SECURITY;