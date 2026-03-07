"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Trade, DailySettings } from "@/types/database";

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export default function DashboardPage() {
  const [todayTrades, setTodayTrades] = useState<Trade[]>([]);
  const [settings, setSettings] = useState<DailySettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [tradesRes, settingsRes] = await Promise.all([
      supabase
        .from("trades")
        .select("*")
        .gte("trade_date", todayStart.toISOString())
        .lte("trade_date", todayEnd.toISOString())
        .order("created_at", { ascending: false }),
      supabase.from("daily_settings").select("*").eq("id", 1).single(),
    ]);

    setTodayTrades(tradesRes.data ?? []);
    setSettings(settingsRes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPnL = todayTrades.reduce((sum, t) => {
    return sum + (t.exit_price - t.entry_price) * t.quantity;
  }, 0);

  const totalInvested = todayTrades.reduce((sum, t) => {
    return sum + t.entry_price * t.quantity;
  }, 0);

  const dailyReturnRate = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  const targetReached =
    settings && dailyReturnRate >= settings.target_profit_rate;
  const stopLossReached =
    settings && dailyReturnRate <= settings.stop_loss_rate;

  const winTrades = todayTrades.filter(
    (t) => t.exit_price > t.entry_price
  ).length;
  const loseTrades = todayTrades.filter(
    (t) => t.exit_price < t.entry_price
  ).length;
  const winRate =
    todayTrades.length > 0
      ? ((winTrades / todayTrades.length) * 100).toFixed(1)
      : "0.0";

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      <h1 className="text-xl font-bold">오늘의 매매 현황</h1>
      <p className="text-sm text-zinc-500">
        {new Date().toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "long",
          day: "numeric",
          weekday: "long",
        })}
      </p>

      {/* 알림 배너 */}
      {targetReached && (
        <div className="animate-alert-pulse rounded-xl border-2 border-emerald-400 bg-emerald-400/10 p-4 text-center">
          <p className="text-lg font-bold text-emerald-400">
            🎯 일일 목표 수익률 달성!
          </p>
          <p className="text-sm text-emerald-300 mt-1">
            목표 {formatPercent(settings!.target_profit_rate)} → 현재{" "}
            {formatPercent(dailyReturnRate)}
          </p>
        </div>
      )}
      {stopLossReached && (
        <div className="animate-alert-pulse rounded-xl border-2 border-red-400 bg-red-400/10 p-4 text-center">
          <p className="text-lg font-bold text-red-400">
            🚨 손절 기준 도달! 매매를 중단하세요
          </p>
          <p className="text-sm text-red-300 mt-1">
            손절 기준 {formatPercent(settings!.stop_loss_rate)} → 현재{" "}
            {formatPercent(dailyReturnRate)}
          </p>
        </div>
      )}

      {/* 수익 요약 카드 */}
      <div
        className={`rounded-2xl p-5 ${
          totalPnL >= 0 ? "bg-profit" : "bg-loss"
        }`}
      >
        <p className="text-sm text-zinc-400">오늘의 총 손익</p>
        <p
          className={`text-3xl font-bold mt-1 ${
            totalPnL >= 0 ? "text-profit" : "text-loss"
          }`}
        >
          {formatCurrency(totalPnL)}
        </p>
        <p
          className={`text-lg font-medium ${
            dailyReturnRate >= 0 ? "text-profit" : "text-loss"
          }`}
        >
          {formatPercent(dailyReturnRate)}
        </p>
      </div>

      {/* 통계 그리드 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-zinc-900 p-3 text-center">
          <p className="text-xs text-zinc-500">총 거래</p>
          <p className="text-xl font-bold mt-1">{todayTrades.length}</p>
        </div>
        <div className="rounded-xl bg-zinc-900 p-3 text-center">
          <p className="text-xs text-zinc-500">승률</p>
          <p className="text-xl font-bold mt-1 text-emerald-400">{winRate}%</p>
        </div>
        <div className="rounded-xl bg-zinc-900 p-3 text-center">
          <p className="text-xs text-zinc-500">승 / 패</p>
          <p className="text-xl font-bold mt-1">
            <span className="text-emerald-400">{winTrades}</span>
            <span className="text-zinc-600"> / </span>
            <span className="text-red-400">{loseTrades}</span>
          </p>
        </div>
      </div>

      {/* 오늘의 매매 목록 */}
      <div>
        <h2 className="text-lg font-semibold mb-2">오늘의 매매</h2>
        {todayTrades.length === 0 ? (
          <div className="rounded-xl bg-zinc-900 p-8 text-center">
            <p className="text-zinc-500">아직 오늘의 매매 기록이 없습니다</p>
            <a
              href="/trades"
              className="mt-3 inline-block text-sm font-medium text-emerald-400"
            >
              매매 기록 추가하기 →
            </a>
          </div>
        ) : (
          <ul className="space-y-2">
            {todayTrades.map((trade) => {
              const pnl =
                (trade.exit_price - trade.entry_price) * trade.quantity;
              const pnlRate =
                ((trade.exit_price - trade.entry_price) / trade.entry_price) *
                100;
              return (
                <li
                  key={trade.id}
                  className="flex items-center justify-between rounded-xl bg-zinc-900 p-3"
                >
                  <div>
                    <span className="font-mono font-bold text-emerald-400">
                      {trade.symbol}
                    </span>
                    <span className="ml-2 text-xs text-zinc-500">
                      x{trade.quantity}
                    </span>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {formatCurrency(trade.entry_price)} →{" "}
                      {formatCurrency(trade.exit_price)}
                    </p>
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
                        pnlRate >= 0 ? "text-profit" : "text-loss"
                      }`}
                    >
                      {formatPercent(pnlRate)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
