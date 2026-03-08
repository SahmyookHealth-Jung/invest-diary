"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getClientUser } from "@/lib/clientAuth";

export default function AppHeader() {
  const [nickname, setNickname] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const user = getClientUser();
    if (user) setNickname(user.nickname);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  if (!nickname) return null;

  return (
    <header className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800/60 bg-zinc-950">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-emerald-400" />
        <span className="text-sm text-zinc-400">
          <span className="text-emerald-400 font-semibold">{nickname}</span>님의 매매 일지
        </span>
      </div>
      <button
        onClick={handleLogout}
        className="rounded-lg px-2.5 py-1 text-xs text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
      >
        로그아웃
      </button>
    </header>
  );
}
