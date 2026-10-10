import { lookup } from "node:dns/promises";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { isIP } from "node:net";
import type { ProductImportImageResult } from "@blossompot/shared";
import { isPublicIpAddress } from "./public-address";

export const IMAGE_PROBE_MAX_REDIRECTS = 3;
export const IMAGE_PROBE_TIMEOUT_MS = 5000;
export const IMAGE_PROBE_MAX_BYTES = 8192;

export type PinnedAddress = { address: string; family: 4 | 6 };

export type ImageProbeExchange = {
  status: number;
  headers: Record<string, string | undefined>;
  truncated?: boolean;
};

export type ImageProbeDeps = {
  resolve: (hostname: string) => Promise<PinnedAddress[]>;
  request: (input: {
    url: URL;
    method: "HEAD" | "GET";
    pin: PinnedAddress;
    timeoutMs: number;
    maxBytes: number;
  }) => Promise<ImageProbeExchange>;
};

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

export function pinnedLookup(hostname: string, pin: PinnedAddress) {
  return (asked: string, options: unknown, callback?: (err: Error | null, address: string, family: number) => void) => {
    const done = typeof options === "function" ? options : callback;
    if (!done) return;
    if (asked !== hostname && asked !== pin.address) {
      done(new Error(`Refusing unresolved host ${asked}; validated ${pin.address}`), "", 0);
      return;
    }
    done(null, pin.address, pin.family);
  };
}

export async function resolvePublicAddresses(hostname: string): Promise<PinnedAddress[]> {
  const literal = isIP(hostname);
  if (literal === 4 || literal === 6) {
    if (!isPublicIpAddress(hostname)) throw new Error(`Image host ${hostname} is not a public address.`);
    return [{ address: hostname, family: literal }];
  }
  const records = await lookup(hostname, { all: true, verbatim: true });
  if (records.length === 0) throw new Error(`Image host ${hostname} did not resolve.`);
  const pins = records.map((record) => ({
    address: record.address,
    family: record.family === 6 ? 6 : 4,
  })) as PinnedAddress[];
  if (pins.some((pin) => !isPublicIpAddress(pin.address))) {
    throw new Error(`Image host ${hostname} resolves to a non-public address.`);
  }
  return pins;
}

function contentTypeVerdict(header: string | undefined): "absent" | "image" | "other" {
  const media = header?.split(";")[0]?.trim().toLowerCase() ?? "";
  if (!media) return "absent";
  return media.startsWith("image/") ? "image" : "other";
}

async function exchange(
  deps: ImageProbeDeps,
  current: URL,
  method: "HEAD" | "GET",
  timeoutMs: number
): Promise<ImageProbeExchange & { pin: PinnedAddress }> {
  const pins = await deps.resolve(current.hostname);
  const pin = pins[0];
  if (!pin) throw new Error("Image host did not resolve.");
  const response = await deps.request({ url: current, method, pin, timeoutMs, maxBytes: IMAGE_PROBE_MAX_BYTES });
  return { ...response, pin };
}

function httpUrlError(url: URL): string | null {
  if (url.protocol !== "http:" && url.protocol !== "https:") return "Image URL must use http or https.";
  if (url.username || url.password) return "Image URL must not include credentials.";
  return null;
}

function withDeadline<T>(work: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const cancel = armProbeDeadline(timeoutMs, () => reject(new Error("Image request timed out.")));
    work.then(
      (value) => {
        cancel();
        resolve(value);
      },
      (err) => {
        cancel();
        reject(err);
      }
    );
  });
}

/**
 * Image accessibility probe.
 * Global fetch follows redirects and resolves DNS again at connect time, so it is not used.
 * The initial URL and every redirect must be http(s) with no credentials before that hop is resolved.
 * Each hop is rejected unless every address is public, then requested with Node's http(s) client
 * aimed at that validated address. TLS still checks the certificate for the original hostname.
 * The connection target is the validated address; this does not claim protection beyond that pin.
 * One deadline covers DNS, redirects, and a response that keeps trickling data.
 */
export async function probeSafeImageUrl(
  url: string,
  deps: ImageProbeDeps = defaultDeps,
  options: { timeoutMs?: number } = {}
): Promise<ProductImportImageResult> {
  let current: URL;
  try {
    current = new URL(url);
  } catch {
    return { ok: false, detail: "Image URL is not a valid URL." };
  }
  const initialError = httpUrlError(current);
  if (initialError) return { ok: false, detail: initialError };

  const budget = options.timeoutMs ?? IMAGE_PROBE_TIMEOUT_MS;
  const seen = new Set<string>();
  const started = Date.now();
  let method: "HEAD" | "GET" = "HEAD";
  for (let redirect = 0; redirect <= IMAGE_PROBE_MAX_REDIRECTS; redirect += 1) {
    const hopError = httpUrlError(current);
    if (hopError) return { ok: false, detail: hopError };
    const key = `${method} ${current.href}`;
    if (seen.has(key)) return { ok: false, detail: "Image URL redirected in a loop." };
    seen.add(key);
    const timeoutMs = budget - (Date.now() - started);
    if (timeoutMs <= 0) return { ok: false, detail: "Image request timed out." };
    let response: ImageProbeExchange;
    try {
      response = await withDeadline(exchange(deps, current, method, timeoutMs), timeoutMs);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Image request failed";
      if (/timeout|aborted/i.test(message)) return { ok: false, detail: "Image request timed out." };
      return { ok: false, detail: message };
    }
    if (response.truncated) return { ok: false, detail: "Image response exceeded the byte limit." };
    if (REDIRECT_STATUSES.has(response.status)) {
      const location = response.headers.location;
      if (!location) return { ok: false, detail: `HTTP ${response.status} redirect is missing a location.` };
      if (redirect === IMAGE_PROBE_MAX_REDIRECTS) return { ok: false, detail: "Image URL exceeded the redirect limit." };
      let next: URL;
      try {
        next = new URL(location, current);
      } catch {
        return { ok: false, detail: "Image redirect URL is not valid." };
      }
      const redirectError = httpUrlError(next);
      if (redirectError) return { ok: false, detail: redirectError };
      current = next;
      if (response.status === 303) method = "GET";
      continue;
    }
    if ((response.status === 405 || response.status === 501) && method === "HEAD") {
      method = "GET";
      seen.delete(key);
      redirect -= 1;
      continue;
    }
    if (response.status < 200 || response.status > 299) return { ok: false, detail: `HTTP ${response.status}` };
    const type = contentTypeVerdict(response.headers["content-type"]);
    if (type === "other") return { ok: false, detail: "Image response content type is not an image." };
    return { ok: true, detail: `HTTP ${response.status}` };
  }
  return { ok: false, detail: "Image URL exceeded the redirect limit." };
}

const defaultDeps: ImageProbeDeps = {
  resolve: resolvePublicAddresses,
  request: nodePinnedRequest,
};

/** Absolute deadline. Later bytes do not move it. */
export function armProbeDeadline(timeoutMs: number, onDeadline: () => void): () => void {
  const timer = setTimeout(onDeadline, Math.max(0, timeoutMs));
  return () => clearTimeout(timer);
}

/**
 * Connection options for one validated hop.
 * `hostname` is the public address that was checked. `lookup` returns only that address.
 * `servername` stays the URL hostname so TLS hostname verification still applies.
 * `rejectUnauthorized` stays on.
 */
export function pinnedRequestOptions(input: {
  url: URL;
  method: "HEAD" | "GET";
  pin: PinnedAddress;
  timeoutMs: number;
}) {
  return {
    protocol: input.url.protocol,
    hostname: input.pin.address,
    port: input.url.port || (input.url.protocol === "https:" ? 443 : 80),
    path: `${input.url.pathname}${input.url.search}`,
    method: input.method,
    servername: input.url.hostname,
    headers: { Host: input.url.host, Accept: "image/*" },
    lookup: pinnedLookup(input.url.hostname, input.pin),
    timeout: input.timeoutMs,
    rejectUnauthorized: true as const,
  };
}

function nodePinnedRequest(input: {
  url: URL;
  method: "HEAD" | "GET";
  pin: PinnedAddress;
  timeoutMs: number;
  maxBytes: number;
}): Promise<ImageProbeExchange> {
  const transport = input.url.protocol === "https:" ? httpsRequest : httpRequest;
  return new Promise((resolve, reject) => {
    let settled = false;
    let response: { destroy: () => void } | undefined;
    let cancelDeadline: (() => void) | undefined;
    const finish = (value: ImageProbeExchange) => {
      if (settled) return;
      settled = true;
      cancelDeadline?.();
      resolve(value);
    };
    const fail = (err: Error) => {
      if (settled) return;
      settled = true;
      cancelDeadline?.();
      req.destroy();
      response?.destroy();
      reject(err);
    };
    const req = transport(pinnedRequestOptions(input), (res) => {
      response = res;
      const headers: Record<string, string | undefined> = {};
      for (const [name, value] of Object.entries(res.headers)) {
        headers[name.toLowerCase()] = Array.isArray(value) ? value.join(", ") : value;
      }
      const length = Number(headers["content-length"] ?? 0);
      if (input.method === "GET" && Number.isFinite(length) && length > input.maxBytes) {
        res.destroy();
        req.destroy();
        finish({ status: res.statusCode ?? 0, headers, truncated: true });
        return;
      }
      if (input.method === "HEAD") {
        res.destroy();
        req.destroy();
        finish({ status: res.statusCode ?? 0, headers });
        return;
      }
      let bytes = 0;
      let truncated = false;
      res.on("data", (chunk: Buffer) => {
        bytes += chunk.length;
        if (bytes > input.maxBytes) {
          truncated = true;
          res.destroy();
          req.destroy();
        }
      });
      res.on("end", () => finish({ status: res.statusCode ?? 0, headers, truncated }));
      res.on("error", () => finish({ status: res.statusCode ?? 0, headers, truncated: true }));
      res.on("close", () => {
        if (truncated) finish({ status: res.statusCode ?? 0, headers, truncated: true });
      });
    });
    req.on("timeout", () => fail(new Error("Image request timed out.")));
    req.on("error", (err) => fail(err instanceof Error ? err : new Error("Image request failed")));
    req.end();
    cancelDeadline = armProbeDeadline(input.timeoutMs, () => fail(new Error("Image request timed out.")));
  });
}
