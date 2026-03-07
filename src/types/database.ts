export interface Ticker {
  symbol: string;
  company_name: string;
  sector: string;
  created_at: string;
}

export interface Trade {
  id: string;
  symbol: string;
  entry_price: number;
  exit_price: number;
  quantity: number;
  trade_date: string;
  strategy: string;
  notes: string;
  created_at: string;
}

export interface Holding {
  id: string;
  symbol: string;
  entry_price: number;
  quantity: number;
  target_price: number | null;
  stop_price: number | null;
  strategy: string;
  notes: string;
  entry_date: string;
  created_at: string;
}

export interface DailySettings {
  id: number;
  target_profit_rate: number;
  stop_loss_rate: number;
  updated_at: string;
}

export type Strategy =
  | "scalping"
  | "breakout"
  | "momentum"
  | "reversal"
  | "gap_fill"
  | "vwap"
  | "orb"
  | "other";

export const STRATEGY_LABELS: Record<Strategy, string> = {
  scalping: "스캘핑",
  breakout: "돌파 매매",
  momentum: "모멘텀",
  reversal: "역추세",
  gap_fill: "갭 메우기",
  vwap: "VWAP",
  orb: "시초가 레인지 돌파(ORB)",
  other: "기타",
};
