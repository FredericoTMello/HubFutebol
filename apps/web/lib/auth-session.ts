export const TOKEN_STORAGE_KEY = "hubfutebol_token";
export const USER_STORAGE_KEY = "hubfutebol_user";
export const TOKEN_COOKIE_KEY = "hubfutebol_token";

export function getCookieValue(cookieHeader: string, key: string): string | null {
  const cookie = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${key}=`));

  if (!cookie) return null;
  return decodeURIComponent(cookie.slice(key.length + 1));
}

export function buildTokenCookie(token: string): string {
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  return `${TOKEN_COOKIE_KEY}=${encodeURIComponent(token)}; Path=/; Max-Age=2592000; SameSite=Lax${secure}`;
}

export function buildExpiredTokenCookie(): string {
  return `${TOKEN_COOKIE_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
}
