-- ============================================================
-- 인증 기능 추가 마이그레이션
-- Supabase SQL Editor에서 실행하세요 (기존 schema.sql 이후 실행)
-- ============================================================

-- 1. users 테이블 생성
CREATE TABLE IF NOT EXISTS users (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname      VARCHAR(50)  NOT NULL UNIQUE,
  phone_last4   CHAR(4)      NOT NULL,
  password_hash TEXT         NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on users" ON users FOR ALL USING (true) WITH CHECK (true);

-- 2. trades에 user_id 추가
ALTER TABLE trades ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);

-- 3. holdings에 user_id 추가
ALTER TABLE holdings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_holdings_user_id ON holdings(user_id);

-- 4. daily_settings 재구성 (싱글턴 → 사용자별)
DROP TABLE IF EXISTS daily_settings;
CREATE TABLE daily_settings (
  user_id            UUID         PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  target_profit_rate NUMERIC(5,2) NOT NULL DEFAULT 3.00,
  stop_loss_rate     NUMERIC(5,2) NOT NULL DEFAULT -2.00,
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE daily_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on daily_settings" ON daily_settings FOR ALL USING (true) WITH CHECK (true);
