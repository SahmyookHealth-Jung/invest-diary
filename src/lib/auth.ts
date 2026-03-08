import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "fallback-secret-please-set-env"
);

export interface AuthPayload extends JWTPayload {
  userId: string;
  nickname: string;
}

export async function signToken(payload: {
  userId: string;
  nickname: string;
}): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as AuthPayload;
  } catch {
    return null;
  }
}

export const COOKIE_AUTH = "auth_token";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

/** 로그인/회원가입 응답에 인증 쿠키 세팅 */
export function setAuthCookies(
  res: { cookies: { set: (name: string, value: string, opts: object) => void } },
  token: string,
  userId: string,
  nickname: string
) {
  const isProd = process.env.NODE_ENV === "production";
  const opts = {
    secure: isProd,
    sameSite: "lax" as const,
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  };

  res.cookies.set(COOKIE_AUTH, token, { ...opts, httpOnly: true });
  // 클라이언트에서 읽을 수 있게 httpOnly: false로 분리 저장
  res.cookies.set("user_id", userId, { ...opts, httpOnly: false });
  res.cookies.set("user_nickname", nickname, {
    ...opts,
    httpOnly: false,
  });
}
