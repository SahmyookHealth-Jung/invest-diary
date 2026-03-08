import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";
import { signToken, setAuthCookies } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { nickname, phone_last4, password } = body as {
    nickname: string;
    phone_last4: string;
    password: string;
  };

  if (!nickname?.trim() || !phone_last4 || !password) {
    return NextResponse.json({ error: "모든 항목을 입력해주세요" }, { status: 400 });
  }
  if (!/^\d{4}$/.test(phone_last4)) {
    return NextResponse.json(
      { error: "전화번호 뒷자리는 4자리 숫자여야 합니다" },
      { status: 400 }
    );
  }
  if (!/^\d{4}$/.test(password)) {
    return NextResponse.json(
      { error: "비밀번호는 4자리 숫자여야 합니다" },
      { status: 400 }
    );
  }

  const password_hash = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from("users")
    .insert({ nickname: nickname.trim(), phone_last4, password_hash })
    .select("id, nickname")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "이미 사용 중인 별명입니다" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const token = await signToken({ userId: data.id, nickname: data.nickname });
  const res = NextResponse.json({ ok: true });
  setAuthCookies(res, token, data.id, data.nickname);
  return res;
}
