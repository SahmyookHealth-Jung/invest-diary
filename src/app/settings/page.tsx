"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { DailySettings } from "@/types/database";

export default function SettingsPage() {
  const [settings, setSettings] = useState<DailySettings | null>(null);
  const [targetProfit, setTargetProfit] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("daily_settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (data) {
      setSettings(data);
      setTargetProfit(String(data.target_profit_rate));
      setStopLoss(String(data.stop_loss_rate));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    const { error } = await supabase
      .from("daily_settings")
      .upsert({
        id: 1,
        target_profit_rate: parseFloat(targetProfit),
        stop_loss_rate: parseFloat(stopLoss),
        updated_at: new Date().toISOString(),
      });

    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      <h1 className="text-xl font-bold">설정</h1>

      <div className="space-y-4 rounded-2xl bg-zinc-900 p-4">
        <h2 className="text-lg font-semibold">일일 목표 & 손절 설정</h2>
        <p className="text-sm text-zinc-400">
          대시보드에서 목표 수익률 달성 / 손절 기준 도달 시 시각적 알림이
          표시됩니다.
        </p>

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1">
            목표 수익률 (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={targetProfit}
            onChange={(e) => setTargetProfit(e.target.value)}
            placeholder="3.0"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <p className="mt-1 text-xs text-zinc-500">
            일일 누적 수익률이 이 값 이상이면 목표 달성 알림 표시
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1">
            손절 기준 (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            placeholder="-2.0"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-white placeholder-zinc-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
          <p className="mt-1 text-xs text-zinc-500">
            일일 누적 손실률이 이 값 이하이면 매매 중단 경고 표시 (음수 입력)
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-xl bg-emerald-500 py-3 font-bold text-black transition-colors hover:bg-emerald-400 disabled:opacity-50"
        >
          {saving ? "저장 중..." : saved ? "✓ 저장 완료!" : "설정 저장"}
        </button>

        {settings && (
          <p className="text-center text-xs text-zinc-500">
            마지막 업데이트:{" "}
            {new Date(settings.updated_at).toLocaleString("ko-KR")}
          </p>
        )}
      </div>

      {/* 현재 설정 요약 */}
      <div className="rounded-2xl bg-zinc-900 p-4">
        <h2 className="text-lg font-semibold mb-3">현재 설정 요약</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-emerald-500/10 p-3 text-center">
            <p className="text-xs text-zinc-400">목표 수익률</p>
            <p className="text-xl font-bold text-emerald-400">
              +{targetProfit || "0"}%
            </p>
          </div>
          <div className="rounded-xl bg-red-500/10 p-3 text-center">
            <p className="text-xs text-zinc-400">손절 기준</p>
            <p className="text-xl font-bold text-red-400">
              {stopLoss || "0"}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
