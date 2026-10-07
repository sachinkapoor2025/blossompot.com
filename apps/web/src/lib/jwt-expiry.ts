/** Seconds of clock skew allowed before treating a JWT as expired. */
const SKEW_SECONDS = 60;

function decodeJwtPayload(token: string): { exp?: number } | null {
  const parts = token.split(".");
  if (parts.length < 2 || !parts[1]) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const json =
      typeof atob === "function"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json) as { exp?: number };
  } catch {
    return null;
  }
}

/** True when the ID token is missing, malformed, or past `exp` (with skew). Dev tokens never expire. */
export function isAuthTokenExpired(token: string | null | undefined, nowSeconds = Math.floor(Date.now() / 1000)): boolean {
  const value = (token ?? "").trim();
  if (!value) return true;
  if (value.startsWith("dev:")) return false;
  const payload = decodeJwtPayload(value);
  if (!payload || typeof payload.exp !== "number") return true;
  return payload.exp <= nowSeconds + SKEW_SECONDS;
}
