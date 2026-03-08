"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nickname: "",
    phone_last4: "",
    password: "",
    password_confirm: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.password_confirm) {
      setError("비밀번호가 일치하지 않습니다");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nickname: form.nickname,
        phone_last4: form.phone_last4,
        password: form.password,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "회원가입에 실패했습니다");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  const numericOnly = (val: string, max: number) =>
    val.replace(/\D/g, "").slice(0, max);

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
          <h1 className="text-2xl font-bold text-white">회원가입</h1>
          <p className="mt-1 text-sm text-zinc-500">Trading Diary 계정 만들기</p>
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
              placeholder="사용할 별명을 입력하세요"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              전화번호 뒷자리 (4자리)
            </label>
            <input
              type="text"
              required
              inputMode="numeric"
              value={form.phone_last4}
              onChange={(e) =>
                setForm({ ...form, phone_last4: numericOnly(e.target.value, 4) })
              }
              placeholder="0000"
              maxLength={4}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-500 tracking-[0.5em] focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              비밀번호 (4자리 숫자)
            </label>
            <input
              type="password"
              required
              inputMode="numeric"
              maxLength={4}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: numericOnly(e.target.value, 4) })
              }
              placeholder="0000"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-500 tracking-[0.5em] focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              비밀번호 확인
            </label>
            <input
              type="password"
              required
              inputMode="numeric"
              maxLength={4}
              autoComplete="new-password"
              value={form.password_confirm}
              onChange={(e) =>
                setForm({
                  ...form,
                  password_confirm: numericOnly(e.target.value, 4),
                })
              }
              placeholder="0000"
              className={`w-full rounded-xl border px-4 py-3 text-white placeholder-zinc-500 tracking-[0.5em] focus:outline-none focus:ring-1 bg-zinc-900 ${
                form.password_confirm && form.password !== form.password_confirm
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-zinc-700 focus:border-emerald-500 focus:ring-emerald-500"
              }`}
            />
            {form.password_confirm && form.password !== form.password_confirm && (
              <p className="mt-1 text-xs text-red-400">비밀번호가 일치하지 않습니다</p>
            )}
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={
              loading ||
              !form.nickname ||
              form.phone_last4.length !== 4 ||
              form.password.length !== 4 ||
              form.password !== form.password_confirm
            }
            className="w-full rounded-xl bg-emerald-500 py-3.5 font-bold text-black transition-colors hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "가입 중..." : "회원가입"}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-500">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="text-emerald-400 font-medium hover:text-emerald-300">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
