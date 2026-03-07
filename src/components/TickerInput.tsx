"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { Ticker } from "@/types/database";

interface TickerInputProps {
  value: string;
  onChange: (symbol: string) => void;
  onTickerResolved?: (ticker: Ticker) => void;
}

export default function TickerInput({
  value,
  onChange,
  onTickerResolved,
}: TickerInputProps) {
  const [suggestions, setSuggestions] = useState<Ticker[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchTickers = useCallback(async (query: string) => {
    if (query.length < 1) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`/api/tickers?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSuggestions(Array.isArray(data) ? data : []);
      setIsOpen(true);
    } catch {
      setSuggestions([]);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    onChange(val);
    setError("");

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchTickers(val), 200);
  };

  const handleSelect = (ticker: Ticker) => {
    onChange(ticker.symbol);
    onTickerResolved?.(ticker);
    setIsOpen(false);
    setError("");
  };

  const handleBlur = async () => {
    setTimeout(async () => {
      if (!value.trim()) return;

      const matched = suggestions.find((s) => s.symbol === value.trim());
      if (matched) {
        onTickerResolved?.(matched);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/tickers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symbol: value.trim() }),
        });

        if (!res.ok) {
          const err = await res.json();
          setError(err.error || "티커를 찾을 수 없습니다");
          return;
        }

        const ticker: Ticker = await res.json();
        onTickerResolved?.(ticker);
      } catch {
        setError("네트워크 오류가 발생했습니다");
      } finally {
        setLoading(false);
      }
    }, 150);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-sm font-medium text-zinc-400 mb-1">
        티커 (심볼)
      </label>
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => value.length >= 1 && setIsOpen(true)}
        onBlur={handleBlur}
        placeholder="예: AAPL, TSLA"
        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      />
      {loading && (
        <div className="absolute right-3 top-9">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((t) => (
            <li
              key={t.symbol}
              onMouseDown={() => handleSelect(t)}
              className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-zinc-700"
            >
              <span className="font-mono font-bold text-emerald-400">
                {t.symbol}
              </span>
              <span className="text-xs text-zinc-400 truncate ml-2">
                {t.sector || t.company_name}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
