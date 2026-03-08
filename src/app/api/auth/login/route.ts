import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";
import { signToken, setAuthCookies } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { nickname, password } = body as { nickname: string; password: string };

  if (!nickname?.trim() || !password) {
    return NextResponse.json({ error: "별명과 비밀번호를 입력해주세요" }, { status: 400 });
  }

  const { data: user } = await supabase
    .from("users")
    .select("id, nickname, password_hash")
    .eq("nickname", nickname.trim())
    .single();

  if (!user) {
    return NextResponse.json(
      { error: "별명 또는 비밀번호가 올바르지 않습니다" },
      { status: 401 }
    );
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return NextResponse.json(
      { error: "별명 또는 비밀번호가 올바르지 않습니다" },
      { status: 401 }
    );
  }

  const token = await signToken({ userId: user.id, nickname: user.nickname });
  const res = NextResponse.json({ ok: true });
  setAuthCookies(res, token, user.id, user.nickname);
  return res;
}
