"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { getClientUser } from "@/lib/clientAuth";
import TickerInput from "@/components/TickerInput";
import type { Holding, Ticker } from "@/types/database";
import { STRATEGY_LABELS, type Strategy } from "@/types/database";

function formatCurrency(v: number) {
  return v.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

function daysSince(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

const INITIAL_FORM = {
  symbol: "",
  entry_price: "",
  quantity: "",
  target_price: "",
  stop_price: "",
  strategy: "scalping" as Strategy,
  notes: "",
};

export default function HoldingsPage() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resolvedTicker, setResolvedTicker] = useState<Ticker | null>(null);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState("");

  const [sellTarget, setSellTarget] = useState<Holding | null>(null);
  const [exitPrice, setExitPrice] = useState("");

  const fetchHoldings = useCallback(async () => {
    const user = getClientUser();
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data } = await supabase
      .from("holdings")
      .select("*")
      .eq("user_id", user.userId)
      .order("entry_date", { ascending: false });
    setHoldings(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchHoldings();
  }, [fetchHoldings]);

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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const user = getClientUser();
    if (!user) return;

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
    const { error } = await supabase.from("holdings").insert({
      user_id: user.userId,
      symbol: ticker.symbol,
      entry_price: parseFloat(form.entry_price),
      quantity: parseInt(form.quantity, 10),
      target_price: form.target_price ? parseFloat(form.target_price) : null,
      stop_price: form.stop_price ? parseFloat(form.stop_price) : null,
      strategy: form.strategy,
      notes: form.notes,
      entry_date: new Date().toISOString(),
    });

    if (error) {
      setFormError(`저장 실패: ${error.message}`);
    } else {
      setForm(INITIAL_FORM);
      setResolvedTicker(null);
      setShowForm(false);
      fetchHoldings();
    }
    setSubmitting(false);
  };

  const handleSell = async () => {
    if (!sellTarget || !exitPrice) return;

    const user = getClientUser();
    if (!user) return;

    const ep = parseFloat(exitPrice);
    setSubmitting(true);

    const { error: tradeErr } = await supabase.from("trades").insert({
      user_id: user.userId,
      symbol: sellTarget.symbol,
      entry_price: sellTarget.entry_price,
      exit_price: ep,
      quantity: sellTarget.quantity,
      strategy: sellTarget.strategy,
      notes: sellTarget.notes ? `[보유→청산] ${sellTarget.notes}` : "[보유→청산]",
      trade_date: new Date().toISOString(),
    });

    if (!tradeErr) {
      await supabase.from("holdings").delete().eq("id", sellTarget.id);
      setSellTarget(null);
      setExitPrice("");
      fetchHoldings();
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 보유 종목을 삭제할까요? (매매일지에 기록되지 않습니다)")) return;
    await supabase.from("holdings").delete().eq("id", id);
    fetchHoldings();
  };

  const totalInvested = holdings.reduce((sum, h) => sum + h.entry_price * h.quantity, 0);

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">보유 종목</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-emerald-400"
        >
          {showForm ? "취소" : "+ 종목 추가"}
        </button>
      </div>

      {holdings.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-zinc-900 p-3 text-center">
            <p className="text-xs text-zinc-500">보유 종목 수</p>
            <p className="text-xl font-bold mt-1">{holdings.length}개</p>
          </div>
          <div className="rounded-xl bg-zinc-900 p-3 text-center">
            <p className="text-xs text-zinc-500">총 투자금</p>
            <p className="text-xl font-bold mt-1 text-emerald-400">
              {formatCurrency(totalInvested)}
            </p>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleAdd} className="space-y-3 rounded-2xl bg-zinc-900 p-4">
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
              <span className="font-semibold text-emerald-400">{resolvedTicker.company_name}</span>
              {resolvedTicker.sector && <span className="ml-2">· {resolvedTicker.sector}</span>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">진입가 ($)</label>
              <input
                type="number" step="0.01" required
                value={form.entry_price}
                onChange={(e) => setForm({ ...form, entry_price: e.target.value })}
                placeholder="0.00"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">수량 (주)</label>
              <input
                type="number" required min={1}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                placeholder="0"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">목표가 ($)</label>
              <input
                type="number" step="0.01"
                value={form.target_price}
                onChange={(e) => setForm({ ...form, target_price: e.target.value })}
                placeholder="선택"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">손절가 ($)</label>
              <input
                type="number" step="0.01"
                value={form.stop_price}
                onChange={(e) => setForm({ ...form, stop_price: e.target.value })}
                placeholder="선택"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-white placeholder-zinc-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">매매 전략</label>
            <select
              value={form.strategy}
              onChange={(e) => setForm({ ...form, strategy: e.target.value as Strategy })}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {(Object.entries(STRATEGY_LABELS) as [Strategy, string][]).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">메모 (매매 근거)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="진입 근거, 청산 시나리오 등"
              rows={2}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
            />
          </div>

          {formError && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{formError}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !form.symbol.trim()}
            className="w-full rounded-xl bg-emerald-500 py-3 font-bold text-black transition-colors hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "저장 중..." : "보유 종목 추가"}
          </button>
        </form>
      )}

      {/* 청산 모달 */}
      {sellTarget && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-t-2xl bg-zinc-900 p-5 space-y-4 safe-area-bottom">
            <h3 className="text-lg font-bold">
              <span className="text-emerald-400">{sellTarget.symbol}</span> 청산
            </h3>
            <div className="rounded-lg bg-zinc-800 p-3 text-sm text-zinc-400">
              <p>진입가: {formatCurrency(sellTarget.entry_price)} × {sellTarget.quantity}주</p>
              <p>투자금: {formatCurrency(sellTarget.entry_price * sellTarget.quantity)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">청산가 ($)</label>
              <input
                type="number" step="0.01" autoFocus
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              {exitPrice && (() => {
                const ep = parseFloat(exitPrice);
                const pnl = (ep - sellTarget.entry_price) * sellTarget.quantity;
                const rate = ((ep - sellTarget.entry_price) / sellTarget.entry_price) * 100;
                return (
                  <div className="mt-2 rounded-lg bg-zinc-800 p-2">
                    <p className={`text-lg font-bold ${pnl >= 0 ? "text-profit" : "text-loss"}`}>
                      {formatCurrency(pnl)} ({rate >= 0 ? "+" : ""}{rate.toFixed(2)}%)
                    </p>
                  </div>
                );
              })()}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setSellTarget(null); setExitPrice(""); }}
                className="flex-1 rounded-xl border border-zinc-700 py-3 font-semibold text-zinc-400 transition-colors hover:bg-zinc-800"
              >
                취소
              </button>
              <button
                onClick={handleSell}
                disabled={!exitPrice || submitting}
                className="flex-1 rounded-xl bg-red-500 py-3 font-bold text-white transition-colors hover:bg-red-400 disabled:opacity-50"
              >
                {submitting ? "처리 중..." : "청산 완료"}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
        </div>
      ) : holdings.length === 0 ? (
        <div className="rounded-xl bg-zinc-900 p-8 text-center">
          <p className="text-zinc-500">현재 보유 중인 종목이 없습니다</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {holdings.map((h) => {
            const invested = h.entry_price * h.quantity;
            const days = daysSince(h.entry_date);
            const isLongHold = days >= 5;
            return (
              <li key={h.id} className={`rounded-xl bg-zinc-900 p-4 ${isLongHold ? "border border-amber-500/40" : ""}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg font-bold text-emerald-400">{h.symbol}</span>
                      <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
                        {STRATEGY_LABELS[h.strategy as Strategy] ?? h.strategy}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400 mt-0.5">
                      {formatCurrency(h.entry_price)} × {h.quantity}주 ={" "}
                      <span className="text-white font-medium">{formatCurrency(invested)}</span>
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${isLongHold ? "bg-amber-500/20 text-amber-400" : "bg-zinc-800 text-zinc-400"}`}>
                    {days}일째
                  </span>
                </div>

                {(h.target_price || h.stop_price) && (
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {h.target_price && (
                      <span className="rounded-lg bg-emerald-500/10 px-2 py-1 text-xs text-emerald-400">
                        목표 {formatCurrency(h.target_price)}
                        <span className="text-emerald-500/60 ml-1">
                          (+{(((h.target_price - h.entry_price) / h.entry_price) * 100).toFixed(1)}%)
                        </span>
                      </span>
                    )}
                    {h.stop_price && (
                      <span className="rounded-lg bg-red-500/10 px-2 py-1 text-xs text-red-400">
                        손절 {formatCurrency(h.stop_price)}
                        <span className="text-red-500/60 ml-1">
                          ({(((h.stop_price - h.entry_price) / h.entry_price) * 100).toFixed(1)}%)
                        </span>
                      </span>
                    )}
                  </div>
                )}

                {h.notes && <p className="mt-2 text-xs text-zinc-400 line-clamp-2">{h.notes}</p>}
                {isLongHold && (
                  <p className="mt-1 text-xs text-amber-400">⚠ {days}일째 보유 중 — 단타 기준 점검이 필요합니다</p>
                )}

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setSellTarget(h)}
                    className="flex-1 rounded-lg bg-emerald-500 py-2 text-sm font-bold text-black transition-colors hover:bg-emerald-400"
                  >
                    청산하기
                  </button>
                  <button
                    onClick={() => handleDelete(h.id)}
                    className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800"
                  >
                    삭제
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
