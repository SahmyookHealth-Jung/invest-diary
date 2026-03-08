export interface ClientUser {
  userId: string;
  nickname: string;
}

export function getClientUser(): ClientUser | null {
  if (typeof window === "undefined") return null;

  const userId = getCookie("user_id");
  const nickname = getCookie("user_nickname");

  if (!userId || !nickname) return null;
  return { userId, nickname };
}

function getCookie(name: string): string | null {
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const eqIdx = cookie.indexOf("=");
    if (eqIdx === -1) continue;
    const key = cookie.slice(0, eqIdx).trim();
    const val = cookie.slice(eqIdx + 1).trim();
    if (key === name) return val;
  }
  return null;
}
