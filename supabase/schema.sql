-- ============================================================
-- 미국 주식 단타 매매 일지 시스템 - Supabase SQL Schema
-- Supabase SQL Editor에 붙여넣어 실행하세요.
-- ============================================================

-- 1) tickers: 티커 심볼 캐시 (Yahoo Finance → DB 캐싱)
CREATE TABLE IF NOT EXISTS tickers (
  symbol       VARCHAR(10)  PRIMARY KEY,
  company_name VARCHAR(200) NOT NULL DEFAULT '',
  sector       VARCHAR(100) NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 2) trades: 매매 기록 (청산 완료)
CREATE TABLE IF NOT EXISTS trades (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol      VARCHAR(10)  NOT NULL REFERENCES tickers(symbol) ON DELETE CASCADE,
  entry_price NUMERIC(12,4) NOT NULL,
  exit_price  NUMERIC(12,4) NOT NULL,
  quantity    INTEGER       NOT NULL CHECK (quantity > 0),
  trade_date  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  strategy    VARCHAR(50)   NOT NULL DEFAULT 'scalping',
  notes       TEXT          NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 3) holdings: 현재 보유 종목 (미청산 포지션)
CREATE TABLE IF NOT EXISTS holdings (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol        VARCHAR(10)   NOT NULL REFERENCES tickers(symbol) ON DELETE CASCADE,
  entry_price   NUMERIC(12,4) NOT NULL,
  quantity      INTEGER       NOT NULL CHECK (quantity > 0),
  target_price  NUMERIC(12,4),
  stop_price    NUMERIC(12,4),
  strategy      VARCHAR(50)   NOT NULL DEFAULT 'scalping',
  notes         TEXT          NOT NULL DEFAULT '',
  entry_date    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 4) daily_settings: 일일 목표 수익률 / 손절 기준
CREATE TABLE IF NOT EXISTS daily_settings (
  id                 INTEGER     PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  target_profit_rate NUMERIC(5,2) NOT NULL DEFAULT 3.00,
  stop_loss_rate     NUMERIC(5,2) NOT NULL DEFAULT -2.00,
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 초기 설정 행 삽입 (싱글턴)
INSERT INTO daily_settings (id, target_profit_rate, stop_loss_rate)
VALUES (1, 3.00, -2.00)
ON CONFLICT (id) DO NOTHING;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_trades_symbol     ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_trade_date ON trades(trade_date DESC);
CREATE INDEX IF NOT EXISTS idx_tickers_sector    ON tickers(sector);
CREATE INDEX IF NOT EXISTS idx_holdings_symbol   ON holdings(symbol);

-- RLS (Row Level Security)
ALTER TABLE tickers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades         ENABLE ROW LEVEL SECURITY;
ALTER TABLE holdings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_settings ENABLE ROW LEVEL SECURITY;

-- 모든 사용자에게 전체 접근 허용 (개인 프로젝트)
CREATE POLICY "Allow all on tickers"        ON tickers        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on trades"         ON trades         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on holdings"       ON holdings       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on daily_settings" ON daily_settings FOR ALL USING (true) WITH CHECK (true);
