import {
  GBO_UPSTREAM_BASE_URL,
  gboCategorySchema,
  gboCountrySchema,
  gboCreateOrderResponseSchema,
  gboCreateOrderSchema,
  gboGiftSchema,
  gboOrderDetailsSchema,
  type GboCategory,
  type GboCountry,
  type GboCreateOrderInput,
  type GboGift,
  type GboOrderDetails,
} from "@blossompot/shared";

const REQUEST_TIMEOUT_MS = 20_000;

export class GboClientError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status = 502, details?: unknown) {
    super(message);
    this.name = "GboClientError";
    this.status = status;
    this.details = details;
  }
}

export type GboClientConfig = {
  token?: string;
  baseUrl?: string;
  sandbox?: boolean;
  authScheme?: string;
};

function envToken(): string {
  return (process.env.GBO_API_TOKEN ?? "").trim();
}

function envBaseUrl(): string {
  return (process.env.GBO_BASE_URL ?? GBO_UPSTREAM_BASE_URL).replace(/\/$/, "");
}

function envSandbox(): boolean {
  const v = (process.env.GBO_SANDBOX ?? "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

function envAuthScheme(): string {
  return (process.env.GBO_AUTH_SCHEME ?? "bearer").trim().toLowerCase();
}

export function gboTokenConfigured(): boolean {
  return Boolean(envToken());
}

function authHeaders(token: string, scheme: string): Record<string, string> {
  if (scheme === "basic") {
    return { Authorization: `Basic ${token}` };
  }
  if (scheme === "basic-b64") {
    return { Authorization: `Basic ${Buffer.from(`${token}:`).toString("base64")}` };
  }
  if (scheme === "header" || scheme === "token") {
    return { token };
  }
  return { Authorization: `Bearer ${token}` };
}

function sandboxPrefix(sandbox: boolean): string {
  return sandbox ? "/sandbox" : "";
}

type GboEnvelope = {
  data?: unknown;
  error?: unknown;
  message?: unknown;
  errors?: unknown;
};

async function gboFetch(
  pathWithQuery: string,
  opts?: { method?: "GET" | "POST"; body?: unknown; sandbox?: boolean; config?: GboClientConfig }
): Promise<unknown> {
  const token = opts?.config?.token?.trim() || envToken();
  if (!token) {
    throw new GboClientError(
      "GBO_API_TOKEN is not configured. Ask Gift Baskets Overseas support for the partner API token (not the portal password).",
      503
    );
  }
  const base = opts?.config?.baseUrl?.replace(/\/$/, "") || envBaseUrl();
  const sandbox = opts?.sandbox ?? opts?.config?.sandbox ?? envSandbox();
  const scheme = opts?.config?.authScheme || envAuthScheme();
  const prefix = sandboxPrefix(sandbox);
  const url = `${base}${prefix}${pathWithQuery}`;
  const method = opts?.method ?? "POST";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...authHeaders(token, scheme),
      },
      body: method === "POST" ? JSON.stringify(opts?.body ?? {}) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new GboClientError("Gift Baskets Overseas API timed out", 504);
    }
    throw new GboClientError(
      err instanceof Error ? err.message : "Gift Baskets Overseas API request failed",
      502
    );
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  let json: GboEnvelope | unknown = null;
  if (text) {
    try {
      json = JSON.parse(text) as GboEnvelope;
    } catch {
      json = { message: text };
    }
  }

  const envelope = (json && typeof json === "object" ? json : {}) as GboEnvelope;
  const errMsg = stringifyGboError(envelope);
  if (!res.ok) {
    throw new GboClientError(errMsg || `GBO HTTP ${res.status}`, res.status >= 400 && res.status < 500 ? res.status : 502, envelope);
  }
  if (errMsg && envelope.data == null) {
    throw new GboClientError(errMsg, 502, envelope);
  }
  return envelope.data !== undefined ? envelope.data : json;
}

function stringifyGboError(envelope: GboEnvelope): string {
  if (typeof envelope.error === "string" && envelope.error.trim()) return envelope.error.trim();
  if (typeof envelope.message === "string" && envelope.message.trim()) return envelope.message.trim();
  if (Array.isArray(envelope.errors) && envelope.errors.length) {
    return envelope.errors.map((e) => (typeof e === "string" ? e : JSON.stringify(e))).join("; ");
  }
  return "";
}

function asArray(data: unknown): unknown[] {
  return Array.isArray(data) ? data : [];
}

export async function gboListCountries(config?: GboClientConfig): Promise<GboCountry[]> {
  const data = await gboFetch("/countries/get", { sandbox: config?.sandbox, config });
  return asArray(data)
    .map((row) => gboCountrySchema.safeParse(row))
    .filter((r) => r.success)
    .map((r) => r.data);
}

export async function gboListCategories(
  country: string,
  config?: GboClientConfig
): Promise<GboCategory[]> {
  const iso = country.trim().toUpperCase();
  const data = await gboFetch(`/categories/get?country_iso_alpha2=${encodeURIComponent(iso)}`, {
    sandbox: config?.sandbox,
    config,
  });
  return asArray(data)
    .map((row) => gboCategorySchema.safeParse(row))
    .filter((r) => r.success)
    .map((r) => r.data);
}

export async function gboListGifts(
  input: { country: string; priceMin?: number; priceMax?: number; category?: string },
  config?: GboClientConfig
): Promise<GboGift[]> {
  const iso = input.country.trim().toUpperCase();
  const q = new URLSearchParams({ country_iso_alpha2: iso });
  if (input.priceMin != null) q.set("price_min", String(input.priceMin));
  if (input.priceMax != null) q.set("price_max", String(input.priceMax));
  if (input.category) q.set("category", input.category);
  const data = await gboFetch(`/gifts/get?${q.toString()}`, { sandbox: config?.sandbox, config });
  return asArray(data)
    .map((row) => gboGiftSchema.safeParse(row))
    .filter((r) => r.success)
    .map((r) => r.data);
}

export async function gboGetGift(
  country: string,
  productId: number,
  config?: GboClientConfig
): Promise<GboGift> {
  const iso = country.trim().toUpperCase();
  const q = new URLSearchParams({
    country_iso_alpha2: iso,
    product_id: String(productId),
  });
  const data = await gboFetch(`/gift/get?${q.toString()}`, { sandbox: config?.sandbox, config });
  const parsed = gboGiftSchema.safeParse(data);
  if (!parsed.success) {
    throw new GboClientError("Unexpected gift payload from Gift Baskets Overseas", 502, data);
  }
  return parsed.data;
}

export async function gboCreateOrder(
  input: GboCreateOrderInput,
  config?: GboClientConfig
): Promise<{ invoice?: string; order_id?: string | number; raw: unknown }> {
  const parsed = gboCreateOrderSchema.safeParse(input);
  if (!parsed.success) {
    throw new GboClientError(parsed.error.issues[0]?.message ?? "Invalid GBO order payload", 400);
  }
  const { sandbox, ...body } = parsed.data;
  const data = await gboFetch("/order/create", {
    method: "POST",
    body,
    sandbox: sandbox ?? config?.sandbox,
    config,
  });
  const out = gboCreateOrderResponseSchema.safeParse(data);
  return {
    invoice: out.success && out.data.invoice != null ? String(out.data.invoice) : undefined,
    order_id: out.success ? out.data.order_id : undefined,
    raw: data,
  };
}

export async function gboGetOrder(
  orderId: string | number,
  config?: GboClientConfig
): Promise<GboOrderDetails> {
  const q = new URLSearchParams({ order_id: String(orderId) });
  const data = await gboFetch(`/order/get?${q.toString()}`, { sandbox: config?.sandbox, config });
  const parsed = gboOrderDetailsSchema.safeParse(data);
  if (!parsed.success) {
    throw new GboClientError("Unexpected order payload from Gift Baskets Overseas", 502, data);
  }
  return parsed.data;
}

export async function gboHealth(): Promise<{
  ok: boolean;
  configured: boolean;
  sandbox: boolean;
  upstream: string;
  countries?: number;
  error?: string;
}> {
  const configured = gboTokenConfigured();
  const sandbox = envSandbox();
  const upstream = envBaseUrl();
  if (!configured) {
    return { ok: false, configured: false, sandbox, upstream, error: "GBO_API_TOKEN is not set" };
  }
  try {
    const countries = await gboListCountries();
    return { ok: true, configured: true, sandbox, upstream, countries: countries.length };
  } catch (err) {
    return {
      ok: false,
      configured: true,
      sandbox,
      upstream,
      error: err instanceof Error ? err.message : "GBO health check failed",
    };
  }
}
