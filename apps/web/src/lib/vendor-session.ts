const TOKEN_KEY = "bp_marketplace_vendor_token";

export function getVendorToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setVendorToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearVendorToken() {
  localStorage.removeItem(TOKEN_KEY);
}
