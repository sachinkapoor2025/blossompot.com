import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isPublicIpAddress } from "./public-address";
import {
  armProbeDeadline,
  pinnedLookup,
  pinnedRequestOptions,
  probeSafeImageUrl,
  resolvePublicAddresses,
  type ImageProbeDeps,
  type ImageProbeExchange,
  type PinnedAddress,
} from "./safe-image-probe";

function deps(script: (url: URL, method: "HEAD" | "GET") => ImageProbeExchange | Promise<ImageProbeExchange>): ImageProbeDeps & { requests: string[] } {
  const requests: string[] = [];
  return {
    requests,
    async resolve(hostname: string): Promise<PinnedAddress[]> {
      if (hostname === "example.com" || hostname.endsWith(".example.com")) {
        return [{ address: "8.8.8.8", family: 4 }];
      }
      if (!isPublicIpAddress(hostname)) throw new Error(`Image host ${hostname} is not a public address.`);
      return [{ address: hostname, family: hostname.includes(":") ? 6 : 4 }];
    },
    async request(input) {
      requests.push(`${input.method} ${input.url.href} pin=${input.pin.address}`);
      return script(input.url, input.method);
    },
  };
}

describe("public image addresses", () => {
  it("rejects loopback, private, link-local, and mapped forms", () => {
    assert.equal(isPublicIpAddress("127.0.0.1"), false);
    assert.equal(isPublicIpAddress("10.1.2.3"), false);
    assert.equal(isPublicIpAddress("192.168.1.9"), false);
    assert.equal(isPublicIpAddress("172.16.0.4"), false);
    assert.equal(isPublicIpAddress("169.254.169.254"), false);
    assert.equal(isPublicIpAddress("0.0.0.0"), false);
    assert.equal(isPublicIpAddress("224.0.0.1"), false);
    assert.equal(isPublicIpAddress("::1"), false);
    assert.equal(isPublicIpAddress("::"), false);
    assert.equal(isPublicIpAddress("fe80::1"), false);
    assert.equal(isPublicIpAddress("fd00::1"), false);
    assert.equal(isPublicIpAddress("::ffff:127.0.0.1"), false);
    assert.equal(isPublicIpAddress("::ffff:169.254.169.254"), false);
    assert.equal(isPublicIpAddress("::7f00:1"), false);
    assert.equal(isPublicIpAddress("::127.0.0.1"), false);
    assert.equal(isPublicIpAddress("::ffff:0:7f00:1"), false);
    assert.equal(isPublicIpAddress("::ffff:0:127.0.0.1"), false);
    assert.equal(isPublicIpAddress("64:ff9b::7f00:1"), false);
    assert.equal(isPublicIpAddress("64:ff9b::127.0.0.1"), false);
    assert.equal(isPublicIpAddress("2002:7f00:1::"), false);
    assert.equal(isPublicIpAddress("::8.8.8.8"), true);
    assert.equal(isPublicIpAddress("::ffff:8.8.8.8"), true);
    assert.equal(isPublicIpAddress("64:ff9b::8.8.8.8"), true);
    assert.equal(isPublicIpAddress("8.8.8.8"), true);
  });
});

describe("safe image probe", () => {
  it("does not request localhost, private IPv4, IPv6 loopback, or the metadata address", async () => {
    for (const url of ["http://127.0.0.1/x", "http://10.0.0.8/x", "http://[::1]/x", "http://169.254.169.254/latest/meta-data"]) {
      const client = deps(() => ({ status: 200, headers: { "content-type": "image/jpeg" } }));
      const result = await probeSafeImageUrl(url, client);
      assert.equal(result.ok, false, url);
      assert.equal(client.requests.length, 0, url);
    }
  });

  it("stops a redirect to a private address before connecting", async () => {
    const client = deps(() => ({ status: 302, headers: { location: "http://127.0.0.1/secret" } }));
    const result = await probeSafeImageUrl("https://cdn.example.com/rose.jpg", client);
    assert.equal(result.ok, false);
    assert.equal(client.requests.length, 1);
    assert.match(client.requests[0] ?? "", /pin=8\.8\.8\.8/);
  });

  it("rejects a redirect loop", async () => {
    const client = deps((url) => ({ status: 302, headers: { location: url.href } }));
    const result = await probeSafeImageUrl("https://cdn.example.com/rose.jpg", client);
    assert.equal(result.ok, false);
    assert.match(result.detail, /loop/);
  });

  it("rejects an oversized GET, a timeout, and a 404", async () => {
    const oversized = deps((_url, method) => method === "HEAD"
      ? { status: 405, headers: {} }
      : { status: 200, headers: { "content-type": "image/jpeg" }, truncated: true });
    const oversizedResult = await probeSafeImageUrl("https://cdn.example.com/big.jpg", oversized);
    assert.equal(oversizedResult.ok, false);
    assert.match(oversizedResult.detail, /byte limit/);

    const timeout = deps(() => {
      throw new Error("Image request timed out.");
    });
    assert.match((await probeSafeImageUrl("https://cdn.example.com/slow.jpg", timeout)).detail, /timed out/);

    const missing = deps(() => ({ status: 404, headers: {} }));
    assert.equal((await probeSafeImageUrl("https://cdn.example.com/missing.jpg", missing)).detail, "HTTP 404");
  });

  it("accepts a public image and retries HEAD 405 or 501 with GET", async () => {
    const ok = deps(() => ({ status: 200, headers: { "content-type": "image/jpeg" } }));
    assert.equal((await probeSafeImageUrl("https://cdn.example.com/rose.jpg", ok)).ok, true);

    for (const status of [405, 501]) {
      const client = deps((_url, method) => method === "HEAD"
        ? { status, headers: {} }
        : { status: 200, headers: { "content-type": "image/png" } });
      const result = await probeSafeImageUrl("https://images.example.com/rose.png", client);
      assert.equal(result.ok, true, String(status));
      assert.equal(client.requests.length, 2);
    }
  });

  it("does not connect to an IPv4-compatible IPv6 loopback", async () => {
    for (const url of ["http://[::7f00:1]/secret", "http://[::127.0.0.1]/secret", "http://[::ffff:0:7f00:1]/secret"]) {
      const requests: string[] = [];
      const result = await probeSafeImageUrl(url, {
        resolve: resolvePublicAddresses,
        async request(input) {
          requests.push(input.pin.address);
          return { status: 200, headers: { "content-type": "image/jpeg" } };
        },
      });
      assert.equal(result.ok, false, url);
      assert.equal(requests.length, 0, url);
    }
  });

  it("rejects a non-http redirect, credentials, and a malformed redirect before the next connection", async () => {
    const fileRedirect = deps(() => ({ status: 302, headers: { location: "file:///etc/passwd" } }));
    const fileResult = await probeSafeImageUrl("https://cdn.example.com/rose.jpg", fileRedirect);
    assert.equal(fileResult.ok, false);
    assert.match(fileResult.detail, /http or https/);
    assert.equal(fileRedirect.requests.length, 1);

    const credentials = deps(() => ({ status: 200, headers: { "content-type": "image/jpeg" } }));
    const credentialResult = await probeSafeImageUrl("https://user:pass@cdn.example.com/rose.jpg", credentials);
    assert.match(credentialResult.detail, /credentials/);
    assert.equal(credentials.requests.length, 0);

    const redirectCredentials = deps(() => ({ status: 302, headers: { location: "https://user:pass@cdn.example.com/next.jpg" } }));
    const redirectCredentialResult = await probeSafeImageUrl("https://cdn.example.com/rose.jpg", redirectCredentials);
    assert.match(redirectCredentialResult.detail, /credentials/);
    assert.equal(redirectCredentials.requests.length, 1);

    const malformed = deps(() => ({ status: 302, headers: { location: "http://[" } }));
    const malformedResult = await probeSafeImageUrl("https://cdn.example.com/rose.jpg", malformed);
    assert.equal(malformedResult.ok, false);
    assert.match(malformedResult.detail, /not valid|http or https/);
    assert.equal(malformed.requests.length, 1);
  });

  it("stops after the redirect limit", async () => {
    let hop = 0;
    const client = deps(() => {
      hop += 1;
      return { status: 302, headers: { location: `https://hop${hop}.example.com/rose.jpg` } };
    });
    const result = await probeSafeImageUrl("https://cdn.example.com/rose.jpg", client);
    assert.equal(result.ok, false);
    assert.match(result.detail, /redirect limit/);
    assert.equal(client.requests.length, 4);
  });

  it("rejects a non-image content type and accepts a missing content type", async () => {
    const html = deps(() => ({ status: 200, headers: { "content-type": "text/html" } }));
    const htmlResult = await probeSafeImageUrl("https://cdn.example.com/rose.jpg", html);
    assert.equal(htmlResult.ok, false);
    assert.match(htmlResult.detail, /content type/);

    const absent = deps(() => ({ status: 200, headers: {} }));
    assert.equal((await probeSafeImageUrl("https://cdn.example.com/rose.jpg", absent)).ok, true);
  });

  it("returns when the probe deadline expires during a response that never finishes", async () => {
    const client = deps(() => new Promise(() => undefined));
    const started = Date.now();
    const result = await probeSafeImageUrl("https://cdn.example.com/slow.jpg", client, { timeoutMs: 40 });
    assert.match(result.detail, /timed out/);
    assert.ok(Date.now() - started < 1000);
  });

  it("does not extend the hard deadline when later activity is reported", async () => {
    let fired = 0;
    const cancel = armProbeDeadline(30, () => {
      fired += 1;
    });
    await new Promise((resolve) => setTimeout(resolve, 10));
    await new Promise((resolve) => setTimeout(resolve, 40));
    cancel();
    assert.equal(fired, 1);
  });

  it("pins the connection to the validated address and keeps TLS verification", () => {
    const options = pinnedRequestOptions({
      url: new URL("https://cdn.example.com/rose.jpg"),
      method: "HEAD",
      pin: { address: "8.8.8.8", family: 4 },
      timeoutMs: 1000,
    });
    assert.equal(options.hostname, "8.8.8.8");
    assert.equal(options.servername, "cdn.example.com");
    assert.equal(options.rejectUnauthorized, true);
    const seen: string[] = [];
    options.lookup("cdn.example.com", {}, (err, address) => {
      assert.equal(err, null);
      seen.push(address);
    });
    options.lookup("169.254.169.254", {}, (err) => {
      assert.ok(err);
    });
    assert.deepEqual(seen, ["8.8.8.8"]);
  });

  it("pins the validated address", () => {
    const seen: string[] = [];
    const lookup = pinnedLookup("cdn.example.com", { address: "8.8.8.8", family: 4 });
    lookup("cdn.example.com", {}, (err, address) => {
      assert.equal(err, null);
      seen.push(address);
    });
    lookup("169.254.169.254", {}, (err) => {
      assert.ok(err);
    });
    assert.deepEqual(seen, ["8.8.8.8"]);
  });
});
