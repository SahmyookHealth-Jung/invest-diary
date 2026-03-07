import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Yahoo Finance v8 무료 엔드포인트로 티커 정보 조회
async function fetchTickerFromYahoo(symbol: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    next: { revalidate: 0 },
  });

  if (!res.ok) return null;

  const data = await res.json();
  const meta = data?.chart?.result?.[0]?.meta;
  if (!meta) return null;

  return {
    symbol: meta.symbol?.toUpperCase() ?? symbol.toUpperCase(),
    company_name: meta.longName ?? meta.shortName ?? symbol.toUpperCase(),
    sector: meta.sector ?? "",
  };
}

// GET: 캐시된 티커 검색 (드롭다운용)
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.toUpperCase() ?? "";

  if (q.length < 1) {
    return NextResponse.json([]);
  }

  const { data, error } = await supabase
    .from("tickers")
    .select("*")
    .ilike("symbol", `${q}%`)
    .order("symbol")
    .limit(10);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

// POST: 티커 조회 → DB에 없으면 Yahoo에서 가져와 캐싱
export async function POST(request: NextRequest) {
  const body = await request.json();
  const symbol = (body.symbol as string)?.toUpperCase().trim();

  if (!symbol) {
    return NextResponse.json(
      { error: "symbol is required" },
      { status: 400 }
    );
  }

  // 1. DB 캐시 확인
  const { data: cached } = await supabase
    .from("tickers")
    .select("*")
    .eq("symbol", symbol)
    .single();

  if (cached) {
    return NextResponse.json(cached);
  }

  // 2. Yahoo Finance에서 조회
  const yahoo = await fetchTickerFromYahoo(symbol);

  if (!yahoo) {
    return NextResponse.json(
      { error: `Ticker "${symbol}" not found` },
      { status: 404 }
    );
  }

  // 3. DB에 캐싱
  const { data: inserted, error } = await supabase
    .from("tickers")
    .insert({
      symbol: yahoo.symbol,
      company_name: yahoo.company_name,
      sector: yahoo.sector,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(inserted, { status: 201 });
}
