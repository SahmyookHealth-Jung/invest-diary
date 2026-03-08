"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ nickname: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "로그인에 실패했습니다");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* 로고 */}
        <div className="text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 mb-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-8 h-8 text-emerald-400"
            >
              <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75ZM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 0 1-1.875-1.875V8.625ZM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 0 1 3 19.875v-6.75Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Trading Diary</h1>
          <p className="mt-1 text-sm text-zinc-500">미국 주식 단타 매매 일지</p>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              별명
            </label>
            <input
              type="text"
              required
              autoComplete="username"
              value={form.nickname}
              onChange={(e) => setForm({ ...form, nickname: e.target.value })}
              placeholder="가입 시 사용한 별명"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              비밀번호 (4자리)
            </label>
            <input
              type="password"
              required
              inputMode="numeric"
              maxLength={4}
              autoComplete="current-password"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value.replace(/\D/g, "").slice(0, 4) })
              }
              placeholder="0000"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-500 tracking-[0.5em] focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !form.nickname || form.password.length !== 4}
            className="w-full rounded-xl bg-emerald-500 py-3.5 font-bold text-black transition-colors hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-500">
          계정이 없으신가요?{" "}
          <Link href="/signup" className="text-emerald-400 font-medium hover:text-emerald-300">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
