"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import TickerInput from "@/components/TickerInput";
import type { Trade, Ticker } from "@/types/database";
import { STRATEGY_LABELS, type Strategy } from "@/types/database";

function formatCurrency(v: number) {
  return v.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

const INITIAL_FORM = {
  symbol: "",
  entry_price: "",
  exit_price: "",
  quantity: "",
  strategy: "scalping" as Strategy,
  notes: "",
};

export default function TradesPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resolvedTicker, setResolvedTicker] = useState<Ticker | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTrades = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("trades")
      .select("*")
      .order("trade_date", { ascending: false })
      .limit(50);
    setTrades(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  const [formError, setFormError] = useState("");

  const resolveTicker = async (symbol: string): Promise<Ticker | null> => {
    const trimmed = symbol.trim().toUpperCase();
    if (!trimmed) return null;
    try {
      const res = await fetch("/api/tickers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: trimmed }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    let ticker = resolvedTicker;

    if (!ticker && form.symbol.trim()) {
      setSubmitting(true);
      ticker = await resolveTicker(form.symbol);
      if (ticker) setResolvedTicker(ticker);
    }

    if (!ticker) {
      setFormError("유효한 티커를 입력해주세요. (예: AAPL, TSLA)");
      setSubmitting(false);
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("trades").insert({
      symbol: ticker.symbol,
      entry_price: parseFloat(form.entry_price),
      exit_price: parseFloat(form.exit_price),
      quantity: parseInt(form.quantity, 10),
      strategy: form.strategy,
      notes: form.notes,
      trade_date: new Date().toISOString(),
    });

    if (error) {
      setFormError(`저장 실패: ${error.message}`);
    } else {
      setForm(INITIAL_FORM);
      setResolvedTicker(null);
      setShowForm(false);
      fetchTrades();
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 매매 기록을 삭제할까요?")) return;
    await supabase.from("trades").delete().eq("id", id);
    fetchTrades();
  };

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">매매 일지</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-emerald-400"
        >
          {showForm ? "취소" : "+ 기록 추가"}
        </button>
      </div>

      {/* 입력 폼 */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="space-y-3 rounded-2xl bg-zinc-900 p-4"
        >
          <TickerInput
            value={form.symbol}
            onChange={(v) => setForm({ ...form, symbol: v })}
            onTickerResolved={(t) => {
              setResolvedTicker(t);
              setForm((prev) => ({ ...prev, symbol: t.symbol }));
            }}
          />

          {resolvedTicker && (
            <div className="rounded-lg bg-zinc-800 px-3 py-2 text-xs text-zinc-400">
              <span className="font-semibold text-emerald-400">
                {resolvedTicker.company_name}
              </span>
              {resolvedTicker.sector && (
                <span className="ml-2">· {resolvedTicker.sector}</span>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                진입가 ($)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={form.entry_price}
                onChange={(e) =>
                  setForm({ ...form, entry_price: e.target.value })
                }
                placeholder="0.00"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                청산가 ($)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={form.exit_price}
                onChange={(e) =>
                  setForm({ ...form, exit_price: e.target.value })
                }
                placeholder="0.00"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              수량 (주)
            </label>
            <input
              type="number"
              required
              min={1}
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              placeholder="0"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              매매 전략
            </label>
            <select
              value={form.strategy}
              onChange={(e) =>
                setForm({ ...form, strategy: e.target.value as Strategy })
              }
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {(Object.entries(STRATEGY_LABELS) as [Strategy, string][]).map(
                ([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              메모
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="매매 근거, 복기 내용 등"
              rows={3}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
            />
          </div>

          {form.entry_price && form.exit_price && form.quantity && (
            <div className="rounded-lg bg-zinc-800 p-3">
              <p className="text-xs text-zinc-500">예상 손익</p>
              {(() => {
                const pnl =
                  (parseFloat(form.exit_price) - parseFloat(form.entry_price)) *
                  parseInt(form.quantity);
                const rate =
                  ((parseFloat(form.exit_price) -
                    parseFloat(form.entry_price)) /
                    parseFloat(form.entry_price)) *
                  100;
                return (
                  <p
                    className={`text-lg font-bold ${
                      pnl >= 0 ? "text-profit" : "text-loss"
                    }`}
                  >
                    {formatCurrency(pnl)} ({rate >= 0 ? "+" : ""}
                    {rate.toFixed(2)}%)
                  </p>
                );
              })()}
            </div>
          )}

          {formError && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !form.symbol.trim()}
            className="w-full rounded-xl bg-emerald-500 py-3 font-bold text-black transition-colors hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "저장 중..." : "매매 기록 저장"}
          </button>
        </form>
      )}

      {/* 매매 기록 목록 */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
        </div>
      ) : trades.length === 0 ? (
        <div className="rounded-xl bg-zinc-900 p-8 text-center">
          <p className="text-zinc-500">매매 기록이 없습니다</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {trades.map((trade) => {
            const pnl =
              (trade.exit_price - trade.entry_price) * trade.quantity;
            const rate =
              ((trade.exit_price - trade.entry_price) / trade.entry_price) *
              100;
            return (
              <li
                key={trade.id}
                className="rounded-xl bg-zinc-900 p-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-emerald-400">
                      {trade.symbol}
                    </span>
                    <span className="ml-2 text-xs text-zinc-500">
                      x{trade.quantity}
                    </span>
                    <span className="ml-2 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
                      {STRATEGY_LABELS[trade.strategy as Strategy] ??
                        trade.strategy}
                    </span>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold ${
                        pnl >= 0 ? "text-profit" : "text-loss"
                      }`}
                    >
                      {formatCurrency(pnl)}
                    </p>
                    <p
                      className={`text-xs ${
                        rate >= 0 ? "text-profit" : "text-loss"
                      }`}
                    >
                      {rate >= 0 ? "+" : ""}
                      {rate.toFixed(2)}%
                    </p>
                  </div>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-zinc-500">
                  <span>
                    {formatCurrency(trade.entry_price)} →{" "}
                    {formatCurrency(trade.exit_price)}
                  </span>
                  <span>
                    {new Date(trade.trade_date).toLocaleDateString("ko-KR", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                {trade.notes && (
                  <p className="mt-1 text-xs text-zinc-400 line-clamp-2">
                    {trade.notes}
                  </p>
                )}
                <button
                  onClick={() => handleDelete(trade.id)}
                  className="mt-2 text-xs text-red-400 hover:text-red-300"
                >
                  삭제
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
