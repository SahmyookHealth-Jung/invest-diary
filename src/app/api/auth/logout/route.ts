import { NextResponse } from "next/server";
import { COOKIE_AUTH } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE_AUTH);
  res.cookies.delete("user_id");
  res.cookies.delete("user_nickname");
  return res;
}
