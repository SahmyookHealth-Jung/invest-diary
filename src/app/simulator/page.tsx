"use client";

import { useState } from "react";
import {
  tradingDaysInMonths,
  calcDailyRateNeeded,
  forecastBalances,
} from "@/lib/dateUtils";

function formatKRW(v: number) {
  if (v >= 100_000_000) {
    return `${(v / 100_000_000).toFixed(2)}억원`;
  }
  if (v >= 10_000) {
    return `${Math.round(v / 10_000).toLocaleString("ko-KR")}만원`;
  }
  return `${Math.round(v).toLocaleString("ko-KR")}원`;
}

function formatKRWFull(v: number) {
  return `${Math.round(v).toLocaleString("ko-KR")}원`;
}

type Tab = "goal" | "compound";

export default function SimulatorPage() {
  const [activeTab, setActiveTab] = useState<Tab>("goal");

  // 목표 역산기
  const [seed, setSeed] = useState("");
  const [target, setTarget] = useState("");
  const [months, setMonths] = useState("3");
  const [goalResult, setGoalResult] = useState<{
    tradingDays: number;
    dailyRate: number;
  } | null>(null);

  // 복리 예측기
  const [compSeed, setCompSeed] = useState("");
  const [dailyRate, setDailyRate] = useState("");
  const [compResult, setCompResult] = useState<
    { months: number; tradingDays: number; balance: number }[] | null
  >(null);

  const handleGoalCalc = () => {
    const s = parseFloat(seed);
    const t = parseFloat(target);
    const m = parseInt(months, 10);
    if (!s || !t || !m) return;

    const td = tradingDaysInMonths(m);
    const rate = calcDailyRateNeeded(s, t, td);
    setGoalResult({ tradingDays: td, dailyRate: rate * 100 });
  };

  const handleCompoundCalc = () => {
    const s = parseFloat(compSeed);
    const r = parseFloat(dailyRate);
    if (!s || !r) return;

    const results = forecastBalances(s, r);
    setCompResult(results);
  };

  return (
    <div className="space-y-4 py-4">
      <h1 className="text-xl font-bold">복리 & 목표 시뮬레이터</h1>

      {/* 탭 전환 */}
      <div className="flex rounded-xl bg-zinc-900 p-1">
        <button
          onClick={() => setActiveTab("goal")}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
            activeTab === "goal"
              ? "bg-emerald-500 text-black"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          목표 역산기
        </button>
        <button
          onClick={() => setActiveTab("compound")}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
            activeTab === "compound"
              ? "bg-emerald-500 text-black"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          복리 예측기
        </button>
      </div>

      {/* 목표 역산기 */}
      {activeTab === "goal" && (
        <div className="space-y-4 rounded-2xl bg-zinc-900 p-4">
          <p className="text-sm text-zinc-400">
            현재 시드에서 목표 금액까지 도달하려면 개장일 기준 하루에 몇 % 수익이
            필요한지 계산합니다. (주말·미국 휴장일 자동 제외)
          </p>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              현재 시드 (원)
            </label>
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="예: 10000000"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {seed && (
              <p className="mt-1 text-xs text-zinc-500">
                = {formatKRW(parseFloat(seed))}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              목표 금액 (원)
            </label>
            <input
              type="number"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="예: 100000000"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {target && (
              <p className="mt-1 text-xs text-zinc-500">
                = {formatKRW(parseFloat(target))}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              목표 기간 (개월)
            </label>
            <select
              value={months}
              onChange={(e) => setMonths(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {[1, 2, 3, 6, 9, 12, 18, 24].map((m) => (
                <option key={m} value={m}>
                  {m}개월
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGoalCalc}
            className="w-full rounded-xl bg-emerald-500 py-3 font-bold text-black transition-colors hover:bg-emerald-400"
          >
            계산하기
          </button>

          {goalResult && (
            <div className="space-y-3 rounded-xl bg-zinc-800 p-4">
              <div className="text-center">
                <p className="text-sm text-zinc-400">일일 필요 수익률</p>
                <p className="text-4xl font-bold text-emerald-400 mt-1">
                  +{goalResult.dailyRate.toFixed(4)}%
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-700">
                <div className="text-center">
                  <p className="text-xs text-zinc-500">실제 개장일 수</p>
                  <p className="text-lg font-bold">{goalResult.tradingDays}일</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-zinc-500">목표 수익률</p>
                  <p className="text-lg font-bold text-emerald-400">
                    {(
                      ((parseFloat(target) - parseFloat(seed)) /
                        parseFloat(seed)) *
                      100
                    ).toFixed(1)}
                    %
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-700">
                <p className="text-xs text-zinc-500 text-center">
                  {formatKRW(parseFloat(seed))} →{" "}
                  {formatKRW(parseFloat(target))} 달성을 위해
                  <br />
                  매일 <strong className="text-emerald-400">+{goalResult.dailyRate.toFixed(4)}%</strong>씩{" "}
                  <strong>{goalResult.tradingDays}일</strong> 연속 복리 수익 필요
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 복리 예측기 */}
      {activeTab === "compound" && (
        <div className="space-y-4 rounded-2xl bg-zinc-900 p-4">
          <p className="text-sm text-zinc-400">
            일일 수익률을 꾸준히 달성했을 때 시드가 어떻게 불어나는지 복리로
            시뮬레이션합니다. (개장일 기준)
          </p>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              현재 시드 (원)
            </label>
            <input
              type="number"
              value={compSeed}
              onChange={(e) => setCompSeed(e.target.value)}
              placeholder="예: 10000000"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {compSeed && (
              <p className="mt-1 text-xs text-zinc-500">
                = {formatKRW(parseFloat(compSeed))}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              목표 일일 수익률 (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={dailyRate}
              onChange={(e) => setDailyRate(e.target.value)}
              placeholder="2.0"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <button
            onClick={handleCompoundCalc}
            className="w-full rounded-xl bg-emerald-500 py-3 font-bold text-black transition-colors hover:bg-emerald-400"
          >
            시뮬레이션
          </button>

          {compResult && (
            <div className="space-y-3">
              {compResult.map((r) => {
                const seedNum = parseFloat(compSeed);
                const profit = r.balance - seedNum;
                const growth = (profit / seedNum) * 100;
                const maxGrowth =
                  compResult[compResult.length - 1]
                    ? ((compResult[compResult.length - 1].balance - seedNum) / seedNum) * 100
                    : 100;
                return (
                  <div
                    key={r.months}
                    className="rounded-xl bg-zinc-800 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-400">
                        {r.months}개월 후
                      </span>
                      <span className="text-xs text-zinc-500">
                        {r.tradingDays} 개장일
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">
                      {formatKRW(r.balance)}
                    </p>
                    <p className="text-sm text-zinc-400">
                      {formatKRWFull(r.balance)}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-zinc-700 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                          style={{
                            width: `${Math.min((growth / maxGrowth) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-emerald-400 font-semibold whitespace-nowrap">
                        +{growth.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">
                      수익: +{formatKRW(profit)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
